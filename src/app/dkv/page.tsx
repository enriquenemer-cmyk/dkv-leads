'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import JsonLd from '@/components/JsonLd'
import { trackContact, trackFormStart } from '@/components/Analytics'
import { slugify, FAQS } from './fichas'

const FAQ_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(f => ({
    '@type': 'Question',
    name: f.q,
    acceptedAnswer: { '@type': 'Answer', text: f.a },
  })),
}
import {
  Phone, User, ChevronDown, Menu, X, Search, Clock, Monitor, Award, Stethoscope,
  Check, ArrowRight, Star, Smartphone, CalendarDays, PhoneCall,
  Share2, AtSign, Globe, MessageCircle, ShieldCheck, Heart, Plus, Loader2, Sparkles, Plane, MapPin,
  Activity, TrendingUp, ThumbsUp, Timer, HeartPulse,
  Smile, Home, Feather, Quote, Minus, Umbrella,
  Users, Gift, HardHat, FileText, Wrench, Scale,
} from 'lucide-react'

/* ── Paleta oficial DKV ─────────────────────────────
   teal #095751 · lima #98A92A · rojo #DD3636
   taupe #6A625A · texto #212529 · crema #F3F4E7        */
const C = {
  teal: '#095751',
  tealDeep: '#063f3b',
  tealSoft: '#0d6b5f',
  lime: '#98A92A',
  limeDark: '#7c8c1f',
  red: '#DD3636',
  redDark: '#c02d2d',
  taupe: '#6A625A',
  text: '#1b2320',
  ink: '#0f1512',
  grayBg: '#F7F8F5',
  cream: '#F3F4E7',
  border: '#e7e6e0',
}

const IMG = {
  hero: '/images/hero.jpg',
  doctor: '/images/doctor.jpg',
  network: '/images/network.jpg',
  dental: '/images/dental.jpg',
  home: '/images/home.jpg',
  life: '/images/life.jpg',
  funeral: '/images/funeral.jpg',
  team: '/images/team.jpg',
  wellness: '/images/wellness.jpg',
  familyKids: '/images/family-kids.jpg',
  digital: '/images/digital.jpg',
  business: '/images/business.jpg',
  nutrition: '/images/nutrition.jpg',
}

const NAV = [
  { label: 'Particulares', drop: true },
  { label: 'Autónomos', drop: true },
  { label: 'Empresas', drop: true },
  { label: 'Cuadro médico', drop: false },
  { label: 'Calcula tu seguro', drop: false },
]

const BENEFITS = [
  { icon: Award, title: 'Amplia experiencia', desc: 'Más de 2 millones de clientes confían en nosotros. 50 años cuidando tu salud.' },
  { icon: Stethoscope, title: 'Médicos y centros', desc: '+51.000 médicos y profesionales y más de 1.000 centros médicos en toda España.' },
  { icon: Clock, title: 'Atención 24h', desc: 'Urgencias y orientación médica telefónica disponibles las 24 horas del día.' },
  { icon: Monitor, title: 'Gestiones online', desc: 'Autorizaciones, cita previa y tarjeta digital desde la app Activa DKV.' },
]

const SPECIALTIES = ['Cardiología', 'Pediatría', 'Dermatología', 'Traumatología', 'Ginecología', 'Oftalmología', 'Neurología', 'Fisioterapia', 'Oncología', 'Endocrinología', 'Urología', 'Psicología', 'Alergología', 'Digestivo']

const PRODUCTS = [
  {
    title: 'Seguros sin copago', promo: '-35%', featured: true, icon: ShieldCheck,
    desc: 'Toda la asistencia médica sin pagar nada por cada acto. Sabes exactamente lo que pagas cada mes.',
    tagline: 'Cuota fija cada mes, cero sorpresas',
    coverage: ['Medicina general y especialistas sin límite', 'Pruebas diagnósticas: análisis, resonancias, TAC…', 'Hospitalización y cirugía cubiertas', 'Urgencias 24 horas', 'Parto, pediatría y salud de la mujer', 'No pagas nada extra en cada visita'],
    idealFor: 'Quien usa el seguro con frecuencia y quiere una cuota mensual fija sin gastos añadidos.',
  },
  {
    title: 'Seguros con copago', promo: '-35%', icon: Timer,
    desc: 'Cuota más baja y una pequeña cantidad solo cuando usas los servicios. Ideal si vas poco al médico.',
    tagline: 'Pagas menos cada mes; solo abonas al usarlo',
    coverage: ['Cuota mensual reducida', 'Pequeño copago por acto médico (desde pocos euros)', 'Mismo cuadro médico completo de DKV', 'Especialistas y pruebas diagnósticas', 'Urgencias 24 horas', 'Hospitalización incluida'],
    idealFor: 'Quien va poco al médico y prefiere una cuota mensual más baja.',
  },
  {
    title: 'Seguros de cuadro médico', promo: 'PROMO', icon: Stethoscope,
    desc: 'Elige entre más de 51.000 profesionales y 1.000 centros médicos concertados por toda España.',
    tagline: '+51.000 profesionales a tu libre elección',
    coverage: ['Libre elección dentro de la red DKV', 'Especialistas sin volante en muchos casos', 'Clínicas y centros por toda España', 'Segunda opinión médica', 'Videoconsulta con tu médico', 'Sin adelantar dinero'],
    idealFor: 'Quien quiere elegir entre una amplia red de médicos concertados sin complicaciones.',
  },
  {
    title: 'Seguros con reembolso', promo: '', icon: Umbrella,
    desc: 'Elige libremente cualquier médico o clínica, dentro o fuera del cuadro, y te reembolsamos los gastos.',
    tagline: 'Libertad total para elegir a tu médico',
    coverage: ['Cualquier médico o clínica, también privados', 'Reembolso de hasta el 80-90% de los gastos', 'Compatible con el cuadro médico DKV', 'Cobertura nacional e internacional', 'Habitación individual en hospital', 'Perfecto para segundas opiniones'],
    idealFor: 'Quien quiere total libertad para elegir a su médico, aunque esté fuera del cuadro.',
  },
  {
    title: 'Seguro DKV Salud', promo: '-35%', icon: HeartPulse,
    desc: 'La cobertura de salud integral de DKV: cuadro médico, hospitalización y toda la salud digital en una sola póliza.',
    tagline: 'El seguro de salud más completo de DKV',
    coverage: ['Cuadro médico con +51.000 profesionales', 'Especialistas, pruebas y hospitalización', 'Urgencias 24 horas', 'Videoconsulta y chat médico 24h', 'App Quiero cuidarme Más incluida', 'Coach de salud y comadrona digital'],
    idealFor: 'Quien quiere la tranquilidad de una cobertura de salud completa, sin renunciar a nada.',
  },
  {
    title: 'DKV Famedic', icon: Users,
    desc: 'Asistencia médica ambulatoria familiar: hasta 8 personas por el mismo precio, sin límite de edad ni declaración de salud.',
    tagline: 'Salud para toda la familia, hasta 8 personas',
    coverage: ['Hasta 8 personas por el mismo precio', 'Sin límite de edad', 'Sin declaración de salud previa', 'Consultas ilimitadas en 7 especialidades', 'Ginecología con revisión anual', 'Medicina general, pediatría y enfermería'],
    idealFor: 'Familias que quieren cubrir a todos sus miembros con un seguro sencillo y económico.',
  },
  {
    title: 'DKV Visado', promo: 'VISADO', icon: Plane,
    desc: 'El seguro de salud que cumple todos los requisitos para tramitar tu visado o residencia en España, con certificado válido para tus trámites.',
    tagline: 'Tu mejor opción para tramitar tu visado en España',
    coverage: ['Sin copagos y sin periodos de carencia', 'Cobertura médica completa: +51.000 especialistas', 'Atención primaria, urgencias y ambulancia 24h', 'Hospitalización y cirugía incluidas', 'Cobertura en el extranjero hasta 180 días y 30.000€', 'Servicio dental incluido', 'Certificado válido para tu visado', 'Devolución garantizada si tu visado es denegado'],
    idealFor: 'Extranjeros que necesitan un seguro de salud que cumpla los requisitos para su visado o residencia en España.',
  },
]

const OTHER = [
  {
    title: 'Seguros dentales', icon: Smile, desc: 'Cuida tu boca con la mayor red dental de España.',
    tagline: 'La mayor red dental de España',
    coverage: ['Revisiones y limpiezas incluidas', 'Grandes descuentos en tratamientos', 'Ortodoncia, implantes y prótesis', 'Urgencias dentales', 'Sin carencias en lo básico'],
    idealFor: 'Toda la familia que quiere cuidar su salud bucodental sin sustos en la factura.',
  },
  {
    title: 'Seguros de decesos', icon: Feather, desc: 'Tranquilidad para ti y los tuyos en los momentos difíciles.',
    tagline: 'Todo resuelto en los momentos difíciles',
    coverage: ['Gestión integral del servicio', 'Asesoramiento y trámites incluidos', 'Cobertura para toda la familia', 'Asistencia en viaje', 'Tus seres queridos, sin preocupaciones'],
    idealFor: 'Quien quiere dejar todo previsto y no cargar a su familia con gestiones.',
  },
  {
    title: 'Seguro de repatriación', icon: Globe, desc: 'Repatriación garantizada a tu país de origen, para extranjeros residentes en España.',
    tagline: 'Repatriación garantizada a tu país de origen',
    coverage: ['Traslado y repatriación al país de origen', 'Gestión integral de los trámites internacionales', 'Cobertura para toda la familia', 'Acompañamiento y asistencia a los familiares', 'Asistencia 24h en todo el mundo', 'Complemento ideal del seguro de decesos'],
    idealFor: 'Extranjeros residentes en España que quieren garantizar la repatriación a su país de origen.',
  },
  {
    title: 'Seguros de vida', icon: Umbrella, desc: 'Protege económicamente a tu familia pase lo que pase.',
    tagline: 'La tranquilidad de tu familia, asegurada',
    coverage: ['Capital en caso de fallecimiento', 'Cobertura por invalidez', 'Adaptado a tu hipoteca o necesidades', 'Primas competitivas', 'Posibles ventajas fiscales'],
    idealFor: 'Quien quiere garantizar el bienestar económico de los suyos ante un imprevisto.',
  },
  {
    title: 'Seguros de hogar', icon: Home, desc: 'Tu casa protegida frente a cualquier imprevisto.',
    tagline: 'Tu hogar, siempre protegido',
    coverage: ['Daños por agua, incendio y robo', 'Responsabilidad civil', 'Asistencia 24h: fontanero, electricista…', 'Rotura de cristales y electrodomésticos', 'Cobertura de continente y contenido'],
    idealFor: 'Propietarios e inquilinos que quieren su vivienda protegida ante cualquier imprevisto.',
  },
]

const TESTIMONIALS = [
  { name: 'Laura Pérez', city: 'Madrid', since: 'Cliente desde 2021', photo: '/images/avatar-mujer-1.jpg', text: 'Me llamaron a la mañana siguiente de pedir presupuesto. Sin letra pequeña y con un asesor que se explicó de maravilla. Ahora toda mi familia está con DKV.' },
  { name: 'Javier Molina', city: 'Valencia', since: 'Cliente desde 2019', photo: '/images/avatar-hombre-1.jpg', text: 'Necesitaba una resonancia y en la pública me daban cita para dentro de dos meses. Con DKV la tuve en tres días. No vuelvo atrás.' },
  { name: 'Carmen Ruiz', city: 'Sevilla', since: 'Cliente desde 2022', photo: '/images/avatar-mujer-2.jpg', text: 'El seguro sin copago es justo lo que buscaba: sé lo que pago cada mes y me quito preocupaciones. La app para pedir cita es comodísima.' },
]

/* Precio orientativo por seguro (valor sin prefijo) */
const PRICES: Record<string, string> = {
  'Seguros sin copago': '39€/mes',
  'Seguros con copago': '24€/mes',
  'Seguros de cuadro médico': '29€/mes',
  'Seguros con reembolso': '55€/mes',
  'Seguro DKV Salud': '42€/mes',
  'DKV Famedic': '25,50€/mes',
  'Seguros dentales': '9€/mes',
  'Seguros de decesos': '12€/mes',
  'Seguros de vida': '8€/mes',
  'Seguros de hogar': '14€/mes',
  'Salud para autónomos': '34€/mes',
  'Seguro de baja laboral': '19€/mes',
  'Seguro de accidentes': '11€/mes',
  'Salud para colectivos': '28€/mes',
}

/* Imagen de cabecera para el modal de cada seguro */
const DETAIL_IMG: Record<string, string> = {
  'Seguros sin copago': IMG.doctor,
  'Seguros con copago': IMG.network,
  'Seguros de cuadro médico': IMG.digital,
  'Seguros con reembolso': '/images/reembolso.jpg',
  'Seguro DKV Salud': IMG.wellness,
  'DKV Famedic': IMG.familyKids,
  'DKV Visado': IMG.team,
  'Seguros dentales': IMG.dental,
  'Seguros de decesos': IMG.funeral,
  'Seguro de repatriación': IMG.business,
  'Seguros de vida': IMG.life,
  'Seguros de hogar': IMG.home,
  'Salud para autónomos': IMG.doctor,
  'Seguro de baja laboral': IMG.network,
  'Seguro de accidentes': IMG.doctor,
  'Responsabilidad civil': IMG.team,
  'Multirriesgo de negocio': IMG.home,
  'Salud para colectivos': IMG.team,
  'Retribución flexible': IMG.business,
  'Prevención de riesgos laborales': IMG.team,
  'Seguros de convenio': IMG.team,
  'Responsabilidad civil de empresa': IMG.business,
}

