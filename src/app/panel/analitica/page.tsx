'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { CountUp } from '@/components/charts'
import { Eye, Users, MousePointerClick, ArrowDownWideNarrow, Flame, Monitor, Smartphone, BarChart3, Radio, Filter, MapPin, Clock, Repeat } from 'lucide-react'

type Evt = {
  session_id: string
  tipo: 'view' | 'click' | 'scroll' | 'form_start' | 'form_submit'
  path: string
  xr: number | null
  yr: number | null
  scroll_pct: number | null
  vw: number | null
  created_at: string
  elemento: string | null
  referrer: string | null
  utm_source: string | null
  utm_medium: string | null
  utm_campaign: string | null
  pais: string | null
  ciudad: string | null
  visitante: string | null
  dur: number | null
}

type Rango = 1 | 7 | 30
type Device = 'todos' | 'escritorio' | 'movil'

const esMovil = (vw: number | null) => (vw ?? 9999) < 768

// Clasifica el origen legible de una visita
function origenDe(e: Evt): string {
  if (e.utm_source) return `${e.utm_source}${e.utm_campaign ? ` · ${e.utm_campaign}` : ''}`
  const r = (e.referrer || '').replace(/^www\./, '')
  if (!r) return 'Directo / sin referencia'
  if (/google\./.test(r)) return 'Google (búsqueda)'
  if (/(facebook|instagram|fb\.|meta)/.test(r)) return 'Meta (Facebook/Instagram)'
  if (/bing\./.test(r)) return 'Bing'
  return r
}

