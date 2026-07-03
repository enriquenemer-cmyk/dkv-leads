import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import { ARTICULOS, ARTICULO_BY_SLUG, slugify, C } from '../../fichas'
import JsonLd from '@/components/JsonLd'

const BASE = 'https://dkv-ergo.es'

export function generateStaticParams() {
  return ARTICULOS.map(a => ({ slug: slugify(a.title) }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const a = ARTICULO_BY_SLUG[slug]
  if (!a) return { title: 'Artículo no encontrado · Blog DKV' }
  return {
    title: `${a.title} · Blog DKV`,
    description: a.excerpt,
    alternates: { canonical: `/dkv/blog/${slug}` },
    openGraph: { title: a.title, description: a.excerpt, images: [a.img], type: 'article' },
  }
}

const font = 'var(--font-jakarta), system-ui, sans-serif'

function Logo({ size = 26 }: { size?: number }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src="/dkv-logo.png" alt="DKV Seguros" style={{ height: size, width: 'auto', display: 'block' }} />
}

export default async function ArticuloPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const a = ARTICULO_BY_SLUG[slug]
  if (!a) notFound()
  const more = ARTICULOS.filter(x => x.title !== a.title).slice(0, 3)
  const url = `${BASE}/dkv/blog/${slug}`
  const articleLd = {
    '@context': 'https://schema.org', '@type': 'Article',
    headline: a.title, description: a.excerpt, image: a.img,
    articleSection: a.category, inLanguage: 'es-ES',
    author: { '@type': 'Organization', name: 'DKV Seguros' },
    publisher: { '@type': 'Organization', name: 'DKV Seguros', logo: { '@type': 'ImageObject', url: `${BASE}/dkv-logo.png` } },
    mainEntityOfPage: url,
  }
  const breadcrumbLd = {
    '@context': 'https://schema.org', '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'DKV Seguros', item: `${BASE}/dkv` },
      { '@type': 'ListItem', position: 2, name: 'Blog', item: `${BASE}/dkv#blog` },
      { '@type': 'ListItem', position: 3, name: a.title, item: url },
    ],
  }

  return (
    <div style={{ background: '#fff', color: C.text, fontFamily: font, minHeight: '100vh' }}>
      <JsonLd data={[articleLd, breadcrumbLd]} />
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,.92)', backdropFilter: 'saturate(180%) blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px', height: 68, display: 'flex', alignItems: 'center', gap: 20 }}>
          <Link href="/dkv" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}><Logo size={30} /></Link>
          <Link href="/dkv#blog" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.taupe, textDecoration: 'none', fontSize: 14.5, fontWeight: 600 }}><ArrowLeft size={16} /> Blog</Link>
          <div style={{ flex: 1 }} />
          <Link href="/dkv#calcula" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.red, color: '#fff', textDecoration: 'none', borderRadius: 999, padding: '11px 24px', fontSize: 14.5, fontWeight: 700 }}>Calcula tu seguro <ArrowRight size={16} /></Link>
        </div>
      </header>

      <article style={{ maxWidth: 780, margin: '0 auto', padding: '0 24px 72px' }}>
        <div style={{ paddingTop: 40 }}>
          <span style={{ display: 'inline-block', background: '#e9f1ec', color: C.teal, fontSize: 12, fontWeight: 800, padding: '5px 13px', borderRadius: 999, letterSpacing: '0.04em' }}>{a.category}</span>
          <h1 style={{ fontSize: 'clamp(28px,4vw,44px)', fontWeight: 800, color: C.text, letterSpacing: '-0.03em', lineHeight: 1.12, margin: '18px 0 12px' }}>{a.title}</h1>
          <div style={{ fontSize: 14, color: C.taupe, display: 'flex', gap: 10 }}><span>{a.date}</span><span>·</span><span>{a.read} de lectura</span></div>
        </div>

        <div style={{ height: 'clamp(220px,38vw,420px)', borderRadius: 20, margin: '28px 0 36px', backgroundImage: `url(${a.img})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 30px 60px -30px rgba(9,87,81,.4)' }} />

        <p style={{ fontSize: 19, color: C.text, lineHeight: 1.6, fontWeight: 500, margin: '0 0 26px' }}>{a.body[0].text}</p>
        {a.body.slice(1).map((b, i) => (
          <div key={i} style={{ marginBottom: 22 }}>
            {b.h && <h2 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: '0 0 10px', letterSpacing: '-0.02em' }}>{b.h}</h2>}
            <p style={{ fontSize: 16.5, color: C.taupe, lineHeight: 1.75, margin: 0 }}>{b.text}</p>
          </div>
        ))}

        <div style={{ background: `linear-gradient(135deg, ${C.cream}, #eef1e0)`, borderRadius: 18, padding: '30px', marginTop: 36, textAlign: 'center' }}>
          <div style={{ fontSize: 19, fontWeight: 800, color: C.text, marginBottom: 8 }}>¿Te ayudamos a dar el paso?</div>
          <p style={{ fontSize: 15, color: C.taupe, margin: '0 0 20px' }}>Calcula tu seguro en 1 minuto, sin compromiso.</p>
          <Link href="/dkv#calcula" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: C.red, color: '#fff', textDecoration: 'none', borderRadius: 13, padding: '15px 32px', fontSize: 16, fontWeight: 700 }}>Calcula tu seguro <ArrowRight size={18} /></Link>
        </div>
      </article>

      <section style={{ background: C.grayBg, borderTop: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '52px 24px' }}>
          <h2 style={{ fontSize: 21, fontWeight: 800, color: C.text, margin: '0 0 22px', letterSpacing: '-0.02em' }}>Sigue leyendo</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }} className="more-grid">
            {more.map(m => (
              <Link key={m.title} href={`/dkv/blog/${slugify(m.title)}`} style={{ textDecoration: 'none', background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                <div style={{ height: 120, backgroundImage: `url(${m.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
                <div style={{ padding: '18px 18px 20px' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 800, color: C.teal }}>{m.category}</span>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: C.text, lineHeight: 1.3, margin: '6px 0 0' }}>{m.title}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <footer style={{ background: C.tealDeep, color: 'rgba(255,255,255,.6)', padding: '30px 24px', textAlign: 'center', fontSize: 13 }}>
        <Link href="/dkv" style={{ color: 'rgba(255,255,255,.85)', textDecoration: 'none', fontWeight: 600 }}>← Volver a DKV Seguros</Link>
        <div style={{ marginTop: 8 }}>© 2026 DKV Seguros de Salud · Todos los derechos reservados.</div>
      </footer>

      <style>{`@media(max-width:820px){.more-grid{grid-template-columns:1fr!important}}`}</style>
    </div>
  )
}
