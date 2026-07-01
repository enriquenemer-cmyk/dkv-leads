'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { LeadModal } from '@/components/LeadModal'
import { Users, Flame, Trophy, TrendingUp, Bell, Plus, Download, ArrowUpRight, Clock } from 'lucide-react'

function exportCSV(leads: Lead[]) {
  const BOM = '﻿'
  const header = 'Nombre,Teléfono,Correo,Interés,Estado,Fuente,Fecha\n'
  const rows = leads.map(l =>
    [l.nombre, l.telefono ?? '', l.email ?? '', l.interes ?? '', l.tag, l.fuente,
     new Date(l.created_at).toLocaleDateString('es-ES')].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'leads-dkv.csv'; a.click()
}

const card = { background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', padding: '24px' }

export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('dash_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
  }

  const total = leads.length
  const calientes = leads.filter(l => l.tag === 'caliente').length
  const clientes = leads.filter(l => l.tag === 'cliente').length
  const conversion = total > 0 ? Math.round((clientes / total) * 100) : 0
  const hoy = new Date().toISOString().slice(0, 10)
  const tareasHoy = leads.filter(l => l.recordatorio?.fecha === hoy)
  const intereses: Record<string, number> = {}
  leads.forEach(l => { if (l.interes) intereses[l.interes] = (intereses[l.interes] ?? 0) + 1 })
  const maxI = Math.max(1, ...Object.values(intereses))

  const formulario = leads.filter(l => l.fuente === 'formulario').length
  const manual = leads.filter(l => l.fuente === 'manual').length
  const convForm = formulario > 0 ? Math.round((leads.filter(l => l.fuente === 'formulario' && l.tag === 'cliente').length / formulario) * 100) : 0
  const convManual = manual > 0 ? Math.round((leads.filter(l => l.fuente === 'manual' && l.tag === 'cliente').length / manual) * 100) : 0

  const METRICS = [
    { label: 'Total leads', value: total, sub: 'Captados', icon: Users, bg: '#eaf3ff', ic: '#2b6fb0', dot: '#2b6fb0' },
    { label: 'Leads calientes', value: calientes, sub: 'Prioridad alta', icon: Flame, bg: '#fef0ed', ic: '#c23a22', dot: '#c23a22' },
    { label: 'Clientes', value: clientes, sub: 'Conversión exitosa', icon: Trophy, bg: '#e3f1ec', ic: '#0F7A63', dot: '#0F7A63' },
    { label: 'Tasa de conversión', value: `${conversion}%`, sub: 'Total → Cliente', icon: TrendingUp, bg: '#f8efd9', ic: '#a8741a', dot: '#a8741a' },
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

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32 }}>
        <div>
          <p style={{ fontSize: 13, color: '#9aaba5', fontWeight: 500, margin: '0 0 4px' }}>{greeting}</p>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: 0, letterSpacing: '-0.02em' }}>Dashboard</h1>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => exportCSV(leads)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={14} /> Exportar CSV
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px -4px rgba(15,122,99,0.45)' }}>
            <Plus size={14} /> Nuevo lead
          </button>
        </div>
      </div>

      {/* Metric cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {METRICS.map(({ label, value, sub, icon: Icon, bg, ic }) => (
          <div key={label} style={{ ...card, padding: '22px 22px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={18} style={{ color: ic }} />
              </div>
              <ArrowUpRight size={14} style={{ color: '#c8d4ce' }} />
            </div>
            <div style={{ fontSize: 36, fontWeight: 800, color: '#16201d', lineHeight: 1, marginBottom: 4 }}>{value}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#16201d', marginBottom: 2 }}>{label}</div>
            <div style={{ fontSize: 12, color: '#9aaba5' }}>{sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Embudo */}
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px' }}>Embudo de conversión</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {EMBUDO.map(s => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, fontWeight: 600, color: '#6b7a76', marginBottom: 6 }}>
                  <span>{s.label}</span>
                  <span style={{ color: '#16201d' }}>{s.count} <span style={{ color: '#9aaba5', fontWeight: 400 }}>({s.pct}%)</span></span>
                </div>
                <div style={{ height: 8, borderRadius: 99, background: '#f0f4f1' }}>
                  <div style={{ height: 8, borderRadius: 99, background: s.color, width: `${s.pct}%`, transition: 'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interés */}
        <div style={card}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: '0 0 20px' }}>Interés por producto</h2>
          {Object.keys(intereses).length === 0
            ? <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 100, color: '#9aaba5', fontSize: 14 }}>Sin datos aún</div>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {Object.entries(intereses).sort((a,b) => b[1]-a[1]).map(([interes, count]) => (
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
          }
        </div>
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
            ? <p style={{ color: '#9aaba5', fontSize: 14, margin: 0 }}>Aún no hay leads.</p>
            : <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {leads.slice(0,5).map(l => (
                  <Link key={l.id} href={`/panel/leads/${l.id}`}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 10px', borderRadius: 12, textDecoration: 'none', transition: 'background 0.12s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#f8fbf9')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <Avatar nombre={l.nombre} size={38} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9aaba5', marginTop: 1 }}>{l.interes ?? '—'}</div>
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
