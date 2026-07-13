'use client'
import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { PageHero } from '@/components/PageHero'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { MailOpen, ChevronDown, ChevronRight, MousePointerClick, MailX, Send, Mail } from 'lucide-react'

type Envio = {
  id: string
  campania_id: string | null
  campania: string | null
  tipo: string | null
  email: string | null
  nombre: string | null
  enviado_at: string | null
  entregado_at: string | null
  abierto_at: string | null
  click_at: string | null
  rebotado_at: string | null
  spam_at: string | null
}

const TIPO_LABEL: Record<string, string> = { informacion: 'Información', promocion: 'Promoción', compensacion: 'Compensación', sorteo: 'Sorteo' }

// Estado del correo derivado de las fechas (sin degradar).
function estadoDe(e: Envio): { label: string; color: string; bg: string } {
  if (e.spam_at) return { label: 'Spam', color: '#8a1f1f', bg: '#fbe0e0' }
  if (e.rebotado_at) return { label: 'Rebotado', color: '#a33', bg: '#fbe7e2' }
  if (e.click_at) return { label: 'Hizo clic', color: '#6b4ab0', bg: '#f0eafa' }
  if (e.abierto_at) return { label: 'Abierto', color: '#0F7A63', bg: '#e3f1ec' }
  if (e.entregado_at) return { label: 'Entregado', color: '#2b6fb0', bg: '#eaf3ff' }
  return { label: 'Enviado', color: '#6b7a76', bg: '#f0f4f1' }
}

function fecha(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export default function CampaniasPage() {
  const [envios, setEnvios] = useState<Envio[]>([])
  const [loading, setLoading] = useState(true)
  const [abierta, setAbierta] = useState<string | null>(null)

  useEffect(() => {
    fetchEnvios()
    const ch = supabase.channel('email_envios_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'email_envios' }, fetchEnvios)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchEnvios() {
    const { data } = await supabase.from('email_envios').select('*').order('enviado_at', { ascending: false }).limit(5000)
    if (data) setEnvios(data as Envio[])
    setLoading(false)
  }

  // Agrupamos por campania_id.
  const campanias = useMemo(() => {
    const map = new Map<string, Envio[]>()
    for (const e of envios) {
      const k = e.campania_id || e.id
      if (!map.has(k)) map.set(k, [])
      map.get(k)!.push(e)
    }
    return Array.from(map.entries()).map(([id, filas]) => {
      const total = filas.length
      const abiertos = filas.filter((f) => f.abierto_at).length
      const clics = filas.filter((f) => f.click_at).length
      const rebotes = filas.filter((f) => f.rebotado_at).length
      const entregados = filas.filter((f) => f.entregado_at).length
      return {
        id, filas,
        asunto: filas[0]?.campania || 'Campaña',
        tipo: filas[0]?.tipo || '',
        fecha: filas[0]?.enviado_at || null,
        total, abiertos, clics, rebotes, entregados,
        tasaApertura: total ? Math.round((abiertos / total) * 100) : 0,
      }
    }).sort((a, b) => new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime())
  }, [envios])

  const stat = (icon: React.ReactNode, n: number, label: string, color: string) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <span style={{ color }}>{icon}</span>
      <span style={{ fontSize: 14, fontWeight: 800, color: '#16201d' }}>{n}</span>
      <span style={{ fontSize: 12.5, color: '#9aaba5' }}>{label}</span>
    </div>
  )

  return (
    <div style={{ padding: '32px 36px', maxWidth: 980, margin: '0 auto' }}>
      <PageHero title="Resultados de correos" subtitle="Aperturas, clics y rebotes de tus campañas de email marketing" />

      {loading ? (
        <Loader label="Cargando resultados…" />
      ) : campanias.length === 0 ? (
        <EmptyState icon={MailOpen} title="Aún no hay envíos registrados"
          description="Cuando envíes una campaña desde Email Marketing, aquí verás cuántas personas la abrieron, hicieron clic y demás. (Requiere el rastreo activado en Resend.)" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {campanias.map((c) => {
            const abierta_ = abierta === c.id
            return (
              <div key={c.id} style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
                <button onClick={() => setAbierta(abierta_ ? null : c.id)}
                  style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        {c.tipo && <span style={{ fontSize: 10.5, fontWeight: 700, color: '#0F7A63', background: '#e3f1ec', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{TIPO_LABEL[c.tipo] || c.tipo}</span>}
                        <span style={{ fontSize: 12, color: '#9aaba5' }}>{fecha(c.fecha)}</span>
                      </div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.asunto}</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: '#0F7A63', lineHeight: 1 }}>{c.tasaApertura}%</div>
                        <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 600 }}>apertura</div>
                      </div>
                      {abierta_ ? <ChevronDown size={18} color="#9aaba5" /> : <ChevronRight size={18} color="#9aaba5" />}
                    </div>
                  </div>

                  {/* Barra de apertura */}
                  <div style={{ height: 8, borderRadius: 999, background: '#eef2f0', marginTop: 12, overflow: 'hidden' }}>
                    <div style={{ width: `${c.tasaApertura}%`, height: '100%', background: 'linear-gradient(90deg,#12a07f,#0F7A63)', borderRadius: 999 }} />
                  </div>

                  {/* Métricas */}
                  <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 14 }}>
                    {stat(<Send size={15} />, c.total, 'enviados', '#6b7a76')}
                    {stat(<Mail size={15} />, c.entregados, 'entregados', '#2b6fb0')}
                    {stat(<MailOpen size={15} />, c.abiertos, 'abiertos', '#0F7A63')}
                    {stat(<MousePointerClick size={15} />, c.clics, 'clics', '#6b4ab0')}
                    {stat(<MailX size={15} />, c.rebotes, 'rebotes', '#c23a22')}
                  </div>
                </button>

                {/* Detalle por destinatario */}
                {abierta_ && (
                  <div style={{ borderTop: '1px solid #f0f4f1' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr', padding: '10px 22px', background: '#f8fbf9', fontSize: 11, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      <span>Contacto</span><span>Estado</span><span>Abierto</span>
                    </div>
                    {c.filas.map((f) => {
                      const est = estadoDe(f)
                      return (
                        <div key={f.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1.3fr', padding: '11px 22px', borderTop: '1px solid #f5f7f5', alignItems: 'center' }}>
                          <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre || '—'}</div>
                            <div style={{ fontSize: 12, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.email}</div>
                          </div>
                          <span><span style={{ fontSize: 11.5, fontWeight: 700, color: est.color, background: est.bg, padding: '3px 10px', borderRadius: 999 }}>{est.label}</span></span>
                          <span style={{ fontSize: 12.5, color: '#6b7a76' }}>{fecha(f.abierto_at)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
