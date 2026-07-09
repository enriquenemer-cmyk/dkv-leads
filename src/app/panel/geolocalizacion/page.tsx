'use client'
import { useEffect, useState } from 'react'
import { supabase, Lead } from '@/lib/supabase'
import { geoDeLead } from '@/lib/provincia'
import { Loader } from '@/components/Loader'
import { PageHero } from '@/components/PageHero'
import { MapPin, Globe2, Trophy } from 'lucide-react'

const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

export default function GeoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('leads').select('*')
      setLeads(data ?? []); setLoading(false)
    }
    load()
    const ch = supabase.channel('geo-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Agrupar por provincia
  const grupos: Record<string, { total: number; clientes: number; calientes: number }> = {}
  let sinUbicacion = 0
  leads.forEach(l => {
    const p = geoDeLead(l).provincia
    if (!p) { sinUbicacion++; return }
    const g = grupos[p] ?? (grupos[p] = { total: 0, clientes: 0, calientes: 0 })
    g.total++
    if (l.tag === 'cliente') g.clientes++
    if (l.tag === 'caliente') g.calientes++
  })
  const filas = Object.entries(grupos)
    .map(([p, g]) => ({ p, ...g, conv: g.total ? Math.round((g.clientes / g.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  const conUbicacion = leads.length - sinUbicacion
  const maxTotal = Math.max(1, ...filas.map(f => f.total))
  const top = filas[0]

  const kpis = [
    { label: 'Leads con ubicación', value: `${conUbicacion}`, sub: `de ${leads.length}`, icon: MapPin, bg: '#e3f1ec', ic: '#0F7A63' },
    { label: 'Provincias distintas', value: `${filas.length}`, sub: 'con clientes', icon: Globe2, bg: '#eaf1fb', ic: '#3b6fb0' },
    { label: 'Provincia top', value: top ? top.p : '—', sub: top ? `${top.total} leads` : '', icon: Trophy, bg: '#f8efd9', ic: '#a8741a' },
  ]

  if (loading) return <div style={{ padding: 40 }}><Loader label="Cargando geolocalización…" /></div>

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      <PageHero title="Geolocalización" subtitle="De dónde vienen tus clientes" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="geo-kpis">
        <style>{`@media(max-width:720px){.geo-kpis{grid-template-columns:1fr!important}}`}</style>
        {kpis.map(k => (
          <div key={k.label} style={card}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <k.icon size={18} style={{ color: k.ic }} />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#16201d', lineHeight: 1.1 }}>{k.value} <span style={{ fontSize: 13, fontWeight: 500, color: '#9aaba5' }}>{k.sub}</span></div>
            <div style={{ fontSize: 12.5, color: '#9aaba5', fontWeight: 600, marginTop: 5 }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 4px' }}>Leads por provincia</h2>
        <p style={{ fontSize: 12.5, color: '#9aaba5', margin: '0 0 20px' }}>Ordenado por volumen. Deducido del código postal de cada cliente.</p>
        {filas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#9aaba5' }}>Aún no hay leads con código postal.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filas.map(f => (
              <div key={f.p}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#16201d' }}>📍 {f.p}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12.5, color: '#9aaba5' }}>{f.total} lead{f.total !== 1 ? 's' : ''}{f.clientes ? ` · ${f.clientes} cliente${f.clientes !== 1 ? 's' : ''}` : ''}</span>
                    <span style={{ fontSize: 14.5, fontWeight: 800, color: '#16201d', minWidth: 34, textAlign: 'right' }}>{Math.round((f.total / conUbicacion) * 100)}%</span>
                  </span>
                </div>
                <div style={{ height: 12, borderRadius: 99, background: '#f0f4f1', overflow: 'hidden' }}>
                  <div style={{ height: 12, borderRadius: 99, background: 'linear-gradient(90deg,#0F7A63,#2f9e83)', width: `${Math.round((f.total / maxTotal) * 100)}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
        {sinUbicacion > 0 && (
          <p style={{ fontSize: 12, color: '#c8d4ce', margin: '18px 0 0' }}>{sinUbicacion} lead{sinUbicacion !== 1 ? 's' : ''} sin código postal (no se puede ubicar).</p>
        )}
      </div>
    </div>
  )
}
