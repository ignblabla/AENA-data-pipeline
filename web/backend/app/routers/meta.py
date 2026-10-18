from fastapi import APIRouter

from app import config
from app.catalogo import AEROPUERTOS
from app.datos import almacen
from app.esquemas import Meta

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=Meta, summary="Aeropuertos y periodo disponible")
def meta():
    return {
        "aeropuertos": [{"iata": iata, **datos} for iata, datos in AEROPUERTOS.items()],
        "rango": almacen.rango_dias(),
        "umbral_puntual_min": config.UMBRAL_PUNTUAL_MIN,
    }
