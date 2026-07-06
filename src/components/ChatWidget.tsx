'use client'
import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { SALUDO_INICIAL } from '@/lib/chatbot-kb'

type Msg = { role: 'user' | 'assistant'; content: string }

const VERDE = '#0F7A63'
const VERDE_OSC = '#0a2f27'

export default function ChatWidget() {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Msg[]>([{ role: 'assistant', content: SALUDO_INICIAL }])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, sending, open])

  async function enviar() {
    const texto = input.trim()
    if (!texto || sending) return
    const nuevos: Msg[] = [...messages, { role: 'user', content: texto }]
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
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: 'Ups, ha fallado la conexión. Inténtalo de nuevo en un momento.' },
      ])
    } finally {
      setSending(false)
    }
  }

  return (
    <>
      {/* En móvil (≤768px) aparece la barra sticky inferior de la web:
          subimos el botón y el panel para no taparla, igual que el botón de WhatsApp. */}
      <style>{`
        @media(max-width:768px){
          .dkv-chat-launcher{bottom:86px!important}
          .dkv-chat-panel{bottom:158px!important;height:min(70vh,calc(100vh - 200px))!important}
        }
      `}</style>

      {/* Botón flotante */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? 'Cerrar chat' : 'Abrir chat de ayuda'}
        className="dkv-chat-launcher"
        style={{
          position: 'fixed', bottom: 24, left: 24, zIndex: 1000,
          width: 60, height: 60, borderRadius: '50%', border: 'none', cursor: 'pointer',
          background: VERDE, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 8px 28px -6px rgba(15,122,99,0.55)', transition: 'transform 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      >
        {open ? <X size={26} /> : <MessageCircle size={28} />}
      </button>

      {/* Panel de chat */}
      {open && (
        <div
          className="dkv-chat-panel"
          style={{
            position: 'fixed', bottom: 96, left: 24, zIndex: 1000,
            width: 'min(380px, calc(100vw - 32px))', height: 'min(560px, calc(100vh - 140px))',
            background: '#fff', borderRadius: 20, overflow: 'hidden',
            display: 'flex', flexDirection: 'column',
            boxShadow: '0 24px 60px -12px rgba(10,47,39,0.35)',
            border: '1px solid #e2e8e4',
            fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
            animation: 'chatUp 0.25s ease both',
          }}
        >
          <style>{`@keyframes chatUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}`}</style>

          {/* Cabecera */}
          <div style={{ background: `linear-gradient(135deg, ${VERDE_OSC}, ${VERDE})`, padding: '16px 18px', color: '#fff' }}>
            <div style={{ fontWeight: 800, fontSize: 15.5 }}>Asistente DKV</div>
            <div style={{ fontSize: 12, opacity: 0.75, marginTop: 2 }}>Normalmente responde al instante</div>
          </div>

          {/* Mensajes */}
          <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: 16, background: '#f8fbf9', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '82%', padding: '10px 13px', borderRadius: 14, fontSize: 14, lineHeight: 1.45,
                  whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                  background: m.role === 'user' ? VERDE : '#fff',
                  color: m.role === 'user' ? '#fff' : '#16201d',
                  border: m.role === 'user' ? 'none' : '1px solid #e2e8e4',
                  borderBottomRightRadius: m.role === 'user' ? 4 : 14,
                  borderBottomLeftRadius: m.role === 'user' ? 14 : 4,
                }}
              >
                {m.content}
              </div>
            ))}
            {sending && (
              <div style={{ alignSelf: 'flex-start', padding: '10px 13px', borderRadius: 14, background: '#fff', border: '1px solid #e2e8e4', color: '#94a3a0', fontSize: 14 }}>
                escribiendo…
              </div>
            )}
          </div>

          {/* Entrada */}
          <div style={{ display: 'flex', gap: 8, padding: 12, borderTop: '1px solid #e2e8e4', background: '#fff' }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') enviar() }}
              placeholder="Escribe tu pregunta…"
              style={{
                flex: 1, padding: '11px 14px', borderRadius: 12, border: '1.5px solid #e2e8e4',
                background: '#f8fbf9', color: '#16201d', fontSize: 14, outline: 'none', fontFamily: 'inherit',
              }}
            />
            <button
              onClick={enviar}
              disabled={sending || !input.trim()}
              aria-label="Enviar"
              style={{
                width: 44, height: 44, borderRadius: 12, border: 'none',
                background: input.trim() ? VERDE : '#cbd8d3', color: '#fff',
                cursor: input.trim() ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Send size={19} />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
