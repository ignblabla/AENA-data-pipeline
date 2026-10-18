// Presentación de los estados de un vuelo y de su retraso.
// Los colores de alerta (paleta de estado fija) se reservan para lo excepcional
// (retrasos y cancelaciones) y siempre van con icono y texto, nunca solo color.

export const COLORES_ALERTA = {
  aviso: '#fab219',
  serio: '#ec835a',
  critico: '#d03b3b',
}

export interface EstiloEstado {
  /** Color de Mantine o hexadecimal */
  color: string
  variante: 'filled' | 'light' | 'outline'
  icono: string
}

const EN_CURSO: EstiloEstado = { color: 'azul', variante: 'light', icono: '›' }
const TERMINADO: EstiloEstado = { color: 'gray', variante: 'filled', icono: '✓' }

const ESTILOS: Record<string, EstiloEstado> = {
  SCH: { color: 'gray', variante: 'outline', icono: '·' },
  INI: { color: 'gray', variante: 'light', icono: '›' },
  BOR: EN_CURSO,
  EMB: EN_CURSO,
  BRD: EN_CURSO,
  ULL: { color: 'azul', variante: 'filled', icono: '»' },
  LSC: { color: 'azul', variante: 'filled', icono: '»' },
  CER: TERMINADO,
  CLS: TERMINADO,
  RDY: TERMINADO,
  OBK: TERMINADO,
  AIR: TERMINADO,
  RET: { color: COLORES_ALERTA.aviso, variante: 'filled', icono: '!' },
  CAN: { color: COLORES_ALERTA.critico, variante: 'filled', icono: '✕' },
}

export function estiloEstado(codigo: string | null | undefined): EstiloEstado {
  return (codigo && ESTILOS[codigo]) || { color: 'gray', variante: 'outline', icono: '·' }
}

/** Nivel del retraso: hasta el umbral de puntualidad (incluido) el vuelo es puntual; por encima, alerta. */
export function nivelRetraso(minutos: number | null | undefined, umbral = 15): 'ninguno' | 'leve' | 'aviso' | 'serio' {
  if (minutos == null || minutos <= 0) return 'ninguno'
  if (minutos <= umbral) return 'leve'
  return minutos < 60 ? 'aviso' : 'serio'
}
