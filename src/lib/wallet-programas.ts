/* Configuración de los programas de fidelización "Club DKV" (Google Wallet).
   Un programa por ramo de seguro. Sin dependencias pesadas: lo importan tanto
   la librería del pase como el generador del banner (next/og). */

export type ProgramaSlug = 'sonrisa' | 'hogar' | 'decesos' | 'vida'

export type Programa = {
  slug: ProgramaSlug
  nombre: string        // nombre del programa (header de la tarjeta)
  clase: string         // sufijo de la clase en Google (issuerId.clase)
  total: number         // sellos para completar (el hueco extra es el regalo)
  emoji: string         // icono del sello
  accent: string        // color de acento (sello lleno, barra, etc.)
  premio: string        // texto largo del premio
  premioCorto: string   // texto corto para el banner ("para tu ...")
}

export const PROGRAMAS: Record<ProgramaSlug, Programa> = {
  sonrisa: {
    slug: 'sonrisa',
    nombre: 'Club Sonrisa',
    clase: 'club_sonrisa',
    total: 3,
    emoji: '🦷',
    accent: '#8FAE2C',
    premio: 'un blanqueamiento dental gratis',
    premioCorto: 'tu blanqueamiento',
  },
  hogar: {
    slug: 'hogar',
    nombre: 'Club Hogar',
    clase: 'club_hogar',
    total: 3,
    emoji: '🏠',
    accent: '#E0A83D',
    premio: 'un mes gratis de tu seguro de hogar',
    premioCorto: 'tu mes gratis',
  },
  decesos: {
    slug: 'decesos',
    nombre: 'Club Protección',
    clase: 'club_decesos',
    total: 3,
    emoji: '🕊️',
    accent: '#7FA8C9',
    premio: 'un mes gratis de tu seguro de decesos',
    premioCorto: 'tu mes gratis',
  },
  vida: {
    slug: 'vida',
    nombre: 'Club Vida',
    clase: 'club_vida',
    total: 3,
    emoji: '❤️',
    accent: '#D9736A',
    premio: 'un mes gratis de tu seguro de vida',
    premioCorto: 'tu mes gratis',
  },
}

export const PROGRAMA_SLUGS = Object.keys(PROGRAMAS) as ProgramaSlug[]

export function esProgramaValido(s: string): s is ProgramaSlug {
  return s in PROGRAMAS
}
