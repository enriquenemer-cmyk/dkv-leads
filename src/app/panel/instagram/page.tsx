'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead, fuenteOrigen } from '@/lib/supabase'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { LeadModal } from '@/components/LeadModal'
import { exportCSV } from '@/lib/export'
import { limpiarInteres } from '@/lib/interes'
import { geoDeLead } from '@/lib/provincia'
import { IgIcon } from '@/components/IgIcon'
import { Search, Download, ChevronRight, Phone, Mail, Plus } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

// Degradado oficial de Instagram (para la cabecera).
const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #C13584 30%, #E1306C 55%, #FD1D1D 78%, #F77737 100%)'

const TAGS_FILTRO = [
  { key: 'todos', label: 'Todos', color: '#6b7a76' },
  { key: 'caliente', label: '🔥 Calientes', color: '#c23a22' },
  { key: 'tibio', label: '🌤 Tibios', color: '#a8741a' },
  { key: 'frio', label: '❄️ Fríos', color: '#2b6fb0' },
  { key: 'cliente', label: '✓ Clientes', color: '#0F7A63' },
]

function rangoPeriodo(p: string): { desde: Date | null; hasta: Date | null } {
  const now = new Date()
  const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  if (p === 'hoy') return { desde: inicioHoy, hasta: null }
  if (p === '7d') { const d = new Date(inicioHoy); d.setDate(d.getDate() - 6); return { desde: d, hasta: null } }
  if (p === '30d') { const d = new Date(inicioHoy); d.setDate(d.getDate() - 29); return { desde: d, hasta: null } }
  return { desde: null, hasta: null }
}

function formatoEntrada(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const inicioHoy = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const hora = d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (d >= inicioHoy) return `Hoy ${hora}`
  const inicioAyer = new Date(inicioHoy); inicioAyer.setDate(inicioAyer.getDate() - 1)
  if (d >= inicioAyer) return `Ayer ${hora}`
  return `${d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} ${hora}`
}

