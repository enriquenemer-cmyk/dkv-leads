'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase, Lead, fuenteOrigen } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { Avatar } from '@/components/Avatar'
import { Mail, Send, Users, Eye, Loader2, CheckCircle2, AlertTriangle, Image as ImageIcon, X, Search, MousePointerClick } from 'lucide-react'

// ---- Plantillas por tipo de campaña ----
type Tipo = 'informacion' | 'promocion' | 'compensacion' | 'sorteo'

const TIPOS: { key: Tipo; label: string; emoji: string; color: string; bg: string; desc: string }[] = [
  { key: 'informacion',  label: 'Información',  emoji: 'ℹ️', color: '#0F7A63', bg: '#e3f1ec', desc: 'Novedades, avisos o contenido útil' },
  { key: 'promocion',    label: 'Promoción',   emoji: '🎁', color: '#c7902a', bg: '#f8efd9', desc: 'Ofertas y descuentos' },
  { key: 'compensacion', label: 'Compensación', emoji: '🤝', color: '#2b6fb0', bg: '#eaf3ff', desc: 'Disculpa o detalle a un cliente' },
  { key: 'sorteo',       label: 'Sorteo',      emoji: '🎉', color: '#8a5cc7', bg: '#f0eafa', desc: 'Anunciar el resultado del sorteo' },
]

const PLANTILLAS: Record<Tipo, { asunto: string; titulo: string; mensaje: string }> = {
  informacion: {
    asunto: 'Novedades de DKV que te interesan',
    titulo: 'Te mantenemos informado',
    mensaje: 'Queremos compartir contigo algunas novedades sobre tu seguro de salud y los servicios que tienes a tu disposición.\n\nSi tienes cualquier duda, estamos aquí para ayudarte. Puedes responder a este correo o llamarnos.',
  },
  promocion: {
    asunto: 'Oferta exclusiva en tu seguro DKV',
    titulo: 'Una oferta pensada para ti',
    mensaje: 'Durante este mes tenemos condiciones especiales en nuestros seguros de salud, dental y hospitalización.\n\nResponde a este correo o llámanos y te preparamos un presupuesto sin compromiso.',
  },
  compensacion: {
    asunto: 'Queremos compensarte',
    titulo: 'Gracias por tu confianza',
    mensaje: 'Sabemos que hemos podido causarte alguna molestia y queremos compensarte por ello.\n\nPonte en contacto con nosotros respondiendo a este correo y te explicamos los detalles.',
  },
  sorteo: {
    asunto: '🎉 Resultado del sorteo DKV',
    titulo: 'Ya tenemos ganador del sorteo',
    mensaje: 'Muchas gracias a todos por participar en nuestro sorteo.\n\nEl ganador/a ha sido: [ESCRIBE AQUÍ EL NOMBRE].\n\nNos pondremos en contacto con la persona ganadora para entregarle el premio. ¡Enhorabuena y gracias por confiar en DKV!',
  },
}

// ---- Segmentos (modo masivo) ----
type SegKey = 'todos' | 'clientes' | 'caliente' | 'tibio' | 'frio' | 'instagram' | 'web'
const SEGMENTOS: { key: SegKey; label: string; test: (l: Lead) => boolean }[] = [
  { key: 'todos',     label: 'Todos con correo',   test: () => true },
  { key: 'clientes',  label: 'Solo clientes',      test: (l) => l.tag === 'cliente' },
  { key: 'caliente',  label: 'Calientes',          test: (l) => l.tag === 'caliente' },
  { key: 'tibio',     label: 'Tibios',             test: (l) => l.tag === 'tibio' },
  { key: 'frio',      label: 'Fríos',              test: (l) => l.tag === 'frio' },
  { key: 'instagram', label: 'De Instagram',       test: (l) => fuenteOrigen(l.fuente) === 'instagram' },
  { key: 'web',       label: 'Del formulario web', test: (l) => ['formulario', 'web-dkv', 'web'].includes(fuenteOrigen(l.fuente)) },
]

type Modo = 'masivo' | 'seleccionar' | 'individual'
const esEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((e || '').trim())

