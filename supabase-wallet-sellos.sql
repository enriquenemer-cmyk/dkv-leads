-- ============================================================
-- DKV Leads – Sellos de fidelización (Google Wallet "Club Sonrisa")
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- Añade a la tabla leads el nº de sellos y si el cliente guardó la tarjeta.
-- ============================================================

alter table public.leads
  add column if not exists wallet_sellos   smallint not null default 0
    check (wallet_sellos between 0 and 5),
  add column if not exists wallet_guardada boolean  not null default false;

comment on column public.leads.wallet_sellos   is 'Sellos del Club Sonrisa (0-5). 5 = blanqueamiento dental.';
comment on column public.leads.wallet_guardada is 'True si el cliente ya guardó la tarjeta en su Google Wallet.';
