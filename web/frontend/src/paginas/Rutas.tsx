import { Center, Grid, Loader, SimpleGrid, Stack, Text, Title } from '@mantine/core'
import { lazy, Suspense, useMemo } from 'react'
import { useMeta, useRutas } from '../api/consultas'
import type { Ruta } from '../api/tipos'
import { BarraFiltros } from '../componentes/BarraFiltros'
import { RankingBarras } from '../componentes/graficos/RankingBarras'
import { TarjetaGrafico } from '../componentes/graficos/TarjetaGrafico'
import { KpiTarjeta } from '../componentes/KpiTarjeta'
import type { PuntoRutas, RutaMapa } from '../componentes/mapa/MapaRutas'
import { distanciaKm, type Coordenada } from '../componentes/mapa/geo'
import { useFiltros } from '../estado/filtros'
import { formato } from '../tema/formato'
import { METRICAS } from '../tema/metricas'
import { textos } from '../textos'

// deck.gl + MapLibre: se descargan solo al visitar esta página
const MapaRutas = lazy(() => import('../componentes/mapa/MapaRutas').then((m) => ({ default: m.MapaRutas })))

const ALTO_MAPA = 540
const N_RUTAS = 15
const N_PAISES = 12

export function Rutas() {
  const { data: meta } = useMeta()
  const { filtros, metrica: claveMetrica } = useFiltros()
  const metrica = METRICAS[claveMetrica]
  const rutas = useRutas(filtros)

  const coordOrigen = useMemo(() => new Map(meta?.aeropuertos.map((a) => [a.iata, [a.lon, a.lat] as Coordenada])), [meta])

  const calculo = useMemo(() => {
    const datos = rutas.data ?? []
    const conCoordenadas = datos.filter((r): r is Ruta & { lat: number; lon: number } => r.lat !== null && r.lon !== null && coordOrigen.has(r.origen))
    const ciudad = (r: Ruta) => formato.nombrePropio(r.destino_ciudad)

    const rutasMapa: RutaMapa[] = conCoordenadas.map((r) => {
      const lineas: [string, string][] = [[textos.columnas.salidas, formato.entero(r.salidas)]]
      if (claveMetrica !== 'salidas') lineas.unshift([metrica.etiqueta, metrica.formatear(r[claveMetrica])])
      return {
        id: `${r.origen}-${r.destino_iata}`,
        desde: coordOrigen.get(r.origen)!,
        hasta: [r.lon, r.lat],
        salidas: r.salidas,
        valor: r[claveMetrica],
        titulo: `${r.origen} → ${r.destino_iata} · ${ciudad(r)}`,
        lineas,
      }
    })

    // Destinos: varias rutas pueden llegar al mismo (desde distintos orígenes)
    const porDestino = new Map<string, PuntoRutas>()
    for (const r of conCoordenadas) {
      const d = porDestino.get(r.destino_iata)
      const salidas = (d?.salidas ?? 0) + r.salidas
      porDestino.set(r.destino_iata, {
        iata: r.destino_iata,
        coordenada: [r.lon, r.lat],
        salidas,
        titulo: `${r.destino_iata} · ${ciudad(r)} (${formato.pais(r.pais)})`,
        lineas: [[textos.rutas.salidasAlDestino, formato.entero(salidas)]],
      })
    }

    const origenes = [...new Set(datos.map((r) => r.origen))].flatMap((iata): PuntoRutas[] => {
      const coordenada = coordOrigen.get(iata)
      if (!coordenada) return []
      const salidas = datos.filter((r) => r.origen === iata).reduce((s, r) => s + r.salidas, 0)
      return [{ iata, coordenada, salidas, titulo: `${textos.rutas.origen}: ${iata}`, lineas: [[textos.columnas.salidas, formato.entero(salidas)]] }]
    })

    const total = datos.reduce((s, r) => s + r.salidas, 0)
    const internacionales = datos.filter((r) => r.pais && r.pais !== 'ES').reduce((s, r) => s + r.salidas, 0)
    const salidasConKm = conCoordenadas.reduce((s, r) => s + r.salidas, 0)
    const km = conCoordenadas.reduce((s, r) => s + r.salidas * distanciaKm(coordOrigen.get(r.origen)!, [r.lon, r.lat]), 0)

    const porPais = new Map<string, number>()
    for (const r of datos) if (r.pais) porPais.set(r.pais, (porPais.get(r.pais) ?? 0) + r.salidas)
    const paises = [...porPais.entries()].sort((a, b) => b[1] - a[1])

    return {
      rutasMapa,
      destinos: [...porDestino.values()],
      origenes,
      nDestinos: new Set(datos.map((r) => r.destino_iata)).size,
      nPaises: porPais.size,
      fraccionInternacional: total ? internacionales / total : null,
      distanciaMedia: salidasConKm ? km / salidasConKm : null,
      topRutas: datos.slice(0, N_RUTAS),
      paises,
      sinCoordenadas: [...new Set(datos.filter((r) => r.lat === null).map((r) => r.destino_iata))],
    }
  }, [rutas.data, coordOrigen, claveMetrica, metrica])

  const cargado = !!rutas.data

  return (
    <Stack gap="lg">
      <div>
        <Title order={1} className="titulo-pagina">
          {textos.rutas.titulo}
        </Title>
        <Text c="dimmed">{textos.rutas.subtitulo}</Text>
      </div>

      <BarraFiltros />

      <SimpleGrid cols={{ base: 1, xs: 2, md: 4 }} spacing="md">
        <KpiTarjeta
          etiqueta={textos.rutas.destinos}
          valor={cargado ? formato.entero(calculo.nDestinos) : undefined}
          nota={cargado ? textos.rutas.destinosNota(calculo.nPaises) : undefined}
        />
        <KpiTarjeta
          etiqueta={textos.rutas.titulo}
          valor={cargado ? formato.entero(rutas.data!.length) : undefined}
          nota={textos.rutas.rutasNota}
        />
        <KpiTarjeta
          etiqueta={textos.rutas.internacional}
          valor={cargado ? formato.porcentaje(calculo.fraccionInternacional) : undefined}
          nota={textos.rutas.internacionalNota}
        />
        <KpiTarjeta
          etiqueta={textos.rutas.distancia}
          valor={cargado ? `${formato.entero(calculo.distanciaMedia)} km` : undefined}
          nota={textos.rutas.distanciaNota}
        />
      </SimpleGrid>

      <TarjetaGrafico
        titulo={textos.rutas.mapa}
        subtitulo={claveMetrica === 'salidas' ? textos.rutas.mapaSubSalidas : textos.rutas.mapaSub(metrica.etiqueta)}
        datos={rutas.data}
        error={rutas.error}
        actualizando={rutas.isPlaceholderData}
        alto={ALTO_MAPA}
        columnas={[
          { titulo: textos.columnas.ruta, valor: (r) => `${r.origen} → ${r.destino_iata} · ${formato.nombrePropio(r.destino_ciudad)}` },
          { titulo: textos.columnas.pais, valor: (r) => formato.pais(r.pais) },
          { titulo: textos.columnas.salidas, valor: (r) => formato.entero(r.salidas), numerica: true },
          { titulo: metrica.etiqueta, valor: (r) => metrica.formatear(r[claveMetrica]), numerica: true },
        ]}
      >
        <Suspense
          fallback={
            <Center h={ALTO_MAPA}>
              <Loader size="sm" />
            </Center>
          }
        >
          <MapaRutas
            rutas={calculo.rutasMapa}
            destinos={calculo.destinos}
            origenes={calculo.origenes}
            colorPorValor={claveMetrica !== 'salidas'}
            formatear={metrica.formatear}
            alto={ALTO_MAPA}
          />
        </Suspense>
        {calculo.sinCoordenadas.length > 0 && (
          <Text size="xs" c="dimmed" mt="xs">
            {textos.rutas.sinCoordenadas(calculo.sinCoordenadas.join(', '))}
          </Text>
        )}
      </TarjetaGrafico>

      <Grid gap="md">
        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.rutas.topRutas}
            subtitulo={textos.rutas.topRutasSub}
            datos={rutas.data}
            error={rutas.error}
            actualizando={rutas.isPlaceholderData}
            alto={460}
            columnas={[
              { titulo: textos.columnas.ruta, valor: (r) => `${r.origen} → ${r.destino_iata} · ${formato.nombrePropio(r.destino_ciudad)}` },
              { titulo: textos.columnas.salidas, valor: (r) => formato.entero(r.salidas), numerica: true },
              { titulo: textos.columnas.retraso, valor: (r) => formato.minutos(r.retraso_medio), numerica: true },
            ]}
          >
            <RankingBarras
              elementos={calculo.topRutas.map((r) => ({
                clave: `${r.origen} → ${r.destino_iata}`,
                nombre: `${r.origen} → ${formato.nombrePropio(r.destino_ciudad)}`,
                valor: r.salidas,
                extra: [
                  [textos.columnas.retraso, formato.minutos(r.retraso_medio)],
                  [textos.columnas.puntualidad, formato.porcentaje(r.tasa_puntualidad)],
                ],
              }))}
              etiquetaValor={textos.columnas.salidas}
              formatear={formato.entero}
              formatearEje={formato.compacto}
              alto={460}
              etiqueta={textos.rutas.topRutas}
            />
          </TarjetaGrafico>
        </Grid.Col>

        <Grid.Col span={{ base: 12, md: 6 }}>
          <TarjetaGrafico
            titulo={textos.rutas.paises}
            subtitulo={textos.rutas.paisesSub}
            datos={rutas.data && calculo.paises}
            error={rutas.error}
            actualizando={rutas.isPlaceholderData}
            alto={460}
            columnas={[
              { titulo: textos.columnas.pais, valor: ([codigo]) => formato.pais(codigo) },
              { titulo: textos.columnas.salidas, valor: ([, salidas]) => formato.entero(salidas), numerica: true },
            ]}
          >
            <RankingBarras
              elementos={calculo.paises.slice(0, N_PAISES).map(([codigo, salidas]) => ({
                clave: formato.pais(codigo),
                nombre: formato.pais(codigo),
                valor: salidas,
              }))}
              etiquetaValor={textos.columnas.salidas}
              formatear={formato.entero}
              formatearEje={formato.compacto}
              alto={460}
              etiqueta={textos.rutas.paises}
            />
          </TarjetaGrafico>
        </Grid.Col>
      </Grid>
    </Stack>
  )
}
