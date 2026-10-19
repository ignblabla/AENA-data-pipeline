import { Table, Text, UnstyledButton } from '@mantine/core'
import { AnimatePresence, motion } from 'motion/react'
import type { VueloPanel } from '../../api/tipos'
import { formato } from '../../tema/formato'
import { textos } from '../../textos'
import { InsigniaEstado, InsigniaRetraso } from './Insignias'
import clases from './PanelSalidas.module.css'
import { codigoVuelo } from './utilidades'

const FilaAnimada = motion.create(Table.Tr)

interface Props {
  vuelos: VueloPanel[]
  /** Momento de la foto del panel: las horas de otro día llevan la fecha debajo */
  referencia: string
  onAbrir: (clave: string) => void
}

const dia = (iso: string) => iso.slice(0, 10)
const MAX_PILA = 6

/** Fecha corta solo si el instante no es del mismo día que la referencia. */
function FechaSiOtroDia({ iso, referencia }: { iso: string | null | undefined; referencia: string }) {
  if (!iso || dia(iso) === dia(referencia)) return null
  return <span className={clases.fecha}>{formato.diaCorto(dia(iso))}</span>
}

/**
 * La profundidad es el tiempo: detrás del estado actual asoman tantas paletas como
 * cambios ha tenido el vuelo (hasta seis), y el número exacto al lado.
 */
function PilaCambios({ n }: { n: number }) {
  const capas = Math.min(n, MAX_PILA)
  return (
    <span className={clases.pila} title={textos.directo.cambios(n)}>
      <span className={clases.capas} aria-hidden>
        {Array.from({ length: capas }, (_, i) => (
          <span key={i} className={clases.capa} style={{ opacity: 0.25 + (0.75 * (i + 1)) / capas }} />
        ))}
      </span>
      <span className={clases.numeroCambios}>{textos.directo.cambios(n)}</span>
    </span>
  )
}

/**
 * Panel de salidas: el mismo panel negro de paletas en los dos temas. Es una tabla
 * semántica; las filas entran y salen con suavidad y se recolocan con datos nuevos.
 */
export function PanelSalidas({ vuelos, referencia, onAbrir }: Props) {
  return (
    <div className="marco-panel">
      <div className={`panel-negro ${clases.panel}`}>
        <Table.ScrollContainer minWidth={820} type="native">
          <Table verticalSpacing={10} className={clases.tabla}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>{textos.columnas.hora}</Table.Th>
                <Table.Th>{textos.columnas.estimada}</Table.Th>
                <Table.Th>{textos.columnas.vuelo}</Table.Th>
                <Table.Th>{textos.columnas.destino}</Table.Th>
                <Table.Th>{textos.columnas.terminal}</Table.Th>
                <Table.Th>{textos.columnas.puerta}</Table.Th>
                <Table.Th>{textos.columnas.estado}</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              <AnimatePresence initial={false}>
                {vuelos.map((v) => {
                  const [principal, ...resto] = v.codigos
                  const estadoFila = v.estado === 'CAN' ? 'cancelado' : (v.retraso_min ?? 0) > 15 ? 'retraso' : 'normal'
                  return (
                    <FilaAnimada
                      key={v.clave_vuelo}
                      layout="position"
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      onClick={() => onAbrir(v.clave_vuelo)}
                      className={clases.fila}
                    >
                      <Table.Td className={clases.hora}>
                        <span className="lampara" data-estado={estadoFila} />
                        <span>
                          {formato.hora(v.salida_programada)}
                          <FechaSiOtroDia iso={v.salida_programada} referencia={referencia} />
                        </span>
                      </Table.Td>
                      <Table.Td className={clases.sinSalto}>
                        <span className={clases.estimada}>
                          {v.salida_estimada && v.salida_estimada !== v.salida_programada ? formato.hora(v.salida_estimada) : ''}
                        </span>
                        <InsigniaRetraso minutos={v.retraso_min} cancelado={v.estado === 'CAN'} />
                        {v.salida_estimada && dia(v.salida_estimada) !== dia(v.salida_programada) && (
                          <FechaSiOtroDia iso={v.salida_estimada} referencia={referencia} />
                        )}
                      </Table.Td>
                      <Table.Td>
                        {/* El botón da acceso por teclado al historial; la fila entera también es pulsable */}
                        <UnstyledButton
                          onClick={(e) => {
                            e.stopPropagation()
                            onAbrir(v.clave_vuelo)
                          }}
                          aria-label={`${codigoVuelo(principal)}: ${textos.directo.abrirHistorial}`}
                          className={clases.vuelo}
                        >
                          <span className={clases.codigo}>{codigoVuelo(principal)}</span>
                          <span className={clases.aerolinea}>{principal.aerolinea ?? ''}</span>
                          {resto.length > 0 && <span className={clases.otrosCodigos}>{resto.map(codigoVuelo).join(' · ')}</span>}
                        </UnstyledButton>
                      </Table.Td>
                      <Table.Td>
                        <span className={clases.iata}>{v.destino_iata}</span>
                        <Text span size="sm" ml={8}>
                          {formato.nombrePropio(v.destino_ciudad)}
                        </Text>
                      </Table.Td>
                      <Table.Td>{v.terminal ?? '—'}</Table.Td>
                      <Table.Td className={clases.puerta}>{v.puerta ?? '—'}</Table.Td>
                      <Table.Td>
                        <InsigniaEstado codigo={v.estado} nombre={v.estado_nombre} />
                        <PilaCambios n={v.n_cambios} />
                      </Table.Td>
                    </FilaAnimada>
                  )
                })}
              </AnimatePresence>
            </Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </div>
    </div>
  )
}
