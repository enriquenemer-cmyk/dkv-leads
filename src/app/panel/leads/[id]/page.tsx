'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase, Lead, leadSucursal, fuenteOrigen } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { TagPill, TAG_STYLES } from '@/components/TagPill'
import { Avatar } from '@/components/Avatar'
import { LeadModal } from '@/components/LeadModal'
import { ArrowLeft, MessageCircle, Mail, Phone, Bell, X, Plus, Calendar, Edit3, ExternalLink, Printer, ChevronDown } from 'lucide-react'

const TAGS = ['caliente', 'tibio', 'frio', 'cliente'] as const
const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

function buildWaTemplates(nombre: string, interes: string | null) {
  const nombre1 = nombre.split(' ')[0]
  const prod = interes ?? 'nuestros seguros'
  return [
    {
      label: '👋 Primer contacto',
      text: `Hola ${nombre1}, soy tu asesor de DKV Seguros. Me pongo en contacto porque solicitaste información sobre ${prod}. ¿Tienes un momento para hablar? Estaré encantado de ayudarte a encontrar la mejor cobertura.`,
    },
    {
      label: '📋 Seguimiento',
      text: `Hola ${nombre1}, ¿cómo estás? Te escribo porque hablamos hace unos días sobre ${prod}. Quería saber si sigues interesado/a y si tienes alguna duda que pueda resolver. Estoy a tu disposición.`,
    },
    {
      label: '🎯 Propuesta personalizada',
      text: `Hola ${nombre1}, he preparado una propuesta personalizada de ${prod} que creo que te va a interesar. ¿Podríamos hablar 10 minutos para repasarla juntos?`,
    },
    {
      label: '✅ Cierre',
      text: `Hola ${nombre1}, te escribo para confirmar los detalles de tu póliza de ${prod}. Todo está listo, solo necesitamos tu confirmación. ¿Cuándo puedes firmar?`,
    },
  ]
}

