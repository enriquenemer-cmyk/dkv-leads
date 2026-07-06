/* Configuración de la tarjeta de fidelización "Club Protección DKV" (Google Wallet).
   UNA sola tarjeta: el cliente que contrate los 3 seguros (hogar + decesos + vida)
   se lleva un regalo sorpresa. Cada hueco es un producto concreto.
   Sin dependencias pesadas: lo importan la librería del pase y el banner (next/og). */

export type ProductoSlug = 'hogar' | 'decesos' | 'salud'

export type Producto = {
  slug: ProductoSlug
  nombre: string  // nombre corto del seguro
  emoji: string   // icono del hueco
  accent: string  // color cuando está contratado
}

export const PRODUCTOS: Record<ProductoSlug, Producto> = {
  hogar:   { slug: 'hogar',   nombre: 'Hogar',   emoji: '🏠', accent: '#8FAE2C' },
  decesos: { slug: 'decesos', nombre: 'Decesos', emoji: '👪', accent: '#8FAE2C' },
  salud:   { slug: 'salud',   nombre: 'Salud',   emoji: '👨‍⚕️', accent: '#8FAE2C' },
}

// Orden fijo de los huecos en la tarjeta
export const PRODUCTO_SLUGS: ProductoSlug[] = ['hogar', 'decesos', 'salud']

export function esProducto(s: string): s is ProductoSlug {
  return (PRODUCTO_SLUGS as string[]).includes(s)
}

/** Normaliza una lista de seguros (string separada por comas o array) a slugs válidos y únicos. */
export function parseSeguros(v: string | string[] | null | undefined): ProductoSlug[] {
  const arr = Array.isArray(v) ? v : (v ? v.split(',') : [])
  const set = new Set<ProductoSlug>()
  for (const raw of arr) {
    const s = raw.trim().toLowerCase()
    if (esProducto(s)) set.add(s)
  }
  return PRODUCTO_SLUGS.filter((s) => set.has(s))
}

// Metadatos de la tarjeta (única)
export const TARJETA = {
  nombre: 'Club Protección DKV',
  clase: 'club_dkv',
  total: PRODUCTO_SLUGS.length, // 3
  premio: 'un regalo sorpresa',
  premioCorto: 'tu regalo sorpresa',
}
