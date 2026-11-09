-- Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.forms(id uuid primary key default gen_random_uuid(),slug text unique not null,name text not null,headline text not null default 'Get started today',target_url text not null,fields jsonb not null default '[]'::jsonb,active boolean not null default true,created_at timestamptz not null default now());
create table if not exists public.clicks(id uuid primary key default gen_random_uuid(),form_id uuid not null references public.forms(id) on delete cascade,click_id text unique not null,attribution jsonb not null default '{}'::jsonb,user_agent text,referer text,created_at timestamptz not null default now());
create table if not exists public.leads(id uuid primary key default gen_random_uuid(),form_id uuid not null references public.forms(id) on delete cascade,name text not null,phone text not null,fields jsonb not null default '{}'::jsonb,attribution jsonb not null default '{}'::jsonb,status text not null default 'pending' check(status in ('pending','converted','rejected')),conversion_ref text,created_at timestamptz not null default now());
create index if not exists clicks_form_created_idx on public.clicks(form_id,created_at desc);
create index if not exists clicks_attribution_idx on public.clicks using gin(attribution);
create index if not exists leads_form_created_idx on public.leads(form_id,created_at desc);
create index if not exists leads_attribution_idx on public.leads using gin(attribution);
alter table public.forms enable row level security;
alter table public.clicks enable row level security;
alter table public.leads enable row level security;
-- No public policies. Access is server-side with the service role key only.

-- Run once in Supabase SQL Editor to enable short tracking URLs.
create table if not exists public.tracking_links (
 id uuid primary key default gen_random_uuid(),
 token text unique not null,
 form_id uuid not null references public.forms(id) on delete cascade,
 aff_id text not null,
 sub_aff_id text not null,
 created_at timestamptz not null default now()
);
create index if not exists tracking_links_form_idx on public.tracking_links(form_id);
alter table public.tracking_links enable row level security;
-- No public policies. Server-side service role access only.
