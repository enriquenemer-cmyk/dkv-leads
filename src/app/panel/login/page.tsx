'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { Eye, EyeOff, ArrowLeft, Check, Star } from 'lucide-react'

const CROSS = (
  <svg width="20" height="20" viewBox="0 0 18 18" fill="none"><rect x="7.5" y="1" width="3" height="16" rx="1.5" fill="white" /><rect x="1" y="7.5" width="16" height="3" rx="1.5" fill="white" /></svg>
)

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(''); setLoading(true)
    const { error: authErr } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authErr) { setError('Credenciales incorrectas. Verifica tu correo y contraseña.'); return }
    await logActividad('sesion_inicio', `Inició sesión en el panel`)
    window.location.href = '/panel/dashboard'
  }

  const inp = (name: string) => ({
    width: '100%', padding: '14px 16px', borderRadius: 13, fontSize: 15, outline: 'none',
    border: `1.5px solid ${focused === name ? '#0F7A63' : '#e4eae7'}`,
    background: focused === name ? '#fff' : '#f7faf8', color: '#16201d', fontFamily: 'inherit',
    boxShadow: focused === name ? '0 0 0 4px rgba(15,122,99,0.10)' : 'none', transition: 'all 0.15s',
    boxSizing: 'border-box' as const,
  })

  return (
    <main style={{ minHeight: '100dvh', background: '#f0f4f1', display: 'flex', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <style>{`
        .login-left { display: flex; }
        .login-logo-mobile { display: none; }
        @media (max-width: 860px) {
          .login-left { display: none !important; }
          .login-right { width: 100% !important; }
          .login-logo-mobile { display: flex !important; }
        }
      `}</style>

      {/* ── Panel izquierdo (marca) ── */}
      <div className="login-left" style={{ flex: 1.1, position: 'relative', overflow: 'hidden', background: 'linear-gradient(150deg, #0a2f27 0%, #0F7A63 78%, #1a9e7e 130%)', flexDirection: 'column', justifyContent: 'space-between', padding: '48px 52px', minHeight: '100dvh' }}>
        {/* decoración */}
        <div style={{ position: 'absolute', top: -140, right: -120, width: 480, height: 480, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
        <div style={{ position: 'absolute', bottom: -120, left: -100, width: 340, height: 340, borderRadius: '50%', background: 'rgba(0,0,0,0.10)' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.035) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.035) 1px,transparent 1px)', backgroundSize: '54px 54px' }} />

        {/* logo */}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: 13, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 18px -4px rgba(0,0,0,0.35)' }}>{CROSS}</div>
          <div>
            <div style={{ fontWeight: 900, fontSize: 20, color: '#fff', lineHeight: 1, letterSpacing: '-0.01em' }}>DKV</div>
            <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 600, letterSpacing: '0.06em', marginTop: 3 }}>PANEL DE ASESORES</div>
          </div>
        </div>

        {/* centro */}
        <div style={{ position: 'relative', maxWidth: 420 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.16)', marginBottom: 26 }}>
            {[0, 1, 2, 3, 4].map(i => <Star key={i} size={13} fill="#ffd66b" color="#ffd66b" />)}
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.85)', fontWeight: 600, marginLeft: 4 }}>+120.000 familias protegidas</span>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, color: '#fff', margin: '0 0 16px', letterSpacing: '-0.03em', lineHeight: 1.1 }}>Tu centro de mando<br />de leads DKV</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, margin: '0 0 32px' }}>Gestiona tus leads en tiempo real, agenda seguimientos y cierra más clientes desde un único lugar.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 13 }}>
            {['Leads en tiempo real y avisos al instante', 'Kanban, prioridad y geolocalización', 'App móvil para llamar desde la calle'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ width: 22, height: 22, borderRadius: 7, background: 'rgba(126,232,200,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={13} color="#7ee8c8" strokeWidth={3} /></span>
                <span style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.88)', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', fontSize: 12.5, color: 'rgba(255,255,255,0.5)' }}>© {new Date().getFullYear()} DKV Seguros · Panel de asesores</div>
      </div>

      {/* ── Formulario ── */}
      <div className="login-right" style={{ width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 32px' }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          {/* logo móvil */}
          <div className="login-logo-mobile" style={{ alignItems: 'center', gap: 10, marginBottom: 28 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{CROSS}</div>
            <span style={{ fontWeight: 900, fontSize: 19, color: '#16201d' }}>DKV</span>
          </div>

          <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Bienvenido de nuevo</h1>
          <p style={{ fontSize: 14.5, color: '#9aaba5', margin: '0 0 30px' }}>Accede con tu cuenta de asesor para continuar</p>

          {error && (
            <div role="alert" style={{ marginBottom: 20, padding: '13px 16px', borderRadius: 12, background: '#fef0ed', border: '1px solid #fbd4cb', color: '#c23a22', fontSize: 13.5, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 17 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Correo electrónico</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="asesor@dkv.es" autoComplete="email"
                style={inp('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} required placeholder="••••••••" autoComplete="current-password"
                  style={{ ...inp('password'), paddingRight: 46 }} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
                <button type="button" onClick={() => setShowPass(v => !v)} aria-label={showPass ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aaba5', padding: 0, display: 'flex' }}>
                  {showPass ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '15px', borderRadius: 14, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading ? '#6b7a76' : 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)',
                color: '#fff', fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 10px 26px -8px rgba(15,122,99,0.5)', marginTop: 6 }}>
              {loading ? 'Verificando…' : 'Entrar al panel →'}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: '#9aaba5', textDecoration: 'none', fontWeight: 500 }}>
              <ArrowLeft size={13} /> Volver a la web pública
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
