import {
  ShieldCheck, Timer, Stethoscope, Umbrella, Smile, Feather, Home, HeartPulse,
  Scale, Wrench, Users, Gift, HardHat, FileText, Plane, Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/* Paleta oficial DKV (compartida con las páginas de detalle) */
export const C = {
  teal: '#095751', tealDeep: '#063f3b', tealSoft: '#0d6b5f',
  lime: '#98A92A', limeDark: '#7c8c1f', red: '#DD3636', redDark: '#c02d2d',
  taupe: '#6A625A', text: '#1b2320', grayBg: '#F7F8F5', cream: '#F3F4E7', border: '#e7e6e0',
}

const IMG = {
  hero: 'https://images.unsplash.com/photo-1609220136736-443140cffec6?auto=format&fit=crop&w=1400&q=80',
  doctor: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=1400&q=80',
  network: 'https://images.unsplash.com/photo-1631217868264-e5b90bb7e133?auto=format&fit=crop&w=1400&q=80',
  dental: 'https://images.unsplash.com/photo-1606811841689-23dfddce3e95?auto=format&fit=crop&w=1400&q=80',
  home: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=1400&q=80',
  life: 'https://images.unsplash.com/photo-1511895426328-dc8714191300?auto=format&fit=crop&w=1400&q=80',
  funeral: 'https://images.unsplash.com/photo-1490750967868-88aa4486c946?auto=format&fit=crop&w=1400&q=80',
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1400&q=80',
  wellness: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=1400&q=80',
  familyKids: 'https://images.unsplash.com/photo-1476703993599-0035a21b17a9?auto=format&fit=crop&w=1400&q=80',
  digital: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1400&q=80',
  business: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=1400&q=80',
  nutrition: 'https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=1400&q=80',
}

export const slugify = (s: string) =>
  s.toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e').replace(/[íìï]/g, 'i')
    .replace(/[óòö]/g, 'o').replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')

export type Ficha = {
  title: string; tagline: string; desc: string; coverage: string[]; idealFor: string;
  icon: LucideIcon; group: string; promo?: string; price?: string; img: string;
}

export const SEGUROS: Ficha[] = [
  // ── Salud (particulares) ──
  { group: 'Seguros de salud', title: 'Seguros sin copago', icon: ShieldCheck, promo: '-35%', price: '39€/mes', img: IMG.doctor,
    tagline: 'Cuota fija cada mes, cero sorpresas',
    desc: 'Toda la asistencia médica sin pagar nada por cada acto. Sabes exactamente lo que pagas cada mes.',
    coverage: ['Medicina general y especialistas sin límite', 'Pruebas diagnósticas: análisis, resonancias, TAC…', 'Hospitalización y cirugía cubiertas', 'Urgencias 24 horas', 'Parto, pediatría y salud de la mujer', 'No pagas nada extra en cada visita'],
    idealFor: 'Quien usa el seguro con frecuencia y quiere una cuota mensual fija sin gastos añadidos.' },
  { group: 'Seguros de salud', title: 'Seguros con copago', icon: Timer, promo: '-35%', price: '24€/mes', img: IMG.network,
    tagline: 'Pagas menos cada mes; solo abonas al usarlo',
    desc: 'Cuota más baja y una pequeña cantidad solo cuando usas los servicios. Ideal si vas poco al médico.',
    coverage: ['Cuota mensual reducida', 'Pequeño copago por acto médico (desde pocos euros)', 'Mismo cuadro médico completo de DKV', 'Especialistas y pruebas diagnósticas', 'Urgencias 24 horas', 'Hospitalización incluida'],
    idealFor: 'Quien va poco al médico y prefiere una cuota mensual más baja.' },
  { group: 'Seguros de salud', title: 'Seguros de cuadro médico', icon: Stethoscope, promo: 'PROMO', price: '29€/mes', img: IMG.digital,
    tagline: '+51.000 profesionales a tu libre elección',
    desc: 'Elige entre más de 51.000 profesionales y 1.000 centros médicos concertados por toda España.',
    coverage: ['Libre elección dentro de la red DKV', 'Especialistas sin volante en muchos casos', 'Clínicas y centros por toda España', 'Segunda opinión médica', 'Videoconsulta con tu médico', 'Sin adelantar dinero'],
    idealFor: 'Quien quiere elegir entre una amplia red de médicos concertados sin complicaciones.' },
  { group: 'Seguros de salud', title: 'Seguros con reembolso', icon: Umbrella, price: '55€/mes', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80',
    tagline: 'Libertad total para elegir a tu médico',
    desc: 'Elige libremente cualquier médico o clínica, dentro o fuera del cuadro, y te reembolsamos los gastos.',
    coverage: ['Cualquier médico o clínica, también privados', 'Reembolso de hasta el 80-90% de los gastos', 'Compatible con el cuadro médico DKV', 'Cobertura nacional e internacional', 'Habitación individual en hospital', 'Perfecto para segundas opiniones'],
    idealFor: 'Quien quiere total libertad para elegir a su médico, aunque esté fuera del cuadro.' },
  { group: 'Seguros de salud', title: 'Seguro DKV Salud', icon: HeartPulse, promo: '-35%', price: '42€/mes', img: IMG.wellness,
    tagline: 'El seguro de salud más completo de DKV',
    desc: 'La cobertura de salud integral de DKV: cuadro médico, hospitalización y toda la salud digital en una sola póliza.',
    coverage: ['Cuadro médico con +51.000 profesionales', 'Especialistas, pruebas y hospitalización', 'Urgencias 24 horas', 'Videoconsulta y chat médico 24h', 'App Quiero cuidarme Más incluida', 'Coach de salud y comadrona digital'],
    idealFor: 'Quien quiere la tranquilidad de una cobertura de salud completa, sin renunciar a nada.' },
  { group: 'Seguros de salud', title: 'DKV Famedic', icon: Users, price: '25,50€/mes', img: IMG.familyKids,
    tagline: 'Toda la familia, hasta 8 miembros, por 25,50€ al mes',
    desc: 'Asistencia médica ambulatoria familiar: hasta 8 miembros de la familia por 25,50€ al mes (mismo precio para todos), sin límite de edad ni declaración de salud previa.',
    coverage: ['Hasta 8 personas por el mismo precio', 'Sin límite de edad', 'Sin declaración de salud previa', 'Consultas ilimitadas en 7 especialidades', 'Ginecología con revisión anual (citología y ecografía)', 'Medicina general, pediatría y enfermería'],
    idealFor: 'Familias que quieren cubrir a todos sus miembros con un seguro sencillo y económico.' },
  { group: 'Seguros de salud', title: 'DKV Visado', icon: Plane, promo: 'VISADO', img: IMG.team,
    tagline: 'Tu mejor opción para tramitar tu visado en España',
    desc: 'El seguro de salud que cumple todos los requisitos para tramitar tu visado o permiso de residencia en España: sin copagos, sin carencias y con certificado válido para tus trámites. Devolución garantizada si tu visado es denegado.',
    coverage: ['Sin copagos y sin periodos de carencia', 'Cobertura médica completa: +51.000 especialistas y 1.000 centros', 'Atención primaria, urgencias y ambulancia 24h', 'Hospitalización y cirugía incluidas', 'Cobertura en el extranjero hasta 180 días y 30.000€', 'Servicio dental incluido', 'Póliza renovable y vitalicia desde el 3er año', 'Certificado válido para tus trámites de visado', 'Devolución garantizada si tu visado es denegado'],
    idealFor: 'Extranjeros que necesitan un seguro de salud que cumpla los requisitos para su visado o permiso de residencia en España.' },
  // ── Otros seguros ──
  { group: 'Otros seguros', title: 'Seguros dentales', icon: Smile, price: '9€/mes', img: IMG.dental,
    tagline: 'La mayor red dental de España',
    desc: 'Cuida tu boca con la mayor red dental de España, con revisiones incluidas y grandes descuentos.',
    coverage: ['Revisiones y limpiezas incluidas', 'Grandes descuentos en tratamientos', 'Ortodoncia, implantes y prótesis', 'Urgencias dentales', 'Sin carencias en lo básico'],
    idealFor: 'Toda la familia que quiere cuidar su salud bucodental sin sustos en la factura.' },
  { group: 'Otros seguros', title: 'Seguros de decesos', icon: Feather, price: '12€/mes', img: IMG.funeral,
    tagline: 'Todo resuelto en los momentos difíciles',
    desc: 'Tranquilidad para ti y los tuyos, con la gestión integral del servicio y todos los trámites incluidos.',
    coverage: ['Gestión integral del servicio', 'Asesoramiento y trámites incluidos', 'Cobertura para toda la familia', 'Asistencia en viaje', 'Tus seres queridos, sin preocupaciones'],
    idealFor: 'Quien quiere dejar todo previsto y no cargar a su familia con gestiones.' },
  { group: 'Otros seguros', title: 'Seguro de repatriación', icon: Globe, img: IMG.business,
    tagline: 'Repatriación garantizada a tu país de origen',
    desc: 'Pensado para extranjeros residentes en España: garantiza el traslado y la repatriación al país de origen, con todos los trámites internacionales resueltos para que tu familia no tenga que preocuparse de nada.',
    coverage: ['Traslado y repatriación al país de origen', 'Gestión integral de los trámites internacionales', 'Cobertura para toda la familia', 'Acompañamiento y asistencia a los familiares', 'Asistencia 24h en todo el mundo', 'Complemento ideal del seguro de decesos'],
    idealFor: 'Extranjeros residentes en España que quieren garantizar la repatriación a su país de origen.' },
  { group: 'Otros seguros', title: 'Seguros de vida', icon: Umbrella, price: '8€/mes', img: IMG.life,
    tagline: 'La tranquilidad de tu familia, asegurada',
    desc: 'Protege económicamente a tu familia pase lo que pase, con coberturas adaptadas a tus necesidades.',
    coverage: ['Capital en caso de fallecimiento', 'Cobertura por invalidez', 'Adaptado a tu hipoteca o necesidades', 'Primas competitivas', 'Posibles ventajas fiscales'],
    idealFor: 'Quien quiere garantizar el bienestar económico de los suyos ante un imprevisto.' },
  { group: 'Otros seguros', title: 'Seguros de hogar', icon: Home, price: '14€/mes', img: IMG.home,
    tagline: 'Tu hogar, siempre protegido',
    desc: 'Tu casa protegida frente a cualquier imprevisto: agua, incendio, robo y mucho más.',
    coverage: ['Daños por agua, incendio y robo', 'Responsabilidad civil', 'Asistencia 24h: fontanero, electricista…', 'Rotura de cristales y electrodomésticos', 'Cobertura de continente y contenido'],
    idealFor: 'Propietarios e inquilinos que quieren su vivienda protegida ante cualquier imprevisto.' },
  // ── Autónomos ──
  { group: 'Autónomos', title: 'Salud para autónomos', icon: HeartPulse, promo: '-35%', price: '34€/mes', img: IMG.doctor,
    tagline: 'La mejor medicina privada, con ventaja fiscal',
    desc: 'Un seguro de salud flexible pensado para autónomos: cuídate sin listas de espera y aprovecha las ventajas fiscales.',
    coverage: ['Cuadro médico con +51.000 profesionales', 'Especialistas y pruebas diagnósticas', 'Hospitalización y urgencias 24h', 'Videoconsulta para no parar tu actividad', 'Deducible en tu declaración (según normativa)', 'Hasta 35% de descuento'],
    idealFor: 'Autónomos que quieren cuidarse rápido, sin depender de la lista de espera pública y con ventaja fiscal.' },
  { group: 'Autónomos', title: 'Seguro de baja laboral', icon: Umbrella, price: '19€/mes', img: IMG.network,
    tagline: 'Un subsidio diario si no puedes trabajar',
    desc: 'Que una baja no te preocupe: si una enfermedad o un accidente te impiden trabajar, DKV te cubre con un subsidio diario para que puedas hacer frente a tus gastos.',
    coverage: ['Subsidio diario si no puedes trabajar', 'Cobertura 24h por accidente y enfermedad', 'Desde el primer día y hasta año y medio', 'Garantía extra por hospitalización', 'Prestación por parto o adopción', 'Ventajas fiscales para autónomos'],
    idealFor: 'Autónomos cuyos ingresos dependen 100% de su actividad y no pueden permitirse parar sin cobrar.' },
  { group: 'Autónomos', title: 'Seguro de accidentes', icon: ShieldCheck, price: '11€/mes', img: IMG.doctor,
    tagline: 'Protección 24 horas, dentro y fuera del trabajo',
    desc: 'Cobertura económica ante accidentes que provoquen invalidez o fallecimiento, las 24 horas del día.',
    coverage: ['Capital por invalidez permanente', 'Capital por fallecimiento accidental', 'Cobertura 24h en todo el mundo', 'Asistencia sanitaria por accidente', 'Indemnización por gastos médicos', 'Primas ajustadas a tu actividad'],
    idealFor: 'Quien quiere una red de seguridad económica para su familia ante cualquier accidente.' },
  { group: 'Autónomos', title: 'Responsabilidad civil', icon: Scale, img: IMG.team,
    tagline: 'Frente a reclamaciones de terceros',
    desc: 'Te protege ante los daños que tu actividad profesional pueda causar a terceros, con defensa jurídica.',
    coverage: ['Daños a terceros por tu actividad', 'Defensa jurídica y fianzas', 'RC de explotación y patronal', 'Cobertura de productos y servicios', 'Adaptado a tu profesión', 'Tranquilidad legal'],
    idealFor: 'Autónomos que tratan con clientes, proveedores o público y quieren cubrir posibles reclamaciones.' },
  { group: 'Autónomos', title: 'Multirriesgo de negocio', icon: Wrench, img: IMG.home,
    tagline: 'Tu local y tu equipo, siempre protegidos',
    desc: 'Protege tu local, mercancía y equipamiento frente a incendios, robos, daños por agua y otros imprevistos.',
    coverage: ['Incendio, robo y daños por agua', 'Rotura de cristales y maquinaria', 'Responsabilidad civil incluida', 'Pérdida de beneficios', 'Asistencia 24h para tu negocio', 'Continente y contenido'],
    idealFor: 'Autónomos con local, taller, tienda u oficina que no pueden permitirse parar por un siniestro.' },
  // ── Empresas ──
  { group: 'Empresas', title: 'Salud para colectivos', icon: Users, promo: 'GRUPO', price: '28€/mes', img: IMG.team,
    tagline: 'Salud privada para tu equipo, desde 3 empleados',
    desc: 'Ofrece a tu plantilla un seguro médico privado con condiciones especiales de grupo.',
    coverage: ['Precio especial por volumen', 'Cuadro médico completo para empleados', 'Altas y bajas flexibles', 'Extensible a familiares', 'Gestión centralizada y sencilla', 'Mejora tu marca empleadora'],
    idealFor: 'Empresas que quieren cuidar a su equipo y diferenciarse como empleador desde solo 3 empleados.' },
  { group: 'Empresas', title: 'Retribución flexible', icon: Gift, img: IMG.business,
    tagline: 'Más salario neto para tu equipo, sin coste extra',
    desc: 'Permite a tus empleados destinar parte de su salario al seguro de salud con ventajas fiscales.',
    coverage: ['Ahorro fiscal para el empleado', 'Sin coste añadido para la empresa', 'Fácil de implantar y gestionar', 'Beneficio muy valorado', 'Extensible a familiares', 'Mejora el paquete retributivo'],
    idealFor: 'Empresas que quieren mejorar la retribución de su equipo aprovechando las ventajas fiscales.' },
  { group: 'Empresas', title: 'Prevención de riesgos laborales', icon: HardHat, img: IMG.team,
    tagline: 'Cumple con la ley y cuida la salud laboral',
    desc: 'Servicios de vigilancia de la salud y prevención para cumplir con la normativa y reducir la siniestralidad.',
    coverage: ['Reconocimientos médicos laborales', 'Vigilancia de la salud', 'Asesoramiento en prevención', 'Cumplimiento normativo (LPRL)', 'Reducción de bajas laborales', 'Informes y seguimiento'],
    idealFor: 'Empresas que deben cumplir la normativa de PRL y quieren un entorno de trabajo más seguro.' },
  { group: 'Empresas', title: 'Seguros de convenio', icon: FileText, img: IMG.team,
    tagline: 'Cumple las coberturas que exige tu convenio',
    desc: 'Cubre las indemnizaciones por accidente que muchos convenios colectivos obligan a garantizar.',
    coverage: ['Capital por accidente laboral', 'Cumplimiento del convenio colectivo', 'Cobertura por invalidez y fallecimiento', 'Gestión sencilla de altas y bajas', 'Certificados para inspección', 'Primas ajustadas a la plantilla'],
    idealFor: 'Empresas obligadas por su convenio a asegurar a los trabajadores frente a accidentes.' },
  { group: 'Empresas', title: 'Responsabilidad civil de empresa', icon: ShieldCheck, img: IMG.business,
    tagline: 'Protege tu empresa frente a reclamaciones',
    desc: 'Cubre los daños que tu actividad empresarial pueda causar a terceros, con defensa jurídica y fianzas.',
    coverage: ['RC de explotación y patronal', 'Daños a terceros y clientes', 'Defensa jurídica y fianzas', 'RC por productos', 'Cobertura adaptada a tu sector', 'Protege el patrimonio de la empresa'],
    idealFor: 'Empresas que quieren blindarse ante posibles reclamaciones de clientes, empleados o terceros.' },
]

export const SEGURO_BY_SLUG: Record<string, Ficha> =
  Object.fromEntries(SEGUROS.map(f => [slugify(f.title), f]))

export type Articulo = {
  category: string; title: string; excerpt: string; date: string; read: string;
  img: string; body: { h?: string; text: string }[];
}

export const ARTICULOS: Articulo[] = [
  { category: 'DKV', img: IMG.network, date: '30 jun 2026', read: '6 min',
    title: 'Por qué DKV es una de las aseguradoras más completas de España',
    excerpt: 'Casi un siglo de experiencia, el respaldo de Munich Re y una de las mayores redes médicas del país.',
    body: [
      { text: 'Elegir aseguradora de salud es una decisión importante, y no todas ofrecen lo mismo. DKV combina experiencia, solidez financiera, una enorme red médica y una apuesta pionera por la salud digital. Estas son las razones por las que es una de las aseguradoras más completas de España.' },
      { h: 'Casi 90 años cuidando de la salud', text: 'Los orígenes de DKV se remontan a 1932, cuando nació en Zaragoza el Igualatorio Médico-Quirúrgico. En 1998 se integró en el grupo alemán Deutsche Krankenversicherung (DKV). Casi un siglo de recorrido cuidando de las familias españolas.' },
      { h: 'El respaldo de Munich Re', text: 'DKV forma parte de Munich Re, uno de los mayores grupos reaseguradores del mundo, a través de su división de salud. Esa solidez financiera es una garantía.' },
      { h: 'Una de las mayores redes médicas', text: 'Con más de 51.000 profesionales y 1.000 centros médicos concertados en toda España, tienes acceso a especialistas, pruebas y hospitales estés donde estés.' },
      { h: 'Líder en salud digital', text: 'A través de su app Quiero cuidarme Más, DKV ofrece videoconsultas, chat médico 24 horas, receta electrónica, carpeta de salud, coach de salud y comadrona digital.' },
      { h: 'Compromiso más allá del seguro', text: 'DKV fue la primera aseguradora española en obtener el certificado de Gestión Ética y Socialmente Responsable, y es una de las empresas con mayor porcentaje de plantilla con discapacidad.' },
    ] },
  { category: 'Confianza', img: IMG.doctor, date: '25 jun 2026', read: '4 min',
    title: 'El respaldo de un gigante: DKV y Munich Re',
    excerpt: 'Detrás de tu póliza de DKV hay uno de los mayores grupos aseguradores del mundo. Te explicamos por qué importa.',
    body: [
      { text: 'Cuando contratas un seguro de salud no solo importan las coberturas: importa quién está detrás para responder cuando lo necesites. Y DKV cuenta con un respaldo de primer nivel.' },
      { h: '¿Quién es Munich Re?', text: 'Munich Re es uno de los mayores grupos reaseguradores del mundo, con más de un siglo de historia. DKV forma parte de su división de salud, lo que la conecta con la fortaleza financiera de un líder global.' },
      { h: '¿Qué significa para ti?', text: 'Que tu aseguradora tiene una enorme solvencia y estabilidad. En un seguro de salud, esa solidez es la garantía de que las coberturas estarán ahí a largo plazo.' },
      { h: 'Solidez que da tranquilidad', text: 'Casi 2 millones de clientes en España confían en DKV. Detrás de cada póliza hay músculo financiero internacional y casi un siglo de experiencia local.' },
    ] },
  { category: 'Coberturas', img: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1400&q=80', date: '18 jun 2026', read: '5 min',
    title: 'Todo lo que incluye un seguro DKV (es más de lo que crees)',
    excerpt: 'Cuadro médico, videoconsulta, chat 24h, receta electrónica, coach de salud… Un repaso a todo lo que llevas contigo.',
    body: [
      { text: 'Un buen seguro de salud es mucho más que ir al médico cuando estás enfermo. Con DKV, tu cobertura incluye herramientas para cuidarte cada día.' },
      { h: 'Una red médica enorme', text: 'Más de 51.000 profesionales y 1.000 centros concertados: medicina general, especialistas, pruebas, hospitalización y urgencias 24 horas por toda España.' },
      { h: 'Tu médico en el móvil', text: 'Con la app Quiero cuidarme Más tienes videoconsultas con especialistas, chat médico 24 horas y receta electrónica sin salir de casa.' },
      { h: 'Carpeta de salud y coach', text: 'Toda tu información médica en una carpeta de salud digital, además de un coach de salud y una comadrona digital.' },
      { h: 'Modalidades para cada bolsillo', text: 'Desde opciones familiares que cubren hasta 8 personas, hasta modalidades con y sin copago. Pagas por lo que necesitas.' },
      { h: 'Prevención y bienestar', text: 'Líneas de orientación médica, nutricional y deportiva para que cuidarte sea un hábito.' },
    ] },
  { category: 'Compromiso', img: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80', date: '10 jun 2026', read: '4 min',
    title: 'Lenguaje claro y compromiso social: la otra cara de DKV',
    excerpt: 'Sin letra pequeña, con responsabilidad social y ambiental. Una aseguradora con valores, no solo con pólizas.',
    body: [
      { text: 'DKV no solo destaca por sus coberturas: también por cómo hace las cosas. Estos son algunos de los compromisos que la diferencian.' },
      { h: 'Adiós a la letra pequeña', text: 'DKV impulsó un programa pionero de "lenguaje claro" en el sector asegurador, en colaboración con organizaciones de consumidores.' },
      { h: 'Ética y responsabilidad', text: 'Fue la primera aseguradora española en obtener el certificado de Gestión Ética y Socialmente Responsable, y se adhirió al Pacto Mundial de Naciones Unidas en 2002.' },
      { h: 'Inclusión real', text: 'DKV es una de las empresas españolas con mayor porcentaje de personas con discapacidad en su plantilla.' },
      { h: 'Compromiso con el planeta', text: 'La sostenibilidad y la salud ambiental están en el centro de su estrategia, con iniciativas medioambientales y solidarias.' },
    ] },
  { category: 'Salud', img: IMG.wellness, date: '28 jun 2026', read: '4 min',
    title: '5 razones para tener un seguro de salud privado',
    excerpt: 'Rapidez, elección de médico y tranquilidad: descubre por qué cada vez más familias dan el paso.',
    body: [
      { text: 'Contar con un seguro de salud privado ya no es un lujo, sino una decisión inteligente para cuidar de ti y de los tuyos.' },
      { h: '1. Adiós a las listas de espera', text: 'Mientras en la sanidad pública una cita con el especialista puede tardar semanas, con DKV la tienes en pocos días.' },
      { h: '2. Eliges a tu médico', text: 'Accede a más de 51.000 profesionales y elige libremente el especialista o centro que prefieras.' },
      { h: '3. Cobertura desde el primer día', text: 'La asistencia básica está disponible de forma inmediata.' },
      { h: '4. Todo en tu móvil', text: 'Pide cita, consulta tu tarjeta digital o habla por videoconsulta desde la app.' },
      { h: '5. Tranquilidad para toda la familia', text: 'Un solo seguro puede proteger a los tuyos con condiciones especiales.' },
    ] },
  { category: 'Comparativa', img: IMG.nutrition, date: '15 jun 2026', read: '5 min',
    title: 'Seguro con o sin copago: ¿cuál te conviene?',
    excerpt: 'Te explicamos las diferencias para que elijas la modalidad que mejor encaja con tu forma de cuidarte.',
    body: [
      { text: 'Una de las primeras decisiones al contratar un seguro de salud es elegir entre la modalidad con copago o sin copago. Depende de cómo uses el seguro.' },
      { h: 'Seguro sin copago', text: 'Pagas una cuota mensual algo más alta pero no abonas nada por cada visita, prueba o consulta.' },
      { h: 'Seguro con copago', text: 'La cuota mensual es más baja y solo pagas una pequeña cantidad cuando utilizas un servicio.' },
      { h: '¿Cómo decidir?', text: 'Piensa en cuántas veces al año vas al médico. Un asesor puede calcularlo contigo gratis.' },
    ] },
  { category: 'Consejos', img: IMG.hero, date: '2 jun 2026', read: '3 min',
    title: 'Cómo tu seguro de salud te ahorra tiempo y dinero',
    excerpt: 'Menos esperas, menos gastos imprevistos y más prevención. El seguro que se paga solo.',
    body: [
      { text: 'Mucha gente ve el seguro de salud como un gasto, pero bien usado es una inversión que te devuelve tiempo, dinero y tranquilidad.' },
      { h: 'El valor de tu tiempo', text: 'Evitar meses de espera para una prueba o una operación tiene un valor incalculable.' },
      { h: 'Gastos bajo control', text: 'Una sola prueba privada puede costar cientos de euros. Con un seguro, tu gasto es predecible.' },
      { h: 'La prevención es la clave', text: 'Revisiones periódicas y detección temprana evitan problemas mayores.' },
    ] },
  { category: 'Autónomos', img: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&w=1400&q=80', date: '20 may 2026', read: '4 min',
    title: 'Salud para autónomos: la ventaja fiscal que quizá no conocías',
    excerpt: 'Como trabajador por cuenta propia, tu seguro de salud puede desgravar. Te contamos cómo.',
    body: [
      { text: 'Si eres autónomo, tu seguro de salud no solo te cuida: también puede ayudarte a pagar menos impuestos.' },
      { h: 'Desgrava en tu IRPF', text: 'La normativa permite deducir las primas del seguro de salud propio, del cónyuge y de los hijos, dentro de los límites establecidos.' },
      { h: 'Cuídate sin parar tu actividad', text: 'Para un autónomo, cada día de baja cuenta. Con acceso rápido a especialistas resuelves antes.' },
      { h: 'Un seguro a tu medida', text: 'Elige la modalidad que encaje con tu ritmo de vida y tu bolsillo. Te ayudamos a calcularlo sin compromiso.' },
    ] },
]

export const ARTICULO_BY_SLUG: Record<string, Articulo> =
  Object.fromEntries(ARTICULOS.map(a => [slugify(a.title), a]))

/* Preguntas frecuentes — compartidas por la landing y el schema FAQPage (SEO) */
export const FAQS: { q: string; a: string }[] = [
  { q: '¿Desde cuándo tengo cobertura?', a: 'La cobertura básica es inmediata desde el primer día. Algunas prestaciones concretas tienen periodos de carencia que tu asesor te detallará sin compromiso.' },
  { q: '¿Qué diferencia hay entre seguro con y sin copago?', a: 'En el seguro sin copago pagas solo la cuota mensual, sin abonar nada por cada acto médico. En el de copago la cuota es más baja pero pagas una pequeña cantidad cada vez que usas un servicio.' },
  { q: '¿Puedo elegir a mi propio médico?', a: 'Sí. Con las modalidades de cuadro médico eliges entre más de 51.000 profesionales concertados, y con la de reembolso puedes acudir a cualquier médico o clínica y te devolvemos los gastos.' },
  { q: '¿El seguro tiene permanencia?', a: 'No hay permanencia mínima. Puedes dar de baja tu póliza cuando quieras, respetando el preaviso indicado en las condiciones de tu contrato.' },
  { q: '¿Cómo consigo el descuento de hasta el 35%?', a: 'Calcula tu seguro con tus datos y un asesor te aplicará las promociones vigentes según tu perfil y modalidad. El cálculo es gratuito y sin ningún compromiso.' },
]
