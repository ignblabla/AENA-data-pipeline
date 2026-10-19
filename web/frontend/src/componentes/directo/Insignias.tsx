import { Badge, Text } from '@mantine/core'
import { Clock } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { estiloEstado, nivelRetraso } from '../../tema/estados'
import { TINTAS } from '../../tema/tokens'
import { textos } from '../../textos'

// Insignias pensadas para leerse sobre el panel negro (panel en directo e historial).

/** Estado del vuelo: icono + texto; al cambiar de estado, la insignia cae como una paleta. */
export function InsigniaEstado({ codigo, nombre }: { codigo: string | null | undefined; nombre: string }) {
  const { variante, color, Icono } = estiloEstado(codigo)
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={nombre}
        initial={{ rotateX: -80, opacity: 0 }}
        animate={{ rotateX: 0, opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        style={{ display: 'inline-block', transformPerspective: 300 }}
      >
        <Badge
          color={color}
          variant={variante}
          autoContrast
          radius="xs"
          tt="none"
          size="md"
          leftSection={<Icono size={13} strokeWidth={2.4} aria-hidden />}
          styles={{ label: { fontWeight: 600 } }}
        >
          {nombre}
        </Badge>
      </motion.span>
    </AnimatePresence>
  )
}

/** Retraso estimado: discreto si es pequeño; en ámbar a partir del umbral (contorno si es moderado, lleno si pasa de una hora). */
export function InsigniaRetraso({ minutos, cancelado }: { minutos: number | null | undefined; cancelado?: boolean }) {
  if (cancelado || minutos == null) return null
  const nivel = nivelRetraso(minutos)
  if (nivel === 'ninguno' || nivel === 'leve') {
    return (
      <Text span size="xs" c="#a19d94">
        {nivel === 'ninguno'
          ? minutos < 0
            ? textos.directo.adelanto(-minutos)
            : textos.directo.enHora
          : textos.directo.retraso(minutos)}
      </Text>
    )
  }
  return (
    <Badge
      color={TINTAS.ambar}
      variant={nivel === 'serio' ? 'filled' : 'outline'}
      autoContrast
      radius="xs"
      size="sm"
      tt="none"
      leftSection={<Clock size={12} strokeWidth={2.4} aria-hidden />}
    >
      {textos.directo.retraso(minutos)}
    </Badge>
  )
}
