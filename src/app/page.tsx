'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, SUCURSALES, encodeFuente } from '@/lib/supabase'
import { CheckCircle2, ShieldCheck, Clock, Users, Star, ChevronRight, Heart, Building2, Smile, Stethoscope, ArrowLeft, Check } from 'lucide-react'

const INTERESES = [
  { value: 'Salud individual', label: 'Salud individual', icon: Heart, desc: 'Para ti solo' },
  { value: 'Seguro familiar', label: 'Seguro familiar', icon: Users, desc: 'Toda la familia' },
  { value: 'Salud empresa', label: 'Para empresa', icon: Building2, desc: 'Empleados' },
  { value: 'Seguro dental', label: 'Dental', icon: Smile, desc: 'Especialista' },
]

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } }, { threshold })
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return { ref, inView }
}

export default function Landing() {
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', interes: '', sucursal: '' })
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [focused, setFocused] = useState<string | null>(null)

  const stepsAnim = useInView()
  const logosAnim = useInView()
  const ctaAnim = useInView()

  function set(key: string, v: string) { setForm(f => ({ ...f, [key]: v })); setError('') }

  const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
  const telefonoValido = (t: string) => /^(\+?34)?[6789]\d{8}$/.test(t.replace(/[\s-]/g, ''))

  function goStep2() {
    if (!form.interes) { setError('Selecciona el tipo de seguro para continuar.'); return }
    setError(''); setStep(2)
  }

  function goStep3() {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.sucursal) { setError('Selecciona la oficina más cercana.'); return }
    if (!form.telefono.trim() && !form.email.trim()) { setError('Incluye al menos tu teléfono o correo.'); return }
    if (form.telefono.trim() && !telefonoValido(form.telefono)) { setError('El teléfono no es válido. Debe ser un número español de 9 dígitos.'); return }
    if (form.email.trim() && !emailValido(form.email)) { setError('El correo electrónico no tiene un formato válido.'); return }
    setError(''); setStep(3)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSending(true)
    const { error: dbErr } = await supabase.from('leads').insert({
      nombre: form.nombre.trim(), telefono: form.telefono.trim() || null,
      email: form.email.trim() || null, interes: form.interes || null,
      fuente: encodeFuente('formulario', form.sucursal), tag: 'frio',
    })
    setSending(false)
    if (dbErr) { setError('Algo salió mal. Inténtalo de nuevo.'); return }
    router.push('/gracias?nombre=' + encodeURIComponent(form.nombre.trim()))
  }

  const inp = (name: string) => ({
    width: '100%', padding: '13px 16px', borderRadius: 12,
    border: `1.5px solid ${focused === name ? '#0F7A63' : '#e2e8e4'}`,
    background: focused === name ? '#fff' : '#f8fbf9',
    color: '#16201d', fontSize: 14.5, outline: 'none',
    transition: 'all 0.15s', fontFamily: 'inherit',
    boxShadow: focused === name ? '0 0 0 4px rgba(15,122,99,0.08)' : 'none',
    boxSizing: 'border-box' as const,
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f4f1', fontFamily: 'var(--font-jakarta), system-ui, sans-serif' }}>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(28px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideIn { from{opacity:0;transform:translateX(18px)} to{opacity:1;transform:translateX(0)} }
        .hero-left{animation:fadeUp 0.7s ease both}
        .hero-form{animation:fadeUp 0.7s 0.18s ease both}
        .step-slide{animation:slideIn 0.3s ease both}
        .fade-up{opacity:0;transform:translateY(28px);transition:opacity 0.6s ease,transform 0.6s ease}
        .fade-up.visible{opacity:1;transform:translateY(0)}
        .step-card{transition:transform 0.2s,box-shadow 0.2s}
        .step-card:hover{transform:translateY(-4px);box-shadow:0 20px 48px -12px rgba(15,122,99,0.18)!important}
        .interest-btn{transition:all 0.15s;cursor:pointer}
        .interest-btn:hover{border-color:#0F7A63!important;background:#f0fbf7!important}
        @media(max-width:900px){.hero-grid{grid-template-columns:1fr!important;gap:40px!important;padding:48px 0 56px!important}.hero-form-col{order:-1}.steps-grid{grid-template-columns:1fr!important}.cta-block{flex-direction:column!important;text-align:center;align-items:center!important}}
        @media(max-width:600px){.hero-padding{padding:0 20px!important}.section-padding{padding:56px 20px!important}.cta-section{margin:0 16px 60px!important;padding:44px 28px!important;border-radius:22px!important}}
      `}</style>

      {/* ─── HERO ─── */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 60%, #1a9e7e 100%)', minHeight: 680 }}>
        <div style={{ position: 'absolute', top: -120, right: -120, width: 600, height: 600, borderRadius: '50%', background: 'rgba(255,255,255,0.04)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(0,0,0,0.08)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '60px 60px', pointerEvents: 'none' }} />

        <div className="hero-padding" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 32px', position: 'relative', zIndex: 1 }}>
          <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 0 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="9" y="2" width="4" height="18" rx="2" fill="white"/><rect x="2" y="9" width="18" height="4" rx="2" fill="white"/></svg>
              </div>
              <div>
                <div style={{ fontWeight: 900, fontSize: 21, color: '#fff', lineHeight: 1, letterSpacing: '-0.02em' }}>DKV</div>
                <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.55)', fontWeight: 500, letterSpacing: '0.04em' }}>SEGUROS DE SALUD</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ padding: '7px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.25)', color: 'rgba(255,255,255,0.75)', fontSize: 13, fontWeight: 500 }}>Para empresas</span>
            </div>
          </nav>

          <div className="hero-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 64, alignItems: 'center', padding: '72px 0 80px', minHeight: 540 }}>
            {/* Left */}
            <div className="hero-left">
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px 6px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)', marginBottom: 28 }}>
                <Star size={13} fill="rgba(255,210,100,0.95)" stroke="none" />
                <span style={{ color: 'rgba(255,255,255,0.92)', fontSize: 12.5, fontWeight: 600 }}>+2 millones de asegurados en España</span>
              </div>
              <h1 style={{ fontSize: 'clamp(38px,5vw,64px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.035em', margin: '0 0 24px' }}>
                Tu salud merece<br /><span style={{ color: '#7ee8c8' }}>la mejor cobertura</span>
              </h1>
              <p style={{ fontSize: 17.5, color: 'rgba(255,255,255,0.75)', lineHeight: 1.65, maxWidth: 480, marginBottom: 36 }}>
                Comparamos los mejores planes de DKV para ti. Un asesor personal sin coste, respuesta garantizada en menos de 24 horas.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 48 }}>
                {['Cobertura inmediata desde el primer día', 'Red de +51.000 especialistas en toda España', 'Sin copagos ocultos, sin permanencia mínima'].map(b => (
                  <div key={b} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(126,232,200,0.18)', border: '1px solid rgba(126,232,200,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <CheckCircle2 size={13} color="#7ee8c8" />
                    </div>
                    <span style={{ color: 'rgba(255,255,255,0.88)', fontSize: 15, fontWeight: 500 }}>{b}</span>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 36 }}>
                {[{ v: '+2M', l: 'Asegurados en España' }, { v: '4,8/5', l: 'Valoración Google' }, { v: '<24h', l: 'Tiempo respuesta' }].map(s => (
                  <div key={s.l} style={{ borderLeft: '2px solid rgba(126,232,200,0.3)', paddingLeft: 14 }}>
                    <div style={{ fontSize: 26, fontWeight: 900, color: '#fff', letterSpacing: '-0.02em' }}>{s.v}</div>
                    <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.5)', fontWeight: 500, marginTop: 2 }}>{s.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── FORMULARIO MULTIPASO ── */}
            <div className="hero-form hero-form-col">
              <div style={{ background: '#fff', borderRadius: 24, padding: '32px 28px', boxShadow: '0 40px 100px -20px rgba(0,0,0,0.4)', position: 'relative' }}>
                <div style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 3, borderRadius: '0 0 4px 4px', background: 'linear-gradient(90deg, #0F7A63, #7ee8c8)' }} />

                {/* Progress dots */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 24 }}>
                  {[1,2,3].map(s => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        background: step > s ? '#0F7A63' : step === s ? '#0F7A63' : '#f0f4f1',
                        color: step >= s ? '#fff' : '#c8d4ce', fontSize: 12, fontWeight: 700, transition: 'all 0.3s',
                        flexShrink: 0,
                      }}>
                        {step > s ? <Check size={13} /> : s}
                      </div>
                      {s < 3 && <div style={{ width: 48, height: 2, background: step > s ? '#0F7A63' : '#f0f4f1', transition: 'background 0.3s' }} />}
                    </div>
                  ))}
                  <div style={{ flex: 1 }} />
                  <span style={{ fontSize: 11.5, color: '#9aaba5', fontWeight: 600 }}>{step} de 3</span>
                </div>

                {error && (
                  <div id="form-error" role="alert" style={{ marginBottom: 14, padding: '11px 14px', borderRadius: 11, background: '#fef0ed', border: '1px solid #fbd4cb', color: '#c23a22', fontSize: 13, fontWeight: 500 }}>{error}</div>
                )}

                {/* PASO 1: Seleccionar tipo */}
                {step === 1 && (
                  <div className="step-slide">
                    <div style={{ marginBottom: 20 }}>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#16201d', margin: '0 0 5px', letterSpacing: '-0.02em' }}>¿Qué tipo de seguro buscas?</h2>
                      <p style={{ fontSize: 13, color: '#6b7a76', margin: 0 }}>Selecciona la opción que mejor se adapte a ti</p>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
                      {INTERESES.map(({ value, label, icon: Icon, desc }) => {
                        const active = form.interes === value
                        return (
                          <button key={value} type="button" className="interest-btn"
                            onClick={() => { set('interes', value); setError('') }}
                            style={{ padding: '16px 12px', borderRadius: 14, border: `2px solid ${active ? '#0F7A63' : '#e2e8e4'}`, background: active ? '#f0fbf7' : '#f8fbf9', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, fontFamily: 'inherit', textAlign: 'center' }}>
                            <div style={{ width: 40, height: 40, borderRadius: 12, background: active ? '#0F7A63' : '#e8f0ec', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}>
                              <Icon size={18} color={active ? '#fff' : '#0F7A63'} />
                            </div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: active ? '#0F7A63' : '#16201d', lineHeight: 1.2 }}>{label}</div>
                            <div style={{ fontSize: 11.5, color: '#9aaba5', fontWeight: 500 }}>{desc}</div>
                          </button>
                        )
                      })}
                    </div>
                    <button type="button" onClick={goStep2}
                      style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: 'pointer', background: form.interes ? 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)' : '#e2e8e4', color: form.interes ? '#fff' : '#9aaba5', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: form.interes ? '0 8px 28px -6px rgba(15,122,99,0.55)' : 'none', transition: 'all 0.2s' }}>
                      Continuar <ChevronRight size={17} />
                    </button>
                  </div>
                )}

                {/* PASO 2: Datos de contacto */}
                {step === 2 && (
                  <div className="step-slide">
                    <div style={{ marginBottom: 20 }}>
                      <button onClick={() => setStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#9aaba5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 10, fontWeight: 600 }}>
                        <ArrowLeft size={12} /> Volver
                      </button>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#16201d', margin: '0 0 5px', letterSpacing: '-0.02em' }}>¿Cómo podemos contactarte?</h2>
                      <p style={{ fontSize: 13, color: '#6b7a76', margin: 0 }}>Solo para que un asesor te llame · Sin spam</p>
                    </div>
                    {form.interes && (
                      <div style={{ padding: '8px 12px', borderRadius: 10, background: '#e3f1ec', border: '1px solid #b6ddd0', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <Check size={13} color="#0F7A63" />
                        <span style={{ fontSize: 12.5, color: '#0F7A63', fontWeight: 600 }}>{form.interes}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 16 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Nombre completo *</label>
                        <input value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="María García"
                          aria-label="Nombre completo" aria-describedby={error ? 'form-error' : undefined}
                          style={inp('nombre')} onFocus={() => setFocused('nombre')} onBlur={() => setFocused(null)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Teléfono</label>
                        <input value={form.telefono} onChange={e => set('telefono', e.target.value)} placeholder="+34 600 000 000"
                          aria-label="Teléfono" aria-describedby={error ? 'form-error' : undefined}
                          style={inp('telefono')} onFocus={() => setFocused('telefono')} onBlur={() => setFocused(null)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Correo electrónico</label>
                        <input value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" type="email"
                          aria-label="Correo electrónico" aria-describedby={error ? 'form-error' : undefined}
                          style={inp('email')} onFocus={() => setFocused('email')} onBlur={() => setFocused(null)} />
                      </div>
                      <div>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#6b7a76', marginBottom: 6, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Oficina más cercana *</label>
                        <select value={form.sucursal} onChange={e => set('sucursal', e.target.value)}
                          aria-label="Oficina más cercana" aria-describedby={error ? 'form-error' : undefined}
                          onFocus={() => setFocused('sucursal')} onBlur={() => setFocused(null)}
                          style={{ ...inp('sucursal'), cursor: 'pointer', color: form.sucursal ? '#16201d' : '#9aaba5', appearance: 'none', backgroundImage: 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%239aaba5\' stroke-width=\'3\'><path d=\'M6 9l6 6 6-6\'/></svg>")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 16px center', paddingRight: 40 }}>
                          <option value="">Selecciona tu oficina…</option>
                          {SUCURSALES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                    <button type="button" onClick={goStep3}
                      style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: 'pointer', background: 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)', color: '#fff', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 8px 28px -6px rgba(15,122,99,0.55)', transition: 'all 0.2s' }}>
                      Revisar y enviar <ChevronRight size={17} />
                    </button>
                  </div>
                )}

                {/* PASO 3: Confirmación */}
                {step === 3 && (
                  <form className="step-slide" onSubmit={handleSubmit}>
                    <div style={{ marginBottom: 20 }}>
                      <button onClick={() => setStep(2)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: '#9aaba5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, marginBottom: 10, fontWeight: 600 }}>
                        <ArrowLeft size={12} /> Volver
                      </button>
                      <h2 style={{ fontSize: 20, fontWeight: 800, color: '#16201d', margin: '0 0 5px', letterSpacing: '-0.02em' }}>Confirma tu solicitud</h2>
                      <p style={{ fontSize: 13, color: '#6b7a76', margin: 0 }}>Todo listo — revisa y envía</p>
                    </div>
                    <div style={{ background: '#f8fbf9', borderRadius: 14, padding: '16px', marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {[
                        { label: 'Seguro', value: form.interes },
                        { label: 'Oficina', value: form.sucursal },
                        { label: 'Nombre', value: form.nombre },
                        { label: 'Teléfono', value: form.telefono || '—' },
                        { label: 'Correo', value: form.email || '—' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                          <span style={{ fontSize: 12.5, color: '#9aaba5', fontWeight: 600 }}>{label}</span>
                          <span style={{ fontSize: 13, color: '#16201d', fontWeight: 600, textAlign: 'right' }}>{value}</span>
                        </div>
                      ))}
                    </div>
                    <button type="submit" disabled={sending}
                      style={{ width: '100%', padding: '15px', borderRadius: 13, border: 'none', cursor: sending ? 'wait' : 'pointer', background: sending ? '#6b7a76' : 'linear-gradient(135deg, #0F7A63 0%, #0a5b49 100%)', color: '#fff', fontSize: 15.5, fontWeight: 700, fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: sending ? 'none' : '0 8px 28px -6px rgba(15,122,99,0.55)', transition: 'all 0.2s' }}>
                      {sending ? 'Enviando…' : <><span>Quiero que me llamen</span><ChevronRight size={17} /></>}
                    </button>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', marginTop: 12 }}>
                      <ShieldCheck size={12} style={{ color: '#0F7A63', flexShrink: 0 }} />
                      <p style={{ fontSize: 11, color: '#9aaba5', margin: 0, textAlign: 'center', lineHeight: 1.45 }}>Tus datos están protegidos. Sin spam, solo te contactamos para asesorarte.</p>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── TRUST BAND ─── */}
      <div style={{ background: '#fff', borderBottom: '1px solid #e8ede9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '18px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 40, flexWrap: 'wrap' }}>
          {[{ icon: ShieldCheck, text: '50 años de experiencia' }, { icon: Users, text: '+2 millones de asegurados en España' }, { icon: Clock, text: 'Respuesta en menos de 24 h' }, { icon: Star, text: '4,8 / 5 en Google' }, { icon: Stethoscope, text: '+51.000 especialistas' }].map(({ icon: Icon, text }) => (
            <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <Icon size={14} style={{ color: '#0F7A63', flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: '#48574f', fontWeight: 500, whiteSpace: 'nowrap' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── LOGOS ─── */}
      <div ref={logosAnim.ref} className={`fade-up${logosAnim.inView ? ' visible' : ''}`} style={{ background: '#f8fbf9', borderBottom: '1px solid #e8ede9' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px', textAlign: 'center' }}>
          <p style={{ fontSize: 11.5, fontWeight: 700, color: '#b0bdb8', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 20 }}>Reconocidos por</p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 48, flexWrap: 'wrap', opacity: 0.5 }}>
            {['El País', 'El Mundo', 'Cinco Días', 'Expansión', 'idealista'].map(name => (
              <div key={name} style={{ fontSize: 16, fontWeight: 800, color: '#48574f', letterSpacing: '-0.02em', fontStyle: name === 'idealista' ? 'italic' : 'normal' }}>{name}</div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <div ref={stepsAnim.ref} style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div className={`fade-up${stepsAnim.inView ? ' visible' : ''}`} style={{ textAlign: 'center', marginBottom: 52 }}>
          <span style={{ display: 'inline-block', padding: '5px 14px', borderRadius: 999, background: '#e3f1ec', color: '#0F7A63', fontSize: 12, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 16 }}>Proceso</span>
          <h2 style={{ fontSize: 36, fontWeight: 800, color: '#16201d', margin: '0 0 12px', letterSpacing: '-0.02em' }}>Así de fácil funciona</h2>
          <p style={{ fontSize: 16, color: '#6b7a76', maxWidth: 460, margin: '0 auto' }}>Sin burocracia, sin esperas. De tu solicitud a tu cobertura en 3 pasos.</p>
        </div>
        <div className="steps-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { n: '01', emoji: '📋', title: 'Solicitas info', desc: 'Rellenas el formulario en menos de 60 segundos con tus datos de contacto.', color: '#0F7A63', delay: '0s' },
            { n: '02', emoji: '📞', title: 'Te llamamos', desc: 'Un asesor personal te contacta antes de 24h para entender tus necesidades.', color: '#0a5b49', delay: '0.1s' },
            { n: '03', emoji: '✅', title: 'Eliges tu plan', desc: 'Recibes opciones personalizadas. Tú decides, sin presiones y sin coste.', color: '#0a2f27', delay: '0.2s' },
          ].map(step => (
            <div key={step.n} className={`step-card fade-up${stepsAnim.inView ? ' visible' : ''}`}
              style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', border: '1px solid #e6eae8', position: 'relative', overflow: 'hidden', transitionDelay: step.delay }}>
              <div style={{ position: 'absolute', top: -24, right: -8, fontSize: 88, fontWeight: 900, color: '#f0f4f1', lineHeight: 1, userSelect: 'none', pointerEvents: 'none' }}>{step.n}</div>
              <div style={{ fontSize: 32, marginBottom: 16 }}>{step.emoji}</div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 999, background: step.color + '15', marginBottom: 14 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: step.color, letterSpacing: '0.06em' }}>PASO {step.n}</span>
              </div>
              <h3 style={{ fontSize: 19, fontWeight: 800, color: '#16201d', margin: '0 0 10px' }}>{step.title}</h3>
              <p style={{ fontSize: 14.5, color: '#6b7a76', lineHeight: 1.65, margin: 0 }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── TESTIMONIAL ─── */}
      <div style={{ background: '#fff', borderTop: '1px solid #e8ede9', borderBottom: '1px solid #e8ede9', padding: '56px 32px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 3, marginBottom: 20 }}>
            {[...Array(5)].map((_, i) => <Star key={i} size={18} fill="#f59e0b" stroke="none" />)}
          </div>
          <blockquote style={{ fontSize: 20, fontWeight: 600, color: '#16201d', lineHeight: 1.55, margin: '0 0 24px', letterSpacing: '-0.01em' }}>
            "Me llamaron a la mañana siguiente de solicitar el presupuesto. El asesor fue muy claro, sin letra pequeña. Ahora toda la familia está asegurada con DKV."
          </blockquote>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #0F7A63, #1a9e7e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, color: '#fff', fontSize: 15 }}>LP</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#16201d' }}>Laura P.</div>
              <div style={{ fontSize: 12, color: '#9aaba5' }}>Madrid · Cliente desde 2023</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── CTA ─── */}
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 32px' }}>
        <div ref={ctaAnim.ref} className={`cta-block fade-up${ctaAnim.inView ? ' visible' : ''}`}
          style={{ background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 100%)', borderRadius: 28, padding: '60px 56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, right: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
          <div style={{ position: 'relative' }}>
            <h2 style={{ fontSize: 32, fontWeight: 900, color: '#fff', margin: '0 0 10px', letterSpacing: '-0.02em' }}>¿Listo para proteger tu salud?</h2>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.65)', margin: 0 }}>Sin compromiso · Sin permanencia · Solo cobertura real.</p>
          </div>
          <button onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            style={{ padding: '17px 40px', borderRadius: 14, background: '#fff', color: '#0F7A63', fontSize: 15.5, fontWeight: 800, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', fontFamily: 'inherit', flexShrink: 0, position: 'relative' }}>
            Solicitar asesoría gratis →
          </button>
        </div>
      </div>

      <div style={{ borderTop: '1px solid #e6eae8', padding: '24px 32px', textAlign: 'center', background: '#fff' }}>
        <p style={{ fontSize: 12.5, color: '#b0bdb8', margin: 0 }}>
          © 2025 DKV Seguros de Salud · Todos los derechos reservados
        </p>
      </div>
    </div>
  )
}
