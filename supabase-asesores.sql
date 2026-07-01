-- Ejecutar en: supabase.com → tu proyecto → SQL Editor

create table if not exists asesores (
  id uuid primary key,
  email text unique not null,
  nombre text,
  created_at timestamptz default now()
);

alter table asesores enable row level security;

create policy "auth_select_asesores" on asesores
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_asesores" on asesores
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_asesores" on asesores
  for update using (auth.role() = 'authenticated');
