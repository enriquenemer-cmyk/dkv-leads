'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react'

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
    router.push('/panel/dashboard')
  }

  const inp = (name: string) => ({
    width: '100%', padding: '13px 16px', borderRadius: 12, fontSize: 14.5, outline: 'none',
    border: `1.5px solid ${focused === name ? '#0F7A63' : '#e2e8e4'}`,
    background: focused === name ? '#fff' : '#f8fbf9', color: '#16201d', fontFamily: 'inherit',
    boxShadow: focused === name ? '0 0 0 4px rgba(15,122,99,0.08)' : 'none', transition: 'all 0.15s',
    boxSizing: 'border-box' as const,
  })

  return (
    <main style={{ minHeight: '100vh', background: '#f0f4f1', display: 'flex', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      {/* Left panel */}
      <div style={{ flex: 1, background: 'linear-gradient(145deg, #0a2f27 0%, #0F7A63 100%)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48, minHeight: '100vh' }}>
        <div style={{ maxWidth: 380, textAlign: 'center' }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 900, color: '#fff', margin: '0 auto 28px', backdropFilter: 'blur(12px)' }}>+</div>
          <h2 style={{ fontSize: 30, fontWeight: 800, color: '#fff', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Panel de asesores DKV</h2>
          <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.65)', lineHeight: 1.65, margin: '0 0 40px' }}>Gestiona todos tus leads, agenda recordatorios y cierra más clientes desde un único lugar.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {['Leads en tiempo real', 'Panel CRM completo', 'Exportación a Excel', 'Acceso desde cualquier dispositivo'].map(f => (
              <div key={f} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={15} color="#7ee8c8" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right: form */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 48 }}>
        <div style={{ width: '100%', maxWidth: 380 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#16201d', margin: '0 0 6px', letterSpacing: '-0.02em' }}>Bienvenido</h1>
          <p style={{ fontSize: 14, color: '#9aaba5', margin: '0 0 32px' }}>Introduce tus credenciales de asesor para continuar</p>

          {error && (
            <div style={{ marginBottom: 20, padding: '12px 16px', borderRadius: 12, background: '#fef0ed', border: '1px solid #fbd4cb', color: '#c23a22', fontSize: 13.5, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Correo electrónico</label>
              <input value={email} onChange={e => setEmail(e.target.value)} type="email" required placeholder="asesor@dkv.es"
                style={inp('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 7, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Contraseña</label>
              <div style={{ position: 'relative' }}>
                <input value={password} onChange={e => setPassword(e.target.value)} type={showPass ? 'text' : 'password'} required placeholder="••••••••"
                  style={{ ...inp('password'), paddingRight: 44 }} onFocus={() => setFocused('password')} onBlur={() => setFocused(null)} />
                <button type="button" onClick={() => setShowPass(v => !v)}
                  style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aaba5', padding: 0 }}>
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading}
              style={{ padding: '14px', borderRadius: 13, border: 'none', cursor: loading ? 'wait' : 'pointer',
                background: loading ? '#6b7a76' : 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)',
                color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit',
                boxShadow: loading ? 'none' : '0 8px 24px -6px rgba(15,122,99,0.45)', marginTop: 8 }}>
              {loading ? 'Verificando…' : 'Entrar al panel →'}
            </button>
          </form>

          <div style={{ marginTop: 28, textAlign: 'center' }}>
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 13.5, color: '#9aaba5', textDecoration: 'none', fontWeight: 500 }}>
              <ArrowLeft size={13} /> Volver al formulario público
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
