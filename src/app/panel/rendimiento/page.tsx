'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { Avatar } from '@/components/Avatar'
import { CountUp } from '@/components/charts'
import { PageHero } from '@/components/PageHero'
import { Trophy, UserPlus, MessageSquare, Bell, Award } from 'lucide-react'

type Act = { tipo: string; usuario_email: string | null; descripcion: string; created_at: string }
type Stats = {
  email: string
  nombre: string
  total: number
  nuevos: number
  notas: number
  recordatorios: number
  cierres: number
  ultima: string | null
}

export default function RendimientoPage() {
  const [acts, setActs] = useState<Act[]>([])
  const [nombres, setNombres] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [{ data: a }, { data: ases }] = await Promise.all([
        supabase.from('actividad').select('tipo,usuario_email,descripcion,created_at').order('created_at', { ascending: false }).limit(3000),
        supabase.from('asesores').select('email,nombre'),
      ])
      if (a) setActs(a as Act[])
      const map: Record<string, string> = {}
      ;(ases ?? []).forEach((u: { email: string; nombre: string | null }) => { if (u.email) map[u.email] = u.nombre || u.email })
      setNombres(map)
      setLoading(false)
    }
    load()
  }, [])

  const porAsesor = new Map<string, Stats>()
  for (const a of acts) {
    const email = a.usuario_email || 'Sin identificar'
    if (!porAsesor.has(email)) {
      porAsesor.set(email, { email, nombre: nombres[email] || email, total: 0, nuevos: 0, notas: 0, recordatorios: 0, cierres: 0, ultima: null })
    }
    const s = porAsesor.get(email)!
    s.total++
    if (a.tipo === 'lead_nuevo') s.nuevos++
    if (a.tipo === 'nota_agregada') s.notas++
    if (a.tipo === 'recordatorio_set') s.recordatorios++
    if (a.tipo === 'lead_tag' && a.descripcion.includes('"cliente"')) s.cierres++
    if (!s.ultima || a.created_at > s.ultima) s.ultima = a.created_at
  }
  const ranking = [...porAsesor.values()].sort((a, b) => b.cierres - a.cierres || b.total - a.total)

  const card = { background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', padding: '20px 22px' }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1000, margin: '0 auto' }}>
      <style>{`
        @keyframes rendUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        .rend-card { animation: rendUp 0.45s ease both; transition: box-shadow 0.18s ease }
        .rend-card:hover { box-shadow: 0 12px 28px -14px rgba(10,47,39,0.22) }
      `}</style>
      <PageHero title="Rendimiento del equipo" subtitle="Actividad de cada asesor: leads creados, seguimientos y cierres." />

      {loading ? <Loader label="Calculando rendimiento…" />
        : ranking.length === 0
          ? <EmptyState icon={Trophy} title="Sin datos de rendimiento" description="Cuando los asesores empiecen a trabajar leads (crear, anotar, cerrar), sus métricas aparecerán aquí." />
          : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {ranking.map((s, i) => (
                <div key={s.email} className="rend-card" style={{ ...card, display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap', borderLeft: i === 0 ? '3px solid #d9a326' : '3px solid transparent', animationDelay: `${i * 0.06}s` }}>
                  <div style={{ position: 'relative' }}>
                    <Avatar nombre={s.nombre} size={46} />
                    {i === 0 && <div style={{ position: 'absolute', top: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#f8efd9', border: '1px solid #ecdcae', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Award size={12} color="#a8741a" /></div>}
                  </div>
                  <div style={{ minWidth: 150, flex: 1 }}>
                    <div style={{ fontSize: 15, fontWeight: 700, color: '#16201d' }}>{s.nombre}</div>
                    <div style={{ fontSize: 12, color: '#9aaba5' }}>
                      {s.total} acciones{s.ultima ? ` · última ${new Date(s.ultima).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}` : ''}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
                    {[
                      { icon: Trophy, label: 'Cierres', value: s.cierres, color: '#0F7A63' },
                      { icon: UserPlus, label: 'Leads', value: s.nuevos, color: '#2b6fb0' },
                      { icon: MessageSquare, label: 'Notas', value: s.notas, color: '#6b7a76' },
                      { icon: Bell, label: 'Recordat.', value: s.recordatorios, color: '#a8741a' },
                    ].map(m => (
                      <div key={m.label} style={{ textAlign: 'center', minWidth: 56 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <m.icon size={13} color={m.color} />
                          <span style={{ fontSize: 19, fontWeight: 800, color: '#16201d' }}><CountUp value={m.value} duration={700} /></span>
                        </div>
                        <div style={{ fontSize: 10.5, color: '#9aaba5', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', marginTop: 1 }}>{m.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
    </div>
  )
}
