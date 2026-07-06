-- ============================================================
-- DKV Leads – Tarjeta "Club Protección DKV" (Google Wallet)
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- El cliente que contrate los 3 seguros (Hogar, Decesos, Vida) gana un regalo sorpresa.
-- ============================================================

alter table public.leads
  add column if not exists wallet_sellos   smallint not null default 0
    check (wallet_sellos between 0 and 3),
  add column if not exists wallet_guardada boolean  not null default false,
  add column if not exists wallet_seguros  jsonb    not null default '[]'::jsonb;

comment on column public.leads.wallet_sellos   is 'Nº de seguros DKV contratados (0-3). 3 = regalo sorpresa.';
comment on column public.leads.wallet_guardada is 'True si el cliente ya guardó la tarjeta en su Google Wallet.';
comment on column public.leads.wallet_seguros  is 'Seguros contratados: array de "hogar" | "decesos" | "vida".';
