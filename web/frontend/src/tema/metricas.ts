import { formato } from './formato'

// Catálogo de métricas seleccionables. Cada gráfico que depende de "la
// métrica activa" lee de aquí su etiqueta, formato y orden del ranking.

export type ClaveMetrica = 'salidas' | 'retraso_medio' | 'tasa_puntualidad' | 'tasa_cancelacion'

export interface DefinicionMetrica {
  clave: ClaveMetrica
  etiqueta: string
  descripcion: string
  formatear: (v: number | null | undefined) => string
  formatearEje: (v: number) => string
  /** Para el ranking: true si un valor más alto es "mejor" */
  masEsMejor: boolean
}

export const METRICAS: Record<ClaveMetrica, DefinicionMetrica> = {
  salidas: {
    clave: 'salidas',
    etiqueta: 'Salidas',
    descripcion: 'Salidas físicas (un avión con varios códigos compartidos cuenta una vez)',
    formatear: formato.entero,
    formatearEje: (v) => formato.compacto(v),
    masEsMejor: true,
  },
  retraso_medio: {
    clave: 'retraso_medio',
    etiqueta: 'Retraso medio',
    descripcion: 'Minutos entre la hora programada y la última hora estimada publicada',
    formatear: formato.minutos,
    formatearEje: (v) => `${v} min`,
    masEsMejor: false,
  },
  tasa_puntualidad: {
    clave: 'tasa_puntualidad',
    etiqueta: 'Puntualidad',
    descripcion: 'Salidas con un retraso estimado de 15 minutos o menos',
    formatear: formato.porcentaje,
    formatearEje: (v) => `${Math.round(v * 100)} %`,
    masEsMejor: true,
  },
  tasa_cancelacion: {
    clave: 'tasa_cancelacion',
    etiqueta: 'Cancelaciones',
    descripcion: 'Salidas físicas cuyo último estado es «Cancelado»',
    formatear: formato.porcentaje,
    formatearEje: (v) => `${(v * 100).toLocaleString('es-ES', { maximumFractionDigits: 1 })} %`,
    masEsMejor: false,
  },
}

export const LISTA_METRICAS = Object.values(METRICAS)
