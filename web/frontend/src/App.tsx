import { Center, Loader } from '@mantine/core'
import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router'
import { Layout } from './componentes/Layout'
import { Panorama } from './paginas/Panorama'

// Las páginas secundarias se descargan solo cuando se visitan
const Aeropuerto = lazy(() => import('./paginas/Aeropuerto').then((m) => ({ default: m.Aeropuerto })))
const Rutas = lazy(() => import('./paginas/Rutas').then((m) => ({ default: m.Rutas })))
const Directo = lazy(() => import('./paginas/Directo').then((m) => ({ default: m.Directo })))

const cargando = (
  <Center h={300}>
    <Loader size="sm" />
  </Center>
)

// Rutas de la web. La fase 4 añadirá aquí, p. ej., /dashboards.
export function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={cargando}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<Panorama />} />
            <Route path="aeropuerto/:iata" element={<Aeropuerto />} />
            <Route path="rutas" element={<Rutas />} />
            <Route path="directo/:iata" element={<Directo />} />
            <Route path="*" element={<Panorama />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
