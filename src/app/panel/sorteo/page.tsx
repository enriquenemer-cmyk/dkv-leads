'use client'
import { useEffect, useImperativeHandle, useMemo, useRef, useState, forwardRef } from 'react'
import { supabase, Lead, fuenteOrigen, leadSucursal, SUCURSALES } from '@/lib/supabase'
import { PageHero } from '@/components/PageHero'
import { Loader } from '@/components/Loader'
import { FuenteBadge } from '@/components/FuenteBadge'
import { Gift, Users, Phone, Mail, Trophy, Sparkles, RotateCw, History, X, Download, Share2, Film } from 'lucide-react'

// ── Estilos compartidos ──────────────────────────────────────────────
const card: React.CSSProperties = {
  background: '#fff', borderRadius: 18, border: '1.5px solid #e2e8e4', padding: 20,
  boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)',
}

// Colores de las porciones: verde esmeralda DKV y dorado, alternos (colores de marca).
const SLICE_COLORS = ['#0f7a63', '#c1901f']
// Paleta festiva para el confeti del ganador.
const CONFETTI_COLORS = ['#f5c451', '#12b48d', '#ffffff', '#0F7A63', '#e0452a', '#fff7da']

// Etiquetas legibles para las etiquetas (tags) de lead.
const TAGS: { key: Lead['tag']; label: string; color: string }[] = [
  { key: 'caliente', label: 'Caliente', color: '#c23a22' },
  { key: 'tibio', label: 'Tibio', color: '#a8741a' },
  { key: 'frio', label: 'Frío', color: '#2b6fb0' },
  { key: 'cliente', label: 'Cliente', color: '#0F7A63' },
]

// Rangos de fecha para acotar el sorteo.
const RANGOS = [
  { key: 'todos', label: 'Todos' },
  { key: 'hoy', label: 'Hoy' },
  { key: '7', label: 'Últimos 7 días' },
  { key: '30', label: 'Últimos 30 días' },
] as const
type RangoKey = (typeof RANGOS)[number]['key']

/** Nº entero aleatorio [0, max) con RNG criptográfico (sorteo justo). */
function randInt(max: number): number {
  if (max <= 0) return 0
  const a = new Uint32Array(1)
  crypto.getRandomValues(a)
  return a[0] % max
}

function coincideRango(iso: string, rango: RangoKey): boolean {
  if (rango === 'todos') return true
  const d = new Date(iso).getTime()
  const ahora = Date.now()
  if (rango === 'hoy') {
    const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
    return d >= hoy.getTime()
  }
  const dias = rango === '7' ? 7 : 30
  return d >= ahora - dias * 24 * 60 * 60 * 1000
}

function slug(s?: string | null): string {
  return (s || 'ganador').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'ganador'
}

type Clip = { url: string; blob: Blob; ext: string } | null

