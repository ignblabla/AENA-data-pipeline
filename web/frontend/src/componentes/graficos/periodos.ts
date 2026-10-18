import type { Granularidad, PuntoSerie } from '../../api/tipos'
import { formato } from '../../tema/formato'
import type { DefinicionMetrica } from '../../tema/metricas'
import { textos } from '../../textos'

// Cómo se muestran los puntos de una serie según su granularidad (día, semana, mes).

/**
 * Valor que se dibuja para un punto. En semanas y meses las salidas se
 * expresan como media diaria: así un periodo a medias no parece una caída.
 */
export function valorSerie(p: PuntoSerie, metrica: DefinicionMetrica, granularidad: Granularidad): number | null {
  if (metrica.clave === 'salidas' && granularidad !== 'dia') return p.salidas / p.dias
  return p[metrica.clave]
}

export function etiquetaSerie(metrica: DefinicionMetrica, granularidad: Granularidad): string {
  return metrica.clave === 'salidas' && granularidad !== 'dia' ? textos.graficos.salidasPorDia : metrica.etiqueta
}

export function etiquetaPeriodo(periodo: string, granularidad: Granularidad, largo = false): string {
  if (granularidad === 'semana') return `${largo ? 'Semana del ' : ''}${formato.diaCorto(periodo)}`
  if (granularidad === 'mes') return formato.mes(periodo)
  return largo ? formato.diaLargo(periodo) : formato.diaCorto(periodo)
}
