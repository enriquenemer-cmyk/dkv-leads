-- ============================================================
-- Rastreo de correos de email marketing (aperturas, clics, rebotes).
-- Funciona SIN clave de servicio: los envíos los guarda el asesor con su
-- sesión, y los eventos de Resend los aplica una función segura.
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ============================================================

create table if not exists email_envios (
  id uuid primary key default gen_random_uuid(),
  resend_id     text unique,          -- id que devuelve Resend por cada correo
  campania_id   text,                 -- agrupa todos los correos de un mismo envío
  campania      text,                 -- asunto/nombre de la campaña
  tipo          text,                 -- informacion | promocion | compensacion | sorteo
  email         text,
  nombre        text,
  enviado_at    timestamptz default now(),
  entregado_at  timestamptz,          -- email.delivered
  abierto_at    timestamptz,          -- email.opened
  click_at      timestamptz,          -- email.clicked
  rebotado_at   timestamptz,          -- email.bounced
  spam_at       timestamptz,          -- email.complained
  created_at    timestamptz default now()
);

create index if not exists idx_email_envios_campania on email_envios(campania_id);
create index if not exists idx_email_envios_resend   on email_envios(resend_id);

alter table email_envios enable row level security;

-- Los asesores con sesión pueden ver los resultados y registrar los envíos.
drop policy if exists "email_envios lectura asesores" on email_envios;
create policy "email_envios lectura asesores"
  on email_envios for select to authenticated using (true);

drop policy if exists "email_envios alta asesores" on email_envios;
create policy "email_envios alta asesores"
  on email_envios for insert to authenticated with check (true);

-- El webhook de Resend (sin sesión) aplica los eventos con esta función segura.
create or replace function public.registrar_evento_email(p_resend_id text, p_tipo text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update email_envios set
    entregado_at = case when p_tipo = 'email.delivered' then now() else entregado_at end,
    abierto_at   = case when p_tipo in ('email.opened','email.clicked') then now() else abierto_at end,
    click_at     = case when p_tipo = 'email.clicked' then now() else click_at end,
    rebotado_at  = case when p_tipo = 'email.bounced' then now() else rebotado_at end,
    spam_at      = case when p_tipo = 'email.complained' then now() else spam_at end
  where resend_id = p_resend_id;
end;
$$;

grant execute on function public.registrar_evento_email(text, text) to anon, authenticated;
