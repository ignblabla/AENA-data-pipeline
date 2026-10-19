import { Card, Group, Skeleton, Text } from '@mantine/core'
import { ArrowDown, ArrowUp, Equal } from 'lucide-react'
import { FUENTE_PALETA } from '../tema/mantine'
import { useTokens } from './graficos/opciones'

export interface Variacion {
  texto: string
  /** Dirección del cambio: decide la flecha */
  sentido: 'sube' | 'baja' | 'igual'
  /** Si el cambio es favorable: decide el color (la flecha y el texto ya lo explican sin color) */
  tono: 'bueno' | 'malo' | 'neutro'
}

interface Props {
  etiqueta: string
  valor: string | undefined
  nota?: string
  variacion?: Variacion
}

const FLECHAS = { sube: ArrowUp, baja: ArrowDown, igual: Equal }

/** Tarjeta de indicador: etiqueta, valor grande, variación opcional y una nota de contexto. */
export function KpiTarjeta({ etiqueta, valor, nota, variacion }: Props) {
  const t = useTokens()
  const Flecha = variacion ? FLECHAS[variacion.sentido] : null
  const color = variacion?.tono === 'bueno' ? t.textoBueno : variacion?.tono === 'malo' ? t.textoMalo : 'var(--mantine-color-dimmed)'

  return (
    <Card withBorder padding="lg">
      <Text size="sm" c="dimmed" fw={500}>
        {etiqueta}
      </Text>
      {valor === undefined ? (
        <Skeleton h={36} w="60%" my={4} />
      ) : (
        <Text fz={40} fw={700} lh={1.1} ff={FUENTE_PALETA} style={{ letterSpacing: '0.01em' }}>
          {valor}
        </Text>
      )}
      {variacion && (
        <Group gap={4} wrap="nowrap" mt={2}>
          {Flecha && <Flecha size={14} strokeWidth={2.5} color={color} aria-hidden />}
          <Text span size="xs" fw={600} c={color}>
            {variacion.texto}
          </Text>
        </Group>
      )}
      {nota && (
        <Text size="xs" c="dimmed" mt={2}>
          {nota}
        </Text>
      )}
    </Card>
  )
}
