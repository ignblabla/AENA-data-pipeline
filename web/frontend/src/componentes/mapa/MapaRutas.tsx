import { MapboxOverlay } from '@deck.gl/mapbox'
import { PathLayer, ScatterplotLayer } from '@deck.gl/layers'
import { ActionIcon, Alert, Box, Group, Stack, Text, Tooltip } from '@mantine/core'
import { useReducedMotion } from '@mantine/hooks'
import { LngLatBounds, Map as MapaLibre, NavigationControl } from 'maplibre-gl'
import { useEffect, useMemo, useRef, useState } from 'react'
import { escapar } from '../../tema/formato'
import type { TokensGrafico } from '../../tema/tokens'
import { textos } from '../../textos'
import { useTokens } from '../graficos/opciones'
import { ocultarTextosAlCargar, opcionesBase, soportaWebGL } from './base'
import { arcoGeodesico, distanciaKm, rgba, tramo, type Coordenada } from './geo'

export interface RutaMapa {
  id: string
  desde: Coordenada
  hasta: Coordenada
  salidas: number
  /** Valor de la métrica activa (decide el color si colorPorValor) */
  valor: number | null
  titulo: string
  lineas: [string, string][]
}

export interface PuntoRutas {
  iata: string
  coordenada: Coordenada
  salidas: number
  titulo: string
  lineas: [string, string][]
}

interface Props {
  rutas: RutaMapa[]
  destinos: PuntoRutas[]
  origenes: PuntoRutas[]
  colorPorValor: boolean
  formatear: (v: number | null) => string
  alto: number
}

// Animación: los aviones recorren las rutas más frecuentes a velocidad constante
const MAX_ANIMADAS = 250
const MS_POR_KM = 1.6
const DURACION_MIN_MS = 1800
const PAUSA_MS = 900 // tiempo "en tierra" entre un vuelo y el siguiente de la misma ruta
const ESTELA = 0.14 // fracción del recorrido que ocupa la estela

interface RutaPreparada extends RutaMapa {
  trazo: Coordenada[]
  duracion: number
  fase: number
}

/** Desfase pseudoaleatorio pero estable por ruta, para que no despeguen todos a la vez. */
function fasePara(id: string, periodo: number): number {
  let h = 0
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h % periodo
}

/**
 * Mapa de rutas: arcos de círculo máximo desde los aeropuertos de origen a
 * cada destino (grosor = salidas, color = métrica), con aviones animados en
 * las rutas más frecuentes. Capas de deck.gl sobre un mapa base de MapLibre.
 */
