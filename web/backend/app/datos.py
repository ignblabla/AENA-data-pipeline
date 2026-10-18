"""
datos.py
--------
Capa de datos del backend: carga el histórico Parquet en una base DuckDB en
memoria y construye las tablas que consultan los endpoints.

Tablas:
- eventos: el histórico tal cual (una fila por cambio detectado).
- vuelos:  último estado conocido de cada clave_vuelo (vuelo comercial), con
           día, cancelación y retraso estimado ya calculados.
- salidas: vuelos agrupados por (aeropuerto, salida_programada, destino_iata),
           que aproxima la salida física del avión eliminando los códigos
           compartidos (un mismo avión vendido por varias aerolíneas).
- directo: la última foto completa del panel de salidas de cada aeropuerto
           (data/estado_actual/*.pkl, escrita por el pipeline).
- aeropuertos_mundo: coordenadas y país de los destinos (OurAirports).

Además se define la macro limpio(x), que convierte en NULL los valores vacíos
con los que llega la API de AENA ('', 'null', 'null-null', '-').

Notas sobre la lectura:
- hive_partitioning=false: la columna "aeropuerto" ya viene dentro de cada
  archivo y choca con la partición aeropuerto=XXX de la ruta.
- union_by_name=true: algunos archivos guardan "puerta" como string y otros
  como large_string.

Los datos se recargan solos cuando cambian los archivos (p. ej. tras un
`git pull`), como mucho una vez cada SEGUNDOS_ENTRE_COMPROBACIONES.

Nota: los .pkl se leen con pandas.read_pickle, que puede ejecutar código; solo
deben cargarse archivos generados por el propio pipeline de este repositorio.
"""

import logging
import threading
import time
from datetime import date, datetime, timedelta
from pathlib import Path

import duckdb
import pandas as pd

from app import config
from app.catalogo import ESTADOS

logger = logging.getLogger(__name__)


def _archivos() -> list[Path]:
    return [
        *config.HISTORICO_DIR.glob("*/*/datos.parquet"),
        *config.ESTADO_ACTUAL_DIR.glob("*.pkl"),
        config.AEROPUERTOS_MUNDO_CSV,
    ]


def _huella_archivos() -> tuple[int, float]:
    """(número de archivos, última modificación) de los datos: cambia si llega algo nuevo."""
    archivos = [a for a in _archivos() if a.exists()]
    return len(archivos), max((a.stat().st_mtime for a in archivos), default=0.0)


def _cargar_estado_actual() -> pd.DataFrame | None:
    fotos = [pd.read_pickle(p) for p in sorted(config.ESTADO_ACTUAL_DIR.glob("*.pkl"))]
    fotos = [f for f in fotos if not f.empty]
    return pd.concat(fotos, ignore_index=True) if fotos else None


def _construir() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect(":memory:")
    con.execute("SET enable_progress_bar = false")
    patron = (config.HISTORICO_DIR / "*" / "*" / "datos.parquet").as_posix()

    con.execute("CREATE MACRO limpio(x) AS CASE WHEN trim(x) IN ('', 'null', 'null-null', '-') THEN NULL ELSE trim(x) END")

    con.execute(
        "CREATE TABLE eventos AS SELECT * FROM read_parquet(?, hive_partitioning=false, union_by_name=true)",
        [patron],
    )

    con.execute("CREATE TABLE estados (codigo VARCHAR, nombre VARCHAR)")
    con.executemany("INSERT INTO estados VALUES (?, ?)", list(ESTADOS.items()))

    con.execute(
        f"""
        CREATE TABLE vuelos AS
        WITH ultimo AS (
            SELECT
                *,
                count(*) OVER w AS n_eventos,
                min(detectado_en) OVER w AS primera_deteccion
            FROM eventos
            WINDOW w AS (PARTITION BY clave_vuelo)
            QUALIFY row_number() OVER (PARTITION BY clave_vuelo ORDER BY detectado_en DESC) = 1
        ),
        calculado AS (
            SELECT
                u.*,
                CAST(u.salida_programada AS DATE) AS dia,
                u.estado = 'CAN' AS cancelado,
                date_diff('minute', u.salida_programada, u.salida_estimada) AS retraso_bruto,
                coalesce(e.nombre, 'Sin estado') AS estado_nombre
            FROM ultimo u
            LEFT JOIN estados e ON e.codigo = u.estado
        )
        SELECT
            * EXCLUDE (retraso_bruto),
            CASE
                WHEN NOT cancelado AND retraso_bruto BETWEEN {config.RETRASO_MIN} AND {config.RETRASO_MAX}
                THEN retraso_bruto
            END AS retraso_min
        FROM calculado
        """
    )

    estado_actual = _cargar_estado_actual()
    if estado_actual is None:
        # Sin fotos todavía: tabla vacía con las mismas columnas que el histórico
        con.execute("CREATE TABLE directo AS SELECT * EXCLUDE (detectado_en) FROM eventos LIMIT 0")
    else:
        con.register("estado_actual_df", estado_actual)
        con.execute("CREATE TABLE directo AS SELECT * FROM estado_actual_df")
        con.unregister("estado_actual_df")

    con.execute(
        "CREATE TABLE aeropuertos_mundo AS SELECT * FROM read_csv(?, header=true, all_varchar=false)",
        [config.AEROPUERTOS_MUNDO_CSV.as_posix()],
    )

    con.execute(
        """
        CREATE TABLE salidas AS
        SELECT
            aeropuerto,
            salida_programada,
            destino_iata,
            any_value(destino_ciudad) AS destino_ciudad,
            any_value(dia) AS dia,
            count(*) AS n_codigos,
            bool_or(cancelado) AS cancelado,
            avg(retraso_min) AS retraso_min
        FROM vuelos
        GROUP BY aeropuerto, salida_programada, destino_iata
        """
    )
    return con


