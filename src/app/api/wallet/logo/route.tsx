import { ImageResponse } from 'next/og'

/* Logo de la tarjeta para Google Wallet (círculo de la cabecera).
   Marca DKV nítida sobre crema, con Poppins incrustada. PNG 660x660. */

export async function GET(req: Request) {
  const origin = new URL(req.url).origin
  let fonts: { name: string; data: ArrayBuffer; weight: 700; style: 'normal' }[] = []
  try {
    const bold = await fetch(`${origin}/fonts/Poppins-Bold.ttf`).then((r) => r.arrayBuffer())
    fonts = [{ name: 'Poppins', data: bold, weight: 700, style: 'normal' }]
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
          backgroundColor: '#EDEDE0',
          fontFamily: 'Poppins',
        }}
      >
        <div style={{ display: 'flex', fontSize: 300, fontWeight: 700, lineHeight: 1, letterSpacing: -6 }}>
          <span style={{ color: '#8FAE2C' }}>D</span>
          <span style={{ color: '#0F4A3F' }}>KV</span>
        </div>
        <div style={{ display: 'flex', fontSize: 62, fontWeight: 700, letterSpacing: 10, color: '#6E6A5F', marginTop: 8 }}>
          SEGUROS
        </div>
      </div>
    ),
    { width: 660, height: 660, fonts },
  )
}
