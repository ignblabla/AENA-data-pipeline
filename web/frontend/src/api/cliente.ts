// Cliente HTTP mínimo. Los componentes nunca llaman a fetch directamente:
// usan los hooks de consultas.ts.

export type Parametros = Record<string, string | number | string[] | undefined>

export class ErrorApi extends Error {}

export async function obtener<T>(ruta: string, parametros: Parametros = {}, signal?: AbortSignal): Promise<T> {
  const query = new URLSearchParams()
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor === undefined) continue
    for (const v of Array.isArray(valor) ? valor : [valor]) query.append(clave, String(v))
  }
  const url = `/api${ruta}${query.size ? `?${query}` : ''}`

  let respuesta: Response
  try {
    respuesta = await fetch(url, { signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ErrorApi('No se puede conectar con el servidor. ¿Está arrancado el backend?')
  }
  if (!respuesta.ok) {
    const cuerpo = await respuesta.json().catch(() => null)
    const detalle = typeof cuerpo?.detail === 'string' ? cuerpo.detail : `Error ${respuesta.status} del servidor`
    throw new ErrorApi(detalle)
  }
  return respuesta.json() as Promise<T>
}
