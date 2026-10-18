import { Alert, Box, Center, Group, Loader, Stack, Text, Timeline, Title } from '@mantine/core'
import { motion } from 'motion/react'
import { useHistorial, useMeta } from '../../api/consultas'
import type { Cambio, EventoVuelo } from '../../api/tipos'
import { estiloEstado } from '../../tema/estados'
import { formato } from '../../tema/formato'
import { textos } from '../../textos'
import { EvolucionRetraso } from '../graficos/EvolucionRetraso'
import { InsigniaEstado, InsigniaRetraso } from './Insignias'
import { codigoVuelo } from './utilidades'

/** Valor legible de un campo del historial. */
function valor(campo: Cambio['campo'], v: string | null): string {
  if (v === null) return textos.historial.vacio
  return campo === 'salida_estimada' ? formato.hora(v) : v
}

function FilaCambio({ cambio }: { cambio: Cambio }) {
  return (
    <Text size="sm">
      <Text span c="dimmed">
        {textos.historial.campos[cambio.campo]}:{' '}
      </Text>
      <Text span td={cambio.antes === null ? undefined : 'line-through'} c="dimmed">
        {valor(cambio.campo, cambio.antes)}
      </Text>
      {' → '}
      <Text span fw={600}>
        {valor(cambio.campo, cambio.despues)}
      </Text>
    </Text>
  )
}

function ContenidoEvento({ evento, primero }: { evento: EventoVuelo; primero: boolean }) {
  if (primero) {
    return (
      <Stack gap={2}>
        <Text size="sm" fw={600}>
          {textos.historial.aparece}
        </Text>
        <Text size="sm" c="dimmed">
          {textos.historial.estadoInicial(evento.estado_nombre)} · {textos.historial.campos.puerta}: {evento.puerta ?? textos.historial.vacio} ·{' '}
          {textos.historial.campos.salida_estimada}: {formato.hora(evento.salida_estimada)}
        </Text>
      </Stack>
    )
  }
  return (
    <Stack gap={2}>
      {evento.cambios.map((c) => (
        <FilaCambio key={c.campo} cambio={c} />
      ))}
    </Stack>
  )
}

/** Historial completo de un vuelo: gráfica del retraso y línea temporal de cambios. */
export function HistorialVuelo({ clave }: { clave: string }) {
  const { data: meta } = useMeta()
  const { data, error, isLoading } = useHistorial(clave)

  if (isLoading) {
    return (
      <Center h={200}>
        <Loader size="sm" />
      </Center>
    )
  }
  if (error || !data) {
    return (
      <Alert color="red" variant="light" title={textos.error.titulo}>
        {error?.message}
      </Alert>
    )
  }

  const ultimo = data.eventos[data.eventos.length - 1]

  return (
    <Stack gap="lg">
      <div>
        <Title order={3} fz="xl">
          {data.codigos.map(codigoVuelo).join(' · ')}
        </Title>
        <Text c="dimmed">
          {data.aeropuerto} → {data.destino_iata} · {formato.nombrePropio(data.destino_ciudad)}
        </Text>
        <Text size="sm" c="dimmed">
          {textos.historial.programado(formato.fechaHora(data.salida_programada))}
        </Text>
        <Group gap="xs" mt="xs">
          <InsigniaEstado codigo={ultimo.estado} nombre={ultimo.estado_nombre} />
          <InsigniaRetraso minutos={ultimo.retraso_min} cancelado={ultimo.estado === 'CAN'} />
        </Group>
      </div>

      {meta && (
        <Box>
          <Text fw={600} size="sm">
            {textos.historial.evolucion}
          </Text>
          <Text size="xs" c="dimmed">
            {textos.historial.evolucionSub}
          </Text>
          <EvolucionRetraso eventos={data.eventos} umbralPuntual={meta.umbral_puntual_min} />
        </Box>
      )}

      <Box>
        <Text fw={600} size="sm" mb="sm">
          {textos.historial.cambios}
        </Text>
        <Timeline active={data.eventos.length - 1} bulletSize={14} lineWidth={2}>
          {data.eventos.map((evento, i) => (
            <Timeline.Item
              key={evento.detectado_en}
              color={estiloEstado(evento.estado).color}
              title={
                <Text size="xs" c="dimmed" fw={500}>
                  {formato.fechaHora(evento.detectado_en)}
                </Text>
              }
            >
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: Math.min(i, 20) * 0.025, duration: 0.25 }}
              >
                <ContenidoEvento evento={evento} primero={i === 0} />
              </motion.div>
            </Timeline.Item>
          ))}
        </Timeline>
        <Text size="xs" c="dimmed" mt="md">
          {textos.historial.nota}
        </Text>
      </Box>
    </Stack>
  )
}
