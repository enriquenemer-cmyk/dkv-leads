'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Lead } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { TagPill } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { Phone, Mail, MessageCircle, Plus } from 'lucide-react'
import { LeadModal } from '@/components/LeadModal'

const COLS = [
  { key: 'frio',     label: '❄️ Frío',     color: '#2b6fb0', bg: '#eaf3ff', border: '#bcd5f5' },
  { key: 'tibio',    label: '🌤 Tibio',    color: '#a8741a', bg: '#fef8ec', border: '#f0d9a0' },
  { key: 'caliente', label: '🔥 Caliente', color: '#c23a22', bg: '#fef0ed', border: '#fbd4cb' },
  { key: 'cliente',  label: '✓ Cliente',  color: '#0F7A63', bg: '#e3f1ec', border: '#b6ddd0' },
] as const

type Tag = typeof COLS[number]['key']

export default function KanbanPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<Tag | null>(null)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('kanban_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
  }

  async function moveToCol(leadId: string, tag: Tag) {
    const lead = leads.find(l => l.id === leadId)
    if (!lead || lead.tag === tag) return
    await supabase.from('leads').update({ tag }).eq('id', leadId)
    await logActividad('lead_tag', `Etiqueta cambiada a "${tag}" en ${lead.nombre}`, { lead_id: leadId, lead_nombre: lead.nombre })
    setLeads(prev => prev.map(l => l.id === leadId ? { ...l, tag } : l))
  }

  function onDragStart(e: React.DragEvent, id: string) {
    setDragging(id)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragOver(e: React.DragEvent, col: Tag) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(col)
  }

  function onDrop(e: React.DragEvent, col: Tag) {
    e.preventDefault()
    if (dragging) moveToCol(dragging, col)
    setDragging(null); setDragOver(null)
  }

  const byTag = (tag: Tag) => leads.filter(l => l.tag === tag)

  return (
    <div style={{ padding: '28px 28px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {showModal && <LeadModal onClose={() => setShowModal(false)} onSaved={() => { setShowModal(false); fetchLeads() }} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Kanban</h1>
          <p style={{ fontSize: 13.5, color: '#9aaba5', margin: 0 }}>Arrastra los leads entre columnas para cambiar su estado · {leads.length} leads</p>
        </div>
        <button onClick={() => setShowModal(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: 'none', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 4px 14px -4px rgba(15,122,99,0.45)' }}>
          <Plus size={14} /> Nuevo lead
        </button>
      </div>

      {/* Board */}
      <style>{`
        @media(max-width:820px){.kanban-board{grid-template-columns:repeat(4,minmax(240px,1fr))!important;overflow-x:auto;padding-bottom:8px;-webkit-overflow-scrolling:touch}}
        .kanban-card:hover{transform:translateY(-2px);box-shadow:0 10px 22px -8px rgba(16,32,29,0.22)!important}
      `}</style>
      <div className="kanban-board" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, flex: 1, alignItems: 'start' }}>
        {COLS.map(col => {
          const colLeads = byTag(col.key)
          const isDragTarget = dragOver === col.key
          return (
            <div key={col.key}
              onDragOver={e => onDragOver(e, col.key)}
              onDragLeave={() => setDragOver(null)}
              onDrop={e => onDrop(e, col.key)}
              style={{ borderRadius: 16, background: isDragTarget ? col.bg : '#f4f7f5', border: `2px dashed ${isDragTarget ? col.border : 'transparent'}`, padding: 12, minHeight: 400, transition: 'all 0.15s' }}>

              {/* Column header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '2px 4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <span style={{ fontSize: 13.5, fontWeight: 700, color: col.color }}>{col.label}</span>
                </div>
                <span style={{ fontSize: 12, fontWeight: 700, color: col.color, background: col.bg, border: `1px solid ${col.border}`, padding: '2px 9px', borderRadius: 999 }}>{colLeads.length}</span>
              </div>

              {/* Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {colLeads.map(lead => (
                  <KanbanCard key={lead.id} lead={lead} dragging={dragging === lead.id}
                    onDragStart={e => onDragStart(e, lead.id)}
                    onDragEnd={() => { setDragging(null); setDragOver(null) }}
                    onClick={() => router.push(`/panel/leads/${lead.id}`)} />
                ))}

                {colLeads.length === 0 && !isDragTarget && (
                  <div style={{ padding: '24px 12px', textAlign: 'center', color: '#c8d4ce', fontSize: 13, fontStyle: 'italic' }}>
                    Arrastra leads aquí
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({ lead, dragging, onDragStart, onDragEnd, onClick }: {
  lead: Lead; dragging: boolean
  onDragStart: (e: React.DragEvent) => void
  onDragEnd: () => void
  onClick: () => void
}) {
  const waNum = (lead.telefono ?? '').replace(/\D/g, '')

  return (
    <div draggable className="kanban-card"
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: '#fff', borderRadius: 13, padding: '14px 14px 12px', border: '1px solid #edf1ef',
        cursor: 'grab', opacity: dragging ? 0.45 : 1, transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        boxShadow: dragging ? 'none' : '0 1px 2px rgba(16,32,29,0.04), 0 6px 16px -10px rgba(16,32,29,0.16)',
      }}>

      {/* Name + avatar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
        <Avatar nombre={lead.nombre} size={32} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.nombre}</div>
          {lead.interes && <div style={{ fontSize: 11.5, color: '#9aaba5', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.interes}</div>}
        </div>
      </div>

      {/* Contact info */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 12 }}>
        {lead.telefono && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Phone size={10} color="#9aaba5" />
            <span style={{ fontSize: 11.5, color: '#6b7a76' }}>{lead.telefono}</span>
          </div>
        )}
        {lead.email && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Mail size={10} color="#9aaba5" />
            <span style={{ fontSize: 11.5, color: '#6b7a76', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.email}</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 11, color: '#b0bdb8' }}>
          {new Date(lead.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
        </span>
        <div style={{ display: 'flex', gap: 4 }}>
          {waNum && (
            <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}
              style={{ width: 26, height: 26, borderRadius: 8, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <MessageCircle size={12} color="#fff" />
            </a>
          )}
          <button onClick={onClick}
            style={{ fontSize: 11, fontWeight: 600, color: '#0F7A63', background: '#e3f1ec', border: 'none', padding: '4px 10px', borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit' }}>
            Ver →
          </button>
        </div>
      </div>

      {lead.recordatorio && (
        <div style={{ marginTop: 8, padding: '6px 9px', borderRadius: 8, background: '#fef8ec', border: '1px solid #f0d9a0', fontSize: 11, color: '#a8741a', fontWeight: 600 }}>
          🔔 {lead.recordatorio.fecha} — {lead.recordatorio.texto?.slice(0, 40)}
        </div>
      )}
    </div>
  )
}
