-- ============================================================
-- Bucket público para las imágenes de las campañas de email marketing.
-- Ejecutar UNA vez en Supabase → SQL Editor.
-- ============================================================

-- 1) Crea el bucket público 'email-assets' (idempotente).
insert into storage.buckets (id, name, public)
values ('email-assets', 'email-assets', true)
on conflict (id) do update set public = true;

-- 2) Cualquiera puede LEER las imágenes (necesario para que se vean en el correo).
drop policy if exists "email-assets lectura publica" on storage.objects;
create policy "email-assets lectura publica"
  on storage.objects for select
  to public
  using (bucket_id = 'email-assets');

-- 3) Los asesores con sesión pueden SUBIR imágenes.
drop policy if exists "email-assets subida asesores" on storage.objects;
create policy "email-assets subida asesores"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'email-assets');
