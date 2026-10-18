import { useCallback, useMemo } from 'react'
import { escapar } from '../../tema/formato'
import { Grafico } from './Grafico'
import { ejeValor, filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

export interface ElementoRanking {
  /** Etiqueta corta en el eje (p. ej. código IATA) */
  clave: string
  /** Nombre completo para el tooltip */
  nombre: string
  valor: number | null
  /** Líneas extra del tooltip: [etiqueta, valor ya formateado] */
  extra?: [string, string][]
}

interface Props {
  elementos: ElementoRanking[]
  etiquetaValor: string
  formatear: (v: number | null) => string
  formatearEje: (v: number) => string
  alto?: number
  /** Claves resaltadas; el resto se atenúa. Vacío = todas resaltadas */
  resaltadas?: string[]
  onSeleccionar?: (clave: string) => void
  etiqueta: string
}

/** Barras horizontales ordenadas, con el valor en la punta de cada barra. */
export function RankingBarras({ elementos, etiquetaValor, formatear, formatearEje, alto, resaltadas = [], onSeleccionar, etiqueta }: Props) {
  const t = useTokens()
  // ECharts pinta las categorías de abajo arriba: se invierte para que el primero quede arriba
  const ordenados = useMemo(() => [...elementos].reverse(), [elementos])
  const altoFinal = alto ?? Math.max(200, ordenados.length * 30 + 40)

  const opcion = useMemo(
    () => ({
      ...opcionBase(t),
      grid: { left: 8, right: 72, top: 4, bottom: 4, containLabel: true },
      xAxis: { ...ejeValor(t, formatearEje), splitNumber: 3, axisLabel: { show: false } },
      yAxis: {
        type: 'category',
        data: ordenados.map((e) => e.clave),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.textoSecundario, fontWeight: 500 },
      },
      tooltip: {
        ...(opcionBase(t).tooltip as object),
        trigger: 'item',
        formatter: ({ dataIndex }: { dataIndex: number }) => {
          const e = ordenados[dataIndex]
          return (
            tituloTooltip(e.nombre) +
            filaTooltip(t.serie, etiquetaValor, formatear(e.valor)) +
            (e.extra ?? []).map(([k, v]) => `<div style="opacity:.75;margin-top:2px">${escapar(k)}: ${escapar(v)}</div>`).join('')
          )
        },
      },
      series: [
        {
          id: 'ranking',
          type: 'bar',
          barMaxWidth: 18,
          cursor: onSeleccionar ? 'pointer' : 'default',
          data: ordenados.map((e) => ({
            value: e.valor,
            itemStyle: {
              color: resaltadas.length === 0 || resaltadas.includes(e.clave) ? t.serie : t.serieAtenuada,
              borderRadius: [0, 4, 4, 0],
            },
          })),
          label: {
            show: true,
            position: 'right',
            color: t.textoSecundario,
            formatter: ({ value }: { value: number | null }) => formatear(value),
          },
        },
      ],
    }),
    [ordenados, t, etiquetaValor, formatear, formatearEje, resaltadas, onSeleccionar],
  )

  const alPulsar = useCallback(({ dataIndex }: { dataIndex: number }) => onSeleccionar?.(ordenados[dataIndex].clave), [onSeleccionar, ordenados])

  return <Grafico opcion={opcion} alto={altoFinal} etiqueta={etiqueta} onClick={onSeleccionar ? alPulsar : undefined} />
}
