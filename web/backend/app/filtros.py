"""
filtros.py
----------
Filtros comunes a todos los endpoints (rango de días y aeropuertos) y las
agregaciones de métricas que se repiten entre endpoints.
"""

from dataclasses import dataclass
from datetime import date
from typing import Annotated

from fastapi import Depends, HTTPException, Query

from app import config
from app.catalogo import AEROPUERTOS
from app.datos import almacen


@dataclass
class Filtros:
    desde: date
    hasta: date
    aeropuertos: list[str]

    def where(self, alias: str = "") -> tuple[str, list]:
        """Cláusula WHERE (sin la palabra WHERE) y sus parámetros."""
        p = f"{alias}." if alias else ""
        condiciones = [f"{p}dia BETWEEN ? AND ?"]
        parametros: list = [self.desde, self.hasta]
        if self.aeropuertos:
            condiciones.append(f"{p}aeropuerto IN ({', '.join('?' for _ in self.aeropuertos)})")
            parametros.extend(self.aeropuertos)
        return " AND ".join(condiciones), parametros


def obtener_filtros(
    desde: Annotated[date | None, Query(description="Primer día (AAAA-MM-DD). Por defecto, el primer día completo.")] = None,
    hasta: Annotated[date | None, Query(description="Último día (AAAA-MM-DD). Por defecto, el último día completo.")] = None,
    aeropuertos: Annotated[list[str] | None, Query(description="Códigos IATA. Vacío = todos.")] = None,
) -> Filtros:
    rango = almacen.rango_dias()
    desde = desde or rango["dia_min_completo"]
    hasta = hasta or rango["dia_max_completo"]
    if desde > hasta:
        raise HTTPException(422, "La fecha 'desde' no puede ser posterior a 'hasta'.")

    codigos = sorted({c.upper() for c in aeropuertos or []})
    desconocidos = [c for c in codigos if c not in AEROPUERTOS]
    if desconocidos:
        raise HTTPException(422, f"Aeropuerto(s) desconocido(s): {', '.join(desconocidos)}")
    return Filtros(desde, hasta, codigos)


def filtros_aeropuerto(iata: str, f: Annotated[Filtros, Depends(obtener_filtros)]) -> Filtros:
    """Para rutas /aeropuertos/{iata}/…: el aeropuerto viene en la ruta, no en la query."""
    iata = iata.upper()
    if iata not in AEROPUERTOS:
        raise HTTPException(404, f"Aeropuerto desconocido: {iata}")
    return Filtros(f.desde, f.hasta, [iata])


TASA_PUNTUALIDAD = f"avg(CASE WHEN retraso_min IS NOT NULL THEN (retraso_min <= {config.UMBRAL_PUNTUAL_MIN})::DOUBLE END)"

# Métricas sobre la tabla "salidas" (salidas físicas, sin códigos compartidos)
METRICAS_SALIDAS = f"""
    count(*) AS salidas,
    coalesce(sum(n_codigos), 0) AS vuelos,
    count(*) FILTER (WHERE cancelado) AS cancelados,
    count(*) FILTER (WHERE cancelado) / greatest(count(*), 1) AS tasa_cancelacion,
    avg(retraso_min) AS retraso_medio,
    {TASA_PUNTUALIDAD} AS tasa_puntualidad
"""
