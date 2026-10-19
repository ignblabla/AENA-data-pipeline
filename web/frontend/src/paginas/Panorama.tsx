import { Center, Grid, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { lazy, Suspense, useMemo } from 'react'
import { useNavigate } from 'react-router'
import { useMeta, useRankingAerolineas, useRankingAeropuertos, useRankingDestinos, useResumen, useSerie } from '../api/consultas'
import { BarraFiltros } from '../componentes/BarraFiltros'
import { ControlGranularidad } from '../componentes/ControlGranularidad'
import { MiniSeries } from '../componentes/graficos/MiniSeries'
import { etiquetaPeriodo, etiquetaSerie, valorSerie } from '../componentes/graficos/periodos'
import { RankingBarras } from '../componentes/graficos/RankingBarras'
import { SerieTemporal } from '../componentes/graficos/SerieTemporal'
import { TarjetaGrafico } from '../componentes/graficos/TarjetaGrafico'
import { KpiTarjeta } from '../componentes/KpiTarjeta'
import { useBusquedaComun, useFiltros } from '../estado/filtros'
import { formato } from '../tema/formato'
import { METRICAS } from '../tema/metricas'
import { textos } from '../textos'

// El mapa (MapLibre) pesa bastante: se descarga aparte, cuando hace falta
const MapaAeropuertos = lazy(() => import('../componentes/mapa/MapaAeropuertos').then((m) => ({ default: m.MapaAeropuertos })))

const ALTO_MAPA = 420

export function Panorama() {
  const { data: meta } = useMeta()
  const { filtros, metrica: claveMetrica, granularidad, setAeropuertos } = useFiltros()
  const metrica = METRICAS[claveMetrica]
  const navigate = useNavigate()
  const busqueda = useBusquedaComun()

  const resumen = useResumen(filtros)
  const serieTotal = useSerie(filtros, 'total', granularidad)
  const seriePorAeropuerto = useSerie(filtros, 'aeropuerto', 'dia')
  const rankingAeropuertos = useRankingAeropuertos(filtros, claveMetrica)
  const destinos = useRankingDestinos(filtros)
  const aerolineas = useRankingAerolineas(filtros)

  const porIata = useMemo(() => new Map(meta?.aeropuertos.map((a) => [a.iata, a])), [meta])
  const seleccionados = filtros?.aeropuertos ?? []
  const ambito = seleccionados.length ? seleccionados.join(', ') : textos.graficos.todos

  // Pulsar una barra del ranking filtra por ese aeropuerto; pulsarla de nuevo quita el filtro
  const alternarAeropuerto = (iata: string) =>
    setAeropuertos(seleccionados.length === 1 && seleccionados[0] === iata ? [] : [iata])
  const verDetalle = (iata: string) => navigate(`/aeropuerto/${iata}${busqueda}`)

  const puntosMapa = useMemo(
    () =>
      (rankingAeropuertos.data ?? []).flatMap((a) => {
        const info = porIata.get(a.aeropuerto)
        if (!info) return []
        const lineas: [string, string][] = [[textos.columnas.salidas, formato.entero(a.salidas)]]
        if (claveMetrica !== 'salidas') lineas.unshift([metrica.etiqueta, metrica.formatear(a[claveMetrica])])
        return [{ iata: a.aeropuerto, nombre: info.nombre, lat: info.lat, lon: info.lon, salidas: a.salidas, valor: a[claveMetrica], lineas }]
      }),
    [rankingAeropuertos.data, porIata, claveMetrica, metrica],
  )

  const r = resumen.data
  const etiquetaValorSerie = etiquetaSerie(metrica, granularidad)
  const formatearSerie = claveMetrica === 'salidas' && granularidad !== 'dia' ? formato.decimal : metrica.formatear

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} className="titulo-pagina">
          {textos.panorama.titulo}
        </Title>
        <Text c="dimmed">{textos.panorama.subtitulo}</Text>
      </div>

      <BarraFiltros />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        <KpiTarjeta
          etiqueta={textos.kpis.salidas}
          valor={r && formato.entero(r.salidas)}
          nota={r && textos.kpis.salidasNota(formato.entero(r.vuelos))}
        />
        <KpiTarjeta etiqueta={textos.kpis.retraso} valor={r && formato.minutos(r.retraso_medio)} nota={textos.kpis.retrasoNota} />
        <KpiTarjeta
          etiqueta={textos.kpis.puntualidad}
          valor={r && formato.porcentaje(r.tasa_puntualidad)}
          nota={meta && textos.kpis.puntualidadNota(meta.umbral_puntual_min)}
        />
        <KpiTarjeta
          etiqueta={textos.kpis.cancelaciones}
          valor={r && formato.porcentaje(r.tasa_cancelacion)}
          nota={r && textos.kpis.cancelacionesNota(formato.entero(r.cancelados))}
        />
      </SimpleGrid>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, lg: 7 }}>
          <TarjetaGrafico
            titulo={textos.graficos.mapa}
            subtitulo={claveMetrica === 'salidas' ? textos.graficos.mapaSubSalidas : textos.graficos.mapaSub(metrica.etiqueta)}
            datos={rankingAeropuertos.data}
            error={rankingAeropuertos.error}
            actualizando={rankingAeropuertos.isPlaceholderData}
            alto={ALTO_MAPA}
            columnas={[
              { titulo: textos.columnas.aeropuerto, valor: (a) => `${a.aeropuerto} · ${porIata.get(a.aeropuerto)?.nombre ?? ''}` },
              { titulo: textos.columnas.salidas, valor: (a) => formato.entero(a.salidas), numerica: true },
              { titulo: metrica.etiqueta, valor: (a) => metrica.formatear(a[claveMetrica]), numerica: true },
            ]}
          >
            <Suspense
              fallback={
                <Center h={ALTO_MAPA}>
                  <Loader size="sm" />
                </Center>
              }
            >
              <MapaAeropuertos
                puntos={puntosMapa}
                colorPorValor={claveMetrica !== 'salidas'}
                formatear={metrica.formatear}
                onSeleccionar={verDetalle}
                alto={ALTO_MAPA}
              />
            </Suspense>
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, lg: 5 }}>
          <TarjetaGrafico
            titulo={textos.graficos.ranking}
            subtitulo={textos.graficos.rankingSub(metrica.descripcion)}
            datos={rankingAeropuertos.data}
            error={rankingAeropuertos.error}
            actualizando={rankingAeropuertos.isPlaceholderData}
            alto={ALTO_MAPA}
            columnas={[
              { titulo: textos.columnas.aeropuerto, valor: (a) => `${a.aeropuerto} · ${porIata.get(a.aeropuerto)?.ciudad ?? ''}` },
              { titulo: metrica.etiqueta, valor: (a) => metrica.formatear(a[claveMetrica]), numerica: true },
            ]}
          >
            {rankingAeropuertos.data && (
              <RankingBarras
                elementos={rankingAeropuertos.data.map((a) => ({
                  clave: a.aeropuerto,
                  nombre: porIata.get(a.aeropuerto)?.nombre ?? a.aeropuerto,
                  valor: a[claveMetrica],
                  extra: [
                    [textos.columnas.salidas, formato.entero(a.salidas)],
                    [textos.kpis.puntualidad, formato.porcentaje(a.tasa_puntualidad)],
                  ],
                }))}
                etiquetaValor={metrica.etiqueta}
                formatear={metrica.formatear}
                formatearEje={metrica.formatearEje}
                resaltadas={seleccionados}
                onSeleccionar={alternarAeropuerto}
                alto={ALTO_MAPA}
                etiqueta={`${textos.graficos.ranking} por ${metrica.etiqueta.toLowerCase()}`}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={12}>
          <TarjetaGrafico
            titulo={textos.graficos.evolucion}
            subtitulo={textos.graficos.evolucionSub(etiquetaValorSerie, ambito)}
            datos={serieTotal.data}
            error={serieTotal.error}
            actualizando={serieTotal.isPlaceholderData}
            alto={320}
            acciones={<ControlGranularidad />}
            columnas={[
              { titulo: textos.columnas.periodo, valor: (p) => etiquetaPeriodo(p.periodo, granularidad, true) },
              { titulo: etiquetaValorSerie, valor: (p) => formatearSerie(valorSerie(p, metrica, granularidad)), numerica: true },
            ]}
          >
            {serieTotal.data && <SerieTemporal datos={serieTotal.data} metrica={metrica} granularidad={granularidad} alto={320} />}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={12}>
          <TarjetaGrafico
            titulo={textos.graficos.porAeropuerto}
            subtitulo={`${metrica.etiqueta} diaria. ${textos.graficos.porAeropuertoSub}`}
            datos={seriePorAeropuerto.data}
            error={seriePorAeropuerto.error}
            actualizando={seriePorAeropuerto.isPlaceholderData}
            alto={300}
            columnas={[
              { titulo: textos.columnas.dia, valor: (p) => formato.diaCorto(p.periodo) },
              { titulo: textos.columnas.aeropuerto, valor: (p) => p.aeropuerto },
              { titulo: metrica.etiqueta, valor: (p) => metrica.formatear(p[claveMetrica]), numerica: true },
            ]}
          >
            {seriePorAeropuerto.data && meta && (
              <MiniSeries
                datos={seriePorAeropuerto.data}
                aeropuertos={meta.aeropuertos}
                metrica={metrica}
                seleccionados={seleccionados}
                onSeleccionar={verDetalle}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.graficos.destinos}
            subtitulo={`${textos.graficos.destinosSub} · ${ambito}`}
            datos={destinos.data}
            error={destinos.error}
            actualizando={destinos.isPlaceholderData}
            alto={340}
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
                alto={340}
                etiqueta={textos.graficos.destinos}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.graficos.aerolineas}
            subtitulo={`${textos.graficos.aerolineasSub} · ${ambito}`}
            datos={aerolineas.data}
            error={aerolineas.error}
            actualizando={aerolineas.isPlaceholderData}
            alto={340}
            columnas={[
              { titulo: textos.columnas.aerolinea, valor: (a) => a.aerolinea },
              { titulo: textos.columnas.vuelos, valor: (a) => formato.entero(a.vuelos), numerica: true },
              { titulo: textos.columnas.cancelados, valor: (a) => formato.entero(a.cancelados), numerica: true },
              { titulo: textos.columnas.retraso, valor: (a) => formato.minutos(a.retraso_medio), numerica: true },
            ]}
          >
            {aerolineas.data && (
              <RankingBarras
                elementos={aerolineas.data.map((a) => ({
                  clave: a.aerolinea,
                  nombre: `${a.aerolinea} (${a.iata_compania || '—'})`,
                  valor: a.vuelos,
                  extra: [
                    [textos.columnas.cancelados, formato.entero(a.cancelados)],
                    [textos.columnas.retraso, formato.minutos(a.retraso_medio)],
                  ],
                }))}
                etiquetaValor={textos.columnas.vuelos}
                formatear={formato.entero}
                formatearEje={formato.compacto}
                alto={340}
                etiqueta={textos.graficos.aerolineas}
              />
            )}
          </TarjetaGrafico>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