const ARTICLES = [
  {
    category: 'DKV', img: IMG.network, date: '30 jun 2026', read: '6 min',
    title: 'Por qué DKV es una de las aseguradoras más completas de España',
    excerpt: 'Casi un siglo de experiencia, el respaldo de Munich Re y una de las mayores redes médicas del país. Estas son las claves.',
    body: [
      { text: 'Elegir aseguradora de salud es una decisión importante, y no todas ofrecen lo mismo. DKV combina experiencia, solidez financiera, una enorme red médica y una apuesta pionera por la salud digital. Estas son las razones por las que es una de las aseguradoras más completas de España.' },
      { h: 'Casi 90 años cuidando de la salud', text: 'Los orígenes de DKV se remontan a 1932, cuando nació en Zaragoza el Igualatorio Médico-Quirúrgico. En 1998 se integró en el grupo alemán Deutsche Krankenversicherung (DKV). Casi un siglo de recorrido que se traduce en experiencia real cuidando de las familias españolas.' },
      { h: 'El respaldo de Munich Re', text: 'DKV forma parte de Munich Re, uno de los mayores grupos reaseguradores del mundo, a través de su división de salud. Esa solidez financiera es una garantía: la tranquilidad de saber que detrás de tu póliza hay un gigante internacional.' },
      { h: 'Una de las mayores redes médicas', text: 'Con más de 51.000 profesionales y 1.000 centros médicos concertados en toda España, DKV te da acceso a especialistas, pruebas y hospitales estés donde estés, sin las esperas de la sanidad pública.' },
      { h: 'Líder en salud digital', text: 'A través de su app Quiero cuidarme Más, DKV ofrece videoconsultas, chat médico 24 horas, receta electrónica, carpeta de salud digital e incluso coach de salud y comadrona digital. Tu médico, en el bolsillo.' },
      { h: 'Compromiso más allá del seguro', text: 'DKV fue la primera aseguradora española en obtener el certificado de Gestión Ética y Socialmente Responsable, y es una de las empresas con mayor porcentaje de plantilla con discapacidad. Cuidar de las personas, dentro y fuera.' },
    ],
  },
  {
    category: 'Confianza', img: IMG.doctor, date: '25 jun 2026', read: '4 min',
    title: 'El respaldo de un gigante: DKV y Munich Re',
    excerpt: 'Detrás de tu póliza de DKV hay uno de los mayores grupos aseguradores del mundo. Te explicamos por qué importa.',
    body: [
      { text: 'Cuando contratas un seguro de salud no solo importan las coberturas: importa quién está detrás para responder cuando lo necesites. Y DKV cuenta con un respaldo de primer nivel.' },
      { h: '¿Quién es Munich Re?', text: 'Munich Re es uno de los mayores grupos reaseguradores del mundo, con más de un siglo de historia. DKV forma parte de su división de salud, lo que la conecta con la experiencia y la fortaleza financiera de un líder global.' },
      { h: '¿Qué significa para ti?', text: 'Que tu aseguradora tiene una enorme solvencia y estabilidad. En un seguro de salud, esa solidez es la garantía de que las coberturas estarán ahí a largo plazo, año tras año.' },
      { h: 'Solidez que da tranquilidad', text: 'Casi 2 millones de clientes en España confían en DKV. Detrás de cada póliza hay músculo financiero internacional y casi un siglo de experiencia local: la combinación perfecta.' },
    ],
  },
  {
    category: 'Coberturas', img: '/images/reembolso.jpg', date: '18 jun 2026', read: '5 min',
    title: 'Todo lo que incluye un seguro DKV (es más de lo que crees)',
    excerpt: 'Cuadro médico, videoconsulta, chat 24h, receta electrónica, coach de salud… Un repaso a todo lo que llevas contigo.',
    body: [
      { text: 'Un buen seguro de salud es mucho más que ir al médico cuando estás enfermo. Con DKV, tu cobertura incluye herramientas para cuidarte cada día.' },
      { h: 'Una red médica enorme', text: 'Más de 51.000 profesionales y 1.000 centros concertados: medicina general, especialistas, pruebas diagnósticas, hospitalización y urgencias 24 horas por toda España.' },
      { h: 'Tu médico en el móvil', text: 'Con la app Quiero cuidarme Más tienes videoconsultas con especialistas, chat médico 24 horas y receta electrónica sin salir de casa. Ideal cuando no puedes o no quieres desplazarte.' },
      { h: 'Carpeta de salud y coach', text: 'Toda tu información médica organizada en una carpeta de salud digital, además de un coach de salud y una comadrona digital para acompañarte en cada etapa.' },
      { h: 'Modalidades para cada bolsillo', text: 'Desde opciones familiares que cubren hasta 8 personas sin declaración de salud, hasta modalidades con y sin copago. Pagas por lo que realmente necesitas.' },
      { h: 'Prevención y bienestar', text: 'Líneas de orientación médica, nutricional y deportiva para que cuidarte sea un hábito, no solo una reacción cuando algo va mal.' },
    ],
  },
  {
    category: 'Compromiso', img: '/images/compromiso.jpg', date: '10 jun 2026', read: '4 min',
    title: 'Lenguaje claro y compromiso social: la otra cara de DKV',
    excerpt: 'Sin letra pequeña, con responsabilidad social y ambiental. Una aseguradora con valores, no solo con pólizas.',
    body: [
      { text: 'DKV no solo destaca por sus coberturas: también por cómo hace las cosas. Estos son algunos de los compromisos que la diferencian.' },
      { h: 'Adiós a la letra pequeña', text: 'DKV impulsó un programa pionero de "lenguaje claro" en el sector asegurador, en colaboración con organizaciones de consumidores, para que entiendas de verdad lo que contratas.' },
      { h: 'Ética y responsabilidad', text: 'Fue la primera aseguradora española en obtener el certificado de Gestión Ética y Socialmente Responsable, y se adhirió al Pacto Mundial de Naciones Unidas en 2002.' },
      { h: 'Inclusión real', text: 'DKV es una de las empresas españolas con mayor porcentaje de personas con discapacidad en su plantilla, con la inclusión como parte de su ADN.' },
      { h: 'Compromiso con el planeta', text: 'La sostenibilidad y la salud ambiental están en el centro de su estrategia, con iniciativas medioambientales y solidarias que refuerzan su papel como empresa responsable.' },
    ],
  },
  {
    category: 'Salud', img: '/images/wellness.jpg', date: '28 jun 2026', read: '4 min',
    title: '5 razones para tener un seguro de salud privado',
    excerpt: 'Rapidez, elección de médico y tranquilidad: descubre por qué cada vez más familias dan el paso.',
    body: [
      { text: 'Contar con un seguro de salud privado ya no es un lujo, sino una decisión inteligente para cuidar de ti y de los tuyos. Estas son las cinco razones que más pesan a la hora de contratarlo.' },
      { h: '1. Adiós a las listas de espera', text: 'Mientras en la sanidad pública una cita con el especialista puede tardar semanas, con DKV la tienes en pocos días. Cuando se trata de tu salud, el tiempo importa.' },
      { h: '2. Eliges a tu médico', text: 'Accede a más de 51.000 profesionales y elige libremente el especialista o centro que prefieras, sin que nadie decida por ti.' },
      { h: '3. Cobertura desde el primer día', text: 'La asistencia básica está disponible de forma inmediata, para que estés protegido desde el minuto uno.' },
      { h: '4. Todo en tu móvil', text: 'Pide cita, consulta tu tarjeta digital o habla por videoconsulta con un médico desde la app, sin desplazamientos ni colas.' },
      { h: '5. Tranquilidad para toda la familia', text: 'Un solo seguro puede proteger a los tuyos con condiciones especiales, incluyendo pediatría y salud de la mujer.' },
    ],
  },
  {
    category: 'Comparativa', img: '/images/nutrition.jpg', date: '15 jun 2026', read: '5 min',
    title: 'Seguro con o sin copago: ¿cuál te conviene?',
    excerpt: 'Te explicamos las diferencias para que elijas la modalidad que mejor encaja con tu forma de cuidarte.',
    body: [
      { text: 'Una de las primeras decisiones al contratar un seguro de salud es elegir entre la modalidad con copago o sin copago. Ninguna es mejor que la otra: depende de cómo uses el seguro.' },
      { h: 'Seguro sin copago', text: 'Pagas una cuota mensual algo más alta pero no abonas nada por cada visita, prueba o consulta. Ideal si usas el seguro con frecuencia y quieres saber exactamente cuánto gastas cada mes.' },
      { h: 'Seguro con copago', text: 'La cuota mensual es más baja y solo pagas una pequeña cantidad cuando utilizas un servicio. Perfecto si vas poco al médico y prefieres reducir tu gasto fijo.' },
      { h: '¿Cómo decidir?', text: 'Piensa en cuántas veces al año vas al médico. Si es a menudo, el sin copago suele salir más rentable. Si es de forma puntual, el copago te permite ahorrar. Un asesor puede calcularlo contigo gratis.' },
    ],
  },
  {
    category: 'Consejos', img: IMG.hero, date: '2 jun 2026', read: '3 min',
    title: 'Cómo tu seguro de salud te ahorra tiempo y dinero',
    excerpt: 'Menos esperas, menos gastos imprevistos y más prevención. El seguro que se paga solo.',
    body: [
      { text: 'Mucha gente ve el seguro de salud como un gasto, pero bien usado es una inversión que te devuelve tiempo, dinero y tranquilidad.' },
      { h: 'El valor de tu tiempo', text: 'Evitar meses de espera para una prueba o una operación tiene un valor incalculable, sobre todo cuando tu salud o tu trabajo están en juego.' },
      { h: 'Gastos bajo control', text: 'Una sola prueba privada puede costar cientos de euros. Con un seguro, tu gasto es predecible y muy inferior al de pagar cada servicio por separado.' },
      { h: 'La prevención es la clave', text: 'Revisiones periódicas y detección temprana evitan problemas mayores. Cuidarte a tiempo siempre sale más barato que curarte tarde.' },
    ],
  },
  {
    category: 'Autónomos', img: '/images/autonomos.jpg', date: '20 may 2026', read: '4 min',
    title: 'Salud para autónomos: la ventaja fiscal que quizá no conocías',
    excerpt: 'Como trabajador por cuenta propia, tu seguro de salud puede desgravar. Te contamos cómo.',
    body: [
      { text: 'Si eres autónomo, tu seguro de salud no solo te cuida: también puede ayudarte a pagar menos impuestos.' },
      { h: 'Desgrava en tu IRPF', text: 'La normativa permite deducir las primas del seguro de salud propio, del cónyuge y de los hijos, dentro de los límites establecidos. Consulta siempre con tu asesor fiscal.' },
      { h: 'Cuídate sin parar tu actividad', text: 'Para un autónomo, cada día de baja cuenta. Con acceso rápido a especialistas y videoconsulta, resuelves antes y vuelves a la actividad cuanto antes.' },
      { h: 'Un seguro a tu medida', text: 'Elige la modalidad que encaje con tu ritmo de vida y tu bolsillo. Te ayudamos a calcularlo sin compromiso.' },
    ],
  },
]

const HELP = [
  { icon: CalendarDays, title: 'Visita a un agente', desc: 'Pide cita en una oficina DKV cercana y te asesoramos en persona.', cta: 'Solicitar cita', action: 'form' as const },
  { icon: PhoneCall, title: 'Llámanos', desc: 'Habla directamente con un asesor especializado en seguros de salud.', cta: '699 66 96 03', action: 'tel' as const },
  { icon: Phone, title: 'Te llamamos gratis', desc: 'Déjanos tu teléfono y un asesor te llama sin coste ni compromiso.', cta: 'Solicitar llamada', action: 'form' as const },
]

const MEGA: Record<string, { cols: { title: string; links: { label: string; desc: string; kind: 'product' | 'other' | 'scroll' | 'detail'; idx?: number; target?: string; detail?: any }[] }[]; promo: { title: string; text: string } }> = {
  Particulares: {
    cols: [
      { title: 'Seguros de salud', links: [
        { label: 'Sin copago', desc: 'Cuota fija, sin pagos por acto', kind: 'product', idx: 0 },
        { label: 'Con copago', desc: 'Cuota baja, pagas al usarlo', kind: 'product', idx: 1 },
        { label: 'Cuadro médico', desc: '+51.000 profesionales', kind: 'product', idx: 2 },
        { label: 'Reembolso', desc: 'Elige cualquier médico', kind: 'product', idx: 3 },
        { label: 'DKV Salud', desc: 'El seguro más completo', kind: 'product', idx: 4 },
        { label: 'DKV Famedic', desc: 'Familia, hasta 8 personas', kind: 'product', idx: 5 },
      ] },
      { title: 'Otros seguros', links: [
        { label: 'Seguro dental', desc: 'La mayor red dental de España', kind: 'other', idx: 0 },
        { label: 'Seguro de vida', desc: 'Protege a tu familia', kind: 'other', idx: 2 },
        { label: 'Seguro de decesos', desc: 'Todo previsto y resuelto', kind: 'other', idx: 1 },
        { label: 'Seguro de hogar', desc: 'Tu casa protegida', kind: 'other', idx: 3 },
      ] },
    ],
    promo: { title: 'Hasta 35% de descuento', text: 'Calcula tu seguro médico en 1 minuto y te llamamos gratis, sin compromiso.' },
  },
  'Autónomos': {
    cols: [
      { title: 'Tu salud', links: [
        { label: 'Salud para autónomos', desc: 'Cobertura médica flexible', kind: 'detail', detail: {
          title: 'Salud para autónomos', icon: HeartPulse, promo: '-35%',
          tagline: 'La mejor medicina privada, con ventaja fiscal',
          desc: 'Un seguro de salud flexible pensado para autónomos: cuídate sin listas de espera y aprovecha las ventajas fiscales de ser trabajador por cuenta propia.',
          coverage: ['Cuadro médico con +51.000 profesionales', 'Especialistas y pruebas diagnósticas', 'Hospitalización y urgencias 24h', 'Videoconsulta para no parar tu actividad', 'Deducible en tu declaración (según normativa)', 'Hasta 35% de descuento'],
          idealFor: 'Autónomos que quieren cuidarse rápido, sin depender de la lista de espera pública y con ventaja fiscal.',
        } },
        { label: 'Baja laboral', desc: 'Ingresos si no puedes trabajar', kind: 'detail', detail: {
          title: 'Seguro de baja laboral', icon: Umbrella,
          tagline: 'Ingresos garantizados si no puedes trabajar',
          desc: 'Si una enfermedad o accidente te impide trabajar, recibes una indemnización diaria para cubrir tus ingresos mientras te recuperas.',
          coverage: ['Indemnización diaria por baja', 'Cobertura por enfermedad y accidente', 'Compatible con la prestación pública', 'Capital extra por hospitalización', 'Tú eliges el importe diario', 'Protege tu tesorería'],
          idealFor: 'Autónomos cuyos ingresos dependen 100% de su actividad y no pueden permitirse parar sin cobrar.',
        } },
        { label: 'Seguro de accidentes', desc: 'Protección las 24 horas', kind: 'detail', detail: {
          title: 'Seguro de accidentes', icon: ShieldCheck,
          tagline: 'Protección 24 horas, dentro y fuera del trabajo',
          desc: 'Cobertura económica ante accidentes que provoquen invalidez o fallecimiento, las 24 horas del día y estés donde estés.',
          coverage: ['Capital por invalidez permanente', 'Capital por fallecimiento accidental', 'Cobertura 24h en todo el mundo', 'Asistencia sanitaria por accidente', 'Indemnización por gastos médicos', 'Primas ajustadas a tu actividad'],
          idealFor: 'Quien quiere una red de seguridad económica para su familia ante cualquier accidente.',
        } },
      ] },
      { title: 'Tu actividad', links: [
        { label: 'Responsabilidad civil', desc: 'Frente a reclamaciones', kind: 'detail', detail: {
          title: 'Responsabilidad civil', icon: Scale,
          tagline: 'Frente a reclamaciones de terceros',
          desc: 'Te protege ante los daños que tu actividad profesional pueda causar a terceros, cubriendo indemnizaciones y defensa jurídica.',
          coverage: ['Daños a terceros por tu actividad', 'Defensa jurídica y fianzas', 'RC de explotación y patronal', 'Cobertura de productos y servicios', 'Adaptado a tu profesión', 'Tranquilidad legal'],
          idealFor: 'Autónomos que tratan con clientes, proveedores o público y quieren cubrir posibles reclamaciones.',
        } },
        { label: 'Multirriesgo de negocio', desc: 'Tu local y equipo protegidos', kind: 'detail', detail: {
          title: 'Multirriesgo de negocio', icon: Wrench,
          tagline: 'Tu local y tu equipo, siempre protegidos',
          desc: 'Protege tu local, mercancía y equipamiento frente a incendios, robos, daños por agua y otros imprevistos que pueden parar tu actividad.',
          coverage: ['Incendio, robo y daños por agua', 'Rotura de cristales y maquinaria', 'Responsabilidad civil incluida', 'Pérdida de beneficios', 'Asistencia 24h para tu negocio', 'Continente y contenido'],
          idealFor: 'Autónomos con local, taller, tienda u oficina que no pueden permitirse parar por un siniestro.',
        } },
      ] },
    ],
    promo: { title: 'Ventajas fiscales', text: 'Deduce tu seguro de salud como autónomo. Te asesoramos gratis.' },
  },
  Empresas: {
    cols: [
      { title: 'Salud para empleados', links: [
        { label: 'Salud colectivos', desc: 'Desde 3 empleados', kind: 'detail', detail: {
          title: 'Salud para colectivos', icon: Users, promo: 'GRUPO',
          tagline: 'Salud privada para tu equipo, desde 3 empleados',
          desc: 'Ofrece a tu plantilla un seguro médico privado con condiciones especiales de grupo. Un beneficio muy valorado que mejora la retención del talento.',
          coverage: ['Precio especial por volumen', 'Cuadro médico completo para empleados', 'Altas y bajas flexibles', 'Extensible a familiares', 'Gestión centralizada y sencilla', 'Mejora tu marca empleadora'],
          idealFor: 'Empresas que quieren cuidar a su equipo y diferenciarse como empleador desde solo 3 empleados.',
        } },
        { label: 'Retribución flexible', desc: 'Beneficio para tu equipo', kind: 'detail', detail: {
          title: 'Retribución flexible', icon: Gift,
          tagline: 'Más salario neto para tu equipo, sin coste extra',
          desc: 'Permite a tus empleados destinar parte de su salario al seguro de salud con ventajas fiscales, aumentando su poder adquisitivo sin coste para la empresa.',
          coverage: ['Ahorro fiscal para el empleado', 'Sin coste añadido para la empresa', 'Fácil de implantar y gestionar', 'Beneficio muy valorado', 'Extensible a familiares', 'Mejora el paquete retributivo'],
          idealFor: 'Empresas que quieren mejorar la retribución de su equipo aprovechando las ventajas fiscales.',
        } },
        { label: 'Prevención de riesgos', desc: 'Salud laboral', kind: 'detail', detail: {
          title: 'Prevención de riesgos laborales', icon: HardHat,
          tagline: 'Cumple con la ley y cuida la salud laboral',
          desc: 'Servicios de vigilancia de la salud y prevención para cumplir con la normativa y reducir la siniestralidad en tu empresa.',
          coverage: ['Reconocimientos médicos laborales', 'Vigilancia de la salud', 'Asesoramiento en prevención', 'Cumplimiento normativo (LPRL)', 'Reducción de bajas laborales', 'Informes y seguimiento'],
          idealFor: 'Empresas que deben cumplir la normativa de PRL y quieren un entorno de trabajo más seguro.',
        } },
      ] },
      { title: 'Protección', links: [
        { label: 'Seguros de convenio', desc: 'Cumple con tu convenio', kind: 'detail', detail: {
          title: 'Seguros de convenio', icon: FileText,
          tagline: 'Cumple las coberturas que exige tu convenio',
          desc: 'Cubre las indemnizaciones por accidente que muchos convenios colectivos obligan a garantizar a los trabajadores.',
          coverage: ['Capital por accidente laboral', 'Cumplimiento del convenio colectivo', 'Cobertura por invalidez y fallecimiento', 'Gestión sencilla de altas y bajas', 'Certificados para inspección', 'Primas ajustadas a la plantilla'],
          idealFor: 'Empresas obligadas por su convenio a asegurar a los trabajadores frente a accidentes.',
        } },
        { label: 'Responsabilidad civil', desc: 'Protege tu empresa', kind: 'detail', detail: {
          title: 'Responsabilidad civil de empresa', icon: ShieldCheck,
          tagline: 'Protege tu empresa frente a reclamaciones',
          desc: 'Cubre los daños que tu actividad empresarial pueda causar a terceros, incluyendo defensa jurídica y fianzas.',
          coverage: ['RC de explotación y patronal', 'Daños a terceros y clientes', 'Defensa jurídica y fianzas', 'RC por productos', 'Cobertura adaptada a tu sector', 'Protege el patrimonio de la empresa'],
          idealFor: 'Empresas que quieren blindarse ante posibles reclamaciones de clientes, empleados o terceros.',
        } },
      ] },
    ],
    promo: { title: 'Un equipo sano rinde más', text: 'Diseñamos un plan de salud a medida para tu empresa.' },
  },
}

