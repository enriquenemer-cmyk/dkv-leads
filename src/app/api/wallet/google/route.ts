import { NextRequest, NextResponse } from 'next/server'
import { enlaceGoogleWallet, actualizarSellos, leerSellos, walletConfigurado, TarjetaNoExiste, SELLOS_TOTAL } from '@/lib/google-wallet'

/* GET /api/wallet/google?cliente=DKV-4821&nombre=Laura%20Gómez&sellos=3

   Devuelve el enlace "Añadir a Google Wallet" del cliente. Con ?redirect=1
   redirige directamente a Google (útil para un botón/QR).

   Nota: esto genera la tarjeta. Sumar sellos y refrescarla en el móvil del
   cliente (push) se hará más adelante con la API de Google, cuando la cuenta
   emisora esté aprobada. */
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
  const sellos = Number(sp.get('sellos') || '0')

  if (!clienteId || !nombre) {
    return NextResponse.json(
      { error: 'Faltan parámetros: cliente y nombre son obligatorios.' },
      { status: 400 },
    )
  }
  if (!/^[A-Za-z0-9._-]+$/.test(clienteId)) {
    return NextResponse.json(
      { error: 'El id de cliente solo puede tener letras, números, punto, guion y guion bajo.' },
      { status: 400 },
    )
  }

  // ?estado=1 → devuelve los sellos actuales de la tarjeta (o null si el cliente aún no la guardó)
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
  if (!Number.isFinite(sellos) || sellos < 0 || sellos > SELLOS_TOTAL) {
    return NextResponse.json(
      { error: `Los sellos deben estar entre 0 y ${SELLOS_TOTAL}.` },
      { status: 400 },
    )
  }

  try {
    const url = enlaceGoogleWallet({ clienteId, nombre, sellos })
    if (sp.get('redirect') === '1') {
      return NextResponse.redirect(url)
    }
    return NextResponse.json({ url })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error generando el pase'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}

/* POST /api/wallet/google  { cliente, nombre, sellos }
   Actualiza los sellos de una tarjeta YA guardada y dispara el push al móvil
   del cliente. Si el cliente todavía no la ha guardado, devuelve 409. */
export async function POST(req: NextRequest) {
  if (!walletConfigurado()) {
    return NextResponse.json(
      { error: 'Google Wallet aún no está configurado. Falta añadir las variables GOOGLE_WALLET_* en el entorno.' },
      { status: 503 },
    )
  }

  let body: { cliente?: string; nombre?: string; sellos?: number }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON no válido.' }, { status: 400 })
  }

  const clienteId = (body.cliente || '').trim()
  const nombre = (body.nombre || '').trim()
  const sellos = Number(body.sellos ?? 0)

  if (!clienteId || !nombre) {
    return NextResponse.json({ error: 'Faltan parámetros: cliente y nombre son obligatorios.' }, { status: 400 })
  }
  if (!/^[A-Za-z0-9._-]+$/.test(clienteId)) {
    return NextResponse.json({ error: 'El id de cliente no es válido.' }, { status: 400 })
  }
  if (!Number.isFinite(sellos) || sellos < 0 || sellos > SELLOS_TOTAL) {
    return NextResponse.json({ error: `Los sellos deben estar entre 0 y ${SELLOS_TOTAL}.` }, { status: 400 })
  }

  try {
    await actualizarSellos({ clienteId, nombre, sellos })
    return NextResponse.json({ ok: true, sellos })
  } catch (e) {
    if (e instanceof TarjetaNoExiste) {
      return NextResponse.json({ error: e.message, code: 'no-existe' }, { status: 409 })
    }
    const msg = e instanceof Error ? e.message : 'Error actualizando la tarjeta'
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
