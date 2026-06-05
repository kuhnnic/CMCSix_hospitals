-- CMCSix Hospitals · Supabase schema
-- Run this once in Supabase SQL Editor before using the app with the shared DB.
-- MVP note: the policies below allow public anon access because the current app has no login yet.
-- For production, add Supabase Auth and replace these policies with role-/hospital-based access rules.

create table if not exists public.beds (
  id text primary key,
  hospital_id text not null,
  specialty text not null,
  station text not null default '',
  room text not null default '',
  bed text not null default 'A',
  type text not null default 'Standardbett',
  care text not null default 'Normalpflege',
  isolation boolean not null default false,
  oxygen boolean not null default false,
  monitoring boolean not null default false,
  accessible boolean not null default false,
  status text not null default 'free' check (status in ('free','reserved','occupied','cleaning','blocked')),
  notes text not null default '',
  updated_at timestamptz not null default now()
);

create index if not exists beds_hospital_id_idx on public.beds (hospital_id);
create index if not exists beds_status_idx on public.beds (status);
create index if not exists beds_specialty_idx on public.beds (specialty);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists beds_set_updated_at on public.beds;
create trigger beds_set_updated_at
before update on public.beds
for each row execute function public.set_updated_at();

alter table public.beds enable row level security;

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
