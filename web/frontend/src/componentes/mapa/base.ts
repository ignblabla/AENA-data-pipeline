import 'maplibre-gl/dist/maplibre-gl.css'
import './mapa.css'

import { setWorkerUrl, type Map as MapaLibre, type MapOptions } from 'maplibre-gl'
import urlWorker from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'

// Piezas comunes a todos los mapas de la web (MapLibre GL).

// MapLibre dibuja las teselas en un web worker que busca junto a su propio archivo;
// Vite reempaqueta la librería y esa ruta deja de existir, así que se indica explícitamente.
setWorkerUrl(urlWorker)

/** Opciones de partida: sin rotación ni zoom con la rueda (la rueda sigue desplazando la página). */
export function opcionesBase(estilo: string): Omit<MapOptions, 'container'> {
  return {
    style: estilo,
    attributionControl: { compact: true },
    dragRotate: false,
    pitchWithRotate: false,
    scrollZoom: false,
    renderWorldCopies: false,
    fadeDuration: 0,
  }
}

/** Oculta los textos del mapa base: van en inglés y compiten con las etiquetas propias. */
export function ocultarTextosAlCargar(mapa: MapaLibre) {
  mapa.on('style.load', () => {
    for (const capa of mapa.getStyle().layers) {
      if (capa.type === 'symbol') mapa.setLayoutProperty(capa.id, 'visibility', 'none')
    }
  })
}

export function soportaWebGL(): boolean {
  try {
    const lienzo = document.createElement('canvas')
    return !!(lienzo.getContext('webgl2') ?? lienzo.getContext('webgl'))
  } catch {
    return false
  }
}
