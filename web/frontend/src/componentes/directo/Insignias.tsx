import { Badge, Text } from '@mantine/core'
import { AnimatePresence, motion } from 'motion/react'
import { COLORES_ALERTA, estiloEstado, nivelRetraso } from '../../tema/estados'
import { textos } from '../../textos'

/** Estado del vuelo: icono + texto; al cambiar de estado, la insignia "salta" para llamar la atención. */
export function InsigniaEstado({ codigo, nombre }: { codigo: string | null | undefined; nombre: string }) {
  const e = estiloEstado(codigo)
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <motion.span
        key={nombre}
        initial={{ scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.6, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ display: 'inline-block' }}
      >
        <Badge color={e.color} variant={e.variante} autoContrast radius="sm" tt="none" leftSection={<span aria-hidden>{e.icono}</span>}>
          {nombre}
        </Badge>
      </motion.span>
    </AnimatePresence>
  )
}

/** Retraso estimado: texto discreto si es pequeño, insignia de alerta a partir del umbral. */
export function InsigniaRetraso({ minutos, cancelado }: { minutos: number | null | undefined; cancelado?: boolean }) {
  if (cancelado || minutos == null) return null
  const nivel = nivelRetraso(minutos)
  if (nivel === 'ninguno') {
    return (
      <Text span size="xs" c="dimmed">
        {minutos < 0 ? textos.directo.adelanto(-minutos) : textos.directo.enHora}
      </Text>
    )
  }
  if (nivel === 'leve') {
    return (
      <Text span size="xs" c="dimmed">
        {textos.directo.retraso(minutos)}
      </Text>
    )
  }
  return (
    <Badge color={nivel === 'aviso' ? COLORES_ALERTA.aviso : COLORES_ALERTA.serio} autoContrast radius="sm" size="sm" tt="none" leftSection={<span aria-hidden>▲</span>}>
      {textos.directo.retraso(minutos)}
    </Badge>
  )
}
