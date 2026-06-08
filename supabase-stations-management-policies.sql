-- CMCSix Hospitals · Station management policies
-- Run after supabase-stations-design.sql.
-- Demo note: public anon insert/update is allowed because this app is explicitly for demo use without roles.

alter table public.stations enable row level security;

drop policy if exists "Allow public station read" on public.stations;
create policy "Allow public station read"
on public.stations for select
to anon
using (true);

drop policy if exists "Allow public station insert" on public.stations;
create policy "Allow public station insert"
on public.stations for insert
to anon
with check (true);

drop policy if exists "Allow public station update" on public.stations;
create policy "Allow public station update"
on public.stations for update
to anon
using (true)
with check (true);

grant select, insert, update on public.stations to anon, authenticated;
grant select, insert, update on public.beds to anon, authenticated;

create or replace function public.set_station_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists stations_set_updated_at on public.stations;
create trigger stations_set_updated_at
before update on public.stations
for each row execute function public.set_station_updated_at();

notify pgrst, 'reload schema';

select count(*) as stations from public.stations;