export default function InstagramLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [busqueda, setBusqueda] = useState('')
  const [periodo, setPeriodo] = useState('todos')
  const [filtroTag, setFiltroTag] = useState('todos')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('leads_instagram')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    // Solo leads captados desde Instagram (los inserta el webhook de Meta con fuente = 'instagram').
    if (data) setLeads((data as Lead[]).filter(l => fuenteOrigen(l.fuente) === 'instagram'))
    setLoading(false)
  }

  const filtered = leads
    .filter(l => filtroTag === 'todos' || l.tag === filtroTag)
    .filter(l => {
      if (periodo === 'todos') return true
      const { desde, hasta } = rangoPeriodo(periodo)
      const t = new Date(l.created_at)
      if (desde && t < desde) return false
      if (hasta && t >= hasta) return false
      return true
    })
    .filter(l => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q) || (l.telefono ?? '').includes(q) || (l.interes ?? '').toLowerCase().includes(q)
    })

  const counts: Record<string, number> = { todos: leads.length }
  leads.forEach(l => { counts[l.tag] = (counts[l.tag] ?? 0) + 1 })

  const inicioHoy = new Date(); inicioHoy.setHours(0, 0, 0, 0)
  const hoyCount = leads.filter(l => new Date(l.created_at) >= inicioHoy).length

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1120, margin: '0 auto' }}>
      {showModal && (
        <LeadModal
          fuenteInicial="instagram"
          titulo="Nuevo lead de Instagram"
          onClose={() => setShowModal(false)}
          onSaved={() => { setShowModal(false); fetchLeads() }}
        />
      )}

      {/* Cabecera con identidad Instagram */}
      <div style={{ position: 'relative', overflow: 'hidden', background: IG_GRADIENT, borderRadius: 22, padding: '26px 30px', marginBottom: 24, boxShadow: '0 16px 44px -20px rgba(193,53,132,0.55)' }}>
        <div style={{ position: 'absolute', top: -90, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <IgIcon size={27} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.82)', fontWeight: 500, margin: '0 0 3px' }}>Leads captados desde tus anuncios y formularios de Instagram</p>
              <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Leads de Instagram</h1>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{leads.length}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>en total</div>
            </div>
            <div style={{ width: 1, height: 34, background: 'rgba(255,255,255,0.25)' }} />
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', lineHeight: 1 }}>{hoyCount}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.75)', fontWeight: 600, marginTop: 3 }}>hoy</div>
            </div>
          </div>
        </div>
      </div>

      {/* Barra de filtros */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 260, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o interés…"
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={periodo} onChange={e => setPeriodo(e.target.value)}
          style={{ padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${periodo !== 'todos' ? '#C13584' : '#e2e8e4'}`, background: periodo !== 'todos' ? '#fdeef6' : '#fff', color: periodo !== 'todos' ? '#C13584' : '#16201d', fontWeight: periodo !== 'todos' ? 700 : 400, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="todos">📅 Cualquier fecha</option>
          <option value="hoy">📅 Hoy{hoyCount > 0 ? ` (${hoyCount})` : ''}</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
        </select>
        <button onClick={() => exportCSV(filtered)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
          <Download size={14} /> Exportar
        </button>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 18px', borderRadius: 12, border: 'none', background: IG_GRADIENT, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px -4px rgba(193,53,132,0.5)' }}>
          <Plus size={14} /> Nuevo lead de Instagram
        </button>
      </div>

      {/* Chips de estado */}
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

      {/* Tabla */}
      <style>{`@media(max-width:720px){.ig-table{min-width:640px}}`}</style>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 18 }}>
      <div className="ig-table" style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 40px', padding: '12px 20px', background: '#fdeef6', borderBottom: '1px solid #f6dcea' }}>
          {['Contacto', 'Teléfono', 'Interés', 'Estado', ''].map(h => (
            <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#b3608e', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {loading
          ? <div style={{ padding: '48px 20px', textAlign: 'center', color: '#9aaba5', fontSize: 14 }}>Cargando…</div>
          : filtered.length === 0
          ? <EmptyState icon={IgIcon as unknown as LucideIcon} title={leads.length === 0 ? 'Aún no hay leads de Instagram' : 'Sin resultados'}
              description={leads.length === 0
                ? 'Los leads de tus anuncios de Instagram aparecen aquí automáticamente. También puedes añadir uno a mano si te escriben por mensaje directo.'
                : 'No hay leads de Instagram que coincidan con los filtros. Prueba a cambiar la búsqueda o el estado.'}
              action={leads.length === 0 ? (
                <button onClick={() => setShowModal(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: IG_GRADIENT, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px -4px rgba(193,53,132,0.5)' }}>
                  <Plus size={14} /> Añadir lead de Instagram
                </button>
              ) : undefined} />
          : filtered.map(l => (
            <Link key={l.id} href={`/panel/leads/${l.id}`}
              style={{
                display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 40px',
                padding: '14px 20px', textDecoration: 'none', borderBottom: '1px solid #f5f7f5',
                background: '#fff', transition: 'background 0.1s', alignItems: 'center',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#fdf6fa')}
              onMouseLeave={e => (e.currentTarget.style.background = '#fff')}>

              <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                <Avatar nombre={l.nombre} size={38} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {l.nombre}
                    <span title="Lead de Instagram" style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 10, background: IG_GRADIENT, color: '#fff', padding: '1px 7px', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>
                      <IgIcon size={9} /> IG
                    </span>
                    {l.recordatorio && <span title="Tiene recordatorio" style={{ fontSize: 10, background: '#f8efd9', color: '#a8741a', padding: '1px 6px', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>📅</span>}
                  </div>
                  {l.email && <div style={{ fontSize: 12, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 3, marginTop: 1 }}>
                    <Mail size={10} style={{ flexShrink: 0 }} />{l.email}
                  </div>}
                  {geoDeLead(l).provincia && <div style={{ fontSize: 11.5, color: '#9aaba5', marginTop: 1 }}>📍 {geoDeLead(l).provincia}</div>}
                  <div style={{ fontSize: 11.5, color: '#9aaba5', marginTop: 1 }}>🕒 {formatoEntrada(l.created_at)}</div>
                </div>
              </div>

              <div style={{ fontSize: 13.5, color: '#48574f', display: 'flex', alignItems: 'center', gap: 4 }}>
                {l.telefono ? <><Phone size={11} style={{ color: '#9aaba5' }} /> {l.telefono}</> : <span style={{ color: '#c8d4ce' }}>—</span>}
              </div>

              <div style={{ fontSize: 13, color: '#6b7a76', fontWeight: 500 }}>{limpiarInteres(l.interes) || <span style={{ color: '#c8d4ce' }}>—</span>}</div>

              <TagPill tag={l.tag} />

              <ChevronRight size={15} style={{ color: '#c8d4ce' }} />
            </Link>
          ))
        }
      </div>
      </div>

      {filtered.length > 0 && (
        <p style={{ textAlign: 'center', fontSize: 12.5, color: '#c8d4ce', marginTop: 16 }}>
          Mostrando {filtered.length} de {leads.length} leads de Instagram
        </p>
      )}
    </div>
  )
}
