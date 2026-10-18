import { Alert, Box, Group, Stack, Text } from '@mantine/core'
import { Map as MapaLibre, Marker, NavigationControl, Popup, type LngLatBoundsLike } from 'maplibre-gl'
import { useEffect, useRef, useState } from 'react'
import { useTokens } from '../graficos/opciones'
import { textos } from '../../textos'
import { ocultarTextosAlCargar, opcionesBase, soportaWebGL } from './base'

export interface PuntoMapa {
  iata: string
  nombre: string
  lat: number
  lon: number
  /** Determina el tamaño del círculo */
  salidas: number
  /** Determina el color del círculo (null = sin dato) */
  valor: number | null
  /** Líneas del tooltip: [etiqueta, valor formateado]; la primera es la principal */
  lineas: [string, string][]
}

interface Props {
  puntos: PuntoMapa[]
  /** true: color por valor (rampa); false: todos del color principal */
  colorPorValor: boolean
  /** Formato de los valores en la leyenda de color */
  formatear: (v: number | null) => string
  onSeleccionar: (iata: string) => void
  alto: number
}

// Encuadres: península + Baleares (con margen al oeste, donde va el recuadro), y Canarias
const ENCUADRE_PRINCIPAL: LngLatBoundsLike = [[-14.5, 35.6], [4.8, 43.9]]
const ENCUADRE_CANARIAS: LngLatBoundsLike = [[-18.4, 27.4], [-13.2, 29.5]]
const esCanarias = (p: PuntoMapa) => p.lon < -12
// Aeropuertos tan cercanos que su etiqueta se pondría encima del vecino
const ETIQUETA_A_LA_IZQUIERDA = new Set(['TFS', 'PMI'])

const DIAMETRO_MIN = 10
const DIAMETRO_MAX = 52

/**
 * Mapa de los aeropuertos: el tamaño del círculo es proporcional (en área) a
 * las salidas y el color, a la métrica activa. Pulsar un aeropuerto abre su detalle.
 */
