'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { PRODUCTO_SLUGS, PRODUCTOS, parseSeguros, TARJETA, type ProductoSlug } from '@/lib/wallet-programas'

type Tarjeta = { nombre: string; seguros: ProductoSlug[]; total: number; premio: string; nombreTarjeta: string }

export default function TarjetaPublicaPage() {
  const { id } = useParams<{ id: string }>()
  const [t, setT] = useState<Tarjeta | null>(null)
  const [error, setError] = useState(false)
  const [qr, setQr] = useState('')

  useEffect(() => {
    let vivo = true
    async function cargar() {
      // Función segura (SECURITY DEFINER) que expone solo nombre + seguros.
      const { data, error: err } = await supabase.rpc('tarjeta_publica', { p_id: id })
      if (!vivo) return
      const row = Array.isArray(data) ? data[0] : data
      if (err || !row) { setError(true); return }
      setError(false)
      setT({
        nombre: row.nombre,
        seguros: parseSeguros(row.seguros),
        total: TARJETA.total,
        premio: TARJETA.premio,
        nombreTarjeta: TARJETA.nombre,
      })
    }
    cargar()
    const iv = setInterval(cargar, 5000) // refresco automático al sellar
    return () => { vivo = false; clearInterval(iv) }
  }, [id])

  useEffect(() => {
    if (typeof window === 'undefined') return
    QRCode.toDataURL(window.location.href, { margin: 1, width: 320, color: { dark: '#0a2f27', light: '#ffffff' } })
      .then(setQr).catch(() => {})
  }, [])

  const contratados = t?.seguros.length ?? 0
  const completa = t && contratados >= t.total

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(160deg,#0a2f27,#05130f)', display: 'flex', justifyContent: 'center', padding: '24px 16px', fontFamily: '-apple-system,Segoe UI,Roboto,sans-serif' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        {/* Cabecera de marca */}
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/dkv-logo-wordmark.png" alt="DKV" style={{ height: 30, background: '#fff', borderRadius: 10, padding: '8px 14px' }} />
        </div>

        {error ? (
          <div style={{ background: '#fff', borderRadius: 22, padding: '40px 24px', textAlign: 'center', color: '#6b7a76' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>🔒</div>
            <div style={{ fontWeight: 700, color: '#16201d', fontSize: 17 }}>Tarjeta no encontrada</div>
            <p style={{ fontSize: 13.5, marginTop: 6 }}>Este enlace no es válido. Pídele a tu asesor de DKV una tarjeta nueva.</p>
          </div>
        ) : !t ? (
          <div style={{ background: '#fff', borderRadius: 22, padding: '48px 24px', textAlign: 'center', color: '#9aaba5' }}>Cargando tu tarjeta…</div>
        ) : (
          <>
            {/* Tarjeta */}
            <div style={{ background: '#fff', borderRadius: 24, overflow: 'hidden', boxShadow: '0 20px 60px -24px rgba(0,0,0,0.6)' }}>
              <div style={{ background: 'linear-gradient(135deg,#0F7A63,#0a2f27)', padding: '22px 24px', color: '#fff' }}>
                <div style={{ fontSize: 12.5, fontWeight: 700, opacity: 0.85, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{t.nombreTarjeta}</div>
                <div style={{ fontSize: 23, fontWeight: 800, marginTop: 3, textTransform: 'capitalize' }}>{t.nombre}</div>
              </div>

              <div style={{ padding: '24px' }}>
                {/* Sellos (3 seguros) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, marginBottom: 20 }}>
                  {PRODUCTO_SLUGS.map((slug) => {
                    const p = PRODUCTOS[slug]
                    const on = t.seguros.includes(slug)
                    return (
                      <div key={slug} style={{ textAlign: 'center', borderRadius: 16, padding: '16px 6px', border: `2px solid ${on ? '#0F7A63' : '#e6ebe8'}`, background: on ? '#e3f1ec' : '#fbfdfc', position: 'relative' }}>
                        <div style={{ fontSize: 34, filter: on ? 'none' : 'grayscale(1)', opacity: on ? 1 : 0.4 }}>{p.emoji}</div>
                        <div style={{ fontSize: 12.5, fontWeight: 700, color: on ? '#0F7A63' : '#9aaba5', marginTop: 4 }}>{p.nombre}</div>
                        {on && <div style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: '#0F7A63', color: '#fff', fontSize: 13, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✓</div>}
                      </div>
                    )
                  })}
                </div>

                {/* Progreso / premio */}
                {completa ? (
                  <div style={{ textAlign: 'center', background: '#f8efd9', border: '1.5px solid #f0d9a0', borderRadius: 16, padding: '16px' }}>
                    <div style={{ fontSize: 30 }}>🎁</div>
                    <div style={{ fontWeight: 800, color: '#a8741a', fontSize: 16, marginTop: 4 }}>¡Tarjeta completa!</div>
                    <div style={{ fontSize: 13, color: '#7a5c10', marginTop: 2 }}>Has conseguido {t.premio}. Tu asesor se pondrá en contacto contigo.</div>
                  </div>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, color: '#48574f', fontWeight: 600 }}>Llevas <b style={{ color: '#0F7A63' }}>{contratados} de {t.total}</b> seguros</div>
                    <div style={{ height: 10, borderRadius: 999, background: '#eef2f0', marginTop: 10, overflow: 'hidden' }}>
                      <div style={{ width: `${(contratados / t.total) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#12a07f,#0F7A63)' }} />
                    </div>
                    <div style={{ fontSize: 12.5, color: '#9aaba5', marginTop: 8 }}>Completa los 3 seguros y te llevas {t.premio}.</div>
                  </div>
                )}
              </div>
            </div>

            {/* QR */}
            <div style={{ background: '#fff', borderRadius: 22, marginTop: 16, padding: '22px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, color: '#16201d', marginBottom: 4 }}>Muestra este código a tu asesor</div>
              <div style={{ fontSize: 12, color: '#9aaba5', marginBottom: 14 }}>Guarda esta página en tu móvil para llevar siempre tu tarjeta.</div>
              {qr && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="Código QR de tu tarjeta" style={{ width: 200, height: 200, display: 'block', margin: '0 auto', borderRadius: 12 }} />
              )}
            </div>

            <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.55)', fontSize: 11.5, marginTop: 18 }}>
              DKV Seguros · Agente exclusivo · 699 66 96 03
            </div>
          </>
        )}
      </div>
    </div>
  )
}
