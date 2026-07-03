'use client'
import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

/* Analítica propia y ligera de la web pública.
   Registra visitas, clics (posición para el mapa de calor) y profundidad de scroll.
   - Solo se activa si el visitante ACEPTÓ las cookies (mismo consentimiento que GA/Meta/Clarity).
   - Nunca se ejecuta dentro del panel (/panel).
   - Los eventos se agrupan y se envían en lote para no penalizar el rendimiento. */

const CONSENT_KEY = 'dkv-cookie-consent'
const SESSION_KEY = 'dkv-analytics-sid'

type Evento = {
  session_id: string
  tipo: 'view' | 'click' | 'scroll'
  path: string
  xr?: number | null
  yr?: number | null
  scroll_pct?: number | null
  vw?: number | null
  elemento?: string | null
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

/* Devuelve una etiqueta legible de lo que se ha pulsado (texto del botón/enlace,
   o el tipo de elemento), para poder rankear qué se clica más y qué menos. */
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
    // Nunca medir el panel interno ni sin consentimiento.
    if (pathname.startsWith('/panel')) return
    try {
      if (localStorage.getItem(CONSENT_KEY) !== 'accepted') return
    } catch { return }

    const sid = getSessionId()
    let cola: Evento[] = []
    let scrollMax = 0
    let flushTimer: ReturnType<typeof setTimeout> | null = null

    const enviar = () => {
      if (!cola.length) return
      const lote = cola
      cola = []
      // Inserción "fire and forget": si falla, no molestamos al visitante.
      supabase.from('web_eventos').insert(lote).then(() => {}, () => {})
    }

    const programarEnvio = () => {
      if (flushTimer) return
      flushTimer = setTimeout(() => { flushTimer = null; enviar() }, 4000)
    }

    const encolar = (e: Evento) => { cola.push(e); programarEnvio() }

    // 1) Visita a la página
    encolar({ session_id: sid, tipo: 'view', path: pathname, vw: window.innerWidth })

    // 2) Clics — guardamos posición relativa (0..1) para el mapa de calor
    const onClick = (ev: MouseEvent) => {
      const docH = document.documentElement.scrollHeight || 1
      const xr = ev.clientX / (window.innerWidth || 1)
      const yr = (window.scrollY + ev.clientY) / docH
      encolar({
        session_id: sid, tipo: 'click', path: pathname,
        xr: Math.min(1, Math.max(0, xr)),
        yr: Math.min(1, Math.max(0, yr)),
        vw: window.innerWidth,
        elemento: describirElemento(ev.target as HTMLElement),
      })
    }

    // 3) Scroll — solo guardamos el % máximo alcanzado (una vez por página)
    const onScroll = () => {
      const docH = document.documentElement.scrollHeight - window.innerHeight
      const pct = docH > 0 ? Math.round((window.scrollY / docH) * 100) : 100
      if (pct > scrollMax) scrollMax = Math.min(100, pct)
    }

    const guardarScroll = () => {
      if (scrollMax > 0) {
        cola.push({ session_id: sid, tipo: 'scroll', path: pathname, scroll_pct: scrollMax, vw: window.innerWidth })
        scrollMax = 0
      }
    }

    // Al abandonar/ocultar la página: guardamos el scroll y forzamos el envío.
    const onHide = () => { guardarScroll(); enviar() }

    document.addEventListener('click', onClick, { capture: true })
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pagehide', onHide)
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') onHide() })

    return () => {
      guardarScroll()
      enviar()
      if (flushTimer) clearTimeout(flushTimer)
      document.removeEventListener('click', onClick, { capture: true })
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pagehide', onHide)
    }
  }, [pathname])

  return null
}