export default function SorteoPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros del sorteo
  const [fuentesSel, setFuentesSel] = useState<string[]>([])     // orígenes seleccionados
  const [tagsSel, setTagsSel] = useState<Lead['tag'][]>([])       // etiquetas seleccionadas
  const [sucursalesSel, setSucursalesSel] = useState<string[]>([])
  const [rango, setRango] = useState<RangoKey>('todos')
  const [soloTelefono, setSoloTelefono] = useState(false)
  const [noRepetir, setNoRepetir] = useState(true)

  // Estado del sorteo / ruleta
  const [girando, setGirando] = useState(false)
  const [ganador, setGanador] = useState<Lead | null>(null)
  const [historial, setHistorial] = useState<Lead[]>([])

  // Clip de vídeo compartible
  const [grabando, setGrabando] = useState(false)
  const [clip, setClip] = useState<Clip>(null)
  const [clipMsg, setClipMsg] = useState<string>('')
  const clipRef = useRef<Clip>(null)
  const ruletaRef = useRef<RuletaHandle>(null)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('sorteo_leads')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  // Liberamos el objeto URL del clip al desmontar.
  useEffect(() => () => { if (clipRef.current) URL.revokeObjectURL(clipRef.current.url) }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
    setLoading(false)
  }

  // Orígenes disponibles según los leads reales.
  const fuentesDisponibles = useMemo(() => {
    const set = new Set<string>()
    leads.forEach((l) => set.add(fuenteOrigen(l.fuente) || 'manual'))
    return Array.from(set).sort()
  }, [leads])

  // Sucursales disponibles (predefinidas + las que aparezcan en los leads).
  const sucursalesDisponibles = useMemo(() => {
    const set = new Set<string>(SUCURSALES as readonly string[])
    leads.forEach((l) => { const s = leadSucursal(l); if (s) set.add(s) })
    return Array.from(set).sort()
  }, [leads])

  // Al cargar por primera vez, seleccionamos todos los orígenes por defecto.
  useEffect(() => {
    if (fuentesDisponibles.length && fuentesSel.length === 0) setFuentesSel(fuentesDisponibles)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fuentesDisponibles])

  // Participantes que cumplen los filtros.
  const participantes = useMemo(() => {
    const yaGanaron = new Set(historial.map((g) => g.id))
    return leads.filter((l) => {
      if (fuentesSel.length && !fuentesSel.includes(fuenteOrigen(l.fuente) || 'manual')) return false
      if (tagsSel.length && !tagsSel.includes(l.tag)) return false
      if (sucursalesSel.length) {
        const s = leadSucursal(l)
        if (!s || !sucursalesSel.includes(s)) return false
      }
      if (!coincideRango(l.created_at, rango)) return false
      if (soloTelefono && !l.telefono) return false
      if (noRepetir && yaGanaron.has(l.id)) return false
      return true
    })
  }, [leads, fuentesSel, tagsSel, sucursalesSel, rango, soloTelefono, noRepetir, historial])

  const n = participantes.length

  function limpiarClip() {
    if (clipRef.current) URL.revokeObjectURL(clipRef.current.url)
    clipRef.current = null
    setClip(null)
    setClipMsg('')
  }

  // ── Callbacks de la ruleta ──────────────────────────────────────────
  function girar() {
    if (girando || n === 0) return
    setGanador(null)
    limpiarClip()
    setGirando(true)
    setGrabando(true)
    ruletaRef.current?.spin()
  }

  function onWinner(w: Lead) {
    setGanador(w)
    setHistorial((h) => (h.some((x) => x.id === w.id) ? h : [w, ...h]))
  }

  function onClip(blob: Blob | null) {
    setGrabando(false)
    if (!blob) { setClipMsg('Tu navegador no permite grabar el clip; el sorteo funciona igual.'); return }
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm'
    const url = URL.createObjectURL(blob)
    const c = { url, blob, ext }
    clipRef.current = c
    setClip(c)
  }

  function onDone() { setGirando(false) }

  async function compartir() {
    if (!clip || !ganador) return
    const file = new File([clip.blob], `sorteo-${slug(ganador.nombre)}.${clip.ext}`, { type: clip.blob.type })
    const nav = navigator as Navigator & { canShare?: (d?: ShareData) => boolean }
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await nav.share({ files: [file], title: 'Sorteo DKV', text: `🎉 ¡El ganador del sorteo es ${ganador.nombre}!` })
        return
      } catch { /* el usuario canceló: no hacemos nada */ return }
    }
    descargar()
    setClipMsg('Este dispositivo no permite compartir el vídeo directamente; se ha descargado el clip.')
  }

  function descargar() {
    if (!clip || !ganador) return
    const a = document.createElement('a')
    a.href = clip.url
    a.download = `sorteo-${slug(ganador.nombre)}.${clip.ext}`
    document.body.appendChild(a); a.click(); a.remove()
  }

  function reset() {
    setGanador(null)
    setHistorial([])
    limpiarClip()
  }

  if (loading) return <div style={{ padding: 40 }}><Loader label="Cargando participantes…" /></div>

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1120, margin: '0 auto' }}>
      <style>{`
        @keyframes sorteoPop { 0% { transform: scale(0.7); opacity: 0 } 60% { transform: scale(1.05) } 100% { transform: scale(1); opacity: 1 } }
        @keyframes sorteoGlow { 0%,100% { box-shadow: 0 0 0 0 rgba(15,122,99,0.35) } 50% { box-shadow: 0 0 0 14px rgba(15,122,99,0) } }
        .spin { animation: sorteoSpin 0.9s linear infinite } @keyframes sorteoSpin { to { transform: rotate(360deg) } }
      `}</style>

      <PageHero
        title="Sorteos"
        subtitle="Gira la ruleta y comparte el ganador en vídeo vertical 9:16, listo para Reels y TikTok"
        right={
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.2)', color: '#fff', padding: '9px 16px', borderRadius: 12, fontWeight: 700, fontSize: 14 }}>
            <Users size={16} /> {n} participante{n === 1 ? '' : 's'}
          </div>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,340px) minmax(0,1fr)', gap: 22, alignItems: 'start' }}>
        {/* ── Columna de filtros ── */}
        <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 15, color: '#16201d' }}>
            <Sparkles size={17} color="#0F7A63" /> ¿Quién entra en el sorteo?
          </div>

          {/* Fuentes / origen */}
          <FiltroBloque titulo="Fuente del lead">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {fuentesDisponibles.map((f) => (
                <Chip key={f} activo={fuentesSel.includes(f)} onClick={() => setFuentesSel((s) => s.includes(f) ? s.filter((x) => x !== f) : [...s, f])}>
                  <FuenteBadge fuente={f} size="sm" />
                </Chip>
              ))}
            </div>
          </FiltroBloque>

          {/* Etiqueta */}
          <FiltroBloque titulo="Etiqueta" hint="Vacío = todas">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TAGS.map((t) => (
                <Chip key={t.key} activo={tagsSel.includes(t.key)} onClick={() => setTagsSel((s) => s.includes(t.key) ? s.filter((x) => x !== t.key) : [...s, t.key])}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, display: 'inline-block' }} />
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16201d' }}>{t.label}</span>
                </Chip>
              ))}
            </div>
          </FiltroBloque>

          {/* Sucursal */}
          {sucursalesDisponibles.length > 0 && (
            <FiltroBloque titulo="Sucursal" hint="Vacío = todas">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                {sucursalesDisponibles.map((s) => (
                  <Chip key={s} activo={sucursalesSel.includes(s)} onClick={() => setSucursalesSel((v) => v.includes(s) ? v.filter((x) => x !== s) : [...v, s])}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16201d' }}>{s}</span>
                  </Chip>
                ))}
              </div>
            </FiltroBloque>
          )}

          {/* Fecha */}
          <FiltroBloque titulo="Fecha de alta">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {RANGOS.map((r) => (
                <Chip key={r.key} activo={rango === r.key} onClick={() => setRango(r.key)}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: '#16201d' }}>{r.label}</span>
                </Chip>
              ))}
            </div>
          </FiltroBloque>

          {/* Opciones */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, borderTop: '1px solid #eef2f0', paddingTop: 16 }}>
            <Toggle checked={soloTelefono} onChange={setSoloTelefono} label="Solo con teléfono" />
            <Toggle checked={noRepetir} onChange={setNoRepetir} label="No repetir ganadores" />
          </div>
        </div>

        {/* ── Columna de la ruleta ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, paddingTop: 22 }}>
            <RuletaCanvas ref={ruletaRef} participantes={participantes} colores={SLICE_COLORS}
              onWinner={onWinner} onClip={onClip} onDone={onDone} />

            <button
              onClick={girar}
              disabled={girando || n === 0}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 9,
                background: n === 0 ? '#c7d2cd' : 'linear-gradient(135deg, #0F7A63, #0a2f27)',
                color: '#fff', border: 'none', borderRadius: 14, padding: '14px 30px',
                fontSize: 16, fontWeight: 800, fontFamily: 'inherit',
                cursor: girando || n === 0 ? 'not-allowed' : 'pointer',
                boxShadow: n === 0 ? 'none' : '0 12px 30px -12px rgba(15,122,99,0.7)',
                opacity: girando ? 0.75 : 1, transition: 'transform 0.1s',
              }}
            >
              <RotateCw size={18} className={girando ? 'spin' : ''} />
              {girando ? 'Girando…' : n === 0 ? 'Sin participantes' : '¡Girar la ruleta!'}
            </button>
            <p style={{ fontSize: 12, color: '#9aaba5', margin: 0, textAlign: 'center' }}>
              {n === 0
                ? 'Ningún lead cumple los filtros. Ajusta las opciones de la izquierda.'
                : 'El vídeo se graba en vertical 9:16 con sonido, listo para Instagram y TikTok.'}
            </p>
          </div>

          {/* Ganador */}
          {ganador && (
            <div style={{
              ...card, borderColor: '#0F7A63', borderWidth: 2,
              background: 'linear-gradient(135deg, #f2fbf7 0%, #ffffff 60%)',
              animation: 'sorteoPop 0.5s ease-out',
              display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap',
            }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg, #ffd76a, #f5a623)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, animation: 'sorteoGlow 1.8s ease-out infinite' }}>
                <Trophy size={30} color="#7a4f00" />
              </div>
              <div style={{ flex: 1, minWidth: 180 }}>
                <div style={{ fontSize: 11.5, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#0F7A63' }}>🎉 ¡Ganador del sorteo!</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#16201d', margin: '2px 0 6px', textTransform: 'capitalize' }}>{ganador.nombre}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14, alignItems: 'center', fontSize: 13.5, color: '#41514c' }}>
                  <FuenteBadge fuente={ganador.fuente} size="md" />
                  {ganador.telefono && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Phone size={14} /> {ganador.telefono}</span>}
                  {ganador.email && <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Mail size={14} /> {ganador.email}</span>}
                </div>
              </div>
              <a href={`/panel/leads/${ganador.id}`} style={{ flexShrink: 0, background: '#0F7A63', color: '#fff', textDecoration: 'none', padding: '9px 16px', borderRadius: 10, fontSize: 13.5, fontWeight: 700 }}>
                Ver ficha
              </a>
            </div>
          )}

          {/* Clip de vídeo compartible */}
          {(grabando || clip || clipMsg) && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14.5, color: '#16201d', marginBottom: 12 }}>
                <Film size={16} color="#6b4ab0" /> Vídeo del sorteo
                <span style={{ fontSize: 11, fontWeight: 700, color: '#6b4ab0', background: '#f0eafa', padding: '2px 8px', borderRadius: 999 }}>Vertical 9:16</span>
                {clip && <span style={{ fontSize: 11, fontWeight: 700, color: '#0F7A63', background: '#eafaf4', padding: '2px 8px', borderRadius: 999, textTransform: 'uppercase' }}>{clip.ext}</span>}
              </div>

              {grabando && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5, color: '#6b7a76' }}>
                  <span className="spin" style={{ display: 'inline-flex' }}><RotateCw size={15} /></span>
                  Preparando el vídeo para guardar…
                </div>
              )}

              {clip && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <video src={clip.url} controls playsInline style={{ width: '100%', maxWidth: 220, borderRadius: 14, background: '#0a2f27', alignSelf: 'center', aspectRatio: '9 / 16' }} />
                  {/* Guardar es la acción principal: botón grande y verde. */}
                  <button onClick={descargar} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: 'linear-gradient(135deg, #0F7A63, #0a2f27)', color: '#fff', border: 'none', borderRadius: 14, padding: '15px 18px', fontSize: 16, fontWeight: 800, fontFamily: 'inherit', cursor: 'pointer', boxShadow: '0 12px 30px -12px rgba(15,122,99,0.7)' }}>
                    <Download size={19} /> Guardar vídeo
                  </button>
                  <button onClick={compartir} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#fff', color: '#16201d', border: '1.5px solid #e2e8e4', borderRadius: 12, padding: '11px 18px', fontSize: 14.5, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                    <Share2 size={16} /> Compartir directamente
                  </button>
                  <p style={{ fontSize: 12, color: '#9aaba5', margin: 0, lineHeight: 1.5 }}>
                    <b>Guardar vídeo</b> descarga el archivo a tu dispositivo para subirlo luego a Instagram, TikTok o WhatsApp.
                    {' '}<b>Compartir directamente</b> abre las apps al instante (solo en móvil).
                    {clip.ext === 'webm' && ' Nota: en ordenador el vídeo es .webm; para Instagram guárdalo mejor desde el móvil, donde sale en .mp4.'}
                  </p>
                </div>
              )}

              {clipMsg && <p style={{ fontSize: 12.5, color: '#9aaba5', margin: clip ? '10px 0 0' : 0 }}>{clipMsg}</p>}
            </div>
          )}

          {/* Historial */}
          {historial.length > 0 && (
            <div style={card}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 14.5, color: '#16201d' }}>
                  <History size={16} color="#6b7a76" /> Ganadores de esta sesión ({historial.length})
                </div>
                <button onClick={reset} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: 'none', border: '1px solid #e2e8e4', borderRadius: 8, padding: '5px 10px', fontSize: 12.5, fontWeight: 600, color: '#6b7a76', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <X size={13} /> Limpiar
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {historial.map((g, i) => (
                  <div key={g.id} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13.5 }}>
                    <span style={{ width: 22, height: 22, borderRadius: '50%', background: i === 0 ? '#f5a623' : '#eef2f0', color: i === 0 ? '#fff' : '#6b7a76', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 11.5, flexShrink: 0 }}>{historial.length - i}</span>
                    <span style={{ fontWeight: 700, color: '#16201d', textTransform: 'capitalize' }}>{g.nombre}</span>
                    <FuenteBadge fuente={g.fuente} size="sm" />
                    {g.telefono && <span style={{ color: '#6b7a76', marginLeft: 'auto' }}>{g.telefono}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Ruleta vertical 9:16 en canvas (grabable como vídeo con sonido) ───
type RuletaHandle = { spin: () => void }
type RuletaProps = {
  participantes: Lead[]
  colores: string[]
  onWinner: (w: Lead) => void
  onClip: (blob: Blob | null) => void
  onDone: () => void
}

// Lienzo vertical Full-HD (formato Reels / TikTok).
const VW = 1080, VH = 1920
const WCX = 540, WCY = 1015, WR = 442     // centro y radio de la rueda
const HUB = 88                            // radio del cubo central
const SANS = "'Plus Jakarta Sans', system-ui, sans-serif"

type Confeti = { x: number; delay: number; vel: number; col: string; size: number; rot: number; spin: number }

function rad(deg: number) { return ((deg - 90) * Math.PI) / 180 }

/** Aclara (amt>0) u oscurece (amt<0) un color hex → para el relieve de las porciones. */
function shade(hex: string, amt: number): string {
  const num = parseInt(hex.slice(1), 16)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt))
  const g = Math.max(0, Math.min(255, ((num >> 8) & 255) + amt))
  const b = Math.max(0, Math.min(255, (num & 255) + amt))
  return `rgb(${r},${g},${b})`
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === 'undefined') return undefined
  const tipos = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
  return tipos.find((t) => { try { return MediaRecorder.isTypeSupported(t) } catch { return false } })
}

