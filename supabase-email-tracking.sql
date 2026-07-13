-- ============================================================
-- Rastreo de correos de email marketing (aperturas, clics, rebotes).
-- Una fila por correo enviado. Los eventos de Resend (webhook) van
-- rellenando las fechas. Ejecutar UNA vez en Supabase → SQL Editor.
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

-- Los asesores con sesión pueden ver los resultados. Las inserciones y
-- actualizaciones las hace el servidor con la clave de servicio (salta RLS).
alter table email_envios enable row level security;
drop policy if exists "email_envios lectura asesores" on email_envios;
create policy "email_envios lectura asesores"
  on email_envios for select to authenticated using (true);
