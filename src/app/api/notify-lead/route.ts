import { NextRequest, NextResponse } from 'next/server'

// ============================================================
//  NOTIFICACIÓN DE LEADS  (speed-to-lead)
//  - B6: avisa por email al ASESOR al instante cuando entra un lead.
//  - B7: envía una confirmación automática al LEAD ("te llamamos enseguida").
//
//  Se dispara con un Webhook de Base de Datos de Supabase (INSERT en `leads`)
//  que envía la cabecera  x-notify-secret: <NOTIFY_SECRET>.
//  Configuración paso a paso en: SETUP-NOTIFICACIONES.md
// ============================================================

const RESEND = 'https://api.resend.com/emails'

function esc(s: unknown): string {
  return String(s ?? '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c] as string))
}

async function enviarEmail(apiKey: string, payload: Record<string, unknown>): Promise<{ ok: boolean; detail: string }> {
  try {
    const res = await fetch(RESEND, {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return { ok: res.ok, detail: res.ok ? '' : await res.text() }
  } catch (e) {
    return { ok: false, detail: String(e) }
  }
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-notify-secret')
  if (!process.env.NOTIFY_SECRET || secret !== process.env.NOTIFY_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Falta RESEND_API_KEY' }, { status: 503 })

  const from = process.env.NOTIFY_FROM || 'DKV Leads <onboarding@resend.dev>'
  const asesorEmail = process.env.NOTIFY_EMAIL || 'enriquenemer@gmail.com'
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dkv-leads.vercel.app'
  const waEmpresa = (process.env.NEXT_PUBLIC_WHATSAPP || '34699669603').replace(/\D/g, '')

  const body = await req.json().catch(() => ({}))
  const lead = (body.record ?? body ?? {}) as Record<string, unknown>

  const nombre = esc(lead.nombre ?? 'Nuevo lead')
  const nombreCorto = nombre.split(' ')[0]
  const telRaw = String(lead.telefono ?? '').trim()
  const tel = esc(telRaw || '—')
  const emailLead = typeof lead.email === 'string' ? lead.email.trim() : ''
  const interes = esc((lead.interes ?? '—').toString().replace(/\s*·?\s*origen:.*$/i, '').trim() || '—')
  const wa = telRaw.replace(/\D/g, '')

  const resultados: Record<string, string> = {}

  // ---------- (B6) Aviso INSTANTÁNEO al ASESOR ----------
  const htmlAsesor = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto">
      <div style="background:linear-gradient(135deg,#0a2f27,#0F7A63);padding:24px;border-radius:14px 14px 0 0;color:#fff">
        <div style="font-size:13px;opacity:.8">DKV · Nuevo lead</div>
        <div style="font-size:22px;font-weight:800">🔥 ${nombre}</div>
      </div>
      <div style="background:#fff;border:1px solid #eee;border-top:none;padding:24px;border-radius:0 0 14px 14px">
        <p style="margin:0 0 6px;color:#333"><b>📞 Teléfono:</b> ${tel}</p>
        <p style="margin:0 0 6px;color:#333"><b>✉️ Correo:</b> ${esc(emailLead || '—')}</p>
        <p style="margin:0 0 18px;color:#333"><b>Interés:</b> ${interes}</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${wa ? `<a href="https://wa.me/${wa}" style="background:#25D366;color:#fff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:700">WhatsApp</a>` : ''}
          ${wa ? `<a href="tel:+${wa}" style="background:#0F7A63;color:#fff;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:700">Llamar</a>` : ''}
          <a href="${siteUrl}/panel/leads" style="background:#f0f4f1;color:#16201d;text-decoration:none;padding:11px 16px;border-radius:10px;font-weight:700">Ver en el panel</a>
        </div>
        <p style="margin:18px 0 0;color:#999;font-size:12px">Llámalo cuanto antes: un lead contactado en los primeros minutos convierte mucho más.</p>
      </div>
    </div>`

  const r1 = await enviarEmail(apiKey, {
    from,
    to: [asesorEmail],
    subject: `🔥 Nuevo lead: ${nombre}`,
    html: htmlAsesor,
  })
  if (!r1.ok) console.error('[notify-lead] fallo email asesor:', r1.detail)
  resultados.asesor = r1.ok ? 'enviado' : `error: ${r1.detail}`

  // ---------- (B7) Confirmación automática al LEAD ----------
  const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLead)
  if (emailValido) {
    const htmlLead = `
      <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
        <div style="background:linear-gradient(135deg,#0a2f27,#0F7A63);padding:28px 24px;border-radius:14px 14px 0 0;color:#fff">
          <div style="font-size:13px;opacity:.85;letter-spacing:.5px">DKV SEGUROS DE SALUD</div>
          <div style="font-size:23px;font-weight:800;margin-top:4px">¡Hemos recibido tu solicitud, ${nombreCorto}! 🎉</div>
        </div>
        <div style="background:#fff;border:1px solid #eee;border-top:none;padding:26px 24px;border-radius:0 0 14px 14px;color:#2c3a33;line-height:1.6">
          <p style="margin:0 0 14px">Gracias por tu interés en <b>${interes !== '—' ? interes : 'un seguro DKV'}</b>. Un asesor personal te llamará <b>en menos de 24 horas</b> para darte un presupuesto a tu medida, sin compromiso.</p>
          <p style="margin:0 0 18px">¿Tienes prisa o prefieres escribir? Adelántate por WhatsApp y te atendemos ahora mismo:</p>
          <div style="text-align:center;margin:0 0 20px">
            <a href="https://wa.me/${waEmpresa}?text=Hola,%20acabo%20de%20pedir%20informaci%C3%B3n%20sobre%20un%20seguro%20DKV" style="background:#25D366;color:#fff;text-decoration:none;padding:14px 26px;border-radius:999px;font-weight:800;display:inline-block">💬 Escríbenos por WhatsApp</a>
          </div>
          <p style="margin:0 0 4px;color:#6b7a76;font-size:14px">📞 También puedes llamarnos al <b>699 66 96 03</b> (L-V 9:00–20:00).</p>
          <p style="margin:14px 0 0;color:#9aaba5;font-size:12px">Este mensaje es una confirmación automática. Si no solicitaste información, puedes ignorarlo.</p>
        </div>
      </div>`

    const r2 = await enviarEmail(apiKey, {
      from,
      to: [emailLead],
      reply_to: asesorEmail,
      subject: 'Hemos recibido tu solicitud · DKV Seguros',
      html: htmlLead,
    })
    if (!r2.ok) console.error('[notify-lead] fallo email lead:', r2.detail)
    resultados.lead = r2.ok ? 'enviado' : `error: ${r2.detail}`
  } else {
    resultados.lead = 'omitido (sin email válido)'
  }

  return NextResponse.json({ ok: true, resultados })
}
