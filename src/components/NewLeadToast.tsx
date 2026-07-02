'use client'
import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { supabase, leadSucursal } from '@/lib/supabase'
import { Sparkles, X } from 'lucide-react'

type Toast = { id: string; nombre: string; sucursal: string | null; interes: string | null }

/** Muestra un aviso flotante en tiempo real cuando entra un lead nuevo por el formulario. */
export function NewLeadToast() {
  const [toasts, setToasts] = useState<Toast[]>([])
  const mounted = useRef(false)

  useEffect(() => {
    // Evitamos avisar de leads que ya existían: solo reaccionamos a INSERT nuevos.
    mounted.current = true
    const ch = supabase.channel('nuevos_leads_toast')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' }, (payload) => {
        if (!mounted.current) return
        const l = payload.new as { id: string; nombre: string; fuente: string; interes: string | null }
        const t: Toast = { id: l.id, nombre: l.nombre, sucursal: leadSucursal(l), interes: l.interes }
        setToasts(prev => [t, ...prev].slice(0, 4))
        try {
          // Beep suave para avisar sin molestar
          const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          const ctx = new AC()
          const o = ctx.createOscillator(); const g = ctx.createGain()
          o.connect(g); g.connect(ctx.destination)
          o.frequency.value = 880; o.type = 'sine'
          g.gain.setValueAtTime(0.0001, ctx.currentTime)
          g.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.02)
          g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.35)
          o.start(); o.stop(ctx.currentTime + 0.35)
        } catch { /* audio no disponible */ }
        setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 9000)
      })
      .subscribe()
    return () => { mounted.current = false; supabase.removeChannel(ch) }
  }, [])

  if (toasts.length === 0) return null

  return (
    <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 60, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 340 }}>
      <style>{`@keyframes toastIn{from{opacity:0;transform:translateX(24px)}to{opacity:1;transform:translateX(0)}}`}</style>
      {toasts.map(t => (
        <Link key={t.id} href={`/panel/leads/${t.id}`} onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
          style={{ textDecoration: 'none', animation: 'toastIn 0.3s ease', display: 'block' }}>
          <div style={{ background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', borderRadius: 14, padding: '14px 16px', boxShadow: '0 12px 32px -8px rgba(10,47,39,0.5)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Sparkles size={19} color="#fff" />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 600 }}>🎉 ¡Nuevo lead!</div>
              <div style={{ fontSize: 14.5, color: '#fff', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.nombre}</div>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.7)', marginTop: 1 }}>
                {[t.sucursal ? `📍 ${t.sucursal}` : null, t.interes].filter(Boolean).join(' · ') || 'Toca para ver la ficha'}
              </div>
            </div>
            <button onClick={(e) => { e.preventDefault(); setToasts(prev => prev.filter(x => x.id !== t.id)) }} aria-label="Descartar aviso"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.6)', padding: 2, display: 'flex', flexShrink: 0 }}>
              <X size={15} />
            </button>
          </div>
        </Link>
      ))}
    </div>
  )
}
