import React from 'react'

/** Cabecera premium reutilizable (degradado + decoración + acento dorado) para las páginas del panel. */
export function PageHero({ title, subtitle, right }: { title: string; subtitle?: string; right?: React.ReactNode }) {
  return (
    <div style={{
      position: 'relative', overflow: 'hidden', borderRadius: 24, padding: '28px 32px', marginBottom: 26,
      background: 'linear-gradient(135deg, #0a2f27 0%, #0d5344 55%, #0F7A63 120%)',
      boxShadow: '0 20px 50px -22px rgba(10,47,39,0.6), inset 0 1px 0 rgba(255,255,255,0.08)',
    }}>
      {/* Halos de luz */}
      <div style={{ position: 'absolute', top: -110, right: -60, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(140,198,63,0.18), transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -140, left: -40, width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.06), transparent 70%)', pointerEvents: 'none' }} />
      {/* Rejilla sutil */}
      <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)', backgroundSize: '46px 46px', pointerEvents: 'none', maskImage: 'linear-gradient(180deg, #000, transparent 85%)' }} />
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div style={{ minWidth: 0 }}>
          {/* Acento dorado */}
          <div style={{ width: 42, height: 3, borderRadius: 999, background: 'linear-gradient(90deg,#f5c451,#c7902a)', marginBottom: 12 }} />
          {subtitle && <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500, margin: '0 0 4px' }}>{subtitle}</p>}
          <h1 style={{ fontSize: 29, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.025em', lineHeight: 1.1 }}>{title}</h1>
        </div>
        {right}
      </div>
    </div>
  )
}
