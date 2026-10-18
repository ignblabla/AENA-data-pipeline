import { BarChart, HeatmapChart, LineChart } from 'echarts/charts'
import { DataZoomComponent, GridComponent, MarkLineComponent, TooltipComponent, VisualMapComponent } from 'echarts/components'
import * as echarts from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { useEffect, useRef } from 'react'
import type { OpcionGrafico } from './opciones'

// Envoltorio único de ECharts: todos los gráficos de la web pasan por aquí,
// así heredan tema, animaciones, tooltips y redimensionado. Para añadir un
// tipo de gráfico nuevo (mapas, heatmaps, sankey…) se registra abajo.
echarts.use([
  LineChart,
  BarChart,
  HeatmapChart,
  GridComponent,
  TooltipComponent,
  DataZoomComponent,
  MarkLineComponent,
  VisualMapComponent,
  CanvasRenderer,
])

interface Props {
  opcion: OpcionGrafico
  alto: number
  /** Descripción para lectores de pantalla */
  etiqueta: string
  onClick?: (params: { name: string; dataIndex: number }) => void
}

export function Grafico({ opcion, alto, etiqueta, onClick }: Props) {
  const contenedor = useRef<HTMLDivElement>(null)
  const instancia = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    const el = contenedor.current!
    const grafico = echarts.init(el, null, { renderer: 'canvas' })
    instancia.current = grafico
    const observador = new ResizeObserver(() => grafico.resize())
    observador.observe(el)
    return () => {
      observador.disconnect()
      grafico.dispose()
      instancia.current = null
    }
  }, [])

  useEffect(() => {
    // Sin notMerge: ECharts anima la transición entre el estado anterior y el nuevo
    instancia.current?.setOption(opcion, { replaceMerge: ['series', 'dataZoom', 'visualMap'] })
  }, [opcion])

  useEffect(() => {
    const grafico = instancia.current
    if (!grafico || !onClick) return
    grafico.on('click', onClick as never)
    return () => {
      grafico.off('click', onClick as never)
    }
  }, [onClick])

  return <div ref={contenedor} role="img" aria-label={etiqueta} style={{ width: '100%', height: alto }} />
}
