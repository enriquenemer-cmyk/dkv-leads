'use client'
import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Avatar } from '@/components/Avatar'
import { Send, Users, ArrowLeft } from 'lucide-react'

type Mensaje = {
  id: string
  usuario_id: string | null
  usuario_email: string | null
  usuario_nombre: string | null
  destinatario_id: string | null
  texto: string
  created_at: string
}
type Usuario = { id: string; nombre: string | null; email: string | null; rol: string | null }
type Conv = { tipo: 'grupo' } | { tipo: 'dm'; id: string; nombre: string }

function hora(iso: string) { return new Date(iso).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }) }
function diaEtiqueta(iso: string) {
  const d = new Date(iso); const hoy = new Date(); hoy.setHours(0, 0, 0, 0)
  const ayer = new Date(hoy); ayer.setDate(ayer.getDate() - 1)
  const dd = new Date(d); dd.setHours(0, 0, 0, 0)
  if (dd.getTime() === hoy.getTime()) return 'Hoy'
  if (dd.getTime() === ayer.getTime()) return 'Ayer'
  return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
}
function nombreUsuario(u: { nombre?: string | null; email?: string | null }) {
  return (u.nombre || u.email?.split('@')[0] || 'Asesor').trim()
}
function convKey(c: Conv) { return c.tipo === 'grupo' ? 'grupo' : 'dm:' + c.id }

