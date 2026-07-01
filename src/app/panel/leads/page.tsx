'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, Lead } from '@/lib/supabase'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { LeadModal } from '@/components/LeadModal'
import { Search, Plus, Download, ChevronRight, Phone, Mail } from 'lucide-react'

const TAGS_FILTRO = [
  { key: 'todos', label: 'Todos', color: '#6b7a76', bg: '#f0f4f1' },
  { key: 'caliente', label: '🔥 Calientes', color: '#c23a22', bg: '#fef0ed' },
  { key: 'tibio', label: '🌤 Tibios', color: '#a8741a', bg: '#f8efd9' },
  { key: 'frio', label: '❄️ Fríos', color: '#2b6fb0', bg: '#eaf3ff' },
  { key: 'cliente', label: '✓ Clientes', color: '#0F7A63', bg: '#e3f1ec' },
]

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

function LeadsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [filtroTag, setFiltroTag] = useState('todos')
  const [showModal, setShowModal] = useState(searchParams.get('modal') === 'nuevo')
  const [hovered, setHovered] = useState<string | null>(null)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('leads_lista')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
  }

  const filtered = leads
    .filter(l => filtroTag === 'todos' || l.tag === filtroTag)
    .filter(l => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q) || (l.telefono ?? '').includes(q)
    })
    .sort((a, b) => {
      if (orden === 'az') return a.nombre.localeCompare(b.nombre)
      if (orden === 'estado') return a.tag.localeCompare(b.tag)
      return 0
    })

  const counts: Record<string, number> = { todos: leads.length }
  leads.forEach(l => { counts[l.tag] = (counts[l.tag] ?? 0) + 1 })

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1120, margin: '0 auto' }}>
      {showModal && <LeadModal onClose={() => { setShowModal(false); router.replace('/panel/leads') }} onSaved={() => { setShowModal(false); router.replace('/panel/leads'); fetchLeads() }} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Leads</h1>
          <p style={{ fontSize: 13.5, color: '#9aaba5', margin: 0 }}>{leads.length} lead{leads.length !== 1 ? 's' : ''} en total · {filtered.length} mostrados</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => exportCSV(filtered)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Download size={14} /> Exportar
          </button>
          <button onClick={() => setShowModal(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px -4px rgba(15,122,99,0.45)' }}>
            <Plus size={14} /> Nuevo lead
          </button>
        </div>
      </div>

      {/* Filters bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo o teléfono…"
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={orden} onChange={e => setOrden(e.target.value)}
          style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="recientes">Más recientes</option>
          <option value="az">Nombre A–Z</option>
          <option value="estado">Por estado</option>
        </select>
      </div>

      {/* Tag chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {TAGS_FILTRO.map(t => {
          const active = filtroTag === t.key
          return (
            <button key={t.key} onClick={() => setFiltroTag(t.key)}
              style={{
                padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', fontFamily: 'inherit',
                background: active ? t.color : '#fff',
                color: active ? '#fff' : '#6b7a76',
                boxShadow: active ? `0 2px 8px -2px ${t.color}55` : '0 1px 3px rgba(0,0,0,0.06)',
                transition: 'all 0.15s',
              }}>
              {t.label} {counts[t.key] !== undefined && <span style={{ opacity: 0.75, marginLeft: 3 }}>({counts[t.key] ?? 0})</span>}
            </button>
          )
        })}
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', overflow: 'hidden' }}>
        {/* Header row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 0.8fr 40px', padding: '12px 20px', background: '#f8fbf9', borderBottom: '1px solid #eaeeed' }}>
          {['Contacto', 'Teléfono', 'Interés', 'Estado', 'Fecha', ''].map(h => (
            <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0
          ? <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
              <p style={{ color: '#9aaba5', fontSize: 14, fontWeight: 500, margin: 0 }}>No hay leads que coincidan con la búsqueda</p>
            </div>
          : filtered.map(l => (
            <Link key={l.id} href={`/panel/leads/${l.id}`}
              style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 0.8fr 40px',
                padding: '14px 20px', textDecoration: 'none', borderBottom: '1px solid #f5f7f5',
                background: hovered === l.id ? '#f8fbf9' : '#fff', transition: 'background 0.1s', alignItems: 'center',
              }}
              onMouseEnter={() => setHovered(l.id)}
              onMouseLeave={() => setHovered(null)}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar nombre={l.nombre} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                  {l.email && <div style={{ fontSize: 12, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                    <Mail size={10} style={{ flexShrink: 0 }} />{l.email}
                  </div>}
                </div>
              </div>

              <div style={{ fontSize: 13.5, color: '#48574f', display: 'flex', alignItems: 'center', gap: 4 }}>
                {l.telefono ? <><Phone size={11} style={{ color: '#9aaba5' }} /> {l.telefono}</> : <span style={{ color: '#c8d4ce' }}>—</span>}
              </div>

              <div style={{ fontSize: 13, color: '#6b7a76', fontWeight: 500 }}>{l.interes ?? <span style={{ color: '#c8d4ce' }}>—</span>}</div>

              <TagPill tag={l.tag} />

              <div style={{ fontSize: 12, color: '#9aaba5' }}>{new Date(l.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}</div>

              <ChevronRight size={15} style={{ color: '#c8d4ce' }} />
            </Link>
          ))
        }
      </div>

      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#c8d4ce', marginTop: 16 }}>
          Mostrando {filtered.length} de {leads.length} leads
        </p>
      )}
    </div>
  )
}

export default function LeadsPage() {
  return <Suspense><LeadsContent /></Suspense>
}
