import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { CONOCIMIENTO, CONTACTO } from '@/lib/chatbot-kb'

// ============================================================
//  CEREBRO DEL CHATBOT PÚBLICO
//  - Recibe la conversación y devuelve la respuesta de la IA.
//  - El MOTOR se elige con la variable AI_PROVIDER (.env.local):
//        gemini    → Google Gemini  (tiene nivel GRATIS)  ← por defecto
//        openai    → OpenAI / ChatGPT (de pago)
//        anthropic → Claude          (de pago)
//    Cambiar de motor = cambiar esa línea + poner su API key. Nada más.
// ============================================================

type Msg = { role: 'user' | 'assistant'; content: string }

const PROVIDER = (process.env.AI_PROVIDER || 'gemini').toLowerCase()

// El "system prompt": conocimiento + contacto real inyectado.
const SYSTEM = `${CONOCIMIENTO}

# DATOS DE CONTACTO REALES
Teléfono: ${CONTACTO.telefono}
WhatsApp: ${CONTACTO.whatsapp || '(no disponible)'}
Horario: ${CONTACTO.horario}
Sucursales: ${CONTACTO.sucursales.join(', ')}`

function supabaseServer() {
  // Usa la service_role si está configurada; si no, la anónima (igual que el
  // formulario de la web, que ya inserta leads con la clave pública).
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false },
  })
}

// ============================================================
//  PROTECCIÓN ANTI-ABUSO / CONTROL DE COSTE
//  Evita que scripts externos o spammers disparen la factura de IA.
// ============================================================
const LIMITE_MENSAJES_POR_MINUTO = Number(process.env.CHAT_RATE_LIMIT || 15)
const LIMITE_LARGO_MENSAJE = 800 // caracteres por mensaje
const LIMITE_MENSAJES_HISTORIAL = 12 // turnos de conversación que enviamos a la IA

// Ventana deslizante en memoria: IP -> marcas de tiempo (ms) de sus peticiones.
// Nota: en serverless es "best-effort" por instancia; frena el abuso evidente.
const visitas = new Map<string, number[]>()

function ipDe(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return req.headers.get('x-real-ip') || 'desconocida'
}

/** true si la IP ha superado el límite de mensajes por minuto. */
function superaLimite(ip: string, ahora: number): boolean {
  const desde = ahora - 60_000
  const previas = (visitas.get(ip) || []).filter((t) => t > desde)
  previas.push(ahora)
  visitas.set(ip, previas)
  // Limpieza esporádica para no acumular IPs viejas en memoria.
  if (visitas.size > 5000) {
    for (const [k, v] of visitas) if (v.every((t) => t <= desde)) visitas.delete(k)
  }
  return previas.length > LIMITE_MENSAJES_POR_MINUTO
}

/** true si la petición viene de nuestra propia web (mismo dominio). */
function origenValido(req: NextRequest): boolean {
  const host = req.headers.get('host')
  if (!host) return false
  const ref = req.headers.get('origin') || req.headers.get('referer')
  if (!ref) return false // sin origen (p.ej. curl/scripts) → se bloquea
  try {
    return new URL(ref).host === host
  } catch {
    return false
  }
}

// --- Llama al motor de IA elegido y devuelve el texto de respuesta ---
async function preguntarIA(messages: Msg[]): Promise<string> {
  if (PROVIDER === 'openai') return openai(messages)
  if (PROVIDER === 'anthropic') return anthropic(messages)
  return gemini(messages)
}

// ---- Google Gemini (nivel gratuito) ----
async function gemini(messages: Msg[]): Promise<string> {
  const key = process.env.GEMINI_API_KEY
  if (!key) throw new Error('Falta GEMINI_API_KEY')
  const model = process.env.GEMINI_MODEL || 'gemini-2.0-flash'
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM }] },
        contents: messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
        generationConfig: { temperature: 0.6, maxOutputTokens: 500 },
      }),
    }
  )
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ''
}

