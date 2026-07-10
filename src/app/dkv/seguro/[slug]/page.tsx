import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight, Check, ThumbsUp, ShieldCheck, Phone } from 'lucide-react'
import { SEGUROS, SEGURO_BY_SLUG, slugify, C } from '../../fichas'
import JsonLd from '@/components/JsonLd'

const BASE = 'https://ergopymes.com'

export function generateStaticParams() {
  return SEGUROS.map(f => ({ slug: slugify(f.title) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const f = SEGURO_BY_SLUG[slug]
  if (!f) return { title: 'Seguro no encontrado · DKV Seguros' }
  const description = (f.desc || f.tagline).slice(0, 155)
  return {
    title: `${f.title} · DKV Seguros`,
    description,
    alternates: { canonical: `/dkv/seguro/${slug}` },
    openGraph: { title: `${f.title} · DKV Seguros`, description, images: [f.img], type: 'article' },
  }
}

const font = 'var(--font-jakarta), system-ui, sans-serif'

function Logo({ size = 26 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/dkv-logo.png" alt="DKV Seguros" style={{ height: size, width: 'auto', display: 'block' }} />
}

export default async function SeguroPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const f = SEGURO_BY_SLUG[slug]
  if (!f) notFound()
  const Icon = f.icon
  const related = SEGUROS.filter(s => s.group === f.group && s.title !== f.title).slice(0, 3)
  const url = `${BASE}/dkv/seguro/${slug}`
  const priceNum = f.price ? f.price.replace(/[^\d,]/g, '').replace(',', '.') : ''
  const productLd = {
    '@context': 'https://schema.org', '@type': 'Product',
    name: f.title, description: f.desc, image: f.img, category: f.group,
    brand: { '@type': 'Brand', name: 'DKV' },
    ...(priceNum ? { offers: { '@type': 'Offer', price: priceNum, priceCurrency: 'EUR', availability: 'https://schema.org/InStock', url } } : {}),
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'DKV Seguros', item: `${BASE}/dkv` },
      { '@type': 'ListItem', position: 2, name: f.group, item: `${BASE}/dkv` },
      { '@type': 'ListItem', position: 3, name: f.title, item: url },
    ],
  }

  return (
    <div style={{ background: '#fff', color: C.text, fontFamily: font, minHeight: '100vh' }}>
      <JsonLd data={[productLd, breadcrumbLd]} />
      {/* Header */}
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,.92)', backdropFilter: 'saturate(180%) blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/dkv" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Logo size={30} /></Link>
          <Link href="/dkv" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.taupe, textDecoration: 'none', fontSize: 14.5, fontWeight: 600 }}><ArrowLeft size={16} /> Volver</Link>
          <div style={{ flex: 1 }} />
          <Link href="/dkv#calcula" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.red, color: '#fff', textDecoration: 'none', borderRadius: 999, padding: '11px 24px', fontSize: 14.5, fontWeight: 700 }}>Calcula tu seguro <ArrowRight size={16} /></Link>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: 'relative', color: '#fff', minHeight: 340, display: 'flex', alignItems: 'flex-end', backgroundImage: `linear-gradient(120deg, rgba(6,63,59,.94) 0%, rgba(9,87,81,.8) 55%, rgba(13,107,95,.62) 100%), url(${f.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px 44px', width: '100%', boxSizing: 'border-box' }}>
          <div style={{ fontSize: 13, fontWeight: 600, opacity: .85, marginBottom: 18 }}>
            <Link href="/dkv" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none' }}>DKV</Link> › {f.group} › {f.title}
          </div>
          <div style={{ width: 64, height: 64, borderRadius: 17, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}><Icon size={32} /></div>
          {f.promo && <span style={{ display: 'inline-block', background: C.red, fontSize: 11.5, fontWeight: 800, padding: '5px 13px', borderRadius: 999, marginBottom: 12 }}>¡PROMO {f.promo}!</span>}
          <h1 style={{ fontSize: 'clamp(30px,4.5vw,50px)', fontWeight: 800, letterSpacing: '-0.03em', margin: '0 0 10px', lineHeight: 1.05, textShadow: '0 2px 24px rgba(0,0,0,.35)' }}>{f.title}</h1>
          <p style={{ fontSize: 'clamp(16px,2vw,20px)', fontWeight: 500, color: 'rgba(255,255,255,.9)', margin: 0 }}>{f.tagline}</p>
        </div>
      </section>

      {/* Sellos de confianza (coherencia con la landing) */}
      <div style={{ background: '#fafbf9', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '16px 24px', display: 'flex', flexWrap: 'wrap', gap: 'clamp(14px,3vw,40px)', justifyContent: 'center' }}>
          {[{ i: ShieldCheck, t: 'Datos protegidos (RGPD)' }, { i: Check, t: 'Sin permanencia' }, { i: Phone, t: 'Respuesta en 24h' }, { i: ThumbsUp, t: '4,8 ★ en Google' }].map(({ i: Ic, t }) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 700, color: C.taupe, whiteSpace: 'nowrap' }}>
              <span style={{ width: 28, height: 28, borderRadius: 8, background: '#eef3ee', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><Ic size={15} style={{ color: C.teal }} /></span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* Content */}
      <section style={{ maxWidth: 1080, margin: '0 auto', padding: '48px 24px 72px', display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 40, alignItems: 'start' }} className="seguro-grid">
        <div>
          <p style={{ fontSize: 18, color: C.text, lineHeight: 1.65, margin: '0 0 32px' }}>{f.desc}</p>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 20px', letterSpacing: '-0.02em' }}>Qué incluye</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px 24px' }} className="cov-grid">
            {f.coverage.map(c => (
              <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ width: 26, height: 26, borderRadius: '50%', background: '#e9f1ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Check size={15} style={{ color: C.teal }} strokeWidth={3} /></span>
                <span style={{ fontSize: 15.5, color: C.text, lineHeight: 1.5 }}>{c}</span>
              </div>
            ))}
          </div>

          <div style={{ background: C.cream, borderRadius: 16, padding: '22px 24px', margin: '34px 0 0', display: 'flex', gap: 14, alignItems: 'flex-start' }}>
            <ThumbsUp size={24} style={{ color: C.limeDark, flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 800, color: C.limeDark, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Ideal para ti si…</div>
              <div style={{ fontSize: 16, color: C.text, lineHeight: 1.55 }}>{f.idealFor}</div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside style={{ position: 'sticky', top: 92, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: '28px 26px', boxShadow: '0 20px 50px -32px rgba(9,87,81,.35)' }}>
          {f.price ? (
            <>
              <div style={{ fontSize: 13, color: C.taupe, fontWeight: 600 }}>Precio orientativo desde</div>
              <div style={{ fontSize: 40, fontWeight: 900, color: C.teal, letterSpacing: '-0.03em', lineHeight: 1.1, margin: '2px 0 4px' }}>{f.price}</div>
            </>
          ) : (
            <div style={{ fontSize: 21, fontWeight: 800, color: C.teal, marginBottom: 4 }}>Presupuesto a tu medida</div>
          )}
          <p style={{ fontSize: 13.5, color: C.taupe, margin: '6px 0 20px', lineHeight: 1.5 }}>Un asesor calcula tu precio exacto en 1 minuto, sin compromiso.</p>
          <Link href="/dkv#calcula" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: C.red, color: '#fff', textDecoration: 'none', borderRadius: 13, padding: '15px', fontSize: 16, fontWeight: 700, boxShadow: '0 14px 30px -10px rgba(221,54,54,.5)' }}>Calcular mi precio <ArrowRight size={18} /></Link>
          <a href="tel:699669603" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: C.teal, textDecoration: 'none', borderRadius: 13, padding: '13px', fontSize: 15, fontWeight: 700, marginTop: 10, border: `1.5px solid ${C.border}` }}><Phone size={16} /> 699 66 96 03</a>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 14, fontSize: 11.5, color: C.taupe }}><ShieldCheck size={13} style={{ color: C.teal }} /> Sin compromiso · Datos protegidos</div>
        </aside>
      </section>

      {/* Related */}
      {related.length > 0 && (
        <section style={{ background: C.grayBg, borderTop: `1px solid ${C.border}` }}>
          <div style={{ maxWidth: 1080, margin: '0 auto', padding: '56px 24px' }}>
            <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 24px', letterSpacing: '-0.02em' }}>Otros seguros de {f.group.replace('Seguros de ', '').toLowerCase() === f.group.toLowerCase() ? f.group.toLowerCase() : f.group}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="rel-grid">
              {related.map(r => {
                const RIcon = r.icon
                return (
                  <Link key={r.title} href={`/dkv/seguro/${slugify(r.title)}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ height: 110, backgroundImage: `linear-gradient(180deg, rgba(9,87,81,.05), rgba(9,87,81,.35)), url(${r.img})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative' }}>
                      <div style={{ position: 'absolute', bottom: -18, left: 18, width: 40, height: 40, borderRadius: 11, background: '#fff', boxShadow: '0 8px 18px -6px rgba(9,87,81,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><RIcon size={20} style={{ color: C.teal }} /></div>
                    </div>
                    <div style={{ padding: '28px 20px 22px' }}>
                      <div style={{ fontSize: 16.5, fontWeight: 800, color: C.text, marginBottom: 6 }}>{r.title}</div>
                      <div style={{ fontSize: 13.5, color: C.taupe, display: 'inline-flex', alignItems: 'center', gap: 5, fontWeight: 700 }}>Ver ficha <ArrowRight size={14} /></div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer style={{ background: C.tealDeep, color: 'rgba(255,255,255,.6)', padding: '30px 24px', textAlign: 'center', fontSize: 13 }}>
        <Link href="/dkv" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none', fontWeight: 600 }}>← Volver a DKV Seguros</Link>
        <div style={{ marginTop: 8 }}>© 2026 DKV Seguros de Salud · Todos los derechos reservados.</div>
      </footer>

      <style>{`@media(max-width:820px){.seguro-grid{grid-template-columns:1fr!important}.cov-grid{grid-template-columns:1fr!important}.rel-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
