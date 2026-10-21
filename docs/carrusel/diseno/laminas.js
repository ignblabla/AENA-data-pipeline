// Pinta una lámina del carrusel a partir de window.DATOS (el JSON del día).
// La lámina se elige con ?n=1..10; renderizar.py hace una captura de cada una.

const D = window.DATOS
const L = Object.fromEntries(D.diapositivas.map((d) => [d.n, d]))

const NOMBRES = {
  MAD: 'Madrid-Barajas', BCN: 'Barcelona', PMI: 'Palma', AGP: 'Málaga', LPA: 'Gran Canaria',
  TFS: 'Tenerife Sur', VLC: 'Valencia', SVQ: 'Sevilla', TFN: 'Tenerife Norte', SCQ: 'Santiago', MAH: 'Menorca',
}
const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']

// --- Formato -----------------------------------------------------------------

// Miles con punto siempre (Intl es-ES no agrupa los números de 4 cifras)
const miles = (x) => String(Math.round(x)).replace(/\B(?=(\d{3})+(?!\d))/g, '.')

function retraso(min) {
  const h = Math.floor(min / 60)
  const m = Math.round(min % 60)
  return h ? `+${h} H ${m} MIN` : `+${m} MIN`
}

function fechaLarga() {
  const [a, m, d] = D.dia.split('-').map(Number)
  return `${D.dia_semana} ${d} ${MESES[m - 1]} ${a}`
}

// --- Piezas ------------------------------------------------------------------

/** Texto en paletas: una celda fija por carácter, recortado o rellenado hasta `ancho`. */
function paleta(texto, ancho, { tono = 'normal', px = 34, derecha = false } = {}) {
  const t = String(texto).toUpperCase().slice(0, ancho)
  const relleno = ' '.repeat(ancho - t.length)
  const chars = [...(derecha ? relleno + t : t + relleno)]
  const celdas = chars.map((c) => `<span class="paleta-celda" aria-hidden="true">${c === ' ' ? '' : c}</span>`)
  return `<span class="paleta" data-tono="${tono}" style="font-size:${px}px" role="img" aria-label="${t}">${celdas.join('')}</span>`
}

const lampara = (estado) => `<span class="lampara" data-estado="${estado || 'apagada'}"></span>`

const flecha = `<svg class="icono" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>`

function lamina(cuerpo) {
  const iata = D.aeropuerto.iata
  return `
  <div class="lamina"><div class="panel">
    <header class="cabecera">
      <span style="display:flex;gap:0.6em">${paleta('Salidas', 7)}${paleta(iata, 3)}</span>
      <span class="fecha">${fechaLarga()}</span>
    </header>
    <section class="cuerpo">${cuerpo}</section>
    <footer class="pie">
      <span class="marca">Vuelos de salida</span>
      <span>Datos del panel de salidas de AENA · cuenta no oficial</span>
    </footer>
  </div></div>`
}

// --- Láminas -----------------------------------------------------------------

