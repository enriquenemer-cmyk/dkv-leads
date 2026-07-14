import { supabase } from './supabase'

export type TipoActividad =
  | 'lead_nuevo'
  | 'lead_editado'
  | 'lead_borrado'
  | 'lead_tag'
  | 'nota_agregada'
  | 'recordatorio_set'
  | 'recordatorio_borrado'
  | 'usuario_creado'
  | 'sesion_inicio'
  | 'sesion_cierre'
  | 'export_csv'
  | 'wallet_enviada'
  | 'wallet_actualizada'
  | 'tarjeta_sello'
  | 'sorteo_realizado'
  | 'campania_enviada'

export async function logActividad(
  tipo: TipoActividad,
  descripcion: string,
  opts?: { lead_id?: string; lead_nombre?: string }
) {
  const { data: { user } } = await supabase.auth.getUser()
  await supabase.from('actividad').insert({
    tipo,
    descripcion,
    lead_id: opts?.lead_id ?? null,
    lead_nombre: opts?.lead_nombre ?? null,
    usuario_email: user?.email ?? null,
  })
}
