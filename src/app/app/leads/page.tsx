'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase, Lead } from '@/lib/supabase'
import { Search, ChevronRight, Plus } from 'lucide-react'

const TAG: Record<string, { l: string; c: string; bg: string }> = {
  caliente: { l: '🔥 Caliente', c: '#e07856', bg: '#fdeee9' },
  tibio: { l: '🌤️ Tibio', c: '#a8741a', bg: '#f8efd9' },
  frio: { l: '❄️ Frío', c: '#4a86a8', bg: '#e8f1f6' },
  cliente: { l: '✓ Cliente', c: '#0F7A63', bg: '#e3f1ec' },
}

const FILTROS = [
  { k: 'todos', l: 'Todos' },
  { k: 'caliente', l: '🔥' },
  { k: 'tibio', l: '🌤️' },
  { k: 'frio', l: '❄️' },
  { k: 'cliente', l: '✓' },
]

export default function AppLeads() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [q, setQ] = useState('')
  const [filtro, setFiltro] = useState('todos')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
      setLeads(data ?? []); setLoading(false)
    }
    load()
    const ch = supabase.channel('app-leads').on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, load).subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  const filtered = leads.filter(l => {
    if (filtro !== 'todos' && l.tag !== filtro) return false
    const t = q.trim().toLowerCase()
    if (!t) return true
    return [l.nombre, l.telefono, l.email, l.interes].some(v => (v ?? '').toLowerCase().includes(t))
  })

  const count = (k: string) => k === 'todos' ? leads.length : leads.filter(l => l.tag === k).length

  return (
    <div style={{ padding: '20px 16px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '4px 0 16px', letterSpacing: '-0.02em' }}>Leads</h1>

      <div style={{ position: 'relative', marginBottom: 12 }}>
        <Search size={17} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Buscar nombre, teléfono…" inputMode="search"
          style={{ width: '100%', padding: '13px 14px 13px 42px', borderRadius: 13, border: '1px solid #e2e8e4', background: '#fff', fontSize: 15, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      </div>

      {/* Filtros por estado */}
      <div style={{ display: 'flex', gap: 7, marginBottom: 16, overflowX: 'auto', paddingBottom: 2 }}>
        {FILTROS.map(f => {
          const active = filtro === f.k
          return (
            <button key={f.k} onClick={() => setFiltro(f.k)}
              style={{ flexShrink: 0, padding: '8px 14px', borderRadius: 999, border: 'none', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 700, cursor: 'pointer',
                background: active ? '#0F7A63' : '#fff', color: active ? '#fff' : '#6b7a76', boxShadow: active ? 'none' : '0 1px 3px rgba(0,0,0,0.06)' }}>
              {f.l} <span style={{ opacity: 0.7 }}>{count(f.k)}</span>
            </button>
          )
        })}
      </div>

      {loading ? <div style={{ textAlign: 'center', padding: 40, color: '#9aaba5' }}>Cargando…</div>
        : filtered.length === 0 ? <div style={{ textAlign: 'center', padding: 40, color: '#9aaba5' }}>Sin resultados</div>
        : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(l => {
              const t = TAG[l.tag] ?? TAG.frio
              return (
                <Link key={l.id} href={`/app/leads/${l.id}`}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#fff', borderRadius: 14, padding: 14, border: '1px solid #eef2f0', textDecoration: 'none' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 15.5, fontWeight: 700, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                    <div style={{ fontSize: 13, color: '#9aaba5', marginTop: 2 }}>{l.telefono ?? l.email ?? '—'}</div>
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: t.c, background: t.bg, padding: '4px 10px', borderRadius: 999, flexShrink: 0 }}>{t.l}</span>
                  <ChevronRight size={18} style={{ color: '#c8d4ce', flexShrink: 0 }} />
                </Link>
              )
            })}
          </div>
        )}

      {/* Botón flotante: captar lead al momento */}
      <Link href="/app/nuevo" aria-label="Nuevo lead"
        style={{ position: 'fixed', right: 18, bottom: 'calc(84px + env(safe-area-inset-bottom))', width: 56, height: 56, borderRadius: 18, background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 10px 24px -6px rgba(15,122,99,0.55)', zIndex: 30 }}>
        <Plus size={26} color="#fff" />
      </Link>
    </div>
  )
}