const LAMINAS = {
  1() {
    const d = L[1]
    const filas = d.filas_panel
      .map(
        (f) => `
        <span class="celda">${lampara('retraso')}</span>
        <span class="celda">${paleta(f.hora, 5, { px: 36 })}</span>
        <span class="celda">${paleta(f.destino, 10, { px: 36 })}</span>
        <span class="celda">${paleta(retraso(f.retraso_min), 11, { px: 36, tono: 'ambar' })}</span>`,
      )
      .join('')
    return lamina(`
      <h1 class="titulo portada">${d.titular}</h1>
      <p class="texto">${d.subtitulo}</p>
      <div class="empuje">
        <div class="tabla" style="grid-template-columns:18px auto auto 1fr;font-size:36px">
          <span class="encabezado"></span>
          <span class="encabezado etiqueta">Hora</span>
          <span class="encabezado etiqueta">Destino</span>
          <span class="encabezado etiqueta">Retraso estimado</span>
          ${filas}
        </div>
        <p class="etiqueta" style="display:flex;align-items:center;justify-content:flex-end;gap:10px;margin-top:26px;font-size:26px;color:var(--tinta-pintura)">
          Los datos del día ${flecha}
        </p>
      </div>`)
  },

  2() {
    const d = L[2]
    const fila = { salidas: 'Salidas', puntualidad_pct: 'Puntualidad', retraso_medio_min: 'Retraso medio', destinos: 'Destinos' }
    const valor = (id, v) =>
      id === 'puntualidad_pct' ? `${Math.round(v)} %` : id === 'retraso_medio_min' ? `${Math.round(v)} MIN` : miles(v)
    const diferencia = (i) => {
      if (!i.destacar) return 'IGUAL'
      const dif = Math.round(i.valor - i.normal)
      const signo = dif > 0 ? '+' : '-'
      return i.id === 'puntualidad_pct' ? `${signo}${Math.abs(dif)} PTS` : `${signo}${Math.abs(dif)} MIN`
    }
    const filas = d.indicadores
      .map(
        (i) => `
        <span class="celda">${lampara(i.destacar ? 'retraso' : '')}</span>
        <span class="celda etiqueta" style="font-size:26px;color:var(--tinta-pintura)">${fila[i.id]}</span>
        <span class="celda">${paleta(valor(i.id, i.valor), 6, { px: 40, derecha: true })}</span>
        <span class="celda">${paleta(valor(i.id, i.normal), 6, { px: 40, derecha: true, tono: 'tenue' })}</span>
        <span class="celda">${paleta(diferencia(i), 7, { px: 40, derecha: true, tono: i.destacar ? 'ambar' : 'tenue' })}</span>`,
      )
      .join('')
    return lamina(`
      <h1 class="titulo">El mismo tráfico de un lunes cualquiera, con casi el doble de retraso</h1>
      <div class="tabla" style="margin-top:64px;grid-template-columns:18px 1fr auto auto auto;font-size:36px;--fila:28px">
        <span class="encabezado"></span><span class="encabezado"></span>
        <span class="encabezado etiqueta" style="text-align:right">Lunes 19</span>
        <span class="encabezado etiqueta" style="text-align:right">Lunes normal</span>
        <span class="encabezado etiqueta" style="text-align:right">Diferencia</span>
        ${filas}
      </div>
      <p class="nota empuje">Lunes normal: media de los 4 lunes anteriores. Puntual: 15 minutos o menos de retraso estimado. Los ${d.indicadores[3].valor} destinos estaban en ${d.indicadores[3].paises} países.</p>`)
  },

  3() {
    const d = L[3]
    const yo = D.aeropuerto.iata
    const filas = d.ranking_puntualidad_pct
      .map((r, i) => {
        const mio = r.iata === yo
        const tono = mio ? 'normal' : 'tenue'
        return `
        <span class="celda">${paleta(String(i + 1), 2, { px: 30, tono, derecha: true })}</span>
        <span class="celda">${paleta(r.iata, 3, { px: 30, tono })}</span>
        <span class="celda etiqueta" style="font-size:26px;letter-spacing:0.06em;color:${mio ? 'var(--tinta-pintura)' : 'var(--pintura-tenue)'}">${NOMBRES[r.iata]}</span>
        <span class="celda"><span style="height:14px;width:${r.valor}%;background:${mio ? 'var(--tinta-pintura)' : '#55524d'}"></span></span>
        <span class="celda">${paleta(`${Math.round(r.valor)} %`, 4, { px: 30, tono, derecha: true })}</span>`
      })
      .join('')
    const peor = d.historico.peor_dia.split('-').map(Number)
    return lamina(`
      <h1 class="titulo">${d.puesto}.º de ${d.de}: un mal día casi en toda España</h1>
      <p class="texto">Los tres aeropuertos canarios superaron el 74 % de salidas puntuales. Barcelona, Valencia y Palma no llegaron al 33 %.</p>
      <div class="tabla" style="margin-top:40px;grid-template-columns:auto auto 230px 1fr auto;font-size:30px;--fila:7px">
        ${filas}
      </div>
      <p class="nota empuje">Para Barajas fue el ${d.historico.puesto_peor}.º peor día de ${d.historico.de_dias} con datos. El peor, el ${peor[2]} de ${MESES[peor[1] - 1].replace('oct', 'octubre')} (${Math.round(d.historico.peor_valor)} %).</p>`)
  },

  4() {
    const d = L[4]
    const ancho = 904, alto = 560, base = 500, techo = 45
    const horas = Array.from({ length: 18 }, (_, i) => i + 6)
    const paso = ancho / horas.length
    const y = (min) => base - (min / techo) * (base - 40)
    const porHora = Object.fromEntries(d.retraso_medio_por_hora.map((h) => [h.h, h]))
    const barras = horas
      .map((h, i) => {
        const x = i * paso + paso / 2
        const dato = porHora[h]
        const etiquetaHora = `<text x="${x}" y="${base + 40}" class="eje">${h}</text>`
        if (!dato) return `${etiquetaHora}<text x="${x}" y="${base - 12}" class="eje">–</text>`
        const destacada = h === d.peor.h || h === d.mejor.h
        const rotulo = destacada
          ? `<text x="${x}" y="${y(dato.min) - 16}" class="rotulo">${Math.round(dato.min)}</text>`
          : ''
        return `${etiquetaHora}${rotulo}<rect x="${x - 15}" y="${y(dato.min)}" width="30" height="${base - y(dato.min)}" fill="${destacada ? '#f2efe6' : '#6b6862'}"/>`
      })
      .join('')
    return lamina(`
      <h1 class="titulo">A las ${d.peor.h}:00, ${Math.round(d.peor.min)} minutos de retraso medio. A las ${d.mejor.h}:00, ${Math.round(d.mejor.min)}</h1>
      <p class="texto">Retraso medio estimado según la hora de salida programada.</p>
      <div class="empuje">
        <p class="etiqueta" style="display:flex;align-items:center;justify-content:flex-end;gap:14px;margin-bottom:8px">
          <span style="width:48px;border-top:2px dashed var(--etiqueta-panel)"></span> 15 min: límite de puntualidad
        </p>
        <svg viewBox="0 0 ${ancho} ${alto}" width="${ancho}" height="${alto}" role="img" aria-label="Retraso medio por hora">
          <style>
            .eje{font:600 22px 'Barlow Condensed';fill:#9a968c;text-anchor:middle}
            .rotulo{font:700 40px 'Barlow Condensed';fill:#f2efe6;text-anchor:middle}
          </style>
          <line x1="0" x2="${ancho}" y1="${base}" y2="${base}" stroke="#3a3a3a" stroke-width="2"/>
          ${barras}
          <line x1="0" x2="${ancho}" y1="${y(15)}" y2="${y(15)}" stroke="#9a968c" stroke-width="2" stroke-dasharray="6 6"/>
        </svg>
      </div>
      <p class="nota" style="margin-top:20px">En minutos. Solo horas con ${d.min_salidas_franja} salidas o más; de 0:00 a 5:59 y a las 22:00 hubo menos.</p>`)
  },

  5() {
    const d = L[5]
    const total = L[2].indicadores[0].valor
    const puntos = Array.from(
      { length: total },
      (_, i) => `<span class="lampara" style="width:11px;height:11px;box-shadow:none" data-estado="${i < d.contexto.salidas_mas_1h ? 'retraso' : ''}"></span>`,
    ).join('')
    return lamina(`
      <h1 class="titulo">4 horas y 41 minutos esperando para volar a Londres</h1>
      <div style="display:flex;align-items:flex-end;gap:36px;margin-top:48px">
        <div><p class="etiqueta">Programada</p><div style="margin-top:12px">${paleta(d.salida_programada, 5, { px: 84 })}</div></div>
        <span style="font-size:56px;color:var(--etiqueta-panel);padding-bottom:22px">${flecha}</span>
        <div><p class="etiqueta">Según el panel</p><div style="margin-top:12px">${paleta(d.hora_estimada, 5, { px: 84, tono: 'ambar' })}</div></div>
      </div>
      <p class="texto" style="margin-top:24px">Wizz Air W9 5356, de Madrid a Londres-Luton.</p>
      <div class="empuje">
        <p class="texto" style="margin:0 0 24px"><strong>${d.contexto.salidas_mas_1h} de las ${total} salidas</strong> del día pasaron de una hora de retraso. Cada punto es una salida.</p>
        <div style="display:grid;grid-template-columns:repeat(40,11px);gap:11px 11.6px">${puntos}</div>
      </div>`)
  },

  6() {
    const d = L[6]
    const [hp, mp] = d.salida_programada.split(':').map(Number)
    const tarde = (hhmm) => {
      const [h, m] = hhmm.split(':').map(Number)
      let dif = h * 60 + m - (hp * 60 + mp)
      if (dif < -720) dif += 1440 // pasada la medianoche
      return dif > 15
    }
    const horas = d.horas_estimadas
      .map(
        (h, i) => `
        <div>
          ${paleta(h, 5, { px: 28, tono: tarde(h) ? 'ambar' : 'normal' })}
          <p class="etiqueta" style="margin-top:8px;font-size:18px;letter-spacing:0.08em">a las ${d.vistas_a[i]}</p>
        </div>`,
      )
      .join('')
    const hitos = d.hitos
      .map(
        (h) => `
        <div style="position:relative;padding-top:34px">
          <span style="position:absolute;top:0;left:0;width:16px;height:16px;border-radius:50%;background:var(--tinta-pintura)"></span>
          ${paleta(h.hora, 5, { px: 24 })}
          <p class="nota" style="margin-top:12px;font-size:21px;padding-right:12px">${h.hito.replace(/^Primer aviso de retraso: /, 'Primer aviso: ')}</p>
        </div>`,
      )
      .join('')
    return lamina(`
      <h1 class="titulo">El panel cambió su hora de salida ${d.cambios_hora_estimada} veces</h1>
      <p class="texto">${d.vuelo}, de Madrid a ${d.destino}. Programado a las ${d.salida_programada}. Cada hora estimada, con la hora a la que la mostró el panel:</p>
      <div style="display:grid;grid-template-columns:repeat(7,auto);justify-content:space-between;row-gap:28px;margin-top:40px">${horas}</div>
      <p class="etiqueta" style="display:flex;align-items:center;gap:12px;margin-top:22px">${lampara('retraso')} Más de 15 minutos tarde</p>
      <div class="empuje" style="position:relative">
        <span style="position:absolute;top:7px;left:0;right:0;height:2px;background:#3a3a3a"></span>
        <div style="position:relative;display:grid;grid-template-columns:repeat(6,1fr)">${hitos}</div>
      </div>`)
  },

  7() {
    const d = L[7]
    const antes = d.salidas_con_aviso_retraso - d.avisadas_tarde
    const ancho = 904
    const paso = ancho / d.salidas_con_aviso_retraso
    const marcas = Array.from(
      { length: d.salidas_con_aviso_retraso },
      (_, i) => `<rect x="${(i * paso).toFixed(2)}" y="0" width="${(paso * 0.6).toFixed(2)}" height="200" fill="${i < antes ? '#6b6862' : '#f2a900'}"/>`,
    ).join('')
    const corte = antes * paso
    return lamina(`
      <h1 class="titulo">Casi 6 de cada 10 retrasos se anunciaron con el avión ya en hora de salir</h1>
      <p class="texto"><strong>${d.salidas_con_aviso_retraso} salidas</strong> llegaron a marcar más de 15 minutos de retraso. <strong>${d.avisadas_tarde}</strong> lo avisaron en el panel después de su hora programada.</p>
      <div class="empuje">
        <div style="display:grid;grid-template-columns:${corte}px 1fr;margin-bottom:20px">
          <div><p class="etiqueta">Avisado antes</p><div style="margin-top:10px">${paleta(`${100 - d.pct} %`, 4, { px: 52, tono: 'tenue' })}</div></div>
          <div style="padding-left:12px"><p class="etiqueta">Avisado después de la hora</p><div style="margin-top:10px">${paleta(`${d.pct} %`, 4, { px: 52, tono: 'ambar' })}</div></div>
        </div>
        <svg viewBox="0 0 ${ancho} 200" width="${ancho}" height="200" role="img" aria-label="${antes} avisadas antes y ${d.avisadas_tarde} después">${marcas}</svg>
        <p class="nota" style="margin-top:20px">Cada raya es una salida. El pipeline consulta el panel cada 10 minutos, así que el momento del aviso tiene ese margen.</p>
      </div>`)
  },

  8() {
    const d = L[8]
    const filas = d.top
      .map(
        (t) => `
        <span class="celda">${paleta(t.ciudad, 17, { px: 38 })}</span>
        <span class="celda">${paleta(String(t.salidas), 3, { px: 38, derecha: true })}</span>`,
      )
      .join('')
    return lamina(`
      <h1 class="titulo">${d.paises} países en un solo día. El más lejano, a ${miles(d.mas_lejano.km)} km</h1>
      <div class="tabla" style="margin-top:56px;grid-template-columns:1fr auto;font-size:36px">
        <span class="encabezado etiqueta">Destinos con más salidas</span>
        <span class="encabezado etiqueta" style="text-align:right">Salidas</span>
        ${filas}
      </div>
      <div class="empuje">
        <p class="etiqueta">El destino más lejano</p>
        <div style="display:flex;justify-content:space-between;margin-top:14px">${paleta(d.mas_lejano.ciudad, 12, { px: 46 })}${paleta(`${miles(d.mas_lejano.km)} KM`, 9, { px: 46, derecha: true })}</div>
        <p class="texto">El ${d.pct_internacional} % de las salidas fue al extranjero.</p>
      </div>`)
  },

  9() {
    const d = L[9]
    const e = d.ejemplo
    const codigos = e.vuelos.map((v) => `<div>${paleta(v, 6, { px: 52 })}</div>`).join('')
    return lamina(`
      <h1 class="titulo">${miles(d.valores.numeros_vuelo)} números de vuelo. ${d.valores.salidas} aviones</h1>
      <p class="texto">Un mismo avión se vende con códigos de varias aerolíneas. A las ${e.hora} salió uno hacia ${e.destino} con ${e.vuelos.length} números distintos:</p>
      <div style="display:flex;gap:28px;margin-top:56px">${paleta(e.hora, 5, { px: 52 })}${paleta(e.destino, 9, { px: 52 })}</div>
      <div style="display:flex;align-items:center;gap:36px;margin-top:28px">
        <div style="display:grid;gap:14px">${codigos}</div>
        <span style="flex-shrink:0;align-self:stretch;width:24px;border:2px solid var(--etiqueta-panel);border-left:0"></span>
        ${paleta('1 avión', 7, { px: 52 })}
      </div>
      <p class="texto empuje">En Barajas salen casi <strong>${(d.valores.numeros_vuelo / d.valores.salidas).toFixed(1).replace('.', ',')} números de vuelo por avión</strong>. Por eso aquí se cuentan salidas, no números de vuelo.</p>`)
  },

  10() {
    const d = L[10]
    const filas = [
      ['Retraso', 'El estimado que publica el panel, no la hora real de despegue.'],
      ['Puntual', 'Con 15 minutos o menos de retraso.'],
      ['Salida', 'Un avión: los códigos compartidos cuentan una vez.'],
      ['Fuente', 'El panel de salidas de AENA, consultado cada 10 minutos. Cuenta independiente, no oficial.'],
    ]
      .map(
        ([k, v]) => `
        <span class="celda">${paleta(k, 7, { px: 32 })}</span>
        <span class="celda texto" style="margin:0;font-size:27px">${v}</span>`,
      )
      .join('')
    return lamina(`
      <h1 class="titulo">Cómo se mide</h1>
      <div class="tabla" style="margin-top:48px;grid-template-columns:auto 1fr;font-size:32px">${filas}</div>
      <div class="empuje">
        <div class="boton">Mañana, otro aeropuerto ${flecha}</div>
        <p class="texto" style="margin-top:22px">Cada día, el aeropuerto español con el dato más llamativo. Síguenos para no perdértelo.</p>
      </div>`)
  },
}

const n = Number(new URLSearchParams(location.search).get('n') || 1)
document.getElementById('lamina').innerHTML = LAMINAS[n]()
