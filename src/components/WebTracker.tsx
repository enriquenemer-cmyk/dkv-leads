'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* Analítica propia y ligera de la web pública.
   Registra visitas, clics (mapa de calor), scroll, embudo del formulario,
   fuente/campaña de la visita, ciudad aproximada y comportamiento.
   - Solo se activa si el visitante ACEPTÓ las cookies (mismo consentimiento que GA/Meta/Clarity).
   - Nunca se ejecuta dentro del panel (/panel).
   - Los eventos se agrupan y se envían en lote para no penalizar el rendimiento. */

const CONSENT_KEY = 'dkv-cookie-consent'
const SESSION_KEY = 'dkv-analytics-sid'
const RETURNING_KEY = 'dkv-analytics-known'
const LANDING_KEY = 'dkv-analytics-landing'
const GEO_KEY = 'dkv-analytics-geo'

type Evento = {
  session_id: string
  tipo: 'view' | 'click' | 'scroll' | 'form_start' | 'form_submit'
  path: string
  xr?: number | null
  yr?: number | null
  scroll_pct?: number | null
  vw?: number | null
  elemento?: string | null
  // Contexto de la visita (se rellena sobre todo en el evento 'view')
  referrer?: string | null
  utm_source?: string | null
  utm_medium?: string | null
  utm_campaign?: string | null
  pais?: string | null
  ciudad?: string | null
  visitante?: string | null   // 'nuevo' | 'recurrente'
  dur?: number | null         // duración de la sesión en segundos
}

function getSessionId(): string {
  try {
    let sid = sessionStorage.getItem(SESSION_KEY)
    if (!sid) {
      sid = Math.random().toString(36).slice(2) + Date.now().toString(36)
      sessionStorage.setItem(SESSION_KEY, sid)
    }
    return sid
  } catch {
    return 'anon'
  }
}

/* Clasifica el origen del tráfico a partir del referrer y las UTM. */
function fuente() {
  let referrer: string | null = null
  try {
    const r = document.referrer
    if (r && !r.includes(location.host)) referrer = new URL(r).hostname
  } catch { /* noop */ }
  const p = new URLSearchParams(location.search)
  return {
    referrer,
    utm_source: p.get('utm_source'),
    utm_medium: p.get('utm_medium'),
    utm_campaign: p.get('utm_campaign'),
  }
}

/* Ciudad/país aproximados (cacheados por sesión para no repetir la llamada). */
async function geo(): Promise<{ pais: string | null; ciudad: string | null }> {
  try {
    const cache = sessionStorage.getItem(GEO_KEY)
    if (cache) return JSON.parse(cache)
    const r = await fetch('/api/geo').then(x => x.json())
    const g = { pais: r.pais ?? null, ciudad: r.ciudad ?? null }
    sessionStorage.setItem(GEO_KEY, JSON.stringify(g))
    return g
  } catch {
    return { pais: null, ciudad: null }
  }
}

/* Devuelve una etiqueta legible de lo que se ha pulsado. */
function describirElemento(el: HTMLElement | null): string {
  if (!el) return 'desconocido'
  const clickable = (el.closest('a,button,[role="button"],input,select,label') as HTMLElement) || el
  const texto = (clickable.innerText || clickable.getAttribute('aria-label') || (clickable as HTMLInputElement).value || '').trim()
  if (texto) return texto.replace(/\s+/g, ' ').slice(0, 60)
  const tag = clickable.tagName.toLowerCase()
  return tag === 'a' ? 'enlace' : tag === 'button' ? 'botón' : tag
}

export default function WebTracker() {
  const pathname = usePathname()

  useEffect(() => {
    if (pathname.startsWith('/panel')) return
    try {
      if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return
    } catch { return }

    const sid = getSessionId()
    let cola: Evento[] = []
    let scrollMax = 0
    let formIniciado = false
    let flushTimer: ReturnType<typeof setTimeout> | null = null
    const inicio = Date.now()

    const enviar = () => {
      if (!cola.length) return
      const lote = cola
      cola = []
      supabase.from('web_eventos').insert(lote).then(() => {}, () => {})
    }
    const programarEnvio = () => {
      if (flushTimer) return
      flushTimer = setTimeout(() => { flushTimer = null; enviar() }, 4000)
    }
    const encolar = (e: Evento) => { cola.push(e); programarEnvio() }

    // ¿Nuevo o recurrente?
    let visitante = 'nuevo'
    try {
      if (localStorage.getItem(RETURNING_KEY)) visitante = 'recurrente'
      else localStorage.setItem(RETURNING_KEY, '1')
    } catch { /* noop */ }

    // Recuerda la primera página de la sesión (para atribuir el lead)
    try { if (!sessionStorage.getItem(LANDING_KEY)) sessionStorage.setItem(LANDING_KEY, pathname) } catch { /* noop */ }

    // 1) Visita — con fuente, campaña, ciudad y tipo de visitante
    const f = fuente()
    geo().then(g => {
      encolar({
        session_id: sid, tipo: 'view', path: pathname, vw: window.innerWidth,
        referrer: f.referrer, utm_source: f.utm_source, utm_medium: f.utm_medium, utm_campaign: f.utm_campaign,
        pais: g.pais, ciudad: g.ciudad, visitante,
      })
    })

    // 1b) ¿Llegó a "gracias"? => lead enviado (cierre del embudo)
    if (pathname.startsWith('/gracias')) {
      let landing = pathname
      try { landing = sessionStorage.getItem(LANDING_KEY) || pathname } catch { /* noop */ }
      encolar({ session_id: sid, tipo: 'form_submit', path: pathname, elemento: landing, vw: window.innerWidth })
    }

    // 2) Clics — posición relativa para el mapa de calor
    const onClick = (ev: MouseEvent) => {
      const docH = document.documentElement.scrollHeight || 1
      const xr = ev.clientX / (window.innerWidth || 1)
      const yr = (window.scrollY + ev.clientY) / docH
      encolar({
        session_id: sid, tipo: 'click', path: pathname,
        xr: Math.min(1, Math.max(0, xr)), yr: Math.min(1, Math.max(0, yr)),
        vw: window.innerWidth, elemento: describirElemento(ev.target as HTMLElement),
      })
    }

    // 2b) Embudo — primer foco en un campo del formulario = "empezó el formulario"
    const onFocus = (ev: FocusEvent) => {
      if (formIniciado) return
      const t = ev.target as HTMLElement
      if (t && /^(input|select|textarea)$/i.test(t.tagName)) {
        formIniciado = true
        encolar({ session_id: sid, tipo: 'form_start', path: pathname, vw: window.innerWidth })
      }
    }

    // 3) Scroll — % máximo alcanzado
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const pct = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 100
      if (pct > scrollMax) scrollMax = Math.min(100, pct)
    }
    const guardarScroll = () => {
      if (scrollMax > 0) {
        cola.push({
          session_id: sid, tipo: 'scroll', path: pathname, scroll_pct: scrollMax,
          vw: window.innerWidth, dur: Math.round((Date.now() - inicio) / 1000),
        })
        scrollMax = 0
      }
    }
    const onHide = () => { guardarScroll(); enviar() }

    document.addEventListener('click', onClick, { capture: true })
    document.addEventListener('focusin', onFocus, { capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') onHide() })

    return () => {
      guardarScroll()
      enviar()
      if (flushTimer) clearTimeout(flushTimer)
      document.removeEventListener('click', onClick, { capture: true })
      document.removeEventListener('focusin', onFocus, { capture: true })
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onHide)
    }
  }, [pathname])

  return null
}