export default function ChatPage() {
  const [yo, setYo] = useState<{ id: string; email: string; nombre: string } | null>(null)
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [conv, setConv] = useState<Conv>({ tipo: 'grupo' })
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [noLeidos, setNoLeidos] = useState<Set<string>>(new Set())
  const [verChat, setVerChat] = useState(false) // móvil: false=lista, true=conversación
  const convRef = useRef<Conv>(conv)
  const yoRef = useRef(yo)
  const finRef = useRef<HTMLDivElement>(null)
  useEffect(() => { convRef.current = conv }, [conv])
  useEffect(() => { yoRef.current = yo }, [yo])

  // Init: usuario actual + lista de todos los usuarios
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      let nombre = (user.email?.split('@')[0] || 'Asesor').replace(/[._-]+/g, ' ')
      const { data: rows } = await supabase.rpc('listar_asesores')
      if (Array.isArray(rows)) {
        setUsuarios((rows as Usuario[]).filter((u) => u.id !== user.id))
        const mio = (rows as Usuario[]).find((u) => u.id === user.id)
        if (mio?.nombre) nombre = mio.nombre
      }
      setYo({ id: user.id, email: user.email ?? '', nombre })
    }
    init()
  }, [])

  // Suscripción en tiempo real (una vez que sé quién soy)
  useEffect(() => {
    if (!yo) return
    const ch = supabase.channel('chat_dm')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'mensajes_chat' }, (payload) => {
        const m = payload.new as Mensaje
        const me = yoRef.current
        if (!me) return
        if (perteneceA(m, convRef.current, me.id)) {
          setMensajes((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m])
        } else if (m.usuario_id && m.usuario_id !== me.id) {
          const key = m.destinatario_id ? 'dm:' + m.usuario_id : 'grupo'
          setNoLeidos((prev) => new Set(prev).add(key))
        }
      })
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [yo])

  // Cargar mensajes de la conversación activa
  useEffect(() => {
    if (!yo) return
    async function cargar() {
      let q = supabase.from('mensajes_chat').select('*').order('created_at', { ascending: true }).limit(400)
      if (conv.tipo === 'grupo') q = q.is('destinatario_id', null)
      else q = q.or(`and(usuario_id.eq.${yo!.id},destinatario_id.eq.${conv.id}),and(usuario_id.eq.${conv.id},destinatario_id.eq.${yo!.id})`)
      const { data } = await q
      setMensajes((data as Mensaje[]) ?? [])
    }
    cargar()
  }, [conv, yo])

  useEffect(() => { finRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [mensajes])
  useEffect(() => { if (mensajes.length) localStorage.setItem('chat-visto', new Date().toISOString()) }, [mensajes])

  function perteneceA(m: Mensaje, c: Conv, miId: string) {
    if (c.tipo === 'grupo') return m.destinatario_id == null
    return (m.usuario_id === miId && m.destinatario_id === c.id) || (m.usuario_id === c.id && m.destinatario_id === miId)
  }

  function abrir(c: Conv) {
    setConv(c); setVerChat(true)
    setNoLeidos((prev) => { const n = new Set(prev); n.delete(convKey(c)); return n })
  }

  async function enviar() {
    const t = texto.trim()
    if (!t || !yo || enviando) return
    setEnviando(true); setTexto('')
    const { data, error } = await supabase.from('mensajes_chat')
      .insert({ usuario_id: yo.id, usuario_email: yo.email, usuario_nombre: yo.nombre, texto: t, destinatario_id: conv.tipo === 'dm' ? conv.id : null })
      .select('*').single()
    if (error) setTexto(t)
    else if (data) setMensajes((prev) => prev.some((x) => x.id === (data as Mensaje).id) ? prev : [...prev, data as Mensaje])
    setEnviando(false)
  }

  const tituloConv = conv.tipo === 'grupo' ? 'Equipo (todos)' : conv.nombre

  return (
    <div style={{ padding: '20px 24px', maxWidth: 1000, margin: '0 auto', height: 'calc(100vh - 0px)', display: 'flex', flexDirection: 'column', boxSizing: 'border-box' }}>
      {/* Cabecera */}
      <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 18, padding: '15px 20px', marginBottom: 14, background: 'linear-gradient(135deg,#0a2f27 0%,#0d5344 55%,#0F7A63 120%)', boxShadow: '0 14px 36px -20px rgba(10,47,39,0.55)', flexShrink: 0 }}>
        <div style={{ position: 'absolute', top: -70, right: -50, width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle,rgba(140,198,63,0.18),transparent 70%)' }} />
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Send size={18} color="#fff" /></div>
          <div>
            <div style={{ width: 30, height: 3, borderRadius: 999, background: 'linear-gradient(90deg,#f5c451,#c7902a)', marginBottom: 6 }} />
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#fff', margin: 0, letterSpacing: '-0.02em' }}>Chat del equipo</h1>
          </div>
        </div>
      </div>

      <div className="chat-body" style={{ display: 'flex', gap: 14, flex: 1, minHeight: 0 }}>
        {/* Lista de conversaciones */}
        <div className={`chat-list${verChat ? ' oculto-movil' : ''}`} style={{ width: 272, flexShrink: 0, background: '#fff', borderRadius: 16, border: '1px solid #edf1ef', overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
          <div style={{ padding: '12px 14px', fontSize: 11.5, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f0f4f1' }}>Conversaciones</div>
          <div style={{ overflowY: 'auto', flex: 1 }}>
            {/* Equipo */}
            <ConvItem activo={conv.tipo === 'grupo'} onClick={() => abrir({ tipo: 'grupo' })} nombre="Equipo (todos)" sub="Chat de grupo" icon nuevo={noLeidos.has('grupo')} />
            {/* Usuarios */}
            {usuarios.length === 0 && <div style={{ padding: '18px 16px', color: '#9aaba5', fontSize: 13 }}>No hay más usuarios todavía.</div>}
            {usuarios.map((u) => (
              <ConvItem key={u.id} activo={conv.tipo === 'dm' && conv.id === u.id}
                onClick={() => abrir({ tipo: 'dm', id: u.id, nombre: nombreUsuario(u) })}
                nombre={nombreUsuario(u)} sub={u.rol === 'admin' ? 'Administrador' : 'Asesor'} nuevo={noLeidos.has('dm:' + u.id)} />
            ))}
          </div>
        </div>

        {/* Conversación */}
        <div className={`chat-conv${verChat ? '' : ' oculto-movil'}`} style={{ flex: 1, minWidth: 0, background: '#fff', borderRadius: 16, border: '1px solid #edf1ef', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
          {/* Cabecera de la conversación */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderBottom: '1px solid #f0f4f1', flexShrink: 0 }}>
            <button className="chat-back" onClick={() => setVerChat(false)} style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a76' }}><ArrowLeft size={18} /></button>
            {conv.tipo === 'grupo'
              ? <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={17} color="#fff" /></div>
              : <Avatar nombre={tituloConv} size={34} />}
            <div>
              <div style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', textTransform: 'capitalize' }}>{tituloConv}</div>
              <div style={{ fontSize: 11.5, color: '#9aaba5' }}>{conv.tipo === 'grupo' ? 'Todos los asesores' : 'Mensaje privado'}</div>
            </div>
          </div>

          {/* Mensajes */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 16px 6px', minHeight: 0 }}>
            {mensajes.length === 0 ? (
              <div style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#9aaba5', textAlign: 'center', padding: 20 }}>
                <Send size={28} style={{ opacity: 0.4, marginBottom: 8 }} />
                <div style={{ fontWeight: 700, color: '#16201d' }}>Sin mensajes todavía</div>
                <p style={{ fontSize: 13, marginTop: 4 }}>Escribe el primero para empezar la conversación.</p>
              </div>
            ) : mensajes.map((m, i) => {
              const mio = yo && m.usuario_id === yo.id
              const prev = mensajes[i - 1]
              const nuevoDia = !prev || diaEtiqueta(prev.created_at) !== diaEtiqueta(m.created_at)
              const nombre = nombreUsuario({ nombre: m.usuario_nombre, email: m.usuario_email })
              return (
                <div key={m.id}>
                  {nuevoDia && <div style={{ textAlign: 'center', margin: '12px 0' }}><span style={{ fontSize: 11.5, fontWeight: 700, color: '#9aaba5', background: '#f0f4f1', padding: '3px 12px', borderRadius: 999, textTransform: 'capitalize' }}>{diaEtiqueta(m.created_at)}</span></div>}
                  <div style={{ display: 'flex', gap: 9, margin: '7px 0', flexDirection: mio ? 'row-reverse' : 'row', alignItems: 'flex-end' }}>
                    {!mio && <Avatar nombre={nombre} size={28} />}
                    <div style={{ maxWidth: '76%' }}>
                      {!mio && conv.tipo === 'grupo' && <div style={{ fontSize: 11.5, fontWeight: 700, color: '#0F7A63', margin: '0 0 3px 4px', textTransform: 'capitalize' }}>{nombre}</div>}
                      <div style={{ padding: '9px 13px', borderRadius: 16, fontSize: 14, lineHeight: 1.45, wordBreak: 'break-word', background: mio ? 'linear-gradient(135deg,#0F7A63,#0a5b49)' : '#f1f5f3', color: mio ? '#fff' : '#16201d', borderBottomRightRadius: mio ? 4 : 16, borderBottomLeftRadius: mio ? 16 : 4 }}>{m.texto}</div>
                      <div style={{ fontSize: 10.5, color: '#b0bdb8', margin: '3px 6px 0', textAlign: mio ? 'right' : 'left' }}>{hora(m.created_at)}</div>
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={finRef} />
          </div>

          {/* Escritura */}
          <div style={{ display: 'flex', gap: 10, padding: 12, borderTop: '1px solid #f0f4f1', flexShrink: 0 }}>
            <input value={texto} onChange={(e) => setTexto(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar() } }}
              placeholder={conv.tipo === 'grupo' ? 'Mensaje para todo el equipo…' : `Mensaje privado para ${tituloConv}…`}
              style={{ flex: 1, padding: '12px 15px', borderRadius: 13, border: '1.5px solid #e2e8e4', background: '#fff', fontSize: 14.5, outline: 'none', fontFamily: 'inherit' }} />
            <button onClick={enviar} disabled={!texto.trim() || enviando}
              style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '0 20px', borderRadius: 13, border: 'none', background: !texto.trim() ? '#c7d2cd' : 'linear-gradient(135deg,#0F7A63,#0a2f27)', color: '#fff', fontSize: 14.5, fontWeight: 700, cursor: !texto.trim() ? 'default' : 'pointer', fontFamily: 'inherit' }}>
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @media(max-width:760px){
          .chat-body .oculto-movil{ display:none !important; }
          .chat-list, .chat-conv{ width:100% !important; }
          .chat-back{ display:flex !important; }
        }
      `}</style>
    </div>
  )
}

function ConvItem({ activo, onClick, nombre, sub, icon, nuevo }: { activo: boolean; onClick: () => void; nombre: string; sub: string; icon?: boolean; nuevo?: boolean }) {
  return (
    <button onClick={onClick} style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px', border: 'none', borderBottom: '1px solid #f5f7f5', background: activo ? '#eef7f3' : '#fff', cursor: 'pointer', fontFamily: 'inherit' }}>
      {icon
        ? <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#0F7A63', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Users size={18} color="#fff" /></div>
        : <Avatar nombre={nombre} size={36} />}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', textTransform: 'capitalize' }}>{nombre}</div>
        <div style={{ fontSize: 12, color: '#9aaba5' }}>{sub}</div>
      </div>
      {nuevo && <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#c23a22', flexShrink: 0 }} />}
    </button>
  )
}
