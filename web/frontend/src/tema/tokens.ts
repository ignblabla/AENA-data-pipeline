// Tokens del mundo visual "panel de paletas": cuatro tintas sobre acero.
//   negro de paleta · blanco de pintura · ámbar de lámpara (solo retraso / lo que cambia) · rojo (solo cancelado)
// De día el suelo es acero cepillado claro; de noche, el vestíbulo oscuro. El panel es siempre negro.
// Todos los gráficos y mapas leen de aquí: cambiar el mundo es cambiar este archivo.

export const TINTAS = {
  paleta: '#141414', // cara negra mate de la paleta
  pintura: '#f2efe6', // letra pintada
  ambar: '#f2a900', // lámpara de retraso; también la acción principal
  rojo: '#c8372d', // cancelado
  acero: '#8e9296', // marco del panel
}

export interface TokensGrafico {
  superficie: string
  textoPrincipal: string
  textoSecundario: string
  textoTenue: string
  rejilla: string
  eje: string
  /** Tinta de los datos: negro sobre acero de día, pintura sobre negro de noche */
  serie: string
  serieSuave: string
  serieAtenuada: string
  /** El paso con más contraste (estelas del mapa de rutas, orígenes) */
  destacado: string
  tooltipFondo: string
  tooltipBorde: string
  /** Rampa secuencial de una sola tinta, de "poco" (cerca del fondo) a "mucho" */
  rampa: string[]
  textoBueno: string
  textoMalo: string
  /** Estilo vectorial del mapa base (CARTO, gratuito con atribución) */
  estiloMapa: string
}

export const TOKENS: Record<'light' | 'dark', TokensGrafico> = {
  light: {
    superficie: '#eef0f1',
    textoPrincipal: '#141414',
    textoSecundario: '#41464b',
    textoTenue: '#656b71',
    rejilla: '#d3d7da',
    eje: '#a9aeb2',
    serie: '#141414',
    serieSuave: 'rgba(20, 20, 20, 0.07)',
    serieAtenuada: '#b3b8bc',
    destacado: '#141414',
    tooltipFondo: '#f7f8f8',
    tooltipBorde: 'rgba(20, 20, 20, 0.16)',
    rampa: ['#d3d7da', '#aeb3b8', '#868c92', '#5f656b', '#3c4146', '#262a2e', '#141414'],
    // La paleta es cerrada: lo favorable va en tinta (la flecha y el texto lo explican); lo desfavorable, en rojo
    textoBueno: '#141414',
    textoMalo: '#b5302a',
    estiloMapa: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
  },
  dark: {
    superficie: '#17191b',
    textoPrincipal: '#f2efe6',
    textoSecundario: '#c4c0b6',
    textoTenue: '#8f8b83',
    rejilla: '#26292c',
    eje: '#3a3e42',
    serie: '#f2efe6',
    serieSuave: 'rgba(242, 239, 230, 0.08)',
    serieAtenuada: '#4a4e52',
    destacado: '#f2efe6',
    tooltipFondo: '#0b0c0d',
    tooltipBorde: 'rgba(242, 239, 230, 0.16)',
    rampa: ['#2b2e31', '#44484c', '#62666a', '#85888b', '#aaaaa6', '#cfccc3', '#f2efe6'],
    textoBueno: '#f2efe6',
    textoMalo: '#e0564c',
    estiloMapa: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
  },
}