export default function AnaliticaPage() {
  const [eventos, setEventos] = useState<Evt[]>([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>(7)
  const [device, setDevice] = useState<Device>('todos')
  const [path, setPath] = useState<string>('')
  const [ahora, setAhora] = useState(0)

  useEffect(() => {
    async function load() {
      setAhora(Date.now())
      const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const { data } = await supabase
        .from('web_eventos')
        .select('*')
        .gte('created_at', desde)
        .order('created_at', { ascending: false })
        .limit(50000)
      setEventos((data ?? []) as Evt[])
      setLoading(false)
    }
    load()
  }, [])

  const filtrados = useMemo(() => {
    const corte = (ahora || Date.parse(eventos[0]?.created_at ?? '') || 0) - rango * 24 * 3600 * 1000
    return eventos.filter(e => {
      if (new Date(e.created_at).getTime() < corte) return false
      if (device === 'escritorio' && esMovil(e.vw)) return false
      if (device === 'movil' && !esMovil(e.vw)) return false
      return true
    })
  }, [eventos, rango, device, ahora])

  const paginas = useMemo(() => {
    const m = new Map<string, number>()
    filtrados.filter(e => e.tipo === 'view').forEach(e => m.set(e.path, (m.get(e.path) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)
  }, [filtrados])
  const pathActivo = path || paginas[0] || '/'

  const kpis = useMemo(() => {
    const views = filtrados.filter(e => e.tipo === 'view')
    const clicks = filtrados.filter(e => e.tipo === 'click')
    const scrolls = filtrados.filter(e => e.tipo === 'scroll' && e.scroll_pct != null)
    const sesiones = new Set(filtrados.map(e => e.session_id)).size
    const scrollMedio = scrolls.length ? Math.round(scrolls.reduce((a, e) => a + (e.scroll_pct ?? 0), 0) / scrolls.length) : 0
    return { visitas: views.length, sesiones, clics: clicks.length, scrollMedio }
  }, [filtrados])

  // Embudo: sesiones que vieron → empezaron formulario → enviaron (lead)
  const embudo = useMemo(() => {
    const sesionesVista = new Set(filtrados.filter(e => e.tipo === 'view').map(e => e.session_id))
    const sesionesForm = new Set(filtrados.filter(e => e.tipo === 'form_start').map(e => e.session_id))
    const sesionesLead = new Set(filtrados.filter(e => e.tipo === 'form_submit').map(e => e.session_id))
    const v = sesionesVista.size || 1
    return {
      visitaron: sesionesVista.size,
      empezaron: sesionesForm.size,
      enviaron: sesionesLead.size,
      pctEmpezaron: Math.round((sesionesForm.size / v) * 100),
      pctEnviaron: Math.round((sesionesLead.size / v) * 100),
    }
  }, [filtrados])

  // Fuentes de tráfico (por sesión)
  const fuentes = useMemo(() => {
    const porSesion = new Map<string, string>()
    filtrados.filter(e => e.tipo === 'view').forEach(e => { if (!porSesion.has(e.session_id)) porSesion.set(e.session_id, origenDe(e)) })
    const m = new Map<string, number>()
    porSesion.forEach(o => m.set(o, (m.get(o) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [filtrados])
  const maxFuente = fuentes[0]?.[1] ?? 1

  // Ciudades (por sesión)
  const ciudades = useMemo(() => {
    const porSesion = new Map<string, string>()
    filtrados.filter(e => e.tipo === 'view' && e.ciudad).forEach(e => { if (!porSesion.has(e.session_id)) porSesion.set(e.session_id, e.ciudad as string) })
    const m = new Map<string, number>()
    porSesion.forEach(c => m.set(c, (m.get(c) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [filtrados])
  const maxCiudad = ciudades[0]?.[1] ?? 1

  // Comportamiento: nuevos vs recurrentes, tiempo medio, rebote
  const comportamiento = useMemo(() => {
    const primeraVista = new Map<string, Evt>()
    filtrados.filter(e => e.tipo === 'view').forEach(e => { if (!primeraVista.has(e.session_id)) primeraVista.set(e.session_id, e) })
    let nuevos = 0, recurrentes = 0
    primeraVista.forEach(e => { if (e.visitante === 'recurrente') recurrentes++; else nuevos++ })
    const durs = filtrados.filter(e => e.tipo === 'scroll' && e.dur != null).map(e => e.dur as number)
    const tiempoMedio = durs.length ? Math.round(durs.reduce((a, b) => a + b, 0) / durs.length) : 0
    // Rebote: sesiones con 1 sola vista, sin clic ni form
    const sesiones = new Map<string, { vistas: number; interactuo: boolean }>()
    filtrados.forEach(e => {
      const s = sesiones.get(e.session_id) || { vistas: 0, interactuo: false }
      if (e.tipo === 'view') s.vistas++
      if (e.tipo === 'click' || e.tipo === 'form_start') s.interactuo = true
      sesiones.set(e.session_id, s)
    })
    let rebote = 0
    sesiones.forEach(s => { if (s.vistas <= 1 && !s.interactuo) rebote++ })
    const total = sesiones.size || 1
    return { nuevos, recurrentes, tiempoMedio, rebotePct: Math.round((rebote / total) * 100) }
  }, [filtrados])

  // Visitas por hora del día
  const porHora = useMemo(() => {
    const h = new Array(24).fill(0)
    filtrados.filter(e => e.tipo === 'view').forEach(e => { h[new Date(e.created_at).getHours()]++ })
    return h
  }, [filtrados])
  const maxHora = Math.max(1, ...porHora)

  const ranking = useMemo(() => {
    const m = new Map<string, number>()
    filtrados.filter(e => e.tipo === 'click' && e.elemento).forEach(e => m.set(e.elemento as string, (m.get(e.elemento as string) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [filtrados])
  const maxRank = ranking[0]?.[1] ?? 1

  const scrollDist = useMemo(() => {
    const s = filtrados.filter(e => e.tipo === 'scroll' && e.path === pathActivo && e.scroll_pct != null)
    const total = s.length || 1
    const tramo = (min: number) => Math.round((s.filter(e => (e.scroll_pct ?? 0) >= min).length / total) * 100)
    return { total: s.length, p25: tramo(25), p50: tramo(50), p75: tramo(75), p100: tramo(95) }
  }, [filtrados, pathActivo])

  const clicksPagina = useMemo(() => filtrados.filter(e => e.tipo === 'click' && e.path === pathActivo && e.xr != null && e.yr != null), [filtrados, pathActivo])

  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', padding: '20px 22px' }
  const chip = (activo: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    border: activo ? '1.5px solid #0F7A63' : '1.5px solid #dfe6e3',
    background: activo ? '#0F7A63' : '#fff', color: activo ? '#fff' : '#5c6b66', transition: 'all .15s',
  })
  const barra = (label: string, n: number, max: number, color: string) => (
    <div key={label}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, marginBottom: 3 }}>
        <span style={{ color: '#374542', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
        <span style={{ color, fontWeight: 800, flexShrink: 0 }}>{n}</span>
      </div>
      <div style={{ height: 7, background: '#eef2f0', borderRadius: 999 }}>
        <div style={{ width: `${(n / max) * 100}%`, height: '100%', background: color, borderRadius: 999 }} />
      </div>
    </div>
  )

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '4px 2px' }}>
      <style>{`
        @keyframes anUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        .an-card { animation: anUp 0.45s ease both }
      `}</style>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Analítica de la web</h1>
        <p style={{ fontSize: 13.5, color: '#9aaba5', margin: 0 }}>De dónde vienen, dónde hacen clic, hasta dónde bajan y cuántos acaban dejando sus datos. Solo cuenta a quien acepta cookies.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 18 }}>
        {([[1, 'Hoy'], [7, '7 días'], [30, '30 días']] as [Rango, string][]).map(([r, l]) => (
          <button key={r} onClick={() => setRango(r)} style={chip(rango === r)}>{l}</button>
        ))}
        <div style={{ width: 1, background: '#e4eae7', margin: '2px 6px' }} />
        {([['todos', 'Todo', BarChart3], ['escritorio', 'Escritorio', Monitor], ['movil', 'Móvil', Smartphone]] as [Device, string, React.ElementType][]).map(([d, l, Icon]) => (
          <button key={d} onClick={() => setDevice(d)} style={{ ...chip(device === d), display: 'flex', alignItems: 'center', gap: 6 }}>
            <Icon size={14} /> {l}
          </button>
        ))}
      </div>

      {loading ? <Loader label="Cargando analítica…" />
        : eventos.length === 0
          ? <EmptyState icon={Flame} title="Aún no hay datos" description="En cuanto los visitantes acepten las cookies y naveguen por ergopymes.com, aquí verás las visitas, el origen, los clics y el embudo. Suele tardar unos minutos en aparecer la primera sesión." />
          : (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
                {[
                  { icon: Eye, label: 'Visitas', value: kpis.visitas, color: '#2b6fb0', suffix: '' },
                  { icon: Users, label: 'Personas (sesiones)', value: kpis.sesiones, color: '#0F7A63', suffix: '' },
                  { icon: MousePointerClick, label: 'Clics', value: kpis.clics, color: '#a8741a', suffix: '' },
                  { icon: ArrowDownWideNarrow, label: 'Scroll medio', value: kpis.scrollMedio, color: '#7a4fb0', suffix: '%' },
                ].map((k, i) => (
                  <div key={k.label} className="an-card" style={{ ...card, animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <k.icon size={16} color={k.color} />
                      <span style={{ fontSize: 12, color: '#9aaba5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
                    </div>
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#16201d' }}><CountUp value={k.value} duration={800} suffix={k.suffix} /></div>
                  </div>
                ))}
              </div>

              {/* Embudo de conversión */}
              <div className="an-card" style={{ ...card, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                  <Filter size={17} color="#0F7A63" />
                  <b style={{ fontSize: 15, color: '#16201d' }}>Embudo: de visita a lead</b>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
                  {[
                    { label: 'Visitaron la web', v: embudo.visitaron, pct: 100, color: '#2b6fb0' },
                    { label: 'Empezaron el formulario', v: embudo.empezaron, pct: embudo.pctEmpezaron, color: '#a8741a' },
                    { label: 'Enviaron sus datos (lead)', v: embudo.enviaron, pct: embudo.pctEnviaron, color: '#0F7A63' },
                  ].map((s, i) => (
                    <div key={s.label} style={{ background: '#f7f9f8', borderRadius: 14, padding: '14px 16px', borderTop: `3px solid ${s.color}` }}>
                      <div style={{ fontSize: 11, color: '#9aaba5', fontWeight: 700, marginBottom: 6 }}>{i + 1}. {s.label}</div>
                      <div style={{ fontSize: 26, fontWeight: 800, color: '#16201d' }}>{s.v}</div>
                      <div style={{ fontSize: 12, color: s.color, fontWeight: 700 }}>{s.pct}% de las visitas</div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 12, color: '#9aaba5', margin: '12px 0 0' }}>Si muchos empiezan el formulario pero pocos lo envían, el problema está en el formulario (demasiados campos, dudas…).</p>
              </div>

              {/* Fuentes + Ciudades */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(300px,1fr))', gap: 16, marginBottom: 18 }}>
                <div className="an-card" style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <Radio size={16} color="#2b6fb0" />
                    <b style={{ fontSize: 14.5, color: '#16201d' }}>De dónde vienen</b>
                  </div>
                  {fuentes.length === 0 ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Sin datos aún.</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{fuentes.slice(0, 8).map(([o, n]) => barra(o, n, maxFuente, '#2b6fb0'))}</div>}
                </div>
                <div className="an-card" style={card}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                    <MapPin size={16} color="#c2762a" />
                    <b style={{ fontSize: 14.5, color: '#16201d' }}>Ciudades</b>
                  </div>
                  {ciudades.length === 0 ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Sin datos de ubicación aún (aparece en producción).</p>
                    : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{ciudades.slice(0, 8).map(([c, n]) => barra(c, n, maxCiudad, '#c2762a'))}</div>}
                </div>
              </div>

              {/* Comportamiento */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 14, marginBottom: 18 }}>
                {[
                  { icon: Repeat, label: 'Nuevos', value: comportamiento.nuevos, color: '#0F7A63', suffix: '' },
                  { icon: Repeat, label: 'Recurrentes', value: comportamiento.recurrentes, color: '#7a4fb0', suffix: '' },
                  { icon: Clock, label: 'Tiempo medio', value: comportamiento.tiempoMedio, color: '#2b6fb0', suffix: 's' },
                  { icon: ArrowDownWideNarrow, label: 'Rebote', value: comportamiento.rebotePct, color: '#c23a22', suffix: '%' },
                ].map((k, i) => (
                  <div key={k.label} className="an-card" style={{ ...card, animationDelay: `${i * 0.05}s` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <k.icon size={16} color={k.color} />
                      <span style={{ fontSize: 12, color: '#9aaba5', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{k.label}</span>
                    </div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: '#16201d' }}><CountUp value={k.value} duration={800} suffix={k.suffix} /></div>
                  </div>
                ))}
              </div>

              {/* Visitas por hora */}
              <div className="an-card" style={{ ...card, marginBottom: 18 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Clock size={16} color="#2b6fb0" />
                  <b style={{ fontSize: 14.5, color: '#16201d' }}>Visitas por hora del día</b>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 3, height: 90 }}>
                  {porHora.map((n, h) => (
                    <div key={h} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }} title={`${h}:00 — ${n} visitas`}>
                      <div style={{ width: '100%', height: `${(n / maxHora) * 70}px`, minHeight: n > 0 ? 3 : 0, background: '#2b6fb0', borderRadius: 3, opacity: 0.85 }} />
                      {h % 3 === 0 && <span style={{ fontSize: 9, color: '#9aaba5' }}>{h}h</span>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mapa de calor + scroll + ranking */}
              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }}>
                <div className="an-card" style={{ ...card, padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <Flame size={17} color="#c23a22" />
                    <b style={{ fontSize: 15, color: '#16201d' }}>Mapa de calor de clics</b>
                    <select value={pathActivo} onChange={e => setPath(e.target.value)}
                      style={{ marginLeft: 'auto', padding: '6px 10px', borderRadius: 8, border: '1px solid #dfe6e3', fontSize: 13, color: '#374542', background: '#fff', maxWidth: 240 }}>
                      {paginas.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <p style={{ fontSize: 12.5, color: '#9aaba5', margin: '0 0 12px' }}>
                    Zonas <b style={{ color: '#c23a22' }}>rojas</b> = más clics · <b style={{ color: '#2b6fb0' }}>azules</b> = menos. {clicksPagina.length} clics en esta página.
                  </p>
                  <Heatmap path={pathActivo} clicks={clicksPagina} />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div className="an-card" style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ArrowDownWideNarrow size={16} color="#7a4fb0" />
                      <b style={{ fontSize: 14.5, color: '#16201d' }}>Hasta dónde bajan</b>
                    </div>
                    {scrollDist.total === 0 ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Sin datos de scroll todavía.</p>
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                          {[['Empiezan', 100, '#0F7A63'], ['Llegan a ¼', scrollDist.p25, '#2b6fb0'], ['A la mitad', scrollDist.p50, '#a8741a'], ['A ¾', scrollDist.p75, '#c2762a'], ['Al final', scrollDist.p100, '#c23a22']].map(([l, v, c]) => (
                            <div key={l as string}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, marginBottom: 3 }}>
                                <span style={{ color: '#5c6b66', fontWeight: 600 }}>{l}</span>
                                <span style={{ color: '#16201d', fontWeight: 800 }}>{v}%</span>
                              </div>
                              <div style={{ height: 8, background: '#eef2f0', borderRadius: 999 }}>
                                <div style={{ width: `${v}%`, height: '100%', background: c as string, borderRadius: 999, transition: 'width .5s ease' }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>

                  <div className="an-card" style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <MousePointerClick size={16} color="#a8741a" />
                      <b style={{ fontSize: 14.5, color: '#16201d' }}>Lo más clicado</b>
                    </div>
                    {ranking.length === 0 ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Aún nadie ha hecho clic.</p>
                      : <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>{ranking.slice(0, 10).map(([el, n]) => barra(el, n, maxRank, '#d9a326'))}</div>}
                  </div>
                </div>
              </div>
            </>
          )}
    </div>
  )
}

function Heatmap({ path, clicks }: { path: string; clicks: Evt[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  const onLoad = () => {
    const wrap = wrapRef.current
    const iframe = iframeRef.current
    if (!wrap || !iframe) return
    const w = wrap.clientWidth
    let h = 2400
    try {
      const doc = iframe.contentDocument
      if (doc) h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)
    } catch { /* mismo dominio */ }
    iframe.style.height = `${h}px`
    setDims({ w, h })
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dims.w === 0) return
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, dims.w, dims.h)
    const radio = Math.max(28, dims.w * 0.035)
    clicks.forEach(c => {
      const x = (c.xr ?? 0) * dims.w
      const y = (c.yr ?? 0) * dims.h
      const g = ctx.createRadialGradient(x, y, 0, x, y, radio)
      g.addColorStop(0, 'rgba(0,0,0,0.18)')
      g.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(x, y, radio, 0, Math.PI * 2)
      ctx.fill()
    })
    const img = ctx.getImageData(0, 0, dims.w, dims.h)
    const d = img.data
    for (let i = 0; i < d.length; i += 4) {
      const a = d[i + 3]
      if (a === 0) continue
      const t = Math.min(1, a / 160)
      const [r, g, b] = calor(t)
      d[i] = r; d[i + 1] = g; d[i + 2] = b
      d[i + 3] = Math.min(220, a * 3)
    }
    ctx.putImageData(img, 0, 0)
  }, [clicks, dims])

  return (
    <div ref={wrapRef} style={{ position: 'relative', width: '100%', borderRadius: 12, overflow: 'hidden', border: '1px solid #eef2f0', maxHeight: 620, overflowY: 'auto', background: '#f7f9f8' }}>
      <iframe ref={iframeRef} src={path} onLoad={onLoad} title="Vista de la página" scrolling="no"
        style={{ width: '100%', border: 0, display: 'block', pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: dims.h, pointerEvents: 'none' }} />
    </div>
  )
}

function calor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.0, [43, 111, 176]], [0.4, [46, 170, 120]], [0.7, [230, 190, 40]], [1.0, [194, 58, 34]],
  ]
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const f = (t - t0) / (t1 - t0 || 1)
      return [Math.round(c0[0] + (c1[0] - c0[0]) * f), Math.round(c0[1] + (c1[1] - c0[1]) * f), Math.round(c0[2] + (c1[2] - c0[2]) * f)]
    }
  }
  return stops[stops.length - 1][1]
}
