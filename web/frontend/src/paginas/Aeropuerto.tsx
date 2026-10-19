import { Alert, Anchor, Button, Grid, Group, Select, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { useHorario, useMeta, useRankingAerolineas, useRankingDestinos, useResumen, useRetrasos, useSerie } from '../api/consultas'
import { BarraFiltros } from '../componentes/BarraFiltros'
import { ControlGranularidad } from '../componentes/ControlGranularidad'
import { HistogramaRetrasos } from '../componentes/graficos/HistogramaRetrasos'
import { MapaCalor } from '../componentes/graficos/MapaCalor'
import { etiquetaPeriodo, etiquetaSerie, valorSerie } from '../componentes/graficos/periodos'
import { RankingBarras } from '../componentes/graficos/RankingBarras'
import { SerieTemporal } from '../componentes/graficos/SerieTemporal'
import { TarjetaGrafico } from '../componentes/graficos/TarjetaGrafico'
import { KpiTarjeta, type Variacion } from '../componentes/KpiTarjeta'
import { useBusquedaComun, useFiltros, type Filtros } from '../estado/filtros'
import { formato } from '../tema/formato'
import { METRICAS } from '../tema/metricas'
import { textos } from '../textos'

const N_AEROLINEAS = 12

/**
 * Variación de un aeropuerto frente al conjunto de los 11: flecha según el
 * sentido, color según si es favorable, y el texto lo dice sin depender del color.
 */
function variacion(
  valor: number | null | undefined,
  referencia: number | null | undefined,
  formatearDiferencia: (v: number) => string,
  masEsMejor: boolean,
): Variacion | undefined {
  if (valor == null || referencia == null) return undefined
  const diferencia = valor - referencia
  const texto = formatearDiferencia(Math.abs(diferencia))
  // Diferencias que se redondean a cero se muestran como "igual"
  if (texto === formatearDiferencia(0)) return { texto: textos.kpis.igualMedia, sentido: 'igual', tono: 'neutro' }
  const sube = diferencia > 0
  return {
    texto: textos.kpis.frenteMedia(texto, sube ? 'más' : 'menos'),
    sentido: sube ? 'sube' : 'baja',
    tono: sube === masEsMejor ? 'bueno' : 'malo',
  }
}

const minutos = (v: number) => formato.minutos(v)
const puntos = (v: number) => `${formato.decimal(v * 100)} p. p.`

export function Aeropuerto() {
  const { iata = '' } = useParams()
  const codigo = iata.toUpperCase()
  const { data: meta } = useMeta()
  const { filtros, metrica: claveMetrica, granularidad } = useFiltros()
  const metrica = METRICAS[claveMetrica]
  const navigate = useNavigate()
  const busqueda = useBusquedaComun()

  const aeropuerto = meta?.aeropuertos.find((a) => a.iata === codigo)
  const valido = !!aeropuerto

  // El aeropuerto de la ruta sustituye a la selección de aeropuertos de la URL
  const f = useMemo<Filtros | null>(() => (filtros && valido ? { ...filtros, aeropuertos: [codigo] } : null), [filtros, valido, codigo])
  const conjunto = useMemo<Filtros | null>(() => (filtros && valido ? { ...filtros, aeropuertos: [] } : null), [filtros, valido])

  const resumen = useResumen(f)
  const resumenConjunto = useResumen(conjunto)
  const serie = useSerie(f, 'total', granularidad)
  const horario = useHorario(codigo, f)
  const retrasos = useRetrasos(codigo, f)
  const aerolineas = useRankingAerolineas(f, N_AEROLINEAS)
  const destinos = useRankingDestinos(f)

  const aerolineasPorPuntualidad = useMemo(
    () => [...(aerolineas.data ?? [])].sort((a, b) => (b.tasa_puntualidad ?? -1) - (a.tasa_puntualidad ?? -1)),
    [aerolineas.data],
  )

  if (meta && !valido) {
    return (
      <Stack>
        <Alert color="gray" variant="light">
          {textos.aeropuerto.desconocido}
        </Alert>
        <Anchor component={Link} to={`/panorama${busqueda}`}>
          {textos.aeropuerto.volver}
        </Anchor>
      </Stack>
    )
  }

  const r = resumen.data
  const g = resumenConjunto.data
  // Rutas filtradas por este aeropuerto como origen, conservando periodo y métrica
  const consultaRutas = new URLSearchParams(busqueda)
  consultaRutas.set('aeropuertos', codigo)
  const enlaceRutas = `/rutas?${consultaRutas}`
  const etiquetaValorSerie = etiquetaSerie(metrica, granularidad)
  const formatearSerie = claveMetrica === 'salidas' && granularidad !== 'dia' ? formato.decimal : metrica.formatear
  const h = retrasos.data

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end" wrap="wrap" gap="md">
        <div>
          <Anchor component={Link} to={`/panorama${busqueda}`} size="sm" c="dimmed" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <ArrowLeft size={15} aria-hidden />
            {textos.aeropuerto.volver}
          </Anchor>
          <Title order={1} className="titulo-pagina" mt={6}>
            {aeropuerto ? `${aeropuerto.iata} · ${aeropuerto.nombre}` : codigo}
          </Title>
          {aeropuerto && <Text c="dimmed">{aeropuerto.ciudad}</Text>}
          <Group gap="xs" mt="sm">
            <Button component={Link} to={`/directo/${codigo}${busqueda}`} variant="filled" size="xs">
              {textos.aeropuerto.verDirecto}
            </Button>
            <Button component={Link} to={enlaceRutas} variant="default" size="xs">
              {textos.aeropuerto.verRutas}
            </Button>
          </Group>
        </div>
        {meta && (
          <Select
            label={textos.filtros.aeropuerto}
            value={codigo}
            onChange={(v) => v && navigate(`/aeropuerto/${v}${busqueda}`)}
            data={meta.aeropuertos.map((a) => ({ value: a.iata, label: `${a.iata} · ${a.ciudad}` }))}
            allowDeselect={false}
            searchable
            w={{ base: '100%', xs: 260 }}
          />
        )}
      </Group>

      <BarraFiltros conAeropuertos={false} />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        <KpiTarjeta
          etiqueta={textos.kpis.salidas}
          valor={r && formato.entero(r.salidas)}
          nota={r && g && g.salidas ? textos.kpis.cuota(formato.porcentaje(r.salidas / g.salidas)) : undefined}
        />
        <KpiTarjeta
          etiqueta={textos.kpis.retraso}
          valor={r && formato.minutos(r.retraso_medio)}
          variacion={variacion(r?.retraso_medio, g?.retraso_medio, minutos, false)}
          nota={textos.kpis.retrasoNota}
        />
        <KpiTarjeta
          etiqueta={textos.kpis.puntualidad}
          valor={r && formato.porcentaje(r.tasa_puntualidad)}
          variacion={variacion(r?.tasa_puntualidad, g?.tasa_puntualidad, puntos, true)}
          nota={meta && textos.kpis.puntualidadNota(meta.umbral_puntual_min)}
        />
        <KpiTarjeta
          etiqueta={textos.kpis.cancelaciones}
          valor={r && formato.porcentaje(r.tasa_cancelacion)}
          variacion={variacion(r?.tasa_cancelacion, g?.tasa_cancelacion, puntos, false)}
          nota={r && textos.kpis.cancelacionesNota(formato.entero(r.cancelados))}
        />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={12}>
          <TarjetaGrafico
            titulo={textos.graficos.evolucion}
            subtitulo={textos.graficos.evolucionSub(etiquetaValorSerie, codigo)}
            datos={serie.data}
            error={serie.error}
            actualizando={serie.isPlaceholderData}
            alto={300}
            acciones={<ControlGranularidad />}
            columnas={[
              { titulo: textos.columnas.periodo, valor: (p) => etiquetaPeriodo(p.periodo, granularidad, true) },
              { titulo: etiquetaValorSerie, valor: (p) => formatearSerie(valorSerie(p, metrica, granularidad)), numerica: true },
            ]}
          >
            {serie.data && <SerieTemporal datos={serie.data} metrica={metrica} granularidad={granularidad} alto={300} />}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 7 }}>
          <TarjetaGrafico
            titulo={textos.graficos.horario}
            subtitulo={textos.graficos.horarioSub(claveMetrica === 'salidas' ? textos.graficos.salidasPorDia : metrica.etiqueta)}
            datos={horario.data}
            error={horario.error}
            actualizando={horario.isPlaceholderData}
            alto={320}
            columnas={[
              { titulo: textos.columnas.dia, valor: (c) => textos.diasSemana[c.dia_semana - 1] },
              { titulo: textos.columnas.hora, valor: (c) => `${c.hora}:00`, numerica: true },
              { titulo: textos.graficos.salidasPorDia, valor: (c) => formato.decimal(c.salidas_por_dia), numerica: true },
              { titulo: textos.columnas.retraso, valor: (c) => formato.minutos(c.retraso_medio), numerica: true },
              { titulo: textos.columnas.puntualidad, valor: (c) => formato.porcentaje(c.tasa_puntualidad), numerica: true },
            ]}
          >
            {horario.data && <MapaCalor celdas={horario.data} metrica={metrica} alto={320} />}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <TarjetaGrafico
            titulo={textos.graficos.histograma}
            subtitulo={h ? textos.graficos.histogramaSub(formato.minutos(h.mediana), formato.minutos(h.p90)) : undefined}
            datos={h?.intervalos}
            error={retrasos.error}
            actualizando={retrasos.isPlaceholderData}
            alto={320}
            columnas={[
              {
                titulo: textos.columnas.tramo,
                valor: (i) => (i.inicio === null ? `< ${i.fin} min` : i.fin === null ? `≥ ${i.inicio} min` : `${i.inicio} a ${i.fin} min`),
              },
              { titulo: textos.columnas.salidas, valor: (i) => formato.entero(i.salidas), numerica: true },
            ]}
          >
            {h && meta && <HistogramaRetrasos histograma={h} umbralPuntual={meta.umbral_puntual_min} alto={320} />}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.graficos.puntualidadAerolineas}
            subtitulo={textos.graficos.puntualidadAerolineasSub(N_AEROLINEAS)}
            datos={aerolineas.data}
            error={aerolineas.error}
            actualizando={aerolineas.isPlaceholderData}
            alto={400}
            columnas={[
              { titulo: textos.columnas.aerolinea, valor: (a) => a.aerolinea },
              { titulo: textos.columnas.vuelos, valor: (a) => formato.entero(a.vuelos), numerica: true },
              { titulo: textos.columnas.puntualidad, valor: (a) => formato.porcentaje(a.tasa_puntualidad), numerica: true },
              { titulo: textos.columnas.retraso, valor: (a) => formato.minutos(a.retraso_medio), numerica: true },
            ]}
          >
            {aerolineas.data && (
              <RankingBarras
                elementos={aerolineasPorPuntualidad.map((a) => ({
                  clave: a.aerolinea,
                  nombre: `${a.aerolinea} (${a.iata_compania || '—'})`,
                  valor: a.tasa_puntualidad,
                  extra: [
                    [textos.columnas.vuelos, formato.entero(a.vuelos)],
                    [textos.columnas.retraso, formato.minutos(a.retraso_medio)],
                  ],
                }))}
                etiquetaValor={textos.columnas.puntualidad}
                formatear={formato.porcentaje}
                formatearEje={METRICAS.tasa_puntualidad.formatearEje}
                alto={400}
                etiqueta={textos.graficos.puntualidadAerolineas}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.graficos.destinos}
            subtitulo={`${textos.graficos.destinosSub} · ${codigo}`}
            datos={destinos.data}
            error={destinos.error}
            actualizando={destinos.isPlaceholderData}
            alto={400}
            columnas={[
              { titulo: textos.columnas.destino, valor: (d) => `${d.destino_iata} · ${d.destino_ciudad}` },
              { titulo: textos.columnas.salidas, valor: (d) => formato.entero(d.salidas), numerica: true },
              { titulo: textos.columnas.retraso, valor: (d) => formato.minutos(d.retraso_medio), numerica: true },
            ]}
          >
            {destinos.data && (
              <RankingBarras
                elementos={destinos.data.map((d) => ({
                  clave: d.destino_iata,
                  nombre: `${d.destino_iata} · ${d.destino_ciudad}`,
                  valor: d.salidas,
                  extra: [[textos.columnas.retraso, formato.minutos(d.retraso_medio)]],
                }))}
                etiquetaValor={textos.columnas.salidas}
                formatear={formato.entero}
                formatearEje={formato.compacto}
                alto={400}
                etiqueta={textos.graficos.destinos}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
