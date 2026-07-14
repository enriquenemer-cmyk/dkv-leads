'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { PageHero } from '@/components/PageHero'
import { supabase } from '@/lib/supabase'
import { Download, Image as ImageIcon, Bookmark, Trash2, Plus, Upload, Loader2, AlertTriangle, CalendarClock, CheckCircle2, Send } from 'lucide-react'

// ============================ Config ============================
type PlatKey = 'ig-feed' | 'ig-story' | 'facebook' | 'tiktok' | 'linkedin'
type Brand = 'instagram' | 'ig-story' | 'facebook' | 'tiktok' | 'linkedin'
type Fit = 'cover' | 'contain'

interface Plat {
  label: string; short: string; type: 'card' | 'bleed'; brand: Brand
  ratios: Record<string, [number, number]>; def: string
}

const PLATFORMS: Record<PlatKey, Plat> = {
  'ig-feed':  { label: 'Instagram · Feed',  short: 'IG Feed',  type: 'card',  brand: 'instagram', ratios: { '4:5': [1080, 1350], '1:1': [1080, 1080] }, def: '4:5' },
  'ig-story': { label: 'Instagram · Story', short: 'IG Story', type: 'bleed', brand: 'ig-story',  ratios: { '9:16': [1080, 1920] }, def: '9:16' },
  'facebook': { label: 'Facebook',          short: 'Facebook', type: 'card',  brand: 'facebook',  ratios: { '4:5': [1080, 1350], '1:1': [1080, 1080] }, def: '4:5' },
  'tiktok':   { label: 'TikTok',            short: 'TikTok',   type: 'bleed', brand: 'tiktok',    ratios: { '9:16': [1080, 1920] }, def: '9:16' },
  'linkedin': { label: 'LinkedIn',          short: 'LinkedIn', type: 'card',  brand: 'linkedin',  ratios: { '1:1': [1200, 1200], '4:5': [1080, 1350] }, def: '1:1' },
}

interface Cfg {
  img: HTMLImageElement; username: string; ubicacion: string; likes: string; caption: string
  verified: boolean; fit: Fit; bg: string; platform: PlatKey; ratio: string
}

type Estado = 'borrador' | 'programado' | 'publicado'

interface SavedRow {
  id: string; created_at: string; autor: string | null; platform: PlatKey; ratio: string
  username: string; ubicacion: string; likes: string; caption: string; verified: boolean
  fit: Fit; bg: string; img_url: string; img_path: string | null; thumb: string
  pub_url: string | null; pub_path: string | null; post_url: string | null
  estado: Estado; programado_para: string | null; publicado_en: string | null
}

// Redes con publicación automática vía Meta (Instagram + Facebook). TikTok/LinkedIn son manuales.
const AUTO_PUB = new Set<PlatKey>(['ig-feed', 'ig-story', 'facebook'])

const ESTADOS: { key: Estado; label: string; color: string; bg: string }[] = [
  { key: 'borrador', label: 'Borrador', color: '#6b7a76', bg: '#eef2f0' },
  { key: 'programado', label: 'Programado', color: '#9a6a12', bg: '#fdf3dc' },
  { key: 'publicado', label: 'Publicado', color: '#0a5b49', bg: '#e2f0ea' },
]
const estadoMeta = (e: Estado) => ESTADOS.find((x) => x.key === e) || ESTADOS[0]
function fmtFecha(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  return d.toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}
// datetime-local <-> ISO
const isoToLocalInput = (iso: string | null): string => {
  if (!iso) return ''
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}
const localInputToIso = (v: string): string | null => (v ? new Date(v).toISOString() : null)

const FS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
const stampOf = (platform: string, ratio: string) => `${platform}-${ratio.replace(':', 'x')}`
const loadImg = (src: string, cross = false): Promise<HTMLImageElement> =>
  new Promise((res, rej) => { const i = new Image(); if (cross) i.crossOrigin = 'anonymous'; i.onload = () => res(i); i.onerror = rej; i.src = src })

function download(canvas: HTMLCanvasElement, name: string) {
  canvas.toBlob((blob) => {
    if (!blob) return
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = name; a.click()
    setTimeout(() => URL.revokeObjectURL(url), 1500)
  }, 'image/jpeg', 0.95)
}

