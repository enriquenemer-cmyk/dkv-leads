'use client'
import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Flame, Users, LogOut, Eye, EyeOff } from 'lucide-react'

const GREEN = '#0F7A63'
const DARK = '#0a2f27'

const nav = [
  { href: '/app', label: 'Prioridad', icon: Flame },
  { href: '/app/leads', label: 'Leads', icon: Users },
]

export function MobileShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [email, setEmail] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)

  // Formulario de login
  const [correo, setCorreo] = useState('')
  const [pass, setPass] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    // Registrar el service worker (hace la app instalable + offline)
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/app' }).catch(() => {})
    }
    supabase.auth.getSession().then(({ data }) => {
      setEmail(data.session?.user.email ?? null)
      setChecked(true)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setEmail(session?.user.email ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  async function login(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email: correo.trim(), password: pass })
    setLoading(false)
    if (err) { setError('Credenciales incorrectas.'); return }
  }

  async function logout() {
    await supabase.auth.signOut()
    router.replace('/app')
  }

  if (!checked) return (
    <div style={{ minHeight: '100dvh', background: DARK, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 34, height: 34, borderRadius: '50%', border: '3px solid rgba(255,255,255,0.2)', borderTopColor: '#fff', animation: 'sp 0.7s linear infinite' }} />
      <style>{`@keyframes sp{to{transform:rotate(360deg)}}`}</style>
    </div>
  )

  // ─── LOGIN ───
  if (!email) return (
    <div style={{ minHeight: '100dvh', background: `linear-gradient(160deg, ${DARK}, ${GREEN})`, display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '32px 24px', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px', fontSize: 34, fontWeight: 900, color: '#fff', backdropFilter: 'blur(8px)' }}>+</div>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', margin: '0 0 6px', letterSpacing: '-0.02em' }}>DKV Asesores</h1>
        <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Tus leads, en el bolsillo</p>
      </div>
      <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {error && <div style={{ padding: '12px 14px', borderRadius: 12, background: 'rgba(255,120,90,0.2)', color: '#ffd9cf', fontSize: 13.5, fontWeight: 600, textAlign: 'center' }}>{error}</div>}
        <input value={correo} onChange={e => setCorreo(e.target.value)} type="email" inputMode="email" autoCapitalize="none" placeholder="Correo de asesor"
          style={inp} />
        <div style={{ position: 'relative' }}>
          <input value={pass} onChange={e => setPass(e.target.value)} type={showPass ? 'text' : 'password'} placeholder="Contraseña"
            style={{ ...inp, paddingRight: 48 }} />
          <button type="button" onClick={() => setShowPass(v => !v)} aria-label="Mostrar contraseña"
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', padding: 0 }}>
            {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <button type="submit" disabled={loading}
          style={{ marginTop: 6, padding: '15px', borderRadius: 14, border: 'none', background: '#fff', color: GREEN, fontSize: 16, fontWeight: 800, fontFamily: 'inherit' }}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )

  // ─── APP ───
  return (
    <div style={{ minHeight: '100dvh', background: '#f1f4f2', fontFamily: 'var(--font-jakarta), system-ui, sans-serif', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <header style={{ background: DARK, padding: 'max(12px, env(safe-area-inset-top)) 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 8, background: GREEN, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="16" height="16" viewBox="0 0 18 18" fill="none"><rect x="7.5" y="1" width="3" height="16" rx="1.5" fill="white"/><rect x="1" y="7.5" width="16" height="3" rx="1.5" fill="white"/></svg>
          </div>
          <span style={{ color: '#fff', fontWeight: 800, fontSize: 16, letterSpacing: '-0.01em' }}>DKV Asesores</span>
        </div>
        <button onClick={logout} aria-label="Cerrar sesión" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 9, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.8)' }}>
          <LogOut size={17} />
        </button>
      </header>

      {/* Contenido */}
      <main style={{ flex: 1, overflowY: 'auto', paddingBottom: 78 }}>{children}</main>

      {/* Bottom nav */}
      <nav style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e6ebe8', display: 'flex', padding: '8px 8px calc(8px + env(safe-area-inset-bottom))', zIndex: 20, boxShadow: '0 -4px 20px -8px rgba(16,32,29,0.15)' }}>
        {nav.map(({ href, label, icon: Icon }) => {
          const active = href === '/app' ? pathname === '/app' : pathname.startsWith(href)
          return (
            <Link key={href} href={href} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, padding: '6px 0', textDecoration: 'none', color: active ? GREEN : '#9aaba5' }}>
              <Icon size={22} strokeWidth={active ? 2.4 : 2} />
              <span style={{ fontSize: 11, fontWeight: active ? 700 : 500 }}>{label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

const inp: React.CSSProperties = {
  width: '100%', padding: '15px 16px', borderRadius: 14, border: '1.5px solid rgba(255,255,255,0.2)',
  background: 'rgba(255,255,255,0.12)', color: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box', backdropFilter: 'blur(8px)',
}