function makeNoise(ctx: AudioContext, loop: boolean): AudioBufferSourceNode {
  const len = Math.floor(ctx.sampleRate * (loop ? 1 : 1.4))
  const buf = ctx.createBuffer(1, len, ctx.sampleRate)
  const d = buf.getChannelData(0)
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1
  const src = ctx.createBufferSource(); src.buffer = buf; src.loop = loop
  return src
}

/** Redoble de tambor (crescendo) + fanfarria de ganador, en directo y en el clip. */
function reproducirSonido(ctx: AudioContext, dest: MediaStreamAudioDestinationNode | null, spinMs: number) {
  const master = ctx.createGain(); master.gain.value = 0.9
  master.connect(ctx.destination); if (dest) master.connect(dest)
  const now = ctx.currentTime
  const fin = now + spinMs / 1000

  // Redoble: ruido filtrado con tremolo y crescendo.
  const noise = makeNoise(ctx, true)
  const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 2600; bp.Q.value = 0.8
  const roll = ctx.createGain()
  roll.gain.setValueAtTime(0.0001, now)
  roll.gain.exponentialRampToValueAtTime(0.05, now + 0.4)
  roll.gain.exponentialRampToValueAtTime(0.45, fin)
  const lfo = ctx.createOscillator(); lfo.type = 'square'; lfo.frequency.value = 24
  const lfoGain = ctx.createGain(); lfoGain.gain.value = 0.35
  lfo.connect(lfoGain); lfoGain.connect(roll.gain)
  noise.connect(bp); bp.connect(roll); roll.connect(master)
  noise.start(now); lfo.start(now); noise.stop(fin + 0.05); lfo.stop(fin + 0.05)

  // Fanfarria final (acorde ascendente).
  const acorde = [523.25, 659.25, 783.99, 1046.5]
  acorde.forEach((f, i) => {
    const o = ctx.createOscillator(); o.type = 'triangle'; o.frequency.value = f
    const g = ctx.createGain()
    const st = fin + i * 0.07
    g.gain.setValueAtTime(0.0001, st)
    g.gain.exponentialRampToValueAtTime(0.28, st + 0.03)
    g.gain.exponentialRampToValueAtTime(0.0001, st + 1.3)
    o.connect(g); g.connect(master); o.start(st); o.stop(st + 1.4)
  })
  // Platillo (crash) al revelar.
  const crash = makeNoise(ctx, false)
  const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 5000
  const cg = ctx.createGain()
  cg.gain.setValueAtTime(0.35, fin); cg.gain.exponentialRampToValueAtTime(0.0001, fin + 1.3)
  crash.connect(hp); hp.connect(cg); cg.connect(master); crash.start(fin); crash.stop(fin + 1.4)
}

