'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Lead } from '@/lib/supabase'
import { Search, LayoutDashboard, Users, Activity, UserCog, ArrowRight, Layers } from 'lucide-react'

const PAGES = [
  { label: 'Dashboard', href: '/panel/dashboard', icon: LayoutDashboard, desc: 'Métricas y resumen' },
  { label: 'Leads', href: '/panel/leads', icon: Users, desc: 'Lista de todos los leads' },
  { label: 'Kanban', href: '/panel/kanban', icon: Layers, desc: 'Vista de tablero' },
  { label: 'Actividad', href: '/panel/actividad', icon: Activity, desc: 'Historial de acciones' },
  { label: 'Asesores', href: '/panel/usuarios', icon: UserCog, desc: 'Gestión de usuarios' },
]

export function CommandPalette() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [leads, setLeads] = useState<Lead[]>([])
  const [selected, setSelected] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setOpen(v => !v) }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (open) {
      inputRef.current?.focus()
      setQuery('')
      setSelected(0)
      supabase.from('leads').select('id,nombre,telefono,email,tag').order('created_at', { ascending: false }).limit(100)
        .then(({ data }) => setLeads((data as Lead[]) ?? []))
    }
  }, [open])

  const q = query.toLowerCase().trim()
  const pageResults = PAGES.filter(p => !q || p.label.toLowerCase().includes(q) || p.desc.toLowerCase().includes(q))
  const leadResults = leads.filter(l => !q || l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q) || (l.telefono ?? '').includes(q)).slice(0, 5)
  const total = pageResults.length + leadResults.length

  function navigate(href: string) { router.push(href); setOpen(false) }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, total - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)) }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (selected < pageResults.length) navigate(pageResults[selected].href)
      else navigate(`/panel/leads/${leadResults[selected - pageResults.length].id}`)
    }
  }

  if (!open) return null

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: '80px 20px 20px', background: 'rgba(10,47,39,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()}
        style={{ background: '#fff', borderRadius: 20, width: '100%', maxWidth: 560, boxShadow: '0 40px 100px -20px rgba(0,0,0,0.35)', overflow: 'hidden' }}>

        {/* Search input */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid #f0f4f1' }}>
          <Search size={17} color="#9aaba5" style={{ flexShrink: 0 }} />
          <input ref={inputRef} value={query} onChange={e => { setQuery(e.target.value); setSelected(0) }}
            onKeyDown={onKeyDown}
            placeholder="Buscar páginas o leads…"
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, color: '#16201d', fontFamily: 'inherit', background: 'transparent' }} />
          <kbd style={{ fontSize: 11, color: '#c8d4ce', background: '#f0f4f1', padding: '3px 7px', borderRadius: 6, fontFamily: 'inherit', fontWeight: 600 }}>ESC</kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: 380, overflowY: 'auto' }}>
          {pageResults.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b0bdb8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 20px 6px' }}>Páginas</div>
              {pageResults.map((p, i) => {
                const Icon = p.icon
                const active = selected === i
                return (
                  <div key={p.href} onClick={() => navigate(p.href)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: active ? '#f0fbf7' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={() => setSelected(i)}>
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: active ? '#0F7A63' : '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.1s' }}>
                      <Icon size={15} color={active ? '#fff' : '#9aaba5'} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: active ? '#0F7A63' : '#16201d' }}>{p.label}</div>
                      <div style={{ fontSize: 12, color: '#9aaba5' }}>{p.desc}</div>
                    </div>
                    {active && <ArrowRight size={14} color="#0F7A63" />}
                  </div>
                )
              })}
            </div>
          )}

          {leadResults.length > 0 && (
            <div>
              <div style={{ fontSize: 10.5, fontWeight: 700, color: '#b0bdb8', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 20px 6px' }}>Leads</div>
              {leadResults.map((l, i) => {
                const idx = pageResults.length + i
                const active = selected === idx
                return (
                  <div key={l.id} onClick={() => navigate(`/panel/leads/${l.id}`)}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', cursor: 'pointer', background: active ? '#f0fbf7' : 'transparent', transition: 'background 0.1s' }}
                    onMouseEnter={() => setSelected(idx)}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: active ? '#0F7A63' : '#e8f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: active ? '#fff' : '#0F7A63', flexShrink: 0, transition: 'all 0.1s' }}>
                      {l.nombre[0].toUpperCase()}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: active ? '#0F7A63' : '#16201d' }}>{l.nombre}</div>
                      <div style={{ fontSize: 12, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email ?? l.telefono ?? '—'}</div>
                    </div>
                    {active && <ArrowRight size={14} color="#0F7A63" />}
                  </div>
                )
              })}
            </div>
          )}

          {total === 0 && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#b0bdb8', fontSize: 14 }}>Sin resultados para "{query}"</div>
          )}
        </div>

        <div style={{ padding: '10px 20px', borderTop: '1px solid #f0f4f1', display: 'flex', gap: 16 }}>
          {[['↑↓', 'Navegar'], ['↵', 'Abrir'], ['Esc', 'Cerrar']].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <kbd style={{ fontSize: 10.5, color: '#9aaba5', background: '#f0f4f1', padding: '2px 6px', borderRadius: 5, fontFamily: 'inherit', fontWeight: 600 }}>{k}</kbd>
              <span style={{ fontSize: 11.5, color: '#b0bdb8' }}>{v}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
