import '@mantine/core/styles.css'
import '@mantine/dates/styles.css'
import './index.css'

import { MantineProvider } from '@mantine/core'
import { DatesProvider } from '@mantine/dates'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import 'dayjs/locale/es'
import { MotionConfig } from 'motion/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { tema } from './tema/mantine'

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 60_000, refetchOnWindowFocus: false, retry: 1 },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={tema} defaultColorScheme="auto">
      <DatesProvider settings={{ locale: 'es', firstDayOfWeek: 1 }}>
        <QueryClientProvider client={clienteConsultas}>
          {/* Las animaciones respetan la preferencia del sistema "reducir movimiento" */}
          <MotionConfig reducedMotion="user">
            <App />
          </MotionConfig>
        </QueryClientProvider>
      </DatesProvider>
    </MantineProvider>
  </StrictMode>,
)
