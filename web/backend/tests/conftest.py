"""
Crea un histórico Parquet mínimo con casos conocidos y apunta el backend a él
antes de importar la app (la configuración se lee al importar).
"""

import os
import sys
import tempfile
from pathlib import Path

import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

_TMP = Path(tempfile.mkdtemp(prefix="aena_test_"))
os.environ["AENA_HISTORICO_DIR"] = str(_TMP / "historico")
os.environ["AENA_ESTADO_ACTUAL_DIR"] = str(_TMP / "estado_actual")
os.environ["AENA_AEROPUERTOS_MUNDO_CSV"] = str(_TMP / "aeropuertos_mundo.csv")
os.environ["AENA_TTL_SEGUNDOS"] = "3600"


def _evento(aeropuerto, num, compania, destino, programada, estimada, estado, detectado):
    return {
        "clave_vuelo": f"{aeropuerto}_{num}_{programada}_{destino}",
        "aeropuerto": aeropuerto,
        "num_vuelo": num,
        "iata_compania": compania,
        "aerolinea": {"IB": "Iberia", "AA": "American Airlines", "VY": "Vueling"}[compania],
        "destino_iata": destino,
        "destino_ciudad": destino,
        "salida_programada": pd.Timestamp(programada),
        "salida_estimada": pd.Timestamp(estimada),
        "estado": estado,
        "estado_desc": estado,
        "terminal": "T1",
        "puerta": "A1",
        "mostrador": "1-2",
        "tipo_aeronave": "A320",
        "detectado_en": pd.Timestamp(detectado),
    }


EVENTOS = {
    ("MAD", "2026-01-01"): [
        # Primer día (incompleto): no entra en el rango por defecto
        _evento("MAD", "1", "IB", "BCN", "2026-01-01 10:00", "2026-01-01 10:00", "BOR", "2026-01-01 09:00"),
    ],
    ("MAD", "2026-01-02"): [
        # Código compartido IB/AA: 2 vuelos, 1 salida física. Retraso final 30 min.
        _evento("MAD", "2", "IB", "LHR", "2026-01-02 08:00", "2026-01-02 08:00", "SCH", "2026-01-02 06:00"),
        _evento("MAD", "2", "IB", "LHR", "2026-01-02 08:00", "2026-01-02 08:30", "BOR", "2026-01-02 07:30"),
        _evento("MAD", "9", "AA", "LHR", "2026-01-02 08:00", "2026-01-02 08:30", "BOR", "2026-01-02 07:30"),
        # Cancelado
        _evento("MAD", "3", "VY", "BCN", "2026-01-02 09:00", "2026-01-02 09:00", "CAN", "2026-01-02 07:00"),
        # Retraso absurdo (2000 min): se descarta del retraso medio
        _evento("MAD", "4", "VY", "PMI", "2026-01-02 12:00", "2026-01-03 21:20", "RET", "2026-01-02 11:00"),
    ],
    ("BCN", "2026-01-02"): [
        _evento("BCN", "5", "VY", "MAD", "2026-01-02 10:00", "2026-01-02 10:00", "BOR", "2026-01-02 09:30"),
    ],
    ("BCN", "2026-01-03"): [
        # Último día (hoy, en curso): no entra en el rango por defecto
        _evento("BCN", "6", "VY", "MAD", "2026-01-03 10:00", "2026-01-03 10:00", "SCH", "2026-01-03 08:00"),
    ],
}

for (aeropuerto, fecha), filas in EVENTOS.items():
    destino = _TMP / "historico" / f"aeropuerto={aeropuerto}" / f"fecha={fecha}"
    destino.mkdir(parents=True)
    tabla = pa.Table.from_pandas(pd.DataFrame(filas), preserve_index=False)
    if aeropuerto == "BCN":
        # Igual que en el histórico real: algunos archivos tienen "puerta" como string
        tabla = tabla.set_column(tabla.schema.get_field_index("puerta"), "puerta", tabla["puerta"].cast(pa.string()))
    else:
        tabla = tabla.set_column(tabla.schema.get_field_index("puerta"), "puerta", tabla["puerta"].cast(pa.large_string()))
    pq.write_table(tabla, destino / "datos.parquet")


# Foto del panel de MAD. La última detección en MAD es el 02/01 a las 11:00, así
# que el panel muestra lo que sale a partir de las 10:30 (margen de 30 min):
# - el código compartido IB 2 / AA 9 (programado 08:00, estimado 10:40) -> 1 fila
# - el PMI de las 12:00
# - el vuelo 1 del 01/01 ya salió: no aparece
_foto = pd.DataFrame(
    [
        _evento("MAD", "1", "IB", "BCN", "2026-01-01 10:00", "2026-01-01 10:00", "BOR", "2026-01-02 11:00"),
        _evento("MAD", "2", "IB", "LHR", "2026-01-02 08:00", "2026-01-02 10:40", "BOR", "2026-01-02 11:00"),
        _evento("MAD", "9", "AA", "LHR", "2026-01-02 08:00", "2026-01-02 10:40", "BOR", "2026-01-02 11:00"),
        _evento("MAD", "4", "VY", "PMI", "2026-01-02 12:00", "2026-01-02 12:00", "SCH", "2026-01-02 11:00"),
    ]
).drop(columns=["detectado_en"])
_foto.loc[_foto["num_vuelo"] == "4", "mostrador"] = "null-null"
(_TMP / "estado_actual").mkdir()
_foto.to_pickle(_TMP / "estado_actual" / "MAD.pkl")

# Coordenadas de destinos: PMI falta a propósito (destino sin coordenadas)
(_TMP / "aeropuertos_mundo.csv").write_text(
    "iata,nombre,ciudad,pais,continente,lat,lon\n"
    "BCN,Barcelona Airport,Barcelona,ES,EU,41.2971,2.0785\n"
    "LHR,London Heathrow Airport,London,GB,EU,51.4707,-0.4599\n"
    "MAD,Madrid Barajas Airport,Madrid,ES,EU,40.4719,-3.5626\n",
    encoding="utf-8",
)


@pytest.fixture(scope="session")
def cliente():
    from fastapi.testclient import TestClient

    from app.main import app

    return TestClient(app)
