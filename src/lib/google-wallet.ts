import jwt from 'jsonwebtoken'
import { GoogleAuth } from 'google-auth-library'

/* ─────────────────────────────────────────────────────────────
   Google Wallet · Tarjeta de sellos "Club Sonrisa" (DKV)
   Genera el enlace "Añadir a Google Wallet" para un cliente.

   Mecánica: 5 personas referidas = 1 blanqueamiento dental.
   La tarjeta muestra los sellos como "N/5" y un QR con el código
   del cliente (lo que la clínica escanea para sumar/canjear).

   NO se llama a la API de Google desde el servidor: la clase y el
   objeto del pase viajan firmados dentro del propio JWT, y Google
   los crea en el primer "guardar". Así solo necesitamos la clave
   de la cuenta de servicio, sin pedir tokens de acceso.
   ───────────────────────────────────────────────────────────── */

const ISSUER_ID = process.env.GOOGLE_WALLET_ISSUER_ID || ''
const SA_EMAIL = process.env.GOOGLE_WALLET_SA_EMAIL || ''
// La clave privada llega con los saltos de línea escapados (\n) desde el .env
const SA_KEY = (process.env.GOOGLE_WALLET_SA_KEY || '').replace(/\\n/g, '\n')

// Nº total de sellos para completar el premio
export const SELLOS_TOTAL = 5

// Sufijo fijo de la clase (plantilla común a todas las tarjetas)
const CLASE_ID = `${ISSUER_ID}.club_sonrisa`

// URL pública del sitio (para logo y banner del pase; Google los descarga de aquí)
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://dkv-leads.vercel.app'

export type DatosTarjeta = {
  /** Identificador único del cliente, p. ej. "DKV-4821". Sin espacios ni acentos. */
  clienteId: string
  /** Nombre visible del titular */
  nombre: string
  /** Sellos conseguidos (0..SELLOS_TOTAL) */
  sellos: number
}

/** True si Google Wallet está configurado (hay credenciales en el entorno). */
export function walletConfigurado(): boolean {
  return Boolean(ISSUER_ID && SA_EMAIL && SA_KEY)
}

/* La CLASE es la plantilla compartida: nombre del programa, logo, colores.
   Se define una sola vez; todas las tarjetas la referencian. */
function construirClase() {
  return {
    id: CLASE_ID,
    issuerName: 'DKV Seguros',
    programName: 'Club Sonrisa',
    reviewStatus: 'UNDER_REVIEW',
    hexBackgroundColor: '#0F4A3F',
    programLogo: {
      sourceUri: { uri: `${BASE_URL}/logo-cuadrado.png` },
      contentDescription: { defaultValue: { language: 'es', value: 'DKV Seguros' } },
    },
  }
}

/* El OBJETO es la tarjeta concreta de un cliente: su nombre, sus sellos y su QR. */
function construirObjeto({ clienteId, nombre, sellos }: DatosTarjeta) {
  const n = Math.max(0, Math.min(SELLOS_TOTAL, Math.round(sellos)))
  const completa = n >= SELLOS_TOTAL
  const codigoQR = completa ? `${clienteId}-PREMIO` : clienteId

  return {
    id: `${ISSUER_ID}.${clienteId}`,
    classId: CLASE_ID,
    state: 'ACTIVE',
    accountName: nombre,
    accountId: clienteId,
    loyaltyPoints: {
      label: 'Sellos',
      balance: { string: `${n}/${SELLOS_TOTAL}` },
    },
    heroImage: {
      sourceUri: { uri: `${BASE_URL}/api/wallet/hero?sellos=${n}` },
      contentDescription: { defaultValue: { language: 'es', value: `${n} de ${SELLOS_TOTAL} sellos` } },
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
          ? 'Blanqueamiento dental gratis. Muestra este código en la clínica para canjearlo.'
          : `Refiere a ${SELLOS_TOTAL} amigos y consigue un blanqueamiento dental gratis. Te faltan ${SELLOS_TOTAL - n}.`,
      },
    ],
  }
}

/** Devuelve la URL "Añadir a Google Wallet" para el cliente indicado. */
export function enlaceGoogleWallet(datos: DatosTarjeta): string {
  if (!walletConfigurado()) {
    throw new Error('Google Wallet no está configurado (faltan variables GOOGLE_WALLET_*).')
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://dkv-leads.vercel.app'

  const payload = {
    iss: SA_EMAIL,
    aud: 'google',
    typ: 'savetowallet',
    iat: Math.floor(Date.now() / 1000),
    origins: [baseUrl],
    payload: {
      loyaltyClasses: [construirClase()],
      loyaltyObjects: [construirObjeto(datos)],
    },
  }

  const token = jwt.sign(payload, SA_KEY, { algorithm: 'RS256' })
  return `https://pay.google.com/gp/v/save/${token}`
}

/* ─────────────────────────────────────────────────────────────
   Actualización con push automático
   Cuando la tarjeta ya existe en el móvil del cliente, hacemos un
   PATCH del objeto en la API de Google. Google se encarga de enviar
   el "push" al dispositivo: el cliente ve los sellos actualizados
   sin reinstalar nada.
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

/** Lee los sellos actuales de la tarjeta del cliente. Devuelve null si aún no la ha guardado. */
export async function leerSellos(clienteId: string): Promise<number | null> {
  if (!walletConfigurado()) throw new Error('Google Wallet no está configurado.')
  const token = await accessToken()
  const res = await fetch(`${WALLET_API}/loyaltyObject/${ISSUER_ID}.${clienteId}`, {
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
  const res = await fetch(`${WALLET_API}/loyaltyObject/${ISSUER_ID}.${datos.clienteId}`, {
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
