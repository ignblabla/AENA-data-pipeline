// Geometría para dibujar rutas: arcos de círculo máximo (el camino más corto
// sobre la esfera, el que siguen los aviones) y distancias.

export type Coordenada = [lon: number, lat: number]

const RAD = Math.PI / 180
const RADIO_TIERRA_KM = 6371

function aVector([lon, lat]: Coordenada): [number, number, number] {
  const f = lat * RAD
  const l = lon * RAD
  return [Math.cos(f) * Math.cos(l), Math.cos(f) * Math.sin(l), Math.sin(f)]
}

/** Distancia en km sobre la superficie terrestre (fórmula del haversine). */
export function distanciaKm(a: Coordenada, b: Coordenada): number {
  const dLat = (b[1] - a[1]) * RAD
  const dLon = (b[0] - a[0]) * RAD
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a[1] * RAD) * Math.cos(b[1] * RAD) * Math.sin(dLon / 2) ** 2
  return 2 * RADIO_TIERRA_KM * Math.asin(Math.sqrt(h))
}

/**
 * Puntos del arco de círculo máximo entre a y b (interpolación esférica).
 * Las longitudes se "desenrollan" para que el trazo sea continuo aunque cruce el meridiano 180.
 */
export function arcoGeodesico(a: Coordenada, b: Coordenada, puntos = 48): Coordenada[] {
  const va = aVector(a)
  const vb = aVector(b)
  const angulo = Math.acos(Math.min(1, Math.max(-1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2])))
  if (angulo < 1e-6) return [a, b]

  const resultado: Coordenada[] = []
  let lonAnterior = a[0]
  for (let i = 0; i <= puntos; i++) {
    const t = i / puntos
    const ka = Math.sin((1 - t) * angulo) / Math.sin(angulo)
    const kb = Math.sin(t * angulo) / Math.sin(angulo)
    const x = ka * va[0] + kb * vb[0]
    const y = ka * va[1] + kb * vb[1]
    const z = ka * va[2] + kb * vb[2]
    let lon = Math.atan2(y, x) / RAD
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y)) / RAD
    while (lon - lonAnterior > 180) lon -= 360
    while (lon - lonAnterior < -180) lon += 360
    lonAnterior = lon
    resultado.push([lon, lat])
  }
  return resultado
}

/** Trozo de un trazo entre las fracciones desde y hasta (0-1), interpolando los extremos. */
export function tramo(trazo: Coordenada[], desde: number, hasta: number): Coordenada[] {
  const n = trazo.length - 1
  const punto = (f: number): Coordenada => {
    const x = Math.min(Math.max(f, 0), 1) * n
    const i = Math.min(Math.floor(x), n - 1)
    const r = x - i
    return [trazo[i][0] + (trazo[i + 1][0] - trazo[i][0]) * r, trazo[i][1] + (trazo[i + 1][1] - trazo[i][1]) * r]
  }
  const inicio = punto(desde)
  const fin = punto(hasta)
  const intermedios = trazo.slice(Math.ceil(Math.max(desde, 0) * n), Math.floor(Math.min(hasta, 1) * n) + 1)
  return [inicio, ...intermedios, fin]
}

/** "#2a78d6" -> [42, 120, 214, alfa] para deck.gl */
export function rgba(hex: string, alfa = 255): [number, number, number, number] {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255, alfa]
}
