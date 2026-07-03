import { ImageResponse } from 'next/og'

/* Banner (heroImage) de la tarjeta Club Sonrisa para Google Wallet.
   Dibuja los 5 sellos según ?sellos=N (0..5) y la línea del premio.
   Google lo muestra grande dentro del pase. Se sirve como PNG. */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  let n = parseInt(searchParams.get('sellos') || '0', 10)
  if (!Number.isFinite(n)) n = 0
  n = Math.max(0, Math.min(5, n))
  const completa = n >= 5
  const faltan = 5 - n

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
        <div style={{ display: 'flex', marginBottom: 30 }}>
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 104,
                height: 104,
                marginLeft: i === 0 ? 0 : 20,
                borderRadius: 52,
                fontSize: 52,
                backgroundColor: i < n ? '#8FAE2C' : 'transparent',
                border: i < n ? '3px solid #8FAE2C' : '3px solid rgba(237,237,224,0.30)',
              }}
            >
              {i < n ? '🦷' : ''}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', fontSize: 34, color: completa ? '#F4C77A' : '#EDEDE0' }}>
          {completa ? '¡Blanqueamiento dental desbloqueado!' : `Te faltan ${faltan} · Blanqueamiento dental gratis`}
        </div>
      </div>
    ),
    { width: 1032, height: 336 },
  )
}
