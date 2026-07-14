-- ============================================================
-- Tarjeta de fidelización con QR (Club Protección DKV).
-- Función segura que deja al cliente ver SU tarjeta (nombre + seguros)
-- al escanear el QR, sin exponer el resto de datos del lead.
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ============================================================

create or replace function public.tarjeta_publica(p_id uuid)
returns table (nombre text, seguros jsonb)
language sql
security definer
set search_path = public
as $$
  select l.nombre, to_jsonb(l.wallet_seguros)
  from leads l
  where l.id = p_id
$$;

-- Cualquiera con el enlace/QR (que contiene el id) puede leer su tarjeta.
grant execute on function public.tarjeta_publica(uuid) to anon, authenticated;
