import { keepPreviousData, useQuery } from '@tanstack/react-query'
import type { Filtros } from '../estado/filtros'
import type { ClaveMetrica } from '../tema/metricas'
import { obtener } from './cliente'
import type {
  CeldaHorario,
  Granularidad,
  HistogramaRetrasos,
  HistorialVuelo,
  Meta,
  MetricasAeropuerto,
  PanelDirecto,
  Proyecto,
  PuntoSerie,
  RankingAerolinea,
  RankingDestino,
  Resumen,
  Ruta,
} from './tipos'

// Un hook por endpoint. Al cambiar los filtros, los gráficos conservan los
// datos anteriores hasta que llegan los nuevos (placeholderData), en vez de
// parpadear con un estado vacío.

function parametros(f: Filtros) {
  return { desde: f.desde, hasta: f.hasta, aeropuertos: f.aeropuertos }
}

export function useMeta() {
  return useQuery({
    queryKey: ['meta'],
    queryFn: ({ signal }) => obtener<Meta>('/meta', {}, signal),
    staleTime: 5 * 60_000,
  })
}

export function useProyecto() {
  return useQuery({
    queryKey: ['proyecto'],
    queryFn: ({ signal }) => obtener<Proyecto>('/proyecto', {}, signal),
    staleTime: 5 * 60_000,
  })
}

export function useResumen(f: Filtros | null) {
  return useQuery({
    queryKey: ['resumen', f],
    queryFn: ({ signal }) => obtener<Resumen>('/resumen', parametros(f!), signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

export function useSerie(f: Filtros | null, agrupar: 'total' | 'aeropuerto', granularidad: Granularidad = 'dia') {
  return useQuery({
    queryKey: ['serie', agrupar, granularidad, f],
    queryFn: ({ signal }) =>
      obtener<PuntoSerie[]>('/series/temporal', { ...parametros(f!), agrupar, granularidad }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

export function useRankingAeropuertos(f: Filtros | null, metrica: ClaveMetrica) {
  return useQuery({
    queryKey: ['ranking-aeropuertos', metrica, f],
    queryFn: ({ signal }) => obtener<MetricasAeropuerto[]>('/rankings/aeropuertos', { ...parametros(f!), metrica }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

export function useRankingDestinos(f: Filtros | null, limite = 10) {
  return useQuery({
    queryKey: ['ranking-destinos', limite, f],
    queryFn: ({ signal }) => obtener<RankingDestino[]>('/rankings/destinos', { ...parametros(f!), limite }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

export function useRankingAerolineas(f: Filtros | null, limite = 10) {
  return useQuery({
    queryKey: ['ranking-aerolineas', limite, f],
    queryFn: ({ signal }) => obtener<RankingAerolinea[]>('/rankings/aerolineas', { ...parametros(f!), limite }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

// --- Detalle de un aeropuerto (el aeropuerto va en la ruta) ---------------

export function useHorario(iata: string, f: Filtros | null) {
  return useQuery({
    queryKey: ['horario', iata, f],
    queryFn: ({ signal }) => obtener<CeldaHorario[]>(`/aeropuertos/${iata}/horario`, { desde: f!.desde, hasta: f!.hasta }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

export function useRetrasos(iata: string, f: Filtros | null) {
  return useQuery({
    queryKey: ['retrasos', iata, f],
    queryFn: ({ signal }) => obtener<HistogramaRetrasos>(`/aeropuertos/${iata}/retrasos`, { desde: f!.desde, hasta: f!.hasta }, signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

// --- Rutas, panel en directo e historial de un vuelo ----------------------

export function useRutas(f: Filtros | null) {
  return useQuery({
    queryKey: ['rutas', f],
    queryFn: ({ signal }) => obtener<Ruta[]>('/rutas', parametros(f!), signal),
    enabled: !!f,
    placeholderData: keepPreviousData,
  })
}

/** El panel se vuelve a pedir cada minuto: si el backend ha recargado datos, aparecen solos. */
export function usePanel(iata: string, limite: number) {
  return useQuery({
    queryKey: ['panel', iata, limite],
    queryFn: ({ signal }) => obtener<PanelDirecto>(`/directo/${iata}`, { limite }, signal),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
    staleTime: 30_000,
  })
}

export function useHistorial(clave: string | null) {
  return useQuery({
    queryKey: ['historial', clave],
    queryFn: ({ signal }) => obtener<HistorialVuelo>('/vuelos/historial', { clave: clave! }, signal),
    enabled: !!clave,
  })
}
