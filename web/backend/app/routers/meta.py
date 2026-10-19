from fastapi import APIRouter

from app import config
from app.catalogo import AEROPUERTOS
from app.datos import almacen, consultar
from app.esquemas import Meta, Proyecto

router = APIRouter(tags=["meta"])


@router.get("/meta", response_model=Meta, summary="Aeropuertos y periodo disponible")
def meta():
    return {
        "aeropuertos": [{"iata": iata, **datos} for iata, datos in AEROPUERTOS.items()],
        "rango": almacen.rango_dias(),
        "umbral_puntual_min": config.UMBRAL_PUNTUAL_MIN,
    }


@router.get("/proyecto", response_model=Proyecto, summary="Cifras globales del histórico (para la portada)")
def proyecto():
    return consultar(
        """
        SELECT
            (SELECT count(*) FROM eventos) AS eventos,
            (SELECT count(*) FROM vuelos) AS vuelos,
            (SELECT count(*) FROM salidas) AS salidas,
            (SELECT count(DISTINCT destino_iata) FROM salidas) AS destinos,
            (SELECT count(DISTINCT m.pais) FROM salidas s JOIN aeropuertos_mundo m ON m.iata = s.destino_iata) AS paises,
            (SELECT count(DISTINCT aeropuerto) FROM eventos) AS aeropuertos,
            (SELECT count(*) FROM (SELECT DISTINCT aeropuerto, destino_iata FROM salidas)) AS rutas,
            (SELECT count(*) FROM (SELECT DISTINCT aeropuerto, CAST(detectado_en AS DATE) FROM eventos)) AS particiones,
            -- Una ejecución tarda pocos minutos y se repite cada 10: lo detectado en los
            -- 9 minutos anteriores a la última detección es la última pasada
            (SELECT count(*) FROM eventos
             WHERE detectado_en > (SELECT max(detectado_en) FROM eventos) - INTERVAL 9 MINUTE) AS cambios_ultima_pasada,
            (SELECT min(detectado_en) FROM eventos) AS primera_deteccion,
            (SELECT max(detectado_en) FROM eventos) AS ultima_deteccion
        """
    )[0]
