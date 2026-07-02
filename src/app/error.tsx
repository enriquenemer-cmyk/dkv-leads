'use client'
import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RotateCw, Home } from 'lucide-react'

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app] Error:', error)
  }, [error])

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#f0f4f1', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 22, padding: '40px 34px', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(16,32,29,0.32)' }}>
        <div style={{ width: 60, height: 60, borderRadius: 18, background: '#fbe7e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px' }}>
          <AlertTriangle size={28} style={{ color: '#c23a22' }} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#16201d', margin: '0 0 10px', letterSpacing: '-0.01em' }}>Vaya, algo ha fallado</h1>
        <p style={{ fontSize: 14.5, color: '#6b7a76', lineHeight: 1.6, margin: '0 0 26px' }}>
          Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', boxShadow: '0 8px 22px -8px rgba(15,122,99,0.5)' }}>
            <RotateCw size={16} /> Reintentar
          </button>
          <Link href="/"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '13px 22px', borderRadius: 13, border: '1.5px solid #e2e8e4', textDecoration: 'none', fontSize: 14.5, fontWeight: 600, color: '#16201d', background: '#fff' }}>
            <Home size={16} /> Inicio
          </Link>
        </div>
      </div>
    </div>
  )
}