/* Reveal-on-scroll wrapper */
function Reveal({ children, delay = 0, style }: { children: React.ReactNode; delay?: number; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setSeen(true); obs.disconnect() } }, { threshold: 0.12 })
    obs.observe(el); return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} style={{ ...style, opacity: seen ? 1 : 0, transform: seen ? 'none' : 'translateY(30px)', transition: `opacity .7s ease ${delay}s, transform .7s cubic-bezier(.22,1,.36,1) ${delay}s` }}>
      {children}
    </div>
  )
}

export default function DKVClone() {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: '', telefono: '', email: '', cp: '' })
  const [accept, setAccept] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [focus, setFocus] = useState<string | null>(null)
  const [faq, setFaq] = useState<number | null>(0)
  const [detail, setDetail] = useState<any>(null)
  const [article, setArticle] = useState<any>(null)
  const [interesSel, setInteresSel] = useState('')
  const [openMenu, setOpenMenu] = useState<string | null>(null)
  const [prog, setProg] = useState(0)

  useEffect(() => {
    document.body.style.overflow = (detail || article) ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [detail, article])

  const goSeguro = (title: string) => router.push('/dkv/seguro/' + slugify(title))
  const goArticle = (title: string) => router.push('/dkv/blog/' + slugify(title))

  const openLink = (l: { kind: string; idx?: number; target?: string; detail?: any }) => {
    if (l.kind === 'product') goSeguro(PRODUCTS[l.idx!].title)
    else if (l.kind === 'other') goSeguro(OTHER[l.idx!].title)
    else if (l.kind === 'detail') goSeguro(l.detail.title)
    else scrollTo(l.target || 'calcula')
  }

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 16); setOpenMenu(null)
      const h = document.documentElement.scrollHeight - window.innerHeight
      setProg(h > 0 ? Math.min(100, (window.scrollY / h) * 100) : 0)
    }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // ── SEM: captura del origen del lead (UTM, gclid, fbclid) + keyword para message-match ──
  const attribRef = useRef('')
  const formStarted = useRef(false)
  const onFormFocus = () => { if (!formStarted.current) { formStarted.current = true; trackFormStart() } }
  const [kw, setKw] = useState('')
  const [heroCopy, setHeroCopy] = useState<{ h1?: React.ReactNode; sub?: React.ReactNode } | null>(null)
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const keys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid']
      const parts = keys.map(k => { const v = sp.get(k); return v ? `${k}=${v}` : '' }).filter(Boolean)
      // Atribución enriquecida: procedencia y dispositivo (útil para segmentar leads de pago)
      let refHost = ''
      try { refHost = document.referrer ? new URL(document.referrer).hostname : '' } catch { refHost = '' }
      if (refHost && !refHost.includes('dkv-ergo')) parts.push(`ref=${refHost}`)
      parts.push(`disp=${window.innerWidth < 768 ? 'movil' : 'escritorio'}`)
      const stored = sessionStorage.getItem('dkv-attrib')
      if (!stored) sessionStorage.setItem('dkv-attrib', parts.join(' '))
      attribRef.current = stored || parts.join(' ')

      // Message-match: adapta hero y keyword al anuncio (por ?kw=, utm_term o URL de campaña limpia)
      const pathKw = /^\/seguro-/.test(window.location.pathname)
        ? window.location.pathname.replace(/^\/seguro-?/, '').replace(/-/g, ' ').trim()
        : ''
      const k = (sp.get('kw') || sp.get('utm_term') || pathKw).trim()
      if (k) setKw(k)
      const hay = `${k} ${pathKw} ${sp.get('utm_campaign') || ''} ${sp.get('utm_content') || ''}`.toLowerCase()
      const lime = { color: C.lime }
      const themes: { m: RegExp; h1: React.ReactNode; sub: React.ReactNode }[] = [
        { m: /dental|boca|diente|ortodon/, h1: <>Tu seguro <span style={lime}>dental DKV</span></>, sub: <>Cuida tu boca con la mayor red dental de España. Sin esperas y hasta un <b style={lime}>35% de descuento</b>.</> },
        { m: /famil|hijo|niñ|pareja/, h1: <>Protege a <span style={lime}>toda tu familia</span> con DKV</>, sub: <>Un seguro de salud para todos los tuyos: hasta 8 miembros, sin listas de espera y con hasta un <b style={lime}>35% de descuento</b>.</> },
        { m: /sin copago/, h1: <>Seguro de salud <span style={lime}>sin copago</span></>, sub: <>Paga una cuota fija y olvídate: sin abonar nada por cada visita. Cobertura desde el primer día.</> },
        { m: /reembolso|libre elecci/, h1: <>Elige a tu médico con el <span style={lime}>seguro de reembolso</span></>, sub: <>Acude a cualquier médico o clínica y te devolvemos los gastos. Libertad total, con DKV.</> },
        { m: /aut[oó]nomo|freelance|desgrav/, h1: <>Seguro de salud para <span style={lime}>autónomos</span></>, sub: <>Cuídate y desgrava: tu seguro DKV como gasto deducible. Cobertura inmediata y sin esperas.</> },
        { m: /lista de espera|listas de espera|sin espera|r[aá]pid/, h1: <>Olvídate de las <span style={lime}>listas de espera</span></>, sub: <>Con DKV tienes cita con el especialista en días, no en meses. Cobertura desde el primer día.</> },
        { m: /operaci|cirug|intervenc|quir[uú]rgic/, h1: <>Tu operación privada, <span style={lime}>sin esperas</span></>, sub: <>Cirugía y hospitalización con los mejores especialistas de DKV, cuando lo necesitas.</> },
        { m: /embaraz|matern|parto|comadron|ginec[oó]log/, h1: <>Cuida tu <span style={lime}>embarazo</span> con DKV</>, sub: <>Ginecología, seguimiento del embarazo y comadrona digital. Tú y tu bebé, en las mejores manos.</> },
        { m: /mayor|s[eé]nior|jubilad|tercera edad|65/, h1: <>Seguro de salud para <span style={lime}>mayores</span></>, sub: <>Atención médica sin esperas y con trato cercano. La tranquilidad que mereces, con DKV.</> },
        { m: /prueba|resonancia|diagn[oó]stic|especialista|analítica|analitica/, h1: <>Especialistas y pruebas, <span style={lime}>sin esperas</span></>, sub: <>Accede a +51.000 profesionales y a todas las pruebas diagnósticas cuando las necesites.</> },
        { m: /barat|econ[oó]mic|precio|desde|cu[aá]nto cuesta/, h1: <>Seguro de salud DKV <span style={lime}>desde 25,50€/mes</span></>, sub: <>La mejor medicina privada al mejor precio. Calcula el tuyo en 1 minuto, sin compromiso.</> },
      ]
      const t = themes.find(x => x.m.test(hay))
      if (t) setHeroCopy({ h1: t.h1, sub: t.sub })
    } catch { /* noop */ }
  }, [])

  const scrollTo = useCallback((id: string) => {
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [])

  const set = (k: string, v: string) => { setForm(f => ({ ...f, [k]: v })); setError('') }
  const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())
  const telOk = (t: string) => /^(\+?34)?[6789]\d{8}$/.test(t.replace(/[\s-]/g, ''))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('Indícanos tu nombre para poder llamarte.'); return }
    if (!form.telefono.trim()) { setError('Necesitamos tu teléfono para poder llamarte.'); return }
    if (!telOk(form.telefono)) { setError('El teléfono no es válido (9 dígitos, España).'); return }
    if (!form.cp.trim()) { setError('Indícanos tu código postal.'); return }
    if (!/^\d{5}$/.test(form.cp.trim())) { setError('El código postal debe tener 5 dígitos.'); return }
    if (form.email.trim() && !emailOk(form.email)) { setError('El correo electrónico no tiene un formato válido.'); return }
    if (!accept) { setError('Debes aceptar la política de privacidad para continuar.'); return }
    setSending(true)
    const detalle = [
      interesSel || 'Cálculo seguro salud (web DKV)',
      form.cp && `CP ${form.cp}`,
      attribRef.current && `· origen: ${attribRef.current}`,
    ].filter(Boolean).join(' · ')
    const { error: dbErr } = await supabase.from('leads').insert({
      nombre: form.nombre.trim(),
      telefono: form.telefono.trim() || null,
      email: form.email.trim() || null,
      interes: detalle,
      fuente: 'web-dkv',
      tag: 'frio',
    })
    setSending(false)
    if (dbErr) { setError('Algo salió mal al enviar. Inténtalo de nuevo.'); return }
    router.push('/gracias?nombre=' + encodeURIComponent(form.nombre.trim()))
  }

  /* Button styles */
  const solid = (bg: string, color = '#fff'): React.CSSProperties => ({
    background: bg, color, border: 'none', borderRadius: 999, padding: '14px 28px',
    fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap',
    transition: 'transform .18s cubic-bezier(.22,1,.36,1), box-shadow .18s, background .18s',
  })
  const outline = (col: string): React.CSSProperties => ({
    background: 'transparent', color: col, border: `1.6px solid ${col}`, borderRadius: 999,
    padding: '13px 26px', fontSize: 15, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
    display: 'inline-flex', alignItems: 'center', gap: 8, whiteSpace: 'nowrap', transition: 'all .18s',
  })

  return (
    <div style={{ background: '#fff', color: C.text, fontFamily: 'var(--font-jakarta), system-ui, sans-serif', minHeight: '100vh', overflowX: 'hidden' }}>
      <style>{`
        .dkv-a{color:inherit;text-decoration:none}
        .dkv-navlink{position:relative;padding:8px 0;transition:color .15s}
        .dkv-navlink::after{content:'';position:absolute;left:0;right:100%;bottom:0;height:2px;background:${C.lime};transition:right .25s ease}
        .dkv-navlink:hover{color:${C.teal}!important}
        .dkv-navlink:hover::after{right:0}
        .btn-red:hover{background:${C.redDark}!important;transform:translateY(-2px);box-shadow:0 12px 26px -8px rgba(221,54,54,.55)}
        .btn-teal:hover{background:${C.tealDeep}!important;transform:translateY(-2px);box-shadow:0 12px 26px -8px rgba(9,87,81,.55)}
        .btn-white:hover{transform:translateY(-2px);box-shadow:0 12px 26px -10px rgba(0,0,0,.25)}
        .btn-out:hover{background:${C.teal}!important;color:#fff!important}
        .btn-out-w:hover{background:#fff!important;color:${C.limeDark}!important}
        .card:hover{transform:translateY(-8px);box-shadow:0 34px 70px -26px rgba(9,87,81,.4)!important;border-color:#d5e0da!important}
        .card:hover .card-arrow{transform:translateX(4px)}
        .card-arrow{transition:transform .2s}
        /* Zoom suave de imágenes en tarjetas */
        .zoomimg{transition:transform .6s cubic-bezier(.22,1,.36,1)}
        .card:hover .zoomimg{transform:scale(1.07)}
        /* Brillo que barre los botones al pasar el ratón */
        .btn-red,.btn-teal,.btn-white{position:relative;overflow:hidden}
        .btn-red::after,.btn-teal::after,.btn-white::after{content:'';position:absolute;top:0;left:-120%;width:60%;height:100%;background:linear-gradient(120deg,transparent,rgba(255,255,255,.35),transparent);transform:skewX(-20deg);transition:none}
        .btn-red:hover::after,.btn-teal:hover::after,.btn-white:hover::after{animation:shine .8s ease}
        @keyframes shine{to{left:150%}}
        /* Entrada con leve escala para las secciones reveladas */
        .trust-row span{transition:color .2s}
        .foot a{transition:color .15s}
        .foot a:hover{color:#fff!important}
        .soc:hover{background:${C.lime}!important;color:#fff!important;transform:translateY(-3px)}
        .in:focus{border-color:${C.teal}!important;background:#fff!important;box-shadow:0 0 0 4px rgba(9,87,81,.1)!important}
        .seal{animation:floaty 4.5s ease-in-out infinite}
        @keyframes floaty{0%,100%{transform:translateY(-50%)}50%{transform:translateY(-58%)}}
        @keyframes spin{to{transform:rotate(360deg)}}
        .spin{animation:spin .8s linear infinite}
        @keyframes ecg{0%{stroke-dashoffset:1400}55%{stroke-dashoffset:0}100%{stroke-dashoffset:-1400}}
        @keyframes pulseDot{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(1.9);opacity:.35}}
        .pdot{animation:pulseDot 1.8s ease-in-out infinite}
        @keyframes kenburns{from{transform:scale(1.14)}to{transform:scale(1)}}
        @keyframes heroUp{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}
        .h-rise{animation:heroUp .85s cubic-bezier(.22,1,.36,1) both}
        .h-rise.d1{animation-delay:.1s}.h-rise.d2{animation-delay:.22s}.h-rise.d3{animation-delay:.34s}.h-rise.d4{animation-delay:.46s}
        .btn-glass:hover{background:rgba(255,255,255,.26)!important;transform:translateY(-2px)}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes modalUp{from{opacity:0;transform:translateY(34px) scale(.97)}to{opacity:1;transform:none}}
        .modal-close:hover{background:rgba(255,255,255,.28)!important}
        @keyframes menuDown{from{opacity:0;transform:translateY(-10px)}to{opacity:1;transform:none}}
        .menu-link:hover{background:#f3f5f0!important}
        .menu-link:hover .ml-arrow{opacity:1;transform:translateX(0)}
        @keyframes waPulse{0%{box-shadow:0 8px 24px -6px rgba(0,0,0,.3),0 0 0 0 rgba(37,211,102,.55)}70%{box-shadow:0 8px 24px -6px rgba(0,0,0,.3),0 0 0 22px rgba(37,211,102,0)}100%{box-shadow:0 8px 24px -6px rgba(0,0,0,.3),0 0 0 0 rgba(37,211,102,0)}}
        .wa-float{animation:waPulse 2.2s infinite;transition:transform .2s}
        .wa-float:hover{transform:scale(1.09)}
        @keyframes marquee{from{transform:translateX(0)}to{transform:translateX(-50%)}}
        .marquee-track{display:flex;width:max-content;animation:marquee 38s linear infinite}
        .marquee-wrap:hover .marquee-track{animation-play-state:paused}
        @keyframes floatUp{0%,100%{transform:translateY(0)}50%{transform:translateY(-12px)}}
        .drawer{position:fixed;inset:0;z-index:60;background:rgba(15,21,18,.5);backdrop-filter:blur(2px)}
        .drawer-panel{position:absolute;top:0;right:0;bottom:0;width:min(320px,86vw);background:#fff;padding:26px 24px;box-shadow:-20px 0 60px rgba(0,0,0,.2);display:flex;flex-direction:column;gap:6px}
        /* Header: cambia a menú hamburguesa antes de que se desborde (tablets) */
        @media(max-width:1200px){
          .hide-md{display:none!important}
          .show-md{display:flex!important}
        }
        @media(max-width:980px){
          .hero-grid{grid-template-columns:1fr!important}
          .hero-img{min-height:340px!important;margin:0 -24px!important;border-radius:0!important}
          .g2{grid-template-columns:1fr!important}
          .g4{grid-template-columns:1fr 1fr!important}
          .g3{grid-template-columns:1fr!important}
        }
        @media(max-width:560px){
          .g4{grid-template-columns:1fr!important;gap:14px!important}
          .g3{gap:14px!important}
          .g2{gap:26px!important}
          .pad{padding-left:20px!important;padding-right:20px!important}
          .topbar{display:none!important}
          .band-col{flex-direction:column!important;align-items:flex-start!important}
          /* Carruseles horizontales deslizables en móvil (acortan mucho la página) */
          .mcarousel{display:flex!important;grid-template-columns:none!important;overflow-x:auto;gap:14px!important;scroll-snap-type:x mandatory;-webkit-overflow-scrolling:touch;padding-bottom:12px!important;scrollbar-width:none}
          .mcarousel::-webkit-scrollbar{display:none}
          .mcarousel>*{flex:0 0 82%!important;min-width:0;scroll-snap-align:start}
          /* Secciones informativas ocultas en móvil (siguen en escritorio y SEO) */
          .hide-mobile{display:none!important}
          /* Pastillas de cifras y columnas del footer: 2 por fila en móvil (mitad de alto) */
          .stat-grid{grid-template-columns:1fr 1fr!important;gap:12px!important}
          .foot-grid{grid-template-columns:1fr 1fr!important;gap:26px 20px!important}
          /* Tarjetas de beneficios: horizontales y compactas en móvil */
          .bcard{display:flex!important;flex-direction:row!important;align-items:center!important;text-align:left!important;gap:16px!important}
          .bcard-ic{margin:0!important;width:54px!important;height:54px!important;border-radius:15px!important}
          .bcard-txt h3{margin:0 0 4px!important;font-size:16.5px!important}
          .bcard-txt p{font-size:13.5px!important;line-height:1.5!important}
        }
        @media(max-width:768px){
          .sem-bar{display:flex!important}
          .wa-float{bottom:86px!important;width:52px!important;height:52px!important}
          footer{padding-bottom:78px!important}
        }
      `}</style>

      <JsonLd data={FAQ_LD} />

      {/* Barra de progreso de scroll */}
      <div style={{ position: 'fixed', top: 0, left: 0, height: 3, width: `${prog}%`, background: `linear-gradient(90deg, ${C.teal}, ${C.lime})`, zIndex: 100, transition: 'width .12s ease', pointerEvents: 'none' }} />

      {/* Botón flotante WhatsApp */}
      <a href="https://wa.me/34699669603?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20un%20seguro%20DKV" onClick={() => trackContact('whatsapp')} target="_blank" rel="noopener noreferrer" className="wa-float dkv-a" aria-label="Escríbenos por WhatsApp" style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 85, width: 60, height: 60, borderRadius: '50%', background: '#25D366', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <MessageCircle size={30} color="#fff" />
      </a>

      {/* Barra fija móvil (SEM): click-to-call + CTA principal */}
      <div className="sem-bar" style={{ display: 'none', position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 86, background: '#fff', borderTop: `1px solid ${C.border}`, padding: '10px 14px', gap: 10, boxShadow: '0 -8px 24px -12px rgba(0,0,0,.25)' }}>
        <a href="tel:699669603" onClick={() => trackContact('phone')} className="dkv-a" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: `1.6px solid ${C.teal}`, color: C.teal, fontWeight: 800, fontSize: 15 }}><Phone size={17} /> Llamar</a>
        <button onClick={() => scrollTo('calcula')} style={{ flex: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '13px', borderRadius: 12, border: 'none', background: C.red, color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'inherit', cursor: 'pointer' }}>Calcula tu seguro <ArrowRight size={17} /></button>
      </div>

      {/* ═══ TOP UTILITY BAR ═══ */}
      <div className="topbar" style={{ background: `linear-gradient(90deg, ${C.lime}, ${C.limeDark})`, color: '#fff' }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 24, height: 44, fontSize: 13.5, fontWeight: 600 }}>
          {[
            { t: 'Contacto', on: () => scrollTo('contacto') },
            { t: 'Blog', on: () => scrollTo('blog') },
          ].map(i => (
            <button key={i.t} onClick={i.on} className="dkv-a" style={{ opacity: 0.96, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, fontWeight: 600, padding: 0 }}>{i.t}</button>
          ))}
          <span style={{ opacity: 0.45 }}>|</span>
          {[{ t: 'Español', c: 'es' }, { t: 'Gallego', c: 'gl' }, { t: 'Català', c: 'ca' }, { t: 'English', c: 'en' }, { t: 'Deutsch', c: 'de' }].map(l => (
            <button key={l.c} onClick={() => (window as unknown as { changeLanguage?: (x: string) => void }).changeLanguage?.(l.c)} className="dkv-a hide-md notranslate" translate="no" style={{ opacity: 0.9, fontWeight: 500, background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: 13.5, padding: 0 }}>{l.t}</button>
          ))}
        </div>
      </div>

      {/* ═══ HEADER ═══ */}
      <header onMouseLeave={() => setOpenMenu(null)} style={{ position: 'sticky', top: 0, zIndex: 50, background: 'rgba(255,255,255,.9)', backdropFilter: 'saturate(180%) blur(12px)', borderBottom: `1px solid ${scrolled || openMenu ? C.border : 'transparent'}`, boxShadow: scrolled ? '0 6px 22px -14px rgba(0,0,0,.25)' : 'none', transition: 'box-shadow .25s, border-color .25s' }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', gap: 20, height: scrolled ? 68 : 78, transition: 'height .25s', minWidth: 0 }}>
          <a href="#" onClick={e => { e.preventDefault(); scrollTo('top') }} className="dkv-a" style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <DKVLogo size={26} />
          </a>
          <nav className="hide-md" style={{ display: 'flex', gap: 22, marginLeft: 4, fontSize: 15, fontWeight: 600, color: C.taupe }}>
            {NAV.map(n => {
              const hasMenu = !!MEGA[n.label]
              const active = openMenu === n.label
              if (n.label === 'Calcula tu seguro') {
                return (
                  <button key={n.label} onClick={() => scrollTo('calcula')} onMouseEnter={() => setOpenMenu(null)} className="btn-red" style={{ ...solid(C.red), padding: '10px 22px', fontSize: 14.5, marginLeft: 4, boxShadow: '0 10px 22px -8px rgba(221,54,54,.5)' }}>
                    Calcula tu seguro <ArrowRight size={16} />
                  </button>
                )
              }
              return (
                <a key={n.label} href="#"
                  onMouseEnter={() => setOpenMenu(hasMenu ? n.label : null)}
                  onClick={e => { e.preventDefault(); if (hasMenu) setOpenMenu(active ? null : n.label); else scrollTo(n.label === 'Cuadro médico' ? 'medico' : 'calcula') }}
                  className="dkv-a dkv-navlink" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap', color: active ? C.teal : undefined }}>
                  {n.label}{n.drop && <ChevronDown size={14} style={{ transform: active ? 'rotate(180deg)' : 'none', transition: 'transform .2s' }} />}
                </a>
              )
            })}
          </nav>
          <div style={{ flex: 1 }} />
          <div className="hide-md" style={{ display: 'flex', alignItems: 'center', gap: 22 }}>
            <a href="tel:699669603" onClick={() => trackContact('phone')} className="dkv-a" style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <span style={{ width: 38, height: 38, borderRadius: '50%', background: C.cream, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Phone size={17} style={{ color: C.teal }} /></span>
              <span style={{ lineHeight: 1.15 }}>
                <span style={{ display: 'block', fontSize: 11, color: C.taupe }}>Quiero contratar</span>
                <span style={{ display: 'block', fontSize: 15.5, fontWeight: 800, color: C.text, whiteSpace: 'nowrap' }}>699 66 96 03</span>
              </span>
            </a>
          </div>
          <button onClick={() => setMenuOpen(true)} aria-label="Menú" className="show-md" style={{ display: 'none', background: 'none', border: 'none', cursor: 'pointer', color: C.teal }}><Menu size={26} /></button>
        </div>

        {/* ── MEGAMENÚ ── */}
        {openMenu && MEGA[openMenu] && (
          <div className="hide-md" style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#fff', borderTop: `1px solid ${C.border}`, boxShadow: '0 34px 60px -24px rgba(9,87,81,.28)', animation: 'menuDown .22s ease', zIndex: 55 }}>
            <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '30px 24px', display: 'grid', gridTemplateColumns: '1fr 1fr 310px', gap: 34 }}>
              {MEGA[openMenu].cols.map(col => (
                <div key={col.title}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: C.taupe, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 12 }}>{col.title}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {col.links.map(l => (
                      <button key={l.label} onClick={() => { openLink(l); setOpenMenu(null) }} className="menu-link" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '10px 12px', borderRadius: 11, transition: 'background .15s' }}>
                        <span>
                          <span style={{ display: 'block', fontSize: 14.5, fontWeight: 700, color: C.text }}>{l.label}</span>
                          <span style={{ display: 'block', fontSize: 12.5, color: C.taupe, marginTop: 1 }}>{l.desc}</span>
                        </span>
                        <ArrowRight className="ml-arrow" size={16} style={{ color: C.teal, opacity: 0, transform: 'translateX(-4px)', transition: 'all .18s', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ background: `linear-gradient(140deg, ${C.tealDeep}, ${C.tealSoft})`, borderRadius: 18, padding: '26px', color: '#fff', display: 'flex', flexDirection: 'column', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', top: -40, right: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(152,169,42,.25)', filter: 'blur(20px)' }} />
                <div style={{ position: 'relative' }}>
                  <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 8, letterSpacing: '-0.01em' }}>{MEGA[openMenu].promo.title}</div>
                  <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,.85)', lineHeight: 1.5, margin: '0 0 18px' }}>{MEGA[openMenu].promo.text}</p>
                  <button onClick={() => { setOpenMenu(null); scrollTo('calcula') }} className="btn-white" style={{ ...solid('#fff', C.teal), padding: '11px 22px', fontSize: 14 }}>Calcula tu seguro <ArrowRight size={16} /></button>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Mobile drawer */}
      {menuOpen && (
        <div className="drawer" onClick={() => setMenuOpen(false)}>
          <div className="drawer-panel" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <DKVLogo size={27} />
              <button onClick={() => setMenuOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.taupe }}><X size={24} /></button>
            </div>
            {['Cuadro médico', 'Calcula tu seguro'].map(label => (
              <a key={label} href="#" onClick={e => { e.preventDefault(); scrollTo(label === 'Cuadro médico' ? 'medico' : 'calcula') }} className="dkv-a" style={{ padding: '13px 0', borderBottom: `1px solid ${C.border}`, fontWeight: 600, color: C.text }}>{label}</a>
            ))}
            <div style={{ fontSize: 11, fontWeight: 800, color: C.taupe, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '16px 0 2px' }}>Seguros de salud</div>
            {PRODUCTS.map(p => (
              <button key={p.title} onClick={() => { setMenuOpen(false); goSeguro(p.title) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '12px 0', borderBottom: `1px solid ${C.border}`, background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: C.border, cursor: 'pointer', fontFamily: 'inherit', color: C.text, fontWeight: 600, fontSize: 14.5 }}>{p.title}<ArrowRight size={15} style={{ color: C.teal }} /></button>
            ))}
            <div style={{ fontSize: 11, fontWeight: 800, color: C.taupe, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '16px 0 2px' }}>Otros seguros</div>
            {OTHER.map(o => (
              <button key={o.title} onClick={() => { setMenuOpen(false); goSeguro(o.title) }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', textAlign: 'left', padding: '12px 0', borderBottom: `1px solid ${C.border}`, background: 'none', border: 'none', borderBottomWidth: 1, borderBottomStyle: 'solid', borderBottomColor: C.border, cursor: 'pointer', fontFamily: 'inherit', color: C.text, fontWeight: 600, fontSize: 14.5 }}>{o.title}<ArrowRight size={15} style={{ color: C.teal }} /></button>
            ))}
            <a href="tel:699669603" onClick={() => trackContact('phone')} className="dkv-a" style={{ padding: '14px 0 13px', fontWeight: 700, color: C.teal, display: 'flex', alignItems: 'center', gap: 8 }}><Phone size={16} /> 699 66 96 03</a>
            <a href="https://wa.me/34699669603?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20un%20seguro%20DKV" onClick={() => trackContact('whatsapp')} target="_blank" rel="noopener noreferrer" className="dkv-a" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: '#25D366', color: '#fff', borderRadius: 999, padding: '13px', fontWeight: 700, textDecoration: 'none', marginTop: 8 }}><MessageCircle size={17} /> Escríbenos por WhatsApp</a>
            <button onClick={() => scrollTo('calcula')} className="btn-red" style={{ ...solid(C.red), justifyContent: 'center', marginTop: 10 }}>Calcula tu seguro</button>
          </div>
        </div>
      )}

      <span id="top" />
      <main>
      {/* Breadcrumb */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}` }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '12px 24px', fontSize: 13.5, color: C.taupe }}>
          <a href="#" className="dkv-a" style={{ color: C.taupe }}>DKV Seguros</a>
          <span style={{ margin: '0 8px', opacity: 0.5 }}>›</span>
          <span style={{ color: C.teal, fontWeight: 600 }}>Particulares</span>
        </div>
      </div>

      {/* ═══ HERO ═══ */}
      <section style={{ position: 'relative', minHeight: 'clamp(580px,90vh,800px)', display: 'flex', alignItems: 'center', overflow: 'hidden', background: C.tealDeep }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${IMG.hero})`, backgroundSize: 'cover', backgroundPosition: 'center 22%', animation: 'kenburns 20s ease-out both' }} />
        <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, ${C.tealDeep} 0%, rgba(6,63,59,.94) 32%, rgba(9,87,81,.64) 60%, rgba(9,87,81,.12) 100%)` }} />
        <div style={{ position: 'absolute', top: -180, right: -120, width: 560, height: 560, borderRadius: '50%', background: 'rgba(152,169,42,.22)', filter: 'blur(45px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,.05) 1px,transparent 1px)', backgroundSize: '30px 30px', pointerEvents: 'none' }} />

        <div className="pad" style={{ position: 'relative', maxWidth: 1240, margin: '0 auto', padding: '0 24px', width: '100%', boxSizing: 'border-box', zIndex: 2 }}>
          <div className="hero-copy" style={{ maxWidth: 680, color: '#fff', padding: 'clamp(46px,12vw,96px) 0' }}>
            {kw && (
              <div className="h-rise" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 999, background: C.lime, color: '#fff', fontWeight: 700, fontSize: 14, marginBottom: 14 }}>
                <Search size={15} /> {kw.charAt(0).toUpperCase() + kw.slice(1)}
              </div>
            )}
            <div className="h-rise" style={{ display: 'inline-flex', alignItems: 'center', gap: 9, padding: '8px 16px', borderRadius: 999, background: 'rgba(255,255,255,.14)', border: '1px solid rgba(255,255,255,.24)', backdropFilter: 'blur(10px)', marginBottom: 26 }}>
              <span style={{ display: 'flex', gap: 1 }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f5a623" stroke="none" />)}</span>
              <span style={{ fontSize: 13.5, fontWeight: 700 }}>4,8 · +2 millones de asegurados en España</span>
            </div>
            <h1 className="h-rise d1" style={{ fontSize: 'clamp(33px,6.6vw,76px)', fontWeight: 800, lineHeight: 1.01, letterSpacing: '-0.042em', margin: '0 0 22px', textShadow: '0 4px 40px rgba(0,0,0,.3)' }}>
              {heroCopy?.h1 ?? <>Tu salud no espera<br />en <span style={{ color: C.lime }}>listas de espera</span></>}
            </h1>
            <p className="h-rise d2" style={{ fontSize: 'clamp(17px,2vw,21px)', fontWeight: 500, color: 'rgba(255,255,255,.9)', lineHeight: 1.55, margin: '0 0 38px', maxWidth: 560 }}>
              {heroCopy?.sub ?? <>Accede a la mejor medicina privada con DKV: <b style={{ color: '#fff' }}>+51.000 especialistas</b>, cobertura desde el primer día y hasta un <b style={{ color: C.lime }}>35% de descuento</b>.</>}
            </p>
            <div className="h-rise d3" style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 42 }}>
              <button onClick={() => scrollTo('calcula')} className="btn-red" style={{ ...solid(C.red), padding: '17px 36px', fontSize: 16.5, boxShadow: '0 18px 40px -12px rgba(221,54,54,.6)' }}>Calcula tu seguro <ArrowRight size={19} /></button>
              <a href="https://wa.me/34699669603?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20un%20seguro%20DKV" onClick={() => trackContact('whatsapp')} target="_blank" rel="noopener noreferrer" className="dkv-a" style={{ ...solid('#25D366'), padding: '17px 30px', fontSize: 16, textDecoration: 'none', boxShadow: '0 18px 40px -12px rgba(37,211,102,.55)' }}><MessageCircle size={19} /> Te informamos por WhatsApp</a>
              <button onClick={() => scrollTo('medico')} className="btn-glass" style={{ ...solid('rgba(255,255,255,.14)'), border: '1.5px solid rgba(255,255,255,.4)', backdropFilter: 'blur(10px)', padding: '16px 30px', fontSize: 16 }}>Ver cuadro médico</button>
            </div>
            <div className="h-rise d4" style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[{ end: 2, suf: 'M', pre: '+', l: 'Asegurados' }, { end: 51000, suf: '+', pre: '', l: 'Médicos y centros' }, { end: 50, suf: '', pre: '', l: 'Años de experiencia' }].map(s => (
                <div key={s.l} style={{ padding: '15px 24px', borderRadius: 16, background: 'rgba(255,255,255,.1)', border: '1px solid rgba(255,255,255,.18)', backdropFilter: 'blur(10px)', minWidth: 118 }}>
                  <div style={{ fontSize: 27, fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1 }}><CountUp end={s.end} suffix={s.suf} prefix={s.pre} /></div>
                  <div style={{ fontSize: 12.5, color: 'rgba(255,255,255,.7)', fontWeight: 600, marginTop: 6 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="seal hide-md" style={{ position: 'absolute', right: 'clamp(28px,7vw,130px)', top: '50%', width: 156, height: 156, borderRadius: '50%', background: `linear-gradient(135deg, ${C.lime}, ${C.limeDark})`, color: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 28px 60px -14px rgba(0,0,0,.55)', textAlign: 'center', border: '5px solid rgba(255,255,255,.92)', zIndex: 3 }}>
          <span style={{ fontSize: 14, fontWeight: 600, opacity: .95 }}>Hasta</span>
          <span style={{ fontSize: 52, fontWeight: 900, lineHeight: .95 }}>35%</span>
          <span style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.1em' }}>DTO.</span>
        </div>

        {/* Tarjeta flotante de reseña (social proof, solo escritorio) */}
        <div className="hide-md" style={{ position: 'absolute', bottom: 42, right: 'clamp(28px,7vw,130px)', width: 258, background: 'rgba(255,255,255,.13)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,.22)', borderRadius: 18, padding: '16px 18px', zIndex: 3, boxShadow: '0 24px 60px -22px rgba(0,0,0,.55)', animation: 'floatUp 5s ease-in-out infinite' }}>
          <div style={{ display: 'flex', gap: 2, marginBottom: 9 }}>{[...Array(5)].map((_, i) => <Star key={i} size={14} fill="#f5a623" stroke="none" />)}</div>
          <p style={{ fontSize: 13.5, color: '#fff', lineHeight: 1.5, margin: '0 0 12px', fontWeight: 500 }}>«Me llamaron al día siguiente. Sin letra pequeña y todo clarísimo.»</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/images/avatar-mujer-1.jpg" alt="Laura P." loading="lazy" style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,.3)' }} />
            <div style={{ lineHeight: 1.2 }}>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: '#fff' }}>Laura P.</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,.65)' }}>Madrid · Cliente DKV</div>
            </div>
          </div>
        </div>
      </section>

      {/* Sub-hero action band */}
      <div style={{ background: C.cream, borderBottom: `1px solid ${C.border}` }}>
        <div className="pad band-col" style={{ maxWidth: 1240, margin: '0 auto', padding: '16px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 17, fontWeight: 800, color: C.teal, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Sparkles size={18} style={{ color: C.lime }} /> Calcula tu seguro médico en 1 minuto</span>
          <div style={{ display: 'flex', gap: 12 }}>
            <button onClick={() => scrollTo('calcula')} className="btn-red" style={solid(C.red)}>Calcula tu seguro</button>
            <button onClick={() => scrollTo('medico')} className="btn-teal" style={solid(C.teal)}>Cuadro médico</button>
          </div>
        </div>
      </div>

      {/* ═══ SELLOS DE CONFIANZA ═══ */}
      <div style={{ background: '#fff', borderBottom: `1px solid ${C.border}` }}>
        <div className="pad trust-row" style={{ maxWidth: 1240, margin: '0 auto', padding: '22px 24px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 'clamp(18px,4vw,52px)', flexWrap: 'wrap' }}>
          {[
            { icon: ShieldCheck, t: 'Datos protegidos (RGPD)' },
            { icon: Check, t: 'Sin permanencia' },
            { icon: Clock, t: 'Respuesta en menos de 24 h' },
            { icon: Award, t: '50 años de experiencia' },
            { icon: Star, t: '4,8 ★ en Google' },
          ].map(({ icon: Ic, t }) => (
            <span key={t} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, fontSize: 14, fontWeight: 700, color: C.taupe, whiteSpace: 'nowrap' }}>
              <span style={{ width: 30, height: 30, borderRadius: 9, background: C.cream, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Ic size={16} style={{ color: C.teal }} /></span>{t}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ BENEFICIOS ═══ */}
      <section className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,84px) 24px' }}>
        <Reveal>
          <h2 style={{ textAlign: 'center', fontSize: 'clamp(23px,4vw,38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '0 0 12px' }}>¿Por qué elegir un seguro médico con DKV?</h2>
          <p style={{ textAlign: 'center', fontSize: 17, color: C.taupe, maxWidth: 620, margin: '0 auto 56px' }}>Más de 50 años cuidando la salud de las familias españolas con la mejor cobertura médica.</p>
        </Reveal>
        <div className="g4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {BENEFITS.map(({ icon: Icon, title, desc }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="card bcard" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: 'clamp(24px,5.5vw,34px) clamp(20px,5vw,26px)', textAlign: 'center', height: '100%', boxSizing: 'border-box', transition: 'transform .2s, box-shadow .2s, border-color .2s', boxShadow: '0 2px 14px rgba(0,0,0,.03)' }}>
                <div className="bcard-ic" style={{ width: 74, height: 74, borderRadius: 20, background: `linear-gradient(135deg, ${C.cream}, #e6efe8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', flexShrink: 0 }}>
                  <Icon size={32} style={{ color: C.teal }} strokeWidth={1.8} />
                </div>
                <div className="bcard-txt">
                  <h3 style={{ fontSize: 18.5, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>{title}</h3>
                  <p style={{ fontSize: 14.5, color: C.taupe, lineHeight: 1.6, margin: 0 }}>{desc}</p>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ MARQUEE ESPECIALIDADES ═══ */}
      <div className="marquee-wrap" style={{ background: `linear-gradient(90deg, ${C.tealDeep}, ${C.teal})`, overflow: 'hidden', padding: '15px 0' }}>
        <div className="marquee-track">
          {[...SPECIALTIES, ...SPECIALTIES].map((s, i) => (
            <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 11, padding: '0 26px', color: 'rgba(255,255,255,.9)', fontSize: 16, fontWeight: 700, whiteSpace: 'nowrap' }}>
              <HeartPulse size={16} style={{ color: C.lime }} /> {s}
            </span>
          ))}
        </div>
      </div>

      {/* ═══ CALCULADORA (form → Supabase) ═══ */}
      <section id="calcula" style={{ background: `linear-gradient(140deg, ${C.tealDeep} 0%, ${C.teal} 55%, ${C.tealSoft} 100%)`, color: '#fff', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -140, right: -120, width: 520, height: 520, borderRadius: '50%', background: 'rgba(152,169,42,.16)', filter: 'blur(20px)', pointerEvents: 'none' }} />
        <div className="pad g2" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,76px) 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 56, alignItems: 'center', position: 'relative' }}>
          <Reveal>
            <span style={{ display: 'inline-block', background: C.lime, color: '#fff', fontSize: 12.5, fontWeight: 800, letterSpacing: '0.06em', padding: '6px 14px', borderRadius: 999, marginBottom: 18 }}>PROMO HASTA -35%</span>
            <h2 style={{ fontSize: 'clamp(25px,4.4vw,42px)', fontWeight: 800, lineHeight: 1.08, letterSpacing: '-0.025em', margin: '0 0 16px' }}>Calcula el precio de tu seguro médico</h2>
            <p style={{ fontSize: 17.5, color: 'rgba(255,255,255,.85)', lineHeight: 1.6, margin: '0 0 28px', maxWidth: 440 }}>En menos de un minuto tendrás el precio de tu seguro DKV personalizado. Un asesor te llama sin compromiso.</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {['Precio inmediato y sin compromiso', 'Cobertura desde el primer día', 'Descuento de hasta el 35%'].map(t => (
                <li key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 16 }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: C.lime, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={15} color="#fff" strokeWidth={3} /></span>{t}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal delay={0.1}>
            <form onSubmit={handleSubmit} onFocus={onFormFocus} style={{ background: '#fff', borderRadius: 22, padding: '32px 30px', color: C.text, boxShadow: '0 40px 90px -30px rgba(0,0,0,.55)' }}>
              <h3 style={{ fontSize: 22, fontWeight: 800, color: C.teal, margin: '0 0 4px' }}>Calcula tu seguro</h3>
              <p style={{ fontSize: 13.5, color: C.taupe, margin: '0 0 14px' }}>Rellena tus datos y te llamamos gratis.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.cream, color: C.teal, borderRadius: 999, padding: '6px 13px', fontSize: 11.5, fontWeight: 800, marginBottom: 20, letterSpacing: '0.02em' }}><Clock size={13} /> Solo 30 segundos · Sin compromiso</div>

              <Field label="¿Qué seguro te interesa?">
                <div style={{ position: 'relative' }}>
                  <ShieldCheck size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'interes' ? C.teal : '#9aaba5', pointerEvents: 'none', zIndex: 1 }} />
                  <select className="in" value={interesSel} onChange={e => setInteresSel(e.target.value)} style={{ ...inputStyle(focus === 'interes'), paddingLeft: 42, appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer' }} onFocus={() => setFocus('interes')} onBlur={() => setFocus(null)}>
                    <option value="">Elige tu seguro (orientativo)</option>
                    {Object.keys(PRICES).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>
              </Field>

              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: '#e9f1ec', border: '1px solid #cfe0d7', margin: '14px 0 4px' }}>
                <Sparkles size={15} style={{ color: C.lime }} />
                <span style={{ fontSize: 13.5, fontWeight: 800, color: C.teal }}>Precio orientativo: desde {PRICES[interesSel] || '9€/mes'}</span>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: C.taupe }}>· sin compromiso</span>
              </div>
              <p style={{ fontSize: 11, color: C.taupe, margin: '0 0 16px' }}>Precio orientativo y no vinculante. Recibirás tu cálculo personalizado sin compromiso.</p>

              <p style={{ fontSize: 12.5, color: C.taupe, margin: '0 0 16px' }}>¿Prefieres hablar ahora? <a href="https://wa.me/34699669603?text=Hola,%20quiero%20informaci%C3%B3n%20sobre%20un%20seguro%20DKV" onClick={() => trackContact('whatsapp')} target="_blank" rel="noopener noreferrer" style={{ color: '#128C4B', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}><MessageCircle size={13} /> Escríbenos por WhatsApp</a></p>

              {error &&<div style={{ marginBottom: 16, padding: '11px 14px', borderRadius: 12, background: '#fef0ed', border: '1px solid #fbd4cb', color: C.redDark, fontSize: 13, fontWeight: 500 }}>{error}</div>}

              <Field label="Nombre completo *">
                <div style={{ position: 'relative' }}>
                  <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'nombre' ? C.teal : '#9aaba5', pointerEvents: 'none' }} />
                  <input className="in" value={form.nombre} onChange={e => set('nombre', e.target.value)} placeholder="María García" style={{ ...inputStyle(focus === 'nombre'), paddingLeft: 42 }} onFocus={() => setFocus('nombre')} onBlur={() => setFocus(null)} />
                </div>
              </Field>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, margin: '14px 0' }}>
                <Field label="Código postal *">
                  <div style={{ position: 'relative' }}>
                    <MapPin size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'cp' ? C.teal : '#9aaba5', pointerEvents: 'none' }} />
                    <input className="in" value={form.cp} onChange={e => set('cp', e.target.value.replace(/\D/g, '').slice(0, 5))} placeholder="28001" inputMode="numeric" style={{ ...inputStyle(focus === 'cp'), paddingLeft: 42 }} onFocus={() => setFocus('cp')} onBlur={() => setFocus(null)} />
                  </div>
                </Field>
                <Field label="Teléfono *">
                  <div style={{ position: 'relative' }}>
                    <Phone size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'tel' ? C.teal : '#9aaba5', pointerEvents: 'none' }} />
                    <input className="in" value={form.telefono} onChange={e => set('telefono', e.target.value.replace(/[^\d+\s]/g, '').slice(0, 15))} placeholder="600 000 000" inputMode="tel" style={{ ...inputStyle(focus === 'tel'), paddingLeft: 40 }} onFocus={() => setFocus('tel')} onBlur={() => setFocus(null)} />
                  </div>
                </Field>
              </div>
              <Field label="Correo electrónico (opcional)">
                <div style={{ position: 'relative' }}>
                  <AtSign size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: focus === 'email' ? C.teal : '#9aaba5', pointerEvents: 'none' }} />
                  <input className="in" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="tu@correo.com" style={{ ...inputStyle(focus === 'email'), paddingLeft: 42 }} onFocus={() => setFocus('email')} onBlur={() => setFocus(null)} />
                </div>
              </Field>

              <label style={{ display: 'flex', gap: 9, alignItems: 'flex-start', fontSize: 12.5, color: C.taupe, lineHeight: 1.5, margin: '18px 0 18px', cursor: 'pointer' }}>
                <input type="checkbox" checked={accept} onChange={e => { setAccept(e.target.checked); setError('') }} style={{ marginTop: 2, accentColor: C.teal, width: 16, height: 16, flexShrink: 0 }} />
                He leído y acepto la <a href="/dkv/privacidad" target="_blank" rel="noopener noreferrer" style={{ color: C.teal, fontWeight: 600 }}>política de privacidad</a> y el tratamiento de mis datos.
              </label>

              <button type="submit" disabled={sending} className="btn-red" style={{ ...solid(sending ? C.taupe : C.red), width: '100%', justifyContent: 'center', padding: '16px', fontSize: 16, cursor: sending ? 'wait' : 'pointer', boxShadow: sending ? 'none' : '0 14px 30px -10px rgba(221,54,54,.5)' }}>
                {sending ? <><Loader2 size={18} className="spin" /> Enviando…</> : <>Calcula tu seguro <ArrowRight size={18} /></>}
              </button>
              <p style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center', fontSize: 11.5, color: C.taupe, margin: '12px 0 0' }}><ShieldCheck size={13} style={{ color: C.teal }} /> Datos protegidos · Sin spam · Sin compromiso</p>
            </form>
          </Reveal>
        </div>
      </section>

      {/* ═══ ENCUENTRA MÉDICO ═══ */}
      <section id="medico" className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,72px) 24px' }}>
        <Reveal>
          <div className="g2" style={{ background: `linear-gradient(120deg, ${C.cream}, #eef1e0)`, borderRadius: 24, overflow: 'hidden', display: 'grid', gridTemplateColumns: '0.85fr 1.15fr', alignItems: 'stretch' }}>
            <div style={{ minHeight: 240, backgroundImage: `url(${IMG.network})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />
            <div style={{ padding: '44px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 52, height: 52, borderRadius: 15, background: '#fff', boxShadow: '0 10px 26px -12px rgba(9,87,81,.4)', marginBottom: 16 }}><Search size={26} style={{ color: C.teal }} /></div>
                <h2 style={{ fontSize: 27, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: '-0.02em' }}>Encuentra a tu médico DKV</h2>
                <p style={{ fontSize: 15.5, color: C.taupe, margin: 0, maxWidth: 460 }}>Busca entre más de 51.000 profesionales y 1.000 centros médicos concertados por toda España.</p>
              </div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <button onClick={() => scrollTo('calcula')} className="btn-teal" style={solid(C.teal)}>Soy cliente DKV</button>
                <button onClick={() => scrollTo('calcula')} className="btn-out" style={{ ...outline(C.teal), background: '#fff' }}>No tengo seguro DKV</button>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ═══ PRODUCTOS ═══ */}
      <section style={{ background: C.grayBg }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,84px) 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 56 }}>
              <Kicker><ShieldCheck size={14} /> Nuestras modalidades</Kicker>
              <h2 style={{ fontSize: 'clamp(23px,4vw,38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '16px 0 12px' }}>Seguros médicos pensados para ti</h2>
              <p style={{ fontSize: 17, color: C.taupe, maxWidth: 560, margin: '0 auto' }}>Elige la modalidad que mejor se adapte a tu forma de cuidarte.</p>
            </div>
          </Reveal>
          <div className="g4 mcarousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 22 }}>
            {PRODUCTS.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07}>
                <div className="card" style={{ background: '#fff', borderRadius: 20, border: `1px solid ${p.featured ? C.lime : C.border}`, display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%', boxSizing: 'border-box', transition: 'transform .2s, box-shadow .2s, border-color .2s', boxShadow: p.featured ? '0 18px 40px -22px rgba(152,169,42,.5)' : '0 2px 12px rgba(0,0,0,.03)' }}>
                  <div className="zoomimg" style={{ height: 132, position: 'relative', backgroundImage: `linear-gradient(180deg, rgba(9,87,81,.05), rgba(9,87,81,.42)), url(${DETAIL_IMG[p.title] || IMG.network})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    {p.promo && <span style={{ position: 'absolute', top: 12, left: 12, background: C.red, color: '#fff', fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999 }}>¡PROMO {p.promo}!</span>}
                    {p.featured && <span style={{ position: 'absolute', top: 12, right: 12, fontSize: 10.5, fontWeight: 800, color: C.limeDark, background: 'rgba(255,255,255,.94)', padding: '4px 10px', borderRadius: 999 }}>MÁS ELEGIDO</span>}
                  </div>
                  <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: 19, fontWeight: 800, color: C.teal, margin: '0 0 10px', lineHeight: 1.2 }}>{p.title}</h3>
                    <p style={{ fontSize: 14, color: C.taupe, lineHeight: 1.6, margin: '0 0 14px', flex: 1 }}>{p.desc}</p>
                    {PRICES[p.title] && <div style={{ fontSize: 13, color: C.taupe, fontWeight: 600, marginBottom: 14 }}>Desde <b style={{ color: C.teal, fontSize: 19, fontWeight: 900 }}>{PRICES[p.title]}</b></div>}
                    <button onClick={() => goSeguro(p.title)} className="dkv-a" style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6, color: C.teal, fontWeight: 800, fontSize: 14.5, alignSelf: 'flex-start' }}>Más información <ArrowRight size={15} className="card-arrow" /></button>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ OTROS SEGUROS ═══ */}
      <section className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,84px) 24px' }}>
        <Reveal>
          <div style={{ marginBottom: 38 }}>
            <Kicker><Sparkles size={14} /> Más protección</Kicker>
            <h2 style={{ fontSize: 'clamp(22px,3.8vw,34px)', fontWeight: 800, color: C.text, letterSpacing: '-0.02em', margin: '16px 0 0' }}>Otros seguros para cuidar lo que importa</h2>
          </div>
        </Reveal>
        <div className="g4 mcarousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 22 }}>
          {OTHER.map((o, i) => {
            const Icon = o.icon
            return (
              <Reveal key={o.title} delay={i * 0.07}>
                <button onClick={() => goSeguro(o.title)} className="card dkv-a" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', display: 'flex', flexDirection: 'column', textAlign: 'left', width: '100%', cursor: 'pointer', fontFamily: 'inherit', height: '100%', boxSizing: 'border-box', transition: 'transform .2s, box-shadow .2s, border-color .2s', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
                  <div style={{ height: 122, position: 'relative', backgroundImage: `linear-gradient(180deg, rgba(9,87,81,.04), rgba(9,87,81,.32)), url(${DETAIL_IMG[o.title] || IMG.network})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <div style={{ position: 'absolute', bottom: -21, left: 20, width: 46, height: 46, borderRadius: 13, background: '#fff', boxShadow: '0 8px 20px -6px rgba(9,87,81,.35)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon size={23} style={{ color: C.teal }} strokeWidth={2} /></div>
                  </div>
                  <div style={{ padding: '32px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: '0 0 8px' }}>{o.title}</h3>
                    <p style={{ fontSize: 14, color: C.taupe, lineHeight: 1.55, margin: '0 0 12px', flex: 1 }}>{o.desc}</p>
                    {PRICES[o.title] && <div style={{ fontSize: 12.5, color: C.taupe, fontWeight: 600, marginBottom: 14 }}>Desde <b style={{ color: C.teal, fontSize: 17, fontWeight: 900 }}>{PRICES[o.title]}</b></div>}
                    <span style={{ color: C.teal, fontWeight: 800, fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Ver más <ArrowRight size={14} className="card-arrow" /></span>
                  </div>
                </button>
              </Reveal>
            )
          })}
        </div>
      </section>

      {/* ═══ TESTIMONIOS ═══ */}
      <section style={{ background: C.grayBg }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,88px) 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 52 }}>
              <Kicker><Star size={13} fill={C.teal} stroke="none" /> Opiniones reales</Kicker>
              <h2 style={{ fontSize: 'clamp(28px,3.4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '16px 0 12px' }}>Lo que dicen nuestros asegurados</h2>
              <p style={{ fontSize: 17, color: C.taupe, maxWidth: 540, margin: '0 auto 22px' }}>Miles de familias ya viven su salud sin listas de espera. Estas son algunas de sus historias.</p>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, background: '#fff', border: `1px solid ${C.border}`, borderRadius: 999, padding: '10px 20px', boxShadow: '0 10px 30px -18px rgba(9,87,81,.4)' }}>
                <svg width="22" height="22" viewBox="0 0 48 48" style={{ flexShrink: 0 }}><path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17z"/><path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46z"/><path fill="#FBBC05" d="M11.69 28.18C11.25 26.86 11 25.45 11 24s.25-2.86.69-4.18v-5.7H4.34C2.85 17.09 2 20.45 2 24s.85 6.91 2.34 9.88l7.35-5.7z"/><path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07z"/></svg>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <b style={{ fontSize: 17, color: C.text }}>4,8</b>
                    <span style={{ display: 'flex', gap: 1 }}>{[...Array(5)].map((_, i) => <Star key={i} size={13} fill="#f5a623" stroke="none" />)}</span>
                  </span>
                  <span style={{ fontSize: 12, color: C.taupe, fontWeight: 600 }}>+2.000 opiniones en Google</span>
                </div>
              </div>
            </div>
          </Reveal>
          <div className="g3 mcarousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
            {TESTIMONIALS.map((t, i) => (
              <Reveal key={t.name} delay={i * 0.09}>
                <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 22, padding: '34px 30px', height: '100%', boxSizing: 'border-box', position: 'relative', boxShadow: '0 12px 40px -28px rgba(9,87,81,.35)' }}>
                  <Quote size={40} style={{ color: C.lime, opacity: 0.35, marginBottom: 8 }} fill={C.lime} />
                  <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>{[...Array(5)].map((_, k) => <Star key={k} size={17} fill="#f5a623" stroke="none" />)}</div>
                  <p style={{ fontSize: 15.5, color: C.text, lineHeight: 1.65, fontWeight: 500, margin: '0 0 26px' }}>“{t.text}”</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 13, borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={t.photo} alt={t.name} loading="lazy" style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0, border: `2px solid ${C.cream}` }} />
                    <div>
                      <div style={{ fontSize: 14.5, fontWeight: 800, color: C.text }}>{t.name}</div>
                      <div style={{ fontSize: 12.5, color: C.taupe }}>{t.city} · {t.since}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ¿YA TIENES SEGURO? ═══ */}
      <section style={{ color: '#fff', position: 'relative', overflow: 'hidden', backgroundImage: `linear-gradient(120deg, rgba(152,169,42,.94), rgba(124,140,31,.9)), url(${IMG.doctor})`, backgroundSize: 'cover', backgroundPosition: 'center 30%' }}>
        <div style={{ position: 'absolute', top: -80, left: '40%', width: 360, height: 360, borderRadius: '50%', background: 'rgba(255,255,255,.1)', pointerEvents: 'none' }} />
        <div className="pad band-col" style={{ maxWidth: 1240, margin: '0 auto', padding: '58px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 30, flexWrap: 'wrap', position: 'relative' }}>
          <div style={{ maxWidth: 640 }}>
            <h2 style={{ fontSize: 'clamp(22px,3.8vw,34px)', fontWeight: 800, margin: '0 0 10px', letterSpacing: '-0.02em' }}>¿Ya tienes un seguro de salud?</h2>
            <p style={{ fontSize: 17, color: 'rgba(255,255,255,.92)', margin: 0, lineHeight: 1.5 }}>Cámbiate a DKV y mantén tu antigüedad. Te ponemos fácil el traspaso sin perder coberturas.</p>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <button onClick={() => scrollTo('calcula')} className="btn-white" style={solid('#fff', C.limeDark)}>Más información</button>
            <a href="tel:699669603" onClick={() => trackContact('phone')} className="btn-out-w dkv-a" style={{ ...outline('#fff'), borderColor: 'rgba(255,255,255,.75)' }}><Phone size={16} /> 699 66 96 03</a>
          </div>
        </div>
      </section>

      {/* ═══ MÉDICOS Y CENTROS PROPIOS ═══ */}
      <section className="pad hide-mobile" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,84px) 24px' }}>
        <div className="g2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 54, alignItems: 'center' }}>
          <Reveal style={{ borderRadius: 24, overflow: 'hidden' }}>
            <div style={{ minHeight: 380, backgroundImage: `url(${IMG.network})`, backgroundSize: 'cover', backgroundPosition: 'center', boxShadow: '0 30px 60px -30px rgba(9,87,81,.4)' }} />
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{ fontSize: 'clamp(22px,3.8vw,34px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '0 0 18px', lineHeight: 1.15 }}>Médicos, centros y espacios de salud propios</h2>
            <p style={{ fontSize: 16, color: C.taupe, lineHeight: 1.65, margin: '0 0 30px' }}>Más de 51.000 profesionales y 1.000 centros médicos concertados, además de 23 centros propios y el DKV Health Club para cuidarte de forma integral.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 22 }}>
              {[
                { end: 51000, suffix: '+', l: 'Médicos y profesionales' },
                { end: 1000, suffix: '+', l: 'Centros médicos' },
                { end: 23, suffix: '', l: 'Centros propios DKV' },
                { end: 24, suffix: 'h', l: 'Videoconsulta online' },
              ].map(s => (
                <div key={s.l} style={{ borderLeft: `3px solid ${C.lime}`, paddingLeft: 16 }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.teal, letterSpacing: '-0.02em' }}><CountUp end={s.end} suffix={s.suffix} /></div>
                  <div style={{ fontSize: 13.5, color: C.taupe, fontWeight: 600 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ DKV EN CIFRAS (gráficos animados) ═══ */}
      <section className="hide-mobile" style={{ background: `linear-gradient(180deg, #fff, ${C.grayBg})`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ opacity: 0.25 }}><PulseLine height={54} /></div>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 24px 88px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.teal, fontWeight: 800, fontSize: 13.5, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                <Activity size={16} /> Datos que nos avalan
              </span>
            </div>
            <h2 style={{ textAlign: 'center', fontSize: 'clamp(23px,4vw,38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '0 0 12px' }}>DKV en cifras</h2>
            <p style={{ textAlign: 'center', fontSize: 17, color: C.taupe, maxWidth: 560, margin: '0 auto 52px' }}>La diferencia de la medicina privada frente a las listas de espera, en números reales.</p>
          </Reveal>

          <div className="g2 mcarousel" style={{ display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 26, marginBottom: 26 }}>
            {/* Donut card */}
            <Reveal>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: 'clamp(26px,5.5vw,36px) clamp(22px,5vw,30px)', height: '100%', boxSizing: 'border-box', boxShadow: '0 20px 50px -32px rgba(9,87,81,.35)', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 22 }}>
                  <ThumbsUp size={19} style={{ color: C.lime }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Satisfacción de clientes</h3>
                </div>
                <Donut pct={98} label="Clientes satisfechos" sub="Renuevan cada año con DKV" />
                <div style={{ display: 'flex', gap: 30, marginTop: 28 }}>
                  {[{ e: 4.8, d: 1, s: '', l: 'Valoración Google' }, { e: 50, s: '', l: 'Años de experiencia' }].map(x => (
                    <div key={x.l} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 26, fontWeight: 900, color: C.teal }}><CountUp end={x.e} decimals={x.d || 0} suffix={x.s} /></div>
                      <div style={{ fontSize: 12.5, color: C.taupe, fontWeight: 600 }}>{x.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* Bars card */}
            <Reveal delay={0.1}>
              <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: '36px 34px', height: '100%', boxSizing: 'border-box', boxShadow: '0 20px 50px -32px rgba(9,87,81,.35)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Timer size={19} style={{ color: C.lime }} />
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Tiempo medio de espera</h3>
                </div>
                <p style={{ fontSize: 13.5, color: C.taupe, margin: '0 0 26px' }}>Días hasta ser atendido — DKV vs. media de la sanidad pública.</p>
                <Bars rows={[
                  { label: 'Cita con especialista', dkv: 3, otro: 45 },
                  { label: 'Pruebas diagnósticas', dkv: 5, otro: 68 },
                  { label: 'Cirugía no urgente', dkv: 14, otro: 121 },
                ]} />
              </div>
            </Reveal>
          </div>

          {/* Count-up pills */}
          <div className="g4 stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 20 }}>
            {[
              { icon: Heart, end: 2, dec: 0, suf: 'M+', l: 'Asegurados en España' },
              { icon: Stethoscope, end: 51000, suf: '+', l: 'Médicos y profesionales' },
              { icon: HeartPulse, end: 24, suf: 'h', l: 'Urgencias y orientación' },
              { icon: TrendingUp, end: 98, suf: '%', l: 'Renovación de pólizas' },
            ].map(({ icon: Icon, end, dec, suf, l }, i) => (
              <Reveal key={l} delay={i * 0.07}>
                <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 18, padding: '24px 22px', textAlign: 'center', height: '100%', boxSizing: 'border-box' }}>
                  <div style={{ width: 50, height: 50, borderRadius: 14, background: `linear-gradient(135deg, ${C.cream}, #e6efe8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}><Icon size={24} style={{ color: C.teal }} /></div>
                  <div style={{ fontSize: 30, fontWeight: 900, color: C.teal, letterSpacing: '-0.02em' }}><CountUp end={end} decimals={dec || 0} suffix={suf} /></div>
                  <div style={{ fontSize: 13, color: C.taupe, fontWeight: 600, marginTop: 4 }}>{l}</div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.1}>
            <div style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 24, padding: '30px 32px 24px', marginTop: 26, boxShadow: '0 20px 50px -32px rgba(9,87,81,.35)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <TrendingUp size={19} style={{ color: C.lime }} />
                <h3 style={{ fontSize: 18, fontWeight: 800, color: C.text, margin: 0 }}>Crecimiento de asegurados</h3>
              </div>
              <p style={{ fontSize: 13.5, color: C.taupe, margin: '0 0 18px' }}>Millones de personas que confían en DKV, año tras año.</p>
              <AreaChart />
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ APP ACTIVA DKV ═══ */}
      <section className="hide-mobile" style={{ background: `linear-gradient(135deg, ${C.cream}, #fff)` }}>
        <div className="pad g2" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,76px) 24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 54, alignItems: 'center' }}>
          <Reveal>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, color: C.teal, fontWeight: 800, fontSize: 13.5, letterSpacing: '0.05em', textTransform: 'uppercase', marginBottom: 14 }}><Smartphone size={16} /> App Activa DKV</span>
            <h2 style={{ fontSize: 'clamp(23px,4vw,38px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '0 0 20px', lineHeight: 1.1 }}>Tu seguro siempre contigo</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 30 }}>
              {['Busca médicos y centros cercanos', 'Tarjeta de seguro digital', 'Gestiona tus autorizaciones', 'Videoconsulta y coach de salud'].map(t => (
                <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 15.5, color: C.text, fontWeight: 500 }}>
                  <span style={{ width: 24, height: 24, borderRadius: '50%', background: C.teal, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={14} color="#fff" strokeWidth={3} /></span>{t}
                </div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <StoreBadge top="Descárgala en" bottom="Google Play" />
              <StoreBadge top="Disponible en" bottom="App Store" />
            </div>
          </Reveal>
          <Reveal delay={0.1} style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 250, height: 500, borderRadius: 40, background: `linear-gradient(160deg, ${C.teal}, ${C.tealDeep})`, padding: 13, boxShadow: '0 40px 80px -26px rgba(9,87,81,.55)' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: 28, background: '#fff', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 26, textAlign: 'center' }}>
                <div style={{ width: 68, height: 68, borderRadius: 20, background: `linear-gradient(135deg, ${C.lime}, ${C.limeDark})`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Heart size={34} color="#fff" fill="#fff" /></div>
                <DKVLogo size={26} />
                <div style={{ fontSize: 13, color: C.taupe, fontWeight: 600 }}>Activa DKV</div>
                <div style={{ display: 'flex', gap: 5, marginTop: 6 }}>{[...Array(5)].map((_, i) => <Star key={i} size={16} fill="#f5a623" stroke="none" />)}</div>
                <div style={{ fontSize: 12, color: C.taupe }}>4,8 · +1M descargas</div>
                <button onClick={() => scrollTo('calcula')} className="btn-teal" style={{ ...solid(C.teal), padding: '10px 22px', fontSize: 13.5, marginTop: 8 }}>Empezar</button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ BLOG ═══ */}
      <section id="blog" className="pad hide-mobile" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,88px) 24px' }}>
        <Reveal>
          <div className="band-col" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, flexWrap: 'wrap', marginBottom: 48 }}>
            <div>
              <Kicker><Feather size={14} /> Blog de salud</Kicker>
              <h2 style={{ fontSize: 'clamp(28px,3.4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '16px 0 8px' }}>Aprende a cuidarte mejor</h2>
              <p style={{ fontSize: 17, color: C.taupe, margin: 0, maxWidth: 520 }}>Consejos, comparativas y todo lo bueno de tener un seguro de salud.</p>
            </div>
            <button onClick={() => scrollTo('calcula')} className="btn-out" style={outline(C.teal)}>Ver todos los artículos <ArrowRight size={16} /></button>
          </div>
        </Reveal>
        <div className="g4 mcarousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 24 }}>
          {ARTICLES.map((a, i) => (
            <Reveal key={a.title} delay={i * 0.07}>
              <button onClick={() => goArticle(a.title)} className="card dkv-a" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', padding: 0, boxSizing: 'border-box', boxShadow: '0 2px 12px rgba(0,0,0,.03)', transition: 'transform .2s, box-shadow .2s, border-color .2s' }}>
                <div className="zoomimg" style={{ height: 168, backgroundImage: `url(${a.img})`, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', flexShrink: 0 }}>
                  <span style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(255,255,255,.94)', color: C.teal, fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, backdropFilter: 'blur(4px)' }}>{a.category}</span>
                </div>
                <div style={{ padding: '20px 22px 24px', display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <div style={{ fontSize: 12, color: C.taupe, marginBottom: 9, display: 'flex', gap: 7 }}><span>{a.date}</span><span>·</span><span>{a.read} lectura</span></div>
                  <h3 style={{ fontSize: 16.5, fontWeight: 800, color: C.text, lineHeight: 1.3, margin: '0 0 10px' }}>{a.title}</h3>
                  <p style={{ fontSize: 13.5, color: C.taupe, lineHeight: 1.55, margin: '0 0 16px', flex: 1 }}>{a.excerpt}</p>
                  <span style={{ color: C.teal, fontWeight: 800, fontSize: 13.5, display: 'inline-flex', alignItems: 'center', gap: 5 }}>Leer más <ArrowRight size={14} className="card-arrow" /></span>
                </div>
              </button>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section className="hide-mobile" style={{ background: C.grayBg, borderTop: `1px solid ${C.border}` }}>
        <div className="pad" style={{ maxWidth: 820, margin: '0 auto', padding: 'clamp(50px,11vw,88px) 24px' }}>
          <Reveal>
            <div style={{ textAlign: 'center', marginBottom: 44 }}>
              <Kicker><MessageCircle size={14} /> Dudas frecuentes</Kicker>
              <h2 style={{ fontSize: 'clamp(28px,3.4vw,40px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '16px 0 0' }}>Resolvemos tus dudas</h2>
            </div>
          </Reveal>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {FAQS.map((f, i) => {
              const open = faq === i
              return (
                <Reveal key={f.q} delay={i * 0.05}>
                  <div style={{ background: '#fff', border: `1.5px solid ${open ? C.teal : C.border}`, borderRadius: 16, overflow: 'hidden', transition: 'border-color .2s', boxShadow: open ? '0 14px 40px -26px rgba(9,87,81,.4)' : 'none' }}>
                    <button onClick={() => setFaq(open ? null : i)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '20px 24px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left' }}>
                      <span style={{ fontSize: 16, fontWeight: 700, color: open ? C.teal : C.text }}>{f.q}</span>
                      <span style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: open ? C.teal : '#eef1ea', color: open ? '#fff' : C.teal, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s' }}>{open ? <Minus size={17} /> : <Plus size={17} />}</span>
                    </button>
                    <div style={{ display: 'grid', gridTemplateRows: open ? '1fr' : '0fr', transition: 'grid-template-rows .32s cubic-bezier(.22,1,.36,1)' }}>
                      <div style={{ overflow: 'hidden' }}>
                        <p style={{ fontSize: 15, color: C.taupe, lineHeight: 1.68, margin: 0, padding: '0 24px 22px' }}>{f.a}</p>
                      </div>
                    </div>
                  </div>
                </Reveal>
              )
            })}
          </div>
          <Reveal>
            <div style={{ textAlign: 'center', marginTop: 40 }}>
              <p style={{ fontSize: 15, color: C.taupe, margin: '0 0 16px' }}>¿No encuentras lo que buscas?</p>
              <button onClick={() => scrollTo('calcula')} className="btn-teal" style={{ ...solid(C.teal), margin: '0 auto' }}>Habla con un asesor gratis <ArrowRight size={17} /></button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══ ¿NECESITAS AYUDA? ═══ */}
      <section id="contacto" className="pad hide-mobile" style={{ maxWidth: 1240, margin: '0 auto', padding: 'clamp(50px,11vw,84px) 24px' }}>
        <Reveal><h2 style={{ textAlign: 'center', fontSize: 'clamp(22px,3.8vw,34px)', fontWeight: 800, color: C.text, letterSpacing: '-0.025em', margin: '0 0 48px' }}>¿Necesitas ayuda?</h2></Reveal>
        <div className="g3 mcarousel" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24 }}>
          {HELP.map(({ icon: Icon, title, desc, cta, action }, i) => (
            <Reveal key={title} delay={i * 0.08}>
              <div className="card" style={{ background: '#fff', border: `1px solid ${C.border}`, borderRadius: 20, padding: 'clamp(26px,5.5vw,36px) clamp(22px,5vw,30px)', textAlign: 'center', height: '100%', boxSizing: 'border-box', transition: 'transform .2s, box-shadow .2s, border-color .2s', boxShadow: '0 2px 12px rgba(0,0,0,.03)' }}>
                <div style={{ width: 66, height: 66, borderRadius: 18, background: `linear-gradient(135deg, ${C.cream}, #e6efe8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}><Icon size={28} style={{ color: C.teal }} /></div>
                <h3 style={{ fontSize: 18.5, fontWeight: 800, color: C.text, margin: '0 0 10px' }}>{title}</h3>
                <p style={{ fontSize: 14.5, color: C.taupe, lineHeight: 1.6, margin: '0 0 22px' }}>{desc}</p>
                {action === 'tel'
                  ? <a href="tel:699669603" onClick={() => trackContact('phone')} className="btn-out dkv-a" style={{ ...outline(C.teal), margin: '0 auto' }}>{cta}</a>
                  : <button onClick={() => scrollTo('calcula')} className="btn-out" style={{ ...outline(C.teal), margin: '0 auto' }}>{cta}</button>}
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      </main>

      {/* Separador onda hacia el footer */}
      <div style={{ background: '#fff', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 90" preserveAspectRatio="none" style={{ display: 'block', width: '100%', height: 'clamp(38px,6vw,78px)' }}>
          <path fill={C.tealDeep} d="M0,42 C320,92 620,8 900,34 C1140,56 1300,78 1440,44 L1440,90 L0,90 Z" />
        </svg>
      </div>

      {/* ═══ FOOTER ═══ */}
      <footer className="foot" style={{ background: C.tealDeep, color: 'rgba(255,255,255,.72)', marginTop: -1 }}>
        <div className="pad" style={{ maxWidth: 1240, margin: '0 auto', padding: '62px 24px 36px' }}>
          <div className="g4 foot-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 40 }}>
            {[
              { h: 'Seguros para particulares', links: ['Seguros de salud', 'Seguros sin copago', 'Seguros con copago', 'Seguros dentales', 'Seguros de reembolso', 'Cuadro médico'] },
              { h: 'Otros seguros', links: ['Seguros de vida', 'Seguros de decesos', 'Seguros de hogar', 'Seguros de accidentes', 'Seguros de viaje', 'Seguros de mascotas'] },
              { h: 'Autónomos y empresas', links: ['Seguros para autónomos', 'Seguros para empresas', 'Salud colectivos', 'Prevención de riesgos', 'Portal del profesional'] },
              { h: 'DKV', links: ['Conócenos', 'Trabaja con nosotros', 'Blog de salud', 'Sostenibilidad', 'Contacto y oficinas', 'Aviso legal'] },
            ].map(col => (
              <div key={col.h}>
                <h3 style={{ color: '#fff', fontSize: 15, fontWeight: 800, margin: '0 0 16px' }}>{col.h}</h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(l => <li key={l}><a href="#" className="dkv-a" style={{ fontSize: 14, color: 'rgba(255,255,255,.72)' }}>{l}</a></li>)}
                </ul>
              </div>
            ))}
          </div>
          <div className="band-col" style={{ borderTop: '1px solid rgba(255,255,255,.14)', marginTop: 46, paddingTop: 28, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <DKVLogo size={27} light />
              <span style={{ fontSize: 13, color: 'rgba(255,255,255,.55)' }}>© 2026 DKV Seguros de Salud · Todos los derechos reservados.</span>
            </div>
            <div style={{ display: 'flex', gap: 14 }}>
              {[{ Ic: Share2, l: 'Compartir' }, { Ic: AtSign, l: 'Escríbenos un correo' }, { Ic: Globe, l: 'Nuestra web' }, { Ic: MessageCircle, l: 'Contáctanos por WhatsApp' }].map(({ Ic, l }, i) => (
                <a key={i} href="#" aria-label={l} title={l} className="dkv-a soc" style={{ width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', transition: 'all .18s' }}><Ic size={17} /></a>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 20, flexWrap: 'wrap', fontSize: 13, fontWeight: 600 }}>
            <a href="/dkv/aviso-legal" className="dkv-a" style={{ color: 'rgba(255,255,255,.78)' }}>Aviso legal</a>
            <a href="/dkv/privacidad" className="dkv-a" style={{ color: 'rgba(255,255,255,.78)' }}>Política de privacidad</a>
            <a href="/dkv/cookies" className="dkv-a" style={{ color: 'rgba(255,255,255,.78)' }}>Política de cookies</a>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 16, fontSize: 12.5, color: 'rgba(255,255,255,.72)' }}><ShieldCheck size={14} /> Tus datos están protegidos y tratados conforme al RGPD. Nunca compartimos tu información con terceros.</div>
        </div>
      </footer>

      {/* ═══ MODAL DETALLE DE SEGURO ═══ */}
      {detail && (() => {
        const DIcon = detail.icon || ShieldCheck
        return (
          <div onClick={() => setDetail(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,15,13,.62)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
            <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', borderRadius: 24, boxShadow: '0 50px 110px -22px rgba(0,0,0,.55)', animation: 'modalUp .38s cubic-bezier(.22,1,.36,1)' }}>
              <div style={{ position: 'relative', color: '#fff', padding: '32px 32px 28px', backgroundImage: `linear-gradient(135deg, rgba(6,63,59,.93) 0%, rgba(9,87,81,.82) 55%, rgba(13,107,95,.7) 100%), url(${DETAIL_IMG[detail.title] || IMG.network})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                <button onClick={() => setDetail(null)} aria-label="Cerrar" className="modal-close" style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.16)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .15s' }}><X size={20} /></button>
                <div style={{ width: 62, height: 62, borderRadius: 17, background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}><DIcon size={30} /></div>
                {detail.promo && <span style={{ display: 'inline-block', background: C.red, fontSize: 11, fontWeight: 800, padding: '4px 11px', borderRadius: 999, marginBottom: 10 }}>¡PROMO {detail.promo}!</span>}
                <h3 style={{ fontSize: 25, fontWeight: 800, margin: '0 0 6px', letterSpacing: '-0.025em' }}>{detail.title}</h3>
                <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,.85)', margin: 0, fontWeight: 600 }}>{detail.tagline}</p>
              </div>
              <div style={{ padding: '26px 32px 30px' }}>
                <p style={{ fontSize: 15.5, color: C.text, lineHeight: 1.65, margin: '0 0 22px' }}>{detail.desc}</p>
                {PRICES[detail.title] && (
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, margin: '0 0 22px', paddingBottom: 22, borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontSize: 13, color: C.taupe, fontWeight: 600 }}>Precio orientativo desde</span>
                    <span style={{ fontSize: 26, fontWeight: 900, color: C.teal, letterSpacing: '-0.02em' }}>{PRICES[detail.title]}</span>
                  </div>
                )}
                <h4 style={{ fontSize: 12.5, fontWeight: 800, color: C.taupe, letterSpacing: '0.06em', textTransform: 'uppercase', margin: '0 0 15px' }}>Qué incluye</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {detail.coverage.map((c: string) => (
                    <div key={c} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                      <span style={{ width: 23, height: 23, borderRadius: '50%', background: '#e9f1ec', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}><Check size={13} style={{ color: C.teal }} strokeWidth={3} /></span>
                      <span style={{ fontSize: 14.5, color: C.text, lineHeight: 1.5 }}>{c}</span>
                    </div>
                  ))}
                </div>
                <div style={{ background: C.cream, borderRadius: 14, padding: '16px 18px', marginBottom: 26, display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <ThumbsUp size={20} style={{ color: C.limeDark, flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: C.limeDark, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>Ideal para ti si…</div>
                    <div style={{ fontSize: 14.5, color: C.text, lineHeight: 1.55 }}>{detail.idealFor}</div>
                  </div>
                </div>
                <button onClick={() => { setInteresSel(detail.title); setDetail(null); setTimeout(() => scrollTo('calcula'), 90) }} className="btn-red" style={{ ...solid(C.red), width: '100%', justifyContent: 'center', padding: '15px', fontSize: 16, boxShadow: '0 14px 30px -10px rgba(221,54,54,.5)' }}>Calcular precio de este seguro <ArrowRight size={18} /></button>
                <button onClick={() => setDetail(null)} style={{ width: '100%', background: 'none', border: 'none', color: C.taupe, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', padding: '14px 0 0' }}>Cerrar</button>
              </div>
            </div>
          </div>
        )
      })()}

      {/* ═══ MODAL ARTÍCULO / BLOG ═══ */}
      {article && (
        <div onClick={() => setArticle(null)} style={{ position: 'fixed', inset: 0, zIndex: 90, background: 'rgba(10,15,13,.62)', backdropFilter: 'blur(5px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20, animation: 'fadeIn .2s ease' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', borderRadius: 24, boxShadow: '0 50px 110px -22px rgba(0,0,0,.55)', animation: 'modalUp .38s cubic-bezier(.22,1,.36,1)' }}>
            <div style={{ position: 'relative', height: 240, backgroundImage: `url(${article.img})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,.08), rgba(6,63,59,.6))' }} />
              <button onClick={() => setArticle(null)} aria-label="Cerrar" className="modal-close" style={{ position: 'absolute', top: 18, right: 18, width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,255,255,.22)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', transition: 'background .15s' }}><X size={20} /></button>
              <div style={{ position: 'absolute', bottom: 22, left: 28, right: 28, color: '#fff' }}>
                <span style={{ background: C.lime, fontSize: 11, fontWeight: 800, padding: '4px 12px', borderRadius: 999 }}>{article.category}</span>
                <h3 style={{ fontSize: 'clamp(21px,3vw,28px)', fontWeight: 800, margin: '12px 0 0', lineHeight: 1.2, letterSpacing: '-0.02em', textShadow: '0 2px 24px rgba(0,0,0,.45)' }}>{article.title}</h3>
              </div>
            </div>
            <div style={{ padding: '26px 34px 34px' }}>
              <div style={{ display: 'flex', gap: 10, fontSize: 13, color: C.taupe, marginBottom: 22, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}><span>{article.date}</span><span>·</span><span>{article.read} de lectura</span></div>
              {article.body.map((b: { h?: string; text: string }, bi: number) => (
                <div key={bi} style={{ marginBottom: 18 }}>
                  {b.h && <h4 style={{ fontSize: 17.5, fontWeight: 800, color: C.text, margin: '0 0 8px', letterSpacing: '-0.01em' }}>{b.h}</h4>}
                  <p style={{ fontSize: 15.5, color: C.taupe, lineHeight: 1.72, margin: 0 }}>{b.text}</p>
                </div>
              ))}
              <div style={{ background: `linear-gradient(135deg, ${C.cream}, #eef1e0)`, borderRadius: 16, padding: '24px', marginTop: 28, textAlign: 'center' }}>
                <div style={{ fontSize: 16.5, fontWeight: 800, color: C.text, marginBottom: 6 }}>¿Te ayudamos a dar el paso?</div>
                <p style={{ fontSize: 14, color: C.taupe, margin: '0 0 18px' }}>Calcula tu seguro en 1 minuto, sin compromiso.</p>
                <button onClick={() => { setArticle(null); setTimeout(() => scrollTo('calcula'), 90) }} className="btn-red" style={{ ...solid(C.red), margin: '0 auto', padding: '14px 30px', boxShadow: '0 14px 30px -10px rgba(221,54,54,.5)' }}>Calcula tu seguro <ArrowRight size={17} /></button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Animated graphics ── */
function useInViewOnce(threshold = 0.35) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current; if (!el) return
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setInView(true); o.disconnect() } }, { threshold })
    o.observe(el); return () => o.disconnect()
  }, [threshold])
  return { ref, inView }
}

function CountUp({ end, decimals = 0, suffix = '', prefix = '', duration = 1700 }: { end: number; decimals?: number; suffix?: string; prefix?: string; duration?: number }) {
  const { ref, inView } = useInViewOnce(0.6)
  const [val, setVal] = useState(0)
  useEffect(() => {
    if (!inView) return
    let raf = 0; const t0 = performance.now()
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / duration)
      const e = 1 - Math.pow(1 - p, 3)
      setVal(end * e)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, end, duration])
  return <span ref={ref}>{prefix}{val.toLocaleString('es-ES', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}{suffix}</span>
}

function Donut({ pct, size = 210, stroke = 20, color = C.lime, label, sub }: { pct: number; size?: number; stroke?: number; color?: string; label: string; sub: string }) {
  const { ref, inView } = useInViewOnce(0.45)
  const r = (size - stroke) / 2
  const circ = 2 * Math.PI * r
  return (
    <div ref={ref} style={{ position: 'relative', width: size, height: size, margin: '0 auto' }}>
      <svg width={size} height={size} style={{ transform: 'rotate(140deg)' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e7eee9" strokeWidth={stroke} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={inView ? circ * (1 - pct / 100) : circ}
          style={{ transition: 'stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)' }} />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <span style={{ fontSize: 46, fontWeight: 900, color: C.teal, letterSpacing: '-0.02em', lineHeight: 1 }}><CountUp end={pct} suffix="%" /></span>
        <span style={{ fontSize: 15, fontWeight: 800, color: C.text, marginTop: 6 }}>{label}</span>
        <span style={{ fontSize: 12.5, color: C.taupe, marginTop: 2 }}>{sub}</span>
      </div>
    </div>
  )
}

function Bars({ rows }: { rows: { label: string; dkv: number; otro: number }[] }) {
  const { ref, inView } = useInViewOnce(0.3)
  const max = Math.max(...rows.flatMap(r => [r.dkv, r.otro]))
  const w = (v: number) => `${Math.max(5, (v / max) * 100)}%`
  const Bar = ({ v, delay, dkv }: { v: number; delay: number; dkv: boolean }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, height: 14, background: '#f2f4ee', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: inView ? w(v) : '0%', background: dkv ? `linear-gradient(90deg, ${C.teal}, ${C.tealSoft})` : `linear-gradient(90deg, #e88c84, #dd6b62)`, borderRadius: 999, transition: `width 1.5s cubic-bezier(.22,1,.36,1) ${delay}s` }} />
      </div>
      <span style={{ fontSize: 13, fontWeight: 800, color: dkv ? C.teal : '#c85248', width: 92, textAlign: 'right', flexShrink: 0 }}>
        {dkv ? 'DKV' : 'Pública'} · {v}d
      </span>
    </div>
  )
  return (
    <div ref={ref} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {rows.map((r, i) => (
        <div key={r.label}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, marginBottom: 9 }}>{r.label}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Bar v={r.dkv} delay={i * 0.12} dkv />
            <Bar v={r.otro} delay={i * 0.12 + 0.18} dkv={false} />
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 20, marginTop: 4, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: C.taupe }}><span style={{ width: 14, height: 10, borderRadius: 3, background: C.teal }} /> Con DKV</span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, fontSize: 12.5, fontWeight: 700, color: C.taupe }}><span style={{ width: 14, height: 10, borderRadius: 3, background: '#dd6b62' }} /> Sanidad pública</span>
      </div>
    </div>
  )
}

/* Animated area / growth chart */
function AreaChart() {
  const { ref, inView } = useInViewOnce(0.3)
  const data = [1.2, 1.35, 1.48, 1.6, 1.72, 1.82, 1.92, 2.0]
  const years = ['2019', '2020', '2021', '2022', '2023', '2024', '2025', '2026']
  const W = 640, H = 210, pad = 18, min = 1.0, max = 2.15
  const pts = data.map((d, i) => {
    const x = pad + i * (W - 2 * pad) / (data.length - 1)
    const y = H - 40 - ((d - min) / (max - min)) * (H - 66)
    return [x, y] as const
  })
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ')
  const area = `${line} L${pts[pts.length - 1][0].toFixed(1)},${H - 26} L${pts[0][0].toFixed(1)},${H - 26} Z`
  const LEN = 1600
  return (
    <div ref={ref}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block', overflow: 'visible' }}>
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.lime} stopOpacity="0.32" />
            <stop offset="100%" stopColor={C.lime} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaG)" style={{ opacity: inView ? 1 : 0, transition: 'opacity 1.1s ease .4s' }} />
        <path d={line} fill="none" stroke={C.teal} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={LEN} strokeDashoffset={inView ? 0 : LEN} style={{ transition: 'stroke-dashoffset 2s cubic-bezier(.4,0,.2,1)' }} />
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p[0]} cy={p[1]} r="4.5" fill="#fff" stroke={C.teal} strokeWidth="3" style={{ opacity: inView ? 1 : 0, transition: `opacity .4s ${0.6 + i * 0.14}s` }} />
            <text x={p[0]} y={H - 8} textAnchor="middle" fontSize="12" fill={C.taupe} fontFamily="inherit">{years[i]}</text>
          </g>
        ))}
        <text x={pts[pts.length - 1][0]} y={pts[pts.length - 1][1] - 15} textAnchor="end" fontSize="16" fontWeight="800" fill={C.teal} fontFamily="inherit" style={{ opacity: inView ? 1 : 0, transition: 'opacity .5s 1.7s' }}>+2M</text>
      </svg>
    </div>
  )
}

/* Animated ECG / heartbeat line */
function PulseLine({ color = C.lime, height = 60 }: { color?: string; height?: number }) {
  return (
    <svg viewBox="0 0 1200 60" width="100%" height={height} preserveAspectRatio="none" style={{ display: 'block' }}>
      <path d="M0,30 L340,30 L360,30 L380,10 L400,50 L420,30 L470,30 L490,30 L510,4 L534,56 L556,30 L900,30 L920,30 L940,14 L960,46 L980,30 L1200,30"
        fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        style={{ strokeDasharray: 1400, strokeDashoffset: 1400, animation: 'ecg 3.4s linear infinite' }} />
    </svg>
  )
}

/* ── Helpers ── */
function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: C.teal, fontWeight: 800, fontSize: 12.5, letterSpacing: '0.08em', textTransform: 'uppercase', background: '#e9f1ec', padding: '7px 15px', borderRadius: 999 }}>{children}</span>
  )
}

/* Logo oficial DKV + distintivo "Agente exclusivo DKV" (insignia de certificación) */
function DKVLogo({ size = 30, light = false }: { size?: number; light?: boolean }) {
  const ring = Math.round(size * 0.66)
  const labelFs = Math.max(7.5, size * 0.30)
  const mainFs = Math.max(11, size * 0.44)
  const div = light ? '1px solid rgba(255,255,255,.22)' : '1px solid #d7e2db'
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.46), flexShrink: 0 }} aria-label="DKV Seguros — Agente exclusivo">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={light ? '/dkv-logo-light.png' : '/dkv-logo.png'} alt="DKV Seguros" style={{ height: size, width: 'auto', display: 'block' }} />
      <span style={{ height: Math.round(size * 1.4), width: 1, background: light ? 'rgba(255,255,255,.2)' : '#e3e9e4' }} />
      <span style={{
        display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.34),
        height: Math.round(size * 1.5), padding: `0 ${Math.round(size * 0.52)}px`,
        borderRadius: Math.round(size * 0.44), boxSizing: 'border-box',
        background: light ? 'rgba(255,255,255,.08)' : 'linear-gradient(135deg,#f2f7f2,#eaf2ec)', border: div,
      }}>
        <span style={{ width: ring, height: ring, borderRadius: '50%', background: `linear-gradient(135deg, ${C.lime}, ${C.limeDark})`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 8px -2px rgba(124,140,31,.55)' }}>
          <Check size={Math.round(ring * 0.6)} color="#fff" strokeWidth={3.4} />
        </span>
        <span style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.05 }}>
          <span style={{ fontSize: labelFs, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: light ? 'rgba(255,255,255,.66)' : C.taupe, whiteSpace: 'nowrap' }}>Agente exclusivo</span>
          <span style={{ fontSize: mainFs, fontWeight: 800, color: light ? '#fff' : C.teal, letterSpacing: '-0.01em', whiteSpace: 'nowrap' }}>DKV Seguros</span>
        </span>
      </span>
    </span>
  )
}

function inputStyle(active: boolean): React.CSSProperties {
  return {
    width: '100%', padding: '13px 15px', borderRadius: 11,
    border: `1.5px solid ${active ? C.teal : C.border}`, background: active ? '#fff' : '#fbfbfa',
    fontSize: 14.5, fontFamily: 'inherit', color: C.text, outline: 'none', boxSizing: 'border-box', transition: 'all .15s',
  }
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: 11.5, fontWeight: 700, color: C.taupe, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

function StoreBadge({ top, bottom }: { top: string; bottom: string }) {
  return (
    <a href="#" onClick={e => e.preventDefault()} className="dkv-a btn-white" style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#111', color: '#fff', borderRadius: 12, padding: '10px 18px', transition: 'transform .18s, box-shadow .18s' }}>
      <Smartphone size={22} />
      <span style={{ lineHeight: 1.2 }}>
        <span style={{ display: 'block', fontSize: 10, opacity: .8 }}>{top}</span>
        <span style={{ display: 'block', fontSize: 15, fontWeight: 700 }}>{bottom}</span>
      </span>
    </a>
  )
}
