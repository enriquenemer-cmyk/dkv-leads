-- ============================================================
-- DKV Leads – Setup SQL para Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- ============================================================

-- 1. Tabla principal de leads
create table if not exists public.leads (
  id           uuid primary key default gen_random_uuid(),
  nombre       text not null,
  telefono     text,
  email        text,
  interes      text,
  tag          text check (tag in ('caliente','tibio','frio','cliente')) default 'frio',
  fuente       text default 'formulario',
  notas        jsonb default '[]'::jsonb,
  recordatorio jsonb default null,
  created_at   timestamptz default now()
);

-- 2. Habilitar RLS
alter table public.leads enable row level security;

-- 3. Política: cualquier persona puede INSERT (formulario público)
create policy "insert_publico" on public.leads
  for insert to anon
  with check (true);

-- 4. Política: solo usuarios autenticados pueden leer
create policy "select_autenticado" on public.leads
  for select to authenticated
  using (true);

-- 5. Política: solo usuarios autenticados pueden actualizar
create policy "update_autenticado" on public.leads
  for update to authenticated
  using (true);

-- 6. Política: solo usuarios autenticados pueden borrar
create policy "delete_autenticado" on public.leads
  for delete to authenticated
  using (true);

-- 7. Habilitar Realtime (para actualizaciones en tiempo real en el panel)
alter publication supabase_realtime add table public.leads;
