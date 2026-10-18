import { Table, Text, UnstyledButton } from '@mantine/core'
import { AnimatePresence, motion } from 'motion/react'
import type { VueloPanel } from '../../api/tipos'
import { formato } from '../../tema/formato'
import { textos } from '../../textos'
import { InsigniaEstado, InsigniaRetraso } from './Insignias'
import { codigoVuelo } from './utilidades'

const FilaAnimada = motion.create(Table.Tr)

interface Props {
  vuelos: VueloPanel[]
  /** Momento de la foto del panel: las horas de otro día llevan la fecha debajo */
  referencia: string
  onAbrir: (clave: string) => void
}

const dia = (iso: string) => iso.slice(0, 10)

/** Fecha corta solo si el instante no es del mismo día que la referencia. */
function FechaSiOtroDia({ iso, referencia }: { iso: string | null | undefined; referencia: string }) {
  if (!iso || dia(iso) === dia(referencia)) return null
  return (
    <Text size="xs" c="dimmed" fw={400}>
      {formato.diaCorto(dia(iso))}
    </Text>
  )
}

/**
 * Panel de salidas al estilo de los de las terminales. Las filas entran y salen
 * con una transición suave y se recolocan solas cuando llegan datos nuevos.
 */
export function PanelSalidas({ vuelos, referencia, onAbrir }: Props) {
  return (
    <Table.ScrollContainer minWidth={760} type="native">
      <Table highlightOnHover verticalSpacing="xs" fz="sm" stickyHeader style={{ fontVariantNumeric: 'tabular-nums' }}>
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
              return (
                <FilaAnimada
                  key={v.clave_vuelo}
                  layout="position"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => onAbrir(v.clave_vuelo)}
                  style={{ cursor: 'pointer' }}
                >
                  <Table.Td fw={650} fz="md" style={{ whiteSpace: 'nowrap' }}>
                    {formato.hora(v.salida_programada)}
                    <FechaSiOtroDia iso={v.salida_programada} referencia={referencia} />
                  </Table.Td>
                  <Table.Td style={{ whiteSpace: 'nowrap' }}>
                    <Text span size="sm" mr={6}>
                      {v.salida_estimada && v.salida_estimada !== v.salida_programada ? formato.hora(v.salida_estimada) : ''}
                    </Text>
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
                    >
                      <Text span fw={600} size="sm">
                        {codigoVuelo(principal)}
                      </Text>
                      <Text span size="xs" c="dimmed" ml={6}>
                        {principal.aerolinea ?? ''}
                      </Text>
                      {resto.length > 0 && (
                        <Text size="xs" c="dimmed">
                          {resto.map(codigoVuelo).join(' · ')}
                        </Text>
                      )}
                    </UnstyledButton>
                  </Table.Td>
                  <Table.Td>
                    <Text span fw={600} size="sm">
                      {v.destino_iata}
                    </Text>
                    <Text span size="sm" ml={6}>
                      {formato.nombrePropio(v.destino_ciudad)}
                    </Text>
                  </Table.Td>
                  <Table.Td>{v.terminal ?? '—'}</Table.Td>
                  <Table.Td fw={600}>{v.puerta ?? '—'}</Table.Td>
                  <Table.Td>
                    <InsigniaEstado codigo={v.estado} nombre={v.estado_nombre} />
                  </Table.Td>
                </FilaAnimada>
              )
            })}
          </AnimatePresence>
        </Table.Tbody>
      </Table>
    </Table.ScrollContainer>
  )
}
