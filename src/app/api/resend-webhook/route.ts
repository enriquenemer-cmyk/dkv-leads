import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// Webhook de Resend: recibe los eventos de cada correo (entregado,
// abierto, clic, rebote, spam) y actualiza la tabla email_envios.
// Configúralo en Resend → Webhooks apuntando a /api/resend-webhook.
// ============================================================

function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, { auth: { persistSession: false } })
}

// Verifica la firma Svix que usa Resend (si hay secreto configurado).
function firmaValida(req: NextRequest, raw: string): boolean {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.warn('[resend-webhook] RESEND_WEBHOOK_SECRET no configurado — firma no verificada')
    return true
  }
  const id = req.headers.get('svix-id')
  const ts = req.headers.get('svix-timestamp')
  const sig = req.headers.get('svix-signature')
  if (!id || !ts || !sig) return false
  try {
    const secretBytes = Buffer.from(secret.replace(/^whsec_/, ''), 'base64')
    const signedContent = `${id}.${ts}.${raw}`
    const esperado = crypto.createHmac('sha256', secretBytes).update(signedContent).digest('base64')
    // svix-signature puede traer varias firmas separadas por espacio: "v1,<b64> v1,<b64>"
    return sig.split(' ').some((part) => {
      const s = part.split(',')[1] || ''
      try { return s.length === esperado.length && crypto.timingSafeEqual(Buffer.from(s), Buffer.from(esperado)) } catch { return false }
    })
  } catch {
    return false
  }
}

export async function POST(req: NextRequest) {
  const raw = await req.text()
  if (!firmaValida(req, raw)) return new NextResponse('Firma inválida', { status: 401 })

  let evt: { type?: string; data?: { email_id?: string } }
  try { evt = JSON.parse(raw) } catch { return NextResponse.json({ error: 'JSON inválido' }, { status: 400 }) }

  const emailId = evt.data?.email_id
  const tipo = evt.type
  if (!emailId || !tipo) return NextResponse.json({ ok: true, ignored: true })

  const admin = supabaseAdmin()
  if (!admin) return NextResponse.json({ ok: true, sinDB: true })

  // Cada tipo de evento actualiza su fecha. No se degrada: un clic también marca apertura.
  const ahora = new Date().toISOString()
  const campos: Record<string, string> = {}
  if (tipo === 'email.delivered') campos.entregado_at = ahora
  else if (tipo === 'email.opened') campos.abierto_at = ahora
  else if (tipo === 'email.clicked') { campos.click_at = ahora; campos.abierto_at = ahora }
  else if (tipo === 'email.bounced') campos.rebotado_at = ahora
  else if (tipo === 'email.complained') campos.spam_at = ahora
  else return NextResponse.json({ ok: true, ignored: tipo })

  const { error } = await admin.from('email_envios').update(campos).eq('resend_id', emailId)
  if (error) console.error('[resend-webhook] error actualizando:', error.message)

  return NextResponse.json({ ok: true })
}

// Resend hace un GET al validar el endpoint.
export async function GET() {
  return NextResponse.json({ ok: true })
}
