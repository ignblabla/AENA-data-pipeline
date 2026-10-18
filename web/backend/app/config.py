"""
config.py
---------
Configuración del backend de la web. Las rutas se resuelven respecto a la
raíz del repositorio (no al directorio desde el que se lance uvicorn), y se
pueden sobrescribir con variables de entorno (útil para los tests).
"""

import os
from pathlib import Path

RAIZ_REPO = Path(__file__).resolve().parents[3]

HISTORICO_DIR = Path(os.environ.get("AENA_HISTORICO_DIR", RAIZ_REPO / "data" / "historico_parquet"))

# Última foto completa del panel de cada aeropuerto (la escribe el pipeline en cada ejecución)
ESTADO_ACTUAL_DIR = Path(os.environ.get("AENA_ESTADO_ACTUAL_DIR", RAIZ_REPO / "data" / "estado_actual"))

# Coordenadas de los aeropuertos del mundo (destinos), generado por scripts/actualizar_aeropuertos_mundo.py
AEROPUERTOS_MUNDO_CSV = Path(
    os.environ.get("AENA_AEROPUERTOS_MUNDO_CSV", Path(__file__).parent / "referencia" / "aeropuertos_mundo.csv")
)

# Cada cuánto (segundos) se comprueba si hay parquet nuevos tras un `git pull`
SEGUNDOS_ENTRE_COMPROBACIONES = int(os.environ.get("AENA_TTL_SEGUNDOS", 300))

# Retrasos estimados fuera de este rango (minutos) se consideran datos erróneos
RETRASO_MIN = -60
RETRASO_MAX = 600

# Umbral de puntualidad habitual en aviación
UMBRAL_PUNTUAL_MIN = 15

# Panel en directo: se muestran los vuelos cuya hora (estimada o programada) es
# posterior a la última actualización menos este margen
MARGEN_PANEL_MIN = 30

ORIGENES_CORS = ["http://localhost:5173", "http://127.0.0.1:5173"]