const RuletaCanvas = forwardRef<RuletaHandle, RuletaProps>(function RuletaCanvas(
  { participantes, colores, onWinner, onClip, onDone }, ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rotRef = useRef(0)          // rotación acumulada (grados)
  const rafRef = useRef<number | null>(null)
  const spinningRef = useRef(false)
  const partsRef = useRef<Lead[]>(participantes)
  const logoRef = useRef<HTMLImageElement | null>(null)
  const confetiRef = useRef<Confeti[]>([])
  const audioRef = useRef<AudioContext | null>(null)
  partsRef.current = participantes

  useImperativeHandle(ref, () => ({ spin }))

  // Precarga del logo (mismo origen: no contamina el canvas).
  useEffect(() => {
    const img = new Image()
    img.onload = () => { logoRef.current = img; if (!spinningRef.current) draw(rotRef.current, null, 0) }
    img.src = '/dkv-logo.png'
  }, [])

  // Dibujo estático inicial y cuando cambian los participantes (si no gira).
  useEffect(() => {
    if (!spinningRef.current) draw(rotRef.current, null, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participantes])

  useEffect(() => () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }, [])

  function draw(rotDeg: number, ganador: Lead | null, reveal: number) {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    if (canvas.width !== VW) { canvas.width = VW; canvas.height = VH }
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    const alpha = Math.min(1, reveal * 4)

    // Fondo vertical de marca.
    const bg = ctx.createLinearGradient(0, 0, 0, VH)
    bg.addColorStop(0, '#0d4034'); bg.addColorStop(0.55, '#0a2f27'); bg.addColorStop(1, '#05130f')
    ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH)
    // Resplandor tras la rueda.
    const glow = ctx.createRadialGradient(WCX, WCY, 60, WCX, WCY, WR + 320)
    glow.addColorStop(0, 'rgba(24,200,155,0.22)'); glow.addColorStop(1, 'rgba(18,180,141,0)')
    ctx.fillStyle = glow; ctx.fillRect(0, 0, VW, VH)
    // Destellos suaves de fondo.
    const spk = [[160, 240, 3], [900, 300, 2], [220, 1520, 2.5], [880, 1580, 3], [520, 150, 2], [120, 900, 2], [960, 980, 2.5]]
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    spk.forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill() })
    // Viñeta para concentrar la mirada en la rueda.
    const vig = ctx.createRadialGradient(WCX, VH / 2, 300, WCX, VH / 2, 1100)
    vig.addColorStop(0, 'rgba(0,0,0,0)'); vig.addColorStop(1, 'rgba(0,0,0,0.5)')
    ctx.fillStyle = vig; ctx.fillRect(0, 0, VW, VH)

    // Cabecera: logo + título.
    const img = logoRef.current
    if (img && img.complete && img.naturalWidth) {
      const bw = 250, bh = 92, bx = (VW - bw) / 2, by = 66
      ctx.fillStyle = '#fff'; roundRect(ctx, bx, by, bw, bh, 20); ctx.fill()
      const pad = 20, iw = bw - pad * 2, ih = bh - pad * 2
      const ratio = Math.min(iw / img.naturalWidth, ih / img.naturalHeight)
      const dw = img.naturalWidth * ratio, dh = img.naturalHeight * ratio
      ctx.drawImage(img, bx + (bw - dw) / 2, by + (bh - dh) / 2, dw, dh)
    }
    // Título "SORTEO" con degradado dorado y sombra.
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    const tg = ctx.createLinearGradient(0, 250, 0, 360)
    tg.addColorStop(0, '#fff6da'); tg.addColorStop(1, '#f0c24a')
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6
    ctx.fillStyle = tg; ctx.font = `900 112px ${SANS}`; ctx.fillText('SORTEO', VW / 2, 352); ctx.restore()
    // Filigrana dorada bajo el título.
    ctx.strokeStyle = 'rgba(245,196,81,0.9)'; ctx.lineWidth = 4
    ctx.beginPath(); ctx.moveTo(VW / 2 - 190, 392); ctx.lineTo(VW / 2 - 30, 392); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(VW / 2 + 30, 392); ctx.lineTo(VW / 2 + 190, 392); ctx.stroke()
    ctx.save(); ctx.translate(VW / 2, 392); ctx.rotate(Math.PI / 4); ctx.fillStyle = '#f5c451'; ctx.fillRect(-9, -9, 18, 18); ctx.restore()
    if (reveal <= 0) {
      ctx.fillStyle = 'rgba(255,255,255,0.72)'; ctx.font = `600 38px ${SANS}`
      const nn = partsRef.current.length
      ctx.fillText(`Entre ${nn} participante${nn === 1 ? '' : 's'}`, VW / 2, 452)
    }

    const parts = partsRef.current
    const n = Math.max(parts.length, 1)
    const seg = 360 / n

    // Sombra proyectada bajo la rueda (le da volumen).
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.5)'; ctx.shadowBlur = 80; ctx.shadowOffsetY = 30
    ctx.beginPath(); ctx.arc(WCX, WCY, WR + 40, 0, Math.PI * 2); ctx.fillStyle = '#04140f'; ctx.fill()
    ctx.restore()

    // Bisel dorado metálico (varios tonos → reflejo pulido).
    const bezel = ctx.createLinearGradient(WCX, WCY - WR - 40, WCX, WCY + WR + 40)
    bezel.addColorStop(0, '#fff2c4'); bezel.addColorStop(0.35, '#f3c24a'); bezel.addColorStop(0.5, '#c9962a'); bezel.addColorStop(0.65, '#f3c24a'); bezel.addColorStop(1, '#8a5f0d')
    ctx.beginPath(); ctx.arc(WCX, WCY, WR + 40, 0, Math.PI * 2); ctx.fillStyle = bezel; ctx.fill()
    // Filo de brillo del bisel.
    ctx.beginPath(); ctx.arc(WCX, WCY, WR + 40, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke()
    // Aro interior oscuro que enmarca las porciones.
    ctx.beginPath(); ctx.arc(WCX, WCY, WR + 10, 0, Math.PI * 2); ctx.fillStyle = '#082019'; ctx.fill()
    // Aro dorado fino pegado a las porciones.
    ctx.beginPath(); ctx.arc(WCX, WCY, WR + 4, 0, Math.PI * 2); ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(245,196,81,0.85)'; ctx.stroke()

    // Bombillas alrededor del bisel (parpadean al girar, estilo ruleta de premios).
    const NB = 24, bulbR = WR + 25
    for (let i = 0; i < NB; i++) {
      const ang = (i / NB) * Math.PI * 2
      const bx = WCX + bulbR * Math.cos(ang), by = WCY + bulbR * Math.sin(ang)
      const on = (Math.floor(rotDeg / 11) + i) % 2 === 0
      ctx.beginPath(); ctx.arc(bx, by, 9, 0, Math.PI * 2)
      if (on) { ctx.shadowColor = 'rgba(255,240,180,1)'; ctx.shadowBlur = 22 }
      ctx.fillStyle = on ? '#fff8de' : '#b98a22'; ctx.fill(); ctx.shadowBlur = 0
      ctx.beginPath(); ctx.arc(bx - 2.5, by - 2.5, 2.5, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill()
    }

    // Porciones (rotadas).
    ctx.save()
    ctx.translate(WCX, WCY); ctx.rotate((rotDeg * Math.PI) / 180)
    for (let i = 0; i < n; i++) {
      const a0 = rad(i * seg), a1 = rad((i + 1) * seg)
      ctx.beginPath()
      if (parts.length <= 1) { ctx.arc(0, 0, WR, 0, Math.PI * 2) }
      else { ctx.moveTo(0, 0); ctx.arc(0, 0, WR, a0, a1); ctx.closePath() }
      const base = colores[i % colores.length]
      if (parts.length > 1) {
        const g = ctx.createRadialGradient(0, 0, WR * 0.15, 0, 0, WR)
        g.addColorStop(0, shade(base, 28)); g.addColorStop(0.7, base); g.addColorStop(1, shade(base, -26))
        ctx.fillStyle = g
      } else { ctx.fillStyle = base }
      ctx.fill()
      if (n <= 40 && parts.length > 1) { ctx.lineWidth = 3; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.stroke() }
    }
    if (parts.length > 1 && parts.length <= 20) {
      ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.font = `800 ${seg < 24 ? 30 : 40}px ${SANS}`
      for (let i = 0; i < parts.length; i++) {
        const c = (i + 0.5) * seg
        const x = WR * 0.62 * Math.cos(rad(c)), y = WR * 0.62 * Math.sin(rad(c))
        const primer = (parts[i].nombre || '').trim().split(/\s+/)[0] || '—'
        const txt = primer.length > 11 ? primer.slice(0, 10) + '…' : primer
        ctx.save(); ctx.translate(x, y); ctx.rotate((c * Math.PI) / 180)
        ctx.lineWidth = 4; ctx.strokeStyle = 'rgba(0,0,0,0.38)'; ctx.strokeText(txt, 0, 0)
        ctx.fillText(txt, 0, 0); ctx.restore()
      }
    }
    ctx.restore()

    // Domo de brillo fijo: sombra al borde inferior + reflejo de cristal arriba.
    const dome = ctx.createRadialGradient(WCX, WCY - WR * 0.3, WR * 0.2, WCX, WCY, WR)
    dome.addColorStop(0, 'rgba(255,255,255,0.10)')
    dome.addColorStop(0.55, 'rgba(255,255,255,0)')
    dome.addColorStop(0.8, 'rgba(0,0,0,0)')
    dome.addColorStop(1, 'rgba(0,0,0,0.28)')
    ctx.beginPath(); ctx.arc(WCX, WCY, WR, 0, Math.PI * 2); ctx.fillStyle = dome; ctx.fill()
    // Banda brillante fina pegada al borde superior (reflejo de cristal).
    ctx.save(); ctx.beginPath(); ctx.arc(WCX, WCY, WR, 0, Math.PI * 2); ctx.clip()
    const spec = ctx.createLinearGradient(0, WCY - WR, 0, WCY - WR * 0.45)
    spec.addColorStop(0, 'rgba(255,255,255,0.40)'); spec.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = spec; ctx.beginPath(); ctx.ellipse(WCX, WCY - WR * 0.62, WR * 0.72, WR * 0.28, 0, 0, Math.PI * 2); ctx.fill()
    ctx.restore()

    // Cubo central metálico dorado con núcleo brillante.
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8
    const ring = ctx.createLinearGradient(WCX, WCY - HUB, WCX, WCY + HUB)
    ring.addColorStop(0, '#fff2c4'); ring.addColorStop(0.5, '#e0b840'); ring.addColorStop(1, '#8a5f0d')
    ctx.beginPath(); ctx.arc(WCX, WCY, HUB, 0, Math.PI * 2); ctx.fillStyle = ring; ctx.fill(); ctx.restore()
    const hubGrad = ctx.createRadialGradient(WCX - 20, WCY - 22, 8, WCX, WCY, HUB - 14)
    hubGrad.addColorStop(0, '#ffffff'); hubGrad.addColorStop(1, '#dbe5e0')
    ctx.beginPath(); ctx.arc(WCX, WCY, HUB - 14, 0, Math.PI * 2); ctx.fillStyle = hubGrad; ctx.fill()
    ctx.font = '64px serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
    ctx.fillText('🎁', WCX, WCY + 3)

    // Puntero superior rojo con pomo dorado.
    ctx.save()
    ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 20; ctx.shadowOffsetY = 8
    ctx.beginPath()
    ctx.moveTo(WCX - 40, WCY - WR - 30); ctx.lineTo(WCX + 40, WCY - WR - 30); ctx.lineTo(WCX, WCY - WR + 52)
    ctx.closePath()
    const pg = ctx.createLinearGradient(0, WCY - WR - 30, 0, WCY - WR + 52)
    pg.addColorStop(0, '#e0452a'); pg.addColorStop(1, '#8a1f0f')
    ctx.fillStyle = pg; ctx.fill()
    ctx.restore()
    // Pomo del puntero.
    const kg = ctx.createRadialGradient(WCX - 9, WCY - WR - 38, 4, WCX, WCY - WR - 30, 27)
    kg.addColorStop(0, '#ffffff'); kg.addColorStop(1, '#e0b840')
    ctx.beginPath(); ctx.arc(WCX, WCY - WR - 30, 27, 0, Math.PI * 2); ctx.fillStyle = kg; ctx.fill()
    ctx.lineWidth = 3; ctx.strokeStyle = '#b8860b'; ctx.stroke()

    // Marca de agua.
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.font = `700 30px ${SANS}`
    ctx.fillText('DKV Seguros · Sorteo oficial', VW / 2, VH - 70)

    // Cartel del ganador + confeti.
    if (ganador && reveal > 0) {
      const bx = 70, by = 1500, bw = VW - 140, bh = 280
      ctx.save(); ctx.globalAlpha = alpha
      ctx.shadowColor = 'rgba(245,196,81,0.6)'; ctx.shadowBlur = 40
      const grad = ctx.createLinearGradient(bx, by, bx + bw, by + bh)
      grad.addColorStop(0, '#0F7A63'); grad.addColorStop(1, '#0a2f27')
      roundRect(ctx, bx, by, bw, bh, 34); ctx.fillStyle = grad; ctx.fill()
      ctx.shadowBlur = 0
      roundRect(ctx, bx, by, bw, bh, 34); ctx.lineWidth = 4; ctx.strokeStyle = '#f5c451'; ctx.stroke()

      ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'
      ctx.font = '64px serif'; ctx.fillText('🏆', VW / 2, by + 82)
      ctx.fillStyle = '#f5c451'; ctx.font = `800 34px ${SANS}`
      ctx.fillText('GANADOR DEL SORTEO', VW / 2, by + 138)

      // Nombre auto-ajustado al ancho.
      let fs = 92
      const maxW = bw - 90
      ctx.fillStyle = '#fff'
      let nombre = (ganador.nombre || '').trim() || '—'
      ctx.font = `900 ${fs}px ${SANS}`
      while (ctx.measureText(nombre).width > maxW && fs > 46) { fs -= 4; ctx.font = `900 ${fs}px ${SANS}` }
      if (ctx.measureText(nombre).width > maxW) {
        while (ctx.measureText(nombre + '…').width > maxW && nombre.length > 3) nombre = nombre.slice(0, -1)
        nombre += '…'
      }
      ctx.fillText(nombre, VW / 2, by + 226)
      ctx.restore()

      // Confeti cayendo.
      for (const c of confetiRef.current) {
        const p = Math.max(0, reveal - c.delay)
        if (p <= 0) continue
        const y = -40 + p * c.vel * (VH + 120)
        if (y > VH + 40) continue
        ctx.save(); ctx.globalAlpha = Math.min(1, alpha)
        ctx.translate(c.x, y); ctx.rotate(c.rot + p * c.spin)
        ctx.fillStyle = c.col; ctx.fillRect(-c.size / 2, -c.size / 2, c.size, c.size * 1.6)
        ctx.restore()
      }
    }
  }

  function getAudio(): AudioContext | null {
    try {
      if (!audioRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
        if (!AC) return null
        audioRef.current = new AC()
      }
      if (audioRef.current.state === 'suspended') audioRef.current.resume()
      return audioRef.current
    } catch { return null }
  }

  function spin() {
    if (spinningRef.current) return
    const parts = partsRef.current
    const n = parts.length
    if (n === 0) return
    spinningRef.current = true

    const DUR = 5000

    // Confeti (posiciones fijas por giro).
    confetiRef.current = Array.from({ length: 46 }, () => ({
      x: Math.random() * VW,
      delay: Math.random() * 0.12,
      vel: 0.55 + Math.random() * 0.6,
      col: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: 16 + Math.random() * 22,
      rot: Math.random() * Math.PI,
      spin: (Math.random() * 8 - 4),
    }))

    // Audio (directo + pista para el clip).
    const ctxA = getAudio()
    let audioDest: MediaStreamAudioDestinationNode | null = null
    if (ctxA) { try { audioDest = ctxA.createMediaStreamDestination() } catch { audioDest = null } }

    // Grabación de vídeo (+ audio si está disponible).
    let recorder: MediaRecorder | null = null
    const chunks: BlobPart[] = []
    const canvas = canvasRef.current
    const mime = pickMime()
    const canCapture = !!canvas && typeof canvas.captureStream === 'function' && !!mime
    if (canCapture) {
      try {
        const video = canvas!.captureStream(30)
        const tracks = [...video.getVideoTracks(), ...(audioDest ? audioDest.stream.getAudioTracks() : [])]
        const stream = new MediaStream(tracks)
        recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 8_000_000, audioBitsPerSecond: 128_000 })
        recorder.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data) }
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: recorder!.mimeType || 'video/webm' })
          onClip(blob); onDone()
        }
        recorder.start()
      } catch { recorder = null }
    }

    if (ctxA) { try { reproducirSonido(ctxA, audioDest, DUR) } catch { /* sin sonido */ } }

    const idx = randInt(n)
    const seg = 360 / n
    const centro = (idx + 0.5) * seg
    const targetMod = (360 - (centro % 360) + 360) % 360
    const jitter = n > 1 ? (Math.random() - 0.5) * seg * 0.6 : 0
    const start = rotRef.current
    const actualMod = ((start % 360) + 360) % 360
    const delta = 6 * 360 + ((targetMod - actualMod + 360) % 360) + jitter
    const ganador = parts[idx]
    const t0 = performance.now()

    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / DUR)
      const e = 1 - Math.pow(1 - t, 4)         // easeOutQuart
      rotRef.current = start + delta * e
      draw(rotRef.current, null, 0)
      if (t < 1) { rafRef.current = requestAnimationFrame(tick); return }

      onWinner(ganador)
      // Fase de revelado: cartel + confeti dentro del propio clip.
      const REVEAL = 2200
      const r0 = performance.now()
      const reveal = (rn: number) => {
        const rt = Math.min(1, (rn - r0) / REVEAL)
        draw(rotRef.current, ganador, rt)
        if (rt < 1) { rafRef.current = requestAnimationFrame(reveal); return }
        spinningRef.current = false
        if (recorder && recorder.state !== 'inactive') { recorder.stop() }
        else { onClip(null); onDone() }
      }
      rafRef.current = requestAnimationFrame(reveal)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <canvas ref={canvasRef} style={{ width: 'min(300px, 76vw)', height: 'auto', aspectRatio: '9 / 16', maxWidth: '100%', display: 'block', borderRadius: 18, boxShadow: '0 20px 50px -24px rgba(10,47,39,0.7)' }} />
  )
})

