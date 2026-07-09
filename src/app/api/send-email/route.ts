import { NextRequest, NextResponse } from 'next/server'

// Enviador de correo genérico protegido por secreto. Lo usan las tareas programadas
// (recordatorios diarios, backup semanal, seguimientos) que arma la base de datos.
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-notify-secret')
  if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 503 })

  const to = process.env.NOTIFY_EMAIL || 'enriquenemer@gmail.com'
  const { subject, html, attachment } = await req.json().catch(() => ({}))
  if (!subject || !html) return NextResponse.json({ error: 'Faltan subject/html' }, { status: 400 })

  const payload: Record<string, unknown> = {
    from: 'DKV Leads <onboarding@resend.dev>',
    to: [to],
    subject,
    html: `<div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto">${html}</div>`,
  }
  // attachment = { filename, content(base64) }
  if (attachment?.filename && attachment?.content) {
    payload.attachments = [{ filename: attachment.filename, content: attachment.content }]
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 })
  return NextResponse.json({ ok: true })
}
