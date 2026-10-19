from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, HTTPException, Query

from app import config
from app.catalogo import AEROPUERTOS
from app.datos import consultar
from app.esquemas import HistorialVuelo, PanelDirecto

router = APIRouter(tags=["directo"])

CAMPOS_VIGILADOS = ["estado", "puerta", "salida_estimada", "mostrador", "terminal", "tipo_aeronave"]


@router.get("/directo/{iata}", response_model=PanelDirecto, summary="Panel de salidas según la última foto del pipeline")
def panel(iata: str, limite: Annotated[int, Query(ge=1, le=500)] = 80):
    """
    Lo que mostraba el panel de AENA en la última extracción (data/estado_actual),
    agrupando los códigos compartidos en una sola fila. Incluye los vuelos cuya
    hora (estimada o programada) no ha pasado hace más de MARGEN_PANEL_MIN.
    """
    iata = iata.upper()
    if iata not in AEROPUERTOS:
        raise HTTPException(404, f"Aeropuerto desconocido: {iata}")

    actualizado = consultar("SELECT max(detectado_en) AS t FROM eventos WHERE aeropuerto = ?", [iata])[0]["t"]
    if actualizado is None:
        return {"aeropuerto": iata, "actualizado": None, "total": 0, "vuelos": []}

    vuelos = consultar(
        f"""
        WITH base AS (
            SELECT * FROM directo
            WHERE aeropuerto = ?
              AND coalesce(salida_estimada, salida_programada) >= CAST(? AS TIMESTAMP) - INTERVAL {config.MARGEN_PANEL_MIN} MINUTE
        ),
        agrupado AS (
            SELECT salida_programada, destino_iata,
                   min(clave_vuelo) AS clave_vuelo,
                   list({{
                       'clave_vuelo': clave_vuelo, 'num_vuelo': num_vuelo,
                       'iata_compania': limpio(iata_compania), 'aerolinea': limpio(aerolinea)
                   }} ORDER BY clave_vuelo) AS codigos,
                   any_value(destino_ciudad) AS destino_ciudad,
                   max(salida_estimada) AS salida_estimada,
                   any_value(limpio(estado)) AS estado,
                   any_value(limpio(terminal)) AS terminal,
                   any_value(limpio(puerta)) AS puerta,
                   any_value(limpio(mostrador)) AS mostrador,
                   any_value(limpio(tipo_aeronave)) AS tipo_aeronave
            FROM base
            GROUP BY salida_programada, destino_iata
        )
        SELECT a.*,
               coalesce(e.nombre, 'Sin estado') AS estado_nombre,
               date_diff('minute', a.salida_programada, a.salida_estimada) AS retraso_min,
               coalesce(v.n_eventos, 0) AS n_cambios,
               count(*) OVER () AS total
        FROM agrupado a
        LEFT JOIN estados e ON e.codigo = a.estado
        LEFT JOIN vuelos v ON v.clave_vuelo = a.clave_vuelo
        ORDER BY a.salida_programada, a.destino_iata
        LIMIT ?
        """,
        [iata, actualizado, limite],
    )
    total = vuelos[0]["total"] if vuelos else 0
    return {"aeropuerto": iata, "actualizado": actualizado, "total": total, "vuelos": vuelos}


def _texto(valor) -> str | None:
    if valor is None:
        return None
    return valor.isoformat() if isinstance(valor, datetime) else str(valor)


@router.get("/vuelos/historial", response_model=HistorialVuelo, summary="Todos los cambios detectados de un vuelo")
def historial(clave: Annotated[str, Query(description="clave_vuelo, p. ej. MAD_3166_17/10/2026_20:00:00_LHR")]):
    eventos = consultar(
        """
        SELECT ev.aeropuerto, ev.destino_iata, ev.destino_ciudad, ev.salida_programada, ev.detectado_en,
               limpio(ev.estado) AS estado, coalesce(e.nombre, 'Sin estado') AS estado_nombre,
               limpio(ev.puerta) AS puerta, ev.salida_estimada,
               date_diff('minute', ev.salida_programada, ev.salida_estimada) AS retraso_min,
               limpio(ev.mostrador) AS mostrador, limpio(ev.terminal) AS terminal,
               limpio(ev.tipo_aeronave) AS tipo_aeronave
        FROM eventos ev LEFT JOIN estados e ON e.codigo = limpio(ev.estado)
        WHERE ev.clave_vuelo = ?
        ORDER BY ev.detectado_en
        """,
        [clave],
    )
    if not eventos:
        raise HTTPException(404, "No hay ningún vuelo con esa clave en el histórico.")

    # Diferencias entre eventos consecutivos, con los valores ya normalizados.
    # Si tras normalizar no cambia nada (p. ej. '' -> 'null'), el evento se omite.
    con_cambios = []
    anterior = None
    for ev in eventos:
        cambios = []
        if anterior is not None:
            # El estado se compara por código pero se devuelve con su nombre legible
            legible = {"estado": "estado_nombre"}
            cambios = [
                {"campo": c, "antes": _texto(anterior[legible.get(c, c)]), "despues": _texto(ev[legible.get(c, c)])}
                for c in CAMPOS_VIGILADOS
                if anterior[c] != ev[c]
            ]
        if anterior is None or cambios:
            con_cambios.append({**ev, "cambios": cambios})
        anterior = ev

    primero = eventos[0]
    codigos = consultar(
        """
        SELECT DISTINCT clave_vuelo, num_vuelo, limpio(iata_compania) AS iata_compania, limpio(aerolinea) AS aerolinea
        FROM vuelos
        WHERE aeropuerto = ? AND salida_programada = ? AND destino_iata = ?
        ORDER BY clave_vuelo
        """,
        [primero["aeropuerto"], primero["salida_programada"], primero["destino_iata"]],
    )
    return {
        "clave_vuelo": clave,
        "aeropuerto": primero["aeropuerto"],
        "destino_iata": primero["destino_iata"],
        "destino_ciudad": primero["destino_ciudad"],
        "salida_programada": primero["salida_programada"],
        "codigos": codigos,
        "eventos": con_cambios,
    }
