from typing import Annotated, Literal

from fastapi import APIRouter, Depends, Query

from app.datos import consultar
from app.esquemas import MetricasAeropuerto, RankingAerolinea, RankingDestino
from app.filtros import METRICAS_SALIDAS, TASA_PUNTUALIDAD, Filtros, obtener_filtros

router = APIRouter(prefix="/rankings", tags=["rankings"])

Limite = Annotated[int, Query(ge=1, le=100)]


@router.get("/aeropuertos", response_model=list[MetricasAeropuerto], summary="Métricas por aeropuerto")
def ranking_aeropuertos(
    f: Annotated[Filtros, Depends(obtener_filtros)],
    metrica: Literal["salidas", "retraso_medio", "tasa_cancelacion", "tasa_puntualidad"] = "salidas",
):
    where, parametros = f.where()
    return consultar(
        f"""
        SELECT aeropuerto, {METRICAS_SALIDAS}
        FROM salidas WHERE {where}
        GROUP BY aeropuerto
        ORDER BY {metrica} DESC NULLS LAST
        """,
        parametros,
    )


@router.get("/destinos", response_model=list[RankingDestino], summary="Destinos con más salidas")
def ranking_destinos(f: Annotated[Filtros, Depends(obtener_filtros)], limite: Limite = 10):
    where, parametros = f.where()
    return consultar(
        f"""
        SELECT destino_iata, any_value(destino_ciudad) AS destino_ciudad,
               count(*) AS salidas, avg(retraso_min) AS retraso_medio
        FROM salidas WHERE {where}
        GROUP BY destino_iata
        ORDER BY salidas DESC
        LIMIT ?
        """,
        [*parametros, limite],
    )


@router.get("/aerolineas", response_model=list[RankingAerolinea], summary="Aerolíneas con más vuelos")
def ranking_aerolineas(f: Annotated[Filtros, Depends(obtener_filtros)], limite: Limite = 10):
    # Se cuenta sobre "vuelos" (no "salidas") porque en un código compartido
    # no se sabe qué aerolínea opera el avión: cada una suma su vuelo.
    where, parametros = f.where()
    return consultar(
        f"""
        SELECT iata_compania,
               -- En algunos vuelos AENA no informa la aerolínea (ni nombre ni código)
               coalesce(max(nullif(trim(aerolinea), '')), nullif(iata_compania, ''), 'Aerolínea sin identificar') AS aerolinea,
               count(*) AS vuelos, count(*) FILTER (WHERE cancelado) AS cancelados,
               avg(retraso_min) AS retraso_medio,
               {TASA_PUNTUALIDAD} AS tasa_puntualidad
        FROM vuelos WHERE {where}
        GROUP BY iata_compania
        ORDER BY vuelos DESC
        LIMIT ?
        """,
        [*parametros, limite],
    )
