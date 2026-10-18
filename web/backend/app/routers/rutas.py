from typing import Annotated

from fastapi import APIRouter, Depends

from app.datos import consultar
from app.esquemas import Ruta
from app.filtros import TASA_PUNTUALIDAD, Filtros, obtener_filtros

router = APIRouter(tags=["rutas"])


@router.get("/rutas", response_model=list[Ruta], summary="Salidas por ruta (aeropuerto de origen → destino)")
def rutas(f: Annotated[Filtros, Depends(obtener_filtros)]):
    """
    Una fila por par origen-destino, con las coordenadas del destino para el
    mapa. Los destinos sin coordenadas conocidas llegan con lat/lon = null.
    """
    where, parametros = f.where("s")
    return consultar(
        f"""
        SELECT s.aeropuerto AS origen, s.destino_iata,
               any_value(s.destino_ciudad) AS destino_ciudad,
               any_value(m.nombre) AS destino_nombre,
               any_value(m.pais) AS pais,
               any_value(m.continente) AS continente,
               any_value(m.lat) AS lat,
               any_value(m.lon) AS lon,
               count(*) AS salidas,
               avg(s.retraso_min) AS retraso_medio,
               {TASA_PUNTUALIDAD} AS tasa_puntualidad,
               count(*) FILTER (WHERE s.cancelado) / count(*) AS tasa_cancelacion
        FROM salidas s
        LEFT JOIN aeropuertos_mundo m ON m.iata = s.destino_iata
        WHERE {where}
        GROUP BY s.aeropuerto, s.destino_iata
        ORDER BY salidas DESC, origen, s.destino_iata
        """,
        parametros,
    )
