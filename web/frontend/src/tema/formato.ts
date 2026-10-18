// Formateo de números y fechas en español

const entero = new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0, useGrouping: 'always' })
const compacto = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 })
const decimal1 = new Intl.NumberFormat('es-ES', { minimumFractionDigits: 1, maximumFractionDigits: 1 })
const porcentaje = new Intl.NumberFormat('es-ES', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 })
const diaCorto = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const diaLargo = new Intl.DateTimeFormat('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const mes = new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric', timeZone: 'UTC' })
const fechaHora = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

const vacio = '—'
const paises = new Intl.DisplayNames('es', { type: 'region' })
const MINUSCULAS = new Set(['de', 'del', 'la', 'las', 'los', 'el', 'y'])

export const formato = {
  entero: (v: number | null | undefined) => (v == null ? vacio : entero.format(v)),
  compacto: (v: number | null | undefined) => (v == null ? vacio : v < 10000 ? entero.format(v) : compacto.format(v)),
  decimal: (v: number | null | undefined) => (v == null ? vacio : decimal1.format(v)),
  minutos: (v: number | null | undefined) => (v == null ? vacio : `${decimal1.format(v)} min`),
  porcentaje: (v: number | null | undefined) => (v == null ? vacio : porcentaje.format(v)),
  // Las fechas "AAAA-MM-DD" se tratan como UTC para que no se desplacen de día
  diaCorto: (iso: string) => diaCorto.format(new Date(`${iso}T00:00:00Z`)),
  diaLargo: (iso: string) => diaLargo.format(new Date(`${iso}T00:00:00Z`)),
  mes: (iso: string) => {
    const texto = mes.format(new Date(`${iso}T00:00:00Z`))
    return texto.charAt(0).toUpperCase() + texto.slice(1)
  },
  fechaHora: (iso: string) => fechaHora.format(new Date(iso)),
  hora: (iso: string | null | undefined) => (iso ? iso.slice(11, 16) : vacio),
  /** Nombre del país en español a partir del código ISO ("GB" -> "Reino Unido") */
  pais: (codigo: string | null | undefined) => {
    if (!codigo) return vacio
    try {
      return paises.of(codigo) ?? codigo
    } catch {
      return codigo
    }
  },
  /** "LONDRES /GATWICK" -> "Londres / Gatwick"; "PALMA DE MALLORCA" -> "Palma de Mallorca" */
  nombrePropio: (texto: string) =>
    texto
      .toLowerCase()
      .replace(/\s*\/\s*/g, ' / ')
      .split(' ')
      // Mayúscula al principio de cada palabra (y tras guion o paréntesis), salvo artículos y preposiciones
      .map((palabra, i) => (i > 0 && MINUSCULAS.has(palabra) ? palabra : palabra.replace(/(^|[-(])(\p{L})/gu, (_, s: string, c: string) => s + c.toUpperCase())))
      .join(' '),
}

/** Escapa texto que viene de los datos antes de meterlo en el HTML de un tooltip. */
export function escapar(texto: string): string {
  return texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!)
}
