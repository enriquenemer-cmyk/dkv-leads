import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function POST(req: NextRequest) {
  // The caller's session token travels in the Authorization header (the browser
  // client stores the session in localStorage, not cookies).
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Client acting AS the caller (RLS applies with their role).
  const authClient = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: { user: caller } } = await authClient.auth.getUser(token)
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Only administrators may create advisors. If the `rol` column doesn't exist yet
  // (rolErr), stay permissive to avoid a lockout; once it exists it's enforced.
  const { data: callerRow, error: rolErr } = await authClient
    .from('asesores').select('rol').eq('id', caller.id).single()
  const isAdmin = rolErr ? true : callerRow?.rol === 'admin'
  if (!isAdmin) {
    return NextResponse.json({ error: 'Solo un administrador puede crear asesores.' }, { status: 403 })
  }

  const { email, password, nombre, permisos } = await req.json()
  if (!email || !password) {
    return NextResponse.json({ error: 'Email y contraseña son obligatorios' }, { status: 400 })
  }

  // Fresh anon client (not the caller's session) to sign up the new user.
  const anonClient = createClient(URL, ANON, { auth: { persistSession: false } })
  const { data, error } = await anonClient.auth.signUp({ email, password })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  if (!data.user) return NextResponse.json({ error: 'No se pudo crear el usuario' }, { status: 400 })

  // Store advisor info (rol defaults to 'asesor' via the column default).
  // `permisos`: array of allowed section hrefs; null = full access.
  await authClient.from('asesores').upsert({
    id: data.user.id,
    email: data.user.email,
    nombre: nombre || email,
    permisos: Array.isArray(permisos) && permisos.length ? permisos : null,
  })

  return NextResponse.json({ user: { id: data.user.id, email: data.user.email } })
}
