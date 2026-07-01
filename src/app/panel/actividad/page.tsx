'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Activity, UserPlus, Tag, MessageSquare, Bell, BellOff, Edit3, LogIn, ExternalLink } from 'lucide-react'

type Actividad = {
  id: string
  tipo: string
  descripcion: string
  lead_id: string | null
  lead_nombre: string | null
  usuario_email: string | null
  created_at: string
}

const TIPO_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  lead_nuevo:          { icon: UserPlus,      color: '#0F7A63', bg: '#e3f1ec', label: 'Nuevo lead' },
  lead_editado:        { icon: Edit3,         color: '#2b6fb0', bg: '#e6f0fa', label: 'Lead editado' },
  lead_tag:            { icon: Tag,           color: '#a8741a', bg: '#f8efd9', label: 'Etiqueta' },
  nota_agregada:       { icon: MessageSquare, color: '#6b4ab0', bg: '#f0eafa', label: 'Nota' },
  recordatorio_set:    { icon: Bell,          color: '#a8741a', bg: '#f8efd9', label: 'Recordatorio' },
  recordatorio_borrado:{ icon: BellOff,       color: '#9aaba5', bg: '#f0f4f1', label: 'Rec. borrado' },
  usuario_creado:      { icon: UserPlus,      color: '#0F7A63', bg: '#e3f1ec', label: 'Usuario creado' },
  sesion_inicio:       { icon: LogIn,         color: '#48574f', bg: '#f0f4f1', label: 'Inicio sesión' },
}

const FILTROS = ['Todos', 'Leads', 'Etiquetas', 'Notas', 'Recordatorios', 'Usuarios']
const FILTRO_TIPOS: Record<string, string[]> = {
  'Todos': [],
  'Leads': ['lead_nuevo', 'lead_editado'],
  'Etiquetas': ['lead_tag'],
  'Notas': ['nota_agregada'],
  'Recordatorios': ['recordatorio_set', 'recordatorio_borrado'],
  'Usuarios': ['usuario_creado', 'sesion_inicio'],
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'ahora mismo'
  if (min < 60) return `hace ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `hace ${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `hace ${d}d`
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })
}

export default function ActividadPage() {
  const router = useRouter()
  const [items, setItems] = useState<Actividad[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState('Todos')

  useEffect(() => {
    fetchActividad()
    const channel = supabase
      .channel('actividad-realtime')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actividad' }, payload => {
        setItems(prev => [payload.new as Actividad, ...prev])
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [])

  async function fetchActividad() {
    setLoading(true)
    const { data } = await supabase
      .from('actividad')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)
    setItems(data ?? [])
    setLoading(false)
  }

  const filtered = filtro === 'Todos' ? items : items.filter(i => FILTRO_TIPOS[filtro]?.includes(i.tipo))

  return (
    <div style={{ padding: '32px 36px', maxWidth: 860, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Actividad</h1>
        <p style={{ fontSize: 14, color: '#9aaba5', margin: 0 }}>Historial completo de acciones en la plataforma en tiempo real</p>
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 20, flexWrap: 'wrap' }}>
        {FILTROS.map(f => (
          <button key={f} onClick={() => setFiltro(f)}
            style={{
              padding: '7px 14px', borderRadius: 999, border: '1.5px solid', cursor: 'pointer', fontFamily: 'inherit',
              fontSize: 13, fontWeight: 600,
              borderColor: filtro === f ? '#0F7A63' : '#e2e8e4',
              background: filtro === f ? '#0F7A63' : '#fff',
              color: filtro === f ? '#fff' : '#6b7a76',
              transition: 'all 0.15s',
            }}>
            {f}
          </button>
        ))}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#0F7A63', animation: 'pulse 2s infinite' }} />
          <span style={{ fontSize: 12, color: '#9aaba5', fontWeight: 500 }}>Tiempo real activo</span>
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.3;} }`}</style>

      {/* Lista */}
      <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '48px', textAlign: 'center', color: '#9aaba5', fontSize: 14 }}>Cargando actividad…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '64px 32px', textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, borderRadius: 18, background: '#f0f4f1', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <Activity size={24} color="#c8d4ce" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 600, color: '#9aaba5', marginBottom: 4 }}>Sin actividad registrada</div>
            <div style={{ fontSize: 13, color: '#c8d4ce' }}>Las acciones del panel aparecerán aquí automáticamente</div>
          </div>
        ) : (
          filtered.map((item, i) => {
            const cfg = TIPO_CONFIG[item.tipo] ?? { icon: Activity, color: '#9aaba5', bg: '#f0f4f1', label: item.tipo }
            const Icon = cfg.icon
            return (
              <div key={item.id} style={{ display: 'flex', gap: 14, padding: '16px 20px', borderBottom: i < filtered.length - 1 ? '1px solid #f0f4f1' : 'none', alignItems: 'flex-start' }}>
                {/* Icon */}
                <div style={{ width: 36, height: 36, borderRadius: 10, background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                  <Icon size={15} color={cfg.color} />
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10.5, fontWeight: 700, color: cfg.color, background: cfg.bg, padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{cfg.label}</span>
                    {item.usuario_email && (
                      <span style={{ fontSize: 12, color: '#9aaba5', fontWeight: 500 }}>{item.usuario_email}</span>
                    )}
                  </div>
                  <p style={{ fontSize: 13.5, color: '#16201d', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>{item.descripcion}</p>
                  {item.lead_nombre && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5 }}>
                      <span style={{ fontSize: 12, color: '#9aaba5' }}>Lead:</span>
                      {item.lead_id ? (
                        <button onClick={() => router.push(`/panel/leads/${item.lead_id}`)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 3, color: '#0F7A63', fontSize: 12, fontWeight: 600, fontFamily: 'inherit', padding: 0 }}>
                          {item.lead_nombre} <ExternalLink size={10} />
                        </button>
                      ) : (
                        <span style={{ fontSize: 12, color: '#6b7a76', fontWeight: 600 }}>{item.lead_nombre}</span>
                      )}
                    </div>
                  )}
                </div>

                {/* Time */}
                <div style={{ fontSize: 12, color: '#b0bdb8', whiteSpace: 'nowrap', marginTop: 2, flexShrink: 0 }}>{timeAgo(item.created_at)}</div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
