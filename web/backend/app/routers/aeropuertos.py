from typing import Annotated

from fastapi import APIRouter, Depends

from app.datos import consultar
from app.esquemas import CeldaHorario, HistogramaRetrasos
from app.filtros import METRICAS_SALIDAS, Filtros, filtros_aeropuerto

router = APIRouter(prefix="/aeropuertos", tags=["aeropuertos"])

# Histograma de retrasos: tramos de 5 min entre estos límites, más un tramo
# abierto por cada lado (adelantos grandes y retrasos de 2 h o más)
RETRASO_DESDE, RETRASO_HASTA, ANCHO_TRAMO = -15, 120, 5


@router.get("/{iata}/horario", response_model=list[CeldaHorario], summary="Métricas por día de la semana y hora")
def horario(f: Annotated[Filtros, Depends(filtros_aeropuerto)]):
    """Una celda por (día de la semana, hora programada) para el mapa de calor."""
    where, parametros = f.where()
    return consultar(
        f"""
        WITH base AS (SELECT * FROM salidas WHERE {where}),
        -- Cuántos lunes, martes… hay en el periodo, para promediar por día
        dias AS (
            SELECT isodow(dia) AS dia_semana, count(DISTINCT dia) AS n
            FROM base GROUP BY 1
        )
        SELECT isodow(b.dia) AS dia_semana, hour(b.salida_programada) AS hora,
               count(*) / any_value(d.n) AS salidas_por_dia,
               {METRICAS_SALIDAS}
        FROM base b JOIN dias d ON d.dia_semana = isodow(b.dia)
        GROUP BY 1, 2
        ORDER BY 1, 2
        """,
        parametros,
    )


@router.get("/{iata}/retrasos", response_model=HistogramaRetrasos, summary="Distribución del retraso estimado")
def retrasos(f: Annotated[Filtros, Depends(filtros_aeropuerto)]):
    where, parametros = f.where()
    filas = consultar(
        f"""
        SELECT CASE
                   WHEN retraso_min < {RETRASO_DESDE} THEN NULL
                   WHEN retraso_min >= {RETRASO_HASTA} THEN {RETRASO_HASTA}
                   ELSE CAST(floor(retraso_min / {ANCHO_TRAMO}) * {ANCHO_TRAMO} AS INTEGER)
               END AS inicio,
               count(*) AS salidas
        FROM salidas WHERE {where} AND retraso_min IS NOT NULL
        GROUP BY 1
        """,
        parametros,
    )
    conteo = {fila["inicio"]: fila["salidas"] for fila in filas}

    # Se devuelven todos los tramos (también los vacíos) para que el eje sea continuo
    intervalos = [{"inicio": None, "fin": RETRASO_DESDE, "salidas": conteo.get(None, 0)}]
    for inicio in range(RETRASO_DESDE, RETRASO_HASTA, ANCHO_TRAMO):
        intervalos.append({"inicio": inicio, "fin": inicio + ANCHO_TRAMO, "salidas": conteo.get(inicio, 0)})
    intervalos.append({"inicio": RETRASO_HASTA, "fin": None, "salidas": conteo.get(RETRASO_HASTA, 0)})

    estadisticas = consultar(
        f"""
        SELECT count(retraso_min) AS total, median(retraso_min) AS mediana,
               quantile_cont(retraso_min, 0.9) AS p90
        FROM salidas WHERE {where}
        """,
        parametros,
    )[0]
    return {"intervalos": intervalos, **estadisticas}
