'use client'
import { useEffect, useState } from 'react'
import Script from 'next/script'

const GA_ID = process.env.NEXT_PUBLIC_GA_ID || ''
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ''
const ADS_ID = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID || ''       // p.ej. AW-123456789
const ADS_LABEL = process.env.NEXT_PUBLIC_GOOGLE_ADS_LABEL || '' // etiqueta de la acción de conversión
const CLARITY_RAW = process.env.NEXT_PUBLIC_CLARITY_ID || ''     // ID de proyecto de Microsoft Clarity (mapas de calor)
// Solo cargar Clarity con un ID válido (evita el error 400 con placeholders como "Project ID de Clarity")
const CLARITY_ID = /^[a-z0-9]{6,}$/i.test(CLARITY_RAW.trim()) ? CLARITY_RAW.trim() : ''
const KEY = 'dkv-cookie-consent' // 'accepted' | 'rejected'

/* Dispara la conversión de lead en GA4 + Google Ads + Meta Pixel.
   Se llama en la página de gracias (destino fiable, ya navegado).
   Es seguro aunque no haya consentimiento (los objetos no existirán). */
export function trackLead(value?: number) {
  if (typeof window === 'undefined') return
  try {
    // @ts-expect-error gtag inyectado por Google
    const g = window.gtag
    g?.('event', 'generate_lead', { currency: 'EUR', value: value ?? 0 })
    if (ADS_ID && ADS_LABEL) {
      g?.('event', 'conversion', { send_to: `${ADS_ID}/${ADS_LABEL}`, value: value ?? 0, currency: 'EUR' })
    }
    // @ts-expect-error fbq inyectado por Meta Pixel
    window.fbq?.('track', 'Lead')
  } catch { /* noop */ }
}

type WinFn = { gtag?: (...a: unknown[]) => void; fbq?: (...a: unknown[]) => void }

/* Evento genérico a GA4 (para micro-conversiones que optimizan las pujas). */
export function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === 'undefined') return
  try { (window as unknown as WinFn).gtag?.('event', name, params) } catch { /* noop */ }
}

/* Clic en teléfono o WhatsApp → señal de contacto para Google Ads + Meta.
   En móvil de pago, muchas conversiones llegan por llamada/WhatsApp: medirlas es clave. */
export function trackContact(method: 'phone' | 'whatsapp') {
  trackEvent('contact', { method })
  try { (window as unknown as WinFn).fbq?.('track', 'Contact', { method }) } catch { /* noop */ }
  const cid = process.env.NEXT_PUBLIC_GOOGLE_ADS_ID
  const clabel = process.env.NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL
  if (cid && clabel) trackEvent('conversion', { send_to: `${cid}/${clabel}` })
}

/* Primer contacto con el formulario → intención de lead (para remarketing y pujas). */
export function trackFormStart() {
  trackEvent('form_start')
  try { (window as unknown as WinFn).fbq?.('trackCustom', 'FormStart') } catch { /* noop */ }
}

export default function Analytics() {
  const [consent, setConsent] = useState<'accepted' | 'rejected' | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(KEY)) as
      | 'accepted' | 'rejected' | null
    setConsent(saved)
    setReady(true)
  }, [])

  const choose = (v: 'accepted' | 'rejected') => {
    try { localStorage.setItem(KEY, v) } catch { /* noop */ }
    setConsent(v)
  }

  const load = consent === 'accepted'

  return (
    <>
      {/* Google (Analytics 4 + Google Ads) — se carga si hay GA o Ads configurado */}
      {load && (GA_ID || ADS_ID) && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID || ADS_ID}`} strategy="afterInteractive" />
          <Script id="gtag-init" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            ${GA_ID ? `gtag('config', '${GA_ID}', { anonymize_ip: true });` : ''}
            ${ADS_ID ? `gtag('config', '${ADS_ID}');` : ''}
          `}</Script>
        </>
      )}

      {/* Meta (Facebook) Pixel */}
      {load && PIXEL_ID && (
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,
          'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '${PIXEL_ID}'); fbq('track', 'PageView');
        `}</Script>
      )}

      {/* Microsoft Clarity — mapas de calor, mapas de scroll y grabaciones de sesión */}
      {load && CLARITY_ID && (
        <Script id="ms-clarity" strategy="afterInteractive">{`
          (function(c,l,a,r,i,t,y){
            c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
            t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
            y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
          })(window, document, "clarity", "script", "${CLARITY_ID}");
        `}</Script>
      )}

      {/* Banner de consentimiento de cookies */}
      {ready && consent === null && (
        <div style={{
          position: 'fixed', left: 16, right: 16, bottom: 16, zIndex: 100,
          maxWidth: 560, margin: '0 auto', background: '#fff', borderRadius: 18,
          boxShadow: '0 24px 60px -18px rgba(9,87,81,.45)', border: '1px solid #e7e6e0',
          padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14,
          fontFamily: 'var(--font-jakarta), system-ui, sans-serif',
        }}>
          <p style={{ margin: 0, fontSize: 13.5, color: '#3a423e', lineHeight: 1.55 }}>
            🍪 Usamos cookies propias y de terceros para analizar el uso de la web y mejorar
            nuestros servicios. Puedes aceptarlas o rechazarlas. Más info en nuestra{' '}
            <a href="/dkv/cookies" style={{ color: '#095751', fontWeight: 700 }}>política de cookies</a>.
          </p>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
            <button onClick={() => choose('rejected')} style={{
              padding: '10px 20px', borderRadius: 999, border: '1.5px solid #cfd6d1',
              background: '#fff', color: '#6A625A', fontSize: 13.5, fontWeight: 700,
              cursor: 'pointer', fontFamily: 'inherit',
            }}>Rechazar</button>
            <button onClick={() => choose('accepted')} style={{
              padding: '10px 22px', borderRadius: 999, border: 'none',
              background: 'linear-gradient(135deg,#095751,#0d6b5f)', color: '#fff',
              fontSize: 13.5, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>Aceptar cookies</button>
          </div>
        </div>
      )}
    </>
  )
}
