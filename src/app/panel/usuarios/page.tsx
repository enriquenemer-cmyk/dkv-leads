'use client'
import { useEffect, useState } from 'react'
import { UserPlus, Mail, Calendar, Clock, X, Eye, EyeOff, Check, ShieldCheck, Lock } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { Loader } from '@/components/Loader'
import { EmptyState } from '@/components/EmptyState'
import { PageHero } from '@/components/PageHero'
import { SECCIONES } from '@/lib/secciones'

type User = { id: string; email: string; nombre: string; created_at: string; last_sign_in_at: string | null; rol?: string }

const card = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '24px', boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }

export default function UsuariosPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ email: '', password: '', nombre: '' })
  const [showPass, setShowPass] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [soyAdmin, setSoyAdmin] = useState(false)
  // Secciones a las que tendrá acceso el nuevo asesor (por defecto: todas menos gestión de asesores)
  const [permisos, setPermisos] = useState<string[]>(SECCIONES.filter(s => s.href !== '/panel/usuarios').map(s => s.href))
  const togglePermiso = (href: string) => setPermisos(p => p.includes(href) ? p.filter(x => x !== href) : [...p, href])
  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data: { session } } = await supabase.auth.getSession()
    const token = session?.access_token
    const res = await fetch('/api/list-users', { headers: token ? { Authorization: `Bearer ${token}` } : {} })
    const json = await res.json()
    const list: User[] = json.users ?? []
    setUsers(list)
    // Si aún nadie tiene rol (columna sin crear), tratamos a todos como admin (transición).
    // Buscamos al usuario actual por id O por email (robusto ante desajustes).
    const emailActual = (session?.user?.email ?? '').toLowerCase()
    const hayRoles = list.some(u => u.rol)
    const yo = list.find(u => u.id === session?.user?.id || (u.email ?? '').toLowerCase() === emailActual)
    // Admin si: no hay roles aún, o su rol es admin, o (por seguridad) no se encontró su fila.
    setSoyAdmin(!hayRoles || yo?.rol === 'admin' || !yo)
    setLoading(false)
  }

  async function createUser(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSaving(true)
    const { data: { session } } = await supabase.auth.getSession()
    const res = await fetch('/api/create-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ ...form, permisos }),
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { setError(json.error); return }
    setSuccess(`Usuario ${form.email} creado correctamente.`)
    setForm({ email: '', password: '', nombre: '' })
    setShowModal(false)
    fetchUsers()
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 900, margin: '0 auto' }}>
      <PageHero title="Asesores" subtitle="Gestiona los usuarios con acceso al panel" right={
        soyAdmin ? (
          <button onClick={() => { setShowModal(true); setError('') }}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 20px', borderRadius: 13, background: '#fff', color: '#0a5b49', border: 'none', fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 8px 20px -6px rgba(0,0,0,0.3)' }}>
            <UserPlus size={15} /> Nuevo asesor
          </button>
        ) : (
          <div title="Solo un administrador puede crear asesores" style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '11px 16px', borderRadius: 13, background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, border: '1px solid rgba(255,255,255,0.2)' }}>
            <Lock size={14} /> Solo administradores
          </div>
        )
      } />

      {success && (
        <div style={{ marginBottom: 20, padding: '13px 16px', borderRadius: 13, background: '#e3f1ec', border: '1px solid #b6ddd0', color: '#0F7A63', fontSize: 13.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Check size={15} /> {success}
        </div>
      )}

      <div style={card}>
        {loading ? (
          <Loader label="Cargando asesores…" />
        ) : users.length === 0 ? (
          <EmptyState icon={UserPlus} title="No hay asesores todavía" description="Crea el primer asesor con el botón de arriba para que pueda acceder al panel." />
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Asesor', 'Correo', 'Rol', 'Alta'].map(h => (
                  <th key={h} style={{ fontSize: 11, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 12px 14px', textAlign: 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderTop: i === 0 ? 'none' : '1px solid #f0f4f1' }}>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#fff', fontSize: 13, flexShrink: 0 }}>
                        {(u.nombre?.[0] ?? u.email?.[0] ?? 'A').toUpperCase()}
                      </div>
                      <span style={{ fontSize: 14, fontWeight: 600, color: '#16201d' }}>{u.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Mail size={12} color="#9aaba5" />
                      <span style={{ fontSize: 13.5, color: '#6b7a76' }}>{u.email}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    {u.rol === 'admin' ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700, color: '#0F7A63', background: '#e3f1ec', padding: '3px 10px', borderRadius: 999 }}>
                        <ShieldCheck size={12} /> Admin
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#6b7a76', background: '#f0f4f1', padding: '3px 10px', borderRadius: 999 }}>Asesor</span>
                    )}
                  </td>
                  <td style={{ padding: '14px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Calendar size={12} color="#9aaba5" />
                      <span style={{ fontSize: 13, color: '#9aaba5' }}>{new Date(u.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal crear usuario */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
          <div style={{ background: '#fff', borderRadius: 22, padding: '32px', width: '100%', maxWidth: 420, boxShadow: '0 40px 80px -20px rgba(0,0,0,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <div>
                <h2 style={{ fontSize: 19, fontWeight: 800, color: '#16201d', margin: '0 0 3px', letterSpacing: '-0.02em' }}>Nuevo asesor</h2>
                <p style={{ fontSize: 13, color: '#9aaba5', margin: 0 }}>Crea acceso al panel para un asesor</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9aaba5', padding: 4 }}><X size={18} /></button>
            </div>

            {error && (
              <div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 11, background: '#fef0ed', border: '1px solid #fbd4cb', color: '#c23a22', fontSize: 13, fontWeight: 500 }}>{error}</div>
            )}

            <form onSubmit={createUser} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {[
                { key: 'nombre', label: 'Nombre', placeholder: 'Ej: Ana Martínez', type: 'text' },
                { key: 'email', label: 'Correo electrónico', placeholder: 'asesor@dkv.es', type: 'email' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7a76', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{f.label}</label>
                  <input value={form[f.key as keyof typeof form]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                    type={f.type} placeholder={f.placeholder} required={f.key === 'email'}
                    style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                </div>
              ))}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7a76', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Contraseña</label>
                <div style={{ position: 'relative' }}>
                  <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                    type={showPass ? 'text' : 'password'} required placeholder="Mínimo 6 caracteres"
                    style={{ width: '100%', padding: '12px 40px 12px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const }} />
                  <button type="button" onClick={() => setShowPass(v => !v)}
                    style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#9aaba5' }}>
                    {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              {/* Permisos: a qué secciones tendrá acceso */}
              <div>
                <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: '#6b7a76', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Acceso a secciones</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SECCIONES.map(s => {
                    const on = permisos.includes(s.href)
                    return (
                      <button key={s.href} type="button" onClick={() => togglePermiso(s.href)}
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                          border: `1.5px solid ${on ? '#0F7A63' : '#e2e8e4'}`, background: on ? '#e3f1ec' : '#fff' }}>
                        <span style={{ width: 18, height: 18, borderRadius: 6, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: on ? '#0F7A63' : '#fff', border: on ? 'none' : '1.5px solid #cdd8d3' }}>
                          {on && <Check size={12} color="#fff" />}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: on ? '#0F7A63' : '#6b7a76' }}>{s.label}</span>
                      </button>
                    )
                  })}
                </div>
                <p style={{ fontSize: 11.5, color: '#9aaba5', margin: '8px 0 0' }}>El asesor solo verá y podrá abrir las secciones marcadas.</p>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                  Cancelar
                </button>
                <button type="submit" disabled={saving}
                  style={{ flex: 1, padding: '12px', borderRadius: 12, border: 'none', background: saving ? '#9aaba5' : '#0F7A63', color: '#fff', fontSize: 14, fontWeight: 700, cursor: saving ? 'wait' : 'pointer', fontFamily: 'inherit' }}>
                  {saving ? 'Creando…' : 'Crear asesor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
