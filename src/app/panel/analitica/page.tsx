'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { EmptyState } from '@/components/EmptyState'
import { Loader } from '@/components/Loader'
import { CountUp } from '@/components/charts'
import { Eye, Users, MousePointerClick, ArrowDownWideNarrow, Flame, Monitor, Smartphone, BarChart3 } from 'lucide-react'

type Evt = {
  session_id: string
  tipo: 'view' | 'click' | 'scroll'
  path: string
  xr: number | null
  yr: number | null
  scroll_pct: number | null
  vw: number | null
  created_at: string
  elemento: string | null
}

type Rango = 1 | 7 | 30
type Device = 'todos' | 'escritorio' | 'movil'

const esMovil = (vw: number | null) => (vw ?? 9999) < 768

export default function AnaliticaPage() {
  const [eventos, setEventos] = useState<Evt[]>([])
  const [loading, setLoading] = useState(true)
  const [rango, setRango] = useState<Rango>(7)
  const [device, setDevice] = useState<Device>('todos')
  const [path, setPath] = useState<string>('')
  const [ahora, setAhora] = useState(0) // sello de tiempo capturado al cargar (evita impureza en render)

  useEffect(() => {
    async function load() {
      setAhora(Date.now())
      const desde = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
      const { data } = await supabase
        .from('web_eventos')
        .select('session_id,tipo,path,xr,yr,scroll_pct,vw,elemento,created_at')
        .gte('created_at', desde)
        .order('created_at', { ascending: false })
        .limit(50000)
      setEventos((data ?? []) as Evt[])
      setLoading(false)
    }
    load()
  }, [])

  // Filtro por rango de fechas y dispositivo
  const filtrados = useMemo(() => {
    const corte = (ahora || Date.parse(eventos[0]?.created_at ?? '') || 0) - rango * 24 * 3600 * 1000
    return eventos.filter(e => {
      if (new Date(e.created_at).getTime() < corte) return false
      if (device === 'escritorio' && esMovil(e.vw)) return false
      if (device === 'movil' && !esMovil(e.vw)) return false
      return true
    })
  }, [eventos, rango, device, ahora])

  // Páginas ordenadas por nº de visitas (para el selector y el mapa de calor)
  const paginas = useMemo(() => {
    const m = new Map<string, number>()
    filtrados.filter(e => e.tipo === 'view').forEach(e => m.set(e.path, (m.get(e.path) ?? 0) + 1))
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([p]) => p)
  }, [filtrados])

  // Página seleccionada para el mapa de calor (por defecto, la más visitada)
  const pathActivo = path || paginas[0] || '/'

  // KPIs
  const kpis = useMemo(() => {
    const views = filtrados.filter(e => e.tipo === 'view')
    const clicks = filtrados.filter(e => e.tipo === 'click')
    const scrolls = filtrados.filter(e => e.tipo === 'scroll' && e.scroll_pct != null)
    const sesiones = new Set(filtrados.map(e => e.session_id)).size
    const scrollMedio = scrolls.length
      ? Math.round(scrolls.reduce((a, e) => a + (e.scroll_pct ?? 0), 0) / scrolls.length)
      : 0
    return { visitas: views.length, sesiones, clics: clicks.length, scrollMedio }
  }, [filtrados])

  // Ranking de elementos más clicados
  const ranking = useMemo(() => {
    const m = new Map<string, number>()
    filtrados.filter(e => e.tipo === 'click' && e.elemento).forEach(e => {
      const k = e.elemento as string
      m.set(k, (m.get(k) ?? 0) + 1)
    })
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }, [filtrados])
  const maxRank = ranking[0]?.[1] ?? 1

  // Distribución de scroll de la página activa (qué % de gente llega a cada tramo)
  const scrollDist = useMemo(() => {
    const s = filtrados.filter(e => e.tipo === 'scroll' && e.path === pathActivo && e.scroll_pct != null)
    const total = s.length || 1
    const tramo = (min: number) => Math.round((s.filter(e => (e.scroll_pct ?? 0) >= min).length / total) * 100)
    return { total: s.length, p25: tramo(25), p50: tramo(50), p75: tramo(75), p100: tramo(95) }
  }, [filtrados, pathActivo])

  const clicksPagina = useMemo(
    () => filtrados.filter(e => e.tipo === 'click' && e.path === pathActivo && e.xr != null && e.yr != null),
    [filtrados, pathActivo]
  )

  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #eaeeed', padding: '20px 22px' }
  const chip = (activo: boolean): React.CSSProperties => ({
    padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, cursor: 'pointer',
    border: activo ? '1.5px solid #0F7A63' : '1.5px solid #dfe6e3',
    background: activo ? '#0F7A63' : '#fff', color: activo ? '#fff' : '#5c6b66', transition: 'all .15s',
  })

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: '4px 2px' }}>
      <style>{`
        @keyframes anUp { from { opacity: 0; transform: translateY(14px) } to { opacity: 1; transform: translateY(0) } }
        .an-card { animation: anUp 0.45s ease both }
      `}</style>

      <div style={{ marginBottom: 22 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, color: '#16201d', margin: '0 0 4px', letterSpacing: '-0.02em' }}>Analítica de la web</h1>
        <p style={{ fontSize: 13.5, color: '#9aaba5', margin: 0 }}>Cuánta gente entra, dónde hacen clic y hasta dónde bajan. Solo cuenta a quien acepta cookies.</p>
      </div>

      {/* Filtros: rango de tiempo + dispositivo */}
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
          ? <EmptyState icon={Flame} title="Aún no hay datos" description="En cuanto los visitantes acepten las cookies y naveguen por dkv-ergo.es, aquí verás las visitas, los clics y los mapas de calor. Suele tardar unos minutos en aparecer la primera sesión." />
          : (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(180px,1fr))', gap: 14, marginBottom: 18 }}>
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
                    <div style={{ fontSize: 30, fontWeight: 800, color: '#16201d' }}>
                      <CountUp value={k.value} duration={800} suffix={k.suffix} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 320px', gap: 16, alignItems: 'start' }}>
                {/* Mapa de calor */}
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

                {/* Columna derecha: scroll + ranking */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {/* Mapa de scroll */}
                  <div className="an-card" style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <ArrowDownWideNarrow size={16} color="#7a4fb0" />
                      <b style={{ fontSize: 14.5, color: '#16201d' }}>Hasta dónde bajan</b>
                    </div>
                    {scrollDist.total === 0
                      ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Sin datos de scroll todavía.</p>
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

                  {/* Ranking de clics */}
                  <div className="an-card" style={card}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                      <MousePointerClick size={16} color="#a8741a" />
                      <b style={{ fontSize: 14.5, color: '#16201d' }}>Lo más clicado</b>
                    </div>
                    {ranking.length === 0
                      ? <p style={{ fontSize: 12.5, color: '#9aaba5', margin: 0 }}>Aún nadie ha hecho clic.</p>
                      : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                          {ranking.slice(0, 10).map(([el, n]) => (
                            <div key={el}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12.5, marginBottom: 3 }}>
                                <span style={{ color: '#374542', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el}</span>
                                <span style={{ color: '#a8741a', fontWeight: 800, flexShrink: 0 }}>{n}</span>
                              </div>
                              <div style={{ height: 6, background: '#f3efe6', borderRadius: 999 }}>
                                <div style={{ width: `${(n / maxRank) * 100}%`, height: '100%', background: '#d9a326', borderRadius: 999 }} />
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </div>
                </div>
              </div>
            </>
          )}
    </div>
  )
}

/* Mapa de calor: dibuja los clics como manchas de calor sobre una miniatura
   real de la página (iframe del mismo dominio). */
function Heatmap({ path, clicks }: { path: string; clicks: Evt[] }) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 })

  // Al cargar el iframe, medimos su alto real de contenido para escalar los puntos.
  const onLoad = () => {
    const wrap = wrapRef.current
    const iframe = iframeRef.current
    if (!wrap || !iframe) return
    const w = wrap.clientWidth
    let h = 2400
    try {
      const doc = iframe.contentDocument
      if (doc) h = Math.max(doc.documentElement.scrollHeight, doc.body.scrollHeight)
    } catch { /* mismo dominio: no debería fallar */ }
    iframe.style.height = `${h}px`
    setDims({ w, h })
  }

  // Redibuja el mapa de calor cuando cambian los clics o el tamaño.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || dims.w === 0) return
    canvas.width = dims.w
    canvas.height = dims.h
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.clearRect(0, 0, dims.w, dims.h)

    // 1) Capa de intensidad en escala de grises (manchas radiales sumadas)
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

    // 2) Colorear según la intensidad acumulada (azul → verde → amarillo → rojo)
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
      <iframe
        ref={iframeRef}
        src={path}
        onLoad={onLoad}
        title="Vista de la página"
        scrolling="no"
        style={{ width: '100%', border: 0, display: 'block', pointerEvents: 'none' }}
      />
      <canvas ref={canvasRef} style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: dims.h, pointerEvents: 'none' }} />
    </div>
  )
}

/* Rampa de color tipo mapa de calor. t ∈ [0,1] */
function calor(t: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = [
    [0.0, [43, 111, 176]],   // azul
    [0.4, [46, 170, 120]],   // verde
    [0.7, [230, 190, 40]],   // amarillo
    [1.0, [194, 58, 34]],    // rojo
  ]
  for (let i = 1; i < stops.length; i++) {
    if (t <= stops[i][0]) {
      const [t0, c0] = stops[i - 1]
      const [t1, c1] = stops[i]
      const f = (t - t0) / (t1 - t0 || 1)
      return [
        Math.round(c0[0] + (c1[0] - c0[0]) * f),
        Math.round(c0[1] + (c1[1] - c0[1]) * f),
        Math.round(c0[2] + (c1[2] - c0[2]) * f),
      ]
    }
  }
  return stops[stops.length - 1][1]
}