export function MapaAeropuertos({ puntos, colorPorValor, formatear, onSeleccionar, alto }: Props) {
  const t = useTokens()
  const principal = useRef<HTMLDivElement>(null)
  const canarias = useRef<HTMLDivElement>(null)
  const mapas = useRef<MapaLibre[]>([])
  const marcadores = useRef(new Map<string, { marcador: Marker; elemento: HTMLButtonElement; popup: Popup }>())
  const seleccionar = useRef(onSeleccionar)
  const [sinWebGL] = useState(() => !soportaWebGL())
  // El estilo inicial se fija al crear los mapas; los cambios de tema van en otro efecto
  const estiloInicial = useRef(t.estiloMapa)

  useEffect(() => {
    seleccionar.current = onSeleccionar
  }, [onSeleccionar])

  // Creación de los dos mapas (una sola vez)
  useEffect(() => {
    if (sinWebGL) return
    const comunes = opcionesBase(estiloInicial.current)
    const mapa = new MapaLibre({ ...comunes, container: principal.current!, bounds: ENCUADRE_PRINCIPAL, fitBoundsOptions: { padding: 24 } })
    mapa.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    const recuadro = new MapaLibre({
      ...comunes,
      container: canarias.current!,
      bounds: ENCUADRE_CANARIAS,
      fitBoundsOptions: { padding: 12 },
      interactive: false,
      attributionControl: false,
    })
    const creados = [mapa, recuadro]
    mapas.current = creados
    creados.forEach(ocultarTextosAlCargar)
    const listaMarcadores = marcadores.current

    const observador = new ResizeObserver(() => creados.forEach((m) => m.resize()))
    observador.observe(principal.current!)
    return () => {
      observador.disconnect()
      listaMarcadores.forEach(({ marcador, popup }) => {
        popup.remove()
        marcador.remove()
      })
      listaMarcadores.clear()
      creados.forEach((m) => m.remove())
      mapas.current = []
    }
  }, [sinWebGL])

  // Cambio de tema claro/oscuro: se cambia el mapa base (los marcadores son HTML y se conservan)
  useEffect(() => {
    mapas.current.forEach((m) => m.setStyle(t.estiloMapa))
  }, [t.estiloMapa])

  // Marcadores: se crean una vez por aeropuerto y después solo se actualiza su
  // tamaño y color, para que las transiciones CSS animen el cambio.
  useEffect(() => {
    const [mapa, recuadro] = mapas.current
    if (!mapa) return

    const maxSalidas = Math.max(1, ...puntos.map((p) => p.salidas))
    const valores = puntos.map((p) => p.valor).filter((v): v is number => v !== null)
    const min = Math.min(...valores)
    const max = Math.max(...valores)
    const colorDe = (v: number | null) => {
      if (!colorPorValor) return t.serie
      if (v === null) return t.eje
      const fraccion = max > min ? (v - min) / (max - min) : 0.5
      return t.rampa[Math.round(fraccion * (t.rampa.length - 1))]
    }

    const visibles = new Set(puntos.map((p) => p.iata))
    for (const [iata, { marcador, popup }] of marcadores.current) {
      if (!visibles.has(iata)) {
        popup.remove()
        marcador.remove()
        marcadores.current.delete(iata)
      }
    }

    for (const p of puntos) {
      let entrada = marcadores.current.get(p.iata)
      if (!entrada) {
        const elemento = document.createElement('button')
        elemento.type = 'button'
        elemento.className = ETIQUETA_A_LA_IZQUIERDA.has(p.iata) ? 'burbuja-aeropuerto etiqueta-izquierda' : 'burbuja-aeropuerto'
        const circulo = document.createElement('span')
        circulo.className = 'burbuja-circulo'
        const etiqueta = document.createElement('span')
        etiqueta.className = 'burbuja-etiqueta'
        etiqueta.textContent = p.iata
        elemento.append(circulo, etiqueta)

        const destino = esCanarias(p) ? recuadro : mapa
        const popup = new Popup({ closeButton: false, closeOnClick: false, offset: 14, className: 'popup-aeropuerto', maxWidth: '260px' })
        const marcador = new Marker({ element: elemento, anchor: 'center' }).setLngLat([p.lon, p.lat]).addTo(destino)

        elemento.addEventListener('click', () => seleccionar.current(p.iata))
        const mostrar = () => popup.setLngLat([p.lon, p.lat]).addTo(destino)
        const ocultar = () => popup.remove()
        elemento.addEventListener('mouseenter', mostrar)
        elemento.addEventListener('mouseleave', ocultar)
        elemento.addEventListener('focus', mostrar)
        elemento.addEventListener('blur', ocultar)

        entrada = { marcador, elemento, popup }
        marcadores.current.set(p.iata, entrada)
      }

      const diametro = DIAMETRO_MIN + (DIAMETRO_MAX - DIAMETRO_MIN) * Math.sqrt(p.salidas / maxSalidas)
      entrada.elemento.style.setProperty('--diametro', `${diametro}px`)
      entrada.elemento.style.setProperty('--color', colorDe(p.valor))
      entrada.elemento.setAttribute('aria-label', `${p.nombre}: ${p.lineas.map(([k, v]) => `${k} ${v}`).join(', ')}. ${textos.mapa.verDetalle}`)
      entrada.popup.setDOMContent(contenidoPopup(p))
    }
  }, [puntos, colorPorValor, t])

  if (sinWebGL) {
    return (
      <Alert color="gray" variant="light" mih={alto}>
        {textos.mapa.sinWebGL}
      </Alert>
    )
  }

  const valores = puntos.map((p) => p.valor).filter((v): v is number => v !== null)

  return (
    <Stack gap="xs">
      <Box pos="relative" h={alto} className="mapa-aeropuertos">
        <div ref={principal} style={{ position: 'absolute', inset: 0, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }} />
        <div className="recuadro-canarias" aria-label={textos.mapa.canarias}>
          <div ref={canarias} style={{ position: 'absolute', inset: 0 }} />
          <span className="recuadro-titulo">{textos.mapa.canarias}</span>
        </div>
      </Box>
      {colorPorValor && valores.length > 0 && (
        <Group gap="xs" justify="flex-end" wrap="nowrap">
          <Text size="xs" c="dimmed">
            {formatear(Math.min(...valores))}
          </Text>
          <Box w={140} h={8} style={{ borderRadius: 4, background: `linear-gradient(to right, ${t.rampa.join(', ')})` }} aria-hidden />
          <Text size="xs" c="dimmed">
            {formatear(Math.max(...valores))}
          </Text>
        </Group>
      )}
    </Stack>
  )
}

/** Contenido del tooltip, construido con textContent (nunca HTML a partir de datos). */
function contenidoPopup(p: PuntoMapa): HTMLElement {
  const raiz = document.createElement('div')
  const titulo = document.createElement('div')
  titulo.className = 'popup-titulo'
  titulo.textContent = `${p.iata} · ${p.nombre}`
  raiz.append(titulo)
  p.lineas.forEach(([etiqueta, valor], i) => {
    const fila = document.createElement('div')
    fila.className = i === 0 ? 'popup-fila popup-principal' : 'popup-fila'
    const v = document.createElement('strong')
    v.textContent = valor
    const e = document.createElement('span')
    e.textContent = etiqueta
    fila.append(v, e)
    raiz.append(fila)
  })
  const pie = document.createElement('div')
  pie.className = 'popup-pie'
  pie.textContent = textos.mapa.verDetalle
  raiz.append(pie)
  return raiz
}
