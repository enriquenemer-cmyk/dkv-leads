import jwt from 'jsonwebtoken'
import { GoogleAuth } from 'google-auth-library'
import { PRODUCTOS, PRODUCTO_SLUGS, TARJETA, type ProductoSlug } from './wallet-programas'

/* ─────────────────────────────────────────────────────────────
   Google Wallet · Tarjeta "Club Protección DKV"
   UNA tarjeta: quien contrate los 3 seguros (hogar + decesos + vida)
   se lleva un regalo sorpresa. Cada hueco es un producto concreto.

   La clase y el objeto viajan firmados dentro del JWT (Google los crea
   en el primer "guardar"). Para leer/actualizar (push) usamos la API REST.
   ───────────────────────────────────────────────────────────── */

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || ''
const SA_EMAIL = process.env.GOOGLE_WALLET_SA_EMAIL || ''
const SA_KEY = (process.env.GOOGLE_WALLET_SA_KEY || '').replace(/\\n/g, '\n')
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dkv-leads.vercel.app'
const TEAL = '#0F4A3F'

const CLASE_ID = `${ISSUER_ID}.${TARJETA.clase}`
const objetoId = (clienteId: string) => `${ISSUER_ID}.${clienteId}`

export type DatosTarjeta = {
  clienteId: string
  nombre: string
  /** Seguros ya contratados por el cliente */
  seguros: ProductoSlug[]
}

export function walletConfigurado(): boolean {
  return Boolean(ISSUER_ID && SA_EMAIL && SA_KEY)
}

function construirClase() {
  return {
    id: CLASE_ID,
    issuerName: 'DKV Seguros',
    programName: TARJETA.nombre,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: TEAL,
    programLogo: {
      sourceUri: { uri: `${BASE_URL}/api/wallet/logo` },
      contentDescription: { defaultValue: { language: 'es', value: 'DKV Seguros' } },
    },
  }
}

function construirObjeto({ clienteId, nombre, seguros }: DatosTarjeta) {
  const total = TARJETA.total
  const tiene = PRODUCTO_SLUGS.filter((s) => seguros.includes(s))
  const faltan = PRODUCTO_SLUGS.filter((s) => !seguros.includes(s))
  const n = tiene.length
  const completa = n >= total
  const codigoQR = `${clienteId}${completa ? '-PREMIO' : ''}`
  const nombres = PRODUCTO_SLUGS.map((s) => PRODUCTOS[s].nombre)
  const nombresTexto = `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`

  return {
    id: objetoId(clienteId),
    classId: CLASE_ID,
    state: 'ACTIVE',
    accountName: nombre,
    accountId: clienteId,
    loyaltyPoints: {
      label: 'Seguros',
      balance: { string: `${n}/${total}` },
    },
    secondaryLoyaltyPoints: {
      label: completa ? 'Premio' : 'Te falta',
      balance: { string: completa ? '¡Sorpresa!' : `${total - n} ${total - n === 1 ? 'seguro' : 'seguros'}` },
    },
    heroImage: {
      sourceUri: { uri: `${BASE_URL}/api/wallet/hero?seguros=${tiene.join(',')}` },
      contentDescription: { defaultValue: { language: 'es', value: `${n} de ${total} seguros contratados` } },
    },
    barcode: {
      type: 'QR_CODE',
      value: codigoQR,
      alternateText: clienteId,
    },
    textModulesData: [
      {
        id: 'premio',
        header: completa ? '¡Regalo sorpresa desbloqueado!' : 'Tu regalo sorpresa',
        body: completa
          ? 'Ya tienes los 3 seguros DKV. Enséñale este código a tu asesor para recibir tu regalo sorpresa.'
          : `Contrata los 3 seguros DKV (${nombresTexto}) y llévate un regalo sorpresa. Te ${faltan.length === 1 ? 'falta' : 'faltan'}: ${faltan.map((s) => PRODUCTOS[s].nombre).join(', ')}.`,
      },
      {
        id: 'como_funciona',
        header: 'Cómo funciona',
        body: `Cada seguro DKV que contrates marca un hueco de tu tarjeta. Al completar los 3 (${nombresTexto}), ganas un regalo sorpresa. Tu asesor DKV actualiza la tarjeta automáticamente.`,
      },
    ],
  }
}

/** URL "Añadir a Google Wallet" para el cliente. */
export function enlaceGoogleWallet(datos: DatosTarjeta): string {
  if (!walletConfigurado()) {
    throw new Error('Google Wallet no está configurado (faltan variables GOOGLE_WALLET_*).')
  }
  const payload = {
    iss: SA_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [BASE_URL],
    payload: {
      loyaltyClasses: [construirClase()],
      loyaltyObjects: [construirObjeto(datos)],
    },
  }
  const token = jwt.sign(payload, SA_KEY, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

/* ── Lectura y actualización con push (API REST) ── */

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1'
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer'

export class TarjetaNoExiste extends Error {
  constructor() {
    super('La tarjeta aún no existe en el móvil del cliente. Envíale primero el enlace para que la guarde.')
    this.name = 'TarjetaNoExiste'
  }
}

async function accessToken(): Promise<string> {
  const auth = new GoogleAuth({
    credentials: { client_email: SA_EMAIL, private_key: SA_KEY },
    scopes: SCOPE,
  })
  const client = await auth.getClient()
  const { token } = await client.getAccessToken()
  if (!token) throw new Error('No se pudo obtener el token de acceso de Google.')
  return token
}

/** Nº de seguros contratados en la tarjeta del cliente. Null si aún no la ha guardado. */
export async function leerSellos(clienteId: string): Promise<number | null> {
  if (!walletConfigurado()) throw new Error('Google Wallet no está configurado.')
  const token = await accessToken()
  const res = await fetch(`${WALLET_API}/loyaltyObject/${objetoId(clienteId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Google respondió ${res.status} al leer la tarjeta.`)
  const obj = await res.json()
  const str: string = obj?.loyaltyPoints?.balance?.string ?? ''
  const n = parseInt(str.split('/')[0], 10)
  return Number.isFinite(n) ? n : 0
}

/** Actualiza los seguros de una tarjeta ya guardada y dispara el push al móvil. */
export async function actualizarSellos(datos: DatosTarjeta): Promise<void> {
  if (!walletConfigurado()) throw new Error('Google Wallet no está configurado.')
  const token = await accessToken()
  const cuerpo = construirObjeto(datos)
  const res = await fetch(`${WALLET_API}/loyaltyObject/${objetoId(datos.clienteId)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cuerpo),
  })
  if (res.status === 404) throw new TarjetaNoExiste()
  if (!res.ok) {
    const detalle = await res.text().catch(() => '')
    throw new Error(`Google respondió ${res.status} al actualizar la tarjeta. ${detalle.slice(0, 200)}`)
  }
}
