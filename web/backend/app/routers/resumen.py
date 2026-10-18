from typing import Annotated

from fastapi import APIRouter, Depends

from app.datos import consultar
from app.esquemas import Resumen
from app.filtros import METRICAS_SALIDAS, Filtros, obtener_filtros

router = APIRouter(tags=["resumen"])


@router.get("/resumen", response_model=Resumen, summary="Indicadores clave del periodo")
def resumen(f: Annotated[Filtros, Depends(obtener_filtros)]):
    where, parametros = f.where()
    fila = consultar(f"SELECT {METRICAS_SALIDAS} FROM salidas WHERE {where}", parametros)[0]
    return {**fila, "desde": f.desde, "hasta": f.hasta, "aeropuertos": f.aeropuertos}
