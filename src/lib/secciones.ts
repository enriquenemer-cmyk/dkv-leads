// Secciones ("ventanas") del panel a las que se puede dar/quitar acceso por asesor.
// La clave es el href de la sección. Un asesor con `permisos = null` tiene acceso a TODO
// (admins y usuarios antiguos). Si `permisos` es un array, solo ve esas secciones.
export const SECCIONES = [
  { href: '/panel/dashboard', label: 'Dashboard' },
  { href: '/panel/prioridad', label: 'Prioridad' },
  { href: '/panel/leads', label: 'Leads' },
  { href: '/panel/instagram', label: 'Leads de Instagram' },
  { href: '/panel/contenido', label: 'Simulador de contenido' },
  { href: '/panel/chat', label: 'Chat del equipo' },
  { href: '/panel/kanban', label: 'Kanban' },
  { href: '/panel/agenda', label: 'Agenda' },
  { href: '/panel/actividad', label: 'Actividad' },
  { href: '/panel/rendimiento', label: 'Rendimiento' },
  { href: '/panel/conversion', label: 'Conversión' },
  { href: '/panel/geolocalizacion', label: 'Geolocalización' },
  { href: '/panel/analitica', label: 'Analítica web' },
  { href: '/panel/marketing', label: 'Email Marketing' },
  { href: '/panel/campanias', label: 'Resultados de correos' },
  { href: '/panel/sorteo', label: 'Sorteos' },
  { href: '/panel/fidelizacion', label: 'Tarjetas de fidelización' },
  { href: '/panel/usuarios', label: 'Asesores (gestión)' },
] as const

/** ¿El asesor puede ver esta sección? permisos null/indefinido = acceso total. */
export function puedeVer(permisos: string[] | null | undefined, href: string): boolean {
  if (!permisos || permisos.length === 0) return true
  return permisos.some((p) => href.startsWith(p))
}
