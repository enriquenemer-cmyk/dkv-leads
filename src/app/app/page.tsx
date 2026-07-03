'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { Phone, MessageCircle, ChevronRight } from 'lucide-react'

const esAuto = (l: Lead) => /^(web|formulario)/.test(l.fuente ?? '')
function hace(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000)
  if (m < 60) return `hace ${m} min`
  const h = Math.floor(m / 60)
  return h < 24 ? `hace ${h}h` : `hace ${Math.floor(h / 24)}d`
}

export default function AppHome() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
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

  const Card = ({ l, hot }: { l: Lead; hot: boolean }) => {
    const wa = (l.telefono ?? '').replace(/\D/g, '')
    return (
      <div style={{ background: '#fff', borderRadius: 16, padding: 16, border: '1px solid #eef2f0', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#16201d' }}>{l.nombre}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: hot ? '#e07856' : '#a8741a', background: hot ? '#fdeee9' : '#f8efd9', padding: '3px 10px', borderRadius: 999 }}>{hot ? '🔥 Caliente' : '🌤️ Tibio'}</span>
        </div>
        <div style={{ fontSize: 13, color: '#9aaba5', marginBottom: 14 }}>{l.interes ?? 'Seguro de salud'} · {hace(l.created_at)}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 12, background: '#25D366', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            <MessageCircle size={17} /> WhatsApp
          </a>}
          {l.telefono && <a href={`tel:+${wa}`}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, padding: '12px', borderRadius: 12, background: '#0F7A63', color: '#fff', fontWeight: 700, fontSize: 14, textDecoration: 'none' }}>
            <Phone size={16} /> Llamar
          </a>}
          <Link href={`/app/leads/${l.id}`}
            style={{ width: 46, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 12, background: '#f0f4f1', color: '#6b7a76', textDecoration: 'none' }}>
            <ChevronRight size={20} />
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '4px 0 2px', letterSpacing: '-0.02em' }}>Prioridad</h1>
      <p style={{ fontSize: 13.5, color: '#9aaba5', margin: '0 0 20px' }}>Llama antes de que se enfríen</p>

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#9aaba5' }}>Cargando…</div>
      ) : calientes.length === 0 && tibios.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#fff', borderRadius: 16, border: '1px solid #eef2f0' }}>
          <div style={{ fontSize: 44, marginBottom: 10 }}>✅</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: '#16201d', marginBottom: 4 }}>Todo al día</div>
          <div style={{ fontSize: 13.5, color: '#9aaba5' }}>No hay leads calientes sin atender.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {calientes.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#e07856', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>🔥 Calientes · {calientes.length}</div>}
          {calientes.map(l => <Card key={l.id} l={l} hot />)}
          {tibios.length > 0 && <div style={{ fontSize: 12.5, fontWeight: 800, color: '#a8741a', textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 10 }}>🌤️ Tibios · {tibios.length}</div>}
          {tibios.map(l => <Card key={l.id} l={l} hot={false} />)}
        </div>
      )}
    </div>
  )
}
