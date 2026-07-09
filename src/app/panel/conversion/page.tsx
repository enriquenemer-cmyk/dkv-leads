'use client'
import { useEffect, useState } from 'react'
import { supabase, Lead, fuenteOrigen } from '@/lib/supabase'
import { Loader } from '@/components/Loader'
import { PageHero } from '@/components/PageHero'
import { TrendingUp, Users, Trophy } from 'lucide-react'

const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

// Nombre bonito para cada origen de lead
function nombreFuente(o: string): string {
  const m: Record<string, string> = {
    'web-dkv': 'Web DKV', 'web': 'Web', 'formulario': 'Formulario', 'manual': 'Alta manual', 'meta': 'Meta Ads',
  }
  return m[o] ?? (o ? o.charAt(0).toUpperCase() + o.slice(1) : 'Sin origen')
}

export default function ConversionPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('leads').select('*')
      setLeads(data ?? []); setLoading(false)
    }
    load()
    const ch = supabase.channel('conv-rt').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Agrupar por origen
  const grupos: Record<string, { total: number; clientes: number; calientes: number }> = {}
  leads.forEach(l => {
    const o = fuenteOrigen(l.fuente) || 'sin-origen'
    const g = grupos[o] ?? (grupos[o] = { total: 0, clientes: 0, calientes: 0 })
    g.total++
    if (l.tag === 'cliente') g.clientes++
    if (l.tag === 'caliente') g.calientes++
  })
  const filas = Object.entries(grupos)
    .map(([o, g]) => ({ o, ...g, conv: g.total ? Math.round((g.clientes / g.total) * 100) : 0 }))
    .sort((a, b) => b.total - a.total)

  const totalLeads = leads.length
  const totalClientes = leads.filter(l => l.tag === 'cliente').length
  const convGlobal = totalLeads ? Math.round((totalClientes / totalLeads) * 100) : 0
  const maxTotal = Math.max(1, ...filas.map(f => f.total))

  const kpis = [
    { label: 'Leads totales', value: totalLeads, icon: Users, bg: '#eaf1fb', ic: '#3b6fb0' },
    { label: 'Clientes cerrados', value: totalClientes, icon: Trophy, bg: '#e3f1ec', ic: '#0F7A63' },
    { label: 'Conversión global', value: `${convGlobal}%`, icon: TrendingUp, bg: '#f8efd9', ic: '#a8741a' },
  ]

  if (loading) return <div style={{ padding: 40 }}><Loader label="Cargando conversión…" /></div>

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      <PageHero title="Conversión por fuente" subtitle="Qué canal te trae los mejores leads" />

      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }} className="conv-kpis">
        <style>{`@media(max-width:720px){.conv-kpis{grid-template-columns:1fr!important}}`}</style>
        {kpis.map(k => (
          <div key={k.label} style={card}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: k.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <k.icon size={18} style={{ color: k.ic }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#16201d', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12.5, color: '#9aaba5', fontWeight: 600, marginTop: 3 }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Tabla por fuente */}
      <div style={card}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 4px' }}>Detalle por origen</h2>
        <p style={{ fontSize: 12.5, color: '#9aaba5', margin: '0 0 20px' }}>Ordenado por volumen. La conversión = clientes ÷ leads de ese canal.</p>
        {filas.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '30px 0', color: '#9aaba5' }}>Aún no hay leads.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {filas.map(f => (
              <div key={f.o}>
                <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 7 }}>
                  <span style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d' }}>{nombreFuente(f.o)}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
                    <span style={{ fontSize: 12.5, color: '#9aaba5' }}>{f.total} lead{f.total !== 1 ? 's' : ''} · {f.clientes} cliente{f.clientes !== 1 ? 's' : ''}</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: f.conv >= convGlobal ? '#0F7A63' : '#a8741a' }}>{f.conv}%</span>
                  </span>
                </div>
                <div style={{ height: 12, borderRadius: 99, background: '#f0f4f1', overflow: 'hidden' }}>
                  <div style={{ height: 12, borderRadius: 99, background: 'linear-gradient(90deg,#0F7A63,#2f9e83)', width: `${Math.round((f.total / maxTotal) * 100)}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
