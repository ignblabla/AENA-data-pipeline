import { useMediaQuery } from '@mantine/hooks'
import type { CSSProperties } from 'react'
import { Paleta, type TonoPaleta } from './Paleta'

export interface ColumnaTablero {
  titulo: string
  /** Celdas de paleta de la columna */
  ancho: number
  /** Celdas en pantallas estrechas, si son menos que en escritorio */
  anchoMovil?: number
  /** En pantallas estrechas el panel prescinde de las columnas menos importantes */
  ocultarEnMovil?: boolean
  alinear?: 'izquierda' | 'derecha'
}

export interface FilaTablero {
  id: string
  celdas: string[]
  estado: 'normal' | 'retraso' | 'cancelado'
  /** Tono de cada celda; por defecto, el que marca el estado en la última columna */
  tonos?: (TonoPaleta | undefined)[]
}

interface Props {
  columnas: ColumnaTablero[]
  filas: FilaTablero[]
  /** Filas fijas del panel: si hay menos datos, las que faltan quedan en blanco (la ausencia se ve) */
  numFilas: number
  etiqueta: string
  /** Tamaño máximo (px) de la letra de paleta; por debajo, se ajusta al ancho disponible */
  tamanoMax?: number
}

/**
 * Panel de salidas de paletas: una tabla semántica (lectores de pantalla y copiar/pegar
 * funcionan) cuyas celdas se pintan como paletas abatibles. Las filas caen en cascada,
 * escalonadas de arriba abajo.
 */
export function Tablero({ columnas, filas, numFilas, etiqueta, tamanoMax = 24 }: Props) {
  const movil = useMediaQuery('(max-width: 48em)')
  const visibles = columnas
    .map((c, i) => ({ ...c, i, ancho: movil && c.anchoMovil ? c.anchoMovil : c.ancho }))
    .filter((c) => !(movil && c.ocultarEnMovil))
  const relleno = Array.from({ length: Math.max(0, numFilas - filas.length) }, (_, k) => k)

  const estiloCelda: CSSProperties = { padding: '0.28em 0.9em 0.28em 0', verticalAlign: 'middle' }

  // La letra se ajusta para que todas las celdas quepan en el ancho del panel (unidades de contenedor):
  // cada celda ocupa 0,81 em (0,72 + hueco), cada columna 0,9 em de separación (un hueco de paleta), más la lámpara.
  const enEm = visibles.reduce((s, c) => s + c.ancho * 0.81 + 0.9, 0) + 1.4
  const tamano = `min(${tamanoMax}px, calc(100cqw / ${enEm.toFixed(2)}))`

  return (
    <div style={{ containerType: 'inline-size' }}>
      <table className="tablero" aria-label={etiqueta} style={{ fontSize: tamano, borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ width: '1.2em' }}>
              <span className="sr-only">Indicador</span>
            </th>
            {visibles.map((c) => (
              <th key={c.titulo} scope="col" className="tablero-cabecera" style={{ textAlign: 'left', paddingBottom: '0.5em' }}>
                {c.titulo}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, fila) => (
            <tr key={f.id} className="tablero-fila">
              <td style={estiloCelda}>
                <span className="lampara" data-estado={f.estado} />
              </td>
              {visibles.map((c, n) => {
                const ultima = n === visibles.length - 1
                const tono = f.tonos?.[c.i] ?? (ultima && f.estado === 'retraso' ? 'ambar' : ultima && f.estado === 'cancelado' ? 'rojo' : 'normal')
                return (
                  <td key={c.titulo} style={estiloCelda}>
                    <Paleta texto={f.celdas[c.i] ?? ''} ancho={c.ancho} tono={tono} alinear={c.alinear} retardo={fila * 110} />
                  </td>
                )
              })}
            </tr>
          ))}
          {relleno.map((k) => (
            <tr key={`vacia-${k}`} className="tablero-fila" aria-hidden>
              <td style={estiloCelda}>
                <span className="lampara" />
              </td>
              {visibles.map((c) => (
                <td key={c.titulo} style={estiloCelda}>
                  <Paleta texto="" ancho={c.ancho} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