export default function LeadDetallePage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [lead, setLead] = useState<Lead | null>(null)
  const [editModal, setEditModal] = useState(false)
  const [notaText, setNotaText] = useState('')
  const [recTexto, setRecTexto] = useState('')
  const [recFecha, setRecFecha] = useState('')
  const [waOpen, setWaOpen] = useState(false)
  const [waCopied, setWaCopied] = useState<number | null>(null)
  const [historial, setHistorial] = useState<Array<{ id: string; tipo: string; descripcion: string; usuario_email: string | null; created_at: string }>>([])

  useEffect(() => { fetchLead(); fetchHistorial() }, [id])

  async function fetchLead() {
    const { data } = await supabase.from('leads').select('*').eq('id', id).single()
    if (data) setLead(data as Lead); else router.push('/panel/leads')
  }

  async function fetchHistorial() {
    const { data } = await supabase.from('actividad').select('id,tipo,descripcion,usuario_email,created_at').eq('lead_id', id).order('created_at', { ascending: false }).limit(50)
    if (data) setHistorial(data)
  }

  async function updateTag(tag: string) {
    await supabase.from('leads').update({ tag }).eq('id', id)
    await logActividad('lead_tag', `Etiqueta cambiada a "${tag}" en ${lead?.nombre}`, { lead_id: id, lead_nombre: lead?.nombre })
    fetchLead(); fetchHistorial()
  }

  async function addNota() {
    if (!notaText.trim() || !lead) return
    const nuevas = [{ text: notaText.trim(), when: new Date().toISOString() }, ...(lead.notas ?? [])]
    await supabase.from('leads').update({ notas: nuevas }).eq('id', id)
    await logActividad('nota_agregada', `Nota añadida a ${lead.nombre}: "${notaText.trim().slice(0, 60)}"`, { lead_id: id, lead_nombre: lead.nombre })
    setNotaText(''); fetchLead(); fetchHistorial()
  }

  async function saveRecordatorio() {
    if (!recTexto.trim() || !recFecha) return
    await supabase.from('leads').update({ recordatorio: { texto: recTexto.trim(), fecha: recFecha } }).eq('id', id)
    await logActividad('recordatorio_set', `Recordatorio programado para ${lead?.nombre} el ${recFecha}`, { lead_id: id, lead_nombre: lead?.nombre })
    setRecTexto(''); setRecFecha(''); fetchLead(); fetchHistorial()
  }

  async function borrarRecordatorio() {
    await supabase.from('leads').update({ recordatorio: null }).eq('id', id)
    await logActividad('recordatorio_borrado', `Recordatorio eliminado de ${lead?.nombre}`, { lead_id: id, lead_nombre: lead?.nombre })
    fetchLead(); fetchHistorial()
  }

  function copyTemplate(text: string, idx: number) {
    navigator.clipboard.writeText(text)
    setWaCopied(idx)
    setTimeout(() => setWaCopied(null), 2000)
  }

  if (!lead) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <div style={{ color: '#9aaba5', fontSize: 14 }}>Cargando lead…</div>
    </div>
  )

  const waNum = (lead.telefono ?? '').replace(/\D/g, '')
  const templates = buildWaTemplates(lead.nombre, lead.interes)

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #lead-print, #lead-print * { visibility: visible !important; }
          #lead-print { position: absolute; left: 0; top: 0; width: 100%; padding: 40px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div style={{ padding: '32px 36px', maxWidth: 1040, margin: '0 auto' }}>
        {editModal && <LeadModal lead={lead} onClose={() => setEditModal(false)} onSaved={() => { setEditModal(false); fetchLead() }} />}

        {/* Back */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }} className="no-print">
          <Link href="/panel/leads"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13.5, fontWeight: 600, color: '#6b7a76', textDecoration: 'none' }}>
            <ArrowLeft size={14} /> Volver a leads
          </Link>
          <button onClick={() => window.print()}
            style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 11, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <Printer size={14} /> Imprimir ficha
          </button>
        </div>

        <div id="lead-print">
          {/* Hero card */}
          <div style={{ ...card, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 20, padding: '28px 28px' }}>
            <Avatar nombre={lead.nombre} size={64} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
                <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: 0, letterSpacing: '-0.02em' }}>{lead.nombre}</h1>
                <TagPill tag={lead.tag} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, color: '#9aaba5', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ExternalLink size={11} /> {fuenteOrigen(lead.fuente) === 'formulario' ? 'Formulario público' : 'Alta manual'}
                </span>
                <span style={{ fontSize: 13, color: '#9aaba5', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Calendar size={11} /> {new Date(lead.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
              </div>
            </div>
            <button onClick={() => setEditModal(true)} className="no-print"
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
              <Edit3 size={14} /> Editar datos
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Col left */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Datos de contacto */}
              <div style={card}>
                <h2 style={{ fontWeight: 700, margin: '0 0 18px', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: 11.5, color: '#9aaba5' }}>Datos de contacto</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {lead.telefono && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Phone size={15} style={{ color: '#0F7A63' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600 }}>Teléfono</div>
                        <div style={{ fontSize: 14.5, color: '#16201d', fontWeight: 600 }}>{lead.telefono}</div>
                      </div>
                    </div>
                  )}
                  {lead.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Mail size={15} style={{ color: '#0F7A63' }} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600 }}>Correo</div>
                        <div style={{ fontSize: 14.5, color: '#16201d', fontWeight: 600 }}>{lead.email}</div>
                      </div>
                    </div>
                  )}
                  {lead.interes && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>🛡️</div>
                      <div>
                        <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600 }}>Interés</div>
                        <div style={{ fontSize: 14.5, color: '#16201d', fontWeight: 600 }}>{lead.interes}</div>
                      </div>
                    </div>
                  )}
                  {leadSucursal(lead) && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eef3f1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📍</div>
                      <div>
                        <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600 }}>Sucursal</div>
                        <div style={{ fontSize: 14.5, color: '#0F7A63', fontWeight: 700 }}>{leadSucursal(lead)}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Acciones rápidas + Plantillas WhatsApp */}
              <div style={card} className="no-print">
                <h2 style={{ fontSize: 11.5, fontWeight: 700, color: '#9aaba5', margin: '0 0 16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Contactar ahora</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {lead.telefono && (
                    <div>
                      <button onClick={() => setWaOpen(v => !v)}
                        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 13, background: '#25D366', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700, fontSize: 14, color: '#fff', textAlign: 'left' }}>
                        <MessageCircle size={18} />
                        <div style={{ flex: 1 }}>
                          <div>WhatsApp</div>
                          <div style={{ fontSize: 11.5, opacity: 0.8, fontWeight: 400 }}>Elige plantilla o escribe</div>
                        </div>
                        <ChevronDown size={15} style={{ transform: waOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', opacity: 0.8 }} />
                      </button>

                      {waOpen && (
                        <div style={{ marginTop: 8, border: '1.5px solid #e2e8e4', borderRadius: 13, overflow: 'hidden' }}>
                          {templates.map((t, i) => (
                            <div key={i} style={{ padding: '12px 14px', borderBottom: i < templates.length - 1 ? '1px solid #f0f4f1' : 'none', background: '#fff' }}>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16201d' }}>{t.label}</span>
                                <div style={{ display: 'flex', gap: 6 }}>
                                  <button onClick={() => copyTemplate(t.text, i)}
                                    style={{ padding: '4px 10px', borderRadius: 7, border: '1px solid #e2e8e4', background: waCopied === i ? '#e3f1ec' : '#f8fbf9', color: waCopied === i ? '#0F7A63' : '#6b7a76', fontSize: 11.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                    {waCopied === i ? '✓ Copiado' : 'Copiar'}
                                  </button>
                                  <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(t.text)}`} target="_blank" rel="noopener noreferrer"
                                    style={{ padding: '4px 10px', borderRadius: 7, background: '#25D366', color: '#fff', fontSize: 11.5, fontWeight: 600, textDecoration: 'none' }}>
                                    Enviar
                                  </a>
                                </div>
                              </div>
                              <p style={{ fontSize: 12, color: '#9aaba5', margin: 0, lineHeight: 1.5 }}>{t.text.slice(0, 100)}…</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {lead.email && (
                    <a href={`mailto:${lead.email}?subject=Tu presupuesto personalizado DKV`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 13, background: '#0F7A63', textDecoration: 'none', fontWeight: 700, fontSize: 14, color: '#fff' }}>
                      <Mail size={18} />
                      <div>
                        <div>Enviar correo</div>
                        <div style={{ fontSize: 11.5, opacity: 0.75, fontWeight: 400 }}>Asunto pre-escrito incluido</div>
                      </div>
                    </a>
                  )}
                  {lead.telefono && (
                    <a href={`tel:+${waNum}`}
                      style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 13, background: '#f0f4f1', textDecoration: 'none', fontWeight: 700, fontSize: 14, color: '#16201d', border: '1px solid #e2e8e4' }}>
                      <Phone size={18} style={{ color: '#0F7A63' }} />
                      <div>
                        <div>Llamar ahora</div>
                        <div style={{ fontSize: 11.5, color: '#9aaba5', fontWeight: 400 }}>{lead.telefono}</div>
                      </div>
                    </a>
                  )}
                </div>
              </div>

              {/* Calificar */}
              <div style={card}>
                <h2 style={{ fontSize: 11.5, fontWeight: 700, color: '#9aaba5', margin: '0 0 14px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Calificar lead</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {TAGS.map(t => {
                    const s = TAG_STYLES[t]; const active = lead.tag === t
                    return (
                      <button key={t} onClick={() => updateTag(t)}
                        style={{
                          padding: '10px 12px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit',
                          border: active ? `2px solid ${s.color}` : '2px solid #e2e8e4',
                          background: active ? s.bg : '#fff', color: active ? s.color : '#9aaba5',
                          fontSize: 13, fontWeight: 700, transition: 'all 0.15s',
                        }}>
                        {t.charAt(0).toUpperCase() + t.slice(1)}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Col right */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Recordatorio */}
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: '#f8efd9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Bell size={15} style={{ color: '#a8741a' }} />
                  </div>
                  <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', margin: 0 }}>Recordatorio</h2>
                </div>

                {lead.recordatorio && (
                  <div style={{ padding: '12px 14px', borderRadius: 12, background: '#f8efd9', border: '1px solid #f0d9a0', marginBottom: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#a8741a', marginBottom: 2 }}>📅 {lead.recordatorio.fecha}</div>
                      <div style={{ fontSize: 13.5, color: '#7a5c10' }}>{lead.recordatorio.texto}</div>
                    </div>
                    <button onClick={borrarRecordatorio} className="no-print" style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#a8741a', padding: 0, marginLeft: 8 }}>
                      <X size={15} />
                    </button>
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} className="no-print">
                  <input type="date" value={recFecha} onChange={e => setRecFecha(e.target.value)}
                    style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                  <input value={recTexto} onChange={e => setRecTexto(e.target.value)} placeholder="Ej: Llamar para cerrar póliza"
                    style={{ padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' }} />
                  <button onClick={saveRecordatorio}
                    style={{ padding: '11px', borderRadius: 12, border: 'none', background: '#0F7A63', color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                    Programar recordatorio
                  </button>
                </div>
              </div>

              {/* Notas */}
              <div style={{ ...card, flex: 1 }}>
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', margin: '0 0 14px' }}>Notas</h2>
                <div className="no-print" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={notaText} onChange={e => setNotaText(e.target.value)} maxLength={500}
                      aria-label="Escribir una nota"
                      placeholder="Escribe una nota sobre este lead…"
                      onKeyDown={e => { if (e.key === 'Enter') addNota() }}
                      style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                    <button onClick={addNota} aria-label="Añadir nota" disabled={!notaText.trim()}
                      style={{ padding: '11px 14px', borderRadius: 12, border: 'none', background: notaText.trim() ? '#0F7A63' : '#c8d4ce', color: '#fff', cursor: notaText.trim() ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center' }}>
                      <Plus size={16} />
                    </button>
                  </div>
                  {notaText.length > 0 && (
                    <div style={{ textAlign: 'right', fontSize: 11, color: notaText.length >= 500 ? '#c23a22' : '#9aaba5', marginTop: 5, fontWeight: 500 }}>
                      {notaText.length}/500
                    </div>
                  )}
                </div>

                {(!lead.notas || lead.notas.length === 0)
                  ? <div style={{ textAlign: 'center', padding: '24px 0', color: '#c8d4ce', fontSize: 14 }}>Sin notas aún. Añade una arriba.</div>
                  : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 280, overflowY: 'auto' }}>
                      {lead.notas.map((n, i) => (
                        <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fbf9', border: '1px solid #eaeeed' }}>
                          <p style={{ fontSize: 13.5, color: '#16201d', margin: '0 0 6px', lineHeight: 1.5 }}>{n.text}</p>
                          <p style={{ fontSize: 11, color: '#c8d4ce', margin: 0 }}>{new Date(n.when).toLocaleString('es-ES', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}</p>
                        </div>
                      ))}
                    </div>
                }
              </div>

              {/* Historial del lead */}
              <div style={{ ...card }} className="no-print">
                <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', margin: '0 0 16px' }}>Historial</h2>
                {historial.length === 0
                  ? <div style={{ textAlign: 'center', padding: '20px 0', color: '#c8d4ce', fontSize: 13.5 }}>Aún no hay actividad registrada para este lead.</div>
                  : <div style={{ display: 'flex', flexDirection: 'column' }}>
                      {historial.map((h, i) => (
                        <div key={h.id} style={{ display: 'flex', gap: 12 }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{ width: 9, height: 9, borderRadius: '50%', background: '#0F7A63', marginTop: 5, flexShrink: 0 }} />
                            {i < historial.length - 1 && <div style={{ width: 2, flex: 1, background: '#eaeeed', margin: '3px 0' }} />}
                          </div>
                          <div style={{ paddingBottom: i < historial.length - 1 ? 16 : 0 }}>
                            <p style={{ fontSize: 13, color: '#16201d', margin: 0, lineHeight: 1.45 }}>{h.descripcion}</p>
                            <p style={{ fontSize: 11, color: '#9aaba5', margin: '3px 0 0' }}>
                              {new Date(h.created_at).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              {h.usuario_email && ` · ${h.usuario_email}`}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
