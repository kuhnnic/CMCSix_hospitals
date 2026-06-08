-- CMCSix Hospitals · Public read policies sicherstellen
-- Im Supabase SQL Editor ausführen, falls die App keine SASIS- oder Betten-Daten lesen kann,
-- obwohl die Daten in der DB vorhanden sind.

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

-- Kontrolle: sollte 16 liefern.
select count(*) as sasis_hospitals from public.sasis_hospitals;

-- Kontrolle: sollte Betten pro Spital zeigen.
select h.id, h.name, count(b.id) as beds
from public.sasis_hospitals h
left join public.beds b on b.hospital_id = h.id
group by h.id, h.name, h.sort_order
order by h.sort_order;
