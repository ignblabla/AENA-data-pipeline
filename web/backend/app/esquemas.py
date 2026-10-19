"""
esquemas.py
-----------
Modelos de respuesta de la API. Documentan cada endpoint en /docs y, más
adelante, servirán para generar los tipos TypeScript del frontend.
"""

from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, Field


class Aeropuerto(BaseModel):
    iata: str
    nombre: str
    ciudad: str
    lat: float
    lon: float


class RangoDias(BaseModel):
    dia_min: date = Field(description="Primer día con datos (incompleto)")
    dia_max: date = Field(description="Último día con datos (hoy, en curso)")
    dia_min_completo: date
    dia_max_completo: date
    ultima_deteccion: datetime = Field(description="Último cambio detectado por el pipeline")


class Meta(BaseModel):
    aeropuertos: list[Aeropuerto]
    rango: RangoDias
    umbral_puntual_min: int


class Proyecto(BaseModel):
    eventos: int = Field(description="Cambios registrados por el pipeline en todo el histórico")
    vuelos: int = Field(description="Vuelos comerciales distintos (cada código compartido cuenta)")
    salidas: int = Field(description="Salidas físicas distintas")
    destinos: int
    paises: int
    aeropuertos: int
    rutas: int = Field(description="Pares aeropuerto de origen → destino distintos")
    particiones: int = Field(description="Archivos del histórico (un Parquet por aeropuerto y día)")
    cambios_ultima_pasada: int = Field(description="Cambios detectados en la última ejecución del pipeline")
    primera_deteccion: datetime
    ultima_deteccion: datetime


class Metricas(BaseModel):
    salidas: int = Field(description="Salidas físicas (sin duplicar códigos compartidos)")
    vuelos: int = Field(description="Vuelos comerciales (cada número de vuelo cuenta)")
    cancelados: int = Field(description="Salidas físicas canceladas")
    tasa_cancelacion: float = Field(description="Fracción 0-1")
    retraso_medio: float | None = Field(description="Minutos, según la hora estimada")
    tasa_puntualidad: float | None = Field(description="Fracción 0-1 de salidas con retraso estimado ≤ umbral")


class Resumen(Metricas):
    desde: date
    hasta: date
    aeropuertos: list[str]


class PuntoSerie(Metricas):
    periodo: date = Field(description="Primer día del periodo (día, lunes de la semana o día 1 del mes)")
    aeropuerto: str | None = Field(description="null cuando se agrupan todos los aeropuertos filtrados")
    dias: int = Field(description="Días con datos dentro del periodo")
    completo: bool = Field(description="False si el periodo no tiene todos sus días (p. ej. semana a medias)")


class MetricasAeropuerto(Metricas):
    aeropuerto: str


class RankingDestino(BaseModel):
    destino_iata: str
    destino_ciudad: str
    salidas: int
    retraso_medio: float | None


class RankingAerolinea(BaseModel):
    iata_compania: str
    aerolinea: str
    vuelos: int = Field(description="Vuelos comercializados, incluidos códigos compartidos")
    cancelados: int
    retraso_medio: float | None
    tasa_puntualidad: float | None


class CeldaHorario(Metricas):
    dia_semana: int = Field(description="1 = lunes … 7 = domingo")
    hora: int = Field(description="Hora programada de salida, 0-23")
    salidas_por_dia: float = Field(description="Media de salidas en esa franja por cada día de la semana del periodo")


class IntervaloRetraso(BaseModel):
    inicio: int | None = Field(description="Minuto inicial; null = adelantos mayores que el primer límite")
    fin: int | None = Field(description="Minuto final (excluido); null = sin límite superior")
    salidas: int


class HistogramaRetrasos(BaseModel):
    intervalos: list[IntervaloRetraso]
    total: int
    mediana: float | None
    p90: float | None


class Ruta(BaseModel):
    origen: str
    destino_iata: str
    destino_ciudad: str = Field(description="Nombre del destino tal como lo publica AENA")
    destino_nombre: str | None = Field(description="Nombre del aeropuerto de destino (OurAirports)")
    pais: str | None = Field(description="Código ISO del país de destino")
    continente: str | None
    lat: float | None = Field(description="null si el destino no tiene coordenadas conocidas")
    lon: float | None
    salidas: int
    retraso_medio: float | None
    tasa_puntualidad: float | None
    tasa_cancelacion: float


class CodigoVuelo(BaseModel):
    clave_vuelo: str
    num_vuelo: str
    iata_compania: str | None
    aerolinea: str | None


class VueloPanel(BaseModel):
    clave_vuelo: str = Field(description="Clave del primer código; sirve para pedir su historial")
    codigos: list[CodigoVuelo] = Field(description="Todos los números de vuelo de esta salida (códigos compartidos)")
    destino_iata: str
    destino_ciudad: str
    salida_programada: datetime
    salida_estimada: datetime | None
    retraso_min: int | None
    estado: str | None
    estado_nombre: str
    terminal: str | None
    puerta: str | None
    mostrador: str | None
    tipo_aeronave: str | None
    n_cambios: int = Field(description="Cambios registrados en el histórico para el primer código de esta salida")


class PanelDirecto(BaseModel):
    aeropuerto: str
    actualizado: datetime | None = Field(description="Último cambio detectado en este aeropuerto")
    total: int = Field(description="Salidas en el panel a partir del margen, antes de aplicar el límite")
    vuelos: list[VueloPanel]


class Cambio(BaseModel):
    campo: Literal["estado", "puerta", "salida_estimada", "mostrador", "terminal", "tipo_aeronave"]
    antes: str | None = Field(description="Valor anterior (fechas en ISO 8601; el estado, con su nombre legible)")
    despues: str | None


class EventoVuelo(BaseModel):
    detectado_en: datetime
    estado: str | None
    estado_nombre: str
    puerta: str | None
    salida_estimada: datetime | None
    retraso_min: int | None
    mostrador: str | None
    terminal: str | None
    tipo_aeronave: str | None
    cambios: list[Cambio] = Field(description="Campos que cambiaron respecto al evento anterior (vacío en el primero)")


class HistorialVuelo(BaseModel):
    clave_vuelo: str
    aeropuerto: str
    destino_iata: str
    destino_ciudad: str
    salida_programada: datetime
    codigos: list[CodigoVuelo]
    eventos: list[EventoVuelo]
