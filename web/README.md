# Web de exploración · AENA

Web local para explorar el histórico que genera el pipeline ETL (`data/historico_parquet/`).
Es independiente del pipeline: solo **lee** los parquet y no modifica nada fuera de `web/`.

```
web/
├── backend/    API en Python (FastAPI + DuckDB) que lee los parquet y calcula las métricas
├── frontend/   Interfaz (React + TypeScript + Vite, gráficos con Apache ECharts, componentes Mantine)
└── arrancar.ps1
```

## Cómo arrancarla

Requisitos: el `venv` del proyecto (Python 3.12) y [Node.js](https://nodejs.org) 20 o superior.

**Opción rápida (Windows):** desde la raíz del repositorio

```powershell
powershell -ExecutionPolicy Bypass -File web\arrancar.ps1
```

**Opción manual**, en dos terminales:

```powershell
# Terminal 1: backend (desde la raíz del repositorio)
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000 --app-dir web/backend

# Terminal 2: frontend
cd web\frontend
npm install        # solo la primera vez
npm run dev
```

- Web: <http://localhost:5173>
- Documentación interactiva de la API: <http://localhost:8000/docs>

**Datos nuevos:** el pipeline sube datos a GitHub cada 10 minutos, pero tu copia local solo cambia
con un `git pull`. Después, el backend los detecta solo en un máximo de 5 minutos (no hace falta
reiniciarlo) y la página "En directo" se refresca cada minuto.

Para no tener que hacer `git pull` a mano, crea una tarea programada de Windows que lo hace cada
10 minutos en segundo plano, mientras tu sesión está iniciada:

```powershell
powershell -ExecutionPolicy Bypass -File web\programar_actualizacion.ps1           # crearla
powershell -ExecutionPolicy Bypass -File web\programar_actualizacion.ps1 -Quitar   # quitarla
```

Cada ejecución queda anotada en `web/actualizacion_datos.log` (ignorado por Git). Solo hace
"avance rápido" (`git pull --ff-only`): si la copia local tuviera commits propios o cambios que
chocasen con lo que llega, no toca nada y anota el error. La tarea también aparece en el
"Programador de tareas" de Windows como *AENA - actualizar datos de la web*.

## Qué muestra

Filtros globales (periodo y métrica, más aeropuertos en el panorama) guardados en la URL:
cualquier vista se puede compartir copiando el enlace. Cada gráfico tiene una vista de **tabla**,
y hay modo claro/oscuro con el botón de la cabecera.

**Portada** (`/`)
- Presenta el proyecto como un **panel de salidas de paletas abatibles**: las próximas salidas reales
  del aeropuerto elegido caen letra a letra, con el reloj de la última extracción y las cifras del
  histórico al pie. A la derecha, el cartel con la fotografía y la acción «Explorar los datos».
- Debajo, el recorrido de un dato cada 10 minutos (con cifras reales) y las secciones como puertas de embarque.

**Panorama** (`/panorama`; los enlaces antiguos a `/?metrica=…` redirigen aquí)
- Indicadores: salidas, retraso medio estimado, puntualidad y cancelaciones.
- **Mapa** de los 11 aeropuertos (con recuadro de Canarias): tamaño = salidas, color = métrica elegida.
  Pulsar un aeropuerto abre su detalle.
- Ranking de aeropuertos (pulsa una barra para filtrar por ese aeropuerto).
- Evolución por **día, semana o mes**. En semanas y meses las salidas se muestran como media diaria
  y los periodos incompletos aparecen atenuados.
- Minigráficas por aeropuerto (pulsa una para ver su detalle).
- Destinos con más salidas y aerolíneas con más vuelos.

**Detalle de aeropuerto** (`/aeropuerto/MAD`, `/aeropuerto/BCN`…)
- Indicadores con la diferencia frente al conjunto de los 11 aeropuertos (▲/▼, en verde si es favorable).
- Evolución por día, semana o mes.
- **Mapa de calor** día de la semana × hora programada (salidas medias por día, retraso, puntualidad o cancelaciones).
- **Histograma** del retraso estimado en tramos de 5 min, con el umbral de puntualidad marcado.
- **Puntualidad por aerolínea** (las 12 con más vuelos) y destinos principales.
- Accesos directos a su panel en directo y a sus rutas.

**Rutas** (`/rutas`)
- **Mapa mundial de rutas**: arcos de círculo máximo (el camino real de un avión) desde los aeropuertos
  de origen, con grosor según las salidas y color según la métrica. Los puntos animados recorren las
  250 rutas más frecuentes (se puede pausar; si el sistema pide reducir movimiento, no se animan).
- Destinos, países, % de salidas internacionales y distancia media; rutas y países con más salidas.

**En directo** (`/directo/MAD`, `/directo/BCN`…)
- El **panel de salidas** tal como lo mostraba AENA en la última extracción del pipeline
  (`data/estado_actual/`), con los códigos compartidos agrupados en una fila, el retraso
  estimado y el estado. Se refresca solo cada minuto y se puede buscar por vuelo, destino o aerolínea.
- Pulsa un vuelo para ver su **historial**: gráfica del retraso estimado a lo largo del tiempo y
  línea temporal con cada cambio detectado (estado, puerta, hora estimada, mostradores, terminal, avión).
  El historial abierto queda en la URL (`?vuelo=…`), así que se puede compartir.

### Cómo se calculan las métricas

El histórico guarda **eventos** (cada vez que cambia algo de un vuelo), no vuelos. El backend:

| Concepto | Definición |
|---|---|
| Vuelo comercial | Último estado conocido de cada `clave_vuelo` |
| Salida física | Vuelos agrupados por aeropuerto + hora programada + destino. Elimina los **códigos compartidos** (un mismo avión vendido por Iberia, American, Qatar…: ~2,2 códigos por avión) |
| Día | Fecha de la salida programada |
| Cancelada | Último estado `CAN` |
| Retraso estimado | Última hora estimada − hora programada. **No es la hora real de despegue** (la fuente no la da). Se descartan valores fuera de −60…600 min |
| Puntual | Retraso estimado ≤ 15 min |

Por defecto se excluyen el primer día (el pipeline empezó a mitad de día) y el día en curso.
La fuente solo incluye **salidas**: no hay llegadas ni pasajeros.

## Arquitectura

**Backend** (`backend/app/`)

| Archivo | Función |
|---|---|
| `main.py` | Crea la app FastAPI y registra las rutas bajo `/api` |
| `datos.py` | Carga en DuckDB (en memoria) el histórico, la foto del panel (`estado_actual/*.pkl`) y las coordenadas de destinos; construye `eventos`, `vuelos`, `salidas`, `directo` y `aeropuertos_mundo`; recarga si cambian los archivos |
| `filtros.py` | Filtros comunes (`desde`, `hasta`, `aeropuertos`) y agregaciones compartidas |
| `catalogo.py` | Nombres y coordenadas de aeropuertos, traducción de estados |
| `esquemas.py` | Modelos de respuesta (documentan la API en `/docs`) |
| `routers/` | Un archivo por grupo de endpoints |
| `referencia/aeropuertos_mundo.csv` | Coordenadas y país de 8.800 aeropuertos ([OurAirports](https://ourairports.com/data/), dominio público) |
| `../scripts/actualizar_aeropuertos_mundo.py` | Regenera ese CSV (solo hace falta si aparecen destinos nuevos sin coordenadas) |
| `../scripts/exportar_openapi.py` | Exporta el esquema de la API para generar los tipos del frontend |

| Endpoint | Devuelve |
|---|---|
| `/api/meta` | Aeropuertos (con coordenadas), periodo disponible, umbral de puntualidad |
| `/api/resumen` | Indicadores del periodo |
| `/api/series/temporal?granularidad=dia\|semana\|mes&agrupar=total\|aeropuerto` | Serie temporal; marca los periodos incompletos |
| `/api/rankings/aeropuertos?metrica=…` | Métricas por aeropuerto |
| `/api/rankings/destinos`, `/api/rankings/aerolineas` | Rankings (con `limite`) |
| `/api/aeropuertos/{iata}/horario` | Celdas día de la semana × hora |
| `/api/aeropuertos/{iata}/retrasos` | Histograma de retrasos, mediana y percentil 90 |
| `/api/rutas` | Salidas y métricas por par origen → destino, con coordenadas y país del destino |
| `/api/directo/{iata}?limite=80` | Panel de salidas de la última foto del pipeline (códigos compartidos agrupados) |
| `/api/vuelos/historial?clave=…` | Todos los cambios detectados de un vuelo |

Todos aceptan `?desde=AAAA-MM-DD&hasta=AAAA-MM-DD`, y los que no llevan el aeropuerto en la ruta,
también `&aeropuertos=MAD&aeropuertos=BCN`.

> Nota: `pd.read_parquet("data/historico_parquet/")` falla porque la columna `aeropuerto`
> está dentro de los archivos y también en la ruta (`aeropuerto=XXX`). El backend lee con
> `hive_partitioning=false` para evitarlo.

> Los `.pkl` de `estado_actual` se leen con `pandas.read_pickle`, que puede ejecutar código:
> solo deben cargarse los generados por el propio pipeline de este repositorio.

**Frontend** (`frontend/src/`)

| Carpeta / archivo | Función |
|---|---|
| `api/` | Cliente HTTP, un hook por endpoint (TanStack Query) y los tipos: `esquema.d.ts` se **genera** desde la API (no se edita a mano) y `tipos.ts` le da nombres cortos |
| `estado/filtros.ts` | Filtros globales sincronizados con la URL |
| `tema/` | Colores de gráficos (claro/oscuro), tema de Mantine, formatos en español, catálogo de métricas |
| `componentes/graficos/` | `Grafico.tsx` (envoltorio único de ECharts), `opciones.ts` (estilo común) y los gráficos concretos |
| `componentes/mapa/` | Mapas con MapLibre GL (`base.ts`, común): aeropuertos y rutas (este con capas de deck.gl). Se descargan solo cuando se muestran |
| `componentes/directo/` | Panel de salidas, insignias de estado/retraso e historial de un vuelo |
| `paginas/` | Una página por ruta: `Portada`, `Panorama`, `Aeropuerto`, `Rutas` y `Directo` |
| `componentes/panel/` | `Paleta` (texto en paletas abatibles con su animación en cascada) y `Tablero` (panel de salidas sobre una tabla semántica) |
| `textos.ts` | Todos los textos de la interfaz |

### Diseño

El mundo visual es **«el panel de paletas»**: cuatro tintas (negro de paleta, blanco de pintura, ámbar
solo para retrasos y lo que cambia, rojo solo para cancelaciones) sobre acero liso, con Barlow Condensed
(autoalojada) para lo que se anuncia y la tipografía del sistema para leer. Está documentado en
[`DESIGN.md`](../DESIGN.md) (tokens y reglas) y [`.impeccable/design.json`](../.impeccable/design.json);
el contexto del producto, en [`PRODUCT.md`](../PRODUCT.md). Se diseñó con la skill Impeccable.

**Fotografía:** `public/imagenes/avion-aproximacion-palma.jpg`, «Airplane approaching to Palma de
Mallorca airport» de Abrget47j, [CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0), vía
[Wikimedia Commons](https://commons.wikimedia.org/wiki/File:Airplane_approaching_to_Palma_de_Mallorca_airport.jpg).
El crédito aparece en la portada y el origen va incrustado en el propio archivo; los datos de licencia
están en `public/imagenes/credits.json`.

El **mapa base** es el de [CARTO](https://carto.com/basemaps) (claro u oscuro según el tema), gratuito
con atribución y sin clave de API. Necesita conexión a internet: sin ella, los aeropuertos se siguen
viendo pero sin el mapa de fondo. La URL del estilo está en `tema/tokens.ts`.

Las animaciones (transiciones entre páginas, filas del panel, línea temporal) usan
[Motion](https://motion.dev) y respetan la opción del sistema "reducir movimiento".

**Tipos compartidos backend → frontend.** Si cambias un modelo de `esquemas.py`:

```powershell
venv\Scripts\python web\backend\scripts\exportar_openapi.py   # escribe web/frontend/openapi.json
cd web\frontend; npm run tipos                                   # regenera src/api/esquema.d.ts
```

y TypeScript señalará en el frontend todo lo que haya que ajustar.

Para añadir un gráfico: crear un componente en `componentes/graficos/` que construya sus opciones
con `opcionBase()` y lo pinte con `<Grafico>`, y envolverlo en `<TarjetaGrafico>` en la página.

## Tests y comprobaciones

```powershell
venv\Scripts\python -m pytest web/backend/tests   # backend
cd web\frontend; npm run build; npx oxlint src    # tipos, compilación y lint del frontend
```

## Fases

1. ~~**Fase 1:** API + página Panorama.~~ ✅
2. ~~**Fase 2:** detalle por aeropuerto (mapa de calor, histograma de retrasos, puntualidad por aerolínea,
   vista semanal/mensual) y mapa de los 11 aeropuertos.~~ ✅
3. ~~**Fase 3:** mapa de rutas con arcos animados (deck.gl), panel "en directo" a partir de `data/estado_actual/`,
   línea temporal de un vuelo (cambios de puerta y estado), transiciones animadas, tipos TypeScript generados desde OpenAPI.~~ ✅
4. **Fase 4:** dashboards personalizables (arrastrar y redimensionar widgets), comparador entre aeropuertos o periodos,
   exportar CSV/PNG.
5. **Fase 5:** agregados precalculados si el histórico crece mucho, división del bundle, Docker y despliegue, tests end-to-end.
