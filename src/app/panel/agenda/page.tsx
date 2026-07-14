'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead, leadSucursal } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { PageHero } from '@/components/PageHero'
import { CalendarCheck, AlertTriangle, Clock, Phone, MessageCircle, ChevronRight, Check } from 'lucide-react'

type Item = { lead: Lead; fecha: string; texto: string }

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatoFecha(f: string) {
  const [y, m, d] = f.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function AgendaPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('agenda_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').not('recordatorio', 'is', null).order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
    setLoading(false)
  }

  async function completar(lead: Lead) {
    setLeads(prev => prev.filter(l => l.id !== lead.id)) // respuesta optimista
    await supabase.from('leads').update({ recordatorio: null }).eq('id', lead.id)
    await logActividad('recordatorio_borrado', `Recordatorio completado: ${lead.nombre}`, { lead_id: lead.id, lead_nombre: lead.nombre })
  }

  const hoy = hoyISO()
  const items: Item[] = leads
    .filter(l => l.recordatorio?.fecha)
    .map(l => ({ lead: l, fecha: l.recordatorio!.fecha, texto: l.recordatorio!.texto }))
    .sort((a, b) => a.fecha.localeCompare(b.fecha))

  const vencidos = items.filter(i => i.fecha < hoy)
  const deHoy = items.filter(i => i.fecha === hoy)
  const proximos = items.filter(i => i.fecha > hoy)

  const secciones = [
    { key: 'vencidos', titulo: 'Vencidos', desc: 'Requieren atención urgente', items: vencidos, icon: AlertTriangle, color: '#c23a22', bg: '#fef0ed' },
    { key: 'hoy', titulo: 'Para hoy', desc: 'Contactos programados para hoy', items: deHoy, icon: CalendarCheck, color: '#0F7A63', bg: '#e3f1ec' },
    { key: 'proximos', titulo: 'Próximos', desc: 'Agenda de los próximos días', items: proximos, icon: Clock, color: '#a8741a', bg: '#f8efd9' },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
      <style>{`
        @keyframes agUp { from { opacity: 0; transform: translateY(12px) } to { opacity: 1; transform: translateY(0) } }
        .ag-item { animation: agUp 0.4s ease both; transition: box-shadow 0.18s ease, transform 0.18s ease }
        .ag-item:hover { box-shadow: 0 10px 24px -14px rgba(10,47,39,0.22); transform: translateX(2px) }
      `}</style>
      <PageHero title="Agenda" subtitle={`${vencidos.length > 0 ? `${vencidos.length} vencido${vencidos.length !== 1 ? 's' : ''} · ` : ''}${deHoy.length} para hoy · ${proximos.length} próximo${proximos.length !== 1 ? 's' : ''}`} />

      {loading ? <Loader label="Cargando agenda…" />
        : items.length === 0
          ? <EmptyState icon={CalendarCheck} title="No hay recordatorios" description="Programa recordatorios desde la ficha de cada lead y aparecerán aquí ordenados por fecha." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 26 }}>
              {secciones.filter(s => s.items.length > 0).map(sec => (
                <div key={sec.key}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 12 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 9, background: sec.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <sec.icon size={16} color={sec.color} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: 15, fontWeight: 700, color: '#16201d', margin: 0 }}>{sec.titulo} <span style={{ color: sec.color }}>({sec.items.length})</span></h2>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sec.items.map(it => {
                      const waNum = (it.lead.telefono ?? '').replace(/\D/g, '')
                      const suc = leadSucursal(it.lead)
                      return (
                        <div key={it.lead.id} className="ag-item" style={{ background: '#fff', border: `1px solid ${sec.key === 'vencidos' ? '#fbd4cb' : '#eaeeed'}`, borderLeft: `3px solid ${sec.color}`, borderRadius: 14, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 14 }}>
                          <Avatar nombre={it.lead.nombre} size={40} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                              <span style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d' }}>{it.lead.nombre}</span>
                              {suc && <span style={{ fontSize: 10, background: '#eef3f1', color: '#0F7A63', padding: '1px 7px', borderRadius: 999, fontWeight: 700 }}>📍 {suc}</span>}
                              <span style={{ fontSize: 11.5, fontWeight: 700, color: sec.color, background: sec.bg, padding: '1px 8px', borderRadius: 999 }}>{formatoFecha(it.fecha)}</span>
                            </div>
                            <div style={{ fontSize: 13, color: '#6b7a76', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.texto}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                            <button onClick={() => completar(it.lead)} title="Marcar como hecho" aria-label="Marcar recordatorio como hecho"
                              style={{ width: 34, height: 34, borderRadius: 9, background: '#e3f1ec', border: '1px solid #b6ddd0', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                              <Check size={16} color="#0F7A63" />
                            </button>
                            {it.lead.telefono && (
                              <>
                                <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" title="WhatsApp" aria-label="Abrir WhatsApp"
                                  style={{ width: 34, height: 34, borderRadius: 9, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <MessageCircle size={15} color="#fff" />
                                </a>
                                <a href={`tel:+${waNum}`} title="Llamar" aria-label="Llamar"
                                  style={{ width: 34, height: 34, borderRadius: 9, background: '#f0f4f1', border: '1px solid #e2e8e4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Phone size={15} color="#0F7A63" />
                                </a>
                              </>
                            )}
                            <Link href={`/panel/leads/${it.lead.id}`} title="Ver ficha" aria-label="Ver ficha del lead"
                              style={{ width: 34, height: 34, borderRadius: 9, background: '#0a2f27', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ChevronRight size={16} color="#fff" />
                            </Link>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}
