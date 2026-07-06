import { ImageResponse } from 'next/og'

/* Banner (heroImage) de la tarjeta Club Sonrisa para Google Wallet.
   Dibuja los 5 sellos según ?sellos=N (0..5), la meta con regalo y una
   barra de progreso, con tipografía Poppins incrustada. PNG 1032x336. */

const CREMA = '#EDEDE0'
const LIMA = '#8FAE2C'
const ORO = '#EF9F27'
const TEAL = '#0F4A3F'

export async function GET(req: Request) {
  const TOTAL = 3
  const { searchParams } = new URL(req.url)
  let n = parseInt(searchParams.get('sellos') || '0', 10)
  if (!Number.isFinite(n)) n = 0
  n = Math.max(0, Math.min(TOTAL, n))
  const completa = n >= TOTAL
  const faltan = TOTAL - n

  // Cargamos Poppins desde /public/fonts del propio servidor (sirve en dev y prod).
  // Si por lo que sea fallara, renderizamos con la fuente por defecto (nunca peta).
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
        <div style={{ display: 'flex', fontSize: 21, fontWeight: 600, letterSpacing: 6, color: 'rgba(237,237,224,0.55)', marginBottom: 20 }}>
          REFIERE Y GANA
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96,
                height: 96,
                marginLeft: i === 0 ? 0 : 22,
                borderRadius: 48,
                fontSize: 48,
                backgroundColor: i < n ? LIMA : 'rgba(237,237,224,0.05)',
                border: i < n ? `3px solid ${LIMA}` : '3px solid rgba(237,237,224,0.28)',
              }}
            >
              {i < n ? '🦷' : ''}
            </div>
          ))}
          <div style={{ display: 'flex', fontSize: 40, color: 'rgba(237,237,224,0.5)', marginLeft: 22, marginRight: 22 }}>›</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 108,
              height: 108,
              borderRadius: 54,
              fontSize: 54,
              backgroundColor: completa ? ORO : 'rgba(239,159,39,0.12)',
              border: `3px solid ${ORO}`,
            }}
          >
            🎁
          </div>
        </div>

        <div style={{ display: 'flex', width: 620, height: 14, borderRadius: 7, backgroundColor: 'rgba(237,237,224,0.16)', marginBottom: 20 }}>
          <div style={{ display: 'flex', width: (620 * n) / TOTAL, height: 14, borderRadius: 7, backgroundColor: completa ? ORO : LIMA }} />
        </div>

        {completa ? (
          <div style={{ display: 'flex', fontSize: 33, fontWeight: 700, color: '#F4C77A' }}>
            ¡Blanqueamiento dental desbloqueado!
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 500, color: CREMA }}>
            Te {faltan === 1 ? 'falta' : 'faltan'}&nbsp;<span style={{ fontWeight: 700, color: LIMA }}>{faltan}</span>&nbsp;{faltan === 1 ? 'sello' : 'sellos'} para tu blanqueamiento
          </div>
        )}
      </div>
    ),
    { width: 1032, height: 336, fonts },
  )
}
