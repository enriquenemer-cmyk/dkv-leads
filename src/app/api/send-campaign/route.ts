import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// Envío de campañas de email marketing (correos masivos).
// - Autenticación: token del asesor (admin) en la cabecera Authorization.
// - Envío: Resend, en lotes de 100 (endpoint /emails/batch).
// - Plantilla con marca DKV + pie legal (RGPD) con opción de baja.
// ============================================================

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const RESEND_BATCH = 'https://api.resend.com/emails/batch'

// Cliente con clave de servicio para guardar el rastreo (salta RLS). Si no está
// configurada la clave, devolvemos null y simplemente no se guarda el seguimiento.
function supabaseAdmin() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!key) return null
  return createClient(URL, key, { auth: { persistSession: false } })
}

// Datos del negocio para el pie del correo (identificación del remitente = obligatorio).
const NEGOCIO = 'DKV Seguros · Agente exclusivo'
const CONTACTO = '699 66 96 03'

type Destinatario = { email: string; nombre?: string | null }

// Acento visual por tipo de campaña (color + degradado para botón/detalles).
const ACENTO: Record<string, { color: string; grad: string; soft: string; emoji: string; label: string }> = {
  informacion:  { color: '#0F7A63', grad: 'linear-gradient(135deg,#12a07f,#0a5b49)', soft: '#e3f1ec', emoji: 'ℹ️', label: 'Información' },
  promocion:    { color: '#c7902a', grad: 'linear-gradient(135deg,#f2a91e,#d98a1f)', soft: '#f8efd9', emoji: '🎁', label: 'Promoción' },
  compensacion: { color: '#2b6fb0', grad: 'linear-gradient(135deg,#3f86c9,#2b6fb0)', soft: '#eaf3ff', emoji: '🤝', label: 'Compensación' },
  sorteo:       { color: '#8a5cc7', grad: 'linear-gradient(135deg,#a672e0,#7c4fbf)', soft: '#f0eafa', emoji: '🎉', label: 'Resultado del sorteo' },
}

function esEmail(e: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((e || '').trim())
}

// Convierte "a@x.com, b@y.com; c@z.com" en un array de correos válidos.
function listaCorreos(s?: string | null): string[] {
  return (s || '')
    .split(/[,;\s]+/)
    .map((x) => x.trim())
    .filter((x) => esEmail(x))
}

// Solo dejamos pasar URLs http(s) en atributos (imagen / botón).
function urlSegura(u?: string | null): string {
  const s = (u || '').trim()
  return /^https?:\/\//i.test(s) ? s.replace(/"/g, '%22') : ''
}

type Contenido = {
  titulo: string
  mensaje: string
  nombre?: string | null
  imagenUrl?: string | null
  botonTexto?: string | null
  botonUrl?: string | null
}

