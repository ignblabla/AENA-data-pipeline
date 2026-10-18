import { useMemo } from 'react'
import type { EventoVuelo } from '../../api/tipos'
import { formato } from '../../tema/formato'
import { textos } from '../../textos'
import { Grafico } from './Grafico'
import { ejeValor, filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

interface Props {
  eventos: EventoVuelo[]
  umbralPuntual: number
  alto?: number
}

/** Retraso estimado del vuelo en cada actualización: escalones, porque el valor se mantiene hasta el siguiente cambio. */
export function EvolucionRetraso({ eventos, umbralPuntual, alto = 200 }: Props) {
  const t = useTokens()

  const opcion = useMemo(() => {
    const puntos = eventos.filter((e) => e.retraso_min !== null).map((e) => [e.detectado_en, e.retraso_min] as [string, number])
    return {
      ...opcionBase(t),
      grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
      xAxis: {
        type: 'time',
        axisLine: { lineStyle: { color: t.eje } },
        axisTick: { show: false },
        axisLabel: { color: t.textoTenue, hideOverlap: true, formatter: (v: number) => formato.fechaHora(new Date(v).toISOString()) },
        splitLine: { show: false },
      },
      yAxis: ejeValor(t, (v) => `${v} min`),
      tooltip: {
        ...(opcionBase(t).tooltip as object),
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: t.eje, width: 1 } },
        formatter: (ps: { dataIndex: number }[]) => {
          const [cuando, min] = puntos[ps[0].dataIndex]
          return tituloTooltip(formato.fechaHora(cuando)) + filaTooltip(t.serie, textos.historial.campos.salida_estimada, `${min > 0 ? '+' : ''}${min} min`)
        },
      },
      series: [
        {
          id: 'retraso',
          type: 'line',
          step: 'end',
          data: puntos,
          showSymbol: puntos.length < 30,
          symbolSize: 6,
          lineStyle: { width: 2, color: t.serie },
          itemStyle: { color: t.serie, borderColor: t.superficie, borderWidth: 2 },
          areaStyle: { color: t.serieSuave },
          markLine: {
            silent: true,
            symbol: 'none',
            lineStyle: { color: t.textoTenue, width: 1, type: 'solid' },
            label: { color: t.textoTenue, formatter: textos.graficos.umbral(umbralPuntual), position: 'insideEndTop' },
            data: [{ yAxis: umbralPuntual }],
          },
        },
      ],
    }
  }, [eventos, umbralPuntual, t])

  return <Grafico opcion={opcion} alto={alto} etiqueta={textos.historial.evolucion} />
}
