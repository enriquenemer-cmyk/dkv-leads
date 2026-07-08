'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { limpiarInteres } from '@/lib/interes'
import { ArrowLeft, Phone, MessageCircle, Mail, Plus } from 'lucide-react'

const TAGS = [
  { k: 'caliente', l: '🔥 Caliente', c: '#e07856' },
  { k: 'tibio', l: '🌤️ Tibio', c: '#a8741a' },
  { k: 'frio', l: '❄️ Frío', c: '#4a86a8' },
  { k: 'cliente', l: '✓ Cliente', c: '#0F7A63' },
] as const

export default function AppLeadDetail() {
  const { id } = useParams<{ id: string }>()
  const [lead, setLead] = useState<Lead | null>(null)
  const [nota, setNota] = useState('')
  const [saving, setSaving] = useState(false)

  async function load() {
    const { data } = await supabase.from('leads').select('*').eq('id', id).single()
    setLead(data as Lead)
  }
  useEffect(() => { load() }, [id])

  async function setTag(tag: string) {
    if (!lead) return
    setLead({ ...lead, tag: tag as Lead['tag'] })
    await supabase.from('leads').update({ tag }).eq('id', lead.id)
  }

  async function addNota() {
    if (!lead || !nota.trim()) return
    setSaving(true)
    const notas = [...(lead.notas ?? []), { text: nota.trim(), when: new Date().toISOString() }]
    const { error } = await supabase.from('leads').update({ notas }).eq('id', lead.id)
    setSaving(false)
    if (!error) { setNota(''); setLead({ ...lead, notas }) }
  }

  if (!lead) return <div style={{ padding: 40, textAlign: 'center', color: '#9aaba5' }}>Cargando…</div>
  const wa = (lead.telefono ?? '').replace(/\D/g, '')

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <Link href="/app/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7a76', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
        <ArrowLeft size={16} /> Leads
      </Link>

      {/* Cabecera */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 20, border: '1px solid #eef2f0', marginBottom: 14 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#16201d', margin: '0 0 4px' }}>{lead.nombre}</h1>
        <p style={{ fontSize: 13.5, color: '#9aaba5', margin: '0 0 16px' }}>{limpiarInteres(lead.interes) || 'Seguro de salud'}</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px', borderRadius: 12, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}><MessageCircle size={18} /> WhatsApp</a>}
          {lead.telefono && <a href={`tel:+${wa}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px', borderRadius: 12, background: '#0F7A63', color: '#fff', fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}><Phone size={17} /> Llamar</a>}
        </div>
        {lead.email && <a href={`mailto:${lead.email}`} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, padding: '13px', borderRadius: 12, background: '#f0f4f1', color: '#16201d', fontWeight: 600, fontSize: 14, textDecoration: 'none' }}><Mail size={16} /> {lead.email}</a>}
      </div>

      {/* Estado */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 18, border: '1px solid #eef2f0', marginBottom: 14 }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Estado</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {TAGS.map(t => {
            const active = lead.tag === t.k
            return (
              <button key={t.k} onClick={() => setTag(t.k)}
                style={{ padding: '13px', borderRadius: 12, border: `2px solid ${active ? t.c : '#e6ebe8'}`, background: active ? `${t.c}14` : '#fff', color: active ? t.c : '#6b7a76', fontWeight: 700, fontSize: 14, fontFamily: 'inherit' }}>
                {t.l}
              </button>
            )
          })}
        </div>
      </div>

      {/* Notas */}
      <div style={{ background: '#fff', borderRadius: 18, padding: 18, border: '1px solid #eef2f0' }}>
        <div style={{ fontSize: 12.5, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Notas</div>
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input value={nota} onChange={e => setNota(e.target.value)} maxLength={500} placeholder="Añade una nota…"
            style={{ flex: 1, padding: '13px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', fontSize: 15, outline: 'none', fontFamily: 'inherit' }} />
          <button onClick={addNota} disabled={!nota.trim() || saving} aria-label="Añadir nota"
            style={{ width: 48, borderRadius: 12, border: 'none', background: nota.trim() ? '#0F7A63' : '#c8d4ce', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={20} /></button>
        </div>
        {(!lead.notas || lead.notas.length === 0)
          ? <div style={{ textAlign: 'center', padding: '16px 0', color: '#c8d4ce', fontSize: 13.5 }}>Sin notas. Al añadir una, el lead deja de enfriarse.</div>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...lead.notas].reverse().map((n, i) => (
                <div key={i} style={{ padding: '12px 14px', borderRadius: 12, background: '#f8fbf9', border: '1px solid #eef2f0' }}>
                  <div style={{ fontSize: 14, color: '#16201d', marginBottom: 4 }}>{n.text}</div>
                  <div style={{ fontSize: 11, color: '#c8d4ce' }}>{new Date(n.when).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
              ))}
            </div>}
      </div>
    </div>
  )
}
