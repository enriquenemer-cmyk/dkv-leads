'use client'
import { useEffect } from 'react'

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[global] Error crítico:', error)
  }, [error])

  return (
    <html lang="es">
      <body style={{ margin: 0, minHeight: '100vh', background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', padding: 24 }}>
        <div style={{ maxWidth: 440, width: '100%', background: '#fff', borderRadius: 22, padding: '40px 34px', textAlign: 'center', boxShadow: '0 24px 60px -28px rgba(16,32,29,0.32)' }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: '#fbe7e2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', fontSize: 28 }}>⚠️</div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#16201d', margin: '0 0 10px' }}>Error inesperado</h1>
          <p style={{ fontSize: 14.5, color: '#6b7a76', lineHeight: 1.6, margin: '0 0 26px' }}>
            La aplicación ha encontrado un problema. Reintenta para continuar.
          </p>
          <button onClick={reset}
            style={{ padding: '13px 26px', borderRadius: 13, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14.5, fontWeight: 700, color: '#fff', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)' }}>
            Reintentar
          </button>
        </div>
      </body>
    </html>
  )
}
