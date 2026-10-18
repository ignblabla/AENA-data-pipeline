import { useMemo } from 'react'
import type { HistogramaRetrasos as Histograma } from '../../api/tipos'
import { formato } from '../../tema/formato'
import { textos } from '../../textos'
import { Grafico } from './Grafico'
import { ejeValor, filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

interface Props {
  histograma: Histograma
  umbralPuntual: number
  alto?: number
}

/** Texto de un tramo del histograma: "< −15", "0 a 5", "≥ 120". */
function tramo(inicio: number | null, fin: number | null, largo = false): string {
  const n = (v: number) => String(v).replace('-', '−')
  if (inicio === null) return `< ${n(fin!)}${largo ? ' min' : ''}`
  if (fin === null) return `≥ ${n(inicio)}${largo ? ' min' : ''}`
  return largo ? `De ${n(inicio)} a ${n(fin)} min` : n(inicio)
}

/** Distribución del retraso estimado en tramos de 5 min, con el umbral de puntualidad marcado. */
export function HistogramaRetrasos({ histograma, umbralPuntual, alto = 300 }: Props) {
  const t = useTokens()

  const opcion = useMemo(() => {
    const { intervalos, total } = histograma
    const etiquetas = intervalos.map((i) => tramo(i.inicio, i.fin))
    const indiceUmbral = intervalos.findIndex((i) => i.inicio === umbralPuntual)

    return {
      ...opcionBase(t),
      grid: { left: 8, right: 16, top: 28, bottom: 28, containLabel: true },
      xAxis: {
        type: 'category',
        data: etiquetas,
        axisLine: { lineStyle: { color: t.eje } },
        axisTick: { show: false },
        axisLabel: { color: t.textoTenue, interval: 2 },
        name: textos.graficos.minutos,
        nameLocation: 'middle',
        nameGap: 28,
        nameTextStyle: { color: t.textoTenue },
      },
      yAxis: ejeValor(t, (v) => formato.compacto(v)),
      tooltip: {
        ...(opcionBase(t).tooltip as object),
        trigger: 'item',
        formatter: ({ dataIndex }: { dataIndex: number }) => {
          const i = intervalos[dataIndex]
          const porcentaje = total ? formato.porcentaje(i.salidas / total) : '—'
          return (
            tituloTooltip(tramo(i.inicio, i.fin, true)) +
            filaTooltip(t.serie, textos.columnas.salidas, formato.entero(i.salidas)) +
            `<div style="opacity:.75;margin-top:2px">${textos.graficos.delTotal(porcentaje)}</div>`
          )
        },
      },
      series: [
        {
          id: 'histograma',
          type: 'bar',
          // Columnas contiguas separadas por un hueco fino del color del fondo
          barCategoryGap: '8%',
          data: intervalos.map((i) => ({ value: i.salidas, itemStyle: { color: t.serie, borderRadius: [4, 4, 0, 0] } })),
          markLine:
            indiceUmbral >= 0
              ? {
                  silent: true,
                  symbol: 'none',
                  lineStyle: { color: t.textoSecundario, width: 1, type: 'solid' },
                  label: { color: t.textoSecundario, formatter: textos.graficos.umbral(umbralPuntual), position: 'end', distance: 6 },
                  // La línea se sitúa entre el tramo anterior y el del umbral
                  data: [{ xAxis: indiceUmbral - 0.5 }],
                }
              : undefined,
        },
      ],
    }
  }, [histograma, umbralPuntual, t])

  return <Grafico opcion={opcion} alto={alto} etiqueta={textos.graficos.histograma} />
}
