import React from 'react'
import { fuenteOrigen } from '@/lib/supabase'
import { IgIcon } from '@/components/IgIcon'

// Degradado de Instagram (igual que en el apartado de Instagram).
const IG_GRADIENT = 'linear-gradient(135deg, #833AB4 0%, #C13584 35%, #E1306C 60%, #F77737 100%)'

type Estilo = { label: string; color: string; bg: string; emoji?: string; ig?: boolean }

const MAP: Record<string, Estilo> = {
  instagram:   { label: 'Instagram',     color: '#fff',    bg: IG_GRADIENT, ig: true },
  formulario:  { label: 'Formulario web', color: '#0F7A63', bg: '#e3f1ec', emoji: '🌐' },
  'web-dkv':   { label: 'Formulario web', color: '#0F7A63', bg: '#e3f1ec', emoji: '🌐' },
  web:         { label: 'Formulario web', color: '#0F7A63', bg: '#e3f1ec', emoji: '🌐' },
  meta:        { label: 'Facebook',      color: '#2b6fb0', bg: '#eaf3ff', emoji: '📘' },
  chatbot:     { label: 'Chatbot',       color: '#6b4ab0', bg: '#f0eafa', emoji: '💬' },
  manual:      { label: 'Alta manual',   color: '#6b7a76', bg: '#f0f4f1', emoji: '✏️' },
}

/** Etiqueta que muestra el origen (motivo) de un lead: Instagram, Formulario web, etc. */
export function FuenteBadge({ fuente, size = 'sm' }: { fuente: string | null; size?: 'sm' | 'md' }) {
  const origen = fuenteOrigen(fuente) || 'manual'
  const e = MAP[origen] ?? { label: origen, color: '#6b7a76', bg: '#f0f4f1', emoji: '•' }
  const pad = size === 'md' ? '3px 10px' : '2px 8px'
  const fs = size === 'md' ? 12 : 10.5
  const icon = size === 'md' ? 12 : 10

  return (
    <span title={`Origen: ${e.label}`}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: fs, fontWeight: 700, color: e.color, background: e.bg, padding: pad, borderRadius: 999, whiteSpace: 'nowrap', flexShrink: 0, lineHeight: 1.4 }}>
      {e.ig ? <IgIcon size={icon} color="#fff" /> : <span style={{ fontSize: icon }}>{e.emoji}</span>}
      {e.label}
    </span>
  )
}