// ---- OpenAI / ChatGPT (de pago) ----
async function openai(messages: Msg[]): Promise<string> {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('Falta OPENAI_API_KEY')
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini'
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model,
      temperature: 0.6,
      max_tokens: 500,
      messages: [{ role: 'system', content: SYSTEM }, ...messages],
    }),
  })
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.choices?.[0]?.message?.content?.trim() || ''
}

// ---- Anthropic / Claude (de pago) ----
async function anthropic(messages: Msg[]): Promise<string> {
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Falta ANTHROPIC_API_KEY')
  const model = process.env.ANTHROPIC_MODEL || 'claude-haiku-4-5-20251001'
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({ model, max_tokens: 500, system: SYSTEM, messages }),
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data?.content?.[0]?.text?.trim() || ''
}

// --- Detecta la señal @@LEAD y guarda el lead en Supabase ---
async function capturarLead(texto: string): Promise<string> {
  const marca = texto.indexOf('@@LEAD')
  if (marca === -1) {
    console.log('[chatbot] sin marca @@LEAD en la respuesta')
    return texto
  }

  // El JSON puede venir en la misma línea o dentro de un bloque ```…```
  const visible = texto.slice(0, marca).trim()
  const resto = texto.slice(marca + 6)
  try {
    const ini = resto.indexOf('{')
    const fin = resto.lastIndexOf('}')
    const json = ini !== -1 && fin !== -1 ? resto.slice(ini, fin + 1) : resto.trim()
    const lead = JSON.parse(json)
    const nombre = (lead.nombre || '').trim()
    const telefono = (lead.telefono || '').trim() || null
    const email = (lead.email || '').trim() || null
    if (nombre && (telefono || email)) {
      const sucursal = (lead.sucursal || '').trim()
      const fuente = sucursal ? `chatbot#${sucursal}` : 'chatbot'
      const { error } = await supabaseServer().from('leads').insert({
        nombre,
        telefono,
        email,
        interes: (lead.interes || '').trim() || null,
        fuente,
        tag: 'tibio',
      })
      if (error) console.error('[chatbot] error guardando lead:', error.message)
      else console.log('[chatbot] lead guardado:', nombre, telefono || email)
    } else {
      console.log('[chatbot] @@LEAD incompleto (falta nombre o contacto):', json)
    }
  } catch (e) {
    console.error('[chatbot] no pude parsear @@LEAD:', resto.slice(0, 120), e)
  }
  return visible
}

export async function POST(req: NextRequest) {
  try {
    // 1) Solo desde nuestra propia web (bloquea scripts externos).
    if (!origenValido(req)) {
      return NextResponse.json(
        { reply: 'Para hablar con el asistente, abre el chat desde nuestra web. 🙂' },
        { status: 403 }
      )
    }

    // 2) Límite de mensajes por minuto y por visitante.
    if (superaLimite(ipDe(req), Date.now())) {
      return NextResponse.json(
        { reply: 'Vas muy rápido 😅 Espera un momento antes de enviar otro mensaje, por favor.' },
        { status: 429 }
      )
    }

    const body = await req.json()
    const crudos: Msg[] = Array.isArray(body?.messages) ? body.messages : []
    if (crudos.length === 0) {
      return NextResponse.json({ error: 'Sin mensajes' }, { status: 400 })
    }

    // 3) Sanea y limita tamaño: solo roles válidos, recorta textos largos y
    //    quédate con los últimos turnos (controla coste y latencia).
    const messages: Msg[] = crudos
      .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .map((m) => ({ role: m.role, content: m.content.slice(0, LIMITE_LARGO_MENSAJE) }))
      .slice(-LIMITE_MENSAJES_HISTORIAL)
    if (messages.length === 0) {
      return NextResponse.json({ error: 'Sin mensajes válidos' }, { status: 400 })
    }

    const bruto = await preguntarIA(messages)
    const reply = await capturarLead(bruto)
    return NextResponse.json({ reply })
  } catch (e) {
    console.error('[chatbot]', e)
    return NextResponse.json(
      {
        reply:
          'Vaya, ahora mismo no puedo responder. Si quieres, déjanos tu teléfono en el formulario y un asesor te llama enseguida. 🙏',
      },
      { status: 200 }
    )
  }
}
