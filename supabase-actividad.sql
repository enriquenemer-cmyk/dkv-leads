-- Tabla de actividad del sistema
create table if not exists actividad (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  descripcion text not null,
  lead_id uuid references leads(id) on delete set null,
  lead_nombre text,
  usuario_email text,
  created_at timestamptz default now()
);

-- RLS
alter table actividad enable row level security;

-- Authenticated users can read all activity
create policy "auth_select_actividad" on actividad
  for select using (auth.role() = 'authenticated');

-- Authenticated users can insert activity
create policy "auth_insert_actividad" on actividad
  for insert with check (auth.role() = 'authenticated');

-- Realtime
alter publication supabase_realtime add table actividad;
