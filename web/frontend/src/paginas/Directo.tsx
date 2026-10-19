import { Alert, Button, Card, Center, Drawer, Group, Loader, Select, SimpleGrid, Stack, Text, TextInput, Title } from '@mantine/core'
import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { useMeta, usePanel } from '../api/consultas'
import { HistorialVuelo } from '../componentes/directo/HistorialVuelo'
import { PanelSalidas } from '../componentes/directo/PanelSalidas'
import { codigoVuelo } from '../componentes/directo/utilidades'
import { KpiTarjeta } from '../componentes/KpiTarjeta'
import { useBusquedaComun } from '../estado/filtros'
import { formato } from '../tema/formato'
import { textos } from '../textos'

const PASO = 60

/** Quita tildes y pasa a minúsculas, para buscar "malaga" y encontrar "Málaga". */
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

export function Directo() {
  const { iata = 'MAD' } = useParams()
  const codigo = iata.toUpperCase()
  const navigate = useNavigate()
  const busqueda = useBusquedaComun()
  const [params, setParams] = useSearchParams()
  const { data: meta } = useMeta()

  const [limite, setLimite] = useState(PASO)
  const [texto, setTexto] = useState('')
  const panel = usePanel(codigo, limite)

  // El vuelo abierto va en la URL (?vuelo=…), así un historial se puede enlazar directamente
  const vueloAbierto = params.get('vuelo')
  const abrir = (clave: string) =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.set('vuelo', clave)
      return n
    })
  const cerrar = () =>
    setParams((p) => {
      const n = new URLSearchParams(p)
      n.delete('vuelo')
      return n
    })

  const aeropuerto = meta?.aeropuertos.find((a) => a.iata === codigo)
  const vuelos = useMemo(() => panel.data?.vuelos ?? [], [panel.data])

  const filtrados = useMemo(() => {
    const q = normalizar(texto.trim())
    if (!q) return vuelos
    return vuelos.filter((v) =>
      normalizar([v.destino_iata, v.destino_ciudad, ...v.codigos.flatMap((c) => [codigoVuelo(c), c.aerolinea ?? ''])].join(' ')).includes(q),
    )
  }, [vuelos, texto])

  const resumen = useMemo(
    () => ({
      retrasados: vuelos.filter((v) => (v.retraso_min ?? 0) > 15 && v.estado !== 'CAN').length,
      cancelados: vuelos.filter((v) => v.estado === 'CAN').length,
      embarcando: vuelos.filter((v) => ['BOR', 'EMB', 'BRD', 'ULL', 'LSC'].includes(v.estado ?? '')).length,
    }),
    [vuelos],
  )

  if (meta && !aeropuerto) {
    return (
      <Alert color="gray" variant="light">
        {textos.aeropuerto.desconocido}
      </Alert>
    )
  }

  const p = panel.data

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <div>
          <Title order={1} className="titulo-pagina">
            {textos.directo.titulo} · {codigo}
          </Title>
          {aeropuerto && <Text c="dimmed">{aeropuerto.nombre}</Text>}
          {p?.actualizado && (
            <Text size="sm" mt={4}>
              {textos.directo.actualizado(formato.fechaHora(p.actualizado))}
            </Text>
          )}
          <Text size="xs" c="dimmed">
            {textos.directo.notaActualizar}
          </Text>
        </div>
        {meta && (
          <Select
            label={textos.filtros.aeropuerto}
            value={codigo}
            onChange={(v) => {
              if (!v) return
              setLimite(PASO)
              navigate(`/directo/${v}${busqueda}`)
            }}
            data={meta.aeropuertos.map((a) => ({ value: a.iata, label: `${a.iata} · ${a.ciudad}` }))}
            allowDeselect={false}
            searchable
            w={{ base: '100%', xs: 260 }}
          />
        )}
      </Group>

      <SimpleGrid cols={{ base: 2, md: 4 }} spacing="md">
        <KpiTarjeta etiqueta={textos.directo.proximas} valor={p ? formato.entero(p.total) : undefined} />
        <KpiTarjeta etiqueta={textos.directo.embarcando} valor={p ? formato.entero(resumen.embarcando) : undefined} />
        <KpiTarjeta etiqueta={textos.directo.retrasados} valor={p ? formato.entero(resumen.retrasados) : undefined} />
        <KpiTarjeta etiqueta={textos.directo.cancelados} valor={p ? formato.entero(resumen.cancelados) : undefined} />
      </SimpleGrid>

      <Card withBorder padding="lg">
        <Stack gap="md">
          <TextInput
            placeholder={textos.directo.buscar}
            aria-label={textos.directo.buscar}
            value={texto}
            onChange={(e) => setTexto(e.currentTarget.value)}
            maw={420}
          />
          {panel.error ? (
            <Alert color="red" variant="light" title={textos.error.titulo}>
              {panel.error.message}
            </Alert>
          ) : !p ? (
            <Center h={300}>
              <Loader size="sm" />
            </Center>
          ) : p.vuelos.length === 0 ? (
            <Text c="dimmed">{textos.directo.sinDatos}</Text>
          ) : filtrados.length === 0 ? (
            <Text c="dimmed">{textos.directo.sinResultados}</Text>
          ) : (
            <PanelSalidas vuelos={filtrados} referencia={p.actualizado ?? p.vuelos[0].salida_programada} onAbrir={abrir} />
          )}
          {p && p.vuelos.length > 0 && (
            <Group justify="space-between">
              <Text size="xs" c="dimmed">
                {textos.directo.mostrando(p.vuelos.length, p.total)}
              </Text>
              {p.vuelos.length < p.total && (
                <Button variant="default" size="xs" onClick={() => setLimite((l) => l + PASO)} loading={panel.isFetching}>
                  {textos.directo.verMas}
                </Button>
              )}
            </Group>
          )}
        </Stack>
      </Card>

      <Drawer
        opened={!!vueloAbierto}
        onClose={cerrar}
        position="right"
        size="lg"
        title={textos.historial.titulo}
        closeButtonProps={{ 'aria-label': textos.historial.cerrar }}
      >
        {vueloAbierto && <HistorialVuelo clave={vueloAbierto} />}
      </Drawer>
    </Stack>
  )
}
