import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// ============================================================
// Webhook de Meta Lead Ads (Facebook / Instagram)
// - GET:  verificación del webhook (Meta manda hub.challenge)
// - POST: recibe cada lead, lo busca en la Graph API y lo
//         inserta en la tabla `leads` de Supabase.
// ============================================================

const GRAPH_VERSION = process.env.META_GRAPH_VERSION || 'v21.0'
const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN
const APP_SECRET = process.env.META_APP_SECRET
const PAGE_ACCESS_TOKEN = process.env.META_PAGE_ACCESS_TOKEN

// Cliente de Supabase con service_role (salta RLS, solo servidor)
function supabaseAdmin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

// --- 1. Verificación del webhook (Meta hace un GET al conectar) ---
export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams
  const mode = params.get('hub.mode')
  const token = params.get('hub.verify_token')
  const challenge = params.get('hub.challenge')

  if (mode === 'subscribe' && token && token === VERIFY_TOKEN) {
    // Meta espera el challenge devuelto tal cual, en texto plano
    return new NextResponse(challenge ?? '', { status: 200 })
  }
  return new NextResponse('Forbidden', { status: 403 })
}

// --- 2. Recepción de leads ---
export async function POST(req: NextRequest) {
  // Leemos el cuerpo crudo para poder verificar la firma
  const raw = await req.text()

  if (!verificarFirma(req, raw)) {
    return new NextResponse('Firma inválida', { status: 401 })
  }

  let body: MetaWebhookBody
  try {
    body = JSON.parse(raw)
  } catch {
    return new NextResponse('JSON inválido', { status: 400 })
  }

  if (body.object !== 'page') {
    // Respondemos 200 igualmente para que Meta no reintente en bucle
    return NextResponse.json({ ok: true, ignored: body.object })
  }

  // Procesamos cada notificación de leadgen
  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      if (change.field !== 'leadgen') continue
      try {
        await procesarLead(change.value)
      } catch (err) {
        // Registramos pero seguimos: nunca devolvemos error a Meta por un
        // lead concreto, o reintentará indefinidamente.
        console.error('[meta-webhook] Error procesando lead:', err)
      }
    }
  }

  // Meta exige un 200 rápido para dar el evento por entregado
  return NextResponse.json({ ok: true })
}

// --- Verifica la cabecera X-Hub-Signature-256 con el app secret ---
function verificarFirma(req: NextRequest, raw: string): boolean {
  if (!APP_SECRET) {
    // Sin secret configurado no podemos verificar; en producción DEBE existir.
    console.warn('[meta-webhook] META_APP_SECRET no configurado — firma no verificada')
    return true
  }
  const firma = req.headers.get('x-hub-signature-256')
  if (!firma) return false

  const esperado =
    'sha256=' +
    crypto.createHmac('sha256', APP_SECRET).update(raw, 'utf8').digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(firma), Buffer.from(esperado))
  } catch {
    return false
  }
}

