import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Lead = {
  id: string
  nombre: string
  telefono: string | null
  email: string | null
  interes: string | null
  tag: 'caliente' | 'tibio' | 'frio' | 'cliente'
  fuente: string
  notas: Array<{ text: string; when: string }>
  recordatorio: { texto: string; fecha: string } | null
  created_at: string
}
