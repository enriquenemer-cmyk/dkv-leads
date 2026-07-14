import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { publishToMeta } from '@/lib/meta-publish'

// Publica AL INSTANTE una pieza del planificador en su red (Instagram / Facebook).
// La llama el botón "Publicar ahora" del panel. Requiere sesión de asesor.

function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

export async function POST(req: NextRequest) {
  // --- Autenticación: debe ser un asesor con sesión ---
  const authHeader = req.headers.get('authorization') || ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const authClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  })
  const { data: userData } = await authClient.auth.getUser()
  if (!userData.user) return NextResponse.json({ error: 'Sesión no válida' }, { status: 401 })

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'Falta el id de la pieza' }, { status: 400 })

  const db = supabaseAdmin()
  const { data: row, error } = await db.from('contenido_simulaciones').select('*').eq('id', id).single()
  if (error || !row) return NextResponse.json({ error: 'Pieza no encontrada' }, { status: 404 })

  const imageUrl: string = row.pub_url || row.img_url
  if (!imageUrl) return NextResponse.json({ error: 'La pieza no tiene imagen para publicar' }, { status: 400 })

  try {
    const result = await publishToMeta({ platform: row.platform, imageUrl, caption: row.caption || '' })
    await db.from('contenido_simulaciones')
      .update({ estado: 'publicado', publicado_en: new Date().toISOString(), post_url: result.postUrl ?? null })
      .eq('id', id)
    return NextResponse.json(result)
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Error al publicar' }, { status: 502 })
  }
}
