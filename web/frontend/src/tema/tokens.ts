// Tokens de color de los gráficos, en claro y oscuro. Todos los gráficos
// leen de aquí: cambiar la marca visual es cambiar este archivo.
// Valores validados (contraste y daltonismo) de la paleta de referencia.

export interface TokensGrafico {
  superficie: string
  textoPrincipal: string
  textoSecundario: string
  textoTenue: string
  rejilla: string
  eje: string
  serie: string // color principal de datos (secuencial azul)
  serieSuave: string // relleno de área (~10 %)
  serieAtenuada: string // barras de contexto / no seleccionadas
  destacado: string // el paso de la rampa con más contraste sobre el fondo (estelas, origen de rutas)
  tooltipFondo: string
  tooltipBorde: string
  /** Rampa secuencial azul (de "poco" a "mucho") para mapas de calor y mapas */
  rampa: string[]
  /** Texto de variaciones favorables / desfavorables (siempre con icono, nunca solo color) */
  textoBueno: string
  textoMalo: string
  /** Estilo vectorial del mapa base (CARTO, gratuito con atribución) */
  estiloMapa: string
}

export const TOKENS: Record<'light' | 'dark', TokensGrafico> = {
  light: {
    superficie: '#fcfcfb',
    textoPrincipal: '#0b0b0b',
    textoSecundario: '#52514e',
    textoTenue: '#898781',
    rejilla: '#e1e0d9',
    eje: '#c3c2b7',
    serie: '#2a78d6',
    serieSuave: 'rgba(42, 120, 214, 0.10)',
    serieAtenuada: '#b7d3f6',
    destacado: '#0d366b',
    tooltipFondo: '#fcfcfb',
    tooltipBorde: 'rgba(11, 11, 11, 0.10)',
    rampa: ['#cde2fb', '#9ec5f4', '#6da7ec', '#3987e5', '#256abf', '#184f95', '#0d366b'],
    textoBueno: '#006300',
    textoMalo: '#d03b3b',
    estiloMapa: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  dark: {
    superficie: '#1a1a19',
    textoPrincipal: '#f0efec',
    textoSecundario: '#c3c2b7',
    textoTenue: '#898781',
    rejilla: '#2c2c2a',
    eje: '#383835',
    serie: '#3987e5',
    serieSuave: 'rgba(57, 135, 229, 0.12)',
    serieAtenuada: '#184f95',
    destacado: '#cde2fb',
    tooltipFondo: '#1a1a19',
    tooltipBorde: 'rgba(255, 255, 255, 0.10)',
    // En oscuro, "poco" es el paso más cercano al fondo y "mucho" el más luminoso
    rampa: ['#184f95', '#1c5cab', '#256abf', '#2a78d6', '#3987e5', '#6da7ec', '#9ec5f4'],
    textoBueno: '#0ca30c',
    textoMalo: '#e66767',
    estiloMapa: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
}
