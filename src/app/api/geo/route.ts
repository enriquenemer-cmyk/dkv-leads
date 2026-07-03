import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

/* Devuelve la ubicación aproximada (país/región/ciudad) del visitante a partir
   de las cabeceras que inyecta Vercel en producción. Anónimo: no guarda la IP.
   En local (sin Vercel) devuelve nulos, y no pasa nada. */
export async function GET() {
  const h = await headers()
  const dec = (v: string | null) => {
    if (!v) return null
    try { return decodeURIComponent(v) } catch { return v }
  }
  return NextResponse.json({
    pais: h.get('x-vercel-ip-country'),
    region: dec(h.get('x-vercel-ip-country-region')),
    ciudad: dec(h.get('x-vercel-ip-city')),
  })
}