class Almacen:
    """Mantiene la base DuckDB en memoria y la reconstruye si cambian los archivos de datos."""

    def __init__(self, segundos_entre_comprobaciones: int):
        self.segundos = segundos_entre_comprobaciones
        self._con: duckdb.DuckDBPyConnection | None = None
        self._huella: tuple[int, float] | None = None
        self._ultima_comprobacion = 0.0
        self._lock = threading.Lock()
        self.cargado_en: datetime | None = None

    def _recargar_si_hace_falta(self) -> None:
        if self._con is not None and time.monotonic() - self._ultima_comprobacion < self.segundos:
            return
        with self._lock:
            if self._con is not None and time.monotonic() - self._ultima_comprobacion < self.segundos:
                return
            self._ultima_comprobacion = time.monotonic()
            huella = _huella_archivos()
            if self._con is not None and huella == self._huella:
                return

            inicio = time.perf_counter()
            nueva = _construir()
            # Se sustituye la conexión entera de golpe: las consultas en curso
            # siguen usando la anterior hasta que terminan.
            self._con, self._huella = nueva, huella
            self.cargado_en = datetime.now()
            logger.info("Histórico cargado: %d archivos en %.1fs", huella[0], time.perf_counter() - inicio)

    def cursor(self) -> duckdb.DuckDBPyConnection:
        """Cursor independiente (seguro entre hilos) sobre los datos más recientes."""
        self._recargar_si_hace_falta()
        return self._con.cursor()

    def rango_dias(self) -> dict[str, date]:
        """
        Días cubiertos por el histórico, según la fecha programada de salida.

        La API de AENA devuelve vuelos de hasta dos días vista, así que se
        descartan los días posteriores a la última detección. El primer día
        está incompleto (el pipeline empezó a mitad de día) y el último es
        "hoy", aún en curso: el rango "completo" los excluye.
        """
        cur = self.cursor()
        primero, ultima = cur.execute(
            "SELECT (SELECT min(dia) FROM vuelos), (SELECT max(detectado_en) FROM eventos)"
        ).fetchone()
        hoy = ultima.date()
        return {
            "dia_min": primero,
            "dia_max": hoy,
            "dia_min_completo": min(primero + timedelta(days=1), hoy),
            "dia_max_completo": max(hoy - timedelta(days=1), primero),
            "ultima_deteccion": ultima,
        }


almacen = Almacen(config.SEGUNDOS_ENTRE_COMPROBACIONES)


def consultar(sql: str, parametros: list | None = None) -> list[dict]:
    """Ejecuta una consulta y devuelve las filas como diccionarios."""
    cur = almacen.cursor()
    cur.execute(sql, parametros or [])
    columnas = [d[0] for d in cur.description]
    return [dict(zip(columnas, fila)) for fila in cur.fetchall()]
