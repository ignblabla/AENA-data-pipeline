import { useReducedMotion } from '@mantine/hooks'
import { useEffect, useMemo, useRef } from 'react'

// Caracteres que "pasan" por la paleta antes de quedarse en el definitivo
const ROTACION = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
const MS_POR_PASO = 55
const MS_ENTRE_CELDAS = 22

export type TonoPaleta = 'normal' | 'ambar' | 'rojo'

interface Props {
  texto: string
  /** Número fijo de celdas: el texto se recorta o se rellena */
  ancho: number
  tono?: TonoPaleta
  /** Retardo (ms) antes de que empiece la cascada, para escalonar filas */
  retardo?: number
  alinear?: 'izquierda' | 'derecha'
}

/**
 * Texto en paletas abatibles: cada carácter ocupa una celda fija y, al cambiar,
 * gira por varios caracteres en cascada antes de asentarse. La animación toca el
 * DOM directamente (sin re-renderizar React), así un panel entero sigue fluido.
 * El texto real va siempre en un span accesible; las celdas son decorativas.
 */
export function Paleta({ texto, ancho, tono = 'normal', retardo = 0, alinear = 'izquierda' }: Props) {
  const celdas = useRef<(HTMLSpanElement | null)[]>([])
  const reducido = useReducedMotion()

  const objetivo = useMemo(() => {
    const t = texto.toUpperCase().slice(0, ancho)
    const relleno = ' '.repeat(ancho - t.length)
    return [...(alinear === 'derecha' ? relleno + t : t + relleno)]
  }, [texto, ancho, alinear])

  useEffect(() => {
    const temporizadores: number[] = []
    objetivo.forEach((caracter, i) => {
      const celda = celdas.current[i]
      if (!celda || celda.textContent === caracter) return
      if (reducido) {
        celda.textContent = caracter
        return
      }
      // Cada celda da entre 2 y 5 vueltas: la variación evita un barrido mecánico uniforme
      const pasos = 2 + ((i * 7 + caracter.charCodeAt(0)) % 4)
      const inicio = retardo + i * MS_ENTRE_CELDAS
      for (let paso = 1; paso <= pasos; paso++) {
        temporizadores.push(
          window.setTimeout(() => {
            celda.textContent = paso === pasos ? caracter : ROTACION[Math.floor(Math.random() * ROTACION.length)]
            celda.classList.remove('cae')
            void celda.offsetWidth // reinicia la animación de caída
            celda.classList.add('cae')
          }, inicio + paso * MS_POR_PASO),
        )
      }
    })
    return () => temporizadores.forEach(window.clearTimeout)
  }, [objetivo, reducido, retardo])

  return (
    <span className="paleta" data-tono={tono}>
      <span className="sr-only">{texto}</span>
      {Array.from({ length: ancho }, (_, i) => (
        <span
          key={i}
          aria-hidden
          className="paleta-celda"
          ref={(el) => {
            celdas.current[i] = el
          }}
        />
      ))}
    </span>
  )
}
