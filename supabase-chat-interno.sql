-- ============================================================
-- Chat interno del equipo (asesores). Ejecutar UNA vez en Supabase → SQL Editor.
-- ============================================================

create table if not exists mensajes_chat (
  id uuid primary key default gen_random_uuid(),
  usuario_id     uuid,
  usuario_email  text,
  usuario_nombre text,
  texto          text not null,
  created_at     timestamptz default now()
);

create index if not exists idx_mensajes_chat_created on mensajes_chat(created_at);

alter table mensajes_chat enable row level security;

-- Todos los asesores con sesión leen el chat; cada uno solo publica como él mismo.
drop policy if exists "chat lectura asesores" on mensajes_chat;
create policy "chat lectura asesores"
  on mensajes_chat for select to authenticated using (true);

drop policy if exists "chat alta propia" on mensajes_chat;
create policy "chat alta propia"
  on mensajes_chat for insert to authenticated with check (auth.uid() = usuario_id);

-- Tiempo real (ignora el error si ya estaba añadida).
do $$
begin
  alter publication supabase_realtime add table mensajes_chat;
exception when duplicate_object then null;
end $$;
