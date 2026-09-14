"""
load.py
-------
Fase LOAD del ETL de vuelos de salida de los 11 grandes aeropuertos de
España.

Responsabilidades:
1. Persistir el "estado actual" de CADA aeropuerto por separado en disco.
2. Añadir al histórico SOLO las filas nuevas o cambiadas. 
   El histórico se guarda ahora en formato Parquet particionado al estilo Hive:
   data/historico_parquet/aeropuerto=<IATA>/fecha=<AAAA-MM-DD>/datos.parquet
"""

import logging
from pathlib import Path

import pandas as pd

from src.etl_aena.extract import AEROPUERTOS

DATA_DIR = Path("data")
DATA_DIR.mkdir(exist_ok=True)

ESTADO_ACTUAL_DIR = DATA_DIR / "estado_actual"
ESTADO_ACTUAL_DIR.mkdir(exist_ok=True)

# Nueva ruta para el histórico en Parquet
HISTORICO_DIR = DATA_DIR / "historico_parquet"
HISTORICO_DIR.mkdir(exist_ok=True)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)


# --- Estado actual (para comparar en la siguiente ejecución) --------------

def _ruta_estado(airport_code: str) -> Path:
    return ESTADO_ACTUAL_DIR / f"{airport_code}.pkl"

def cargar_estado_anterior(airport_code: str) -> pd.DataFrame | None:
    ruta = _ruta_estado(airport_code)
    if not ruta.exists():
        logger.info("[%s] No existe estado_actual todavía (primera ejecución).", airport_code)
        return None
    df = pd.read_pickle(ruta)
    logger.info("[%s] Estado anterior cargado: %d vuelos.", airport_code, len(df))
    return df

def cargar_estados_anteriores(codigos: list[str] | None = None) -> dict[str, pd.DataFrame | None]:
    codigos = codigos or list(AEROPUERTOS.keys())
    return {codigo: cargar_estado_anterior(codigo) for codigo in codigos}

def guardar_estado_actual(airport_code: str, df_estado_actualizado: pd.DataFrame) -> None:
    df_estado_actualizado.to_pickle(_ruta_estado(airport_code))
    logger.info("[%s] Estado actual guardado (%d vuelos).", airport_code, len(df_estado_actualizado))


# --- Histórico de cambios en formato Parquet Particionado -----------------

def guardar_cambios_en_historico(df_cambios: pd.DataFrame) -> None:
    """
    Guarda las filas de df_cambios en data/historico_parquet/ particionado por 
    aeropuerto y día.
    
    Para evitar miles de archivos pequeños (que rompen repositorios Git y sistemas 
    de archivos), consolida leyendo el archivo del día (si existe), concatenando y 
    sobrescribiendo.
    """
    if df_cambios.empty:
        logger.info("Sin cambios detectados: no se añade nada al histórico.")
        return

    # Extraemos el código IATA del aeropuerto desde el DataFrame
    airport_code = df_cambios["aeropuerto"].iloc[0]

    # Convertimos la fecha de detección para particionar
    df_cambios["detectado_en"] = pd.to_datetime(df_cambios["detectado_en"])
    df_cambios["fecha_particion"] = df_cambios["detectado_en"].dt.strftime("%Y-%m-%d")

    # Agrupamos por día (normalmente será solo 1 grupo, salvo a medianoche)
    for fecha, df_dia in df_cambios.groupby("fecha_particion"):
        dir_particion = HISTORICO_DIR / f"aeropuerto={airport_code}" / f"fecha={fecha}"
        dir_particion.mkdir(parents=True, exist_ok=True)
        
        archivo_parquet = dir_particion / "datos.parquet"

        # Quitamos la columna auxiliar de fecha porque la ruta ya aporta este dato
        df_nuevo = df_dia.drop(columns=["fecha_particion"])

        if archivo_parquet.exists():
            try:
                df_existente = pd.read_parquet(archivo_parquet)
                df_final = pd.concat([df_existente, df_nuevo], ignore_index=True)
            except Exception as e:
                logger.error("[%s] Error leyendo %s: %s", airport_code, archivo_parquet, e)
                df_final = df_nuevo
        else:
            df_final = df_nuevo

        df_final.to_parquet(archivo_parquet, index=False, engine="pyarrow")
        logger.info(
            "[%s] Añadidas %d fila(s) a la partición de fecha %s (%s).", 
            airport_code, len(df_nuevo), fecha, archivo_parquet
        )


# --- Punto de entrada de la fase Load --------------------------------------

def run_load(airport_code: str, df_cambios: pd.DataFrame, df_estado_actualizado: pd.DataFrame) -> None:
    guardar_cambios_en_historico(df_cambios)
    guardar_estado_actual(airport_code, df_estado_actualizado)

def run_load_todos(
    resultados_transform: dict[str, tuple[pd.DataFrame, pd.DataFrame, Path] | None],
) -> None:
    procesados = 0
    for codigo, resultado in resultados_transform.items():
        if resultado is None:
            logger.warning("[%s] Sin resultado de Transform, se omite en Load.", codigo)
            continue

        df_cambios, df_estado_actualizado, _ruta = resultado
        run_load(codigo, df_cambios, df_estado_actualizado)
        procesados += 1

    logger.info("Load completo: %d/%d aeropuertos actualizados.", procesados, len(resultados_transform))