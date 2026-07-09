import React from 'react'

/** Cabecera premium reutilizable (degradado + decoración) para las páginas del panel. */
export function PageHero({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 105%)', borderRadius: 22, padding: '26px 30px', marginBottom: 24, boxShadow: '0 16px 44px -20px rgba(10,47,39,0.55)' }}>
      <div style={{ position: 'absolute', top: -90, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          {subtitle && <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500, margin: '0 0 3px' }}>{subtitle}</p>}
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>{title}</h1>
        </div>
        {right}
      </div>
    </div>
  )
}
