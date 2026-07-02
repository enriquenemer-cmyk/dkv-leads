import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ACTUALIZADO } from '@/app/dkv/legal-data'

const C = { teal: '#095751', tealDeep: '#063f3b', taupe: '#6A625A', text: '#1b2320', border: '#e7e6e0', cream: '#F3F4E7' }
const font = 'var(--font-jakarta), system-ui, sans-serif'

/* Presentational shell shared by the legal pages (privacidad, aviso legal, cookies). */
export default function LegalShell({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <div style={{ background: '#fff', color: C.text, fontFamily: font, minHeight: '100vh' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 30, background: 'rgba(255,255,255,.92)', backdropFilter: 'saturate(180%) blur(12px)', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px', height: 66, display: 'flex', alignItems: 'center', gap: 18 }}>
          <Link href="/dkv" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/dkv-logo.png" alt="DKV Seguros" style={{ height: 30, width: 'auto', display: 'block' }} />
          </Link>
          <Link href="/dkv" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: C.taupe, textDecoration: 'none', fontSize: 14.5, fontWeight: 600 }}><ArrowLeft size={16} /> Volver al inicio</Link>
        </div>
      </header>

      <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
        <span style={{ display: 'inline-block', background: C.cream, color: C.teal, fontSize: 12, fontWeight: 800, padding: '5px 13px', borderRadius: 999, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Legal</span>
        <h1 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.12, margin: '16px 0 6px' }}>{title}</h1>
        <p style={{ fontSize: 13.5, color: C.taupe, margin: '0 0 8px' }}>Última actualización: {ACTUALIZADO}</p>
        {intro && <p style={{ fontSize: 17, color: C.text, lineHeight: 1.65, margin: '18px 0 0', fontWeight: 500 }}>{intro}</p>}
        <div className="legal-body" style={{ marginTop: 30 }}>{children}</div>
      </main>

      <footer style={{ borderTop: `1px solid ${C.border}`, background: '#fafbf9' }}>
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '26px 24px', display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', fontSize: 13.5 }}>
          <Link href="/dkv/aviso-legal" style={{ color: C.teal, fontWeight: 600, textDecoration: 'none' }}>Aviso legal</Link>
          <Link href="/dkv/privacidad" style={{ color: C.teal, fontWeight: 600, textDecoration: 'none' }}>Política de privacidad</Link>
          <Link href="/dkv/cookies" style={{ color: C.teal, fontWeight: 600, textDecoration: 'none' }}>Política de cookies</Link>
          <span style={{ flex: 1 }} />
          <span style={{ color: C.taupe }}>© 2026 DKV Seguros de Salud</span>
        </div>
      </footer>
    </div>
  )
}

/* Small helpers to keep the legal pages readable */
export function H2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 21, fontWeight: 800, color: '#0f1512', letterSpacing: '-0.02em', margin: '34px 0 12px' }}>{children}</h2>
}
export function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 15.5, color: '#3a423e', lineHeight: 1.7, margin: '0 0 14px' }}>{children}</p>
}
export function UL({ children }: { children: React.ReactNode }) {
  return <ul style={{ margin: '0 0 14px', paddingLeft: 22, display: 'flex', flexDirection: 'column', gap: 8, fontSize: 15.5, color: '#3a423e', lineHeight: 1.6 }}>{children}</ul>
}
