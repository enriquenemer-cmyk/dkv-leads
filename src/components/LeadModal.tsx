'use client'
import { useState } from 'react'
import { supabase, Lead, SUCURSALES, encodeFuente, fuenteOrigen, leadSucursal } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { X } from 'lucide-react'

const INTERESES = ['Seguro de salud', 'Hospitalización', 'Seguro dental', 'Reembolso']
const TAGS = ['frio', 'tibio', 'caliente', 'cliente'] as const

type Props = {
  onClose: () => void
  onSaved: () => void
  lead?: Lead | null
}

export function LeadModal({ onClose, onSaved, lead }: Props) {
  const editing = !!lead
  const [form, setForm] = useState({
    nombre: lead?.nombre ?? '',
    telefono: lead?.telefono ?? '',
    email: lead?.email ?? '',
    interes: lead?.interes ?? '',
    sucursal: (lead ? leadSucursal(lead) : '') ?? '',
    tag: lead?.tag ?? 'frio',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [dup, setDup] = useState<{ id: string; nombre: string } | null>(null)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
    setDup(null)
  }

  const emailValido = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
  const telefonoValido = (t: string) => /^(\+?34)?[6789]\d{8}$/.test(t.replace(/[\s-]/g, ''))

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    save(false)
  }

  async function save(force: boolean) {
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.telefono.trim() && !form.email.trim()) {
      setError('Introduce al menos teléfono o correo.')
      return
    }
    if (form.telefono.trim() && !telefonoValido(form.telefono)) {
      setError('El teléfono no es válido (número español de 9 dígitos).')
      return
    }
    if (form.email.trim() && !emailValido(form.email)) {
      setError('El correo electrónico no tiene un formato válido.')
      return
    }
    setSaving(true)
    setError('')
    setDup(null)

    // Detección de duplicados: avisa si ya existe un lead con el mismo teléfono o correo
    if (!force) {
      const conds: string[] = []
      if (form.telefono.trim()) conds.push(`telefono.eq.${form.telefono.trim()}`)
      if (form.email.trim()) conds.push(`email.eq.${form.email.trim()}`)
      if (conds.length) {
        const { data: existentes } = await supabase.from('leads').select('id,nombre').or(conds.join(',')).limit(5)
        const otro = (existentes ?? []).find((x) => x.id !== lead?.id)
        if (otro) { setSaving(false); setDup(otro as { id: string; nombre: string }); return }
      }
    }
    const origen = editing && lead ? (fuenteOrigen(lead.fuente) || 'manual') : 'manual'
    const data = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      interes: form.interes || null,
      tag: form.tag,
      fuente: encodeFuente(origen, form.sucursal),
    }
    if (editing && lead) {
      const { error: dbErr } = await supabase.from('leads').update(data).eq('id', lead.id)
      if (dbErr) { setSaving(false); setError('No se pudo guardar. Revisa tu conexión e inténtalo de nuevo.'); return }
      await logActividad('lead_editado', `Lead editado: ${form.nombre.trim()}`, { lead_id: lead.id, lead_nombre: form.nombre.trim() })
    } else {
      const { data: newLead, error: dbErr } = await supabase.from('leads').insert(data).select('id').single()
      if (dbErr) { setSaving(false); setError('No se pudo crear el lead. Revisa tu conexión e inténtalo de nuevo.'); return }
      await logActividad('lead_nuevo', `Nuevo lead manual: ${form.nombre.trim()}`, { lead_id: newLead?.id, lead_nombre: form.nombre.trim() })
    }
    setSaving(false)
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,47,39,0.45)' }}>
      <div className="bg-white rounded-[20px] w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-7 pt-6 pb-4 border-b border-[#e6eae8]">
          <h2 className="font-bold text-[#16201d] text-lg">{editing ? 'Editar lead' : 'Nuevo lead manual'}</h2>
          <button onClick={onClose} className="text-[#6b7a76] hover:text-[#16201d] transition-colors"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="px-7 py-5 space-y-4">
          {error && (
            <div id="lead-error" role="alert" className="text-[13px] font-medium px-4 py-3 rounded-xl" style={{ background: '#fbe7e2', color: '#c23a22' }}>
              {error}
            </div>
          )}

          {dup && (
            <div className="px-4 py-3 rounded-xl" style={{ background: '#f8efd9', border: '1px solid #ecdcae' }}>
              <div className="text-[13px] font-semibold" style={{ color: '#a8741a' }}>⚠️ Posible duplicado</div>
              <div className="text-[12.5px] mt-1" style={{ color: '#7a5c10' }}>
                Ya existe un lead con este teléfono o correo: <b>{dup.nombre}</b>.
              </div>
              <div className="flex gap-2 mt-2.5">
                <a href={`/panel/leads/${dup.id}`} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#fff', border: '1px solid #ecdcae', color: '#a8741a', textDecoration: 'none' }}>
                  Ver lead existente
                </a>
                <button type="button" onClick={() => save(true)} className="text-[12px] font-semibold px-3 py-1.5 rounded-lg" style={{ background: '#a8741a', color: '#fff', border: 'none', cursor: 'pointer' }}>
                  Crear de todas formas
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Nombre completo *</label>
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
              aria-label="Nombre completo"
              aria-describedby={error ? 'lead-error' : undefined}
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
              placeholder="María García"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Teléfono</label>
              <input
                value={form.telefono}
                onChange={(e) => set('telefono', e.target.value)}
                aria-label="Teléfono"
                aria-describedby={error ? 'lead-error' : undefined}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
                placeholder="+34 600 000 000"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Correo</label>
              <input
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
                aria-label="Correo"
                aria-describedby={error ? 'lead-error' : undefined}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
                placeholder="maria@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Interés</label>
            <select
              value={form.interes}
              onChange={(e) => set('interes', e.target.value)}
              aria-label="Interés"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
            >
              <option value="">Selecciona un interés</option>
              {INTERESES.map((i) => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Sucursal</label>
            <select
              value={form.sucursal}
              onChange={(e) => set('sucursal', e.target.value)}
              aria-label="Sucursal"
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
            >
              <option value="">Sin asignar</option>
              {SUCURSALES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Estado</label>
            <div className="flex gap-2 flex-wrap">
              {TAGS.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => set('tag', t)}
                  className="px-3.5 py-1.5 rounded-full text-[12.5px] font-semibold border-2 transition-all"
                  style={form.tag === t
                    ? { borderColor: '#0F7A63', background: '#e3f1ec', color: '#0F7A63' }
                    : { borderColor: '#d9e0dd', background: 'transparent', color: '#6b7a76' }}
                >
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl border border-[#d9e0dd] text-[14px] font-semibold text-[#6b7a76] hover:bg-[#f1f4f2] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-[14px] font-bold text-white transition-colors"
              style={{ background: saving ? '#6b7a76' : '#0F7A63' }}
            >
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear lead'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
