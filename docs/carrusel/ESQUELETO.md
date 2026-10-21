# Carrusel diario de Instagram · Esqueleto

Estructura fija del carrusel que se publica cada día con los datos de un aeropuerto. Es la misma
para los 11 aeropuertos: cambian los datos y el titular, no la estructura. Este documento define
**qué cuenta cada diapositiva y cómo se eligen los datos**; el diseño visual va aparte.

El ejemplo usa Madrid-Barajas (MAD) el **lunes 19 de octubre de 2026**, con cifras reales del
histórico. El contrato de datos completo de ese ejemplo está en
[`ejemplo_MAD_2026-10-19.json`](ejemplo_MAD_2026-10-19.json).

---

## 1. Principios

1. **Día cerrado.** El carrusel cuenta el día anterior completo y se publica por la mañana. El
   día en curso está incompleto y daría cifras engañosas.
2. **Ninguna cifra va sola.** Cada dato protagonista lleva al lado su comparación (con un día
   normal, con los otros aeropuertos o con el histórico). "48 % puntual" no dice nada;
   "48 % puntual, 18 puntos menos que un lunes normal" sí.
3. **Lo que solo tiene este proyecto, siempre dentro.** El pipeline guarda cada cambio de cada
   vuelo: cuándo se anunció un retraso, cuántas veces cambió la hora, la puerta... Al menos dos
   diapositivas (6 y 7) salen de ahí. Es lo que diferencia la cuenta de cualquier otra.
4. **Mismas definiciones que la web.** Las cifras tienen que coincidir con las de la web y con
   [`web/backend/app/datos.py`](../../web/backend/app/datos.py):
   - **Salida** = salida física de un avión: los códigos compartidos se agrupan
     (aeropuerto + hora programada + destino). Todas las cifras del carrusel van por salida, no
     por número de vuelo.
   - **Retraso** = retraso **estimado** que publica el panel, no la hora real de despegue. Se
     descartan valores fuera de −60 a 600 minutos.
   - **Puntual** = 15 minutos o menos de retraso estimado.
5. **Verdad antes que impacto.** Si un dato no supera las reglas de calidad (apartado 5), se
   cambia por otro o no se publica. Nunca se fuerza un titular.
6. **No es AENA.** AENA es la fuente, no el autor: el carrusel no usa su marca ni da a entender que
   sea oficial (ver [`PRODUCT.md`](../../PRODUCT.md)).

---

## 2. Estructura: 10 diapositivas

| # | Diapositiva | Fija u opcional | Dato protagonista |
|:-:|---|---|---|
| 1 | Portada | Fija | El titular del día (elegido automáticamente) |
| 2 | El día en cifras | Fija | 4 indicadores con su comparación |
| 3 | ¿Cómo quedó frente al resto? | Fija | Puesto entre los 11 aeropuertos y en el histórico |
| 4 | El reloj de los retrasos | Opcional | La peor y la mejor franja horaria |
| 5 | El peor retraso del día | Fija | La salida con más retraso |
| 6 | Historia de un vuelo | Fija | La vida de un vuelo, cambio a cambio |
| 7 | Retrasos anunciados tarde | Opcional | % de retrasos avisados después de la hora |
| 8 | ¿A dónde se voló? | Fija | Destinos, países y el destino más lejano |
| 9 | El dato curioso | Fija | Uno del banco de curiosidades (rota) |
| 10 | Cierre | Fija | Cómo se mide + llamada a seguir la cuenta |

Mínimo 8 diapositivas (las fijas). Las opcionales se omiten si no superan sus reglas.

### 1 · Portada

- **Objetivo:** que se pare el scroll. Todo depende de esta diapositiva.
- **Contenido:** aeropuerto, fecha y día de la semana, **titular** (máx. ~60 caracteres) y
  **subtítulo** con la cifra que lo respalda.
- **Selección:** el motor de titulares (apartado 3) elige el dato más llamativo del día.
- **Ejemplo MAD:**
  > **Lunes de retrasos en Barajas: solo 1 de cada 2 vuelos salió puntual**
  > El segundo peor día desde que hay datos (16 de septiembre)

### 2 · El día en cifras

- **Objetivo:** foto del día en 5 segundos.
- **Contenido:** 4 indicadores fijos, cada uno con su diferencia frente a la **media del mismo día
  de la semana en las 4 semanas anteriores**:

  | Indicador | MAD 19-oct | Lunes normal | Diferencia |
  |---|--:|--:|--:|
  | Salidas | 622 | 624 | ≈ igual |
  | Puntualidad | 48 % | 67 % | −18 puntos |
  | Retraso medio | 29 min | 16 min | casi el doble |
  | Destinos | 168 (61 países) | 170 | ≈ igual |