// ---- Canvas helpers ----
function coverCanvas(img: HTMLImageElement, W: number, H: number, fit: Fit, bg: string): HTMLCanvasElement {
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const x = c.getContext('2d')!; const ir = img.width / img.height, tr = W / H
  if (fit === 'contain') {
    x.fillStyle = bg; x.fillRect(0, 0, W, H)
    let dw = W, dh = H; if (ir > tr) dh = W / ir; else dw = H * ir
    x.drawImage(img, (W - dw) / 2, (H - dh) / 2, dw, dh)
  } else {
    let sw = img.width, sh = img.height, sx = 0, sy = 0
    if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2 } else { sh = img.width / tr; sy = (img.height - sh) / 2 }
    x.drawImage(img, sx, sy, sw, sh, 0, 0, W, H)
  }
  return c
}
function drawCover(ctx: CanvasRenderingContext2D, cfg: Cfg, x: number, y: number, w: number, h: number) {
  const img = cfg.img, ir = img.width / img.height, tr = w / h
  if (cfg.fit === 'contain') {
    ctx.fillStyle = cfg.bg; ctx.fillRect(x, y, w, h)
    let dw = w, dh = h; if (ir > tr) dh = w / ir; else dw = h * ir
    ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh); return
  }
  let sw = img.width, sh = img.height, sx = 0, sy = 0
  if (ir > tr) { sw = img.height * tr; sx = (img.width - sw) / 2 } else { sh = img.width / tr; sy = (img.height - sh) / 2 }
  ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
}
function ini(name: string) { return (name.trim()[0] || 'D').toUpperCase() }
function avatar(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, color: string, name: string) {
  ctx.save(); ctx.beginPath(); ctx.arc(x + r, y + r, r, 0, 7); ctx.closePath(); ctx.fillStyle = color; ctx.fill()
  ctx.fillStyle = '#fff'; ctx.font = `700 ${Math.round(r)}px ${FS}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
  ctx.fillText(ini(name), x + r, y + r + 1); ctx.restore(); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic'
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number, max: number) {
  const words = (text || '').split(/\s+/); let line = '', ln = 0
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line, x, y); line = words[i]; y += lh; ln++
      if (max && ln >= max) { ctx.fillText(line + '…', x, y); return y }
    } else line = test
  }
  ctx.fillText(line, x, y); return y
}
function wrapFrom(ctx: CanvasRenderingContext2D, text: string, x: number, offset: number, y: number, maxW: number, lh: number, max: number) {
  const words = (text || '').split(/\s+/); let line = '', first = true, ln = 0
  const sx = () => (first ? x + offset : x), av = () => (first ? maxW - offset : maxW)
  for (let i = 0; i < words.length; i++) {
    const test = line ? line + ' ' + words[i] : words[i]
    if (ctx.measureText(test).width > av() && line) {
      ctx.fillText(line, sx(), y); y += lh; ln++; first = false; line = words[i]
      if (max && ln >= max) { ctx.fillText(line + '…', x, y); return }
    } else line = test
  }
  ctx.fillText(line, sx(), y)
}
function strokeIcon(ctx: CanvasRenderingContext2D, kind: string, cx: number, cy: number, s: number, color: string, fill = false) {
  ctx.save(); ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = 3.2; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.beginPath()
  if (kind === 'heart') {
    const t = s
    ctx.moveTo(cx, cy + t * 0.35)
    ctx.bezierCurveTo(cx - t * 0.1, cy + t * 0.15, cx - t, cy - t * 0.15, cx - t, cy - t * 0.35)
    ctx.bezierCurveTo(cx - t, cy - t * 0.8, cx - t * 0.35, cy - t * 0.85, cx, cy - t * 0.4)
    ctx.bezierCurveTo(cx + t * 0.35, cy - t * 0.85, cx + t, cy - t * 0.8, cx + t, cy - t * 0.35)
    ctx.bezierCurveTo(cx + t, cy - t * 0.15, cx + t * 0.1, cy + t * 0.15, cx, cy + t * 0.35)
    ctx.closePath(); fill ? ctx.fill() : ctx.stroke()
  } else if (kind === 'comment') { ctx.arc(cx, cy - 2, s * 0.85, 0.9, 2 * Math.PI + 0.4); ctx.lineTo(cx - s * 0.5, cy + s); ctx.stroke() }
  else if (kind === 'send') { ctx.moveTo(cx + s, cy - s); ctx.lineTo(cx - s, cy - s * 0.1); ctx.lineTo(cx - s * 0.05, cy + s * 0.55); ctx.lineTo(cx + s, cy - s); ctx.closePath(); fill ? ctx.fill() : ctx.stroke() }
  else if (kind === 'bookmark') { ctx.moveTo(cx - s * 0.6, cy - s); ctx.lineTo(cx + s * 0.6, cy - s); ctx.lineTo(cx + s * 0.6, cy + s); ctx.lineTo(cx, cy + s * 0.4); ctx.lineTo(cx - s * 0.6, cy + s); ctx.closePath(); ctx.stroke() }
  else if (kind === 'music') {
    ctx.moveTo(cx - s * 0.2, cy + s); ctx.lineTo(cx - s * 0.2, cy - s); ctx.lineTo(cx + s, cy - s * 1.3)
    ctx.moveTo(cx - s * 0.2, cy - s * 0.3); ctx.lineTo(cx + s, cy - s * 0.6); ctx.stroke()
    ctx.beginPath(); ctx.arc(cx - s * 0.5, cy + s, s * 0.35, 0, 7); ctx.arc(cx + s * 0.7, cy + s - s * 0.3, s * 0.35, 0, 7); ctx.fill()
  }
  ctx.restore()
}

function cleanCanvas(cfg: Cfg): HTMLCanvasElement {
  const [w, h] = PLATFORMS[cfg.platform].ratios[cfg.ratio]
  return coverCanvas(cfg.img, w, h, cfg.fit, cfg.bg)
}
function exportCard(cfg: Cfg): HTMLCanvasElement {
  const brand = PLATFORMS[cfg.platform].brand
  const W = 1080
  const [rw, rh] = PLATFORMS[cfg.platform].ratios[cfg.ratio]
  const imgH = Math.round(W * rh / rw)
  const pad = 36, headH = 134
  const capLines = brand === 'instagram' ? 3 : 4
  const textTop = brand !== 'instagram' && cfg.caption ? capLines * 44 + 18 : 0
  const footH = brand === 'instagram' ? 140 + 58 + capLines * 46 + 26 : 150 + 60
  const H = headH + textTop + imgH + footH
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, W, H)
  const accent = brand === 'facebook' ? '#1877f2' : brand === 'linkedin' ? '#0a66c2' : '#c13584'

  avatar(ctx, pad, 34, 34, accent, cfg.username)
  ctx.fillStyle = '#111'; ctx.font = '700 30px ' + FS
  ctx.fillText(cfg.username, pad + 92, brand === 'instagram' ? 74 : 60)
  ctx.fillStyle = '#8a8f96'; ctx.font = '400 24px ' + FS
  if (brand === 'instagram' && cfg.ubicacion) ctx.fillText(cfg.ubicacion, pad + 92, 102)
  if (brand === 'facebook') ctx.fillText('Hace 2 h · 🌐', pad + 92, 92)
  if (brand === 'linkedin') ctx.fillText((cfg.ubicacion || 'DKV Seguros') + ' · 1.º', pad + 92, 92)
  ctx.fillStyle = '#9aa0a6';[0, 1, 2].forEach((i) => { ctx.beginPath(); ctx.arc(W - pad - i * 22, 60, 4, 0, 7); ctx.fill() })

  let y = headH
  if (brand !== 'instagram' && cfg.caption) {
    ctx.fillStyle = '#1c1e21'; ctx.font = '400 28px ' + FS
    wrapText(ctx, cfg.caption, pad, y + 20, W - pad * 2, 40, capLines); y += textTop
  }
  drawCover(ctx, cfg, 0, y, W, imgH); y += imgH

  if (brand === 'instagram') {
    y += 24
    strokeIcon(ctx, 'heart', pad + 22, y + 20, 22, '#262626')
    strokeIcon(ctx, 'comment', pad + 92, y + 20, 22, '#262626')
    strokeIcon(ctx, 'send', pad + 160, y + 20, 22, '#262626')
    strokeIcon(ctx, 'bookmark', W - pad - 18, y + 20, 22, '#262626')
    y += 62
    ctx.fillStyle = '#111'; ctx.font = '700 28px ' + FS; ctx.fillText(`${cfg.likes} me gusta`, pad, y); y += 48
    ctx.font = '700 28px ' + FS; ctx.fillText(cfg.username + '  ', pad, y)
    const uw = ctx.measureText(cfg.username + '  ').width
    ctx.font = '400 28px ' + FS; wrapFrom(ctx, cfg.caption, pad, uw, y, W - pad * 2, 46, capLines)
  } else {
    ctx.strokeStyle = '#e4e6eb'; ctx.beginPath(); ctx.moveTo(0, y + 1); ctx.lineTo(W, y + 1); ctx.stroke()
    ctx.fillStyle = '#65676b'; ctx.font = '400 25px ' + FS; ctx.fillText(`👍❤️ ${cfg.likes}`, pad, y + 44)
    const rt = brand === 'linkedin' ? '32 comentarios' : '18 comentarios · 4 compartidos'
    ctx.fillText(rt, W - pad - ctx.measureText(rt).width, y + 44); y += 74
    ctx.strokeStyle = '#e4e6eb'; ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke()
    const labels = brand === 'linkedin' ? ['Recomendar', 'Comentar', 'Compartir'] : ['Me gusta', 'Comentar', 'Compartir']
    ctx.fillStyle = '#65676b'; ctx.font = '600 26px ' + FS; ctx.textAlign = 'center'
    labels.forEach((l, i) => ctx.fillText(l, (W / (labels.length * 2)) * (i * 2 + 1), y + 58)); ctx.textAlign = 'left'
  }
  return c
}
function exportBleed(cfg: Cfg): HTMLCanvasElement {
  const brand = PLATFORMS[cfg.platform].brand
  const W = 1080, H = 1920, tt = brand === 'tiktok'
  const c = document.createElement('canvas'); c.width = W; c.height = H
  const ctx = c.getContext('2d')!; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H)
  drawCover(ctx, cfg, 0, 0, W, H)
  let g = ctx.createLinearGradient(0, 0, 0, 240); g.addColorStop(0, 'rgba(0,0,0,.5)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, 240)
  g = ctx.createLinearGradient(0, H - 560, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,.72)')
  ctx.fillStyle = g; ctx.fillRect(0, H - 560, W, 560)
  if (brand === 'ig-story') {
    ctx.fillStyle = 'rgba(255,255,255,.4)'; ctx.beginPath(); ctx.roundRect(40, 46, W - 80, 8, 4); ctx.fill()
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.roundRect(40, 46, (W - 80) * 0.44, 8, 4); ctx.fill()
  }
  avatar(ctx, 44, 84, 30, '#c13584', cfg.username)
  ctx.fillStyle = '#fff'; ctx.font = '700 30px ' + FS
  ctx.fillText(cfg.username + (cfg.verified ? '  ✔' : ''), 120, 126)
  if (!tt) { ctx.fillStyle = 'rgba(255,255,255,.85)'; ctx.font = '400 24px ' + FS; ctx.fillText('2 h', 120 + ctx.measureText(cfg.username).width + 40, 126) }
  const rx = W - 80; let ry = H - 720
  ;([['heart', cfg.likes], ['comment', '18'], ['send', 'Enviar']] as [string, string][]).forEach(([icn, lbl]) => {
    strokeIcon(ctx, icn, rx, ry, 30, '#fff', true)
    ctx.fillStyle = '#fff'; ctx.font = '600 24px ' + FS; ctx.textAlign = 'center'; ctx.fillText(lbl, rx, ry + 58); ctx.textAlign = 'left'; ry += 150
  })
  ctx.fillStyle = '#fff'; ctx.font = '700 30px ' + FS; ctx.fillText('@' + cfg.username, 48, H - 268)
  ctx.font = '400 28px ' + FS; wrapText(ctx, cfg.caption, 48, H - 218, W - 190, 40, 3)
  if (tt) { strokeIcon(ctx, 'music', 68, H - 74, 15, '#fff', true); ctx.font = '400 24px ' + FS; ctx.fillText('Sonido original · ' + cfg.username, 100, H - 66) }
  return c
}
function mockCanvas(cfg: Cfg): HTMLCanvasElement {
  return PLATFORMS[cfg.platform].type === 'bleed' ? exportBleed(cfg) : exportCard(cfg)
}

// ============================ Live preview icons (JSX) ============================
const Dots = ({ c }: { c: string }) => (
  <svg viewBox="0 0 24 24" fill={c} width="20" height="20"><circle cx="5" cy="12" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="19" cy="12" r="1.6" /></svg>
)
const Ver = () => (
  <svg className="fsim-verified" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l2.4 1.8 3-.2 1 2.8 2.6 1.4-.8 2.9.8 2.9-2.6 1.4-1 2.8-3-.2L12 22l-2.4-1.8-3 .2-1-2.8L3 16.4l.8-2.9L3 10.6l2.6-1.4 1-2.8 3 .2z" /><path d="M10.5 14.6 8.2 12.3l-1.1 1.1 3.4 3.4 6-6-1.1-1.1z" fill="#fff" /></svg>
)

// ============================ Component ============================
export default function ContenidoPage() {
  const [images, setImages] = useState<{ src: string; img: HTMLImageElement }[]>([])
  const [active, setActive] = useState(-1)
  const [platform, setPlatform] = useState<PlatKey>('ig-feed')
  const [ratio, setRatio] = useState('4:5')
  const [username, setUsername] = useState('dkvseguros')
  const [ubicacion, setUbicacion] = useState('DKV Seguros')
  const [likes, setLikes] = useState('248')
  const [caption, setCaption] = useState('Cuida tu salud con quien más sabe 🦷✨ Pide información sin compromiso. #salud #seguro #DKV')
  const [verified, setVerified] = useState(false)
  const [fit, setFit] = useState<Fit>('cover')
  const [bg, setBg] = useState('#ffffff')

  const [pubMode, setPubMode] = useState<'borrador' | 'programado'>('borrador')
  const [fecha, setFecha] = useState('')
  const [filtro, setFiltro] = useState<'todos' | Estado>('todos')
  const [publicando, setPublicando] = useState<string | null>(null)

  const [saved, setSaved] = useState<SavedRow[]>([])
  const [saving, setSaving] = useState(false)
  const [needsSetup, setNeedsSetup] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const toastT = useRef<ReturnType<typeof setTimeout> | null>(null)

  const showToast = useCallback((m: string) => {
    setToast(m); if (toastT.current) clearTimeout(toastT.current)
    toastT.current = setTimeout(() => setToast(null), 2600)
  }, [])

  const plat = PLATFORMS[platform]
  const [w, h] = plat.ratios[ratio]
  const has = active >= 0
  const src = has ? images[active].src : ''

  const cfg = useCallback((): Cfg => ({ img: images[active].img, username, ubicacion, likes, caption, verified, fit, bg, platform, ratio }), [images, active, username, ubicacion, likes, caption, verified, fit, bg, platform, ratio])

  // ---- Collection (Supabase) ----
  const fetchSaved = useCallback(async () => {
    const { data, error } = await supabase.from('contenido_simulaciones').select('*').order('created_at', { ascending: false })
    if (error) { setNeedsSetup(true); return }
    setNeedsSetup(false)
    setSaved((data || []) as SavedRow[])
  }, [])

  useEffect(() => {
    fetchSaved()
    const ch = supabase.channel('contenido_simulaciones_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'contenido_simulaciones' }, fetchSaved)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [fetchSaved])

  // ---- Uploads ----
  const addFiles = useCallback((list: FileList | null) => {
    if (!list) return
    const files = [...list].filter((f) => f.type.startsWith('image/'))
    files.forEach((f) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => setImages((prev) => { const next = [...prev, { src: reader.result as string, img }]; setActive(next.length - 1); return next })
        img.src = reader.result as string
      }
      reader.readAsDataURL(f)
    })
  }, [])

  const removeImage = (i: number) => {
    setImages((prev) => {
      const next = prev.filter((_, idx) => idx !== i)
      setActive((a) => (i <= a ? Math.max(-1, a - 1) : a) || (next.length ? Math.min(a, next.length - 1) : -1))
      return next
    })
  }

  function selectPlatform(k: PlatKey) { setPlatform(k); setRatio(PLATFORMS[k].def) }

  // ---- Downloads (current) ----
  const dlClean = () => { if (!has) return; download(cleanCanvas(cfg()), `foto-lista-${stampOf(platform, ratio)}.jpg`); showToast(`Foto lista descargada · ${w}×${h}px`) }
  const dlMock = () => { if (!has) return; download(mockCanvas(cfg()), `simulacion-${stampOf(platform, ratio)}.jpg`); showToast('Simulación descargada') }

  // ---- Save to collection ----
  async function saveCurrent() {
    if (!has || saving) return
    if (pubMode === 'programado' && !fecha) { showToast('Elige la fecha y hora para programar.'); return }
    setSaving(true)
    try {
      const blob = await (await fetch(images[active].src)).blob()
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
      const up = await supabase.storage.from('contenido-social').upload(path, blob, { contentType: blob.type || 'image/jpeg', upsert: false })
      if (up.error) throw up.error
      const { data: pub } = supabase.storage.from('contenido-social').getPublicUrl(path)

      // Foto lista (recortada al tamaño exacto de la red) — es la que se PUBLICA en Instagram/Facebook.
      const pubBlob: Blob = await new Promise((res) => cleanCanvas(cfg()).toBlob((b) => res(b as Blob), 'image/jpeg', 0.92))
      const pubPath = `pub-${Date.now()}-${Math.random().toString(36).slice(2, 7)}.jpg`
      const pubUp = await supabase.storage.from('contenido-social').upload(pubPath, pubBlob, { contentType: 'image/jpeg', upsert: false })
      const pubUrl = pubUp.error ? pub.publicUrl : supabase.storage.from('contenido-social').getPublicUrl(pubPath).data.publicUrl

      const [pw, ph] = plat.ratios[ratio]
      const tw = 240, th = Math.round((tw * ph) / pw)
      const thumb = coverCanvas(images[active].img, tw, th, fit, bg).toDataURL('image/jpeg', 0.72)
      const { data: userData } = await supabase.auth.getUser()
      const estado: Estado = pubMode === 'programado' ? 'programado' : 'borrador'
      const programado_para = pubMode === 'programado' ? localInputToIso(fecha) : null
      const ins = await supabase.from('contenido_simulaciones').insert({
        autor: userData.user?.email ?? null, platform, ratio, username, ubicacion, likes, caption, verified, fit, bg,
        img_url: pub.publicUrl, img_path: path, pub_url: pubUrl, pub_path: pubPath, thumb, estado, programado_para,
      })
      if (ins.error) throw ins.error
      showToast(estado === 'programado' ? `Programado para ${fmtFecha(programado_para)} ✓` : 'Guardado como borrador ✓')
      fetchSaved()
    } catch (e) {
      console.error(e); setNeedsSetup(true); showToast('No se pudo guardar. Revisa la configuración de Supabase.')
    } finally { setSaving(false) }
  }

  // ---- Collection actions ----
  const rowCfg = (rec: SavedRow, img: HTMLImageElement): Cfg => ({ img, username: rec.username, ubicacion: rec.ubicacion, likes: rec.likes, caption: rec.caption, verified: rec.verified, fit: rec.fit, bg: rec.bg, platform: rec.platform, ratio: rec.ratio })

  async function downloadRec(rec: SavedRow, kind: 'foto' | 'sim') {
    try {
      const img = await loadImg(rec.img_url, true)
      const c = kind === 'foto' ? cleanCanvas(rowCfg(rec, img)) : mockCanvas(rowCfg(rec, img))
      download(c, `${kind === 'foto' ? 'foto-lista' : 'simulacion'}-${stampOf(rec.platform, rec.ratio)}.jpg`)
      showToast(kind === 'foto' ? 'Foto lista descargada' : 'Simulación descargada')
    } catch { showToast('No se pudo descargar la imagen.') }
  }

  async function delSaved(rec: SavedRow) {
    setSaved((prev) => prev.filter((r) => r.id !== rec.id))
    const paths = [rec.img_path, rec.pub_path].filter(Boolean) as string[]
    if (paths.length) await supabase.storage.from('contenido-social').remove(paths)
    await supabase.from('contenido_simulaciones').delete().eq('id', rec.id)
  }

  async function publishNow(rec: SavedRow) {
    if (publicando) return
    setPublicando(rec.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
        body: JSON.stringify({ id: rec.id }),
      })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { showToast(j.error || 'No se pudo publicar'); return }
      showToast('¡Publicado en la red! ✓')
      fetchSaved()
    } catch {
      showToast('Error de conexión al publicar')
    } finally { setPublicando(null) }
  }

  async function updateRec(rec: SavedRow, patch: Partial<SavedRow>) {
    setSaved((prev) => prev.map((r) => (r.id === rec.id ? { ...r, ...patch } : r)))
    await supabase.from('contenido_simulaciones').update(patch).eq('id', rec.id)
  }
  function cambiarEstado(rec: SavedRow, estado: Estado) {
    const patch: Partial<SavedRow> = { estado }
    if (estado === 'publicado') patch.publicado_en = new Date().toISOString()
    if (estado === 'programado' && !rec.programado_para) patch.programado_para = new Date(Date.now() + 3600_000).toISOString()
    updateRec(rec, patch)
    showToast(estado === 'publicado' ? 'Marcado como publicado ✓' : estado === 'programado' ? 'Movido a programados' : 'Movido a borradores')
  }
  function reprogramar(rec: SavedRow, localValue: string) {
    const iso = localInputToIso(localValue)
    updateRec(rec, { programado_para: iso, estado: iso ? 'programado' : rec.estado })
  }

  function loadSaved(rec: SavedRow) {
    loadImg(rec.img_url, true).then((img) => {
      setImages((prev) => { const next = [...prev, { src: rec.img_url, img }]; setActive(next.length - 1); return next })
      setPlatform(rec.platform); setRatio(rec.ratio); setUsername(rec.username); setUbicacion(rec.ubicacion)
      setLikes(rec.likes); setCaption(rec.caption); setVerified(rec.verified); setFit(rec.fit); setBg(rec.bg)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  async function downloadAll() {
    if (!saved.length) return
    showToast(`Descargando ${saved.length} foto(s)…`)
    for (const rec of saved) {
      try { const img = await loadImg(rec.img_url, true); download(cleanCanvas(rowCfg(rec, img)), `foto-lista-${stampOf(rec.platform, rec.ratio)}.jpg`) } catch { /* skip */ }
      await new Promise((r) => setTimeout(r, 500))
    }
  }

  const objfit = fit === 'cover' ? { objectFit: 'cover' as const } : { objectFit: 'contain' as const, background: bg }

  return (
    <div className="fsim" style={{ padding: 24, maxWidth: 1400, margin: '0 auto' }}>
      <FsimStyles />
      <PageHero
        title="Simulador de contenido"
        subtitle="Contenido para redes · KDentalX"
        right={
          <div className="fsim-hero-actions">
            <button className="fsim-btn ghost" onClick={dlMock} disabled={!has}><ImageIcon size={15} /> Simulación</button>
            <button className="fsim-btn ghost" onClick={dlClean} disabled={!has}><Download size={15} /> Foto lista</button>
          </div>
        }
      />

      {/* ---- Barra de publicación (estilo Meta Business) ---- */}
      <div className="fsim-pubbar">
        <div className="fsim-pubseg">
          <button className={pubMode === 'borrador' ? 'active' : ''} onClick={() => setPubMode('borrador')}>Guardar borrador</button>
          <button className={pubMode === 'programado' ? 'active' : ''} onClick={() => setPubMode('programado')}>Programar</button>
        </div>
        {pubMode === 'programado' && (
          <input type="datetime-local" className="fsim-dt" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        )}
        <div className="fsim-pub-hint">{pubMode === 'programado' ? 'Se añade al planificador con fecha de publicación.' : 'Se guarda como borrador para revisarlo con el equipo.'}</div>
        <button className="fsim-btn solid dark" onClick={saveCurrent} disabled={!has || saving}>
          {saving ? <Loader2 size={15} className="fsim-spin" /> : pubMode === 'programado' ? <CalendarClock size={15} /> : <Bookmark size={15} />}
          {saving ? 'Guardando…' : pubMode === 'programado' ? 'Programar publicación' : 'Guardar borrador'}
        </button>
      </div>

      {needsSetup && (
        <div className="fsim-setup">
          <AlertTriangle size={18} />
          <div>
            <b>Falta activar el guardado compartido.</b> Ejecuta una vez el archivo <code>supabase-contenido-social.sql</code> en Supabase → SQL Editor. Mientras tanto puedes simular y descargar, pero la colección del equipo no se guardará.
          </div>
        </div>
      )}

      <MetaConexion />

      <div className="fsim-body">
        {/* ---------------- Controls ---------------- */}
        <aside className="fsim-panel">
          <section className="fsim-grp">
            <div className="fsim-grph"><span className="fsim-n">1</span><h2>Tus fotos</h2></div>
            <label className="fsim-drop">
              <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { addFiles(e.target.files); e.target.value = '' }} />
              <div className="fsim-drop-ic"><Upload size={20} /></div>
              <b>Arrastra o haz clic para subir</b>
              <small>JPG o PNG · puedes subir varias</small>
            </label>
            {images.length > 0 && (
              <div className="fsim-thumbs">
                {images.map((im, i) => (
                  <div key={i} className={'fsim-thumb' + (i === active ? ' active' : '')} onClick={() => setActive(i)}>
                    <img src={im.src} alt="" />
                    <button className="fsim-x" title="Quitar" onClick={(e) => { e.stopPropagation(); removeImage(i) }}>×</button>
                  </div>
                ))}
                <div className="fsim-thumb add" onClick={() => fileRef.current?.click()}><Plus size={18} /></div>
              </div>
            )}
          </section>

          <section className="fsim-grp">
            <div className="fsim-grph"><span className="fsim-n">2</span><h2>Red social</h2></div>
            <div className="fsim-nets">
              {(Object.keys(PLATFORMS) as PlatKey[]).map((k) => (
                <button key={k} className={'fsim-net' + (k === platform ? ' active' : '')} onClick={() => selectPlatform(k)}>
                  <NetIcon brand={PLATFORMS[k].brand} /><span>{PLATFORMS[k].short}</span>
                </button>
              ))}
            </div>
            {Object.keys(plat.ratios).length > 1 && (
              <div className="fsim-ratios">
                {Object.keys(plat.ratios).map((r) => (
                  <button key={r} className={'fsim-chip' + (r === ratio ? ' active' : '')} onClick={() => setRatio(r)}>{r}</button>
                ))}
              </div>
            )}
          </section>

          <section className="fsim-grp">
            <div className="fsim-grph"><span className="fsim-n">3</span><h2>Contenido</h2></div>
            <div className="fsim-field"><label>Nombre de usuario</label><input className="fsim-input" value={username} maxLength={30} onChange={(e) => setUsername(e.target.value)} /></div>
            <div className="fsim-row2">
              <div className="fsim-field"><label>Ubicación</label><input className="fsim-input" value={ubicacion} maxLength={40} onChange={(e) => setUbicacion(e.target.value)} /></div>
              <div className="fsim-field"><label>Me gusta</label><input className="fsim-input" value={likes} maxLength={9} onChange={(e) => setLikes(e.target.value)} /></div>
            </div>
            <div className="fsim-field">
              <label>Pie de foto <span className="fsim-cnt">{caption.length}/400</span></label>
              <textarea className="fsim-input" value={caption} maxLength={400} onChange={(e) => setCaption(e.target.value)} />
            </div>
            <label className="fsim-switch">
              <input type="checkbox" checked={verified} onChange={(e) => setVerified(e.target.checked)} /><span className="fsim-track" /> Cuenta verificada
            </label>
          </section>

          <section className="fsim-grp">
            <div className="fsim-grph"><span className="fsim-n">4</span><h2>Encaje de la foto</h2></div>
            <div className="fsim-seg">
              <button className={fit === 'cover' ? 'active' : ''} onClick={() => setFit('cover')}>Rellenar</button>
              <button className={fit === 'contain' ? 'active' : ''} onClick={() => setFit('contain')}>Ajustar completa</button>
            </div>
            {fit === 'contain' && (
              <div className="fsim-color-row"><label>Color del borde</label><input type="color" value={bg} onChange={(e) => setBg(e.target.value)} /></div>
            )}
          </section>
        </aside>

        {/* ---------------- Preview ---------------- */}
        <div className="fsim-stage">
          {!has ? (
            <div className="fsim-empty">
              <div className="fsim-empty-ic"><ImageIcon size={30} /></div>
              <h3>Sube una foto para empezar</h3>
              <p>Verás al instante cómo queda publicada en cada red. Pulsa <b>Guardar</b> y se añade a la colección del equipo, lista para descargar y publicar.</p>
            </div>
          ) : plat.type === 'bleed' ? (
            <Phone brand={plat.brand} src={src} username={username} likes={likes} caption={caption} verified={verified} fit={fit} bg={bg} />
          ) : (
            <Card brand={plat.brand} src={src} w={w} h={h} username={username} ubicacion={ubicacion} likes={likes} caption={caption} verified={verified} objfit={objfit} />
          )}
        </div>
      </div>

      {/* ---------------- Planificador de contenido ---------------- */}
      {saved.length > 0 && (
        <div className="fsim-saved">
          <div className="fsim-saved-head">
            <div className="fsim-saved-title">Planificador de contenido <span>{saved.length}</span></div>
            <button className="fsim-btn ghost sm" onClick={downloadAll}><Download size={14} /> Descargar todas</button>
          </div>
          <div className="fsim-filtros">
            {(['todos', 'programado', 'borrador', 'publicado'] as const).map((f) => {
              const n = f === 'todos' ? saved.length : saved.filter((r) => r.estado === f).length
              const plurales: Record<'todos' | Estado, string> = { todos: 'Todos', programado: 'Programados', borrador: 'Borradores', publicado: 'Publicados' }
              return <button key={f} className={'fsim-filtro' + (filtro === f ? ' active' : '')} onClick={() => setFiltro(f)}>{plurales[f]} <span>{n}</span></button>
            })}
          </div>
          <div className="fsim-planner">
            {saved
              .filter((r) => filtro === 'todos' || r.estado === filtro)
              .slice()
              .sort((a, b) => {
                const order: Record<Estado, number> = { programado: 0, borrador: 1, publicado: 2 }
                if (order[a.estado] !== order[b.estado]) return order[a.estado] - order[b.estado]
                if (a.estado === 'programado') return (a.programado_para || '').localeCompare(b.programado_para || '')
                return (b.created_at || '').localeCompare(a.created_at || '')
              })
              .map((rec) => {
                const p = PLATFORMS[rec.platform]
                const em = estadoMeta(rec.estado)
                return (
                  <div key={rec.id} className="fsim-pcard">
                    <div className="fsim-sc-thumb" title="Abrir para editar" onClick={() => loadSaved(rec)}>
                      <img src={rec.thumb || rec.img_url} alt="" />
                      <span className="fsim-sc-badge">{p.short}</span>
                      <span className="fsim-estado" style={{ color: em.color, background: em.bg }}>{em.label}</span>
                      <span className="fsim-sc-open">Editar</span>
                    </div>
                    <div className="fsim-pcard-body">
                      {rec.estado === 'programado' && rec.programado_para && (
                        <div className="fsim-pfecha"><CalendarClock size={13} /> {fmtFecha(rec.programado_para)}</div>
                      )}
                      {rec.estado === 'publicado' && <div className="fsim-pfecha ok"><CheckCircle2 size={13} /> Publicado</div>}
                      {rec.caption && <div className="fsim-pcaption">{rec.caption}</div>}
                      {rec.autor && <div className="fsim-pautor">por {rec.autor.split('@')[0]}</div>}
                      <div className="fsim-prow">
                        <select className="fsim-select" value={rec.estado} onChange={(e) => cambiarEstado(rec, e.target.value as Estado)}>
                          <option value="borrador">Borrador</option>
                          <option value="programado">Programado</option>
                          <option value="publicado">Publicado</option>
                        </select>
                        {rec.estado === 'programado' && (
                          <input type="datetime-local" className="fsim-dt sm" value={isoToLocalInput(rec.programado_para)} onChange={(e) => reprogramar(rec, e.target.value)} />
                        )}
                      </div>
                      {AUTO_PUB.has(rec.platform) && rec.estado !== 'publicado' && (
                        <button className="fsim-pubnow" onClick={() => publishNow(rec)} disabled={publicando === rec.id}>
                          {publicando === rec.id ? <Loader2 size={13} className="fsim-spin" /> : <Send size={13} />} Publicar ahora
                        </button>
                      )}
                      <div className="fsim-sc-actions">
                        <button className="fsim-scb" onClick={() => downloadRec(rec, 'foto')} title="Descargar foto lista"><Download size={12} /> Foto</button>
                        <button className="fsim-scb" onClick={() => downloadRec(rec, 'sim')} title="Descargar simulación"><ImageIcon size={12} /> Sim</button>
                        <button className="fsim-scb del" onClick={() => delSaved(rec)} title="Eliminar"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  </div>
                )
              })}
          </div>
        </div>
      )}

      {toast && <div className="fsim-toast"><span className="fsim-toast-dot" />{toast}</div>}
    </div>
  )
}

// ============================ Preview sub-components ============================
function NetIcon({ brand }: { brand: Brand }) {
  if (brand === 'facebook') return <svg className="fsim-ic" viewBox="0 0 24 24" fill="#1877F2"><path d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.4v7A10 10 0 0 0 22 12z" /></svg>
  if (brand === 'tiktok') return <svg className="fsim-ic" viewBox="0 0 24 24" fill="#111"><path d="M16.6 5.8a4.3 4.3 0 0 1-1-2.8h-3v11.3a2.5 2.5 0 1 1-2.5-2.5c.2 0 .4 0 .6.1V8.8a5.5 5.5 0 1 0 4.9 5.5V9.1a7.2 7.2 0 0 0 4 1.2V7.3a4.3 4.3 0 0 1-3-1.5z" /></svg>
  if (brand === 'linkedin') return <svg className="fsim-ic" viewBox="0 0 24 24" fill="#0A66C2"><path d="M20.4 3H3.6A.6.6 0 0 0 3 3.6v16.8a.6.6 0 0 0 .6.6h16.8a.6.6 0 0 0 .6-.6V3.6a.6.6 0 0 0-.6-.6zM8.3 18.3H5.5V9.4h2.8v8.9zM6.9 8.2a1.6 1.6 0 1 1 0-3.3 1.6 1.6 0 0 1 0 3.3zm11.4 10.1h-2.8v-4.3c0-1 0-2.4-1.4-2.4s-1.7 1.1-1.7 2.3v4.4H9.6V9.4h2.7v1.2h.1a3 3 0 0 1 2.6-1.4c2.8 0 3.3 1.8 3.3 4.2v4.9z" /></svg>
  return <svg className="fsim-ic" viewBox="0 0 24 24" fill="none" stroke="#E1306C" strokeWidth="2"><rect x="2" y="2" width="20" height="20" rx="5.5" /><circle cx="12" cy="12" r="4" /><circle cx="17.6" cy="6.4" r="1.2" fill="#E1306C" stroke="none" /></svg>
}

function Card({ brand, src, w, h, username, ubicacion, likes, caption, verified, objfit }: {
  brand: Brand; src: string; w: number; h: number; username: string; ubicacion: string; likes: string; caption: string; verified: boolean; objfit: React.CSSProperties
}) {
  const photo = <img className="fsim-photo" src={src} alt="" style={{ aspectRatio: `${w} / ${h}`, ...objfit }} />
  const avatarBg = brand === 'facebook' ? { background: '#1877f2' } : brand === 'linkedin' ? { background: '#0a66c2', borderRadius: 9 } : undefined
  return (
    <div className="fsim-postcard">
      <div className={`fsim-cardin ${brand}`}>
        <div className="fsim-hd">
          <div className="fsim-av" style={avatarBg}>{ini(username)}</div>
          <div className="fsim-who">
            <b>{username} {verified && <Ver />}</b>
            {brand === 'instagram' && ubicacion && <small>{ubicacion}</small>}
            {brand === 'facebook' && <small>Hace 2 h · 🌐</small>}
            {brand === 'linkedin' && <><small>{ubicacion || 'DKV Seguros'} · 1.º</small><small>Hace 3 h · 🌐</small></>}
          </div>
          <Dots c={brand === 'instagram' ? '#262626' : brand === 'facebook' ? '#65676b' : '#5e6d77'} />
        </div>

        {brand !== 'instagram' && caption && <div className="fsim-cardtext">{caption}</div>}
        {photo}

        {brand === 'instagram' ? (
          <>
            <div className="fsim-acts">
              <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8"><path d="M20.8 8.6c0 4.4-8.8 9.4-8.8 9.4s-8.8-5-8.8-9.4a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9z" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8"><path d="M20.9 12a8.5 8.5 0 0 1-11.9 7.8L3 21l1.3-5.4A8.5 8.5 0 1 1 20.9 12z" /></svg>
              <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              <span className="fsim-sp" />
              <svg viewBox="0 0 24 24" fill="none" stroke="#262626" strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
            </div>
            <div className="fsim-likes">{likes} me gusta</div>
            <div className="fsim-cap"><b>{username}</b>{caption}</div>
          </>
        ) : (
          <>
            <div className="fsim-stat"><span>{brand === 'linkedin' ? '👍💡❤️' : '👍❤️'} {likes}</span><span>{brand === 'linkedin' ? '32 comentarios' : '18 comentarios · 4 compartidos'}</span></div>
            <div className="fsim-barw">
              <div>{brand === 'linkedin' ? 'Recomendar' : 'Me gusta'}</div><div>Comentar</div><div>Compartir</div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function Phone({ brand, src, username, likes, caption, verified, fit, bg }: {
  brand: Brand; src: string; username: string; likes: string; caption: string; verified: boolean; fit: Fit; bg: string
}) {
  const tt = brand === 'tiktok'
  const bgStyle: React.CSSProperties = fit === 'contain' ? { objectFit: 'contain', background: bg } : { objectFit: 'cover' }
  return (
    <div className="fsim-phone">
      <div className="fsim-island" />
      <div className="fsim-screen">
        <div className="fsim-statusbar">
          <span>9:41</span>
          <div className="fsim-sb-r">
            <svg viewBox="0 0 20 12" width="17"><rect x="0" y="7" width="3" height="5" rx=".5" fill="#fff" /><rect x="4.5" y="5" width="3" height="7" rx=".5" fill="#fff" /><rect x="9" y="2.5" width="3" height="9.5" rx=".5" fill="#fff" /><rect x="13.5" y="0" width="3" height="12" rx=".5" fill="#fff" /></svg>
            <svg viewBox="0 0 26 12" width="22"><rect x="1" y="1" width="21" height="10" rx="2.5" fill="none" stroke="#fff" strokeWidth="1" /><rect x="2.5" y="2.5" width="16" height="7" rx="1.2" fill="#fff" /><rect x="23" y="4" width="1.8" height="4" rx="1" fill="#fff" /></svg>
          </div>
        </div>
        <div className="fsim-phone-body">
          <div className="fsim-bleedwrap">
            <img className="fsim-bg" src={src} alt="" style={bgStyle} />
            <div className="fsim-grad-t" /><div className="fsim-grad-b" />
            {brand === 'ig-story' && <div className="fsim-story-prog" />}
            <div className="fsim-top">
              <div className="fsim-av">{ini(username)}</div>
              <div><b>{username}{verified ? ' ✔' : ''}</b> <small>{tt ? '' : '· 2 h'}</small></div>
            </div>
            <div className="fsim-rail">
              {tt && <div className="fsim-it"><div className="fsim-av" style={{ width: 34, height: 34 }}>{ini(username)}</div></div>}
              <div className="fsim-it"><svg viewBox="0 0 24 24" fill="#fff"><path d="M20.8 8.6c0 4.4-8.8 9.4-8.8 9.4s-8.8-5-8.8-9.4a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9z" /></svg><span>{likes}</span></div>
              <div className="fsim-it"><svg viewBox="0 0 24 24" fill="#fff"><path d="M21 11.5a8.4 8.4 0 0 1-11.9 7.6L3 21l1.9-5.7A8.4 8.4 0 1 1 21 11.5z" /></svg><span>18</span></div>
              <div className="fsim-it"><svg viewBox="0 0 24 24" fill="#fff"><path d="M22 2 11 13M22 2l-7 20-4-9-9-4z" /></svg><span>Enviar</span></div>
            </div>
            <div className="fsim-foot">
              <b>@{username}</b><p>{caption}</p>
              {tt && <div className="fsim-music"><svg viewBox="0 0 24 24" fill="#fff"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg><span>Sonido original · {username}</span></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ============================ Scoped styles ============================
function FsimStyles() {
  return (
    <style>{`
    .fsim{ --ink:#16201d; --muted:#6b7a76; --faint:#9aa7a2; --line:#e6eae8; --line2:#dde4e0; --fill:#f2f6f4; --fill2:#eaf0ed; --accent:#0F7A63; --accent-hi:#0a5b49; --accent-deep:#0a5b49; --accent-soft:#e2f0ea; color:var(--ink); }
    .fsim *{ box-sizing:border-box }
    .fsim-hero-actions{ display:flex; gap:9px; flex-wrap:wrap }
    .fsim-btn{ border:1px solid rgba(255,255,255,.28); background:rgba(255,255,255,.12); color:#fff; padding:9px 14px; border-radius:10px; font-size:13px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; gap:7px; transition:.14s; white-space:nowrap; font-family:${FS}; backdrop-filter:blur(4px) }
    .fsim-btn:hover{ background:rgba(255,255,255,.2) }
    .fsim-btn.solid{ background:#fff; color:var(--accent-deep); border-color:#fff }
    .fsim-btn.solid:hover{ background:#eafaf4 }
    .fsim-btn:disabled{ opacity:.5; cursor:not-allowed }
    .fsim-btn.ghost.sm, .fsim-btn.sm{ background:#fff; color:var(--ink); border:1px solid var(--line2); padding:7px 12px; font-size:12.5px; backdrop-filter:none }
    .fsim-btn.ghost.sm:hover{ background:var(--fill) }
    .fsim-spin{ animation:fsimspin .8s linear infinite } @keyframes fsimspin{ to{ transform:rotate(360deg) } }

    .fsim-setup{ display:flex; gap:12px; align-items:flex-start; background:#fff7e6; border:1px solid #f5d98a; color:#7a5a12; border-radius:14px; padding:14px 16px; margin-bottom:20px; font-size:13.5px; line-height:1.5 }
    .fsim-setup code{ background:#fff0cc; padding:1px 6px; border-radius:5px; font-size:12.5px }
    .fsim-setup b{ color:#5a4210 }

    .fsim-body{ display:grid; grid-template-columns:360px 1fr; gap:20px; align-items:start }
    @media (max-width:900px){ .fsim-body{ grid-template-columns:1fr } }

    .fsim-panel{ background:#fff; border:1px solid var(--line); border-radius:18px; overflow:hidden; box-shadow:0 1px 2px rgba(22,32,29,.03), 0 14px 34px -22px rgba(22,32,29,.2) }
    .fsim-grp{ padding:18px 20px; border-bottom:1px solid var(--line) }
    .fsim-grp:last-child{ border-bottom:none }
    .fsim-grph{ display:flex; align-items:center; gap:9px; margin:0 0 14px }
    .fsim-n{ width:20px; height:20px; border-radius:6px; background:var(--accent-soft); color:var(--accent-deep); font-size:11px; font-weight:800; display:grid; place-items:center }
    .fsim-grph h2{ font-size:12.5px; font-weight:700; margin:0; letter-spacing:.02em; text-transform:uppercase; color:var(--muted) }

    .fsim-drop{ display:block; border:1.5px dashed #cfdad4; border-radius:14px; padding:22px 16px; text-align:center; cursor:pointer; transition:.16s; background:var(--fill) }
    .fsim-drop:hover{ border-color:var(--accent); background:var(--accent-soft) }
    .fsim-drop-ic{ width:44px; height:44px; border-radius:12px; margin:0 auto 10px; background:#fff; display:grid; place-items:center; box-shadow:0 2px 8px rgba(22,32,29,.08); color:var(--accent) }
    .fsim-drop b{ display:block; font-size:13.5px }
    .fsim-drop small{ color:var(--faint); font-size:12px }
    .fsim-thumbs{ display:grid; grid-template-columns:repeat(auto-fill,minmax(56px,1fr)); gap:9px; margin-top:12px }
    .fsim-thumb{ aspect-ratio:1; border-radius:10px; overflow:hidden; cursor:pointer; position:relative; border:2px solid transparent; background:#000 }
    .fsim-thumb img{ width:100%; height:100%; object-fit:cover; display:block }
    .fsim-thumb.active{ border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft) }
    .fsim-x{ position:absolute; top:3px; right:3px; width:18px; height:18px; border-radius:50%; background:rgba(10,20,16,.7); color:#fff; border:none; cursor:pointer; font-size:12px; line-height:18px; padding:0; display:none }
    .fsim-thumb:hover .fsim-x{ display:block }
    .fsim-thumb.add{ border:1.5px dashed #cfdad4; background:var(--fill); display:grid; place-items:center; color:var(--faint) }
    .fsim-thumb.add:hover{ border-color:var(--accent); color:var(--accent) }

    .fsim-nets{ display:grid; grid-template-columns:1fr 1fr; gap:9px }
    .fsim-net{ display:flex; align-items:center; gap:9px; padding:11px 12px; border-radius:12px; cursor:pointer; background:#fff; border:1.5px solid var(--line2); transition:.14s; text-align:left; font-size:13px; font-weight:600; color:var(--ink); position:relative; font-family:${FS} }
    .fsim-net:hover{ border-color:#c0ccc6 }
    .fsim-net.active{ border-color:var(--accent); background:var(--accent-soft) }
    .fsim-net.active::after{ content:"✓"; position:absolute; top:6px; right:8px; color:var(--accent-deep); font-size:11px; font-weight:800 }
    .fsim-ic{ width:19px; height:19px; flex:none }
    .fsim-ratios{ display:flex; gap:7px; margin-top:12px; flex-wrap:wrap }
    .fsim-chip{ padding:7px 14px; border-radius:20px; font-size:12px; font-weight:600; cursor:pointer; background:var(--fill); border:1.5px solid transparent; color:var(--muted); font-family:${FS} }
    .fsim-chip.active{ background:var(--accent); color:#fff }

    .fsim-field{ margin-bottom:14px } .fsim-field:last-child{ margin-bottom:0 }
    .fsim-field label{ display:block; font-size:12.5px; font-weight:600; color:var(--ink); margin-bottom:6px }
    .fsim-input{ width:100%; background:var(--fill); border:1.5px solid transparent; color:var(--ink); border-radius:11px; padding:11px 13px; font-size:13.5px; transition:.14s; resize:vertical; font-family:${FS} }
    .fsim-input:focus{ outline:none; background:#fff; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft) }
    textarea.fsim-input{ min-height:74px; line-height:1.45 }
    .fsim-row2{ display:grid; grid-template-columns:1fr 1fr; gap:11px }
    .fsim-cnt{ float:right; font-size:11px; color:var(--faint); font-weight:400 }

    .fsim-switch{ display:flex; align-items:center; gap:11px; cursor:pointer; font-size:13.5px; font-weight:600; user-select:none }
    .fsim-switch input{ position:absolute; opacity:0; pointer-events:none }
    .fsim-track{ width:42px; height:24px; border-radius:20px; background:#cfdad4; position:relative; transition:.18s; flex:none }
    .fsim-track::after{ content:""; position:absolute; top:3px; left:3px; width:18px; height:18px; border-radius:50%; background:#fff; transition:.18s; box-shadow:0 1px 3px rgba(0,0,0,.2) }
    .fsim-switch input:checked + .fsim-track{ background:var(--accent) }
    .fsim-switch input:checked + .fsim-track::after{ transform:translateX(18px) }

    .fsim-seg{ display:flex; background:var(--fill); border-radius:11px; padding:4px; gap:4px }
    .fsim-seg button{ flex:1; border:none; background:transparent; color:var(--muted); padding:8px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; transition:.12s; font-family:${FS} }
    .fsim-seg button.active{ background:#fff; color:var(--ink); box-shadow:0 1px 3px rgba(22,32,29,.1) }
    .fsim-color-row{ display:flex; align-items:center; gap:11px; margin-top:12px }
    .fsim-color-row label{ font-size:12.5px; font-weight:600; color:var(--muted) }
    .fsim-color-row input[type=color]{ width:44px; height:34px; border:1px solid var(--line2); border-radius:9px; padding:3px; background:#fff; cursor:pointer }

    .fsim-stage{ background:#fff; border:1px solid var(--line); border-radius:18px; min-height:520px; display:grid; place-items:center; padding:36px 24px; box-shadow:0 1px 2px rgba(22,32,29,.03), 0 14px 34px -22px rgba(22,32,29,.2) }
    .fsim-empty{ text-align:center; color:var(--muted); max-width:330px }
    .fsim-empty-ic{ width:74px; height:74px; border-radius:22px; margin:0 auto 16px; background:var(--accent-soft); display:grid; place-items:center; color:var(--accent) }
    .fsim-empty h3{ margin:0 0 8px; font-size:18px; color:var(--ink); letter-spacing:-.02em }
    .fsim-empty p{ margin:0; font-size:13.5px; line-height:1.55 }

    /* Post card */
    .fsim-postcard{ width:396px; max-width:100%; border-radius:16px; overflow:hidden; background:#fff; box-shadow:0 1px 2px rgba(22,32,29,.05),0 16px 40px -16px rgba(22,32,29,.28) }
    .fsim-cardin{ width:100%; font-size:14px }
    .fsim-hd{ display:flex; align-items:center; gap:11px; padding:12px 14px }
    .fsim-av{ width:38px; height:38px; border-radius:50%; flex:none; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:700; font-size:16px; background:linear-gradient(135deg,#2a2f8f,#c13584) }
    .fsim-who{ flex:1; min-width:0 } .fsim-who b{ font-size:13.5px; display:flex; align-items:center; gap:4px } .fsim-who small{ color:var(--muted); font-size:12px; display:block }
    .fsim-verified{ width:13px; height:13px; color:#3897f0; flex:none }
    .fsim-photo{ width:100%; display:block; background:#0b0d10 }
    .fsim-acts{ display:flex; align-items:center; gap:16px; padding:12px 14px 8px } .fsim-acts svg{ width:24px; height:24px } .fsim-sp{ flex:1 }
    .fsim-likes{ padding:0 14px; font-weight:600; font-size:13.5px }
    .fsim-cap{ padding:5px 14px 15px; font-size:13.5px; line-height:1.45 } .fsim-cap b{ margin-right:5px }
    .fsim-cardtext{ padding:2px 14px 11px; font-size:13.5px; line-height:1.45 }
    .fsim-stat{ display:flex; justify-content:space-between; padding:10px 14px; color:#65676b; font-size:12.5px; border-top:1px solid var(--line) }
    .fsim-barw{ display:flex; border-top:1px solid var(--line) }
    .fsim-barw div{ flex:1; text-align:center; padding:11px; color:#5e6d77; font-weight:600; font-size:12.5px }

    /* Phone */
    .fsim-phone{ width:300px; aspect-ratio:9/19; background:#0B0D12; border-radius:46px; padding:11px; box-shadow:0 8px 20px rgba(20,25,40,.14),0 40px 70px -24px rgba(20,25,40,.42); position:relative }
    .fsim-screen{ width:100%; height:100%; background:#000; border-radius:36px; overflow:hidden; position:relative; display:flex; flex-direction:column }
    .fsim-island{ position:absolute; top:12px; left:50%; transform:translateX(-50%); width:86px; height:24px; background:#000; border-radius:14px; z-index:30 }
    .fsim-statusbar{ height:42px; flex:none; display:flex; align-items:flex-end; justify-content:space-between; padding:0 24px 5px; font-size:13px; font-weight:600; color:#fff; z-index:20; position:relative }
    .fsim-sb-r{ display:flex; align-items:center; gap:6px }
    .fsim-phone-body{ flex:1; position:relative; overflow:hidden }
    .fsim-bleedwrap{ position:absolute; inset:0; color:#fff }
    .fsim-bg{ position:absolute; inset:0; width:100%; height:100% }
    .fsim-grad-t{ position:absolute; top:0; left:0; right:0; height:120px; background:linear-gradient(to bottom,rgba(0,0,0,.5),transparent) }
    .fsim-grad-b{ position:absolute; bottom:0; left:0; right:0; height:260px; background:linear-gradient(to top,rgba(0,0,0,.65),transparent) }
    .fsim-top{ position:absolute; top:8px; left:14px; right:14px; display:flex; align-items:center; gap:9px; z-index:3 }
    .fsim-top .fsim-av{ width:32px; height:32px; font-size:13px; border:1.5px solid rgba(255,255,255,.9) }
    .fsim-top b{ font-size:12.5px; text-shadow:0 1px 3px rgba(0,0,0,.45) } .fsim-top small{ color:rgba(255,255,255,.82); font-size:11px }
    .fsim-story-prog{ position:absolute; top:-4px; left:12px; right:12px; height:2.5px; border-radius:2px; background:rgba(255,255,255,.35); z-index:4 }
    .fsim-story-prog::after{ content:""; position:absolute; left:0; top:0; bottom:0; width:44%; background:#fff; border-radius:2px }
    .fsim-rail{ position:absolute; right:12px; bottom:96px; display:flex; flex-direction:column; gap:20px; align-items:center; z-index:3 }
    .fsim-it{ display:flex; flex-direction:column; align-items:center; gap:4px }
    .fsim-it svg{ width:29px; height:29px; filter:drop-shadow(0 1px 3px rgba(0,0,0,.55)) }
    .fsim-it span{ font-size:11px; font-weight:600; text-shadow:0 1px 3px rgba(0,0,0,.55) }
    .fsim-foot{ position:absolute; left:14px; right:66px; bottom:18px; z-index:3 }
    .fsim-foot b{ font-size:13px; text-shadow:0 1px 3px rgba(0,0,0,.55) }
    .fsim-foot p{ margin:5px 0 0; font-size:12px; line-height:1.4; text-shadow:0 1px 3px rgba(0,0,0,.55) }
    .fsim-music{ display:flex; align-items:center; gap:6px; margin-top:9px; font-size:11px } .fsim-music svg{ width:13px; height:13px }

    /* Collection */
    .fsim-saved{ background:#fff; border:1px solid var(--line); border-radius:18px; padding:18px 20px; margin-top:20px; box-shadow:0 1px 2px rgba(22,32,29,.03),0 14px 34px -22px rgba(22,32,29,.2) }
    .fsim-saved-head{ display:flex; align-items:center; justify-content:space-between; margin-bottom:14px }
    .fsim-saved-title{ font-size:14px; font-weight:700; letter-spacing:-.01em }
    .fsim-saved-title span{ display:inline-grid; place-items:center; min-width:20px; height:20px; padding:0 6px; margin-left:6px; background:var(--accent-soft); color:var(--accent-deep); border-radius:20px; font-size:11px; font-weight:800 }
    .fsim-saved-list{ display:flex; gap:13px; overflow-x:auto; padding:2px 0 6px }
    .fsim-card{ flex:none; width:152px }
    .fsim-sc-thumb{ position:relative; display:block; width:152px; height:114px; border-radius:11px; overflow:hidden; background:#0b0d10; cursor:pointer; box-shadow:0 2px 8px rgba(22,32,29,.12); transition:.14s }
    .fsim-sc-thumb:hover{ transform:translateY(-2px); box-shadow:0 8px 18px -6px rgba(22,32,29,.28) }
    .fsim-sc-thumb img{ width:100%; height:100%; object-fit:cover; display:block }
    .fsim-sc-badge{ position:absolute; top:6px; left:6px; background:rgba(10,20,16,.72); color:#fff; font-size:10px; font-weight:600; padding:3px 8px; border-radius:20px; backdrop-filter:blur(3px) }
    .fsim-sc-open{ position:absolute; inset:0; display:flex; align-items:flex-end; justify-content:center; padding-bottom:8px; opacity:0; transition:.14s; background:linear-gradient(to top,rgba(0,0,0,.55),transparent 55%); color:#fff; font-size:11px; font-weight:600 }
    .fsim-sc-thumb:hover .fsim-sc-open{ opacity:1 }
    .fsim-sc-actions{ display:flex; gap:5px; margin-top:8px }
    .fsim-scb{ flex:1; border:1px solid var(--line2); background:#fff; color:var(--ink); border-radius:8px; padding:6px 4px; font-size:11px; font-weight:600; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; gap:4px; transition:.12s; font-family:${FS} }
    .fsim-scb:hover{ background:var(--fill); border-color:#c0ccc6 }
    .fsim-scb.del{ flex:none; width:30px; color:var(--muted) }
    .fsim-scb.del:hover{ color:#e5484d; border-color:#f1b0b2; background:#fdf2f2 }

    .fsim-toast{ position:fixed; bottom:24px; left:50%; transform:translateX(-50%); background:var(--ink); color:#fff; font-size:13px; font-weight:500; padding:11px 18px; border-radius:24px; z-index:60; box-shadow:0 10px 30px rgba(0,0,0,.25); display:flex; align-items:center; gap:9px }
    .fsim-toast-dot{ width:8px; height:8px; border-radius:50%; background:var(--accent) }

    /* Barra de publicación */
    .fsim-pubbar{ display:flex; align-items:center; gap:14px; flex-wrap:wrap; background:#fff; border:1px solid var(--line); border-radius:16px; padding:14px 16px; margin-bottom:20px; box-shadow:0 1px 2px rgba(22,32,29,.03) }
    .fsim-pubseg{ display:flex; background:var(--fill); border-radius:11px; padding:4px; gap:4px }
    .fsim-pubseg button{ border:none; background:transparent; color:var(--muted); padding:8px 14px; border-radius:8px; font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FS} }
    .fsim-pubseg button.active{ background:#fff; color:var(--accent-deep); box-shadow:0 1px 3px rgba(22,32,29,.12) }
    .fsim-dt{ background:var(--fill); border:1.5px solid transparent; border-radius:10px; padding:9px 12px; font-size:13px; color:var(--ink); font-family:${FS} }
    .fsim-dt:focus{ outline:none; background:#fff; border-color:var(--accent); box-shadow:0 0 0 3px var(--accent-soft) }
    .fsim-dt.sm{ padding:6px 9px; font-size:12px; width:100% }
    .fsim-pub-hint{ flex:1; min-width:160px; font-size:12.5px; color:var(--faint) }
    .fsim-btn.solid.dark{ background:var(--accent); color:#fff; border-color:var(--accent); backdrop-filter:none }
    .fsim-btn.solid.dark:hover{ background:var(--accent-hi); border-color:var(--accent-hi) }

    /* Filtros del planificador */
    .fsim-filtros{ display:flex; gap:8px; flex-wrap:wrap; margin-bottom:16px }
    .fsim-filtro{ display:inline-flex; align-items:center; gap:7px; padding:7px 13px; border-radius:20px; border:1.5px solid var(--line2); background:#fff; color:var(--muted); font-size:12.5px; font-weight:600; cursor:pointer; font-family:${FS} }
    .fsim-filtro:hover{ border-color:#c0ccc6 }
    .fsim-filtro.active{ background:var(--accent); color:#fff; border-color:var(--accent) }
    .fsim-filtro span{ display:inline-grid; place-items:center; min-width:18px; height:18px; padding:0 5px; border-radius:20px; background:rgba(0,0,0,.08); font-size:10.5px; font-weight:800 }
    .fsim-filtro.active span{ background:rgba(255,255,255,.25) }

    /* Planificador (rejilla de tarjetas) */
    .fsim-planner{ display:grid; grid-template-columns:repeat(auto-fill,minmax(230px,1fr)); gap:16px }
    .fsim-pcard{ border:1px solid var(--line); border-radius:14px; overflow:hidden; background:#fff; box-shadow:0 1px 2px rgba(22,32,29,.03) }
    .fsim-pcard .fsim-sc-thumb{ width:100%; height:150px; border-radius:0; box-shadow:none }
    .fsim-pcard .fsim-sc-thumb:hover{ transform:none }
    .fsim-estado{ position:absolute; top:8px; right:8px; font-size:10px; font-weight:700; padding:3px 9px; border-radius:20px }
    .fsim-pcard-body{ padding:11px 12px 12px }
    .fsim-pfecha{ display:flex; align-items:center; gap:5px; font-size:12px; font-weight:700; color:#9a6a12; margin-bottom:6px }
    .fsim-pfecha.ok{ color:var(--accent-deep) }
    .fsim-pcaption{ font-size:12px; color:var(--ink); line-height:1.4; max-height:34px; overflow:hidden; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical }
    .fsim-pautor{ font-size:11px; color:var(--faint); margin-top:4px }
    .fsim-prow{ display:flex; gap:6px; margin:10px 0 8px; align-items:center }
    .fsim-select{ flex:none; background:var(--fill); border:1.5px solid transparent; border-radius:9px; padding:7px 9px; font-size:12px; font-weight:600; color:var(--ink); cursor:pointer; font-family:${FS} }
    .fsim-select:focus{ outline:none; border-color:var(--accent) }
    .fsim-prow .fsim-dt.sm{ flex:1 }
    .fsim-pubnow{ width:100%; display:inline-flex; align-items:center; justify-content:center; gap:7px; margin-bottom:8px; border:none; cursor:pointer; padding:9px; border-radius:9px; font-size:12.5px; font-weight:700; font-family:${FS}; color:#fff; background:linear-gradient(135deg,#0F7A63,#0a5b49); box-shadow:0 4px 12px -3px rgba(15,122,99,.5) }
    .fsim-pubnow:hover{ filter:brightness(1.06) }
    .fsim-pubnow:disabled{ opacity:.6; cursor:not-allowed }
    `}</style>
  )
}
