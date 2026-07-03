import { type Lead, leadSucursal, fuenteOrigen } from '@/lib/supabase'

/** Exporta una lista de leads a un archivo CSV (compatible con Excel, con BOM). */
export function exportCSV(leads: Lead[], filename = 'leads-dkv.csv') {
  const BOM = '﻿'
  const header = 'Nombre,Teléfono,Correo,Interés,Sucursal,Estado,Fuente,Sellos,Tarjeta guardada,Fecha\n'
  const rows = leads.map(l =>
    [l.nombre, l.telefono ?? '', l.email ?? '', l.interes ?? '', leadSucursal(l) ?? '', l.tag, fuenteOrigen(l.fuente),
     `${l.wallet_sellos ?? 0}/5`, l.wallet_guardada ? 'Sí' : 'No',
     new Date(l.created_at).toLocaleDateString('es-ES')].map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
  ).join('\n')
  const blob = new Blob([BOM + header + rows], { type: 'text/csv;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}
