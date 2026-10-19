import { ActionIcon, AppShell, Burger, Container, Group, Menu, Text, useComputedColorScheme, useMantineColorScheme } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { Moon, Sun } from 'lucide-react'
import { motion } from 'motion/react'
import { Link, Outlet, useLocation } from 'react-router'
import { useMeta } from '../api/consultas'
import { useBusquedaComun } from '../estado/filtros'
import { formato } from '../tema/formato'
import { textos } from '../textos'

// Cada página: a dónde enlaza y qué rutas la marcan como activa
const PAGINAS = [
  { ruta: '/panorama', etiqueta: textos.navegacion.panorama, activa: (ruta: string) => ruta.startsWith('/panorama') },
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
      {/* Cabecera: una tira de acero, como el marco de los paneles */}
      <AppShell.Header style={{ backgroundColor: 'var(--acero-tira)' }}>
        <Container size="xl" h="100%">
          <Group h="100%" justify="space-between" wrap="nowrap">
            <Group gap="lg" wrap="nowrap">
              {/* En móvil, las páginas van en un menú desplegable */}
              <Menu opened={menuAbierto} onChange={menu.toggle} position="bottom-start" width={220}>
                <Menu.Target>
                  <Burger opened={menuAbierto} hiddenFrom="md" size="sm" aria-label={textos.navegacion.menu} />
                </Menu.Target>
                <Menu.Dropdown>
                  <Menu.Item component={Link} to="/" fw={pathname === '/' ? 700 : 400}>
                    {textos.navegacion.inicio}
                  </Menu.Item>
                  {PAGINAS.map((p) => (
                    <Menu.Item key={p.ruta} component={Link} to={`${p.ruta}${busqueda}`} fw={p.activa(pathname) ? 700 : 400}>
                      {p.etiqueta}
                    </Menu.Item>
                  ))}
                </Menu.Dropdown>
              </Menu>
              <Link to="/" className="marca" aria-label={`${textos.app.titulo}: ${textos.navegacion.inicio}`}>
                {textos.app.titulo}
              </Link>
              <Group gap={2} visibleFrom="md" wrap="nowrap" component="nav" aria-label={textos.navegacion.menu}>
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
                <Text size="xs" c="dimmed" ta="right" visibleFrom="lg">
                  {textos.app.datosHasta} {formato.fechaHora(meta.rango.ultima_deteccion)}
                </Text>
              )}
              <ActionIcon
                variant="subtle"
                color="dark"
                size="lg"
                onClick={() => setColorScheme(esquema === 'dark' ? 'light' : 'dark')}
                aria-label={textos.app.cambiarTema}
                title={textos.app.cambiarTema}
              >
                {esquema === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
              </ActionIcon>
            </Group>
          </Group>
        </Container>
      </AppShell.Header>
      <AppShell.Main>
        <Container size="xl" py="xl">
          {/* Transición suave al cambiar de página (se desactiva si el sistema pide reducir el movimiento) */}
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Outlet />
          </motion.div>
        </Container>
      </AppShell.Main>
    </AppShell>
  )
}
