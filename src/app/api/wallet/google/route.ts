import { NextRequest, NextResponse } from 'next/server'
import { enlaceGoogleWallet, actualizarSellos, leerSellos, walletConfigurado, TarjetaNoExiste } from '@/lib/google-wallet'
import { PROGRAMAS, esProgramaValido, type ProgramaSlug } from '@/lib/wallet-programas'

const IDRE = /^[A-Za-z0-9._-]+$/

/* GET /api/wallet/google?programa=sonrisa&cliente=DKV-4821&nombre=Laura&sellos=2

   Devuelve el enlace "Añadir a Google Wallet" del cliente para un programa.
   ?programa por defecto = sonrisa. Con ?redirect=1 redirige a Google.
   Con ?estado=1 devuelve los sellos actuales de esa tarjeta. */
export async function GET(req: NextRequest) {
  if (!walletConfigurado()) {
    return NextResponse.json(
      { error: 'Google Wallet aún no está configurado. Falta añadir las variables GOOGLE_WALLET_* en el entorno.' },
      { status: 503 },
    )
  }

  const sp = req.nextUrl.searchParams
  const programaRaw = (sp.get('programa') || 'sonrisa').trim()
  const clienteId = (sp.get('cliente') || '').trim()
  const nombre = (sp.get('nombre') || '').trim()
  const sellos = Number(sp.get('sellos') || '0')

  if (!esProgramaValido(programaRaw)) {
    return NextResponse.json({ error: `Programa no válido. Usa: ${Object.keys(PROGRAMAS).join(', ')}.` }, { status: 400 })
  }
  const programa: ProgramaSlug = programaRaw

  if (!clienteId || !IDRE.test(clienteId)) {
    return NextResponse.json({ error: 'El id de cliente no es válido.' }, { status: 400 })
  }

  // ?estado=1 → sellos actuales de la tarjeta (o null si el cliente aún no la guardó)
  if (sp.get('estado') === '1') {
    try {
      const actuales = await leerSellos(programa, clienteId)
      return NextResponse.json({ existe: actuales !== null, sellos: actuales })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error leyendo la tarjeta'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  const total = PROGRAMAS[programa].total
  if (!nombre) {
    return NextResponse.json({ error: 'Falta el parámetro nombre.' }, { status: 400 })
  }
  if (!Number.isFinite(sellos) || sellos < 0 || sellos > total) {
    return NextResponse.json({ error: `Los sellos deben estar entre 0 y ${total}.` }, { status: 400 })
  }

  try {
    const url = enlaceGoogleWallet({ programa, clienteId, nombre, sellos })
    if (sp.get('redirect') === '1') return NextResponse.redirect(url)
    return NextResponse.json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error generando el pase'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* POST /api/wallet/google  { programa, cliente, nombre, sellos }
   Actualiza los sellos de una tarjeta YA guardada y dispara el push al móvil.
   Si el cliente todavía no la ha guardado, devuelve 409. */
export async function POST(req: NextRequest) {
  if (!walletConfigurado()) {
    return NextResponse.json(
      { error: 'Google Wallet aún no está configurado. Falta añadir las variables GOOGLE_WALLET_* en el entorno.' },
      { status: 503 },
    )
  }

  let body: { programa?: string; cliente?: string; nombre?: string; sellos?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 })
  }

  const programaRaw = (body.programa || 'sonrisa').trim()
  const clienteId = (body.cliente || '').trim()
  const nombre = (body.nombre || '').trim()
  const sellos = Number(body.sellos ?? 0)

  if (!esProgramaValido(programaRaw)) {
    return NextResponse.json({ error: 'Programa no válido.' }, { status: 400 })
  }
  const programa: ProgramaSlug = programaRaw

  if (!clienteId || !IDRE.test(clienteId) || !nombre) {
    return NextResponse.json({ error: 'Faltan parámetros: cliente y nombre son obligatorios.' }, { status: 400 })
  }
  const total = PROGRAMAS[programa].total
  if (!Number.isFinite(sellos) || sellos < 0 || sellos > total) {
    return NextResponse.json({ error: `Los sellos deben estar entre 0 y ${total}.` }, { status: 400 })
  }

  try {
    await actualizarSellos({ programa, clienteId, nombre, sellos })
    return NextResponse.json({ ok: true, sellos })
  } catch (e) {
    if (e instanceof TarjetaNoExiste) {
      return NextResponse.json({ error: e.message, code: 'no-existe' }, { status: 409 })
    }
    const msg = e instanceof Error ? e.message : 'Error actualizando la tarjeta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
