-- Fix fuer Supabase/PostgREST Fehler PGRST205:
-- Could not find the table 'public.sasis_hospitals' in the schema cache

-- 1) Sicherstellen, dass die Tabelle im public Schema existiert.
create table if not exists public.sasis_hospitals (
  id text primary key,
  name text not null,
  street text not null default '',
  place text not null default '',
  validity_area text not null default '',
  partner_group text not null default '',
  partner_subgroup text not null default '',
  zsr text not null default '',
  specialties text[] not null default '{}',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now()
);

-- 2) Rechte fuer die Supabase REST API Rollen setzen.
grant usage on schema public to anon, authenticated;
grant select on table public.sasis_hospitals to anon, authenticated;
grant select, insert, update on table public.beds to anon, authenticated;

-- 3) RLS Policies sicherstellen.
alter table public.sasis_hospitals enable row level security;
alter table public.beds enable row level security;

drop policy if exists "Allow public hospital read" on public.sasis_hospitals;
create policy "Allow public hospital read"
on public.sasis_hospitals for select
to anon
using (true);

drop policy if exists "Allow public bed read" on public.beds;
create policy "Allow public bed read"
on public.beds for select
to anon
using (true);

drop policy if exists "Allow public bed insert" on public.beds;
create policy "Allow public bed insert"
on public.beds for insert
to anon
with check (true);

drop policy if exists "Allow public bed update" on public.beds;
create policy "Allow public bed update"
on public.beds for update
to anon
using (true)
with check (true);

-- 4) Kleine DDL-Aenderung, damit PostgREST den Schema-Cache sicher erneuert.
comment on table public.sasis_hospitals is 'CMCSix SASIS hospital master data exposed through Supabase REST API';
comment on table public.beds is 'CMCSix hospital beds exposed through Supabase REST API';

-- 5) Schema-Cache reload an PostgREST senden.
notify pgrst, 'reload schema';

-- 6) Kontrollen.
select to_regclass('public.sasis_hospitals') as sasis_hospitals_table;
select count(*) as sasis_hospitals from public.sasis_hospitals;
select count(*) as beds from public.beds;
