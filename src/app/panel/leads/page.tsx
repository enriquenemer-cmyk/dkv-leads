'use client'
import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import { supabase, Lead, SUCURSALES, leadSucursal, fuenteOrigen } from '@/lib/supabase'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { LeadModal } from '@/components/LeadModal'
import { EmptyState } from '@/components/EmptyState'
import { exportCSV } from '@/lib/export'
import { Search, Plus, Download, ChevronRight, Phone, Mail, Filter, X } from 'lucide-react'

const TAGS_FILTRO = [
  { key: 'todos', label: 'Todos', color: '#6b7a76', bg: '#f0f4f1' },
  { key: 'caliente', label: '🔥 Calientes', color: '#c23a22', bg: '#fef0ed' },
  { key: 'tibio', label: '🌤 Tibios', color: '#a8741a', bg: '#f8efd9' },
  { key: 'frio', label: '❄️ Fríos', color: '#2b6fb0', bg: '#eaf3ff' },
  { key: 'cliente', label: '✓ Clientes', color: '#0F7A63', bg: '#e3f1ec' },
]

function LeadsContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [busqueda, setBusqueda] = useState('')
  const [orden, setOrden] = useState('recientes')
  const [filtroTag, setFiltroTag] = useState('todos')
  const [filtroSucursal, setFiltroSucursal] = useState('todos')
  const [filtroFuente, setFiltroFuente] = useState('todos')
  const [filtroRecordatorio, setFiltroRecordatorio] = useState(false)
  const [filtroSinAtender, setFiltroSinAtender] = useState(false)
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [showFiltros, setShowFiltros] = useState(false)
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

  function clearFiltros() {
    setFiltroFuente('todos'); setFiltroRecordatorio(false); setFiltroSinAtender(false); setFechaDesde(''); setFechaHasta('')
  }

  const hasExtraFiltros = filtroFuente !== 'todos' || filtroRecordatorio || filtroSinAtender || fechaDesde || fechaHasta

  const filtered = leads
    .filter(l => filtroTag === 'todos' || l.tag === filtroTag)
    .filter(l => filtroSucursal === 'todos' || (leadSucursal(l) ?? '') === filtroSucursal)
    .filter(l => filtroFuente === 'todos' || fuenteOrigen(l.fuente) === filtroFuente)
    .filter(l => !filtroRecordatorio || !!l.recordatorio)
    .filter(l => !filtroSinAtender || (l.tag === 'frio' && (!l.notas || l.notas.length === 0)))
    .filter(l => {
      if (!fechaDesde) return true
      return new Date(l.created_at) >= new Date(fechaDesde)
    })
    .filter(l => {
      if (!fechaHasta) return true
      const hasta = new Date(fechaHasta); hasta.setDate(hasta.getDate() + 1)
      return new Date(l.created_at) < hasta
    })
    .filter(l => {
      if (!busqueda) return true
      const q = busqueda.toLowerCase()
      return l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q) || (l.telefono ?? '').includes(q) || (l.interes ?? '').toLowerCase().includes(q) || (leadSucursal(l) ?? '').toLowerCase().includes(q)
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
      <div style={{ display: 'flex', gap: 10, marginBottom: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 280, position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
          <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
            placeholder="Buscar por nombre, correo, teléfono o interés…"
            style={{ width: '100%', padding: '11px 14px 11px 40px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        </div>
        <select value={filtroSucursal} onChange={e => setFiltroSucursal(e.target.value)}
          style={{ padding: '11px 14px', borderRadius: 12, border: `1.5px solid ${filtroSucursal !== 'todos' ? '#0F7A63' : '#e2e8e4'}`, background: filtroSucursal !== 'todos' ? '#e3f1ec' : '#fff', color: filtroSucursal !== 'todos' ? '#0F7A63' : '#16201d', fontWeight: filtroSucursal !== 'todos' ? 700 : 400, fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="todos">📍 Todas las sucursales</option>
          {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
          <option value="">Sin asignar</option>
        </select>
        <select value={orden} onChange={e => setOrden(e.target.value)}
          style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
          <option value="recientes">Más recientes</option>
          <option value="az">Nombre A–Z</option>
          <option value="estado">Por estado</option>
        </select>
        <button onClick={() => setShowFiltros(v => !v)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 12, border: `1.5px solid ${showFiltros || hasExtraFiltros ? '#0F7A63' : '#e2e8e4'}`, background: showFiltros || hasExtraFiltros ? '#e3f1ec' : '#fff', color: showFiltros || hasExtraFiltros ? '#0F7A63' : '#6b7a76', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', position: 'relative' }}>
          <Filter size={14} /> Filtros avanzados
          {hasExtraFiltros && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#0F7A63', position: 'absolute', top: 8, right: 8 }} />}
        </button>
      </div>

      {/* Filtros avanzados panel */}
      {showFiltros && (
        <div style={{ background: '#fff', border: '1.5px solid #e2e8e4', borderRadius: 14, padding: '18px 20px', marginBottom: 14, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaba5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fuente</label>
            <select value={filtroFuente} onChange={e => setFiltroFuente(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 13.5, outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
              <option value="todos">Todos</option>
              <option value="formulario">Formulario (landing)</option>
              <option value="manual">Alta manual</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaba5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha desde</label>
            <input type="date" value={fechaDesde} onChange={e => setFechaDesde(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaba5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Fecha hasta</label>
            <input type="date" value={fechaHasta} onChange={e => setFechaHasta(e.target.value)}
              style={{ padding: '9px 12px', borderRadius: 10, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 13.5, outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaba5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Con recordatorio</label>
            <button onClick={() => setFiltroRecordatorio(v => !v)}
              style={{ padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${filtroRecordatorio ? '#0F7A63' : '#e2e8e4'}`, background: filtroRecordatorio ? '#e3f1ec' : '#f8fbf9', color: filtroRecordatorio ? '#0F7A63' : '#6b7a76', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {filtroRecordatorio ? '✓ Activado' : 'Solo con recordatorio'}
            </button>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#9aaba5', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Sin atender</label>
            <button onClick={() => setFiltroSinAtender(v => !v)}
              style={{ padding: '9px 14px', borderRadius: 10, border: `1.5px solid ${filtroSinAtender ? '#c23a22' : '#e2e8e4'}`, background: filtroSinAtender ? '#fef0ed' : '#f8fbf9', color: filtroSinAtender ? '#c23a22' : '#6b7a76', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              {filtroSinAtender ? '✓ Fríos sin nota' : 'Fríos sin nota'}
            </button>
          </div>
          {hasExtraFiltros && (
            <button onClick={clearFiltros}
              style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 12px', borderRadius: 10, border: 'none', background: '#fef0ed', color: '#c23a22', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <X size={13} /> Limpiar filtros
            </button>
          )}
        </div>
      )}

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
      <style>{`@media(max-width:720px){.leads-table{min-width:640px}}`}</style>
      <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch', borderRadius: 18 }}>
      <div className="leads-table" style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '2.2fr 1.3fr 1.3fr 1fr 0.8fr 40px', padding: '12px 20px', background: '#f8fbf9', borderBottom: '1px solid #eaeeed' }}>
          {['Contacto', 'Teléfono', 'Interés', 'Estado', 'Fecha', ''].map(h => (
            <span key={h} style={{ fontSize: 11.5, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</span>
          ))}
        </div>

        {filtered.length === 0
          ? <EmptyState icon={Search} title="Sin resultados"
              description={leads.length === 0 ? 'Aún no tienes ningún lead. Cuando alguien rellene el formulario o crees uno manualmente, aparecerá aquí.' : 'No hay leads que coincidan con los filtros aplicados. Prueba a cambiar la búsqueda o el estado.'} />
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
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>
                    {l.nombre}
                    {l.recordatorio && <span title="Tiene recordatorio" style={{ fontSize: 10, background: '#f8efd9', color: '#a8741a', padding: '1px 6px', borderRadius: 999, fontWeight: 700, flexShrink: 0 }}>📅</span>}
                    {leadSucursal(l) && <span title={`Sucursal: ${leadSucursal(l)}`} style={{ fontSize: 10, background: '#eef3f1', color: '#0F7A63', padding: '1px 7px', borderRadius: 999, fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}>📍 {leadSucursal(l)}</span>}
                    {(l.wallet_guardada || (l.wallet_sellos ?? 0) > 0) && (() => {
                      const n = l.wallet_sellos ?? 0, premio = n >= 3
                      return <span title={premio ? 'Club Sonrisa: ¡premio desbloqueado!' : `Club Sonrisa: ${n}/3 sellos`}
                        style={{ fontSize: 10, background: premio ? '#f8efd9' : '#e3f1ec', color: premio ? '#a8741a' : '#0F7A63', padding: '1px 7px', borderRadius: 999, fontWeight: 700, flexShrink: 0, display: 'inline-flex', alignItems: 'center', gap: 2 }}>🦷 {n}/3</span>
                    })()}
                  </div>
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
