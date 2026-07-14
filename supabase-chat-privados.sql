-- ============================================================
-- Mensajes privados (1 a 1) en el chat interno + listado de usuarios.
-- Ejecutar UNA vez en Supabase → SQL Editor (después del chat de grupo).
-- ============================================================

-- Destinatario: si es NULL = mensaje al grupo; si tiene id = privado a esa persona.
alter table mensajes_chat add column if not exists destinatario_id uuid;
create index if not exists idx_mensajes_chat_dm on mensajes_chat(destinatario_id);

-- Privacidad: ves un mensaje si es del grupo, o si eres el que escribe o el destinatario.
drop policy if exists "chat lectura asesores" on mensajes_chat;
drop policy if exists "chat lectura" on mensajes_chat;
create policy "chat lectura"
  on mensajes_chat for select to authenticated
  using (destinatario_id is null or usuario_id = auth.uid() or destinatario_id = auth.uid());

-- Lista de todos los usuarios con cuenta (para elegir con quién hablar).
create or replace function public.listar_asesores()
returns table (id uuid, nombre text, email text, rol text)
language sql security definer set search_path = public as $$
  select id, nombre, email, rol from asesores order by nombre nulls last, email
$$;
grant execute on function public.listar_asesores() to authenticated;
