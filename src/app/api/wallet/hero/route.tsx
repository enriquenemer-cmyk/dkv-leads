import { ImageResponse } from 'next/og'

/* Banner (heroImage) de la tarjeta Club Sonrisa para Google Wallet.
   Dibuja los 5 sellos según ?sellos=N (0..5), la meta con regalo y una
   barra de progreso. Google lo muestra grande dentro del pase (PNG). */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  let n = parseInt(searchParams.get('sellos') || '0', 10)
  if (!Number.isFinite(n)) n = 0
  n = Math.max(0, Math.min(5, n))
  const completa = n >= 5
  const faltan = 5 - n

  const CREMA = '#EDEDE0'
  const LIMA = '#8FAE2C'
  const ORO = '#EF9F27'

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
          backgroundColor: '#0F4A3F',
        }}
      >
        <div style={{ display: 'flex', fontSize: 22, letterSpacing: 4, color: 'rgba(237,237,224,0.6)', marginBottom: 22 }}>
          REFIERE Y GANA
        </div>

        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 26 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 86,
                height: 86,
                marginLeft: i === 0 ? 0 : 16,
                borderRadius: 43,
                fontSize: 42,
                backgroundColor: i < n ? LIMA : 'transparent',
                border: i < n ? `3px solid ${LIMA}` : '3px solid rgba(237,237,224,0.30)',
              }}
            >
              {i < n ? '🦷' : ''}
            </div>
          ))}
          <div style={{ display: 'flex', fontSize: 40, color: 'rgba(237,237,224,0.55)', marginLeft: 22, marginRight: 22 }}>→</div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 96,
              height: 96,
              borderRadius: 48,
              fontSize: 46,
              backgroundColor: completa ? ORO : 'transparent',
              border: `3px solid ${ORO}`,
            }}
          >
            🎁
          </div>
        </div>

        <div style={{ display: 'flex', width: 620, height: 12, borderRadius: 6, backgroundColor: 'rgba(237,237,224,0.18)', marginBottom: 18 }}>
          <div style={{ display: 'flex', width: (620 * n) / 5, height: 12, borderRadius: 6, backgroundColor: LIMA }} />
        </div>

        <div style={{ display: 'flex', fontSize: 32, color: completa ? '#F4C77A' : CREMA }}>
          {completa ? '¡Blanqueamiento dental desbloqueado!' : `${n}/5 · Te faltan ${faltan} para tu blanqueamiento`}
        </div>
      </div>
    ),
    { width: 1032, height: 336 },
  )
}
