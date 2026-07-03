'use client'
import { useEffect } from 'react'

/* Traductor de Google incrustado (traduce la página EN el sitio, sin proxy),
   para que los botones, el formulario y el resto de interacciones sigan
   funcionando al cambiar de idioma. Idiomas: es, gl, ca, en, de. */
export default function GoogleTranslate() {
  useEffect(() => {
    // Fix conocido: Google Translate muta el DOM y React puede fallar al reconciliar
    // (removeChild/insertBefore). Estos parches evitan que la web "casque" tras traducir.
    const proto = Node.prototype as unknown as {
      removeChild: <T extends Node>(child: T) => T
      insertBefore: <T extends Node>(newNode: T, referenceNode: Node | null) => T
    }
    const origRemove = proto.removeChild
    proto.removeChild = function <T extends Node>(this: Node, child: T): T {
      if (child.parentNode !== this) return child
      return origRemove.call(this, child) as T
    }
    const origInsert = proto.insertBefore
    proto.insertBefore = function <T extends Node>(this: Node, newNode: T, referenceNode: Node | null): T {
      if (referenceNode && referenceNode.parentNode !== this) return newNode
      return origInsert.call(this, newNode, referenceNode) as T
    }

    const w = window as unknown as {
      googleTranslateElementInit?: () => void
      google?: { translate?: { TranslateElement?: new (o: object, id: string) => void } }
      changeLanguage?: (l: string) => void
    }

    w.googleTranslateElementInit = () => {
      const TE = w.google?.translate?.TranslateElement
      if (TE) new TE({ pageLanguage: 'es', includedLanguages: 'es,gl,ca,en,de', autoDisplay: false }, 'google_translate_element')
    }

    if (!document.getElementById('google-translate-script')) {
      const s = document.createElement('script')
      s.id = 'google-translate-script'
      s.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
      document.body.appendChild(s)
    }

    // Función global que usan los botones de idioma del top bar
    w.changeLanguage = (lang: string) => {
      const val = lang === 'es' ? '' : `/es/${lang}`
      document.cookie = `googtrans=${val};path=/`
      try { document.cookie = `googtrans=${val};path=/;domain=.${location.hostname}` } catch { /* noop */ }
      const trySet = (t = 0) => {
        const sel = document.querySelector('.goog-te-combo') as HTMLSelectElement | null
        if (sel) { sel.value = lang; sel.dispatchEvent(new Event('change')) }
        else if (t < 30) setTimeout(() => trySet(t + 1), 180)
      }
      trySet()
    }
  }, [])

  return (
    <>
      {/* Oculta la barra superior y los tooltips de Google, sin romper el traductor */}
      <style>{`
        .goog-te-banner-frame, iframe.goog-te-banner-frame, .goog-te-banner-frame.skiptranslate,
        .goog-te-gadget-icon, #goog-gt-tt, .goog-tooltip, .goog-tooltip:hover,
        .VIpgJd-ZVi9od-aZ2wEe-wOHMyf, .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; visibility: hidden !important; height: 0 !important; }
        body { top: 0 !important; position: static !important; }
        .goog-te-gadget { height: 0; overflow: hidden; font-size: 0 !important; }
        .goog-text-highlight { background: none !important; box-shadow: none !important; }
        #google_translate_element { position: absolute !important; left: -9999px !important; top: 0 !important; height: 0 !important; overflow: hidden; }
      `}</style>
      <div id="google_translate_element" aria-hidden="true" />
    </>
  )
}