// --- Busca el lead completo en la Graph API y lo guarda ---
async function procesarLead(value: LeadgenValue) {
  const { leadgen_id } = value
  if (!leadgen_id) return
  if (!PAGE_ACCESS_TOKEN) {
    throw new Error('META_PAGE_ACCESS_TOKEN no configurado')
  }

  const url =
    `https://graph.facebook.com/${GRAPH_VERSION}/${leadgen_id}` +
    `?fields=field_data,created_time,platform&access_token=${PAGE_ACCESS_TOKEN}`

  const res = await fetch(url)
  if (!res.ok) {
    throw new Error(`Graph API ${res.status}: ${await res.text()}`)
  }
  const lead: GraphLead = await res.json()

  const campos = mapearCampos(lead.field_data ?? [])
  const fuente = lead.platform === 'ig' ? 'instagram' : 'meta'

  // Guardamos las respuestas completas del formulario como primera nota,
  // para que el asesor vea todo lo que contestó el usuario.
  const resumen = (lead.field_data ?? [])
    .map((f) => `${etiqueta(f.name)}: ${(f.values ?? []).join(', ')}`)
    .join('\n')

  const supabase = supabaseAdmin()

  // --- Deduplicación ---
  // Meta puede reenviar el mismo lead (reintentos, formularios duplicados…).
  // Antes de insertar, buscamos un lead con el mismo teléfono O email creado
  // en los últimos 30 días. Si existe, no insertamos (pero devolvemos 200 igual
  // para que Meta dé el evento por entregado y no reintente en bucle).
  const telefono = campos.telefono || null
  const email = campos.email || null
  if (await esDuplicado(supabase, telefono, email)) {
    console.log(
      '[meta-webhook] duplicate skipped:',
      telefono || email || '(sin contacto)'
    )
    return
  }

  const { error } = await supabase.from('leads').insert({
    nombre: campos.nombre || 'Lead sin nombre',
    telefono,
    email,
    interes: campos.interes || null,
    fuente,
    tag: 'frio',
    notas: resumen
      ? [{ text: `Formulario Meta:\n${resumen}`, when: new Date().toISOString() }]
      : [],
  })
  if (error) throw new Error(`Supabase insert: ${error.message}`)
}

// --- ¿Ya existe un lead con el mismo teléfono o email en los últimos 30 días? ---
// Solo comparamos valores NO nulos (nunca deduplicamos por null vacío).
async function esDuplicado(
  supabase: ReturnType<typeof supabaseAdmin>,
  telefono: string | null,
  email: string | null
): Promise<boolean> {
  // Sin ningún dato de contacto no hay forma fiable de deduplicar → insertamos.
  if (!telefono && !email) return false

  const desde = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()

  // Construimos el OR solo con los campos presentes (evita casar filas con null).
  const condiciones: string[] = []
  if (telefono) condiciones.push(`telefono.eq.${telefono}`)
  if (email) condiciones.push(`email.eq.${email}`)

  try {
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .gte('created_at', desde)
      .or(condiciones.join(','))
      .limit(1)

    if (error) {
      // Si la consulta falla, no bloqueamos el alta: mejor un posible duplicado
      // que perder un lead. Registramos para tenerlo visible en los logs.
      console.error('[meta-webhook] error comprobando duplicado:', error.message)
      return false
    }
    return (data?.length ?? 0) > 0
  } catch (e) {
    console.error('[meta-webhook] excepción comprobando duplicado:', e)
    return false
  }
}

// --- Mapea los campos del formulario de Meta a nuestras columnas ---
function mapearCampos(fields: GraphField[]) {
  const get = (...claves: string[]) => {
    for (const f of fields) {
      const nombre = (f.name || '').toLowerCase()
      if (claves.some((c) => nombre.includes(c))) {
        return (f.values ?? [])[0] ?? ''
      }
    }
    return ''
  }

  // Nombre: puede venir como full_name o como first/last por separado
  let nombre = get('full_name', 'nombre_completo')
  if (!nombre) {
    const first = get('first_name', 'nombre')
    const last = get('last_name', 'apellido')
    nombre = [first, last].filter(Boolean).join(' ').trim()
  }

  return {
    nombre,
    telefono: get('phone', 'telefono', 'teléfono', 'movil', 'móvil', 'whatsapp'),
    email: get('email', 'correo'),
    interes: get('interes', 'interés', 'seguro', 'producto', 'servicio'),
  }
}

// Convierte el nombre técnico del campo en algo legible para la nota
function etiqueta(name: string) {
  return (name || '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ---------- Tipos ----------
type MetaWebhookBody = {
  object: string
  entry?: Array<{
    id: string
    time: number
    changes?: Array<{ field: string; value: LeadgenValue }>
  }>
}

type LeadgenValue = {
  leadgen_id?: string
  form_id?: string
  page_id?: string
  created_time?: number
}

type GraphField = { name: string; values?: string[] }

type GraphLead = {
  id: string
  created_time?: string
  platform?: string
  field_data?: GraphField[]
}
