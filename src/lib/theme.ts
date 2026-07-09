// ============================================================
//  THEME — FUENTE CANÓNICA DE TOKENS DE DISEÑO
//  Este archivo es la ÚNICA fuente de verdad para colores, cifras
//  de marca y datos de contacto usados en toda la web.
//
//  Regla: cualquier color/cifra/contacto que se repita en la UI debe
//  salir de aquí (no hardcodear en componentes). De momento SOLO se
//  define; la migración de otros archivos para importarlo se hará
//  en un paso posterior.
// ============================================================

// --- Paleta de marca ---
export const COLORS = {
  primary: '#0F7A63',
  primaryDeep: '#0a5b49',
  primaryDark: '#095751',
  lime: '#98A92A',
  danger: '#DD3636',
  ink: '#16201d',
  muted: '#6b7a76',
  line: '#e6eae8',
  bg: '#f0f4f1',
} as const

// --- Cifras de confianza / prueba social ---
export const CIFRAS = {
  asegurados: '+2 millones de asegurados en España',
  especialistas: '+51.000 especialistas',
  experiencia: '50 años de experiencia',
  google: '4,8 / 5 en Google',
  respuesta: 'respuesta en menos de 24 h',
} as const

// --- Datos de contacto ---
export const CONTACTO = {
  telefono: '699 66 96 03',
  telefonoLink: '+34699669603',
  whatsapp: '34699669603',
} as const
