import { ImageResponse } from 'next/og'
import { PRODUCTOS, PRODUCTO_SLUGS, TARJETA, parseSeguros, type ProductoSlug } from '@/lib/wallet-programas'

/* Banner (heroImage) de "Club Protección DKV" para Google Wallet.
   ?seguros=hogar,salud → marca esos huecos. Iconos elegantes de línea
   (no emoji). 3 huecos (Hogar/Decesos/Salud) + regalo. PNG 1032x336. */

const CREMA = '#EDEDE0'
const LIMA = '#8FAE2C'       // acento DKV
const LIMA_CLARO = '#B4CF5A' // lima claro para texto sobre teal
const TEAL = '#0F4A3F'

// Paths de iconos de línea (viewBox 24)
const ICON_PATHS: Record<ProductoSlug | 'regalo', string> = {
  hogar: '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M9 22V12h6v10"/>',
  decesos: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  salud: '<path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6 6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/><path d="M8 15v1a6 6 0 0 0 6 6 6 6 0 0 0 6-6v-4"/><circle cx="20" cy="10" r="2"/>',
  regalo: '<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13"/><path d="M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M7.5 8a2.5 2.5 0 0 1 0-5A4.8 8 0 0 1 12 8a4.8 8 0 0 1 4.5-5 2.5 2.5 0 0 1 0 5"/>',
}

function iconoSrc(slug: ProductoSlug | 'regalo', color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[slug]}</svg>`
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
}

function Icono({ slug, color, size }: { slug: ProductoSlug | 'regalo'; color: string; size: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={iconoSrc(slug, color)} width={size} height={size} alt="" />
}

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

  const slot = (slug: ProductoSlug) => {
    const activo = tiene.has(slug)
    const p = PRODUCTOS[slug]
    return (
      <div key={slug} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: 20, marginRight: 20 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 92,
            height: 92,
            borderRadius: 46,
            backgroundColor: activo ? p.accent : 'transparent',
            border: activo ? `2px solid ${p.accent}` : '2px solid rgba(237,237,224,0.28)',
          }}
        >
          <Icono slug={slug} color={activo ? TEAL : 'rgba(237,237,224,0.45)'} size={44} />
        </div>
        <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, marginTop: 12, color: activo ? CREMA : 'rgba(237,237,224,0.5)' }}>{p.nombre}</div>
      </div>
    )
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
        <div style={{ display: 'flex', fontSize: 20, fontWeight: 600, letterSpacing: 5, color: 'rgba(237,237,224,0.55)', marginBottom: 18 }}>
          COMPLETA TU PROTECCIÓN
        </div>

        <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 22 }}>
          {PRODUCTO_SLUGS.map((s) => slot(s))}
          <div style={{ display: 'flex', fontSize: 36, color: 'rgba(237,237,224,0.45)', marginLeft: 6, marginRight: 18, marginTop: 26 }}>›</div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 96,
                height: 96,
                borderRadius: 48,
                backgroundColor: completa ? LIMA : 'transparent',
                border: `2px solid ${LIMA}`,
              }}
            >
              <Icono slug="regalo" color={completa ? TEAL : LIMA} size={46} />
            </div>
            <div style={{ display: 'flex', fontSize: 18, fontWeight: 600, marginTop: 12, color: completa ? LIMA_CLARO : 'rgba(180,207,90,0.6)' }}>Sorpresa</div>
          </div>
        </div>

        {completa ? (
          <div style={{ display: 'flex', fontSize: 30, fontWeight: 700, color: LIMA_CLARO }}>
            ¡Regalo sorpresa desbloqueado!
          </div>
        ) : (
          <div style={{ display: 'flex', fontSize: 29, fontWeight: 500, color: CREMA }}>
            Te {faltan === 1 ? 'falta' : 'faltan'}&nbsp;<span style={{ fontWeight: 700, color: LIMA_CLARO }}>{faltan}</span>&nbsp;{faltan === 1 ? 'seguro' : 'seguros'} para tu regalo sorpresa
          </div>
        )}
      </div>
    ),
    { width: 1032, height: 336, fonts },
  )
}
