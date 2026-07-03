import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/** Sucursales (oficinas) de DKV donde se reparten los leads. */
export const SUCURSALES = ['Madrid', 'Sevilla', 'León', 'Salamanca', 'Valladolid'] as const
export type Sucursal = (typeof SUCURSALES)[number]

// La sucursal se guarda codificada dentro del campo `fuente` como "origen#Sucursal"
// (p.ej. "formulario#Madrid"). Así no requiere una columna nueva en la base de datos.
// Si en el futuro se añade la columna `sucursal`, estas funciones la prefieren automáticamente.
const SUC_SEP = '#'

/** Construye el valor de `fuente` a guardar, incrustando la sucursal si la hay. */
export function encodeFuente(origen: string, sucursal?: string | null): string {
  const s = (sucursal ?? '').trim()
  return s ? `${origen}${SUC_SEP}${s}` : origen
}

/** Devuelve solo el origen del lead ('formulario' | 'manual') sin la sucursal. */
export function fuenteOrigen(fuente: string | null): string {
  return (fuente ?? '').split(SUC_SEP)[0]
}

/** Devuelve la sucursal del lead (de la columna si existe, o codificada en `fuente`). */
export function leadSucursal(lead: { sucursal?: string | null; fuente?: string | null }): string | null {
  if (lead.sucursal) return lead.sucursal
  const parts = (lead.fuente ?? '').split(SUC_SEP)
  return parts.length > 1 ? parts.slice(1).join(SUC_SEP) : null
}

export type Lead = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  interes: string | null
  tag: 'caliente' | 'tibio' | 'frio' | 'cliente'
  fuente: string
  sucursal: string | null
  notas: Array<{ text: string; when: string }>
  recordatorio: { texto: string; fecha: string } | null
  created_at: string
  wallet_sellos?: number | null
  wallet_guardada?: boolean | null
}