export function MapaRutas({ rutas, destinos, origenes, colorPorValor, formatear, alto }: Props) {
  const t = useTokens()
  const contenedor = useRef<HTMLDivElement>(null)
  const mapa = useRef<MapaLibre | null>(null)
  const overlay = useRef<MapboxOverlay | null>(null)
  const [sinWebGL] = useState(() => !soportaWebGL())
  const movimientoReducido = useReducedMotion()
  const [pausado, setPausado] = useState(false)
  const animando = !pausado && !movimientoReducido
  // Estilo aplicado al mapa y tokens actuales (los lee el tooltip de deck.gl)
  const estiloAplicado = useRef(t.estiloMapa)
  const tokens = useRef(t)

  const preparadas = useMemo<RutaPreparada[]>(
    () =>
      rutas.map((r) => {
        const duracion = Math.max(DURACION_MIN_MS, distanciaKm(r.desde, r.hasta) * MS_POR_KM)
        return { ...r, trazo: arcoGeodesico(r.desde, r.hasta), duracion, fase: fasePara(r.id, duracion + PAUSA_MS) }
      }),
    [rutas],
  )

  // Capas estáticas (rutas, destinos, orígenes): se recalculan solo si cambian datos o tema
  const capasFijas = useMemo(() => {
    const max = Math.max(1, ...rutas.map((r) => r.salidas))
    const valores = rutas.map((r) => r.valor).filter((v): v is number => v !== null)
    const min = Math.min(...valores)
    const maxValor = Math.max(...valores)
    const colorDe = (v: number | null) => {
      if (!colorPorValor || v === null) return rgba(t.serie, 110)
      const f = maxValor > min ? (v - min) / (maxValor - min) : 0.5
      return rgba(t.rampa[Math.round(f * (t.rampa.length - 1))], 170)
    }
    const maxDestino = Math.max(1, ...destinos.map((d) => d.salidas))

    return [
      new PathLayer<RutaPreparada>({
        id: 'rutas',
        data: preparadas,
        getPath: (r) => r.trazo,
        getWidth: (r) => 0.6 + 4.4 * Math.sqrt(r.salidas / max),
        widthUnits: 'pixels',
        getColor: (r) => colorDe(r.valor),
        capRounded: true,
        jointRounded: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: rgba(t.destacado, 230),
        updateTriggers: { getColor: [colorPorValor, t] },
      }),
      new ScatterplotLayer<PuntoRutas>({
        id: 'destinos',
        data: destinos,
        getPosition: (d) => d.coordenada,
        getRadius: (d) => 2 + 6 * Math.sqrt(d.salidas / maxDestino),
        radiusUnits: 'pixels',
        getFillColor: rgba(t.serie, 230),
        getLineColor: rgba(t.superficie, 255),
        lineWidthUnits: 'pixels',
        getLineWidth: 1,
        stroked: true,
        pickable: true,
        autoHighlight: true,
        highlightColor: rgba(t.destacado, 255),
        updateTriggers: { getFillColor: [t], getLineColor: [t] },
      }),
      new ScatterplotLayer<PuntoRutas>({
        id: 'origenes',
        data: origenes,
        getPosition: (d) => d.coordenada,
        getRadius: 6,
        radiusUnits: 'pixels',
        getFillColor: rgba(t.destacado, 255),
        getLineColor: rgba(t.superficie, 255),
        lineWidthUnits: 'pixels',
        getLineWidth: 2,
        stroked: true,
        pickable: true,
        updateTriggers: { getFillColor: [t], getLineColor: [t] },
      }),
    ]
  }, [preparadas, rutas, destinos, origenes, colorPorValor, t])

  // Creación del mapa y de la capa de deck.gl (una sola vez)
  useEffect(() => {
    if (sinWebGL) return
    const m = new MapaLibre({ ...opcionesBase(estiloAplicado.current), container: contenedor.current!, center: [0, 35], zoom: 1.6, minZoom: 1 })
    m.addControl(new NavigationControl({ showCompass: false }), 'top-right')
    ocultarTextosAlCargar(m)
    const o = new MapboxOverlay({ interleaved: false, layers: [], getTooltip: ({ object }) => tooltip(object, tokens.current) })
    // La capa de deck.gl se añade cuando el mapa base ha terminado de cargar: si se añade
    // antes, el estilo de MapLibre 6 se queda a medio cargar y no se dibuja el mapa base.
    // Las capas que se le pasen mientras tanto (setProps) se guardan y se pintan al añadirla.
    let anadida = false
    m.once('load', () => {
      m.addControl(o)
      anadida = true
    })
    mapa.current = m
    overlay.current = o
    return () => {
      if (anadida) m.removeControl(o)
      m.remove()
      mapa.current = null
      overlay.current = null
    }
  }, [sinWebGL])

  // Cambio de tema claro/oscuro
  useEffect(() => {
    tokens.current = t
    if (mapa.current && estiloAplicado.current !== t.estiloMapa) {
      estiloAplicado.current = t.estiloMapa
      mapa.current.setStyle(t.estiloMapa)
    }
  }, [t])

  // Encuadre: todos los orígenes y destinos visibles
  useEffect(() => {
    const m = mapa.current
    const puntos = [...origenes, ...destinos].map((p) => p.coordenada)
    if (!m || puntos.length === 0) return
    const limites = puntos.reduce((b, c) => b.extend(c), new LngLatBounds(puntos[0], puntos[0]))
    m.fitBounds(limites, { padding: 40, maxZoom: 5, duration: 800 })
  }, [origenes, destinos])

  // Pintado: capas fijas + aviones. Con animación, un fotograma por requestAnimationFrame.
  useEffect(() => {
    const o = overlay.current
    if (!o) return
    const animadas = [...preparadas].sort((a, b) => b.salidas - a.salidas).slice(0, MAX_ANIMADAS)

    const pintar = (ahora: number) => {
      const vuelos = animando
        ? animadas.flatMap((r) => {
            const p = ((ahora + r.fase) % (r.duracion + PAUSA_MS)) / r.duracion
            return p <= 1 ? [{ estela: tramo(r.trazo, p - ESTELA, p), cabeza: tramo(r.trazo, p, p)[0] }] : []
          })
        : []
      o.setProps({
        layers: [
          ...capasFijas,
          new PathLayer({
            id: 'estelas',
            data: vuelos,
            getPath: (v) => v.estela,
            getWidth: 2,
            widthUnits: 'pixels',
            getColor: rgba(t.destacado, 200),
            capRounded: true,
          }),
          new ScatterplotLayer({
            id: 'aviones',
            data: vuelos,
            getPosition: (v) => v.cabeza,
            getRadius: 2.5,
            radiusUnits: 'pixels',
            getFillColor: rgba(t.destacado, 255),
          }),
        ],
      })
    }

    if (!animando) {
      pintar(0)
      return
    }
    let fotograma = requestAnimationFrame(function bucle(ahora) {
      pintar(ahora)
      fotograma = requestAnimationFrame(bucle)
    })
    return () => cancelAnimationFrame(fotograma)
  }, [capasFijas, preparadas, animando, t])

  if (sinWebGL) {
    return (
      <Alert color="gray" variant="light" mih={alto}>
        {textos.mapa.sinWebGL}
      </Alert>
    )
  }

  const valores = rutas.map((r) => r.valor).filter((v): v is number => v !== null)

  return (
    <Stack gap="xs">
      <Box pos="relative" h={alto} className="mapa-aeropuertos">
        <div ref={contenedor} style={{ position: 'absolute', inset: 0, borderRadius: 'var(--mantine-radius-md)', overflow: 'hidden' }} />
        {!movimientoReducido && (
          <Tooltip label={pausado ? textos.rutas.reanudar : textos.rutas.pausar}>
            <ActionIcon
              variant="default"
              pos="absolute"
              top={10}
              left={10}
              onClick={() => setPausado((p) => !p)}
              aria-label={pausado ? textos.rutas.reanudar : textos.rutas.pausar}
            >
              {pausado ? <IconoPlay /> : <IconoPausa />}
            </ActionIcon>
          </Tooltip>
        )}
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

/** Tooltip de deck.gl: título y líneas, con el texto de los datos escapado. */
function tooltip(objeto: unknown, t: TokensGrafico) {
  const o = objeto as { titulo?: string; lineas?: [string, string][] } | null
  if (!o?.titulo) return null
  const filas = (o.lineas ?? [])
    .map(([k, v]) => `<div style="margin-top:2px"><strong>${escapar(v)}</strong> <span style="opacity:.75">${escapar(k)}</span></div>`)
    .join('')
  return {
    html: `<div style="font-weight:600">${escapar(o.titulo)}</div>${filas}`,
    style: {
      background: t.tooltipFondo,
      color: t.textoPrincipal,
      border: `1px solid ${t.tooltipBorde}`,
      borderRadius: '8px',
      padding: '8px 12px',
      fontSize: '13px',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
    },
  }
}

function IconoPausa() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="6" y="4" width="4" height="16" rx="1" />
      <rect x="14" y="4" width="4" height="16" rx="1" />
    </svg>
  )
}

function IconoPlay() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M7 4.5v15a1 1 0 0 0 1.5.86l12-7.5a1 1 0 0 0 0-1.72l-12-7.5A1 1 0 0 0 7 4.5z" />
    </svg>
  )
}
