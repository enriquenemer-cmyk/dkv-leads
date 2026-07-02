import type { Metadata } from 'next'
import LegalShell, { H2, P, UL } from '@/components/LegalShell'
import { TITULAR, shown } from '../legal-data'

export const metadata: Metadata = {
  title: 'Política de Privacidad · DKV Seguros',
  description: 'Cómo tratamos y protegemos tus datos personales conforme al RGPD y la LOPDGDD.',
  robots: { index: true, follow: true },
}

export default function PrivacidadPage() {
  return (
    <LegalShell
      title="Política de Privacidad"
      intro="Protegemos tus datos personales y solo los usamos para poder asesorarte sobre tu seguro de salud. Aquí te explicamos qué recogemos, para qué y cuáles son tus derechos."
    >
      <H2>1. Responsable del tratamiento</H2>
      <P>
        <b>{shown(TITULAR.nombre)}</b> (NIF {shown(TITULAR.nif)}), con domicilio en {shown(TITULAR.domicilio)},
        titular del sitio web <b>{TITULAR.dominio}</b> y dedicado a la {TITULAR.actividad}.
        Correo de contacto: <a href={`mailto:${TITULAR.email}`} style={{ color: '#095751', fontWeight: 600 }}>{TITULAR.email}</a>.
      </P>

      <H2>2. ¿Qué datos recogemos?</H2>
      <P>Cuando rellenas nuestro formulario de contacto o de cálculo de seguro, tratamos los datos que nos facilitas voluntariamente:</P>
      <UL>
        <li>Nombre y apellidos.</li>
        <li>Teléfono y/o correo electrónico.</li>
        <li>Código postal y datos aproximados del seguro que te interesa (p. ej. tipo de seguro, número de asegurados).</li>
      </UL>
      <P>No recogemos datos de categorías especiales (salud, etc.) a través del formulario. Te pedimos que no incluyas ese tipo de información en los campos libres.</P>

      <H2>3. ¿Para qué usamos tus datos?</H2>
      <UL>
        <li><b>Atender tu solicitud</b> y que un asesor te contacte para informarte sobre seguros de salud DKV.</li>
        <li><b>Enviarte información</b> sobre los productos que has solicitado.</li>
        <li>Con tu consentimiento, <b>analítica</b> del uso de la web para mejorar el servicio.</li>
      </UL>

      <H2>4. Legitimación</H2>
      <P>
        La base legal es tu <b>consentimiento</b> (art. 6.1.a RGPD), que otorgas al marcar la casilla y enviar el formulario,
        y la aplicación de <b>medidas precontractuales</b> a petición tuya (art. 6.1.b RGPD).
      </P>

      <H2>5. ¿Cuánto tiempo conservamos tus datos?</H2>
      <P>
        Conservamos tus datos mientras gestionamos tu solicitud y, después, durante los plazos legalmente exigibles.
        Cuando dejen de ser necesarios, se suprimen de forma segura. Puedes pedir su supresión en cualquier momento.
      </P>

      <H2>6. ¿Con quién compartimos tus datos?</H2>
      <P>
        Tus datos se tratan para gestionar tu solicitud de asesoramiento y pueden comunicarse a la entidad aseguradora
        (DKV Seguros) o a los mediadores colaboradores necesarios para ofrecerte el presupuesto. Utilizamos proveedores
        tecnológicos que actúan como encargados del tratamiento (alojamiento web y base de datos), con las debidas
        garantías. No cedemos tus datos a terceros con fines comerciales ajenos.
      </P>

      <H2>7. Tus derechos</H2>
      <P>Puedes ejercer tus derechos de <b>acceso, rectificación, supresión, oposición, limitación y portabilidad</b> escribiendo a <a href={`mailto:${TITULAR.email}`} style={{ color: '#095751', fontWeight: 600 }}>{TITULAR.email}</a>, indicando el derecho que deseas ejercer. También puedes reclamar ante la <b>Agencia Española de Protección de Datos</b> (<a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer" style={{ color: '#095751', fontWeight: 600 }}>www.aepd.es</a>) si consideras que no hemos atendido tu solicitud.</P>

      <H2>8. Seguridad</H2>
      <P>Aplicamos medidas técnicas y organizativas apropiadas para proteger tus datos frente a accesos no autorizados, pérdida o alteración.</P>
    </LegalShell>
  )
}
