'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'
import { Loader } from '@/components/Loader'
import { EmptyState } from '@/components/EmptyState'
import { Phone, MessageCircle, ChevronRight, Zap, Timer, TrendingUp } from 'lucide-react'

const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

// Minutos desde la creación hasta la primera nota (= primer contacto). null si no hay notas.
function minutosHastaContacto(l: Lead): number | null {
  if (!l.notas || l.notas.length === 0) return null
  const primeras = l.notas.map(n => new Date(n.when).getTime()).filter(t => !isNaN(t))
  if (!primeras.length) return null
  const primer = Math.min(...primeras)
  return Math.max(0, Math.round((primer - new Date(l.created_at).getTime()) / 60000))
}

function haceTexto(iso: string): string {
  const min = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h ${min % 60}min`
  return `hace ${Math.floor(h / 24)}d`
}

const esAuto = (l: Lead) => /^(web|formulario)/.test(l.fuente ?? '')

export default function PrioridadPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('prioridad-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => fetchLeads())
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    setLeads(data ?? [])
    setLoading(false)
  }

  // Sin contactar (auto-inscritos, sin notas, no clientes), los más urgentes primero (más antiguos)
  const sinContactar = leads
    .filter(l => esAuto(l) && (!l.notas || l.notas.length === 0) && l.tag !== 'cliente')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  const calientes = sinContactar.filter(l => l.tag === 'caliente')
  const tibios = sinContactar.filter(l => l.tag === 'tibio')

  // Velocidad de respuesta (sobre leads ya contactados = con nota)
  const contactados = leads.filter(l => minutosHastaContacto(l) !== null)
  const tiempos = contactados.map(l => minutosHastaContacto(l)!) as number[]
  const media = tiempos.length ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length) : null
  const pct = (lim: number) => tiempos.length ? Math.round(100 * tiempos.filter(t => t <= lim).length / tiempos.length) : 0

  const fmtMin = (m: number | null) => m === null ? '—' : m < 60 ? `${m} min` : `${Math.floor(m / 60)}h ${m % 60}min`

  const stats = [
    { label: 'Contactados en < 1h', value: `${pct(60)}%`, icon: Zap, color: '#0F7A63', bg: '#e3f1ec' },
    { label: 'Contactados en < 2h', value: `${pct(120)}%`, icon: TrendingUp, color: '#a8741a', bg: '#f8efd9' },
    { label: 'Tiempo medio de respuesta', value: fmtMin(media), icon: Timer, color: '#0a5b49', bg: '#e3f1ec' },
  ]

  if (loading) return <div style={{ padding: 40 }}><Loader label="Cargando prioridad…" /></div>

  const Fila = ({ l }: { l: Lead }) => {
    const wa = (l.telefono ?? '').replace(/\D/g, '')
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', borderRadius: 12, background: '#fff', border: '1px solid #eef2f0' }}>
        <Avatar nombre={l.nombre} size={38} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
          <div style={{ fontSize: 12, color: '#9aaba5' }}>{l.telefono ?? l.email ?? '—'} · <span style={{ color: l.tag === 'caliente' ? '#e07856' : '#a8741a', fontWeight: 600 }}>{haceTexto(l.created_at)}</span></div>
        </div>
        {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" title="WhatsApp"
          style={{ width: 34, height: 34, borderRadius: 9, background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><MessageCircle size={16} color="#fff" /></a>}
        {l.telefono && <a href={`tel:+${wa}`} title="Llamar"
          style={{ width: 34, height: 34, borderRadius: 9, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={15} color="#fff" /></a>}
        <Link href={`/panel/leads/${l.id}`} title="Ver ficha"
          style={{ width: 34, height: 34, borderRadius: 9, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><ChevronRight size={16} color="#6b7a76" /></Link>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontSize: 13, color: '#9aaba5', fontWeight: 500, margin: '0 0 4px' }}>Atiende antes de que se enfríen</p>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: 0, letterSpacing: '-0.02em' }}>Prioridad</h1>
      </div>

      {/* Velocidad de respuesta */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 28 }} className="prio-stats">
        <style>{`@media(max-width:720px){.prio-stats{grid-template-columns:1fr!important}}`}</style>
        {stats.map(s => (
          <div key={s.label} style={card}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
              <s.icon size={18} style={{ color: s.color }} />
            </div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#16201d', lineHeight: 1, marginBottom: 4 }}>{s.value}</div>
            <div style={{ fontSize: 12.5, color: '#9aaba5', fontWeight: 500 }}>{s.label}</div>
          </div>
        ))}
      </div>
      <p style={{ fontSize: 12, color: '#c8d4ce', margin: '-16px 0 28px' }}>Basado en {contactados.length} lead{contactados.length === 1 ? '' : 's'} ya contactado{contactados.length === 1 ? '' : 's'} (tiempo hasta la primera nota).</p>

      {/* Calientes ahora */}
      <div style={{ ...card, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <span style={{ fontSize: 18 }}>🔥</span>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: '#16201d', margin: 0 }}>Calientes — llama ahora</h2>
          <span style={{ fontSize: 12, fontWeight: 700, color: '#e07856', background: '#fdeee9', padding: '2px 9px', borderRadius: 999 }}>{calientes.length}</span>
        </div>
        {calientes.length === 0
          ? <EmptyState icon={Zap} title="Ningún lead caliente sin atender" description="¡Buen trabajo! Todos los leads recientes están gestionados." />
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{calientes.map(l => <Fila key={l.id} l={l} />)}</div>}
      </div>

      {/* Tibios */}
      {tibios.length > 0 && (
        <div style={card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <span style={{ fontSize: 18 }}>🌤️</span>
            <h2 style={{ fontSize: 16, fontWeight: 800, color: '#16201d', margin: 0 }}>Tibios — enfriándose</h2>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#a8741a', background: '#f8efd9', padding: '2px 9px', borderRadius: 999 }}>{tibios.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{tibios.map(l => <Fila key={l.id} l={l} />)}</div>
        </div>
      )}
    </div>
  )
}
