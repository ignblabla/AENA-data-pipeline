import { createTheme, type MantineColorsTuple } from '@mantine/core'

// Rampa azul (la misma que usan los gráficos) como color principal de la interfaz
const azul: MantineColorsTuple = [
  '#eaf2fd', '#cde2fb', '#b7d3f6', '#9ec5f4', '#6da7ec',
  '#3987e5', '#2a78d6', '#256abf', '#1c5cab', '#104281',
]

// Grises neutros cálidos para el modo oscuro: [7] fondo de página, [6] tarjetas, [4] bordes
const oscuro: MantineColorsTuple = [
  '#f0efec', '#c3c2b7', '#a3a299', '#898781', '#383835',
  '#2c2c2a', '#1a1a19', '#0d0d0d', '#0a0a0a', '#050505',
]

export const tema = createTheme({
  primaryColor: 'azul',
  primaryShade: { light: 6, dark: 5 },
  colors: { azul, dark: oscuro },
  white: '#fcfcfb',
  black: '#0b0b0b',
  defaultRadius: 'md',
  fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
  headings: { fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif', fontWeight: '650' },
})