export default function MarketingPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [tipo, setTipo] = useState<Tipo>('informacion')

  // Modo de envío + selección
  const [modo, setModo] = useState<Modo>('masivo')
  const [segmento, setSegmento] = useState<SegKey>('todos')
  const [seleccion, setSeleccion] = useState<Set<string>>(new Set())
  const [buscar, setBuscar] = useState('')
  const [indivEmail, setIndivEmail] = useState('')
  const [indivNombre, setIndivNombre] = useState('')

  // Contenido
  const [asunto, setAsunto] = useState(PLANTILLAS.informacion.asunto)
  const [titulo, setTitulo] = useState(PLANTILLAS.informacion.titulo)
  const [mensaje, setMensaje] = useState(PLANTILLAS.informacion.mensaje)
  const [botonTexto, setBotonTexto] = useState('')
  const [botonUrl, setBotonUrl] = useState('')
  const [cc, setCc] = useState('')
  const [bcc, setBcc] = useState('')

  // Imagen
  const [imagenUrl, setImagenUrl] = useState('')
  const [subiendo, setSubiendo] = useState(false)
  const [imgError, setImgError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const [confirmar, setConfirmar] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<{ ok: boolean; texto: string } | null>(null)

  useEffect(() => {
    supabase.from('leads').select('*').order('created_at', { ascending: false }).then(({ data }) => { if (data) setLeads(data as Lead[]) })
  }, [])

  function aplicarPlantilla(t: Tipo) {
    setTipo(t)
    setAsunto(PLANTILLAS[t].asunto)
    setTitulo(PLANTILLAS[t].titulo)
    setMensaje(PLANTILLAS[t].mensaje)
    setResultado(null)
  }

  const conCorreo = useMemo(() => leads.filter((l) => esEmail(l.email ?? '')), [leads])
  const seg = SEGMENTOS.find((s) => s.key === segmento)!

  // Lista de destinatarios final según el modo elegido.
  const destinatarios = useMemo(() => {
    if (modo === 'masivo') return conCorreo.filter(seg.test).map((l) => ({ email: l.email!, nombre: l.nombre }))
    if (modo === 'seleccionar') return conCorreo.filter((l) => seleccion.has(l.id)).map((l) => ({ email: l.email!, nombre: l.nombre }))
    // individual
    return esEmail(indivEmail) ? [{ email: indivEmail.trim(), nombre: indivNombre.trim() || null }] : []
  }, [modo, conCorreo, seg, seleccion, indivEmail, indivNombre])

  const listaFiltrada = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    if (!q) return conCorreo
    return conCorreo.filter((l) => l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q))
  }, [conCorreo, buscar])

  const acento = TIPOS.find((t) => t.key === tipo)!

  function toggleSel(id: string) {
    setSeleccion((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  }

  async function subirImagen(file: File) {
    setImgError('')
    if (!file.type.startsWith('image/')) { setImgError('El archivo debe ser una imagen.'); return }
    if (file.size > 5 * 1024 * 1024) { setImgError('La imagen es demasiado grande (máx. 5 MB).'); return }
    setSubiendo(true)
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const path = `campaigns/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`
    const { error } = await supabase.storage.from('email-assets').upload(path, file, { contentType: file.type, upsert: false })
    if (error) {
      setImgError(/bucket|not found/i.test(error.message) ? 'Falta activar el almacén de imágenes (avísame para configurarlo).' : 'No se pudo subir la imagen. Inténtalo de nuevo.')
      setSubiendo(false); return
    }
    const { data } = supabase.storage.from('email-assets').getPublicUrl(path)
    setImagenUrl(data.publicUrl)
    setSubiendo(false)
  }

  async function enviar(test: boolean) {
    setEnviando(true); setResultado(null)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setResultado({ ok: false, texto: 'Sesión caducada. Vuelve a entrar.' }); setEnviando(false); return }
      const res = await fetch('/api/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ tipo, asunto, titulo, mensaje, destinatarios, test, imagenUrl, botonTexto, botonUrl, cc, bcc }),
      })
      const json = await res.json()
      if (!res.ok) { setResultado({ ok: false, texto: json.error || 'No se pudo enviar.' }); setEnviando(false); return }
      if (test) setResultado({ ok: true, texto: `Correo de prueba enviado a ${json.para}. Revisa tu bandeja.` })
      else {
        setResultado({ ok: true, texto: `Campaña enviada: ${json.enviados} enviados${json.fallidos ? `, ${json.fallidos} fallidos` : ''} de ${json.total}.` })
        await logActividad('campania_enviada', `Campaña enviada "${asunto || titulo || 'sin asunto'}": ${json.enviados} destinatarios`)
      }
    } catch {
      setResultado({ ok: false, texto: 'Error de conexión. Inténtalo de nuevo.' })
    }
    setEnviando(false); setConfirmar(false)
  }

  const input: React.CSSProperties = { width: '100%', padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
  const card: React.CSSProperties = { background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '20px 22px', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }
  const paso: React.CSSProperties = { display: 'block', fontSize: 12, fontWeight: 700, color: '#9aaba5', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1180, margin: '0 auto' }}>
      {/* Cabecera */}
      <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #0a2f27 0%, #0F7A63 105%)', borderRadius: 22, padding: '26px 30px', marginBottom: 24, boxShadow: '0 16px 44px -20px rgba(10,47,39,0.55)' }}>
        <div style={{ position: 'absolute', top: -90, right: -50, width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 15, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Mail size={26} color="#fff" />
          </div>
          <div>
            <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.75)', fontWeight: 500, margin: '0 0 3px' }}>Envía correos a tus leads y clientes: masivo, por selección o individual</p>
            <h1 style={{ fontSize: 28, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Email Marketing</h1>
          </div>
        </div>
      </div>

      <div className="mkt-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 420px', gap: 20, alignItems: 'start' }}>
        {/* ---- Configuración ---- */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Tipo */}
          <div style={card}>
            <label style={paso}>1 · Tipo de correo</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
              {TIPOS.map((t) => {
                const active = tipo === t.key
                return (
                  <button key={t.key} onClick={() => aplicarPlantilla(t.key)}
                    style={{ textAlign: 'left', padding: '12px 14px', borderRadius: 13, cursor: 'pointer', fontFamily: 'inherit', border: `1.5px solid ${active ? t.color : '#e6ebe8'}`, background: active ? t.bg : '#fff', transition: 'all 0.15s' }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: active ? t.color : '#16201d' }}>{t.emoji} {t.label}</div>
                    <div style={{ fontSize: 11.5, color: '#9aaba5', marginTop: 2 }}>{t.desc}</div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Destinatarios: modo + selección */}
          <div style={card}>
            <label style={paso}>2 · ¿A quién se lo mandamos?</label>

            {/* Selector de modo */}
            <div style={{ display: 'flex', gap: 6, background: '#f0f4f1', borderRadius: 12, padding: 4, marginBottom: 16 }}>
              {([['masivo', '📢 Masivo'], ['seleccionar', '☑️ Seleccionar'], ['individual', '👤 Individual']] as [Modo, string][]).map(([m, lbl]) => (
                <button key={m} onClick={() => setModo(m)}
                  style={{ flex: 1, padding: '9px 8px', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 700, background: modo === m ? '#fff' : 'transparent', color: modo === m ? '#0F7A63' : '#6b7a76', boxShadow: modo === m ? '0 1px 4px rgba(16,32,29,0.1)' : 'none' }}>
                  {lbl}
                </button>
              ))}
            </div>

            {/* MASIVO: segmentos */}
            {modo === 'masivo' && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SEGMENTOS.map((s) => {
                  const active = segmento === s.key
                  const n = conCorreo.filter(s.test).length
                  return (
                    <button key={s.key} onClick={() => setSegmento(s.key)}
                      style={{ padding: '7px 13px', borderRadius: 999, fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', border: 'none', background: active ? '#0F7A63' : '#f0f4f1', color: active ? '#fff' : '#6b7a76' }}>
                      {s.label} <span style={{ opacity: 0.75 }}>({n})</span>
                    </button>
                  )
                })}
              </div>
            )}

            {/* SELECCIONAR / INDIVIDUAL: buscador + lista */}
            {(modo === 'seleccionar' || modo === 'individual') && (
              <div>
                {modo === 'individual' && (
                  <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                    <input value={indivNombre} onChange={(e) => setIndivNombre(e.target.value)} placeholder="Nombre (opcional)" style={{ ...input, flex: '1 1 130px' }} />
                    <input value={indivEmail} onChange={(e) => setIndivEmail(e.target.value)} placeholder="correo@ejemplo.com" style={{ ...input, flex: '2 1 200px' }} />
                  </div>
                )}
                <div style={{ position: 'relative', marginBottom: 10 }}>
                  <Search size={15} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
                  <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar contacto por nombre o correo…" style={{ ...input, paddingLeft: 38 }} />
                </div>
                {modo === 'seleccionar' && listaFiltrada.length > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <button onClick={() => setSeleccion(new Set(listaFiltrada.map((l) => l.id)))} style={{ fontSize: 12, fontWeight: 700, color: '#0F7A63', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Seleccionar todos ({listaFiltrada.length})</button>
                    {seleccion.size > 0 && <button onClick={() => setSeleccion(new Set())} style={{ fontSize: 12, fontWeight: 600, color: '#c23a22', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0 }}>Quitar todos</button>}
                  </div>
                )}
                <div style={{ maxHeight: 260, overflowY: 'auto', border: '1px solid #edf1ef', borderRadius: 12 }}>
                  {listaFiltrada.length === 0
                    ? <div style={{ padding: '24px', textAlign: 'center', color: '#9aaba5', fontSize: 13 }}>{conCorreo.length === 0 ? 'No hay leads con correo todavía.' : 'Ningún contacto coincide con la búsqueda.'}</div>
                    : listaFiltrada.slice(0, 200).map((l) => {
                      const checked = modo === 'seleccionar' ? seleccion.has(l.id) : indivEmail.trim().toLowerCase() === (l.email ?? '').toLowerCase()
                      return (
                        <div key={l.id} onClick={() => { if (modo === 'seleccionar') toggleSel(l.id); else { setIndivEmail(l.email ?? ''); setIndivNombre(l.nombre) } }}
                          style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', cursor: 'pointer', borderBottom: '1px solid #f5f7f5', background: checked ? '#eef7f3' : '#fff' }}>
                          <span style={{ width: 18, height: 18, borderRadius: modo === 'seleccionar' ? 5 : 999, border: `1.5px solid ${checked ? '#0F7A63' : '#cdd8d3'}`, background: checked ? '#0F7A63' : '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            {checked && <CheckCircle2 size={13} color="#fff" />}
                          </span>
                          <Avatar nombre={l.nombre} size={30} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                            <div style={{ fontSize: 12, color: '#9aaba5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.email}</div>
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Resumen destinatarios */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: '#48574f', background: '#f8fbf9', border: '1px solid #e6efe9', borderRadius: 12, padding: '11px 14px', marginTop: 14 }}>
              <Users size={16} color="#0F7A63" />
              Se enviará a <b style={{ color: '#0F7A63' }}>{destinatarios.length}</b> {destinatarios.length === 1 ? 'contacto' : 'contactos'}.
            </div>
          </div>

          {/* Contenido */}
          <div style={card}>
            <label style={paso}>3 · Contenido</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Asunto</span>
                <input value={asunto} onChange={(e) => setAsunto(e.target.value)} style={input} placeholder="Asunto del correo" />
              </div>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Título dentro del correo</span>
                <input value={titulo} onChange={(e) => setTitulo(e.target.value)} style={input} placeholder="Título grande" />
              </div>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Mensaje</span>
                <textarea value={mensaje} onChange={(e) => setMensaje(e.target.value)} rows={7}
                  style={{ ...input, resize: 'vertical', lineHeight: 1.6 }} placeholder="Escribe aquí el mensaje…" />
                <p style={{ fontSize: 11.5, color: '#9aaba5', margin: '6px 2px 0' }}>Cada correo empieza con “Hola [nombre]” automáticamente.</p>
              </div>

              {/* Imagen */}
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Imagen (opcional)</span>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) subirImagen(f); e.target.value = '' }} />
                {imagenUrl ? (
                  <div style={{ position: 'relative', display: 'inline-block', borderRadius: 12, overflow: 'hidden', border: '1px solid #e6ebe8' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imagenUrl} alt="Imagen de la campaña" style={{ maxWidth: '100%', maxHeight: 160, display: 'block' }} />
                    <button onClick={() => setImagenUrl('')} title="Quitar imagen"
                      style={{ position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 8, border: 'none', background: 'rgba(0,0,0,0.6)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <X size={15} />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => fileRef.current?.click()} disabled={subiendo}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 16px', borderRadius: 12, border: '1.5px dashed #cdd8d3', background: '#fbfdfc', color: '#6b7a76', fontSize: 13.5, fontWeight: 600, cursor: subiendo ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                    {subiendo ? <><Loader2 size={15} className="spin" /> Subiendo…</> : <><ImageIcon size={15} /> Añadir imagen</>}
                  </button>
                )}
                {imgError && <p style={{ fontSize: 12, color: '#c23a22', margin: '6px 2px 0', fontWeight: 600 }}>{imgError}</p>}
              </div>

              {/* Botón de acción */}
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}><MousePointerClick size={13} /> Botón de acción (opcional)</span>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <input value={botonTexto} onChange={(e) => setBotonTexto(e.target.value)} placeholder="Texto (ej: Pide tu cita)" style={{ ...input, flex: '1 1 140px' }} />
                  <input value={botonUrl} onChange={(e) => setBotonUrl(e.target.value)} placeholder="https://enlace.com" style={{ ...input, flex: '2 1 180px' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Copias CC / CCO */}
          <div style={card}>
            <label style={paso}>4 · Copias (opcional)</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Con copia (CC) · visible para todos</span>
                <input value={cc} onChange={(e) => setCc(e.target.value)} style={input} placeholder="correo1@ejemplo.com, correo2@ejemplo.com" />
              </div>
              <div>
                <span style={{ fontSize: 12.5, fontWeight: 600, color: '#6b7a76', display: 'block', marginBottom: 5 }}>Con copia oculta (CCO) · nadie ve estas direcciones</span>
                <input value={bcc} onChange={(e) => setBcc(e.target.value)} style={input} placeholder="oculto@ejemplo.com" />
              </div>
              <p style={{ fontSize: 11.5, color: '#9aaba5', margin: 0, lineHeight: 1.5 }}>
                Puedes poner varias direcciones separadas por comas. En envíos a varias personas, la copia se añade solo al primer correo (para no enviar una copia por cada destinatario).
              </p>
            </div>
          </div>

          {/* Resultado */}
          {resultado && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '13px 16px', borderRadius: 13, fontSize: 13.5, fontWeight: 600, background: resultado.ok ? '#e3f1ec' : '#fbe7e2', color: resultado.ok ? '#0F7A63' : '#c23a22' }}>
              {resultado.ok ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
              {resultado.texto}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => enviar(true)} disabled={enviando}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 14, fontWeight: 700, cursor: enviando ? 'default' : 'pointer', fontFamily: 'inherit', opacity: enviando ? 0.6 : 1 }}>
              <Eye size={15} /> Enviarme una prueba
            </button>
            <button onClick={() => setConfirmar(true)} disabled={enviando || destinatarios.length === 0}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 12, border: 'none', background: destinatarios.length === 0 ? '#c8d4ce' : 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: enviando || destinatarios.length === 0 ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: destinatarios.length === 0 ? 'none' : '0 4px 14px -4px rgba(15,122,99,0.45)' }}>
              {enviando ? <><Loader2 size={15} className="spin" /> Enviando…</> : <><Send size={15} /> Enviar ({destinatarios.length})</>}
            </button>
          </div>
        </div>

        {/* ---- Vista previa ---- */}
        <div style={{ position: 'sticky', top: 24 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#9aaba5', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Eye size={14} /> Vista previa
          </div>
          <div style={{ borderRadius: 20, overflow: 'hidden', border: '1px solid #e6ebe8', boxShadow: '0 12px 34px -18px rgba(16,32,29,0.35)' }}>
            <div style={{ background: 'linear-gradient(135deg,#0a2f27,#0F7A63)', padding: '20px 24px' }}>
              <div style={{ display: 'inline-block', background: '#fff', borderRadius: 8, padding: '5px 11px', fontWeight: 800, fontSize: 16, color: '#0F7A63' }}>DKV</div>
              <div style={{ color: 'rgba(255,255,255,0.85)', fontSize: 11.5, fontWeight: 500, marginTop: 8 }}>Tu bienestar, asegurado</div>
            </div>
            {imagenUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={imagenUrl} alt="" style={{ width: '100%', display: 'block' }} />
            )}
            <div style={{ background: '#fff', padding: '24px' }}>
              <div style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, color: acento.color, background: acento.bg, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '4px 11px', borderRadius: 999, marginBottom: 12 }}>{acento.emoji} {acento.label}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: '#12211d', margin: '0 0 14px', lineHeight: 1.25 }}>{titulo || '(título)'}</div>
              <p style={{ fontSize: 14, color: '#38443f', margin: '0 0 12px' }}>Hola [nombre],</p>
              {(mensaje || '(mensaje)').split(/\n{2,}/).map((p, i) => (
                <p key={i} style={{ fontSize: 14, color: '#38443f', margin: '0 0 12px', lineHeight: 1.65, whiteSpace: 'pre-line' }}>{p}</p>
              ))}
              {botonTexto.trim() && botonUrl.trim() && (
                <div style={{ textAlign: 'center', margin: '18px 0 6px' }}>
                  <span style={{ display: 'inline-block', background: acento.color, color: '#fff', fontSize: 14, fontWeight: 700, padding: '12px 28px', borderRadius: 999 }}>{botonTexto}</span>
                </div>
              )}
            </div>
            <div style={{ background: '#fbfdfc', borderTop: '1px solid #eef2f0', padding: '16px 24px 20px' }}>
              <p style={{ fontSize: 11.5, color: '#7a8a84', margin: 0, lineHeight: 1.6 }}><b style={{ color: '#4d5c56' }}>DKV Seguros · Agente exclusivo</b><br />Teléfono: 699 66 96 03</p>
              <p style={{ fontSize: 11, color: '#a7b3ae', margin: '8px 0 0', lineHeight: 1.6 }}>Para dejar de recibir estos correos, responde con la palabra BAJA.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de confirmación */}
      {confirmar && (
        <div onClick={() => setConfirmar(false)} style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(10,47,39,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, maxWidth: 420, width: '100%', padding: '26px 28px', boxShadow: '0 24px 60px -20px rgba(0,0,0,0.4)' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: '#16201d', marginBottom: 8 }}>¿Enviar el correo?</div>
            <p style={{ fontSize: 14, color: '#48574f', lineHeight: 1.6, margin: '0 0 8px' }}>
              Vas a enviar <b>“{asunto}”</b> a <b>{destinatarios.length}</b> {destinatarios.length === 1 ? 'contacto' : 'contactos'}.
            </p>
            <p style={{ fontSize: 12.5, color: '#a8741a', background: '#f8efd9', borderRadius: 10, padding: '10px 12px', margin: '0 0 18px', lineHeight: 1.5 }}>
              💡 Consejo: envíate primero una prueba para ver cómo queda.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmar(false)} style={{ padding: '10px 18px', borderRadius: 11, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancelar</button>
              <button onClick={() => enviar(false)} disabled={enviando}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 11, border: 'none', background: 'linear-gradient(135deg, #0F7A63, #0a5b49)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                {enviando ? <><Loader2 size={15} className="spin" /> Enviando…</> : <><Send size={15} /> Sí, enviar</>}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @media(max-width:900px){ .mkt-grid{ grid-template-columns:1fr !important; } }
      `}</style>
    </div>
  )
}
