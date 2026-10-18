import { SimpleGrid, Text, UnstyledButton } from '@mantine/core'
import { useMemo } from 'react'
import type { Aeropuerto, PuntoSerie } from '../../api/tipos'
import { formato } from '../../tema/formato'
import type { DefinicionMetrica } from '../../tema/metricas'
import { Grafico } from './Grafico'
import { filaTooltip, opcionBase, tituloTooltip, useTokens } from './opciones'

interface Props {
  datos: PuntoSerie[]
  aeropuertos: Aeropuerto[]
  metrica: DefinicionMetrica
  /** Aeropuertos marcados con borde de color */
  seleccionados: string[]
  onSeleccionar: (iata: string) => void
}

/**
 * Pequeños múltiplos: una minigráfica por aeropuerto, todas del mismo color.
 * Con 11 aeropuertos, 11 líneas de colores en un mismo gráfico serían ilegibles.
 */
export function MiniSeries({ datos, aeropuertos, metrica, seleccionados, onSeleccionar }: Props) {
  const porAeropuerto = useMemo(() => {
    const grupos = new Map<string, PuntoSerie[]>()
    for (const p of datos) {
      if (!p.aeropuerto) continue
      grupos.set(p.aeropuerto, [...(grupos.get(p.aeropuerto) ?? []), p])
    }
    return aeropuertos.filter((a) => grupos.has(a.iata)).map((a) => ({ aeropuerto: a, puntos: grupos.get(a.iata)! }))
  }, [datos, aeropuertos])

  return (
    <SimpleGrid cols={{ base: 2, sm: 3, lg: 4 }} spacing="sm" verticalSpacing="sm">
      {porAeropuerto.map(({ aeropuerto, puntos }) => (
        <Mini
          key={aeropuerto.iata}
          aeropuerto={aeropuerto}
          puntos={puntos}
          metrica={metrica}
          activo={seleccionados.includes(aeropuerto.iata)}
          onSeleccionar={onSeleccionar}
        />
      ))}
    </SimpleGrid>
  )
}

interface MiniProps {
  aeropuerto: Aeropuerto
  puntos: PuntoSerie[]
  metrica: DefinicionMetrica
  activo: boolean
  onSeleccionar: (iata: string) => void
}

function Mini({ aeropuerto, puntos, metrica, activo, onSeleccionar }: MiniProps) {
  const t = useTokens()
  const valores = useMemo(() => puntos.map((p) => p[metrica.clave]), [puntos, metrica])
  const ultimo = valores[valores.length - 1]

  const opcion = useMemo(
    () => ({
      ...opcionBase(t),
      grid: { left: 0, right: 0, top: 4, bottom: 0 },
      xAxis: { type: 'category', show: false, boundaryGap: false, data: puntos.map((p) => p.periodo) },
      yAxis: { type: 'value', show: false, scale: true },
      tooltip: {
        ...(opcionBase(t).tooltip as object),
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: t.eje, width: 1 } },
        formatter: (ps: { dataIndex: number }[]) => {
          const i = ps[0].dataIndex
          return tituloTooltip(`${aeropuerto.iata} · ${formato.diaCorto(puntos[i].periodo)}`) + filaTooltip(t.serie, metrica.etiqueta, metrica.formatear(valores[i]))
        },
      },
      series: [
        {
          id: 'mini',
          type: 'line',
          data: valores,
          showSymbol: false,
          symbolSize: 8,
          lineStyle: { width: 2, color: t.serie },
          itemStyle: { color: t.serie, borderColor: t.superficie, borderWidth: 2 },
          areaStyle: { color: t.serieSuave },
        },
      ],
    }),
    [t, puntos, valores, aeropuerto, metrica],
  )

  return (
    <UnstyledButton
      onClick={() => onSeleccionar(aeropuerto.iata)}
      aria-pressed={activo}
      p="sm"
      style={{
        borderRadius: 'var(--mantine-radius-md)',
        border: `1px solid ${activo ? 'var(--mantine-primary-color-filled)' : 'var(--mantine-color-default-border)'}`,
        transition: 'border-color 150ms',
      }}
    >
      <Text fw={650} size="sm">
        {aeropuerto.iata}
        <Text span c="dimmed" size="xs" fw={400} ml={6}>
          {aeropuerto.ciudad}
        </Text>
      </Text>
      <Text size="xs" c="dimmed">
        {metrica.etiqueta} último día: <Text span fw={600} c="var(--mantine-color-text)">{metrica.formatear(ultimo)}</Text>
      </Text>
      <Grafico opcion={opcion} alto={56} etiqueta={`${metrica.etiqueta} diaria en ${aeropuerto.nombre}`} />
    </UnstyledButton>
  )
}
