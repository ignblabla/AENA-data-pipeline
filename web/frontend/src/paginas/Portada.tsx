import { Anchor, Group, Stack, Text, Title } from '@mantine/core'
import { useMediaQuery } from '@mantine/hooks'
import { ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'
import { useMeta, usePanel, useProyecto } from '../api/consultas'
import type { VueloPanel } from '../api/tipos'
import { codigoVuelo } from '../componentes/directo/utilidades'
import { Paleta } from '../componentes/panel/Paleta'
import { Tablero, type ColumnaTablero, type FilaTablero } from '../componentes/panel/Tablero'
import { formato } from '../tema/formato'
import { textos } from '../textos'
import credito from '../../public/imagenes/credits.json'
import clases from './Portada.module.css'

const FILAS = 9
// En el móvil el panel se acorta para que la acción principal quepa en la primera pantalla
const FILAS_MOVIL = 5
const AEROPUERTOS_PANEL = ['MAD', 'BCN', 'PMI', 'AGP', 'LPA', 'TFS', 'VLC', 'SVQ', 'TFN', 'SCQ', 'MAH']

const COLUMNAS: ColumnaTablero[] = [
  { titulo: 'HORA', ancho: 5 },
  { titulo: 'VUELO', ancho: 7, ocultarEnMovil: true },
  { titulo: 'DESTINO', ancho: 12, anchoMovil: 9 },
  { titulo: 'PUERTA', ancho: 4, ocultarEnMovil: true },
  { titulo: 'ESTADO', ancho: 12 },
]

// Lo que cabe en las 12 paletas de la columna de estado
const ESTADO_CORTO: Record<string, string> = {
  'Última llamada': 'ÚLT. LLAMADA',
  'Listo para salir': 'LISTO',
  'Fuera de calzos': 'EN PISTA',
  'Sin estado': '',
}

const PALABRAS_SUELTAS = new Set(['DE', 'DEL', 'LA', 'LAS', 'LOS', 'EL', 'Y'])

/**
 * Como en los paneles reales, un nombre que no cabe se corta por palabras, nunca a mitad
 * de una ("PALMA DE MALLORCA" -> "PALMA"); solo si la primera palabra ya no cabe se recorta.
 */
function alPanel(texto: string, ancho: number): string {
  const limpio = texto.split('/')[0].trim().toUpperCase()
  if (limpio.length <= ancho) return limpio
  const palabras: string[] = []
  for (const palabra of limpio.split(/\s+/)) {
    if ([...palabras, palabra].join(' ').length > ancho) break
    palabras.push(palabra)
  }
  while (palabras.length > 1 && PALABRAS_SUELTAS.has(palabras[palabras.length - 1])) palabras.pop()
  return palabras.length ? palabras.join(' ') : limpio.slice(0, ancho)
}

function aFila(v: VueloPanel, anchoDestino: number): FilaTablero {
  const cancelado = v.estado === 'CAN'
  const retraso = !cancelado && (v.retraso_min ?? 0) > 15
  const estado = cancelado
    ? 'CANCELADO'
    : retraso
      ? textos.directo.retraso(v.retraso_min!).toUpperCase()
      : (ESTADO_CORTO[v.estado_nombre] ?? v.estado_nombre)
  return {
    id: v.clave_vuelo,
    estado: cancelado ? 'cancelado' : retraso ? 'retraso' : 'normal',
    celdas: [
      formato.hora(v.salida_programada),
      codigoVuelo(v.codigos[0]).replace(' ', ''),
      alPanel(v.destino_ciudad, anchoDestino),
      v.puerta ?? '',
      estado,
    ],
  }
}

const PUERTAS = [
  { puerta: 'A1', ruta: '/panorama', ...textos.portada.puertas.panorama },
  { puerta: 'A2', ruta: '/aeropuerto/MAD', ...textos.portada.puertas.aeropuertos },
  { puerta: 'A3', ruta: '/rutas', ...textos.portada.puertas.rutas },
  { puerta: 'A4', ruta: '/directo/MAD', ...textos.portada.puertas.directo },
]

export function Portada() {
  const [iata, setIata] = useState('MAD')
  const movil = useMediaQuery('(max-width: 48em)')
  const panel = usePanel(iata, FILAS)
  const proyecto = useProyecto()
  const { data: meta } = useMeta()
  const foto = credito[0]
  const p = proyecto.data
  const filas = movil ? FILAS_MOVIL : FILAS

  const nombre = meta?.aeropuertos.find((a) => a.iata === iata)?.nombre
  const actualizado = panel.data?.actualizado

  // El recorrido de un dato, cada paso con una cifra real del histórico
  const pasos = textos.portada.pasos.map((paso, i) => ({
    ...paso,
    cifra: p ? [p.aeropuertos, p.cambios_ultima_pasada, p.particiones, p.salidas, p.rutas].map(formato.entero)[i] : '',
  }))

  return (
    <Stack gap={0}>
      {/* Primera pantalla: el panel a la izquierda, el cartel y la acción a la derecha */}
      <section className={clases.vestibulo} aria-labelledby="titulo-portada">
        <div className={`marco-panel ${clases.panel}`}>
          <div className={`panel-negro ${clases.panelInterior}`}>
            <Group justify="space-between" align="flex-end" wrap="wrap" gap="sm" mb="md">
              <span style={{ fontSize: 'clamp(22px, 2.6vw, 40px)' }}>
                <Paleta texto={`SALIDAS ${iata}`} ancho={11} />
              </span>
              {/* Reloj del panel: la hora de la última extracción de ESTE aeropuerto */}
              <div className={clases.reloj}>
                <span className={clases.etiquetaReloj}>{textos.portada.relojPanel(iata)}</span>
                <span style={{ fontSize: 'clamp(18px, 1.7vw, 26px)' }}>
                  <Paleta texto={actualizado ? formato.hora(actualizado) : ''} ancho={5} tono="ambar" />
                </span>
              </div>
            </Group>
            <Group gap={4} role="group" aria-label={textos.portada.elegirAeropuerto} mb="md">
              {AEROPUERTOS_PANEL.map((codigo) => (
                <button key={codigo} type="button" className="selector-paleta" aria-pressed={codigo === iata} onClick={() => setIata(codigo)}>
                  {codigo}
                </button>
              ))}
            </Group>
            <Tablero
              columnas={COLUMNAS}
              filas={(panel.data?.vuelos ?? []).slice(0, filas).map((v) => aFila(v, movil ? 9 : 12))}
              numFilas={filas}
              etiqueta={textos.portada.etiquetaPanel(nombre ?? iata)}
            />

            {/* Registro del pipeline: cifras reales del histórico, en paletas, al pie del panel */}
            <dl className={clases.registro} aria-label={textos.portada.registro}>
              {[
                [textos.portada.cifras.eventos, p && formato.entero(p.eventos), 9],
                [textos.portada.cifras.salidas, p && formato.entero(p.salidas), 7],
                [textos.portada.cifras.destinos, p && formato.entero(p.destinos), 3],
                [textos.portada.cifras.paises, p && formato.entero(p.paises), 3],
              ].map(([etiqueta, valor, ancho], i) => (
                <div key={etiqueta as string} className={clases.cifra}>
                  <dt>{etiqueta}</dt>
                  <dd style={{ fontSize: `min(22px, calc(100cqw / ${((ancho as number) * 0.81 + 0.2).toFixed(2)}))` }}>
                    <Paleta texto={(valor as string | undefined) ?? ''} ancho={ancho as number} retardo={700 + i * 160} />
                  </dd>
                </div>
              ))}
            </dl>
            <Text size="xs" mt="md" className={clases.pieTablero}>
              {actualizado ? textos.portada.pieTablero(iata, formato.fechaHora(actualizado)) : textos.app.cargando}
            </Text>
          </div>
        </div>

        <figure className={`marco-panel ${clases.cartel}`}>
          <img
            src="/imagenes/avion-aproximacion-palma.jpg"
            width={foto.width}
            height={foto.height}
            alt={textos.portada.altFoto}
            className={clases.foto}
            fetchPriority="high"
          />
          <figcaption className={`panel-negro ${clases.textoCartel}`}>
            <Title order={1} id="titulo-portada" className={clases.titular}>
              {textos.portada.titular}
            </Title>
            <Text className={clases.entradilla}>{textos.portada.entradilla}</Text>
            <Text className={clases.credito}>
              {textos.portada.fotoDe}{' '}
              <Anchor href={foto.page} target="_blank" rel="noreferrer" c="inherit" underline="always">
                {foto.creator}
              </Anchor>{' '}
              ·{' '}
              <Anchor href={foto.licenseUrl} target="_blank" rel="noreferrer" c="inherit" underline="always">
                {foto.license}
              </Anchor>{' '}
              · {foto.via}
            </Text>
          </figcaption>
        </figure>

        <Link to="/panorama" className={`paleta-boton ${clases.accion}`}>
          {textos.portada.accion}
          <ArrowRight size={28} strokeWidth={2.5} aria-hidden />
        </Link>
      </section>

      {/* Cada 10 minutos: el recorrido de un dato, como un segundo panel con cifras reales */}
      <section className={clases.seccion} aria-labelledby="titulo-recorrido">
        <Title order={2} id="titulo-recorrido" className={clases.tituloSeccion}>
          {textos.portada.recorrido}
        </Title>
        <Text c="dimmed" maw={640} mb="lg">
          {textos.portada.recorridoSub}
        </Text>
        <div className="marco-panel">
          <table className={`panel-negro ${clases.recorrido}`}>
            <thead className="sr-only">
              <tr>
                <th scope="col">{textos.portada.columnasRecorrido.paso}</th>
                <th scope="col">{textos.portada.columnasRecorrido.cifra}</th>
                <th scope="col">{textos.portada.columnasRecorrido.que}</th>
              </tr>
            </thead>
            <tbody>
              {pasos.map((paso, i) => (
                <tr key={paso.nombre}>
                  <th scope="row" className={clases.paso}>
                    <Paleta texto={paso.nombre} ancho={8} retardo={i * 120} />
                  </th>
                  <td className={clases.cifraPaso}>
                    <Paleta texto={paso.cifra} ancho={9} alinear="derecha" tono={i === 1 ? 'ambar' : 'normal'} retardo={i * 120 + 200} />
                    <span className={clases.unidad}>{paso.unidad}</span>
                  </td>
                  <td className={clases.textoPaso}>{paso.texto}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Embarque: las secciones de la web como puertas de un panel */}
      <section className={clases.seccion} aria-labelledby="titulo-embarque">
        <Title order={2} id="titulo-embarque" className={clases.tituloSeccion}>
          {textos.portada.embarque}
        </Title>
        <nav aria-labelledby="titulo-embarque" className={`marco-panel ${clases.puertas}`}>
          <ul className="panel-negro">
            {PUERTAS.map((pu, i) => (
              <li key={pu.ruta}>
                <Link to={pu.ruta} className={clases.puerta}>
                  <span style={{ fontSize: 'clamp(18px, 2vw, 28px)' }}>
                    <Paleta texto={pu.puerta} ancho={2} retardo={i * 120} />
                  </span>
                  <span className={clases.nombrePuerta}>{pu.nombre}</span>
                  <span className={clases.textoPuerta}>{pu.texto}</span>
                  <ArrowRight size={22} aria-hidden className={clases.flechaPuerta} />
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </section>

      <footer className={clases.pie}>
        <Text size="sm">{textos.portada.independiente}</Text>
        <Text size="sm" c="dimmed">
          {textos.portada.creditos}
        </Text>
        <Anchor href="https://github.com/ignblabla/AENA-data-pipeline" target="_blank" rel="noreferrer" size="sm" c="inherit" underline="always">
          {textos.portada.codigo}
        </Anchor>
      </footer>
    </Stack>
  )
}
