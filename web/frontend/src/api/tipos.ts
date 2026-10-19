// Tipos de las respuestas de la API, generados a partir del backend.
// esquema.d.ts lo crea `npm run tipos` desde openapi.json (que exporta
// web/backend/scripts/exportar_openapi.py): no se edita a mano. Si cambia un
// modelo del backend, se regeneran y TypeScript señala lo que hay que ajustar.

import type { components } from './esquema'

type Esquemas = components['schemas']

export type Aeropuerto = Esquemas['Aeropuerto']
export type Meta = Esquemas['Meta']
export type Proyecto = Esquemas['Proyecto']
export type Resumen = Esquemas['Resumen']
export type PuntoSerie = Esquemas['PuntoSerie']
export type MetricasAeropuerto = Esquemas['MetricasAeropuerto']
export type RankingDestino = Esquemas['RankingDestino']
export type RankingAerolinea = Esquemas['RankingAerolinea']
export type CeldaHorario = Esquemas['CeldaHorario']
export type HistogramaRetrasos = Esquemas['HistogramaRetrasos']
export type Ruta = Esquemas['Ruta']
export type PanelDirecto = Esquemas['PanelDirecto']
export type VueloPanel = Esquemas['VueloPanel']
export type CodigoVuelo = Esquemas['CodigoVuelo']
export type HistorialVuelo = Esquemas['HistorialVuelo']
export type EventoVuelo = Esquemas['EventoVuelo']
export type Cambio = Esquemas['Cambio']

export type Granularidad = 'dia' | 'semana' | 'mes'