// ── Piezas de UI ─────────────────────────────────────────────────────
function FiltroBloque({ titulo, hint, children }: { titulo: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 9 }}>
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: '#41514c' }}>{titulo}</span>
        {hint && <span style={{ fontSize: 11, color: '#9aaba5', fontWeight: 500 }}>{hint}</span>}
      </div>
      {children}
    </div>
  )
}

function Chip({ activo, onClick, children }: { activo: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 999,
      border: activo ? '1.5px solid #0F7A63' : '1.5px solid #e2e8e4',
      background: activo ? '#eafaf4' : '#fff', cursor: 'pointer', fontFamily: 'inherit',
      boxShadow: activo ? '0 0 0 3px rgba(15,122,99,0.1)' : 'none', transition: 'all 0.12s',
    }}>
      {children}
    </button>
  )
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}>
      <span style={{ width: 38, height: 22, borderRadius: 999, background: checked ? '#0F7A63' : '#d5ded9', position: 'relative', transition: 'background 0.15s', flexShrink: 0 }}>
        <span style={{ position: 'absolute', top: 2, left: checked ? 18 : 2, width: 18, height: 18, borderRadius: '50%', background: '#fff', transition: 'left 0.15s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }} />
      </span>
      <span style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d' }}>{label}</span>
    </button>
  )
}
