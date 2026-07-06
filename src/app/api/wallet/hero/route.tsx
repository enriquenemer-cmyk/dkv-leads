import { ImageResponse } from 'next/og'
import { PRODUCTOS, PRODUCTO_SLUGS, TARJETA, parseSeguros } from '@/lib/wallet-programas'

/* Banner (heroImage) de la tarjeta "Club Protección DKV" para Google Wallet.
   ?seguros=hogar,vida → marca esos huecos. 3 huecos (Hogar/Decesos/Vida) +
   regalo sorpresa. Tipografía Poppins incrustada. PNG 1032x336. */

const CREMA = '#EDEDE0'
const ORO = '#EF9F27'
const TEAL = '#0F4A3F'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const tiene = new Set(parseSeguros(searchParams.get('seguros')))
  const total = TARJETA.total
  const n = tiene.size
  const completa = n >= total
  const faltan = total - n

  const origin = new URL(req.url).origin
  let fonts: { name: string; data: ArrayBuffer; weight: 500 | 600 | 700; style: 'normal' }[] = []
  try {
    const [medium, semibold, bold] = await Promise.all([
      fetch(`${origin}/fonts/Poppins-Medium.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${origin}/fonts/Poppins-SemiBold.ttf`).then((r) => r.arrayBuffer()),
      fetch(`${origin}/fonts/Poppins-Bold.ttf`).then((r) => r.arrayBuffer()),
    ])
    fonts = [
      { name: 'Poppins', data: medium, weight: 500, style: 'normal' },
      { name: 'Poppins', data: semibold, weight: 600, style: 'normal' },
      { name: 'Poppins', data: bold, weight: 700, style: 'normal' },
    ]
  } catch {
    fonts = []
  }

  const slot = (emoji: string, name: string, activo: boolean, accent: string) => (
    <div key={name} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 18, marginRight: 18 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 92,
          height: 92,
          borderRadius: 46,
          fontSize: 44,
          backgroundColor: activo ? accent : 'rgba(237,237,224,0.05)',
          border: activo ? `3px solid ${accent}` : '3px solid rgba(237,237,224,0.26)',
        }}
      >
        {emoji}
      </div>
      <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, marginTop: 10, color: activo ? CREMA : 'rgba(237,237,224,0.5)' }}>{name}</div>
    </div>
  )

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: TEAL,
          fontFamily: 'Poppins',
        }}
      >
        <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, letterSpacing: 5, color: 'rgba(237,237,224,0.55)', marginBottom: 16 }}>
          COMPLETA TU PROTECCIÓN
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 20 }}>
          {PRODUCTO_SLUGS.map((s) => slot(PRODUCTOS[s].emoji, PRODUCTOS[s].nombre, tiene.has(s), PRODUCTOS[s].accent))}
          <div style={{ display: 'flex', fontSize: 38, color: 'rgba(237,237,224,0.5)', marginLeft: 8, marginRight: 18, marginTop: 26 }}>›</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 98,
                height: 98,
                borderRadius: 49,
                fontSize: 48,
                backgroundColor: completa ? ORO : 'rgba(239,159,39,0.12)',
                border: `3px solid ${ORO}`,
              }}
            >
              🎁
            </div>
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, marginTop: 10, color: completa ? '#F4C77A' : 'rgba(244,199,122,0.6)' }}>Sorpresa</div>
          </div>
        </div>

        {completa ? (
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: '#F4C77A' }}>
            ¡Regalo sorpresa desbloqueado!
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 29, fontWeight: 500, color: CREMA }}>
            Te {faltan === 1 ? 'falta' : 'faltan'}&nbsp;<span style={{ fontWeight: 700, color: ORO }}>{faltan}</span>&nbsp;{faltan === 1 ? 'seguro' : 'seguros'} para tu regalo sorpresa
          </div>
        )}
      </div>
    ),
    { width: 1032, height: 336, fonts },
  )
}
