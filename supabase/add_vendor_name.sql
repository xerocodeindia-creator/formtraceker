-- Run once in Supabase SQL Editor to enable vendor names on campaigns.
alter table public.forms add column if not exists vendor_name text;
