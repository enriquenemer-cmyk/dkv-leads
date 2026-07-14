import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { parseSeguros, esProducto, PRODUCTO_SLUGS, TARJETA } from '@/lib/wallet-programas'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Añade/quita un seguro de la tarjeta de un cliente (un "sello"). Solo asesores con sesión.
export async function POST(req: NextRequest) {
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const auth = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: { user } } = await auth.auth.getUser(token)
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id, seguro, accion } = await req.json().catch(() => ({}))
  if (!id || !esProducto(seguro)) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })

  // Leemos la tarjeta actual (RLS: el asesor con sesión puede ver leads).
  const { data: lead, error } = await auth.from('leads').select('nombre, wallet_seguros').eq('id', id).single()
  if (error || !lead) return NextResponse.json({ error: 'Cliente no encontrado' }, { status: 404 })

  const set = new Set(parseSeguros(lead.wallet_seguros as string[] | null))
  const tiene = set.has(seguro)
  const activar = accion === 'add' ? true : accion === 'remove' ? false : !tiene // toggle por defecto
  if (activar) set.add(seguro); else set.delete(seguro)
  const seguros = PRODUCTO_SLUGS.filter((s) => set.has(s))

  const { error: upErr } = await auth.from('leads').update({
    wallet_seguros: seguros,
    wallet_sellos: seguros.length,
  }).eq('id', id)
  if (upErr) return NextResponse.json({ error: 'No se pudo guardar' }, { status: 500 })

  const completa = seguros.length >= TARJETA.total
  return NextResponse.json({ ok: true, seguros, total: TARJETA.total, completa, nombre: lead.nombre })
}