// Construye el HTML del correo para un destinatario concreto (saludo personalizado).
function construirHtml(tipo: string, c: Contenido) {
  const a = ACENTO[tipo] ?? ACENTO.informacion
  const saludo = (c.nombre || '').trim() ? `Hola ${(c.nombre || '').trim().split(' ')[0]},` : 'Hola,'
  const parrafos = (c.mensaje || '')
    .split(/\n{2,}/)
    .map((p) => `<p style="margin:0 0 16px;font-size:15.5px;line-height:1.7;color:#38443f">${escaparHtml(p).replace(/\n/g, '<br/>')}</p>`)
    .join('')

  const img = urlSegura(c.imagenUrl)
  const banner = img
    ? `<img src="${img}" alt="" width="600" style="width:100%;max-width:600px;display:block;border:0;outline:none;text-decoration:none" />`
    : ''

  const btnUrl = urlSegura(c.botonUrl)
  const btnTxt = (c.botonTexto || '').trim()
  const boton = btnTxt && btnUrl
    ? `<div style="text-align:center;margin:10px 0 24px">
         <a href="${btnUrl}" style="display:inline-block;background:${a.color};background-image:${a.grad};color:#fff;font-size:15.5px;font-weight:700;text-decoration:none;padding:14px 34px;border-radius:999px;box-shadow:0 6px 18px -6px ${a.color}88">${escaparHtml(btnTxt)}</a>
       </div>`
    : ''

  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
  <body style="margin:0;padding:0;background:#eef2f0">
  <div style="padding:26px 14px;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif">
    <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 18px 50px -22px rgba(10,47,39,0.45)">

      <!-- Cabecera de marca -->
      <div style="background:linear-gradient(135deg,#0a2f27,#0F7A63);padding:26px 30px">
        <div style="display:inline-block;background:#fff;border-radius:10px;padding:7px 14px;font-weight:800;font-size:19px;color:#0F7A63;letter-spacing:0.02em">DKV</div>
        <div style="color:rgba(255,255,255,0.85);font-size:12.5px;font-weight:500;margin-top:10px;letter-spacing:0.02em">Tu bienestar, asegurado</div>
      </div>

      ${banner}

      <!-- Cuerpo -->
      <div style="padding:30px 32px 8px">
        <div style="display:inline-block;font-size:11.5px;font-weight:800;color:${a.color};background:${a.soft};text-transform:uppercase;letter-spacing:0.07em;padding:5px 12px;border-radius:999px;margin-bottom:16px">${a.emoji} ${escaparHtml(a.label)}</div>
        <h1 style="font-size:25px;font-weight:800;color:#12211d;margin:0 0 18px;line-height:1.25;letter-spacing:-0.01em">${escaparHtml(c.titulo)}</h1>
        <p style="margin:0 0 16px;font-size:15.5px;line-height:1.7;color:#38443f">${escaparHtml(saludo)}</p>
        ${parrafos}
        ${boton}
      </div>

      <!-- Pie legal -->
      <div style="padding:20px 32px 28px;border-top:1px solid #eef2f0;background:#fbfdfc">
        <p style="margin:0 0 6px;font-size:12px;color:#7a8a84;line-height:1.6">
          <strong style="color:#4d5c56">${NEGOCIO}</strong><br/>
          Teléfono: ${CONTACTO}
        </p>
        <p style="margin:10px 0 0;font-size:11px;color:#a7b3ae;line-height:1.6">
          Recibes este correo porque solicitaste información o eres cliente de nuestros servicios.
          Si no deseas recibir más comunicaciones, responde a este correo con la palabra <strong>BAJA</strong>.
        </p>
      </div>

    </div>
  </div></body></html>`
}

function escaparHtml(s: string) {
  return (s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function trocear<T>(arr: T[], n: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n))
  return out
}

export async function POST(req: NextRequest) {
  // 1) Autenticación: el token del asesor viaja en Authorization (sesión en localStorage).
  const token = req.headers.get('Authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const authClient = createClient(URL, ANON, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  })
  const { data: { user: caller } } = await authClient.auth.getUser(token)
  if (!caller) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  // Solo administradores pueden enviar campañas. Permisivo si la columna `rol` no existe.
  const { data: callerRow, error: rolErr } = await authClient
    .from('asesores').select('rol').eq('id', caller.id).single()
  const isAdmin = rolErr ? true : callerRow?.rol === 'admin'
  if (!isAdmin) return NextResponse.json({ error: 'Solo un administrador puede enviar campañas.' }, { status: 403 })

  // 2) Configuración de Resend.
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'Falta configurar el correo (RESEND_API_KEY).' }, { status: 503 })
  const from = process.env.NOTIFY_FROM || 'DKV Seguros <onboarding@resend.dev>'

  // 3) Datos de la campaña.
  const body = await req.json().catch(() => ({}))
  const { tipo, asunto, titulo, mensaje, destinatarios, test, testEmail, imagenUrl, botonTexto, botonUrl, cc, bcc } = body as {
    tipo?: string; asunto?: string; titulo?: string; mensaje?: string
    destinatarios?: Destinatario[]; test?: boolean; testEmail?: string
    imagenUrl?: string; botonTexto?: string; botonUrl?: string
    cc?: string; bcc?: string
  }

  const ccList = listaCorreos(cc)
  const bccList = listaCorreos(bcc)

  if (!asunto?.trim()) return NextResponse.json({ error: 'Falta el asunto del correo.' }, { status: 400 })
  if (!mensaje?.trim()) return NextResponse.json({ error: 'Falta el mensaje del correo.' }, { status: 400 })
  const tipoOk = tipo && ACENTO[tipo] ? tipo : 'informacion'

  // 4) Modo prueba: envía un único correo al propio asesor.
  if (test) {
    // En modo prueba priorizamos NOTIFY_EMAIL (la bandeja del dueño de la cuenta Resend),
    // que es la única a la que el sandbox de Resend entrega mientras no haya dominio verificado.
    const to = (testEmail || process.env.NOTIFY_EMAIL || caller.email || '').trim()
    if (!esEmail(to)) return NextResponse.json({ error: 'No hay un correo de prueba válido.' }, { status: 400 })
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [to], subject: `[PRUEBA] ${asunto}`, ...(ccList.length ? { cc: ccList } : {}), ...(bccList.length ? { bcc: bccList } : {}), html: construirHtml(tipoOk, { titulo: titulo || asunto, mensaje, nombre: 'Prueba', imagenUrl, botonTexto, botonUrl }) }),
    })
    if (!res.ok) return NextResponse.json({ error: await res.text() }, { status: 502 })
    return NextResponse.json({ ok: true, modoPrueba: true, enviados: 1, para: to })
  }

  // 5) Envío masivo. Deduplica y valida correos.
  const vistos = new Set<string>()
  const lista = (destinatarios || [])
    .filter((d) => d && esEmail(d.email))
    .filter((d) => { const k = d.email.trim().toLowerCase(); if (vistos.has(k)) return false; vistos.add(k); return true })

  if (lista.length === 0) return NextResponse.json({ error: 'No hay destinatarios con correo válido.' }, { status: 400 })

  let enviados = 0
  let fallidos = 0
  const lotes = trocear(lista, 100) // Resend permite hasta 100 por lote.
  const admin = supabaseAdmin()
  const campaniaId = String(Date.now()) // agrupa todos los correos de este envío

  for (let i = 0; i < lotes.length; i++) {
    const payload = lotes[i].map((d, j) => {
      // La copia (CC/CCO) se añade SOLO al primer correo del envío, para que quien
      // esté en copia reciba una única copia y no una por cada destinatario.
      const primero = i === 0 && j === 0
      return {
        from,
        to: [d.email.trim()],
        subject: asunto,
        ...(primero && ccList.length ? { cc: ccList } : {}),
        ...(primero && bccList.length ? { bcc: bccList } : {}),
        html: construirHtml(tipoOk, { titulo: titulo || asunto, mensaje, nombre: d.nombre, imagenUrl, botonTexto, botonUrl }),
      }
    })
    try {
      const res = await fetch(RESEND_BATCH, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        enviados += payload.length
        // Guardamos el rastreo: una fila por correo, con el id de Resend para poder
        // casar luego los eventos de apertura/clic que llegan por el webhook.
        if (admin) {
          const json = await res.json().catch(() => null)
          const ids: Array<{ id?: string }> = json?.data ?? []
          const filas = lotes[i].map((d, j) => ({
            resend_id: ids[j]?.id ?? null,
            campania_id: campaniaId,
            campania: asunto,
            tipo: tipoOk,
            email: d.email.trim(),
            nombre: d.nombre ?? null,
          }))
          await admin.from('email_envios').insert(filas).then(({ error }) => {
            if (error) console.error('[send-campaign] no se pudo guardar rastreo:', error.message)
          })
        }
      } else { fallidos += payload.length; console.error('[send-campaign] lote falló:', await res.text()) }
    } catch (e) {
      fallidos += payload.length
      console.error('[send-campaign] excepción en lote:', e)
    }
    // Pequeña pausa entre lotes para respetar los límites de Resend.
    if (i < lotes.length - 1) await new Promise((r) => setTimeout(r, 600))
  }

  return NextResponse.json({ ok: true, total: lista.length, enviados, fallidos, campaniaId, seguimiento: !!admin })
}
