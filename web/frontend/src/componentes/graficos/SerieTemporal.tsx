import { useMemo } from 'react'
import type { Granularidad, PuntoSerie } from '../../api/tipos'
import { formato } from '../../tema/formato'
import type { DefinicionMetrica } from '../../tema/metricas'
import { textos } from '../../textos'
import { Grafico } from './Grafico'
import { etiquetaPeriodo, etiquetaSerie, valorSerie } from './periodos'
import { ejeCategoria, ejeValor, filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

interface Props {
  datos: PuntoSerie[]
  metrica: DefinicionMetrica
  granularidad: Granularidad
  alto?: number
}

/**
 * Evolución de la métrica activa. Por días: línea con área y zoom temporal.
 * Por semanas o meses: columnas, con los periodos incompletos atenuados.
 */
export function SerieTemporal({ datos, metrica, granularidad, alto = 320 }: Props) {
  const t = useTokens()

  const opcion = useMemo(() => {
    const etiquetas = datos.map((p) => p.periodo)
    const valores = datos.map((p) => valorSerie(p, metrica, granularidad))
    const etiquetaValor = etiquetaSerie(metrica, granularidad)
    const porDia = granularidad === 'dia'
    const formatearValor = (v: number | null) =>
      metrica.clave === 'salidas' && !porDia ? formato.decimal(v) : metrica.formatear(v)

    const tooltip = {
      ...(opcionBase(t).tooltip as object),
      trigger: 'axis',
      axisPointer: porDia ? { type: 'line', lineStyle: { color: t.eje, width: 1 } } : { type: 'shadow', shadowStyle: { color: t.serieSuave } },
      formatter: (ps: { dataIndex: number }[]) => {
        const p = datos[ps[0].dataIndex]
        const nota = p.completo ? '' : `<div style="opacity:.75;margin-top:4px">${textos.graficos.periodoIncompleto(p.dias)}</div>`
        return tituloTooltip(etiquetaPeriodo(p.periodo, granularidad, true)) + filaTooltip(t.serie, etiquetaValor, formatearValor(valores[ps[0].dataIndex])) + nota
      },
    }

    const serie = porDia
      ? {
          id: 'serie',
          type: 'line',
          data: valores,
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 2, color: t.serie, cap: 'round', join: 'round' },
          itemStyle: { color: t.serie, borderColor: t.superficie, borderWidth: 2 },
          areaStyle: { color: t.serieSuave },
        }
      : {
          id: 'serie',
          type: 'bar',
          barMaxWidth: 24,
          data: datos.map((p, i) => ({
            value: valores[i],
            itemStyle: { color: p.completo ? t.serie : t.serieAtenuada, borderRadius: [4, 4, 0, 0] },
          })),
          label: {
            show: datos.length <= 12,
            position: 'top',
            color: t.textoSecundario,
            formatter: ({ value }: { value: number | null }) => formatearValor(value),
          },
        }

    return {
      ...opcionBase(t),
      grid: { left: 8, right: 16, top: 24, bottom: porDia ? 56 : 8, containLabel: true },
      xAxis: {
        ...ejeCategoria(t),
        data: etiquetas,
        boundaryGap: !porDia,
        axisLabel: { color: t.textoTenue, formatter: (v: string) => etiquetaPeriodo(v, granularidad) },
      },
      yAxis: { ...ejeValor(t, metrica.formatearEje), scale: porDia && metrica.clave !== 'salidas' },
      tooltip,
      dataZoom: porDia
        ? [
            { type: 'inside', zoomOnMouseWheel: false, moveOnMouseWheel: false },
            {
              type: 'slider',
              height: 18,
              bottom: 8,
              borderColor: 'transparent',
              backgroundColor: t.rejilla,
              fillerColor: t.serieSuave,
              dataBackground: { lineStyle: { color: t.eje }, areaStyle: { color: 'transparent' } },
              selectedDataBackground: { lineStyle: { color: t.serie }, areaStyle: { color: 'transparent' } },
              handleStyle: { color: t.superficie, borderColor: t.serie },
              moveHandleSize: 0,
              labelFormatter: (_: number, valor: string) => formato.diaCorto(valor),
              textStyle: { color: t.textoTenue },
            },
          ]
        : [],
      series: [serie],
    }
  }, [datos, metrica, granularidad, t])

  return <Grafico opcion={opcion} alto={alto} etiqueta={`Evolución de ${metrica.etiqueta.toLowerCase()}`} />
}
