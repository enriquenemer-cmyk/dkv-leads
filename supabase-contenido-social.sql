-- ============================================================
-- Simulador de contenido social (/panel/contenido)
-- Almacena las publicaciones simuladas para que TODO el equipo
-- vea la misma colección al instante y pueda descargarlas listas.
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ============================================================

-- 1) Bucket público para las imágenes originales subidas.
insert into storage.buckets (id, name, public)
values ('contenido-social', 'contenido-social', true)
on conflict (id) do update set public = true;

-- 2) Cualquiera puede LEER las imágenes (para verlas y descargarlas).
drop policy if exists "contenido-social lectura publica" on storage.objects;
create policy "contenido-social lectura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'contenido-social');

-- 3) Los asesores con sesión pueden SUBIR imágenes.
drop policy if exists "contenido-social subida asesores" on storage.objects;
create policy "contenido-social subida asesores"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'contenido-social');

-- 4) Los asesores con sesión pueden BORRAR imágenes.
drop policy if exists "contenido-social borrado asesores" on storage.objects;
create policy "contenido-social borrado asesores"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'contenido-social');

-- ============================================================
-- 5) Tabla con las simulaciones guardadas (la "colección").
-- ============================================================
create table if not exists public.contenido_simulaciones (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  autor       text,
  platform    text not null,
  ratio       text not null,
  username    text,
  ubicacion   text,
  likes       text,
  caption     text,
  verified    boolean not null default false,
  fit         text not null default 'cover',
  bg          text not null default '#ffffff',
  img_url     text not null,
  img_path    text,
  thumb       text
);

alter table public.contenido_simulaciones enable row level security;

-- Los asesores con sesión ven TODA la colección (contenido compartido).
drop policy if exists "contenido lectura asesores" on public.contenido_simulaciones;
create policy "contenido lectura asesores"
  on public.contenido_simulaciones for select
  to authenticated
  using (true);

-- Los asesores con sesión pueden AÑADIR a la colección.
drop policy if exists "contenido insert asesores" on public.contenido_simulaciones;
create policy "contenido insert asesores"
  on public.contenido_simulaciones for insert
  to authenticated
  with check (true);

-- Los asesores con sesión pueden BORRAR de la colección.
drop policy if exists "contenido delete asesores" on public.contenido_simulaciones;
create policy "contenido delete asesores"
  on public.contenido_simulaciones for delete
  to authenticated
  using (true);

-- Actualizaciones en tiempo real (para que la colección aparezca al instante en todos los paneles).
alter publication supabase_realtime add table public.contenido_simulaciones;
