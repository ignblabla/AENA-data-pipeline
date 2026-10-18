from typing import Annotated, Literal

from fastapi import APIRouter, Depends

from app.datos import consultar
from app.esquemas import PuntoSerie
from app.filtros import METRICAS_SALIDAS, Filtros, obtener_filtros

router = APIRouter(prefix="/series", tags=["series"])

# Primer día de cada periodo y número de días que tiene un periodo completo
PERIODOS = {
    "dia": ("dia", "1"),
    "semana": ("CAST(date_trunc('week', dia) AS DATE)", "7"),  # semanas de lunes a domingo
    "mes": ("CAST(date_trunc('month', dia) AS DATE)", "day(last_day(periodo))"),
}


@router.get("/temporal", response_model=list[PuntoSerie], summary="Métricas por día, semana o mes")
def serie_temporal(
    f: Annotated[Filtros, Depends(obtener_filtros)],
    granularidad: Literal["dia", "semana", "mes"] = "dia",
    agrupar: Literal["aeropuerto", "total"] = "aeropuerto",
):
    """
    Con agrupar=total, una fila por periodo sumando los aeropuertos filtrados
    (aeropuerto = null). `completo` indica si el periodo tiene todos sus días
    dentro del rango filtrado: una semana o mes a medias no es comparable.
    """
    where, parametros = f.where()
    periodo, dias_completo = PERIODOS[granularidad]
    clave = "aeropuerto" if agrupar == "aeropuerto" else "NULL"
    return consultar(
        f"""
        WITH agregado AS (
            SELECT {periodo} AS periodo, {clave} AS aeropuerto,
                   count(DISTINCT dia) AS dias, {METRICAS_SALIDAS}
            FROM salidas WHERE {where}
            GROUP BY ALL
        )
        SELECT *, dias >= {dias_completo} AS completo
        FROM agregado
        ORDER BY periodo, aeropuerto
        """,
        parametros,
    )
