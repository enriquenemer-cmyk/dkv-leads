'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send, Phone, Check } from 'lucide-react'
import { SALUDO_INICIAL } from '@/lib/chatbot-kb'
import { supabase } from '@/lib/supabase'
import { trackLead } from '@/components/Analytics'

type Msg = { role: 'user' | 'assistant'; content: string }

const TEAL = '#095751'
const TEAL_DEEP = '#063f3b'
const LIME = '#98A92A'
const RED = '#DD3636'

// Botones de respuesta rápida (guían la conversación y suben la conversión)
const CHIPS = ['🦷 Seguro dental', '💰 ¿Cuánto cuesta?', '👨‍👩‍👧 Para mi familia', '🏥 Sin listas de espera']

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: SALUDO_INICIAL }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [mode, setMode] = useState<'chat' | 'lead' | 'done'>('chat')
  const [lead, setLead] = useState({ nombre: '', telefono: '', interes: '' })
  const [leadErr, setLeadErr] = useState('')
  const [nudge, setNudge] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open, mode])

  // Aviso flotante que invita a abrir el chat (una sola vez)
  useEffect(() => {
    if (open) { setNudge(false); return }
    const seen = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('dkv-chat-nudge')
    if (seen) return
    const t = setTimeout(() => setNudge(true), 4500)
    return () => clearTimeout(t)
  }, [open])

  const dismissNudge = () => { setNudge(false); try { sessionStorage.setItem('dkv-chat-nudge', '1') } catch {} }

  async function enviar(texto?: string) {
    const t = (texto ?? input).trim()
    if (!t || sending) return
    const nuevos: Msg[] = [...messages, { role: 'user', content: t }]
    setMessages(nuevos)
    setInput('')
    setSending(true)
    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: nuevos }),
      })
      const data = await res.json()
      setMessages((m) => [...m, { role: 'assistant', content: data.reply || '…' }])
    } catch {
      setMessages((m) => [...m, { role: 'assistant', content: 'Ups, ha fallado la conexión. Inténtalo de nuevo en un momento.' }])
    } finally {
      setSending(false)
    }
  }

  const telOk = (x: string) => /^(\+?34)?[6789]\d{8}$/.test(x.replace(/[\s-]/g, ''))

  async function enviarLead() {
    if (!lead.nombre.trim()) { setLeadErr('Dinos tu nombre, por favor.'); return }
    if (!telOk(lead.telefono)) { setLeadErr('El teléfono no es válido (9 dígitos).'); return }
    setLeadErr('')
    setSending(true)
    const { error } = await supabase.from('leads').insert({
      nombre: lead.nombre.trim(),
      telefono: lead.telefono.trim(),
      email: null,
      interes: (lead.interes.trim() || 'Consulta por el chat') + ' · via chatbot',
      fuente: 'chatbot',
      tag: 'tibio',
    })
    setSending(false)
    if (error) { setLeadErr('Algo falló. Prueba otra vez o llámanos.'); return }
    trackLead()
    setMode('done')
    setMessages((m) => [...m, { role: 'assistant', content: `¡Perfecto, ${lead.nombre.trim().split(' ')[0]}! ✅ Un asesor te llamará en menos de 24 h, sin compromiso. Gracias por confiar en DKV. 💚` }])
  }

  return (
    <>
      <style>{`
        @keyframes chatUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        @keyframes chatPulse{0%{box-shadow:0 0 0 0 rgba(9,87,81,.5)}70%{box-shadow:0 0 0 14px rgba(9,87,81,0)}100%{box-shadow:0 0 0 0 rgba(9,87,81,0)}}
        @keyframes dotB{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-4px);opacity:1}}
        .dkv-dot{width:6px;height:6px;border-radius:50%;background:#9aaba5;display:inline-block;animation:dotB 1.2s infinite}
        .dkv-chip{border:1.5px solid ${TEAL}22;background:#eef4f1;color:${TEAL};border-radius:999px;padding:8px 13px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s;font-family:inherit}
        .dkv-chip:hover{background:${TEAL};color:#fff;border-color:${TEAL}}
        @media(max-width:768px){
          .dkv-chat-launcher{bottom:86px!important}
          .dkv-chat-panel{bottom:158px!important;height:min(72vh,calc(100vh - 200px))!important}
          .dkv-chat-nudge{bottom:150px!important}
        }
      `}</style>

      {/* Aviso flotante que invita a abrir */}
      {nudge && !open && (
        <div className="dkv-chat-nudge" style={{ position: 'fixed', bottom: 92, left: 24, zIndex: 999, maxWidth: 230, background: '#fff', borderRadius: 16, padding: '12px 14px', boxShadow: '0 18px 40px -14px rgba(9,87,81,.4)', border: '1px solid #e2e8e4', fontFamily: 'var(--font-jakarta), system-ui, sans-serif', animation: 'chatUp .3s ease both' }}>
          <button onClick={dismissNudge} aria-label="Cerrar" style={{ position: 'absolute', top: 6, right: 6, background: 'none', border: 'none', cursor: 'pointer', color: '#9aaba5' }}><X size={14} /></button>
          <div onClick={() => { setOpen(true); dismissNudge() }} style={{ cursor: 'pointer', fontSize: 13.5, color: '#16201d', lineHeight: 1.4, fontWeight: 500, paddingRight: 10 }}>
            👋 ¿Te ayudo a elegir tu seguro? Pregúntame lo que quieras.
          </div>
        </div>
      )}

      {/* Botón flotante */}
      <button
        onClick={() => { setOpen((o) => !o); dismissNudge() }}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat de ayuda'}
        className="dkv-chat-launcher"
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DEEP})`, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px -6px rgba(9,87,81,0.55)', transition: 'transform 0.15s',
          animation: open ? 'none' : 'chatPulse 2.6s infinite',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>

      {/* Panel de chat */}
      {open && (
        <div className="dkv-chat-panel" style={{ position: 'fixed', bottom: 96, left: 24, zIndex: 1000, width: 'min(384px, calc(100vw - 32px))', height: 'min(576px, calc(100vh - 140px))', background: '#fff', borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 60px -12px rgba(6,63,59,0.4)', border: '1px solid #e2e8e4', fontFamily: 'var(--font-jakarta), system-ui, sans-serif', animation: 'chatUp 0.25s ease both' }}>

          {/* Cabecera */}
          <div style={{ background: `linear-gradient(135deg, ${TEAL_DEEP}, ${TEAL})`, padding: '15px 18px', color: '#fff', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: 15, position: 'relative', flexShrink: 0 }}>
              <span style={{ letterSpacing: '-0.04em' }}>DKV</span>
              <span style={{ position: 'absolute', bottom: -1, right: -1, width: 12, height: 12, borderRadius: '50%', background: LIME, border: '2px solid #0a3831' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 800, fontSize: 15 }}>Asistente DKV</div>
              <div style={{ fontSize: 11.5, opacity: 0.8, marginTop: 1, display: 'flex', alignItems: 'center', gap: 5 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: LIME }} /> En línea · te responde al instante</div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Cerrar" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,.85)', cursor: 'pointer' }}><X size={20} /></button>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f6faf8', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div key={i} style={{ alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '84%', padding: '10px 13px', borderRadius: 15, fontSize: 14, lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', background: m.role === 'user' ? TEAL : '#fff', color: m.role === 'user' ? '#fff' : '#16201d', border: m.role === 'user' ? 'none' : '1px solid #e6ece9', borderBottomRightRadius: m.role === 'user' ? 5 : 15, borderBottomLeftRadius: m.role === 'user' ? 15 : 5, boxShadow: m.role === 'user' ? 'none' : '0 2px 8px -4px rgba(9,87,81,.15)' }}>
                {m.content}
              </div>
            ))}
            {sending && mode !== 'lead' && (
              <div style={{ alignSelf: 'flex-start', padding: '12px 14px', borderRadius: 15, background: '#fff', border: '1px solid #e6ece9', display: 'flex', gap: 4 }}>
                <span className="dkv-dot" /><span className="dkv-dot" style={{ animationDelay: '.15s' }} /><span className="dkv-dot" style={{ animationDelay: '.3s' }} />
              </div>
            )}

            {/* Chips de respuesta rápida (solo en modo chat, al inicio) */}
            {mode === 'chat' && !sending && messages.length <= 3 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 2 }}>
                {CHIPS.map((c) => (
                  <button key={c} className="dkv-chip" onClick={() => enviar(c.replace(/^[^\s]+\s/, ''))}>{c}</button>
                ))}
              </div>
            )}
          </div>

          {/* Formulario de lead inline */}
          {mode === 'lead' ? (
            <div style={{ padding: 14, borderTop: '1px solid #e2e8e4', background: '#fff', display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: TEAL }}>Déjanos tus datos y te llamamos gratis 👇</div>
              {leadErr && <div style={{ fontSize: 12, color: RED, fontWeight: 600 }}>{leadErr}</div>}
              <input value={lead.nombre} onChange={(e) => setLead((l) => ({ ...l, nombre: e.target.value }))} placeholder="Tu nombre" style={inp} />
              <input value={lead.telefono} onChange={(e) => setLead((l) => ({ ...l, telefono: e.target.value.replace(/[^\d+\s]/g, '').slice(0, 15) }))} placeholder="Tu teléfono" inputMode="tel" style={inp} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setMode('chat'); setLeadErr('') }} style={{ ...btnBase, background: '#eef2ef', color: '#6b7a76' }}>Volver</button>
                <button onClick={enviarLead} disabled={sending} style={{ ...btnBase, flex: 1, background: sending ? '#9aaba5' : RED, color: '#fff', cursor: sending ? 'wait' : 'pointer' }}>{sending ? 'Enviando…' : <><Check size={16} /> Que me llamen</>}</button>
              </div>
            </div>
          ) : mode === 'done' ? (
            <div style={{ padding: 14, borderTop: '1px solid #e2e8e4', background: '#fff', display: 'flex', gap: 8 }}>
              <a href="tel:699669603" style={{ ...btnBase, flex: 1, background: '#eef4f1', color: TEAL, textDecoration: 'none' }}><Phone size={15} /> Llamar ahora</a>
              <button onClick={() => setMode('chat')} style={{ ...btnBase, background: TEAL, color: '#fff' }}>Seguir preguntando</button>
            </div>
          ) : (
            <>
              {/* Botón fijo "que me llamen" */}
              <button onClick={() => setMode('lead')} style={{ margin: '0 12px', padding: '11px', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${RED}, #c02d2d)`, color: '#fff', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, boxShadow: '0 8px 20px -8px rgba(221,54,54,.55)' }}><Phone size={15} /> Quiero que me llamen gratis</button>
              {/* Entrada */}
              <div style={{ display: 'flex', gap: 8, padding: 12, background: '#fff' }}>
                <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') enviar() }} placeholder="Escribe tu pregunta…" style={{ flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
                <button onClick={() => enviar()} disabled={sending || !input.trim()} aria-label="Enviar" style={{ width: 44, height: 44, borderRadius: 12, border: 'none', background: input.trim() ? TEAL : '#cbd8d3', color: '#fff', cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Send size={19} /></button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  )
}

const inp: React.CSSProperties = { width: '100%', padding: '11px 13px', borderRadius: 11, border: '1.5px solid #e2e8e4', background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }
const btnBase: React.CSSProperties = { padding: '11px 16px', borderRadius: 11, border: 'none', fontWeight: 800, fontSize: 13.5, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }
