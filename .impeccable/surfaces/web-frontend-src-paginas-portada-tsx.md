---
version: 1
slug: "web-frontend-src-paginas-portada-tsx"
primary_target: "web/frontend/src/paginas/Portada.tsx"
related_targets: ["web/frontend/src/paginas/Panorama.tsx","web/frontend/src/paginas/Aeropuerto.tsx","web/frontend/src/paginas/Rutas.tsx","web/frontend/src/paginas/Directo.tsx"]
---

## Alcance

Superficie: Portada (`/`), modo Persuade. Las páginas de análisis (Panorama en `/panorama`, Aeropuerto, Rutas, En directo) heredan el mismo mundo en modo Operate. Público: reclutadores y revisores técnicos, pocos minutos, sin contexto previo. Acción principal: entrar a explorar los datos. Prueba: datos reales del pipeline (salidas en el panel, cifras del histórico). Restricciones: no parecer AENA ni aerolínea, no plantilla, fotos con un papel claro (una por superficie como máximo), claro y oscuro de primera.

## Direction contract

THESIS: La web es un panel de salidas de paletas abatibles: las cifras reales caen letra a letra en celdas fijas. Rechaza la portada de producto (titular, subtítulo, botón, fila de tarjetas) y el dashboard de tarjetas grises.

OWN-WORLD: Cuatro tintas: negro de paleta #141414, blanco de pintura #f2efe6, ámbar de lámpara #f2a900 (solo retraso y lo que cambia ahora), rojo #c8372d (solo cancelado). Suelo de acero claro y liso de día (sin texturas imitadas), vestíbulo oscuro de noche; el panel es siempre negro. Marco de acero alrededor del panel. Letra condensada en mayúsculas dentro de celdas con la raya horizontal de la paleta; retícula de celdas fijas como composición; cifras tabulares. Una única foto de avión enmarcada como el cartel del vestíbulo, con crédito.

STORY: En una pantalla el visitante entiende que esto registra cada cambio de cada salida de 11 aeropuertos cada 10 minutos, lo ve ocurrir en el panel y cree que es un producto real con datos propios. Pulsa «Explorar los datos».

FIRST VIEWPORT: Barra de navegación en tira de acero. Izquierda (~62 %): panel negro con marco de acero; titular «SALIDAS · MAD» en paletas grandes; 8-9 filas reales (hora, vuelo, destino, puerta, estado) con lámpara ámbar en los retrasos y rojo en cancelados; las filas caen en cascada al cargar y al cambiar de aeropuerto. Reloj del panel en paletas ámbar con la hora de la última extracción de ese aeropuerto. Al pie del panel, el registro del pipeline en celdas (cambios, vuelos, destinos, países): se movió desde la columna derecha porque allí dejaba las columnas descompensadas y empujaba la acción bajo el pliegue, y porque el registro pertenece al propio panel. Derecha: cartel con la foto del avión y el titular (h1); debajo, la paleta ámbar «EXPLORAR LOS DATOS» como acción principal. En móvil el orden es panel (5 filas), acción y cartel, para que la acción quepa en la primera pantalla.

FORM: Panel de salidas Solari de paletas abatibles, candidato 5 de la lista ordenada (asignado por el sorteo). Interacción insignia: la cascada carácter a carácter de las paletas (texto real accesible por debajo, reducida a un cambio único con movimiento reducido). seed:df42b7437ed6c9ef

RAISES: retícula de celdas fijas en toda la web (panel ferroviario); paleta cerrada a cuatro tintas (risografía); ámbar solo para lo que cambia (autómata); la profundidad es el tiempo, cada fila deja ver los estados por los que pasó (muro de carteles); la ausencia informa con celdas vacías (álbum).

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
