-- ============================================================
-- DKV Leads – Crear tablas que faltan (asesores + actividad)
-- Ejecutar en: supabase.com → tu proyecto → SQL Editor → RUN
-- La tabla "leads" ya existe, aquí NO se toca.
-- ============================================================

-- ---------- Tabla asesores ----------
create table if not exists public.asesores (
  id         uuid primary key,
  email      text unique not null,
  nombre     text,
  created_at timestamptz default now()
);

alter table public.asesores enable row level security;

create policy "auth_select_asesores" on public.asesores
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_asesores" on public.asesores
  for insert with check (auth.role() = 'authenticated');

create policy "auth_update_asesores" on public.asesores
  for update using (auth.role() = 'authenticated');

-- ---------- Tabla actividad ----------
create table if not exists public.actividad (
  id            uuid primary key default gen_random_uuid(),
  tipo          text not null,
  descripcion   text not null,
  lead_id       uuid references public.leads(id) on delete set null,
  lead_nombre   text,
  usuario_email text,
  created_at    timestamptz default now()
);

alter table public.actividad enable row level security;

create policy "auth_select_actividad" on public.actividad
  for select using (auth.role() = 'authenticated');

create policy "auth_insert_actividad" on public.actividad
  for insert with check (auth.role() = 'authenticated');

-- ---------- Realtime ----------
alter publication supabase_realtime add table public.actividad;
