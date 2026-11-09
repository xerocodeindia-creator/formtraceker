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
