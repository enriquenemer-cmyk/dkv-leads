'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { puedeVer } from '@/lib/secciones'
import {
  LayoutDashboard, Users, PlusCircle, ExternalLink, LogOut, Activity, UserCog, Layers, Search, CalendarCheck, Trophy, Flame, Zap, TrendingUp, MapPin, Mail, MailOpen, Gift, CheckCircle2, QrCode, MessagesSquare, Images
} from 'lucide-react'
import { IgIcon } from '@/components/IgIcon'

const navItems = [
  { href: '/panel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/panel/prioridad', label: 'Prioridad', icon: Zap },
  { href: '/panel/leads', label: 'Leads', icon: Users },
  { href: '/panel/instagram', label: 'Instagram', icon: IgIcon },
  { href: '/panel/contenido', label: 'Simulador de contenido', icon: Images },
  { href: '/panel/chat', label: 'Chat del equipo', icon: MessagesSquare },
  { href: '/panel/kanban', label: 'Kanban', icon: Layers },
  { href: '/panel/agenda', label: 'Agenda', icon: CalendarCheck },
  { href: '/panel/actividad', label: 'Actividad', icon: Activity },
  { href: '/panel/rendimiento', label: 'Rendimiento', icon: Trophy },
  { href: '/panel/conversion', label: 'Conversión', icon: TrendingUp },
  { href: '/panel/geolocalizacion', label: 'Geolocalización', icon: MapPin },
  { href: '/panel/analitica', label: 'Analítica web', icon: Flame },
  { href: '/panel/marketing', label: 'Email Marketing', icon: Mail },
  { href: '/panel/campanias', label: 'Resultados correos', icon: MailOpen },
  { href: '/panel/sorteo', label: 'Sorteos', icon: Gift },
  { href: '/panel/fidelizacion', label: 'Fidelización', icon: QrCode },
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
  const [chatNuevos, setChatNuevos] = useState(0)
  const [permisos, setPermisos] = useState<string[] | null>(null) // null = acceso total (admin / sin restricción)
  const [perfil, setPerfil] = useState<{ nombre: string; rol: string } | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      const uid = data.user?.id
      if (!uid) return
      const { data: row } = await supabase.from('asesores').select('rol, permisos, nombre').eq('id', uid).single()
      if (row) setPerfil({ nombre: (row.nombre as string) || '', rol: (row.rol as string) || 'asesor' })
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

  // Mensajes de chat nuevos (de otros asesores, desde la última visita al chat).
  useEffect(() => {
    // En el chat: marcamos todo como visto y ponemos el contador a cero.
    if (pathname.startsWith('/panel/chat')) {
      localStorage.setItem('chat-visto', new Date().toISOString())
      setChatNuevos(0)
      return
    }
    let uid: string | null = null
    async function recount() {
      const visto = localStorage.getItem('chat-visto') || '1970-01-01'
      const { count } = await supabase.from('mensajes_chat')
        .select('id', { count: 'exact', head: true })
        .gt('created_at', visto)
        .neq('usuario_id', uid ?? '00000000-0000-0000-0000-000000000000')
      setChatNuevos(count ?? 0)
    }
    supabase.auth.getUser().then(({ data }) => { uid = data.user?.id ?? null; recount() })
    const ch = supabase.channel('sidebar_chat')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_chat' }, (payload) => {
        const m = payload.new as { usuario_id?: string }
        if (m.usuario_id && m.usuario_id === uid) return
        setChatNuevos((n) => n + 1)
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [pathname])

  async function handleLogout() {
    await logActividad('sesion_cierre', `Cerró sesión en el panel`)
    await supabase.auth.signOut()
    router.push('/panel/login')
  }

  const initial = userEmail?.[0]?.toUpperCase() ?? 'A'
  const nombreAsesor = (userEmail?.split('@')[0] || 'Asesor').replace(/[._-]+/g, ' ')

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
        <div style={{ display: 'inline-flex', background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 5px 16px -4px rgba(0,0,0,0.4)' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dkv-logo-wordmark.png" alt="DKV Seguros" style={{ height: 26, width: 'auto', display: 'block' }} />
        </div>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 13, background: 'rgba(140,198,63,0.12)', border: '1px solid rgba(140,198,63,0.35)', borderRadius: 999, padding: '4px 11px' }}>
          <CheckCircle2 size={13} color="#8cc63f" />
          <span style={{ fontSize: 10.5, color: '#a9d96a', fontWeight: 700, letterSpacing: '0.02em' }}>Agente exclusivo DKV</span>
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
        {navItems.filter(i => puedeVer(permisos, i.href)).map(({ href, label, icon: Icon }) => navLink(href, label, Icon, href === '/panel/agenda' ? pendientes : href === '/panel/chat' ? chatNuevos : undefined))}

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
      <div style={{ padding: '12px 14px 16px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14.5, color: '#fff', flexShrink: 0, boxShadow: 'inset 0 0 0 1.5px rgba(255,255,255,0.16)' }}>{initial}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13.5, color: '#eef3f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{perfil?.nombre?.trim() || nombreAsesor}</div>
          <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: 1 }}>{perfil?.rol === 'admin' ? 'Administrador' : 'Asesor DKV'}</div>
        </div>
        <button onClick={handleLogout} title="Cerrar sesión" aria-label="Cerrar sesión"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.38)', width: 30, height: 30, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  )
}