- **Regla:** la diferencia solo se destaca (color, flecha) si es relevante: ±5 % en salidas y
  destinos, ±5 puntos en puntualidad, ±5 min en retraso medio. Si no, se muestra "≈ igual".
- **Lectura del ejemplo:** el mismo tráfico de siempre, pero con muchos más retrasos. El problema
  no fue el volumen.

### 3 · ¿Cómo quedó frente al resto?

- **Objetivo:** dar contexto. ¿Fue un mal día solo aquí o en toda España?
- **Contenido:**
  - Ranking de puntualidad de los **11 aeropuertos ese día**, con el aeropuerto protagonista
    resaltado.
  - **Puesto del día en el histórico** del aeropuerto ("2.º peor de 34 días").
- **Ejemplo MAD:** 7.º de 11 (48 %). Ese día el más puntual fue Tenerife Sur (78 %) y el último
  Barcelona (28 %). Fue el 2.º peor día de Barajas en 34 días; el peor, el 6 de octubre (47 %).
- **Lectura del ejemplo:** día malo en casi todo el país (Barcelona, Valencia y Palma, por
  debajo del 33 %), mientras los tres aeropuertos canarios superaron el 74 %.

### 4 · El reloj de los retrasos *(opcional)*

- **Objetivo:** responder "¿a qué hora es mejor volar?".
- **Contenido:** retraso medio por hora de salida programada, con la **peor** y la **mejor**
  franja señaladas.
- **Regla:** solo cuentan las franjas con 20 salidas o más. Si el aeropuerto no tiene al menos
  6 franjas así, se agrupa en mañana / tarde / noche; si tampoco hay datos suficientes, la
  diapositiva se omite.
- **Ejemplo MAD:** de 6:00 a 9:00 el retraso medio fue de unos 15 min; a las 12:00 llegó a
  41 min. Desde el mediodía y hasta las 22:00 no bajó de 29 min.

### 5 · El peor retraso del día

