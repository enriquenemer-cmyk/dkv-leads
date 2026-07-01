'use client'
import { useState } from 'react'
import { supabase, Lead } from '@/lib/supabase'
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
    tag: lead?.tag ?? 'frio',
  })
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  function set(key: string, value: string) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es obligatorio.'); return }
    if (!form.telefono.trim() && !form.email.trim()) {
      setError('Ingresá al menos teléfono o correo.')
      return
    }
    setSaving(true)
    setError('')
    const data = {
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      interes: form.interes || null,
      tag: form.tag,
      fuente: 'manual',
    }
    if (editing && lead) {
      await supabase.from('leads').update(data).eq('id', lead.id)
      await logActividad('lead_editado', `Lead editado: ${form.nombre.trim()}`, { lead_id: lead.id, lead_nombre: form.nombre.trim() })
    } else {
      const { data: newLead } = await supabase.from('leads').insert(data).select('id').single()
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
            <div className="text-[13px] font-medium px-4 py-3 rounded-xl" style={{ background: '#fbe7e2', color: '#c23a22' }}>
              {error}
            </div>
          )}

          <div>
            <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Nombre completo *</label>
            <input
              value={form.nombre}
              onChange={(e) => set('nombre', e.target.value)}
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
                placeholder="+34 600 000 000"
              />
            </div>
            <div>
              <label className="block text-[12.5px] font-semibold text-[#6b7a76] mb-1.5">Correo</label>
              <input
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
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
              className="w-full px-3.5 py-2.5 rounded-xl border border-[#d9e0dd] bg-[#fbfcfb] text-[14px] text-[#16201d] focus:outline-none focus:ring-2 focus:ring-[#0F7A63]/30 focus:border-[#0F7A63]"
            >
              <option value="">Seleccioná un interés</option>
              {INTERESES.map((i) => <option key={i} value={i}>{i}</option>)}
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
