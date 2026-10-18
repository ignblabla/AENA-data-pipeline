import { ActionIcon, AppShell, Burger, Container, Group, Menu, Text, Title, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { motion } from 'motion/react'
import { Link, Outlet, useLocation } from 'react-router'
import { useMeta } from '../api/consultas'
import { useBusquedaComun } from '../estado/filtros'
import { formato } from '../tema/formato'
import { textos } from '../textos'

// Cada página: a dónde enlaza y qué rutas la marcan como activa
const PAGINAS = [
  { ruta: '/', etiqueta: textos.navegacion.panorama, activa: (ruta: string) => ruta === '/' },
  { ruta: '/aeropuerto/MAD', etiqueta: textos.navegacion.aeropuertos, activa: (ruta: string) => ruta.startsWith('/aeropuerto/') },
  { ruta: '/rutas', etiqueta: textos.navegacion.rutas, activa: (ruta: string) => ruta.startsWith('/rutas') },
  { ruta: '/directo/MAD', etiqueta: textos.navegacion.directo, activa: (ruta: string) => ruta.startsWith('/directo/') },
]

export function Layout() {
  const { data: meta } = useMeta()
  const { setColorScheme } = useMantineColorScheme()
  const esquema = useComputedColorScheme('light')
  const { pathname } = useLocation()
  // Al cambiar de página se conservan periodo y métrica
  const busqueda = useBusquedaComun()
  const [menuAbierto, menu] = useDisclosure(false)

  return (
    <AppShell header={{ height: 64 }} padding={0}>
      <AppShell.Header>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="lg" wrap="nowrap">
              {/* En móvil, las páginas van en un menú desplegable */}
              <Menu opened={menuAbierto} onChange={menu.toggle} position="bottom-start" width={220}>
                <Menu.Target>
                  <Burger opened={menuAbierto} hiddenFrom="sm" size="sm" aria-label={textos.navegacion.menu} />
                </Menu.Target>
                <Menu.Dropdown>
                  {PAGINAS.map((p) => (
                    <Menu.Item key={p.ruta} component={Link} to={`${p.ruta}${busqueda}`} fw={p.activa(pathname) ? 650 : 400}>
                      {p.etiqueta}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <div>
                <Title order={1} fz="lg" lh={1.2}>
                  {textos.app.titulo}
                </Title>
                <Text size="xs" c="dimmed" visibleFrom="xs">
                  {textos.app.subtitulo}
                </Text>
              </div>
              <Group gap={4} visibleFrom="sm" wrap="nowrap">
                {PAGINAS.map((p) => (
                  <Link
                    key={p.ruta}
                    to={`${p.ruta}${busqueda}`}
                    className={p.activa(pathname) ? 'enlace-nav active' : 'enlace-nav'}
                    aria-current={p.activa(pathname) ? 'page' : undefined}
                  >
                    {p.etiqueta}
                  </Link>
                ))}
              </Group>
            </Group>
            <Group gap="sm" wrap="nowrap">
              {meta && (
                <Text size="xs" c="dimmed" ta="right" visibleFrom="md">
                  {textos.app.datosHasta} {formato.fechaHora(meta.rango.ultima_deteccion)}
                </Text>
              )}
              <ActionIcon
                variant="default"
                size="lg"
                onClick={() => setColorScheme(esquema === 'dark' ? 'light' : 'dark')}
                aria-label={textos.app.cambiarTema}
                title={textos.app.cambiarTema}
              >
                {esquema === 'dark' ? <IconoSol /> : <IconoLuna />}
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" py="lg">
          {/* Transición suave al cambiar de página (se desactiva si el sistema pide reducir el movimiento) */}
          <motion.div key={pathname} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25, ease: 'easeOut' }}>
            <Outlet />
          </motion.div>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}

function IconoSol() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  )
}

function IconoLuna() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  )
}
