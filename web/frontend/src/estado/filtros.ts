import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { Granularidad } from '../api/tipos'
import { useMeta } from '../api/consultas'
import { METRICAS, type ClaveMetrica } from '../tema/metricas'

// Filtros globales de la web, guardados en la URL
// (?desde=…&hasta=…&aeropuertos=MAD&aeropuertos=BCN&metrica=…&granularidad=…).
// Así cualquier vista se puede compartir o guardar en favoritos tal cual.

export interface Filtros {
  desde: string
  hasta: string
  aeropuertos: string[]
}

export interface EstadoFiltros {
  /** null mientras no se conoce el rango de datos (antes de cargar /api/meta) */
  filtros: Filtros | null
  metrica: ClaveMetrica
  granularidad: Granularidad
  setRango: (desde: string, hasta: string) => void
  setAeropuertos: (aeropuertos: string[]) => void
  setMetrica: (metrica: ClaveMetrica) => void
  setGranularidad: (granularidad: Granularidad) => void
}

const GRANULARIDADES: Granularidad[] = ['dia', 'semana', 'mes']

const esFecha = (v: string | null): v is string => !!v && /^\d{4}-\d{2}-\d{2}$/.test(v)

export function useFiltros(): EstadoFiltros {
  const [params, setParams] = useSearchParams()
  const { data: meta } = useMeta()

  const desdeUrl = params.get('desde')
  const hastaUrl = params.get('hasta')
  const aeropuertosUrl = params.getAll('aeropuertos').join(',')
  const metricaUrl = params.get('metrica')
  const granularidadUrl = params.get('granularidad') as Granularidad | null

  const filtros = useMemo<Filtros | null>(() => {
    if (!meta) return null
    const validos = new Set(meta.aeropuertos.map((a) => a.iata))
    return {
      desde: esFecha(desdeUrl) ? desdeUrl : meta.rango.dia_min_completo,
      hasta: esFecha(hastaUrl) ? hastaUrl : meta.rango.dia_max_completo,
      aeropuertos: aeropuertosUrl.split(',').filter((c) => validos.has(c)),
    }
  }, [meta, desdeUrl, hastaUrl, aeropuertosUrl])

  const metrica: ClaveMetrica = metricaUrl && metricaUrl in METRICAS ? (metricaUrl as ClaveMetrica) : 'salidas'

  const granularidad = granularidadUrl && GRANULARIDADES.includes(granularidadUrl) ? granularidadUrl : 'dia'

  const actualizar = useCallback(
    (cambiar: (p: URLSearchParams) => void) =>
      setParams(
        (previos) => {
          const p = new URLSearchParams(previos)
          cambiar(p)
          return p
        },
        { replace: true },
      ),
    [setParams],
  )

  return {
    filtros,
    metrica,
    granularidad,
    setRango: (desde, hasta) =>
      actualizar((p) => {
        p.set('desde', desde)
        p.set('hasta', hasta)
      }),
    setAeropuertos: (aeropuertos) =>
      actualizar((p) => {
        p.delete('aeropuertos')
        aeropuertos.forEach((a) => p.append('aeropuertos', a))
      }),
    setMetrica: (m) =>
      actualizar((p) => {
        if (m === 'salidas') p.delete('metrica')
        else p.set('metrica', m)
      }),
    setGranularidad: (g) =>
      actualizar((p) => {
        if (g === 'dia') p.delete('granularidad')
        else p.set('granularidad', g)
      }),
  }
}

/**
 * Query string para enlazar a otra página conservando periodo, métrica y
 * granularidad (pero no la selección de aeropuertos, que es propia de cada página).
 */
export function useBusquedaComun(): string {
  const [params] = useSearchParams()
  const comun = new URLSearchParams()
  for (const clave of ['desde', 'hasta', 'metrica', 'granularidad']) {
    const valor = params.get(clave)
    if (valor) comun.set(clave, valor)
  }
  return comun.size ? `?${comun}` : ''
}
