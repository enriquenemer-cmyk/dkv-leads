'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

const TAGS = [
  { k: 'caliente', l: '🔥 Caliente' },
  { k: 'tibio', l: '🌤️ Tibio' },
  { k: 'frio', l: '❄️ Frío' },
] as const

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
const telOk = (t: string) => /^(\+?34)?[6789]\d{8}$/.test(t.replace(/[\s-]/g, ''))

export default function AppNuevoLead() {
  const router = useRouter()
  const [f, setF] = useState({ nombre: '', telefono: '', email: '', interes: '', tag: 'caliente' })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const set = (k: string, v: string) => { setF(p => ({ ...p, [k]: v })); setError('') }

  async function guardar(e: React.FormEvent) {
    e.preventDefault()
    if (!f.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!f.telefono.trim() && !f.email.trim()) { setError('Pon al menos teléfono o correo.'); return }
    if (f.telefono.trim() && !telOk(f.telefono)) { setError('Teléfono no válido (9 dígitos).'); return }
    if (f.email.trim() && !emailOk(f.email)) { setError('Correo no válido.'); return }
    setSaving(true)
    const { error: dbErr } = await supabase.from('leads').insert({
      nombre: f.nombre.trim(), telefono: f.telefono.trim() || null, email: f.email.trim() || null,
      interes: f.interes.trim() || null, tag: f.tag, fuente: 'manual',
    })
    setSaving(false)
    if (dbErr) { setError('No se pudo guardar. Revisa tu conexión.'); return }
    router.push('/app/leads')
  }

  const inp: React.CSSProperties = { width: '100%', padding: '14px 16px', borderRadius: 13, border: '1.5px solid #e2e8e4', background: '#fff', fontSize: 16, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const lbl: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, color: '#6b7a76', marginBottom: 7 }

  return (
    <div style={{ padding: '16px 16px 24px' }}>
      <Link href="/app/leads" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: '#6b7a76', textDecoration: 'none', fontSize: 14, fontWeight: 600, marginBottom: 14 }}>
        <ArrowLeft size={16} /> Leads
      </Link>
      <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '0 0 18px', letterSpacing: '-0.02em' }}>Nuevo lead</h1>

      <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {error && <div style={{ padding: '12px 14px', borderRadius: 12, background: '#fbe7e2', color: '#c23a22', fontSize: 13.5, fontWeight: 600 }}>{error}</div>}
        <div><label style={lbl}>Nombre *</label><input value={f.nombre} onChange={e => set('nombre', e.target.value)} placeholder="Nombre y apellidos" style={inp} /></div>
        <div><label style={lbl}>Teléfono</label><input value={f.telefono} onChange={e => set('telefono', e.target.value)} inputMode="tel" placeholder="600 000 000" style={inp} /></div>
        <div><label style={lbl}>Correo</label><input value={f.email} onChange={e => set('email', e.target.value)} type="email" inputMode="email" autoCapitalize="none" placeholder="correo@email.com" style={inp} /></div>
        <div><label style={lbl}>Interés</label><input value={f.interes} onChange={e => set('interes', e.target.value)} placeholder="Ej: Seguro de salud familiar" style={inp} /></div>
        <div>
          <label style={lbl}>Estado</label>
          <div style={{ display: 'flex', gap: 8 }}>
            {TAGS.map(t => {
              const active = f.tag === t.k
              return <button key={t.k} type="button" onClick={() => set('tag', t.k)}
                style={{ flex: 1, padding: '13px 4px', borderRadius: 12, border: `2px solid ${active ? '#0F7A63' : '#e6ebe8'}`, background: active ? '#e3f1ec' : '#fff', color: active ? '#0F7A63' : '#6b7a76', fontWeight: 700, fontSize: 13.5, fontFamily: 'inherit' }}>{t.l}</button>
            })}
          </div>
        </div>
        <button type="submit" disabled={saving}
          style={{ marginTop: 4, padding: '16px', borderRadius: 14, border: 'none', background: saving ? '#6b7a76' : 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 16, fontWeight: 800, fontFamily: 'inherit' }}>
          {saving ? 'Guardando…' : 'Guardar lead'}
        </button>
      </form>
    </div>
  )
}
