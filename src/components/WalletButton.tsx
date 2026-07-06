'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { PROGRAMAS, PROGRAMA_SLUGS, type ProgramaSlug } from '@/lib/wallet-programas'
import { Wallet, MessageCircle, Copy, ExternalLink, Minus, Plus, RefreshCw, Check } from 'lucide-react'

/* Tarjetas de fidelización "Club DKV" para Google Wallet (4 ramos).
   El asesor elige el ramo (sonrisa/hogar/decesos/vida) y cuántos sellos
   lleva el cliente. Genera el enlace (WhatsApp) o actualiza en el móvil (push).
   Nota: la copia en Supabase (pill de la lista) sólo se guarda para "sonrisa";
   los otros ramos funcionan leyendo el estado real de Google. */

const VERDE = '#0F7A63'

type LeadWallet = { id: string; nombre: string; telefono: string | null; wallet_sellos?: number | null; wallet_guardada?: boolean | null }

export function WalletButton({ lead }: { lead: LeadWallet }) {
  const [programa, setPrograma] = useState<ProgramaSlug>('sonrisa')
  const prog = PROGRAMAS[programa]
  const total = prog.total
  const esSonrisa = programa === 'sonrisa'

  const [sellos, setSellos] = useState(lead.wallet_sellos ?? 0)
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'listo' | 'error' | 'no-config'>('idle')
  const [url, setUrl] = useState('')
  const [msgError, setMsgError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [existe, setExiste] = useState<boolean | null>(lead.wallet_guardada ?? null)
  const [push, setPush] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [pushMsg, setPushMsg] = useState('')

  const clienteId = 'DKV-' + lead.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  const nombre1 = lead.nombre.split(' ')[0]
  const waNum = (lead.telefono ?? '').replace(/\D/g, '')

  async function persistir(campos: { wallet_sellos?: number; wallet_guardada?: boolean }) {
    if (!esSonrisa) return // sólo el ramo dental se refleja en la lista (columna única)
    try { await supabase.from('leads').update(campos).eq('id', lead.id) } catch { /* se ignora */ }
  }

  function cambiarPrograma(s: ProgramaSlug) {
    if (s === programa) return
    setPrograma(s)
    setEstado('idle'); setUrl(''); setPush('idle'); setMsgError('')
    setSellos(s === 'sonrisa' ? (lead.wallet_sellos ?? 0) : 0)
    setExiste(s === 'sonrisa' ? (lead.wallet_guardada ?? null) : null)
  }

  // Al abrir la ficha o cambiar de ramo: reconcilia con Google los sellos reales del pase
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const res = await fetch(`/api/wallet/google?programa=${programa}&cliente=${clienteId}&estado=1`)
        if (!res.ok || !vivo) return
        const data = await res.json()
        if (!vivo || !data.existe) return
        setExiste(true)
        if (typeof data.sellos === 'number') setSellos(data.sellos)
        if (esSonrisa && (data.sellos !== (lead.wallet_sellos ?? 0) || !lead.wallet_guardada)) {
          persistir({ wallet_sellos: data.sellos ?? 0, wallet_guardada: true })
        }
      } catch { /* sin conexión o sin config: se ignora */ }
    })()
    return () => { vivo = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId, programa])

  async function generar() {
    setEstado('cargando'); setMsgError('')
    try {
      const q = new URLSearchParams({ programa, cliente: clienteId, nombre: lead.nombre, sellos: String(sellos) })
      const res = await fetch(`/api/wallet/google?${q}`)
      const data = await res.json()
      if (res.status === 503) { setEstado('no-config'); return }
      if (!res.ok) { setEstado('error'); setMsgError(data.error || 'No se pudo generar la tarjeta'); return }
      setUrl(data.url); setEstado('listo')
      persistir({ wallet_sellos: sellos })
      logActividad('wallet_enviada', `${prog.nombre} generada para ${lead.nombre} (${sellos}/${total} sellos)`, { lead_id: lead.id, lead_nombre: lead.nombre })
    } catch {
      setEstado('error'); setMsgError('Error de red al generar la tarjeta')
    }
  }

  async function actualizarPush() {
    setPush('enviando'); setPushMsg('')
    try {
      const res = await fetch('/api/wallet/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ programa, cliente: clienteId, nombre: lead.nombre, sellos }),
      })
      const data = await res.json()
      if (res.ok) {
        setPush('ok'); setExiste(true)
        persistir({ wallet_sellos: sellos, wallet_guardada: true })
        logActividad('wallet_actualizada', `${prog.nombre}: sellos a ${sellos}/${total} en el móvil de ${lead.nombre}${sellos >= total ? ' · ¡premio!' : ''}`, { lead_id: lead.id, lead_nombre: lead.nombre })
        setTimeout(() => setPush('idle'), 2500); return
      }
      setPush('error')
      setPushMsg(res.status === 409
        ? 'El cliente aún no ha guardado esta tarjeta. Envíale primero el enlace.'
        : (data.error || 'No se pudo actualizar'))
    } catch {
      setPush('error'); setPushMsg('Error de red al actualizar')
    }
  }

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  const waTexto = `Hola ${nombre1}, aquí tienes tu tarjeta ${prog.nombre} de DKV ${prog.emoji}. Ábrela en el móvil y guárdala en tu Google Wallet: ${url}`

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: 24, boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#e9f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={15} style={{ color: VERDE }} />
        </div>
        <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', margin: 0 }}>Tarjetas de fidelización</h2>
        {existe && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: VERDE, background: '#e3f1ec', padding: '3px 9px', borderRadius: 20 }}>Guardada</span>
        )}
      </div>

      {/* Selector de programa/ramo */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
        {PROGRAMA_SLUGS.map((s) => {
          const p = PROGRAMAS[s]; const activo = s === programa
          return (
            <button key={s} onClick={() => cambiarPrograma(s)}
              style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '9px 11px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                border: activo ? `2px solid ${p.accent}` : '1.5px solid #e2e8e4',
                background: activo ? '#f8fbf9' : '#fff',
                color: '#16201d', fontSize: 12.5, fontWeight: activo ? 700 : 500, textAlign: 'left',
              }}>
              <span style={{ fontSize: 15 }}>{p.emoji}</span> {p.nombre.replace('Club ', '')}
            </button>
          )
        })}
      </div>

      <p style={{ fontSize: 12, color: '#9aaba5', margin: '0 0 14px', lineHeight: 1.5 }}>
        {prog.nombre} · {total} referidos = {prog.premio}
      </p>

      {/* Selector de sellos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: total }).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: i < sellos ? prog.accent : '#f0f4f1',
              color: i < sellos ? '#fff' : '#c8d4ce',
              border: i < sellos ? 'none' : '1px solid #e2e8e4',
            }}>{i < sellos ? '✓' : ''}</span>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => setSellos(s => Math.max(0, s - 1))} aria-label="Quitar sello"
            style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Minus size={14} />
          </button>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#16201d', minWidth: 30, textAlign: 'center' }}>{sellos}/{total}</span>
          <button onClick={() => setSellos(s => Math.min(total, s + 1))} aria-label="Añadir sello"
            style={{ width: 28, height: 28, borderRadius: 8, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* Actualizar push (tarjeta ya guardada) */}
      <button onClick={actualizarPush} disabled={push === 'enviando'}
        style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1.5px solid ${push === 'ok' ? VERDE : '#e2e8e4'}`, background: push === 'ok' ? '#e3f1ec' : '#f8fbf9', color: push === 'ok' ? VERDE : '#16201d', fontSize: 13, fontWeight: 700, cursor: push === 'enviando' ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        {push === 'ok' ? <><Check size={15} /> Sellos actualizados en su móvil</> : <><RefreshCw size={15} /> {push === 'enviando' ? 'Enviando…' : 'Actualizar en el móvil (push)'}</>}
      </button>
      {push === 'error' && (
        <div style={{ margin: '0 0 12px', padding: '10px 13px', borderRadius: 11, background: '#f8efd9', border: '1px solid #f0d9a0', fontSize: 12, color: '#7a5c10', lineHeight: 1.5 }}>{pushMsg}</div>
      )}

      {/* Generar / enviar tarjeta (primer alta) */}
      {estado !== 'listo' && (
        <button onClick={generar} disabled={estado === 'cargando'}
          style={{ width: '100%', padding: '12px', borderRadius: 12, border: 'none', background: VERDE, color: '#fff', fontSize: 13.5, fontWeight: 700, cursor: estado === 'cargando' ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <Wallet size={16} /> {estado === 'cargando' ? 'Generando…' : 'Generar enlace para el cliente'}
        </button>
      )}

      {estado === 'no-config' && (
        <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 12, background: '#f8efd9', border: '1px solid #f0d9a0', fontSize: 12.5, color: '#7a5c10', lineHeight: 1.5 }}>
          Google Wallet aún no está configurado. Falta dar de alta la cuenta emisora y añadir las credenciales en el servidor.
        </div>
      )}

      {estado === 'error' && (
        <div style={{ marginTop: 12, padding: '11px 14px', borderRadius: 12, background: '#fbe9e7', border: '1px solid #f3c9c1', fontSize: 12.5, color: '#a3352a' }}>
          {msgError}
        </div>
      )}

      {estado === 'listo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {waNum && (
            <a href={`https://wa.me/${waNum}?text=${encodeURIComponent(waTexto)}`} target="_blank" rel="noopener noreferrer"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 12, background: '#25D366', textDecoration: 'none', fontWeight: 700, fontSize: 13.5, color: '#fff' }}>
              <MessageCircle size={16} /> Enviar por WhatsApp
            </a>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={copiar}
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: copiado ? '#e3f1ec' : '#fff', color: copiado ? VERDE : '#6b7a76', fontSize: 12.5, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Copy size={14} /> {copiado ? 'Copiado' : 'Copiar enlace'}
            </button>
            <a href={url} target="_blank" rel="noopener noreferrer"
              style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '11px', borderRadius: 12, border: '1.5px solid #e2e8e4', background: '#fff', color: '#6b7a76', fontSize: 12.5, fontWeight: 600, textDecoration: 'none' }}>
              <ExternalLink size={14} /> Abrir
            </a>
          </div>
          <button onClick={() => setEstado('idle')}
            style={{ background: 'none', border: 'none', color: '#9aaba5', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', padding: '4px 0' }}>
            Cambiar sellos y regenerar
          </button>
        </div>
      )}
    </div>
  )
}
