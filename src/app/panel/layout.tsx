'use client'
import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { puedeVer } from '@/lib/secciones'
import { Sidebar } from '@/components/Sidebar'
import { CommandPalette } from '@/components/CommandPalette'
import { NewLeadToast } from '@/components/NewLeadToast'
import { Menu, X } from 'lucide-react'

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [navOpen, setNavOpen] = useState(false)

  // Close the mobile drawer whenever the route changes
  useEffect(() => { setNavOpen(false) }, [pathname])
  const [email, setEmail] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setEmail(data.session.user.email ?? null)
        setChecked(true)
      } else if (!pathname.includes('/login')) {
        router.replace('/panel/login')
      } else {
        setChecked(true)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setEmail(session.user.email ?? null)
        setChecked(true)
      } else if (!pathname.includes('/login')) {
        router.replace('/panel/login')
      }
    })

    return () => subscription.unsubscribe()
  }, [router, pathname])

  // Bloqueo por permisos: si el asesor no tiene acceso a esta sección, se le redirige.
  useEffect(() => {
    if (!email || pathname.includes('/login')) return
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const { data: row } = await supabase.from('asesores').select('rol, permisos').eq('id', uid).single()
      if (!row || row.rol === 'admin' || !Array.isArray(row.permisos) || row.permisos.length === 0) return
      if (!puedeVer(row.permisos as string[], pathname)) router.replace((row.permisos as string[])[0])
    })
  }, [email, pathname, router])

  if (pathname.includes('/login')) return <>{children}</>
  if (!checked) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f1f4f2' }}>
      <div className="text-[14px]" style={{ color: '#6b7a76' }}>Cargando…</div>
    </div>
  )
  if (!email) return null

  return (
    <div className="panel-shell" style={{ display: 'flex', minHeight: '100vh' }}>
      <style>{`
        .panel-sidebar-wrap { flex-shrink: 0; }
        .panel-mobile-header { display: none; }
        .panel-backdrop { display: none; }
        @media (max-width: 900px) {
          .panel-mobile-header { display: flex; }
          .panel-sidebar-wrap {
            position: fixed; top: 0; left: 0; bottom: 0; z-index: 50;
            transform: translateX(-100%); transition: transform 0.25s ease;
          }
          .panel-sidebar-wrap.open { transform: translateX(0); box-shadow: 0 0 60px rgba(0,0,0,0.4); }
          .panel-backdrop.open {
            display: block; position: fixed; inset: 0; z-index: 40;
            background: rgba(10,47,39,0.5); backdrop-filter: blur(2px);
          }
          .panel-main { padding-top: 56px; }
        }
      `}</style>
      <CommandPalette />
      <NewLeadToast />

      {/* Mobile top bar with hamburger */}
      <header className="panel-mobile-header" style={{
        position: 'fixed', top: 0, left: 0, right: 0, height: 56, zIndex: 45,
        alignItems: 'center', gap: 12, padding: '0 16px', background: '#0a2f27',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}>
        <button onClick={() => setNavOpen(v => !v)} aria-label={navOpen ? 'Cerrar menú' : 'Abrir menú'}
          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10, width: 38, height: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
          {navOpen ? <X size={18} /> : <Menu size={18} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="15" height="15" viewBox="0 0 18 18" fill="none"><rect x="7.5" y="1" width="3" height="16" rx="1.5" fill="white"/><rect x="1" y="7.5" width="16" height="3" rx="1.5" fill="white"/></svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 15, letterSpacing: '-0.01em' }}>DKV</span>
        </div>
      </header>

      <div className={`panel-backdrop${navOpen ? ' open' : ''}`} onClick={() => setNavOpen(false)} />

      <div className={`panel-sidebar-wrap${navOpen ? ' open' : ''}`}>
        <Sidebar userEmail={email} />
      </div>

      <div className="panel-main flex-1 overflow-auto" style={{ background: '#f1f4f2', minWidth: 0 }}>
        {children}
      </div>
    </div>
  )
}
