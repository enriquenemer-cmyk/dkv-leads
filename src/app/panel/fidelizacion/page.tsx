'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import QRCode from 'qrcode'
import { supabase, Lead } from '@/lib/supabase'
import { logActividad } from '@/lib/actividad'
import { PageHero } from '@/components/PageHero'
import { Avatar } from '@/components/Avatar'
import { PRODUCTO_SLUGS, PRODUCTOS, parseSeguros, TARJETA, type ProductoSlug } from '@/lib/wallet-programas'
import { Search, QrCode, ExternalLink, Copy, Check, Camera, X, Gift } from 'lucide-react'

export default function FidelizacionPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [buscar, setBuscar] = useState('')
  const [sel, setSel] = useState<string | null>(null)
  const [guardando, setGuardando] = useState<string | null>(null)
  const [qr, setQr] = useState('')
  const [copiado, setCopiado] = useState(false)
  const [scanOpen, setScanOpen] = useState(false)
  const [scanMsg, setScanMsg] = useState('')
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetchLeads()
    const ch = supabase.channel('fidelizacion_rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, fetchLeads)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [])

  async function fetchLeads() {
    const { data } = await supabase.from('leads').select('*').order('created_at', { ascending: false })
    if (data) setLeads(data as Lead[])
  }

  const seleccionado = leads.find((l) => l.id === sel) || null
  const segurosSel = useMemo(() => parseSeguros(seleccionado?.wallet_seguros ?? null), [seleccionado])

  const cardUrl = sel && typeof window !== 'undefined' ? `${window.location.origin}/tarjeta/${sel}` : ''
  useEffect(() => {
    if (!cardUrl) { setQr(''); return }
    QRCode.toDataURL(cardUrl, { margin: 1, width: 360, color: { dark: '#0a2f27', light: '#ffffff' } }).then(setQr).catch(() => {})
  }, [cardUrl])

  const filtrados = useMemo(() => {
    const q = buscar.trim().toLowerCase()
    const base = q ? leads.filter((l) => l.nombre.toLowerCase().includes(q) || (l.email ?? '').toLowerCase().includes(q) || (l.telefono ?? '').includes(q)) : leads
    return base
  }, [leads, buscar])

  async function sellar(slug: ProductoSlug) {
    if (!seleccionado) return
    setGuardando(slug)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) { setGuardando(null); return }
      const res = await fetch('/api/tarjeta/sellar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ id: seleccionado.id, seguro: slug, accion: 'toggle' }),
      })
      const json = await res.json()
      if (res.ok) {
        setLeads((prev) => prev.map((l) => l.id === seleccionado.id ? { ...l, wallet_seguros: json.seguros, wallet_sellos: json.seguros.length } : l))
        const activado = json.seguros.includes(slug)
        logActividad('tarjeta_sello', `${activado ? 'Sello añadido' : 'Sello quitado'} (${PRODUCTOS[slug].nombre}) · ${seleccionado.nombre}`, { lead_id: seleccionado.id, lead_nombre: seleccionado.nombre })
      }
    } catch { /* nada */ }
    setGuardando(null)
  }

  function copiarEnlace() {
    if (!cardUrl) return
    navigator.clipboard.writeText(cardUrl)
    setCopiado(true); setTimeout(() => setCopiado(false), 2000)
  }

  // ── Escáner de QR (cámara, best-effort con BarcodeDetector) ──
  useEffect(() => {
    if (!scanOpen) return
    let stream: MediaStream | null = null
    let raf = 0
    let cancel = false
    async function run() {
      const BD = (window as unknown as { BarcodeDetector?: new (o?: { formats: string[] }) => { detect: (s: CanvasImageSource) => Promise<Array<{ rawValue: string }>> } }).BarcodeDetector
      if (!BD) { setScanMsg('Tu navegador no permite escanear. Busca al cliente por su nombre.'); return }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
        const v = videoRef.current!; v.srcObject = stream; await v.play()
        const det = new BD({ formats: ['qr_code'] })
        const loop = async () => {
          if (cancel) return
          try {
            const codes = await det.detect(v)
            const m = codes[0]?.rawValue?.match(/tarjeta\/([0-9a-f-]{16,})/i)
            if (m) { setSel(m[1]); setScanOpen(false); return }
          } catch { /* seguimos */ }
          raf = requestAnimationFrame(loop)
        }
        loop()
      } catch { setScanMsg('No se pudo abrir la cámara. Revisa los permisos o busca por nombre.') }
    }
    run()
    return () => { cancel = true; cancelAnimationFrame(raf); if (stream) stream.getTracks().forEach((t) => t.stop()) }
  }, [scanOpen])

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1100, margin: '0 auto' }}>
      <PageHero title="Tarjetas de fidelización" subtitle={`${TARJETA.nombre} · completa los ${TARJETA.total} seguros y consigue ${TARJETA.premio}`}
        right={<button onClick={() => { setScanMsg(''); setScanOpen(true) }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.16)', border: '1.5px solid rgba(255,255,255,0.35)', color: '#fff', borderRadius: 12, padding: '10px 16px', fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}><Camera size={16} /> Escanear QR</button>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20, alignItems: 'start' }} className="fid-grid">
        {/* Lista de clientes */}
        <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
          <div style={{ position: 'relative', padding: 12, borderBottom: '1px solid #f0f4f1' }}>
            <Search size={15} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#9aaba5' }} />
            <input value={buscar} onChange={(e) => setBuscar(e.target.value)} placeholder="Buscar cliente…"
              style={{ width: '100%', padding: '10px 12px 10px 38px', borderRadius: 10, border: '1.5px solid #e2e8e4', fontSize: 14, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
          </div>
          <div style={{ maxHeight: 560, overflowY: 'auto' }}>
            {filtrados.slice(0, 300).map((l) => {
              const s = parseSeguros(l.wallet_seguros ?? null)
              const activo = sel === l.id
              return (
                <button key={l.id} onClick={() => setSel(l.id)}
                  style={{ width: '100%', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: '1px solid #f5f7f5', background: activo ? '#eef7f3' : '#fff', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Avatar nombre={l.nombre} size={34} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13.5, fontWeight: 600, color: '#16201d', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.nombre}</div>
                    <div style={{ fontSize: 12, color: '#9aaba5' }}>{l.telefono || l.email || '—'}</div>
                  </div>
                  <span style={{ flexShrink: 0, fontSize: 12, fontWeight: 800, color: s.length >= TARJETA.total ? '#a8741a' : '#0F7A63', background: s.length >= TARJETA.total ? '#f8efd9' : '#e3f1ec', borderRadius: 999, padding: '3px 10px' }}>
                    {s.length >= TARJETA.total ? '🎁' : ''} {s.length}/{TARJETA.total}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Gestor de tarjeta */}
        <div style={{ position: 'sticky', top: 24 }}>
          {!seleccionado ? (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', padding: '40px 24px', textAlign: 'center', color: '#9aaba5' }}>
              <QrCode size={34} style={{ marginBottom: 10, opacity: 0.5 }} />
              <div style={{ fontWeight: 700, color: '#16201d' }}>Elige un cliente</div>
              <p style={{ fontSize: 13, marginTop: 6 }}>Selecciona a alguien de la lista (o escanea su QR) para gestionar su tarjeta y sus sellos.</p>
            </div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 18, border: '1px solid #edf1ef', overflow: 'hidden', boxShadow: '0 1px 2px rgba(16,32,29,0.04)' }}>
              <div style={{ background: 'linear-gradient(135deg,#0F7A63,#0a2f27)', padding: '18px 20px', color: '#fff' }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{TARJETA.nombre}</div>
                <div style={{ fontSize: 19, fontWeight: 800, textTransform: 'capitalize' }}>{seleccionado.nombre}</div>
              </div>
              <div style={{ padding: 20 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: '#9aaba5', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>Sellos (toca para marcar)</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 18 }}>
                  {PRODUCTO_SLUGS.map((slug) => {
                    const p = PRODUCTOS[slug]
                    const on = segurosSel.includes(slug)
                    return (
                      <button key={slug} onClick={() => sellar(slug)} disabled={guardando === slug}
                        style={{ textAlign: 'center', borderRadius: 14, padding: '14px 4px', cursor: 'pointer', fontFamily: 'inherit', border: `2px solid ${on ? '#0F7A63' : '#e6ebe8'}`, background: on ? '#e3f1ec' : '#fbfdfc', opacity: guardando === slug ? 0.5 : 1 }}>
                        <div style={{ fontSize: 30, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.4 }}>{p.emoji}</div>
                        <div style={{ fontSize: 12, fontWeight: 700, color: on ? '#0F7A63' : '#9aaba5', marginTop: 3 }}>{p.nombre}</div>
                      </button>
                    )
                  })}
                </div>

                {segurosSel.length >= TARJETA.total && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8efd9', border: '1.5px solid #f0d9a0', borderRadius: 12, padding: '10px 12px', marginBottom: 16, color: '#a8741a', fontWeight: 700, fontSize: 13 }}>
                    <Gift size={16} /> ¡Tarjeta completa! Le corresponde {TARJETA.premio}.
                  </div>
                )}

                {/* QR de la tarjeta del cliente */}
                <div style={{ textAlign: 'center', borderTop: '1px solid #f0f4f1', paddingTop: 16 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#16201d', marginBottom: 10 }}>QR de su tarjeta</div>
                  {qr && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={qr} alt="QR de la tarjeta" style={{ width: 180, height: 180, margin: '0 auto', display: 'block', borderRadius: 12, border: '1px solid #eef2f0' }} />
                  )}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <a href={cardUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, background: '#0F7A63', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 700 }}>
                      <ExternalLink size={14} /> Ver tarjeta
                    </a>
                    <button onClick={copiarEnlace} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 10, border: '1.5px solid #e2e8e4', background: '#fff', color: '#16201d', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                      {copiado ? <><Check size={14} color="#0F7A63" /> Copiado</> : <><Copy size={14} /> Copiar enlace</>}
                    </button>
                  </div>
                  <p style={{ fontSize: 11.5, color: '#9aaba5', marginTop: 10 }}>Envíale este enlace o QR al cliente para que guarde su tarjeta.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal escáner */}
      {scanOpen && (
        <div onClick={() => setScanOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(10,47,39,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: 20, width: '100%', maxWidth: 380 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#16201d' }}>Escanear QR del cliente</div>
              <button onClick={() => setScanOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7a76' }}><X size={20} /></button>
            </div>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: '#000', aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {scanMsg ? <div style={{ color: '#fff', fontSize: 13, textAlign: 'center', padding: 20 }}>{scanMsg}</div>
                : <video ref={videoRef} playsInline muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
            </div>
            <p style={{ fontSize: 12, color: '#9aaba5', marginTop: 12, textAlign: 'center' }}>Apunta al código QR de la tarjeta del cliente para abrir su ficha.</p>
          </div>
        </div>
      )}

      <style>{`@media(max-width:860px){.fid-grid{grid-template-columns:1fr !important}}`}</style>
    </div>
  )
}
