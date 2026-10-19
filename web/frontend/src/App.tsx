import { Center, Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router'
import { Layout } from './componentes/Layout'
import { Portada } from './paginas/Portada'

// Las páginas de análisis se descargan solo cuando se visitan
const Panorama = lazy(() => import('./paginas/Panorama').then((m) => ({ default: m.Panorama })))
const Aeropuerto = lazy(() => import('./paginas/Aeropuerto').then((m) => ({ default: m.Aeropuerto })))
const Rutas = lazy(() => import('./paginas/Rutas').then((m) => ({ default: m.Rutas })))
const Directo = lazy(() => import('./paginas/Directo').then((m) => ({ default: m.Directo })))

const cargando = (
  <Center h={300}>
    <Loader size="sm" />
  </Center>
)

const FILTROS = ['desde', 'hasta', 'aeropuertos', 'metrica', 'granularidad']

/**
 * Hasta que hubo portada, el Panorama vivía en "/". Los enlaces compartidos de entonces
 * (con filtros en la URL) se llevan a "/panorama" para que sigan funcionando.
 */
function Inicio() {
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  if (FILTROS.some((f) => params.has(f))) return <Navigate to={`/panorama${search}`} replace />
  return <Portada />
}

// Rutas de la web. La fase 4 añadirá aquí, p. ej., /dashboards.
export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={cargando}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Inicio />} />
            <Route path="panorama" element={<Panorama />} />
            <Route path="aeropuerto/:iata" element={<Aeropuerto />} />
            <Route path="rutas" element={<Rutas />} />
            <Route path="directo/:iata" element={<Directo />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
