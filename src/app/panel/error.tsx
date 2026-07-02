'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw, LayoutDashboard } from 'lucide-react'

export default function PanelError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log para diagnóstico en consola del navegador
    console.error('[panel] Error en la página:', error)
  }, [error])

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <div style={{ maxWidth: 420, width: '100%', background: '#fff', borderRadius: 20, border: '1px solid #edf1ef', padding: '36px 32px', textAlign: 'center', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 18px 48px -24px rgba(16,32,29,0.28)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: '#fbe7e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
          <AlertTriangle size={26} style={{ color: '#c23a22' }} />
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#16201d', margin: '0 0 8px', letterSpacing: '-0.01em' }}>Algo salió mal</h1>
        <p style={{ fontSize: 14, color: '#6b7a76', lineHeight: 1.6, margin: '0 0 24px' }}>
          No hemos podido cargar esta página. Suele resolverse al reintentar. Si el problema persiste, revisa tu conexión.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', boxShadow: '0 8px 22px -8px rgba(15,122,99,0.5)' }}>
            <RotateCw size={15} /> Reintentar
          </button>
          <Link href="/panel/dashboard"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e2e8e4', textDecoration: 'none', fontSize: 14, fontWeight: 600, color: '#16201d', background: '#fff' }}>
            <LayoutDashboard size={15} /> Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