- **Objetivo:** la historia concreta, con nombre y destino.
- **Contenido:** la salida con más retraso estimado: hora programada, destino, aerolínea(s) y
  retraso en horas y minutos. Si había códigos compartidos, se listan todos ("un avión,
  4 números de vuelo"). Debajo, el contexto: cuántas salidas pasaron de 1 hora de retraso.
- **Ejemplo MAD:** Wizz Air W9 5356 a Londres-Luton, programado a las 12:30:
  **4 h 41 min** de retraso. Ese día 88 salidas pasaron de una hora de retraso.

### 6 · Historia de un vuelo *(dato exclusivo del pipeline)*

- **Objetivo:** enseñar lo que no ve nadie más: cómo evoluciona un vuelo en el panel.
- **Contenido:** línea de tiempo con los **hitos** del vuelo: apertura de mostradores, primer
  aviso de retraso, asignación de puerta, embarque, última llamada, cierre. Más una cifra
  gancho: cuántas veces cambió la hora estimada.
- **Selección:** entre las salidas con 60 min o más de retraso, la que tuvo más cambios.
- **Regla:** se muestran los hitos, no todos los eventos. Si el panel retrocede (por ejemplo,
  pasa de "Cerrado" a "Embarcando"), ese evento se ignora.
- **Ejemplo MAD:** Air Europa UX025 a Santa Cruz de la Sierra (Bolivia), programado a las
  23:35. **El panel cambió su hora de salida 21 veces.** Mostradores abiertos a las 11:51 →
  primer aviso de retraso a las 19:01 → puerta B29 asignada a las 22:21 → embarque a las
  00:01 → cerrado a la 01:01. Retraso final estimado: 1 h 59 min.

### 7 · Retrasos anunciados tarde *(opcional, dato exclusivo del pipeline)*

- **Objetivo:** un dato que cualquier pasajero entiende y que nadie más publica.
- **Contenido:** de las salidas que en algún momento mostraron más de 15 min de retraso, qué
  porcentaje lo anunció en el panel **después** de su hora programada, cuando el pasajero ya
  estaba en la puerta. (Son más que las retrasadas al final del día, porque algunas recuperan.)
- **Regla:** solo si hubo 20 o más salidas retrasadas. El pipeline consulta cada 10 minutos, así
  que el instante del aviso tiene ese margen; se indica en la letra pequeña.
- **Ejemplo MAD:** **57 %** (199 de 348): más de la mitad de los retrasos se anunciaron
  cuando el avión ya tenía que haber salido.

### 8 · ¿A dónde se voló?

- **Objetivo:** el lado aspiracional; es la diapositiva más fácil de compartir.
- **Contenido:** top 5 destinos por número de salidas, número de países, % de salidas
  internacionales y el **destino más lejano** con su distancia en kilómetros.
- **Ejemplo MAD:** Palma (22 salidas), Barcelona, Roma-Fiumicino, Lisboa y Gran Canaria
  (18 cada uno). 61 países; el 69 % de las salidas fue al extranjero. El más lejano:
  **Tokio-Narita, a 10.770 km**.

### 9 · El dato curioso

- **Objetivo:** sorpresa y variedad, para que los carruseles no se repitan.
- **Contenido:** **un** dato del banco de curiosidades. Se elige el de mayor puntuación que no se
  haya usado en ese aeropuerto en los últimos 7 días.
- **Banco inicial:**

  | Curiosidad | Ejemplo MAD 19-oct |
  |---|---|
  | Códigos compartidos: números de vuelo frente a aviones | 2.402 números de vuelo en 622 aviones |
  | Salidas que cambiaron de puerta | 74 salidas; una pasó por 3 puertas |
  | El destino más puntual (mín. 5 salidas) | Asturias: 7 min de retraso medio |
  | El modelo de avión más habitual | Por calcular por salida física |
  | La primera y la última salida del día | — |
  | Una ruta nueva o que no se veía en 30 días | — |

### 10 · Cierre

- **Contenido fijo:**
  - Cómo se mide, en 3 líneas: retraso estimado del panel (no la hora real de despegue),
    puntual = 15 min o menos, códigos compartidos agrupados.
  - Fuente: panel de salidas de AENA, consultado cada 10 minutos. Cuenta no oficial.
  - Llamada a la acción: "Mañana, otro aeropuerto. Síguenos" y enlace a la web.

---

## 3. Motor de titulares (portada)

Cada día se calculan todos los **candidatos** y se elige el de mayor puntuación. Un candidato
solo entra si supera su umbral.

| Candidato | Se activa si… | Puntos | Plantilla de titular |
|---|---|:-:|---|
| Récord del histórico | Mejor o peor día del aeropuerto en puntualidad, retraso medio o salidas | 100 | "El peor día de {aeropuerto} desde que hay datos" |
| Top 3 del histórico | Entre los 3 mejores o peores días | 80 | "{día} de retrasos en {aeropuerto}: solo {x} de cada {y} vuelos salió puntual" |
| Extremo del ranking | 1.º o último de los 11 aeropuertos ese día | 70 | "{aeropuerto}, el aeropuerto más puntual de España este {día}" |
| Desvío fuerte | Puntualidad a ±10 puntos o retraso medio a ±50 % de su día de la semana normal | 60 | "{x} minutos de retraso medio: el doble de un {día} normal" |
| Retraso extremo | Una salida con 4 h o más de retraso | 50 | "{h} horas esperando para volar a {destino}" |
| Aviso tardío | 60 % o más de retrasos anunciados después de la hora | 40 | "{x} de cada 10 retrasos se anunciaron con el avión ya en hora de salir" |
| Día normal | Ningún otro candidato | 10 | "Un {día} tranquilo en {aeropuerto}: {x} % de salidas puntuales" |

- **Empate:** gana el que esté más arriba en la tabla.
- **Subtítulo:** la cifra que respalda el titular, o el segundo candidato más puntuado.
- **Récords:** solo se anuncian con 28 días de histórico o más.
- **Lenguaje:** "1 de cada 2" mejor que "48,3 %" en la portada; las cifras exactas, en la
  diapositiva 2.

**Ejemplo MAD 19-oct:** se activan *Top 3 del histórico* (2.º peor día, 80 puntos), *Desvío
fuerte* (−18 puntos, 60) y *Retraso extremo* (4 h 41 min, 50). Gana el primero, y el subtítulo
usa su propia cifra.

### Aeropuerto del día

Cada día se publica **un solo carrusel**: el del aeropuerto con el titular más puntuado.

1. Se calcula el titular de los 11 aeropuertos para el día cerrado.
2. Se descartan los que **no son publicables** (reglas de calidad, apartado 5) y los que se
   **publicaron en los 5 días anteriores**.
3. Gana el de mayor puntuación. **Desempate**, en este orden:
   1. la puntuación del segundo candidato (el que sería el subtítulo);
   2. el que lleve más días sin publicarse;
   3. el que tenga más salidas ese día (más audiencia).
4. Se anota en un **registro de publicaciones** (fecha, aeropuerto, titular, puntos). Ese
   registro sirve para la regla de los 5 días y para que el dato curioso no se repita.

Consecuencias de esta regla:

- Con 11 aeropuertos y 5 días de bloqueo, cada día compiten al menos 6.
- Ningún aeropuerto puede salir más de una vez cada 6 días. Aun así, Madrid y Barcelona tenderán
  a ganar a menudo, porque con más vuelos alcanzan más candidatos. Si al cabo de un mes algún
  aeropuerto no ha salido nunca, se revisa la regla.
- Si ningún aeropuerto es publicable, ese día no hay carrusel y se avisa.

---

## 4. Comparaciones válidas

| Comparación | Definición | Por qué |
|---|---|---|
| Día normal | Media del **mismo día de la semana** en las 4 semanas anteriores | Un lunes no se compara con un domingo |
| Resto de aeropuertos | Los 11 aeropuertos el mismo día | Separa un problema local de uno general (meteorología, huelga, control aéreo) |
| Histórico | Todos los días completos del aeropuerto desde el 16-sep-2026 | Permite hablar de récords |

---

## 5. Reglas de calidad: cuándo no publicar

| Problema | Comprobación | Qué se hace |
|---|---|---|
| Día incompleto | Salidas < 80 % de las de un día normal | **No se publica**; se avisa para revisarlo |
| Hueco en el pipeline | Más de 60 min sin detecciones de ese aeropuerto | Se avisa; se omiten las diapositivas 6 y 7 |
| Muestras pequeñas | Porcentajes con menos de 20 salidas; destinos con menos de 5 | Ese dato no se usa |
| Retrasos imposibles | Fuera de −60 a 600 min | Se excluyen (igual que la web) |
| Panel que oscila | La hora estimada sube y baja varias veces | Se cuenta como dato curioso, pero el retraso final es el último publicado |
| Aerolínea vacía | Campo `aerolinea` vacío (124 vuelos en MAD el 19-oct) | Se muestra el código IATA o "aerolínea sin identificar" |
| Nombres en mayúsculas | AENA envía "ROMA /FIUMICINO" | Se normalizan: "Roma-Fiumicino" |

**Decisión: sin ranking de puntualidad por aerolínea.** No sabemos qué aerolínea opera cada
avión: en Madrid, los 186 vuelos de Qatar Airways del 19-oct son casi todos códigos compartidos
de Iberia, y salen con su mismo retraso. Un ranking por aerolínea sería injusto y fácil de
desmontar. Se recupera cuando el pipeline sepa qué aerolínea opera cada salida.

---

## 6. Adaptación a cada aeropuerto

La estructura es la misma, pero los aeropuertos pequeños tienen menos datos (Santiago: 26
salidas el 19-oct; Madrid: 622).

- **Menos de 50 salidas:** la diapositiva 4 usa mañana / tarde / noche y la 7 suele omitirse.
- **Titulares de comparación:** en aeropuertos pequeños pesan más el ranking y el histórico
  que las cifras absolutas.
- **Nombre en portada:** el nombre corto que la gente usa ("Barajas", "El Prat", "Son Sant Joan",
  "Rosalía de Castro"...). Se define una vez por aeropuerto.

---

## 7. Texto de la publicación

```
{Titular de la portada}

{2-3 frases con lo más relevante: el dato principal, la comparación y la curiosidad}

📊 Datos del {día} {fecha} · Salidas de {aeropuerto}
⏱️ Retraso estimado publicado en el panel. Puntual = 15 min o menos.
🔗 Explora todos los datos en la web (enlace en la bio)

#{IATA} #{Ciudad}Aeropuerto #aviacion #vuelos #retrasos #datos #dataviz
```

- **Hashtags:** 5 fijos + 2 del aeropuerto + 1 o 2 del dato del día (por ejemplo, del destino
  del peor retraso).
- **Texto alternativo:** cada diapositiva lleva el suyo, con las cifras escritas, para
  accesibilidad (Instagram lo permite).

---

## 8. Decisiones

**Tomadas**

- **Aeropuerto de cada día:** el del titular más puntuado, sin repetir aeropuerto en 5 días
  (ver "Aeropuerto del día", apartado 3).

**Pendientes**

1. **Hora de publicación.** Propuesta: 8:00, con el día anterior cerrado.
2. **¿Revisión manual antes de publicar?** Recomendada al menos el primer mes.
3. **Diseño visual:** pendiente, siguiendo el sistema de diseño de [`DESIGN.md`](../../DESIGN.md)
   o con una identidad propia para redes.
