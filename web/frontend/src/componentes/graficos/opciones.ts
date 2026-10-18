import { useComputedColorScheme } from '@mantine/core'
import type { EChartsCoreOption } from 'echarts/core'
import { escapar } from '../../tema/formato'
import { TOKENS, type TokensGrafico } from '../../tema/tokens'

// Piezas comunes para construir las opciones de cualquier gráfico ECharts
// con el tema de la web (tipografía, tooltip, ejes, animación).

export type OpcionGrafico = EChartsCoreOption

export function useTokens(): TokensGrafico {
  return TOKENS[useComputedColorScheme('light')]
}

/** Opciones comunes a todos los gráficos: tipografía, tooltip, animación. */
export function opcionBase(t: TokensGrafico): OpcionGrafico {
  return {
    backgroundColor: 'transparent',
    textStyle: { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', color: t.textoSecundario },
    animationDuration: 600,
    animationDurationUpdate: 400,
    animationEasing: 'cubicOut',
    tooltip: {
      backgroundColor: t.tooltipFondo,
      borderColor: t.tooltipBorde,
      borderWidth: 1,
      padding: [8, 12],
      textStyle: { color: t.textoPrincipal, fontSize: 13 },
      extraCssText: 'box-shadow: 0 4px 16px rgba(0,0,0,0.12); border-radius: 8px;',
    },
  }
}

/** Ejes con rejilla fina y discreta. */
export function ejeValor(t: TokensGrafico, formatear: (v: number) => string): OpcionGrafico {
  return {
    type: 'value',
    axisLabel: { color: t.textoTenue, formatter: formatear },
    splitLine: { lineStyle: { color: t.rejilla, width: 1 } },
    axisLine: { show: false },
    axisTick: { show: false },
  }
}

export function ejeCategoria(t: TokensGrafico): OpcionGrafico {
  return {
    type: 'category',
    axisLabel: { color: t.textoTenue },
    axisLine: { lineStyle: { color: t.eje } },
    axisTick: { show: false },
  }
}

/** Fila de tooltip: el valor manda, la etiqueta acompaña; la clave de color es una línea corta. */
export function filaTooltip(color: string, etiqueta: string, valor: string): string {
  return (
    `<div style="display:flex;align-items:center;gap:8px;margin-top:4px">` +
    `<span style="width:12px;height:2px;border-radius:1px;background:${color}"></span>` +
    `<strong>${escapar(valor)}</strong><span style="opacity:.75">${escapar(etiqueta)}</span></div>`
  )
}

export function tituloTooltip(texto: string): string {
  return `<div style="font-weight:600">${escapar(texto)}</div>`
}
