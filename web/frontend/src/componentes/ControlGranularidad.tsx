import { SegmentedControl } from '@mantine/core'
import type { Granularidad } from '../api/tipos'
import { useFiltros } from '../estado/filtros'
import { textos } from '../textos'

/** Selector día / semana / mes para los gráficos de evolución (se guarda en la URL). */
export function ControlGranularidad() {
  const { granularidad, setGranularidad } = useFiltros()
  return (
    <SegmentedControl
      size="xs"
      value={granularidad}
      onChange={(v) => setGranularidad(v as Granularidad)}
      data={[
        { value: 'dia', label: textos.granularidad.dia },
        { value: 'semana', label: textos.granularidad.semana },
        { value: 'mes', label: textos.granularidad.mes },
      ]}
      aria-label={textos.granularidad.etiqueta}
    />
  )
}
