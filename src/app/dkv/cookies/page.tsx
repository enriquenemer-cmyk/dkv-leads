import type { Metadata } from 'next'
import LegalShell, { H2, P, UL } from '@/components/LegalShell'
import { TITULAR } from '../legal-data'

export const metadata: Metadata = {
  title: 'Política de Cookies · DKV Seguros',
  description: 'Qué cookies usamos, para qué y cómo puedes gestionarlas.',
  robots: { index: true, follow: true },
}

export default function CookiesPage() {
  return (
    <LegalShell
      title="Política de Cookies"
      intro="Usamos cookies para que la web funcione y, con tu permiso, para entender cómo se usa y mejorarla. Puedes aceptarlas o rechazarlas cuando quieras."
    >
      <H2>1. ¿Qué son las cookies?</H2>
      <P>Son pequeños archivos que se guardan en tu dispositivo al visitar una web. Sirven para recordar tus preferencias y obtener información sobre la navegación.</P>

      <H2>2. ¿Qué cookies utilizamos?</H2>
      <UL>
        <li><b>Técnicas (necesarias):</b> imprescindibles para el funcionamiento del sitio y para recordar tu decisión sobre las cookies. No requieren consentimiento.</li>
        <li><b>Analíticas (Google Analytics):</b> nos ayudan a entender de forma anónima cómo se usa la web para mejorarla. Solo se activan si las aceptas.</li>
        <li><b>Publicitarias / de medición (Meta Pixel):</b> permiten medir la eficacia de nuestras campañas. Solo se activan si las aceptas.</li>
      </UL>

      <H2>3. Consentimiento y gestión</H2>
      <P>
        Al entrar en la web te mostramos un aviso para <b>aceptar o rechazar</b> las cookies no necesarias. Si las rechazas,
        no cargamos las cookies analíticas ni publicitarias. Puedes cambiar tu decisión en cualquier momento borrando las
        cookies de tu navegador, lo que volverá a mostrarte el aviso.
      </P>
      <P>También puedes configurar o bloquear las cookies desde los ajustes de tu navegador (Chrome, Safari, Firefox, Edge…).</P>

      <H2>4. Cookies de terceros</H2>
      <P>Google (Analytics) y Meta (Pixel) tratan datos según sus propias políticas de privacidad. Te recomendamos consultarlas para conocer cómo gestionan la información.</P>

      <H2>5. Contacto</H2>
      <P>Si tienes dudas sobre esta política, escríbenos a <a href={`mailto:${TITULAR.email}`} style={{ color: '#095751', fontWeight: 600 }}>{TITULAR.email}</a>.</P>
    </LegalShell>
  )
}
