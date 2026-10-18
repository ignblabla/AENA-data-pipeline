import { useMemo } from 'react'
import type { CeldaHorario } from '../../api/tipos'
import { formato } from '../../tema/formato'
import type { DefinicionMetrica } from '../../tema/metricas'
import { textos } from '../../textos'
import { Grafico } from './Grafico'
import { filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

interface Props {
  celdas: CeldaHorario[]
  metrica: DefinicionMetrica
  alto?: number
}

const HORAS = Array.from({ length: 24 }, (_, h) => String(h))

/** Valor de una celda: para salidas, la media por día; para el resto, la métrica tal cual. */
function valorCelda(c: CeldaHorario, metrica: DefinicionMetrica): number | null {
  return metrica.clave === 'salidas' ? c.salidas_por_dia : c[metrica.clave]
}

/**
 * Mapa de calor día de la semana × hora programada. Rampa secuencial de un
 * solo tono (poco → mucho); las franjas sin vuelos quedan vacías.
 */
export function MapaCalor({ celdas, metrica, alto = 300 }: Props) {
  const t = useTokens()

  const opcion = useMemo(() => {
    const porCelda = new Map(celdas.map((c) => [`${c.dia_semana}-${c.hora}`, c]))
    const datos: [number, number, number | string][] = []
    for (let dia = 1; dia <= 7; dia++) {
      for (let hora = 0; hora < 24; hora++) {
        const c = porCelda.get(`${dia}-${hora}`)
        const v = c ? valorCelda(c, metrica) : null
        datos.push([hora, dia - 1, v ?? '-'])
      }
    }
    const valores = datos.map((d) => d[2]).filter((v): v is number => typeof v === 'number')
    const etiquetaValor = metrica.clave === 'salidas' ? textos.graficos.salidasPorDia : metrica.etiqueta
    const formatear = (v: number) => (metrica.clave === 'salidas' ? formato.decimal(v) : metrica.formatear(v))

    return {
      ...opcionBase(t),
      grid: { left: 8, right: 8, top: 8, bottom: 56, containLabel: true },
      xAxis: {
        type: 'category',
        data: HORAS,
        axisLine: { show: false },
        axisTick: { show: false },
        splitArea: { show: false },
        axisLabel: { color: t.textoTenue, interval: 2, formatter: (h: string) => `${h} h` },
      },
      yAxis: {
        type: 'category',
        data: textos.diasSemanaCortos,
        inverse: true,
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: t.textoSecundario },
      },
      visualMap: {
        type: 'continuous',
        min: valores.length ? Math.min(...valores) : 0,
        max: valores.length ? Math.max(...valores) : 1,
        inRange: { color: t.rampa },
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        itemWidth: 10,
        itemHeight: 180,
        calculable: false,
        textStyle: { color: t.textoTenue },
        formatter: (v: number) => formatear(v),
        text: [textos.graficos.mas, textos.graficos.menos],
      },
      tooltip: {
        ...(opcionBase(t).tooltip as object),
        trigger: 'item',
        formatter: ({ value }: { value: [number, number, number | string] }) => {
          const [hora, dia, v] = value
          const c = porCelda.get(`${dia + 1}-${hora}`)
          const titulo = `${textos.diasSemana[dia]}, ${hora}:00–${hora}:59`
          if (!c) return tituloTooltip(titulo) + `<div style="opacity:.75">${textos.graficos.sinSalidas}</div>`
          return (
            tituloTooltip(titulo) +
            filaTooltip(t.serie, etiquetaValor, typeof v === 'number' ? formatear(v) : '—') +
            `<div style="opacity:.75;margin-top:2px">${textos.graficos.salidasEnTotal(formato.entero(c.salidas))}</div>`
          )
        },
      },
      series: [
        {
          id: 'calor',
          type: 'heatmap',
          data: datos,
          itemStyle: { borderColor: t.superficie, borderWidth: 2, borderRadius: 3 },
          emphasis: { itemStyle: { borderColor: t.textoPrincipal, borderWidth: 1 } },
        },
      ],
    }
  }, [celdas, metrica, t])

  return <Grafico opcion={opcion} alto={alto} etiqueta={`Mapa de calor de ${metrica.etiqueta.toLowerCase()} por día de la semana y hora`} />
}
