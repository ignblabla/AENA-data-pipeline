import { Group, MultiSelect, SegmentedControl, Select, Stack, Text } from '@mantine/core'
import { DatePickerInput, type DatesRangeValue } from '@mantine/dates'
import dayjs from 'dayjs'
import { useState } from 'react'
import { useMeta } from '../api/consultas'
import { useFiltros } from '../estado/filtros'
import { LISTA_METRICAS, type ClaveMetrica } from '../tema/metricas'
import { textos } from '../textos'

interface Props {
  /** false en páginas donde el aeropuerto ya viene fijado por la ruta */
  conAeropuertos?: boolean
}

/** Fila única de filtros sobre todos los gráficos: periodo, aeropuertos y métrica. */
export function BarraFiltros({ conAeropuertos = true }: Props) {
  const { data: meta } = useMeta()
  const { filtros, metrica, setRango, setAeropuertos, setMetrica } = useFiltros()

  const opcionesMetrica = LISTA_METRICAS.map((m) => ({ value: m.clave, label: m.etiqueta }))

  // Rango a medias mientras se elige la segunda fecha; al completarlo pasa a la URL
  const [parcial, setParcial] = useState<DatesRangeValue<string> | null>(null)

  if (!meta || !filtros) return null

  const fin = meta.rango.dia_max_completo
  const inicio = meta.rango.dia_min_completo
  const haceDias = (n: number) => {
    const d = dayjs(fin).subtract(n - 1, 'day').format('YYYY-MM-DD')
    return d < inicio ? inicio : d
  }

  return (
    <Stack gap={4}>
      <Group gap="md" align="flex-end" wrap="wrap">
        <DatePickerInput
          type="range"
          label={textos.filtros.periodo}
          value={parcial ?? [filtros.desde, filtros.hasta]}
          onChange={(v) => {
            if (v[0] && v[1]) {
              setParcial(null)
              setRango(v[0], v[1])
            } else setParcial(v)
          }}
          minDate={meta.rango.dia_min}
          maxDate={meta.rango.dia_max}
          valueFormat="D MMM YYYY"
          presets={[
            { value: [haceDias(7), fin], label: textos.filtros.presets.ultimos7 },
            { value: [haceDias(14), fin], label: textos.filtros.presets.ultimos14 },
            { value: [inicio, fin], label: textos.filtros.presets.todo },
          ]}
          w={{ base: '100%', xs: 260 }}
        />
        {conAeropuertos && (
<MultiSelect
            label={textos.filtros.aeropuertos}
            placeholder={filtros.aeropuertos.length ? undefined : textos.filtros.todos}
            data={meta.aeropuertos.map((a) => ({ value: a.iata, label: `${a.iata} · ${a.ciudad}` }))}
            value={filtros.aeropuertos}
            onChange={setAeropuertos}
            clearable
            searchable
            w={{ base: '100%', xs: 320 }}
          />
        )}
        {/* En pantallas estrechas las cuatro opciones no caben en fila: desplegable */}
        <Select
          hiddenFrom="sm"
          w="100%"
          label={textos.filtros.metrica}
          value={metrica}
          onChange={(v) => v && setMetrica(v as ClaveMetrica)}
          data={opcionesMetrica}
          allowDeselect={false}
        />
        <Stack gap={4} visibleFrom="sm">
          <Text size="sm" fw={500}>
            {textos.filtros.metrica}
          </Text>
          <SegmentedControl
            value={metrica}
            onChange={(v) => setMetrica(v as ClaveMetrica)}
            data={opcionesMetrica}
            aria-label={textos.filtros.metrica}
          />
        </Stack>
      </Group>
      <Text size="xs" c="dimmed">
        {textos.filtros.notaDias}
      </Text>
    </Stack>
  )
}
