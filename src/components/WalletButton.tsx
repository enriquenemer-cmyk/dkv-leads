'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { Wallet, MessageCircle, Copy, ExternalLink, Minus, Plus, RefreshCw, Check } from 'lucide-react'

/* Tarjeta de fidelización "Club Sonrisa" para Google Wallet.
   El asesor elige cuántos sellos lleva el cliente (0..3, cada uno = 1 referido).
   - "Generar tarjeta": crea el enlace para que el cliente la guarde (por WhatsApp).
   - "Actualizar en el móvil": para tarjetas ya guardadas, actualiza los sellos y
     Google envía el push automático al móvil del cliente.
   3 sellos = blanqueamiento dental gratis (el 4º hueco es el regalo). */

const VERDE = '#0F7A63'
const SELLOS_TOTAL = 3

type LeadWallet = { id: string; nombre: string; telefono: string | null; wallet_sellos?: number | null; wallet_guardada?: boolean | null }

export function WalletButton({ lead }: { lead: LeadWallet }) {
  const [sellos, setSellos] = useState(lead.wallet_sellos ?? 0)
  const [estado, setEstado] = useState<'idle' | 'cargando' | 'listo' | 'error' | 'no-config'>('idle')
  const [url, setUrl] = useState('')
  const [msgError, setMsgError] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [existe, setExiste] = useState<boolean | null>(lead.wallet_guardada ?? null) // ¿ya guardó la tarjeta?
  const [push, setPush] = useState<'idle' | 'enviando' | 'ok' | 'error'>('idle')
  const [pushMsg, setPushMsg] = useState('')

  // Código de cliente corto y estable a partir del id del lead (más limpio que el UUID)
  const clienteId = 'DKV-' + lead.id.replace(/-/g, '').slice(0, 8).toUpperCase()
  const nombre1 = lead.nombre.split(' ')[0]
  const waNum = (lead.telefono ?? '').replace(/\D/g, '')

  // Guarda campos de wallet en el lead (Supabase es la copia local; Google es la fuente real del pase)
  async function persistir(campos: { wallet_sellos?: number; wallet_guardada?: boolean }) {
    try { await supabase.from('leads').update(campos).eq('id', lead.id) } catch { /* se ignora */ }
  }

  // Al abrir la ficha: reconcilia con Google los sellos reales del pase (si el cliente ya lo guardó)
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const res = await fetch(`/api/wallet/google?cliente=${clienteId}&estado=1`)
        if (!res.ok || !vivo) return
        const data = await res.json()
        if (!vivo || !data.existe) return
        setExiste(true)
        if (typeof data.sellos === 'number') setSellos(data.sellos)
        // Sincroniza la copia en Supabase si difiere de lo que dice Google
        if (data.sellos !== (lead.wallet_sellos ?? 0) || !lead.wallet_guardada) {
          persistir({ wallet_sellos: data.sellos ?? 0, wallet_guardada: true })
        }
      } catch { /* sin conexión o sin config: se ignora */ }
    })()
    return () => { vivo = false }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clienteId])

  async function generar() {
    setEstado('cargando'); setMsgError('')
    try {
      const q = new URLSearchParams({ cliente: clienteId, nombre: lead.nombre, sellos: String(sellos) })
      const res = await fetch(`/api/wallet/google?${q}`)
      const data = await res.json()
      if (res.status === 503) { setEstado('no-config'); return }
      if (!res.ok) { setEstado('error'); setMsgError(data.error || 'No se pudo generar la tarjeta'); return }
      setUrl(data.url); setEstado('listo')
      persistir({ wallet_sellos: sellos })
      logActividad('wallet_enviada', `Tarjeta Club Sonrisa generada para ${lead.nombre} (${sellos}/${SELLOS_TOTAL} sellos)`, { lead_id: lead.id, lead_nombre: lead.nombre })
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
        body: JSON.stringify({ cliente: clienteId, nombre: lead.nombre, sellos }),
      })
      const data = await res.json()
      if (res.ok) {
        setPush('ok'); setExiste(true)
        persistir({ wallet_sellos: sellos, wallet_guardada: true })
        logActividad('wallet_actualizada', `Sellos actualizados a ${sellos}/${SELLOS_TOTAL} en el móvil de ${lead.nombre}${sellos >= SELLOS_TOTAL ? ' · ¡premio desbloqueado!' : ''}`, { lead_id: lead.id, lead_nombre: lead.nombre })
        setTimeout(() => setPush('idle'), 2500); return
      }
      setPush('error')
      setPushMsg(res.status === 409
        ? 'El cliente aún no ha guardado la tarjeta. Envíale primero el enlace.'
        : (data.error || 'No se pudo actualizar'))
    } catch {
      setPush('error'); setPushMsg('Error de red al actualizar')
    }
  }

  function copiar() {
    navigator.clipboard.writeText(url)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  const waTexto = `Hola ${nombre1}, aquí tienes tu tarjeta Club Sonrisa de DKV 🦷. Ábrela en el móvil y guárdala en tu Google Wallet: ${url}`

  return (
    <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: 24, boxShadow: '0 1px 2px rgba(16,32,29,0.04), 0 10px 30px -20px rgba(16,32,29,0.18)' }} className="no-print">
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
        <div style={{ width: 32, height: 32, borderRadius: 10, background: '#e9f3ef', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Wallet size={15} style={{ color: VERDE }} />
        </div>
        <h2 style={{ fontSize: 14.5, fontWeight: 700, color: '#16201d', margin: 0 }}>Tarjeta de fidelización</h2>
        {existe && (
          <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: VERDE, background: '#e3f1ec', padding: '3px 9px', borderRadius: 20 }}>Guardada</span>
        )}
      </div>
      <p style={{ fontSize: 12, color: '#9aaba5', margin: '0 0 16px', lineHeight: 1.5 }}>
        Club Sonrisa · {SELLOS_TOTAL} referidos = 1 blanqueamiento dental
      </p>

      {/* Selector de sellos */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {Array.from({ length: SELLOS_TOTAL }).map((_, i) => (
            <span key={i} style={{
              width: 22, height: 22, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, fontWeight: 700,
              background: i < sellos ? VERDE : '#f0f4f1',
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
          <span style={{ fontSize: 15, fontWeight: 700, color: '#16201d', minWidth: 30, textAlign: 'center' }}>{sellos}/{SELLOS_TOTAL}</span>
          <button onClick={() => setSellos(s => Math.min(SELLOS_TOTAL, s + 1))} aria-label="Añadir sello"
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
