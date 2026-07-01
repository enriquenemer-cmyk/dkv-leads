import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
      <div style={{ textAlign: 'center', maxWidth: 440 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 28px', backdropFilter: 'blur(8px)' }}>
          <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
            <rect x="13" y="4" width="6" height="24" rx="3" fill="white"/>
            <rect x="4" y="13" width="24" height="6" rx="3" fill="white"/>
          </svg>
        </div>
        <div style={{ fontSize: 80, fontWeight: 900, color: 'rgba(255,255,255,0.12)', lineHeight: 1, marginBottom: 4, letterSpacing: '-0.05em' }}>404</div>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Página no encontrada</h1>
        <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.6, margin: '0 0 36px' }}>La página que buscas no existe o ha sido movida. Vuelve al inicio.</p>
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '13px 28px', borderRadius: 13, background: '#fff', color: '#0F7A63', fontSize: 14.5, fontWeight: 700, textDecoration: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            Volver al inicio
          </Link>
          <Link href="/panel/dashboard" style={{ padding: '13px 28px', borderRadius: 13, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 14.5, fontWeight: 600, textDecoration: 'none', border: '1px solid rgba(255,255,255,0.2)' }}>
            Ir al panel
          </Link>
        </div>
      </div>
    </div>
  )
}
