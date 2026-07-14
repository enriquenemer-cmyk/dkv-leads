import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Diagnóstico de la conexión con Meta para /panel/contenido.
// Usa el META_PAGE_ACCESS_TOKEN del servidor (NUNCA lo devuelve) para
// detectar el ID de la Página de Facebook y el ID de Instagram Business,
// y dice qué variables de entorno faltan. Requiere sesión de asesor.

const GV = process.env.META_GRAPH_VERSION || 'v21.0'

async function graphGet(path: string, token: string) {
  const url = `https://graph.facebook.com/${GV}/${path}${path.includes('?') ? '&' : '?'}access_token=${encodeURIComponent(token)}`
  const res = await fetch(url)
  const json = await res.json().catch(() => ({}))
  return { ok: res.ok && !json.error, json }
}

export async function GET(req: NextRequest) {
  // Auth: asesor con sesión
  const token = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false }, global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData } = await authClient.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })

  const env = {
    token: !!process.env.META_PAGE_ACCESS_TOKEN,
    ig: !!process.env.META_IG_USER_ID,
    page: !!process.env.META_PAGE_ID,
    cron: !!process.env.CRON_SECRET,
  }
  const configured = {
    ig: process.env.META_IG_USER_ID || null,
    page: process.env.META_PAGE_ID || null,
  }

  const metaToken = process.env.META_PAGE_ACCESS_TOKEN
  if (!metaToken) return NextResponse.json({ env, configured, paginas: [], aviso: 'Falta META_PAGE_ACCESS_TOKEN.' })

  const paginas: Array<{ id: string; name: string; ig_id: string | null; ig_username: string | null }> = []
  const push = (p: any) => {
    if (!p?.id || paginas.some((x) => x.id === p.id)) return
    paginas.push({ id: p.id, name: p.name || '', ig_id: p.instagram_business_account?.id || null, ig_username: p.instagram_business_account?.username || null })
  }

  let errorGraph: string | null = null
  const fields = 'id,name,instagram_business_account{id,username,name}'
  const me = await graphGet(`me?fields=${fields}`, metaToken)
  if (me.ok) { if (me.json.instagram_business_account || me.json.name) push(me.json) }
  else errorGraph = me.json?.error?.message || 'No se pudo leer /me'

  const accounts = await graphGet(`me/accounts?fields=${fields}`, metaToken)
  if (accounts.ok && Array.isArray(accounts.json.data)) accounts.json.data.forEach(push)

  return NextResponse.json({ env, configured, paginas, errorGraph })
}
