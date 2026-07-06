import { ImageResponse } from 'next/og'
import { PROGRAMAS, esProgramaValido } from '@/lib/wallet-programas'

/* Banner (heroImage) de las tarjetas "Club DKV" para Google Wallet.
   ?programa=sonrisa|hogar|decesos|vida y ?sellos=N. Dibuja los sellos con el
   icono/color del programa, la meta con regalo y una barra de progreso, con
   tipografía Poppins incrustada. PNG 1032x336. */

const CREMA = '#EDEDE0'
const ORO = '#EF9F27'
const TEAL = '#0F4A3F'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const progRaw = searchParams.get('programa') || 'sonrisa'
  const prog = PROGRAMAS[esProgramaValido(progRaw) ? progRaw : 'sonrisa']
  const TOTAL = prog.total
  const ACCENT = prog.accent

  let n = parseInt(searchParams.get('sellos') || '0', 10)
  if (!Number.isFinite(n)) n = 0
  n = Math.max(0, Math.min(TOTAL, n))
  const completa = n >= TOTAL
  const faltan = TOTAL - n

  // Cargamos Poppins desde /public/fonts del propio servidor (sirve en dev y prod).
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

  const stamps = Array.from({ length: TOTAL }, (_, i) => i)

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
          {stamps.map((i) => (
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
                fontSize: 46,
                backgroundColor: i < n ? ACCENT : 'rgba(237,237,224,0.05)',
                border: i < n ? `3px solid ${ACCENT}` : '3px solid rgba(237,237,224,0.28)',
              }}
            >
              {i < n ? prog.emoji : ''}
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
          <div style={{ display: 'flex', width: (620 * n) / TOTAL, height: 14, borderRadius: 7, backgroundColor: completa ? ORO : ACCENT }} />
        </div>

        {completa ? (
          <div style={{ display: 'flex', fontSize: 33, fontWeight: 700, color: '#F4C77A' }}>
            ¡Premio desbloqueado!
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 32, fontWeight: 500, color: CREMA }}>
            Te {faltan === 1 ? 'falta' : 'faltan'}&nbsp;<span style={{ fontWeight: 700, color: ACCENT }}>{faltan}</span>&nbsp;{faltan === 1 ? 'sello' : 'sellos'} para {prog.premioCorto}
          </div>
        )}
      </div>
    ),
    { width: 1032, height: 336, fonts },
  )
}
