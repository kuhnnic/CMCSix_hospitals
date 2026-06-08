-- CMCSix Hospitals · Supabase/PostgREST Schema-Cache neu laden
-- Ausführen, wenn die App PGRST205 meldet:
-- "Could not find the table 'public.sasis_hospitals' in the schema cache"

-- 1) Prüfen, ob die Tabelle wirklich im public-Schema existiert.
select to_regclass('public.sasis_hospitals') as sasis_hospitals_table;
select to_regclass('public.beds') as beds_table;

-- 2) Leserechte und RLS-Policies nochmals sicherstellen.
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

-- 3) PostgREST/Supabase API Schema-Cache neu laden.
notify pgrst, 'reload schema';

-- 4) Kontrollen.
select count(*) as sasis_hospitals from public.sasis_hospitals;
select count(*) as beds from public.beds;
