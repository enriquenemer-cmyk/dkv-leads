import jwt from 'jsonwebtoken'
import { GoogleAuth } from 'google-auth-library'
import { PROGRAMAS, type ProgramaSlug } from './wallet-programas'

/* ─────────────────────────────────────────────────────────────
   Google Wallet · Tarjetas de sellos "Club DKV" (multi-programa)
   Genera el enlace "Añadir a Google Wallet" para un cliente y un ramo
   (sonrisa / hogar / decesos / vida). Cada ramo tiene su clase, icono,
   color y premio (ver wallet-programas.ts).

   Mecánica: 3 referidos = premio (el 4º hueco de la tarjeta es el regalo).
   La clase y el objeto viajan firmados dentro del JWT; Google los crea
   en el primer "guardar". Para leer/actualizar sellos (push) sí usamos
   la API REST con la cuenta de servicio.
   ───────────────────────────────────────────────────────────── */

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || ''
const SA_EMAIL = process.env.GOOGLE_WALLET_SA_EMAIL || ''
// La clave privada llega con los saltos de línea escapados (\n) desde el .env
const SA_KEY = (process.env.GOOGLE_WALLET_SA_KEY || '').replace(/\\n/g, '\n')

// URL pública del sitio (para logo y banner del pase; Google los descarga de aquí)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dkv-leads.vercel.app'

const TEAL = '#0F4A3F'

export type DatosTarjeta = {
  /** Ramo de seguro / programa de fidelización */
  programa: ProgramaSlug
  /** Identificador único del cliente, p. ej. "DKV-4821". Sin espacios ni acentos. */
  clienteId: string
  /** Nombre visible del titular */
  nombre: string
  /** Sellos conseguidos (0..total del programa) */
  sellos: number
}

/** True si Google Wallet está configurado (hay credenciales en el entorno). */
export function walletConfigurado(): boolean {
  return Boolean(ISSUER_ID && SA_EMAIL && SA_KEY)
}

const claseId = (programa: ProgramaSlug) => `${ISSUER_ID}.${PROGRAMAS[programa].clase}`
const objetoId = (programa: ProgramaSlug, clienteId: string) => `${ISSUER_ID}.${clienteId}-${programa}`

/* La CLASE es la plantilla compartida de un programa: nombre, logo, color. */
function construirClase(programa: ProgramaSlug) {
  const p = PROGRAMAS[programa]
  return {
    id: claseId(programa),
    issuerName: 'DKV Seguros',
    programName: p.nombre,
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: TEAL,
    programLogo: {
      sourceUri: { uri: `${BASE_URL}/logo-cuadrado.png` },
      contentDescription: { defaultValue: { language: 'es', value: 'DKV Seguros' } },
    },
  }
}

/* El OBJETO es la tarjeta concreta de un cliente para un programa. */
function construirObjeto({ programa, clienteId, nombre, sellos }: DatosTarjeta) {
  const p = PROGRAMAS[programa]
  const total = p.total
  const n = Math.max(0, Math.min(total, Math.round(sellos)))
  const completa = n >= total
  const faltan = total - n
  const codigoQR = `${clienteId}-${programa.toUpperCase()}${completa ? '-PREMIO' : ''}`

  return {
    id: objetoId(programa, clienteId),
    classId: claseId(programa),
    state: 'ACTIVE',
    accountName: nombre,
    accountId: clienteId,
    loyaltyPoints: {
      label: 'Sellos',
      balance: { string: `${n}/${total}` },
    },
    secondaryLoyaltyPoints: {
      label: completa ? 'Premio' : 'Te falta',
      balance: { string: completa ? '¡A canjear!' : `${faltan} ${faltan === 1 ? 'sello' : 'sellos'}` },
    },
    heroImage: {
      sourceUri: { uri: `${BASE_URL}/api/wallet/hero?programa=${programa}&sellos=${n}` },
      contentDescription: { defaultValue: { language: 'es', value: `${n} de ${total} sellos` } },
    },
    barcode: {
      type: 'QR_CODE',
      value: codigoQR,
      alternateText: clienteId,
    },
    textModulesData: [
      {
        id: 'premio',
        header: completa ? '¡Premio desbloqueado!' : 'Tu premio',
        body: completa
          ? `Ya tienes ${p.premio}. Muestra este código a tu asesor DKV para canjearlo.`
          : `Refiere a ${total} amigos y consigue ${p.premio}. Te ${faltan === 1 ? 'falta' : 'faltan'} ${faltan}.`,
      },
      {
        id: 'como_funciona',
        header: 'Cómo funciona',
        body: `Cada amigo que refieras y contrate suma 1 sello. Al llegar a ${total} sellos, ganas ${p.premio}. Tu asesor DKV actualiza tus sellos automáticamente.`,
      },
    ],
  }
}

/** Devuelve la URL "Añadir a Google Wallet" para el cliente y programa indicados. */
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
      loyaltyClasses: [construirClase(datos.programa)],
      loyaltyObjects: [construirObjeto(datos)],
    },
  }

  const token = jwt.sign(payload, SA_KEY, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

/* ─────────────────────────────────────────────────────────────
   Lectura y actualización con push automático (API REST)
   ───────────────────────────────────────────────────────────── */

const WALLET_API = 'https://walletobjects.googleapis.com/walletobjects/v1'
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer'

// Error específico cuando el cliente todavía no ha guardado la tarjeta
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

/** Lee los sellos actuales de la tarjeta del cliente para un programa. Null si aún no la ha guardado. */
export async function leerSellos(programa: ProgramaSlug, clienteId: string): Promise<number | null> {
  if (!walletConfigurado()) throw new Error('Google Wallet no está configurado.')
  const token = await accessToken()
  const res = await fetch(`${WALLET_API}/loyaltyObject/${objetoId(programa, clienteId)}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (res.status === 404) return null
  if (!res.ok) throw new Error(`Google respondió ${res.status} al leer la tarjeta.`)
  const obj = await res.json()
  const str: string = obj?.loyaltyPoints?.balance?.string ?? ''
  const n = parseInt(str.split('/')[0], 10)
  return Number.isFinite(n) ? n : 0
}

/** Actualiza los sellos de una tarjeta ya guardada y dispara el push a su móvil. */
export async function actualizarSellos(datos: DatosTarjeta): Promise<void> {
  if (!walletConfigurado()) throw new Error('Google Wallet no está configurado.')
  const token = await accessToken()
  const cuerpo = construirObjeto(datos)
  const res = await fetch(`${WALLET_API}/loyaltyObject/${objetoId(datos.programa, datos.clienteId)}`, {
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
