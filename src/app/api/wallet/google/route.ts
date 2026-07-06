import { NextRequest, NextResponse } from 'next/server'
import { enlaceGoogleWallet, actualizarSellos, leerSellos, walletConfigurado, TarjetaNoExiste } from '@/lib/google-wallet'
import { parseSeguros } from '@/lib/wallet-programas'

const IDRE = /^[A-Za-z0-9._-]+$/

/* GET /api/wallet/google?cliente=DKV-4821&nombre=Laura&seguros=hogar,vida

   Devuelve el enlace "Añadir a Google Wallet" de la tarjeta Club Protección DKV.
   ?seguros = seguros contratados (lista separada por comas: hogar,decesos,vida).
   ?redirect=1 redirige a Google. ?estado=1 devuelve nº de seguros actuales. */
export async function GET(req: NextRequest) {
  if (!walletConfigurado()) {
    return NextResponse.json(
      { error: 'Google Wallet aún no está configurado. Falta añadir las variables GOOGLE_WALLET_* en el entorno.' },
      { status: 503 },
    )
  }

  const sp = req.nextUrl.searchParams
  const clienteId = (sp.get('cliente') || '').trim()
  const nombre = (sp.get('nombre') || '').trim()
  const seguros = parseSeguros(sp.get('seguros'))

  if (!clienteId || !IDRE.test(clienteId)) {
    return NextResponse.json({ error: 'El id de cliente no es válido.' }, { status: 400 })
  }

  // ?estado=1 → nº de seguros contratados (o null si el cliente aún no la guardó)
  if (sp.get('estado') === '1') {
    try {
      const actuales = await leerSellos(clienteId)
      return NextResponse.json({ existe: actuales !== null, sellos: actuales })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error leyendo la tarjeta'
      return NextResponse.json({ error: msg }, { status: 500 })
    }
  }

  if (!nombre) {
    return NextResponse.json({ error: 'Falta el parámetro nombre.' }, { status: 400 })
  }

  try {
    const url = enlaceGoogleWallet({ clienteId, nombre, seguros })
    if (sp.get('redirect') === '1') return NextResponse.redirect(url)
    return NextResponse.json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error generando el pase'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* POST /api/wallet/google  { cliente, nombre, seguros: ["hogar","vida"] }
   Actualiza los seguros de una tarjeta YA guardada y dispara el push al móvil.
   Si el cliente todavía no la ha guardado, devuelve 409. */
export async function POST(req: NextRequest) {
  if (!walletConfigurado()) {
    return NextResponse.json(
      { error: 'Google Wallet aún no está configurado. Falta añadir las variables GOOGLE_WALLET_* en el entorno.' },
      { status: 503 },
    )
  }

  let body: { cliente?: string; nombre?: string; seguros?: string[] | string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 })
  }

  const clienteId = (body.cliente || '').trim()
  const nombre = (body.nombre || '').trim()
  const seguros = parseSeguros(body.seguros ?? null)

  if (!clienteId || !IDRE.test(clienteId) || !nombre) {
    return NextResponse.json({ error: 'Faltan parámetros: cliente y nombre son obligatorios.' }, { status: 400 })
  }

  try {
    await actualizarSellos({ clienteId, nombre, seguros })
    return NextResponse.json({ ok: true, seguros })
  } catch (e) {
    if (e instanceof TarjetaNoExiste) {
      return NextResponse.json({ error: e.message, code: 'no-existe' }, { status: 409 })
    }
    const msg = e instanceof Error ? e.message : 'Error actualizando la tarjeta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
