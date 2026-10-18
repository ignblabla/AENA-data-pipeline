import type { CodigoVuelo } from '../../api/tipos'

/** "IB 3166" (o solo el número si AENA no informa la aerolínea) */
export const codigoVuelo = (c: CodigoVuelo) => (c.iata_compania ? `${c.iata_compania} ${c.num_vuelo}` : c.num_vuelo)
