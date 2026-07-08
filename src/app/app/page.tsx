'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { limpiarInteres } from '@/lib/interes'
import { Phone, MessageCircle, ChevronRight, Clock } from 'lucide-react'

const esAuto = (l: Lead) => /^(web|formulario)/.test(l.fuente ?? '')
function hace(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `${m} min`
  const h = Math.floor(m / 60)
  return h < 24 ? `${h}h` : `${Math.floor(h / 24)}d`
}
function inicial(n: string) { return (n.trim()[0] ?? '?').toUpperCase() }

export default function AppHome() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [nombre, setNombre] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const e = data.user?.email ?? ''
      setNombre(e.split('@')[0].split(/[._-]/)[0])
    })
    const load = async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      setLeads(data ?? []); setLoading(false)
    }
    load()
    const ch = supabase.channel('app-home').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const sinContactar = leads
    .filter(l => esAuto(l) && (!l.notas || l.notas.length === 0) && l.tag !== 'cliente')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  const calientes = sinContactar.filter(l => l.tag === 'caliente')
  const tibios = sinContactar.filter(l => l.tag === 'tibio')

  const h = new Date().getHours()
  const saludo = h < 12 ? 'Buenos días' : h < 20 ? 'Buenas tardes' : 'Buenas noches'
  const total = calientes.length + tibios.length

  const Card = ({ l, hot }: { l: Lead; hot: boolean }) => {
    const wa = (l.telefono ?? '').replace(/\D/g, '')
    const acc = hot ? '#e0603f' : '#c99019'
    return (
      <div style={{ background: '#fff', borderRadius: 20, padding: 16, boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 12px 30px -18px rgba(16,32,29,0.25)', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, background: acc }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <div style={{ width: 46, height: 46, borderRadius: 14, background: hot ? 'linear-gradient(135deg,#ffb199,#e0603f)' : 'linear-gradient(135deg,#f3d38a,#c99019)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 800, fontSize: 19, flexShrink: 0 }}>{inicial(l.nombre)}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 16.5, fontWeight: 800, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
            <div style={{ fontSize: 12.5, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{limpiarInteres(l.interes) || 'Seguro de salud'}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: acc, background: `${acc}14`, padding: '5px 9px', borderRadius: 999, flexShrink: 0 }}>
            <Clock size={12} /> {hace(l.created_at)}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px', borderRadius: 14, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}><MessageCircle size={17} /> WhatsApp</a>}
          {l.telefono && <a href={`tel:+${wa}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '13px', borderRadius: 14, background: 'linear-gradient(135deg,#0F7A63,#0a5b49)', color: '#fff', fontWeight: 700, fontSize: 14.5, textDecoration: 'none' }}><Phone size={16} /> Llamar</a>}
          <Link href={`/app/leads/${l.id}`} style={{ width: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 14, background: '#f0f4f1', color: '#6b7a76', textDecoration: 'none' }}><ChevronRight size={20} /></Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Cabecera con degradado */}
      <div style={{ background: 'linear-gradient(160deg, #0a2f27 0%, #0F7A63 130%)', padding: '8px 20px 62px', color: '#fff' }}>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: '0 0 2px' }}>{saludo},</p>
        <h1 style={{ fontSize: 26, fontWeight: 800, margin: 0, letterSpacing: '-0.02em', textTransform: 'capitalize' }}>{nombre || 'Asesor'} 👋</h1>
        <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.85)', margin: '10px 0 0' }}>
          {loading ? 'Cargando tus leads…' : total === 0 ? 'No tienes leads pendientes. ¡Buen trabajo!' : <>Tienes <b>{total} lead{total > 1 ? 's' : ''}</b> esperando tu llamada.</>}
        </p>
      </div>

      {/* Tarjetas resumen (superpuestas) */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px', marginTop: -42 }}>
        {[{ n: calientes.length, l: 'Calientes', e: '🔥', c: '#e0603f' }, { n: tibios.length, l: 'Tibios', e: '🌤️', c: '#c99019' }].map(s => (
          <div key={s.l} style={{ flex: 1, background: '#fff', borderRadius: 18, padding: '16px 18px', boxShadow: '0 10px 30px -14px rgba(16,32,29,0.3)' }}>
            <div style={{ fontSize: 20, marginBottom: 6 }}>{s.e}</div>
            <div style={{ fontSize: 30, fontWeight: 800, color: '#16201d', lineHeight: 1 }}>{s.n}</div>
            <div style={{ fontSize: 12.5, color: '#9aaba5', fontWeight: 600, marginTop: 3 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* Lista */}
      <div style={{ padding: '24px 16px 16px' }}>
        {loading ? <div style={{ textAlign: 'center', padding: 30, color: '#9aaba5' }}>Cargando…</div>
          : total === 0 ? (
            <div style={{ textAlign: 'center', padding: '48px 20px', background: '#fff', borderRadius: 20, boxShadow: '0 12px 30px -18px rgba(16,32,29,0.25)' }}>
              <div style={{ fontSize: 46, marginBottom: 10 }}>✅</div>
              <div style={{ fontSize: 17, fontWeight: 800, color: '#16201d', marginBottom: 4 }}>Todo al día</div>
              <div style={{ fontSize: 13.5, color: '#9aaba5' }}>No hay leads calientes sin atender.</div>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {calientes.length > 0 && <SecTitle c="#e0603f" t={`🔥 Calientes · ${calientes.length}`} />}
              {calientes.map(l => <Card key={l.id} l={l} hot />)}
              {tibios.length > 0 && <div style={{ height: 6 }} />}
              {tibios.length > 0 && <SecTitle c="#c99019" t={`🌤️ Tibios · ${tibios.length}`} />}
              {tibios.map(l => <Card key={l.id} l={l} hot={false} />)}
            </div>
          )}
      </div>
    </div>
  )
}

function SecTitle({ c, t }: { c: string; t: string }) {
  return <div style={{ fontSize: 12.5, fontWeight: 800, color: c, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '2px 2px' }}>{t}</div>
}
