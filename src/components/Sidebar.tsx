'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { puedeVer } from '@/lib/secciones'
import {
  LayoutDashboard, Users, PlusCircle, ExternalLink, LogOut, Activity, UserCog, Layers, Search, CalendarCheck, Trophy, Flame, Zap, TrendingUp, MapPin
} from 'lucide-react'

const navItems = [
  { href: '/panel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/panel/prioridad', label: 'Prioridad', icon: Zap },
  { href: '/panel/leads', label: 'Leads', icon: Users },
  { href: '/panel/kanban', label: 'Kanban', icon: Layers },
  { href: '/panel/agenda', label: 'Agenda', icon: CalendarCheck },
  { href: '/panel/actividad', label: 'Actividad', icon: Activity },
  { href: '/panel/rendimiento', label: 'Rendimiento', icon: Trophy },
  { href: '/panel/conversion', label: 'Conversión', icon: TrendingUp },
  { href: '/panel/geolocalizacion', label: 'Geolocalización', icon: MapPin },
  { href: '/panel/analitica', label: 'Analítica web', icon: Flame },
]

const configItems = [
  { href: '/panel/usuarios', label: 'Asesores', icon: UserCog },
]

function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function Sidebar({ userEmail }: { userEmail: string }) {
  const pathname = usePathname()
  const router = useRouter()
  const [pendientes, setPendientes] = useState(0)
  const [permisos, setPermisos] = useState<string[] | null>(null) // null = acceso total (admin / sin restricción)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const { data: row } = await supabase.from('asesores').select('rol, permisos').eq('id', uid).single()
      if (row && row.rol !== 'admin' && Array.isArray(row.permisos)) setPermisos(row.permisos as string[])
      else setPermisos(null)
    })
  }, [])

  useEffect(() => {
    async function fetchPendientes() {
      const { data } = await supabase.from('leads').select('recordatorio').not('recordatorio', 'is', null)
      const hoy = hoyISO()
      const n = (data ?? []).filter((l: { recordatorio: { fecha?: string } | null }) => l.recordatorio?.fecha && l.recordatorio.fecha <= hoy).length
      setPendientes(n)
    }
    fetchPendientes()
    const ch = supabase.channel('sidebar_recordatorios')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchPendientes)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/panel/login')
  }

  const initial = userEmail?.[0]?.toUpperCase() ?? 'A'

  const navLink = (href: string, label: string, Icon: React.ElementType, badge?: number) => {
    const active = pathname.startsWith(href)
    return (
      <Link key={href} href={href}
        style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
          background: active ? 'rgba(255,255,255,0.11)' : 'transparent',
          color: active ? '#fff' : 'rgba(255,255,255,0.55)',
          textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 500,
          transition: 'all 0.15s',
          borderLeft: active ? '2px solid #0F7A63' : '2px solid transparent',
        }}>
        <Icon size={16} />
        <span style={{ flex: 1 }}>{label}</span>
        {!!badge && badge > 0 && (
          <span style={{ fontSize: 11, fontWeight: 800, color: '#fff', background: '#c23a22', borderRadius: 999, minWidth: 19, height: 19, padding: '0 5px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{badge}</span>
        )}
      </Link>
    )
  }

  return (
    <aside style={{
      width: 240, minHeight: '100vh', background: '#0a2f27',
      display: 'flex', flexDirection: 'column', flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.06)'
    }}>
      {/* Logo */}
      <div style={{ padding: '28px 20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
              <rect x="7.5" y="1" width="3" height="16" rx="1.5" fill="white"/>
              <rect x="1" y="7.5" width="16" height="3" rx="1.5" fill="white"/>
            </svg>
          </div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 17, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>DKV</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 2, letterSpacing: '0.04em' }}>PANEL DE ASESORES</div>
          </div>
        </div>
      </div>

      {/* Cmd+K search button */}
      <div style={{ padding: '12px 12px 0' }}>
        <button aria-label="Buscar leads (atajo Cmd+K)" onClick={() => { const e = new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }); window.dispatchEvent(e) }}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.09)', cursor: 'pointer', fontFamily: 'inherit', color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
          <Search size={13} />
          <span style={{ flex: 1, textAlign: 'left' }}>Buscar…</span>
          <kbd style={{ fontSize: 10, background: 'rgba(255,255,255,0.1)', padding: '2px 6px', borderRadius: 5, color: 'rgba(255,255,255,0.4)' }}>⌘K</kbd>
        </button>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '8px 10px 6px', margin: 0 }}>Gestión</p>
        {navItems.filter(i => puedeVer(permisos, i.href)).map(({ href, label, icon: Icon }) => navLink(href, label, Icon, href === '/panel/agenda' ? pendientes : undefined))}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 10px 6px', margin: 0 }}>Acciones</p>

        <Link href="/panel/leads?modal=nuevo"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
            background: 'rgba(15,122,99,0.3)', color: '#7ee8c8',
            textDecoration: 'none', fontSize: 14, fontWeight: 600, border: '1px solid rgba(15,122,99,0.4)',
          }}>
          <PlusCircle size={16} />
          Nuevo lead manual
        </Link>

        <Link href="/" target="_blank"
          style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10,
            color: 'rgba(255,255,255,0.45)', textDecoration: 'none', fontSize: 14, fontWeight: 500,
          }}>
          <ExternalLink size={16} />
          Ver landing pública
        </Link>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '10px 0' }} />
        <p style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', padding: '2px 10px 6px', margin: 0 }}>Configuración</p>
        {configItems.filter(i => puedeVer(permisos, i.href)).map(({ href, label, icon: Icon }) => navLink(href, label, Icon))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.05)' }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#fff', flexShrink: 0 }}>{initial}</div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Asesor DKV</div>
          </div>
          <button onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: 2, display: 'flex' }}>
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  )
}
