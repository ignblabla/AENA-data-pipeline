import { Alert, Box, Card, Center, Group, Loader, SegmentedControl, Stack, Table, Text, Title } from '@mantine/core'
import { useState, type ReactNode } from 'react'
import { textos } from '../../textos'

export interface ColumnaTabla<T> {
  titulo: string
  valor: (fila: T) => ReactNode
  numerica?: boolean
}

interface Props<T> {
  titulo: string
  subtitulo?: string
  /** Datos de la consulta: undefined mientras carga por primera vez */
  datos: T[] | undefined
  error?: Error | null
  /** true mientras se recargan datos tras cambiar un filtro (se mantiene el gráfico anterior) */
  actualizando?: boolean
  columnas: ColumnaTabla<T>[]
  alto: number
  /** Controles propios de la vista del gráfico (p. ej. agrupar por día/semana/mes) */
  acciones?: ReactNode
  children: ReactNode
}

/**
 * Tarjeta estándar para cualquier gráfico: título, estados de carga/error/vacío
 * y una vista alternativa en tabla con los mismos datos (accesibilidad).
 */
export function TarjetaGrafico<T>({ titulo, subtitulo, datos, error, actualizando, columnas, alto, acciones, children }: Props<T>) {
  const [vista, setVista] = useState<'grafico' | 'tabla'>('grafico')

  let contenido: ReactNode
  if (error) {
    contenido = (
      <Alert color="red" variant="light" title={textos.error.titulo} mih={alto}>
        {error.message}
      </Alert>
    )
  } else if (!datos) {
    contenido = (
      <Center h={alto}>
        <Loader size="sm" />
      </Center>
    )
  } else if (datos.length === 0) {
    contenido = (
      <Center h={alto}>
        <Text c="dimmed">{textos.sinDatos}</Text>
      </Center>
    )
  } else if (vista === 'tabla') {
    contenido = (
      <Table.ScrollContainer minWidth={320} mah={alto} type="native">
        <Table striped highlightOnHover stickyHeader fz="sm">
          <Table.Thead>
            <Table.Tr>
              {columnas.map((c) => (
                <Table.Th key={c.titulo} ta={c.numerica ? 'right' : undefined}>
                  {c.titulo}
                </Table.Th>
              ))}
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {datos.map((fila, i) => (
              <Table.Tr key={i}>
                {columnas.map((c) => (
                  <Table.Td key={c.titulo} ta={c.numerica ? 'right' : undefined} style={c.numerica ? { fontVariantNumeric: 'tabular-nums' } : undefined}>
                    {c.valor(fila)}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Table.ScrollContainer>
    )
  } else {
    contenido = children
  }

  return (
    <Card withBorder padding="lg" h="100%">
      <Stack gap="sm" h="100%">
        <Group justify="space-between" align="flex-start" wrap="nowrap" gap="sm">
          <Box miw={0} style={{ flex: 1 }}>
            <Group gap="xs">
              <Title order={3} tt="uppercase" style={{ letterSpacing: '0.03em' }}>
                {titulo}
              </Title>
              {actualizando && <Loader size={12} />}
            </Group>
            {subtitulo && (
              <Text size="sm" c="dimmed">
                {subtitulo}
              </Text>
            )}
          </Box>
          <Group gap="xs" wrap="wrap" justify="flex-end" style={{ flexShrink: 0 }}>
            {acciones}
            <SegmentedControl
              size="xs"
              value={vista}
              onChange={(v) => setVista(v as 'grafico' | 'tabla')}
              data={[
                { value: 'grafico', label: textos.vista.grafico },
                { value: 'tabla', label: textos.vista.tabla },
              ]}
              aria-label={textos.vista.etiqueta}
            />
          </Group>
        </Group>
        <Box style={{ opacity: actualizando ? 0.6 : 1, transition: 'opacity 200ms' }}>{contenido}</Box>
      </Stack>
    </Card>
  )
}
