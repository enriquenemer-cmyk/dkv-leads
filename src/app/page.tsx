'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { CheckCircle2, ShieldCheck, Clock, Users, Star, ChevronRight } from 'lucide-react'

const INTERESES = ['Seguro de salud', 'Hospitalización', 'Seguro dental', 'Reembolso']

export default function Landing() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', interes: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  function set(key: string, v: string) { setForm(f => ({ ...f, [key]: v })); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.telefono.trim() && !form.email.trim()) { setError('Incluye al menos tu teléfono o correo.'); return }
    setSending(true)
    const { error: dbErr } = await supabase.from('leads').insert({
      nombre: form.nombre.trim(), telefono: form.telefono.trim() || null,
      email: form.email.trim() || null, interes: form.interes || null,
      fuente: 'formulario', tag: 'frio',
    })
    setSending(false)
    if (dbErr) { setError('Algo salió mal. Inténtalo de nuevo.'); return }
    router.push('/gracias?nombre=' + encodeURIComponent(form.nombre.trim()))
  }

  const inputStyle = (name: string) => ({
    width: '100%', padding: '14px 16px', borderRadius: 12,
    border: `1.5px solid ${focused === name ? '#0F7A63' : '#e2e8e4'}`,
    background: focused === name ? '#fff' : '#f8fbf9',
    color: '#16201d', fontSize: 14.5, outline: 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
    boxShadow: focused === name ? '0 0 0 4px rgba(15,122,99,0.08)' : 'none',
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f1', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>

      {/* ─── HERO ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 60%, #1a9e7e 100%)', minHeight: 680 }}>
        {/* Decorative blobs */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 160, left: '38%', width: 2, height: 320, background: 'rgba(255,255,255,0.06)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>

          {/* Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 11, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 20, color: '#fff', backdropFilter: 'blur(8px)' }}>+</div>
              <div>
                <div style={{ fontWeight: 800, fontSize: 20, color: '#fff', lineHeight: 1 }}>DKV</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>Seguros de salud</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '6px 14px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>Para empresas</span>
              <span style={{ padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', color: '#fff', fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)' }}>Área de asesores</span>
            </div>
          </nav>

          {/* Hero grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'center', padding: '72px 0 80px', minHeight: 540 }}>

            {/* Left */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px 6px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', marginBottom: 28 }}>
                <Star size={13} fill="rgba(255,210,100,0.9)" stroke="none" />
                <span style={{ color: 'rgba(255,255,255,0.9)', fontSize: 12.5, fontWeight: 600 }}>Más de 120.000 familias protegidas</span>
              </div>

              <h1 style={{ fontSize: 'clamp(38px, 5vw, 62px)', fontWeight: 800, color: '#fff', lineHeight: 1.06, letterSpacing: '-0.03em', margin: '0 0 24px' }}>
                Tu salud merece<br />
                <span style={{ color: '#7ee8c8' }}>la mejor cobertura</span>
              </h1>

              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, maxWidth: 480, marginBottom: 40 }}>
                Comparamos los mejores planes de DKV para ti. Un asesor personal sin coste, respuesta garantizada en menos de 24 horas.
              </p>

              {/* Checkmarks */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 52 }}>
                {['Cobertura inmediata desde el primer día', 'Red de +40.000 especialistas en toda España', 'Sin copagos ocultos, sin permanencia mínima'].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(126,232,200,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={14} color="#7ee8c8" />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.85)', fontSize: 15, fontWeight: 500 }}>{b}</span>
                  </div>
                ))}
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: 40 }}>
                {[{ v: '+120k', l: 'Asegurados' }, { v: '4.8★', l: 'Valoración' }, { v: '<24h', l: 'Respuesta' }].map(s => (
                  <div key={s.l}>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#fff' }}>{s.v}</div>
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Form card */}
            <div style={{ background: '#fff', borderRadius: 24, padding: '36px 32px', boxShadow: '0 40px 80px -20px rgba(0,0,0,0.35)', position: 'relative' }}>
              {/* Top accent */}
              <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, borderRadius: '0 0 4px 4px', background: 'linear-gradient(90deg, #0F7A63, #1a9e7e)' }} />

              <div style={{ marginBottom: 24 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: '#16201d', margin: '0 0 6px' }}>Quiero mi presupuesto</h2>
                <p style={{ fontSize: 13.5, color: '#6b7a76', margin: 0 }}>Gratis · Sin compromiso · En menos de 24h</p>
              </div>

              {error && (
                <div style={{ marginBottom: 16, padding: '12px 16px', borderRadius: 12, background: '#fef0ed', border: '1px solid #fbd4cb', color: '#c23a22', fontSize: 13, fontWeight: 500 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Nombre completo *</label>
                  <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="María García"
                    style={inputStyle('nombre')} onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Teléfono</label>
                    <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000"
                      style={inputStyle('telefono')} onFocus={() => setFocused('telefono')} onBlur={() => setFocused(null)} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Correo</label>
                    <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" type="email"
                      style={inputStyle('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Me interesa</label>
                  <select value={form.interes} onChange={e => set('interes', e.target.value)}
                    style={{ ...inputStyle('interes'), color: form.interes ? '#16201d' : '#9aaba5' }}
                    onFocus={() => setFocused('interes')} onBlur={() => setFocused(null)}>
                    <option value="">¿Qué tipo de seguro necesitas?</option>
                    {INTERESES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </div>

                <button type="submit" disabled={sending}
                  style={{
                    width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: sending ? 'wait' : 'pointer',
                    background: sending ? '#6b7a76' : 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)',
                    color: '#fff', fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: sending ? 'none' : '0 8px 24px -6px rgba(15,122,99,0.5)',
                    transition: 'all 0.2s', marginTop: 4,
                  }}>
                  {sending ? 'Enviando…' : <><span>Quiero que me llamen</span> <ChevronRight size={18} /></>}
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 4 }}>
                  <ShieldCheck size={13} style={{ color: '#0F7A63' }} />
                  <p style={{ fontSize: 11.5, color: '#9aaba5', margin: 0, textAlign: 'center' }}>
                    Tus datos están protegidos. Sin spam, solo te contactamos para asesorarte.
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUST BAND ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ede9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '20px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap' }}>
          {[
            { icon: ShieldCheck, text: 'Aseguradora con 50 años de experiencia' },
            { icon: Users, text: '+120.000 familias confían en DKV' },
            { icon: Clock, text: 'Respuesta garantizada en <24h' },
            { icon: Star, text: 'Valoración media 4,8 / 5' },
          ].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon size={15} style={{ color: '#0F7A63', flexShrink: 0 }} />
              <span style={{ fontSize: 13.5, color: '#48574f', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: '#e3f1ec', color: '#0F7A63', fontSize: 12.5, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 16 }}>Proceso</span>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#16201d', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Así de fácil funciona</h2>
          <p style={{ fontSize: 16, color: '#6b7a76', maxWidth: 480, margin: '0 auto' }}>Sin burocracia, sin esperas. De tu solicitud a tu cobertura en 3 pasos.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { n: '01', title: 'Solicitas info', desc: 'Rellenas el formulario en menos de 60 segundos con tus datos de contacto.', color: '#0F7A63' },
            { n: '02', title: 'Te llamamos', desc: 'Un asesor personal te contacta antes de 24h para entender tus necesidades.', color: '#0a5b49' },
            { n: '03', title: 'Eliges tu plan', desc: 'Recibes opciones personalizadas. Tú decides, sin presiones y sin coste.', color: '#0a2f27' },
          ].map(step => (
            <div key={step.n} style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', border: '1px solid #e6eae8', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -10, fontSize: 80, fontWeight: 900, color: '#f0f4f1', lineHeight: 1, userSelect: 'none' }}>{step.n}</div>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: step.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                <span style={{ color: '#fff', fontWeight: 900, fontSize: 16 }}>{step.n}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#16201d', margin: '0 0 10px' }}>{step.title}</h3>
              <p style={{ fontSize: 14.5, color: '#6b7a76', lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── CTA FINAL ─── */}
      <div style={{ background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 100%)', margin: '0 32px 80px', borderRadius: 28, padding: '60px 48px', maxWidth: 1136, marginLeft: 'auto', marginRight: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ fontSize: 32, fontWeight: 800, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>¿Listo para proteger tu salud?</h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.7)', margin: 0 }}>Sin compromiso. Sin permanencia. Solo cobertura real.</p>
        </div>
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          style={{ padding: '16px 36px', borderRadius: 14, background: '#fff', color: '#0F7A63', fontSize: 15.5, fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontFamily: 'inherit' }}>
          Solicitar asesoría gratis →
        </button>
      </div>

      {/* Footer */}
      <div style={{ borderTop: '1px solid #e6eae8', padding: '24px 32px', textAlign: 'center' }}>
        <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>© 2025 DKV Seguros de Salud · Todos los derechos reservados · <a href="/panel/login" style={{ color: '#0F7A63', textDecoration: 'none', fontWeight: 600 }}>Acceso asesores</a></p>
      </div>
    </div>
  )
}
