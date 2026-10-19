import { BellRing, Check, Clock, DoorOpen, Luggage, TriangleAlert, X, type LucideIcon } from 'lucide-react'
import { TINTAS } from './tokens'

// Presentación de los estados de un vuelo y de su retraso, en las cuatro tintas del panel.
// Las insignias se leen sobre el panel negro (en claro y en oscuro). El ámbar es solo para
// el retraso y el rojo solo para la cancelación; todo lleva icono y texto, nunca solo color.

export interface EstiloEstado {
  variante: 'filled' | 'outline'
  color: string
  Icono: LucideIcon
  /** Color para elementos sobre el fondo de la página (p. ej. la línea temporal) */
  linea: string
}

const NEUTRO_TENUE = '#8f8b83'
const ACERO_OSCURO = '#3a3e42'
const TINTA_TEXTO = 'var(--mantine-color-text)'

const EMBARQUE: EstiloEstado = { variante: 'filled', color: TINTAS.pintura, Icono: DoorOpen, linea: TINTA_TEXTO }
const ULTIMA: EstiloEstado = { variante: 'filled', color: TINTAS.pintura, Icono: BellRing, linea: TINTA_TEXTO }
const TERMINADO: EstiloEstado = { variante: 'filled', color: ACERO_OSCURO, Icono: Check, linea: 'var(--mantine-color-dimmed)' }

const ESTILOS: Record<string, EstiloEstado> = {
  SCH: { variante: 'outline', color: NEUTRO_TENUE, Icono: Clock, linea: 'var(--mantine-color-dimmed)' },
  INI: { variante: 'outline', color: '#c4c0b6', Icono: Luggage, linea: 'var(--mantine-color-dimmed)' },
  BOR: EMBARQUE,
  EMB: EMBARQUE,
  BRD: EMBARQUE,
  ULL: ULTIMA,
  LSC: ULTIMA,
  CER: TERMINADO,
  CLS: TERMINADO,
  RDY: TERMINADO,
  OBK: TERMINADO,
  AIR: TERMINADO,
  RET: { variante: 'filled', color: TINTAS.ambar, Icono: TriangleAlert, linea: TINTAS.ambar },
  CAN: { variante: 'filled', color: TINTAS.rojo, Icono: X, linea: TINTAS.rojo },
}

const SIN_ESTADO: EstiloEstado = { variante: 'outline', color: NEUTRO_TENUE, Icono: Clock, linea: 'var(--mantine-color-dimmed)' }

export function estiloEstado(codigo: string | null | undefined): EstiloEstado {
  return (codigo && ESTILOS[codigo]) || SIN_ESTADO
}

/** Nivel del retraso: hasta el umbral de puntualidad (incluido) el vuelo es puntual; por encima, alerta. */
export function nivelRetraso(minutos: number | null | undefined, umbral = 15): 'ninguno' | 'leve' | 'aviso' | 'serio' {
  if (minutos == null || minutos <= 0) return 'ninguno'
  if (minutos <= umbral) return 'leve'
  return minutos < 60 ? 'aviso' : 'serio'
}
