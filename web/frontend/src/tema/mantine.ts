import '@fontsource/barlow-condensed/500.css'
import '@fontsource/barlow-condensed/600.css'
import '@fontsource/barlow-condensed/700.css'

import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Ámbar de lámpara: la acción principal y lo que está cambiando ahora. [5] es la tinta del mundo (#f2a900).
const ambar: MantineColorsTuple = [
  '#fff8e1', '#ffeeb8', '#ffe28a', '#ffd55c', '#f8c22e',
  '#f2a900', '#d99500', '#b87d00', '#946400', '#704b00',
]

// Acero: neutros fríos del marco y del vestíbulo
const acero: MantineColorsTuple = [
  '#f7f8f8', '#eef0f1', '#dcdfe1', '#c9ccce', '#a9aeb2',
  '#8e9296', '#6b7177', '#4a4f54', '#2c3034', '#141414',
]

// Vestíbulo de noche: [7] suelo, [6] paneles, [4] bordes, [0] pintura
const oscuro: MantineColorsTuple = [
  '#f2efe6', '#c4c0b6', '#a19d94', '#8f8b83', '#3a3e42',
  '#26292c', '#17191b', '#0e0f10', '#0a0b0c', '#050506',
]

export const FUENTE_PALETA = '"Barlow Condensed", "Arial Narrow", sans-serif'
const FUENTE_TEXTO = 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif'

export const tema = createTheme({
  primaryColor: 'ambar',
  primaryShade: { light: 5, dark: 5 },
  autoContrast: true,
  luminanceThreshold: 0.45,
  colors: { ambar, acero, dark: oscuro },
  white: '#f7f8f8',
  black: '#141414',
  defaultRadius: 'xs',
  radius: { xs: '2px', sm: '3px', md: '4px', lg: '6px', xl: '8px' },
  fontFamily: FUENTE_TEXTO,
  fontFamilyMonospace: 'ui-monospace, "Cascadia Mono", Consolas, monospace',
  headings: {
    fontFamily: FUENTE_PALETA,
    fontWeight: '700',
    sizes: {
      h1: { fontSize: '2.75rem', lineHeight: '1' },
      h2: { fontSize: '2.75rem', lineHeight: '1' },
      h3: { fontSize: '1.25rem', lineHeight: '1.15' },
    },
  },
  focusRing: 'auto',
  cursorType: 'pointer',
  components: {
    Card: { defaultProps: { radius: 'md' } },
  },
})
