'use client'
import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { supabase, Lead, leadSucursal, fuenteOrigen } from '@/lib/supabase'
import { limpiarInteres } from '@/lib/interes'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { LeadModal } from '@/components/LeadModal'
import { exportCSV } from '@/lib/export'
import { CountUp, Donut } from '@/components/charts'
import { Users, Flame, Trophy, TrendingUp, Bell, Plus, Download, ArrowUpRight, Clock, PieChart, ChevronDown } from 'lucide-react'

const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

type Periodo = '7d' | '30d' | '90d' | 'todo'
const PERIODOS: { key: Periodo; label: string }[] = [
  { key: '7d', label: 'Últimos 7 días' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: '90d', label: 'Últimos 3 meses' },
  { key: 'todo', label: 'Todo el tiempo' },
]

function cutoffDate(periodo: Periodo): Date | null {
  if (periodo === 'todo') return null
  const d = new Date()
  if (periodo === '7d') d.setDate(d.getDate() - 7)
  else if (periodo === '30d') d.setDate(d.getDate() - 30)
  else if (periodo === '90d') d.setDate(d.getDate() - 90)
  return d
}

export default function DashboardPage() {
  const [allLeads, setAllLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)
  const [periodo, setPeriodo] = useState<Periodo>('todo')
  const [detalle, setDetalle] = useState<{ label: string; sub: string; list: Lead[] } | null>(null)
  const [interesExpandido, setInteresExpandido] = useState(false)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('dash_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setAllLeads(data as Lead[])
  }

  const leads = useMemo(() => {
    const cutoff = cutoffDate(periodo)
    if (!cutoff) return allLeads
    return allLeads.filter(l => new Date(l.created_at) >= cutoff)
  }, [allLeads, periodo])

  const total = leads.length
  const calientes = leads.filter(l => l.tag === 'caliente').length
  const clientes = leads.filter(l => l.tag === 'cliente').length
  const conversion = total > 0 ? Math.round((clientes / total) * 100) : 0
  const hoy = new Date().toISOString().slice(0, 10)
  const tareasHoy = allLeads.filter(l => l.recordatorio?.fecha === hoy)
  const intereses: Record<string, number> = {}
  leads.forEach(l => { if (l.interes) intereses[l.interes] = (intereses[l.interes] ?? 0) + 1 })
  const maxI = Math.max(1, ...Object.values(intereses))

  const sucursales: Record<string, number> = {}
  leads.forEach(l => { const s = leadSucursal(l) || 'Sin asignar'; sucursales[s] = (sucursales[s] ?? 0) + 1 })
  const maxS = Math.max(1, ...Object.values(sucursales))

  const formulario = leads.filter(l => fuenteOrigen(l.fuente) === 'formulario').length
  const manual = leads.filter(l => fuenteOrigen(l.fuente) === 'manual').length
  const convForm = formulario > 0 ? Math.round((leads.filter(l => fuenteOrigen(l.fuente) === 'formulario' && l.tag === 'cliente').length / formulario) * 100) : 0
  const convManual = manual > 0 ? Math.round((leads.filter(l => fuenteOrigen(l.fuente) === 'manual' && l.tag === 'cliente').length / manual) * 100) : 0

  // Comparativa con período anterior
  const prevLeads = useMemo(() => {
    if (periodo === 'todo') return []
    const cutoff = cutoffDate(periodo)!
    const days = periodo === '7d' ? 7 : periodo === '30d' ? 30 : 90
    const prevStart = new Date(cutoff); prevStart.setDate(prevStart.getDate() - days)
    return allLeads.filter(l => {
      const d = new Date(l.created_at); return d >= prevStart && d < cutoff
    })
  }, [allLeads, periodo])

  const prevTotal = prevLeads.length
  const diffPct = prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 100) : null

  // Serie de los últimos 7 días (sobre TODOS los leads, no depende del filtro de período)
  const ultimos7 = useMemo(() => {
    const dias: Array<{ label: string; count: number; esHoy: boolean }> = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      const count = allLeads.filter(l => (l.created_at || '').slice(0, 10) === key).length
      dias.push({ label: d.toLocaleDateString('es-ES', { weekday: 'short' }).replace('.', ''), count, esHoy: i === 0 })
    }
    return dias
  }, [allLeads])
  const max7 = Math.max(1, ...ultimos7.map(d => d.count))
  const leadsHoy = ultimos7[6]?.count ?? 0
  const leads7d = ultimos7.reduce((s, d) => s + d.count, 0)

  const leadsDeHoy = allLeads.filter(l => (l.created_at || '').slice(0, 10) === hoy)

  const METRICS = [
    { label: 'Leads hoy', value: leadsHoy, suffix: '', sub: 'Nuevos hoy', icon: Clock, bg: '#e3f1ec', ic: '#0F7A63', dot: '#0F7A63', list: leadsDeHoy, detalle: 'Leads captados hoy' },
    { label: 'Total leads', value: total, suffix: '', sub: periodo === 'todo' ? 'Todos los captados' : `En este período`, icon: Users, bg: '#eaf3ff', ic: '#2b6fb0', dot: '#2b6fb0', list: leads, detalle: periodo === 'todo' ? 'Todos los leads captados' : 'Leads captados en este período' },
    { label: 'Leads calientes', value: calientes, suffix: '', sub: 'Prioridad alta', icon: Flame, bg: '#fef0ed', ic: '#c23a22', dot: '#c23a22', list: leads.filter(l => l.tag === 'caliente'), detalle: 'Leads con prioridad alta' },
    { label: 'Clientes', value: clientes, suffix: '', sub: 'Conversión exitosa', icon: Trophy, bg: '#e3f1ec', ic: '#0F7A63', dot: '#0F7A63', list: leads.filter(l => l.tag === 'cliente'), detalle: 'Leads convertidos en cliente' },
    { label: 'Tasa de conversión', value: conversion, suffix: '%', sub: 'Total → Cliente', icon: TrendingUp, bg: '#f8efd9', ic: '#a8741a', dot: '#a8741a', list: leads.filter(l => l.tag === 'cliente'), detalle: `${clientes} de ${total} leads convertidos en cliente` },
  ]

  // Distribución por estado (para la gráfica de dona)
  const distribucion = [
    { label: 'Fríos', value: leads.filter(l => l.tag === 'frio').length, color: '#8fb9cf' },
    { label: 'Tibios', value: leads.filter(l => l.tag === 'tibio').length, color: '#e8b866' },
    { label: 'Calientes', value: leads.filter(l => l.tag === 'caliente').length, color: '#e07856' },
    { label: 'Clientes', value: leads.filter(l => l.tag === 'cliente').length, color: '#0F7A63' },
  ]

  const EMBUDO = [
    { label: 'Captados', pct: 100, count: total, color: '#0a4d3e' },
    { label: 'Cualificados', pct: total > 0 ? Math.round((leads.filter(l => ['tibio','caliente','cliente'].includes(l.tag)).length / total) * 100) : 0, count: leads.filter(l => ['tibio','caliente','cliente'].includes(l.tag)).length, color: '#0F7A63' },
    { label: 'Interesados', pct: total > 0 ? Math.round((leads.filter(l => ['caliente','cliente'].includes(l.tag)).length / total) * 100) : 0, count: leads.filter(l => ['caliente','cliente'].includes(l.tag)).length, color: '#2f9e83' },
    { label: 'Clientes', pct: conversion, count: clientes, color: '#7cc3b1' },
  ]

  const now = new Date()
  const greeting = now.getHours() < 12 ? 'Buenos días' : now.getHours() < 19 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1120, margin: '0 auto' }}>
      {showModal && <LeadModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchLeads() }} />}

      {detalle && (
        <div onClick={() => setDetalle(null)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(10,32,29,0.45)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, zIndex: 100, animation: 'dashUp 0.2s ease' }}>
          <div onClick={e => e.stopPropagation()}
            style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 520, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 24px 60px -20px rgba(10,32,29,0.5)' }}>
            <div style={{ padding: '22px 24px', borderBottom: '1px solid #edf1ef', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#16201d', margin: '0 0 3px' }}>{detalle.label}</h2>
                <p style={{ fontSize: 13, color: '#9aaba5', margin: 0 }}>{detalle.sub} · <b style={{ color: '#0F7A63' }}>{detalle.list.length}</b></p>
              </div>
              <button onClick={() => setDetalle(null)}
                style={{ width: 34, height: 34, borderRadius: 10, border: 'none', background: '#f0f4f1', color: '#6b7a76', fontSize: 18, cursor: 'pointer', flexShrink: 0, fontFamily: 'inherit', lineHeight: 1 }}>×</button>
            </div>
            <div style={{ overflowY: 'auto', padding: '10px 14px 16px' }}>
              {detalle.list.length === 0
                ? <p style={{ color: '#9aaba5', fontSize: 14, textAlign: 'center', padding: '32px 0', margin: 0 }}>Sin leads en este apartado.</p>
                : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {detalle.list.map(l => (
                      <Link key={l.id} href={`/panel/leads/${l.id}`} onClick={() => setDetalle(null)}
                        style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px', borderRadius: 12, textDecoration: 'none', transition: 'background 0.12s' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f8fbf9')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                        <Avatar nombre={l.nombre} size={38} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                          <div style={{ fontSize: 12, color: '#9aaba5', marginTop: 1 }}>{limpiarInteres(l.interes) || '—'}</div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                          <TagPill tag={l.tag} />
                          <span style={{ fontSize: 11, color: '#c8d4ce' }}>{new Date(l.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      </Link>
                    ))}
                  </div>
              }
            </div>
          </div>
        </div>
      )}

      {/* Header — hero premium */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 105%)', borderRadius: 22, padding: '26px 30px', marginBottom: 24, boxShadow: '0 16px 44px -20px rgba(10,47,39,0.55)' }}>
        <div style={{ position: 'absolute', top: -90, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.03) 1px,transparent 1px)', backgroundSize: '48px 48px', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.72)', fontWeight: 500, margin: '0 0 3px' }}>{greeting} 👋</p>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Dashboard</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap', fontSize: 13.5, color: 'rgba(255,255,255,0.85)' }}>
              <span><b style={{ color: '#fff', fontWeight: 800 }}>{total}</b> leads</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span><b style={{ color: '#7ee8c8', fontWeight: 800 }}>{leadsHoy}</b> hoy</span>
              <span style={{ opacity: 0.4 }}>•</span>
              <span><b style={{ color: '#fff', fontWeight: 800 }}>{conversion}%</b> conversión</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => exportCSV(leads)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', backdropFilter: 'blur(8px)' }}>
              <Download size={14} /> Exportar CSV
            </button>
            <button onClick={() => setShowModal(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: 'none', background: '#fff', color: '#0a5b49', fontSize: 13.5, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.3)' }}>
              <Plus size={14} /> Nuevo lead
            </button>
          </div>
        </div>
      </div>

      {/* Filtro período */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
        {PERIODOS.map(p => (
          <button key={p.key} onClick={() => setPeriodo(p.key)}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
              background: periodo === p.key ? '#0F7A63' : '#fff',
              color: periodo === p.key ? '#fff' : '#6b7a76',
              boxShadow: periodo === p.key ? '0 2px 8px -2px rgba(15,122,99,0.45)' : '0 1px 3px rgba(0,0,0,0.07)',
              transition: 'all 0.15s',
            }}>
            {p.label}
          </button>
        ))}
        {diffPct !== null && (
          <span style={{ fontSize: 12.5, color: diffPct >= 0 ? '#0F7A63' : '#c23a22', fontWeight: 700, marginLeft: 4 }}>
            {diffPct >= 0 ? '↑' : '↓'} {Math.abs(diffPct)}% vs período anterior
          </span>
        )}
      </div>

      <style>{`
        @keyframes dashUp { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: translateY(0) } }
        .dash-card { animation: dashUp 0.5s ease both }
        .metric-card { transition: transform 0.18s ease, box-shadow 0.18s ease }
        .metric-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px -14px rgba(10,47,39,0.25) }
      `}</style>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16, marginBottom: 20 }} className="dash-grid">
        {METRICS.map(({ label, value, suffix, sub, icon: Icon, bg, ic, list, detalle: det }, i) => (
          <div key={label} className="dash-card metric-card" onClick={() => setDetalle({ label, sub: det, list })}
            style={{ ...card, padding: '22px 22px 20px', animationDelay: `${i * 0.07}s`, cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color: ic }} />
              </div>
              <ArrowUpRight size={14} style={{ color: '#c8d4ce' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#16201d', lineHeight: 1, marginBottom: 4 }}><CountUp value={value} suffix={suffix} /></div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16201d', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#9aaba5' }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Gráfico últimos 7 días */}
      <div style={{ ...card, marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 8 }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 3px' }}>Leads · últimos 7 días</h2>
            <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Ritmo de captación de la última semana</p>
          </div>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#0F7A63', lineHeight: 1 }}>{leadsHoy}</div>
              <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Hoy</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#16201d', lineHeight: 1 }}>{leads7d}</div>
              <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>7 días</div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, height: 120 }}>
          {ultimos7.map((d, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, height: '100%', justifyContent: 'flex-end' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: d.count > 0 ? '#16201d' : '#c8d4ce' }}>{d.count}</span>
              <div style={{ width: '100%', maxWidth: 46, height: `${Math.max(4, (d.count / max7) * 90)}px`, borderRadius: '8px 8px 4px 4px', background: d.esHoy ? 'linear-gradient(180deg, #0F7A63, #0a5b49)' : '#d6e6df', transition: 'height 0.5s ease' }} />
              <span style={{ fontSize: 11, color: d.esHoy ? '#0F7A63' : '#9aaba5', fontWeight: d.esHoy ? 700 : 500, textTransform: 'capitalize' }}>{d.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
        {/* Distribución por estado (dona) */}
        <div style={card} className="dash-card">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px', display: 'flex', alignItems: 'center', gap: 7 }}>
            <PieChart size={16} color="#0F7A63" /> Distribución por estado
          </h2>
          {total === 0
            ? <p style={{ fontSize: 13.5, color: '#c8d4ce' }}>Sin datos todavía.</p>
            : <Donut segments={distribucion} />}
        </div>
        {/* Embudo */}
        <div style={card} className="dash-card">
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px' }}>Embudo de conversión</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {EMBUDO.map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d' }}>{s.label}</span>
                  <span style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#16201d' }}>{s.count}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: s.color }}>{s.pct}%</span>
                  </span>
                </div>
                <div style={{ height: 14, borderRadius: 99, background: '#f0f4f1', overflow: 'hidden' }}>
                  <div style={{ height: 14, borderRadius: 99, background: s.color, width: `${s.pct}%`, transition: 'width 0.7s cubic-bezier(0.4,0,0.2,1)', minWidth: s.pct > 0 ? 8 : 0 }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interés */}
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px' }}>Interés por producto</h2>
          {Object.keys(intereses).length === 0
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#9aaba5', fontSize: 14 }}>Sin datos en este período</div>
            : (() => {
                const ordenados = Object.entries(intereses).sort((a,b) => b[1]-a[1])
                const visibles = interesExpandido ? ordenados : ordenados.slice(0, 5)
                const ocultos = ordenados.length - 5
                return <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {visibles.map(([interes, count]) => (
                      <div key={interes}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#6b7a76', marginBottom: 6 }}>
                          <span>{interes}</span><span style={{ color: '#16201d' }}>{count}</span>
                        </div>
                        <div style={{ height: 8, borderRadius: 99, background: '#f0f4f1' }}>
                          <div style={{ height: 8, borderRadius: 99, background: '#0F7A63', width: `${Math.round((count/maxI)*100)}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                  {ocultos > 0 && (
                    <button onClick={() => setInteresExpandido(v => !v)}
                      style={{ marginTop: 16, width: '100%', padding: '9px 12px', borderRadius: 10, border: '1px solid #e4eae7', background: '#f7faf8', color: '#0F7A63', fontSize: 12.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                      {interesExpandido ? 'Ver menos' : `Ver ${ocultos} más`}
                      <ChevronDown size={14} style={{ transform: interesExpandido ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  )}
                </>
              })()
          }
        </div>
      </div>

      {/* Leads por sucursal */}
      <div style={{ ...card, marginBottom: 16 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px' }}>📍 Leads por sucursal</h2>
        {Object.keys(sucursales).length === 0
          ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 80, color: '#9aaba5', fontSize: 14 }}>Sin datos en este período</div>
          : <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 18 }}>
              {Object.entries(sucursales).sort((a,b) => b[1]-a[1]).map(([suc, count]) => (
                <div key={suc}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: suc === 'Sin asignar' ? '#9aaba5' : '#16201d' }}>{suc}</span>
                    <span style={{ fontSize: 16, fontWeight: 800, color: '#16201d' }}>{count}</span>
                  </div>
                  <div style={{ height: 12, borderRadius: 99, background: '#f0f4f1', overflow: 'hidden' }}>
                    <div style={{ height: 12, borderRadius: 99, background: suc === 'Sin asignar' ? '#c8d4ce' : '#0F7A63', width: `${Math.round((count/maxS)*100)}%`, transition: 'width 0.7s ease' }} />
                  </div>
                </div>
              ))}
            </div>
        }
      </div>

      {/* Stats por fuente */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {[
          { label: 'Landing pública', fuente: 'formulario', count: formulario, conv: convForm, color: '#0F7A63', bg: '#e3f1ec', icon: '🌐' },
          { label: 'Alta manual', fuente: 'manual', count: manual, conv: convManual, color: '#2b6fb0', bg: '#eaf3ff', icon: '✏️' },
        ].map(s => (
          <div key={s.fuente} style={{ ...card, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 14, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>{s.icon}</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{s.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                <span style={{ fontSize: 28, fontWeight: 800, color: '#16201d', letterSpacing: '-0.02em' }}>{s.count}</span>
                <span style={{ fontSize: 13, color: '#9aaba5' }}>leads</span>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.conv}%</div>
              <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 500 }}>conversión</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16 }}>
        {/* Leads recientes */}
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: 0 }}>Leads recientes</h2>
            <Link href="/panel/leads" style={{ fontSize: 12.5, color: '#0F7A63', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>Ver todos <ArrowUpRight size={12} /></Link>
          </div>
          {leads.length === 0
            ? <p style={{ color: '#9aaba5', fontSize: 14, margin: 0 }}>Sin leads en este período.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {leads.slice(0,5).map(l => (
                  <Link key={l.id} href={`/panel/leads/${l.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 12, textDecoration: 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fbf9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Avatar nombre={l.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9aaba5', marginTop: 1 }}>{limpiarInteres(l.interes) || '—'}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                      <TagPill tag={l.tag} />
                      <span style={{ fontSize: 11, color: '#c8d4ce' }}>{new Date(l.created_at).toLocaleDateString('es-ES', { day:'numeric', month:'short' })}</span>
                    </div>
                  </Link>
                ))}
              </div>
          }
        </div>

        {/* Tareas */}
        <div style={{ background: 'linear-gradient(145deg, #0a2f27 0%, #0F7A63 100%)', borderRadius: 18, padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Bell size={15} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: '#fff', margin: 0 }}>Tareas de hoy</h2>
              <p style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', margin: 0 }}>{new Date().toLocaleDateString('es-ES', { weekday:'long', day:'numeric', month:'long' })}</p>
            </div>
          </div>

          {tareasHoy.length === 0
            ? <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13.5, margin: 0 }}>Sin tareas pendientes hoy</p>
              </div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {tareasHoy.map(l => (
                  <Link key={l.id} href={`/panel/leads/${l.id}`}
                    style={{ display: 'block', padding: '12px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', textDecoration: 'none', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                      <Clock size={11} color="rgba(255,255,255,0.6)" />
                      <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Hoy</span>
                    </div>
                    <div style={{ fontSize: 13.5, fontWeight: 700, color: '#fff' }}>{l.nombre}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 }}>{l.recordatorio?.texto}</div>
                  </Link>
                ))}
              </div>
          }
        </div>
      </div>
    </div>
  )
}
