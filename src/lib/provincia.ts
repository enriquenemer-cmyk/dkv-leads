// Geolocalización básica del cliente por su código postal español.
// Los 2 primeros dígitos del CP identifican la provincia.
const PROVINCIAS: Record<string, string> = {
  '01': 'Álava', '02': 'Albacete', '03': 'Alicante', '04': 'Almería', '05': 'Ávila',
  '06': 'Badajoz', '07': 'Baleares', '08': 'Barcelona', '09': 'Burgos', '10': 'Cáceres',
  '11': 'Cádiz', '12': 'Castellón', '13': 'Ciudad Real', '14': 'Córdoba', '15': 'A Coruña',
  '16': 'Cuenca', '17': 'Girona', '18': 'Granada', '19': 'Guadalajara', '20': 'Gipuzkoa',
  '21': 'Huelva', '22': 'Huesca', '23': 'Jaén', '24': 'León', '25': 'Lleida',
  '26': 'La Rioja', '27': 'Lugo', '28': 'Madrid', '29': 'Málaga', '30': 'Murcia',
  '31': 'Navarra', '32': 'Ourense', '33': 'Asturias', '34': 'Palencia', '35': 'Las Palmas',
  '36': 'Pontevedra', '37': 'Salamanca', '38': 'S. C. de Tenerife', '39': 'Cantabria', '40': 'Segovia',
  '41': 'Sevilla', '42': 'Soria', '43': 'Tarragona', '44': 'Teruel', '45': 'Toledo',
  '46': 'Valencia', '47': 'Valladolid', '48': 'Bizkaia', '49': 'Zamora', '50': 'Zaragoza',
  '51': 'Ceuta', '52': 'Melilla',
}

/** Extrae el código postal (5 dígitos) del texto de interés del lead, si lo hay. */
export function cpDeInteres(interes: string | null | undefined): string | null {
  if (!interes) return null
  const m = interes.match(/\bCP\s*(\d{5})\b/i) || interes.match(/\b(\d{5})\b/)
  return m ? m[1] : null
}

/** Devuelve la provincia a partir de un código postal español (o null si no se reconoce). */
export function provinciaDeCP(cp: string | null | undefined): string | null {
  if (!cp || cp.length < 2) return null
  return PROVINCIAS[cp.slice(0, 2)] ?? null
}

/** Geolocalización del lead: { cp, provincia } deducidos de su interés. */
export function geoDeLead(lead: { interes?: string | null }): { cp: string | null; provincia: string | null } {
  const cp = cpDeInteres(lead.interes)
  return { cp, provincia: provinciaDeCP(cp) }
}
