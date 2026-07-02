import type { Metadata } from 'next'
import LegalShell, { H2, P, UL } from '@/components/LegalShell'
import { TITULAR, shown } from '../legal-data'

export const metadata: Metadata = {
  title: 'Aviso Legal · DKV Seguros',
  description: 'Información legal del titular del sitio web conforme a la LSSI-CE.',
  robots: { index: true, follow: true },
}

export default function AvisoLegalPage() {
  return (
    <LegalShell
      title="Aviso Legal"
      intro="Información general sobre el titular de este sitio web y las condiciones de uso, conforme a la Ley 34/2002 (LSSI-CE)."
    >
      <H2>1. Titular del sitio web</H2>
      <UL>
        <li><b>Titular:</b> {shown(TITULAR.nombre)}</li>
        <li><b>NIF:</b> {shown(TITULAR.nif)}</li>
        <li><b>Domicilio:</b> {shown(TITULAR.domicilio)}</li>
        <li><b>Correo electrónico:</b> <a href={`mailto:${TITULAR.email}`} style={{ color: '#095751', fontWeight: 600 }}>{TITULAR.email}</a></li>
        <li><b>Teléfono:</b> {TITULAR.telefono}</li>
        <li><b>Sitio web:</b> {TITULAR.dominio}</li>
      </UL>

      <H2>2. Objeto y actividad</H2>
      <P>
        Este sitio tiene por finalidad la {TITULAR.actividad}, poniendo en contacto a las personas interesadas con
        un asesor para informarles sobre seguros de salud DKV. La contratación efectiva de cualquier póliza se realiza
        directamente con la entidad aseguradora conforme a sus propias condiciones.
      </P>

      <H2>3. Marcas y propiedad intelectual</H2>
      <P>
        «DKV» y demás marcas, logotipos y nombres comerciales que aparecen son propiedad de sus respectivos titulares
        (DKV Seguros y Reaseguros, S.A.E.) y se utilizan a título informativo en el marco de la actividad de mediación.
        Los textos y el diseño propios de este sitio están protegidos por los derechos de propiedad intelectual de su titular.
      </P>

      <H2>4. Condiciones de uso</H2>
      <UL>
        <li>El usuario se compromete a hacer un uso lícito de la web y a facilitar información veraz en los formularios.</li>
        <li>La información publicada tiene carácter orientativo y no constituye una oferta contractual vinculante.</li>
        <li>El titular puede modificar o actualizar en cualquier momento el contenido del sitio.</li>
      </UL>

      <H2>5. Responsabilidad</H2>
      <P>
        El titular no se responsabiliza de los daños derivados de un uso indebido del sitio ni de posibles interrupciones
        del servicio ajenas a su control. Los enlaces a sitios de terceros se ofrecen a título informativo, sin que el
        titular asuma responsabilidad sobre sus contenidos.
      </P>

      <H2>6. Legislación aplicable</H2>
      <P>Estas condiciones se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales que legalmente correspondan.</P>
    </LegalShell>
  )
}
