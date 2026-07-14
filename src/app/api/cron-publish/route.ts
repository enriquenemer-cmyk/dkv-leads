import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'
import { publishToMeta, AUTO_PUBLICABLES } from '@/lib/meta-publish'

// Cron: publica automáticamente las piezas PROGRAMADAS cuya fecha ya pasó.
// Lo llama Vercel Cron (ver vercel.json). Vercel añade el header
// Authorization: Bearer <CRON_SECRET> automáticamente si CRON_SECRET está definido.

function supabaseAdmin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false },
  })
}

async function handle(req: NextRequest) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = req.headers.get('authorization') || ''
    if (auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  const db = supabaseAdmin()
  const ahora = new Date().toISOString()
  const { data: pendientes, error } = await db.from('contenido_simulaciones')
    .select('*')
    .eq('estado', 'programado')
    .lte('programado_para', ahora)
    .in('platform', AUTO_PUBLICABLES)
    .limit(25)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const resultados: Array<{ id: string; ok: boolean; error?: string }> = []
  for (const row of pendientes || []) {
    const imageUrl: string = row.pub_url || row.img_url
    try {
      if (!imageUrl) throw new Error('Sin imagen para publicar')
      const r = await publishToMeta({ platform: row.platform, imageUrl, caption: row.caption || '' })
      await db.from('contenido_simulaciones')
        .update({ estado: 'publicado', publicado_en: new Date().toISOString(), post_url: r.postUrl ?? null })
        .eq('id', row.id)
      resultados.push({ id: row.id, ok: true })
    } catch (e) {
      resultados.push({ id: row.id, ok: false, error: e instanceof Error ? e.message : 'error' })
    }
  }

  return NextResponse.json({ ok: true, revisados: pendientes?.length || 0, publicados: resultados.filter((r) => r.ok).length, resultados })
}

export async function GET(req: NextRequest) { return handle(req) }
export async function POST(req: NextRequest) { return handle(req) }
