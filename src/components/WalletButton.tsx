'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { PRODUCTOS, PRODUCTO_SLUGS, TARJETA, type ProductoSlug } from '@/lib/wallet-programas'
import { Wallet, MessageCircle, Copy, ExternalLink, RefreshCw, Check } from 'lucide-react'

/* Tarjeta "Club Protección DKV" para Google Wallet.
   El asesor marca los seguros que el cliente ya tiene (Hogar/Decesos/Vida).
   Al completar los 3 → regalo sorpresa. Genera enlace (WhatsApp) o push. */

const VERDE = '#0F7A63'

type LeadWallet = {
  id: string; nombre: string; telefono: string | null
  wallet_sellos?: number | null; wallet_guardada?: boolean | null; wallet_seguros?: string[] | null
}

export function WalletButton({ lead }: { lead: LeadWallet }) {
  const inicial = (lead.wallet_seguros ?? []).filter((s): s is ProductoSlug => PRODUCTO_SLUGS.includes(s as ProductoSlug))
  const [seguros, setSeguros] = useState<ProductoSlug[]>(inicial)
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
  const n = seguros.length
  const total = TARJETA.total

  function toggle(s: ProductoSlug) {
    setSeguros((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
    setEstado('idle'); setUrl('')
  }

  async function persistir(campos: { wallet_sellos?: number; wallet_guardada?: boolean; wallet_seguros?: string[] }) {
    try { await supabase.from('leads').update(campos).eq('id', lead.id) } catch { /* se ignora */ }
  }

  // Al abrir la ficha: comprueba si el cliente ya guardó la tarjeta
  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const res = await fetch(`/api/wallet/google?cliente=${clienteId}&estado=1`)
        if (!res.ok || !vivo) return
        const data = await res.json()
        if (!vivo || !data.existe) return
        setExiste(true)
      } catch { /* se ignora */ }
    })()
    return () => { vivo = false }
  }, [clienteId])

  async function generar() {
    setEstado('cargando'); setMsgError('')
    try {
      const q = new URLSearchParams({ cliente: clienteId, nombre: lead.nombre, seguros: seguros.join(',') })
      const res = await fetch(`/api/wallet/google?${q}`)
      const data = await res.json()
      if (res.status === 503) { setEstado('no-config'); return }
      if (!res.ok) { setEstado('error'); setMsgError(data.error || 'No se pudo generar la tarjeta'); return }
      setUrl(data.url); setEstado('listo')
      persistir({ wallet_sellos: n, wallet_seguros: seguros })
      logActividad('wallet_enviada', `Club Protección DKV generada para ${lead.nombre} (${n}/${total} seguros)`, { lead_id: lead.id, lead_nombre: lead.nombre })
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
        body: JSON.stringify({ cliente: clienteId, nombre: lead.nombre, seguros }),
      })
      const data = await res.json()
      if (res.ok) {
        setPush('ok'); setExiste(true)
        persistir({ wallet_sellos: n, wallet_guardada: true, wallet_seguros: seguros })
        logActividad('wallet_actualizada', `Club Protección DKV: ${n}/${total} seguros en el móvil de ${lead.nombre}${n >= total ? ' · ¡regalo sorpresa!' : ''}`, { lead_id: lead.id, lead_nombre: lead.nombre })
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

  const waTexto = `Hola ${nombre1}, aquí tienes tu tarjeta Club Protección DKV 🎁. Ábrela en el móvil y guárdala en tu Google Wallet: ${url}`

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
      <p style={{ fontSize: 12, color: '#9aaba5', margin: '0 0 14px', lineHeight: 1.5 }}>
        Club Protección DKV · los 3 seguros = regalo sorpresa
      </p>

      {/* Interruptores por seguro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
        <div style={{ display: 'flex', gap: 6 }}>
          {PRODUCTO_SLUGS.map((s) => {
            const p = PRODUCTOS[s]; const on = seguros.includes(s)
            return (
              <button key={s} onClick={() => toggle(s)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5, padding: '8px 10px', borderRadius: 11, cursor: 'pointer', fontFamily: 'inherit',
                  border: on ? `2px solid ${p.accent}` : '1.5px solid #e2e8e4',
                  background: on ? '#f8fbf9' : '#fff',
                  color: on ? '#16201d' : '#9aaba5', fontSize: 12, fontWeight: on ? 700 : 500,
                }}>
                <span style={{ fontSize: 14 }}>{p.emoji}</span> {p.nombre}
              </button>
            )
          })}
        </div>
        <span style={{ fontSize: 15, fontWeight: 700, color: '#16201d' }}>{n}/{total}</span>
      </div>

      {/* Actualizar push (tarjeta ya guardada) */}
      <button onClick={actualizarPush} disabled={push === 'enviando'}
        style={{ width: '100%', padding: '11px', borderRadius: 12, border: `1.5px solid ${push === 'ok' ? VERDE : '#e2e8e4'}`, background: push === 'ok' ? '#e3f1ec' : '#f8fbf9', color: push === 'ok' ? VERDE : '#16201d', fontSize: 13, fontWeight: 700, cursor: push === 'enviando' ? 'wait' : 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 10 }}>
        {push === 'ok' ? <><Check size={15} /> Actualizado en su móvil</> : <><RefreshCw size={15} /> {push === 'enviando' ? 'Enviando…' : 'Actualizar en el móvil (push)'}</>}
      </button>
      {push === 'error' && (
        <div style={{ margin: '0 0 12px', padding: '10px 13px', borderRadius: 11, background: '#f8efd9', border: '1px solid #f0d9a0', fontSize: 12, color: '#7a5c10', lineHeight: 1.5 }}>{pushMsg}</div>
      )}

      {/* Generar / enviar tarjeta */}
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
        </div>
      )}
    </div>
  )
}
