-- CMCSix Hospitals · Stations as first-class entity
-- Run after supabase-sasis-hospitals.sql and supabase-schema.sql.
-- This migration keeps the existing beds.station text column for backward compatibility,
-- but makes public.stations the source of truth and links beds via station_id.

begin;

create table if not exists public.stations (
  id text primary key,
  hospital_id text not null references public.sasis_hospitals(id) on update cascade on delete restrict,
  specialty text not null,
  name text not null,
  code text not null default '',
  floor text not null default '',
  sort_order integer not null default 0,
  updated_at timestamptz not null default now(),
  unique (hospital_id, specialty, name)
);

alter table public.beds
  add column if not exists station_id text;

-- Create deterministic stations for every hospital/specialty combination.
insert into public.stations (id, hospital_id, specialty, name, code, floor, sort_order)
select
  h.id || '-station-' || s.idx::text as id,
  h.id as hospital_id,
  s.specialty,
  split_part(s.specialty, ' ', 1) || ' ' || substr('ABCD', (1 + ((s.idx::int - 1) % 4))::int, 1) as name,
  upper(substr(regexp_replace(s.specialty, '[^A-Za-zÄÖÜäöü0-9]+', '', 'g'), 1, 4)) || '-' || s.idx::text as code,
  (1 + ((s.idx::int - 1) % 5))::text as floor,
  s.idx::int as sort_order
from public.sasis_hospitals h
cross join lateral unnest(h.specialties) with ordinality as s(specialty, idx)
on conflict (id) do update set
  hospital_id = excluded.hospital_id,
  specialty = excluded.specialty,
  name = excluded.name,
  code = excluded.code,
  floor = excluded.floor,
  sort_order = excluded.sort_order,
  updated_at = now();

-- Link existing beds to the matching station.
update public.beds b
set station_id = st.id,
    station = st.name
from public.stations st
where st.hospital_id = b.hospital_id
  and st.specialty = b.specialty
  and (
    b.station_id is null
    or b.station_id = ''
    or b.station_id <> st.id
  );

-- Automatically assign station_id/station for beds inserted by the app.
create or replace function public.assign_bed_station()
returns trigger
language plpgsql
as $$
declare
  selected_station public.stations%rowtype;
begin
  if new.station_id is not null and new.station_id <> '' then
    select * into selected_station
    from public.stations
    where id = new.station_id;
  else
    select * into selected_station
    from public.stations
    where hospital_id = new.hospital_id
      and specialty = new.specialty
    order by sort_order, name
    limit 1;
  end if;

  if selected_station.id is not null then
    new.station_id := selected_station.id;
    new.specialty := selected_station.specialty;
    new.station := selected_station.name;
  end if;

  return new;
end;
$$;

drop trigger if exists beds_assign_station on public.beds;
create trigger beds_assign_station
before insert or update of station_id, specialty, hospital_id
on public.beds
for each row execute function public.assign_bed_station();

alter table public.beds
  drop constraint if exists beds_station_id_fkey;

alter table public.beds
  add constraint beds_station_id_fkey
  foreign key (station_id)
  references public.stations(id)
  on update cascade
  on delete restrict;

create index if not exists stations_hospital_specialty_idx on public.stations (hospital_id, specialty);
create index if not exists beds_station_id_idx on public.beds (station_id);

create or replace view public.beds_with_stations as
select
  b.*,
  st.name as station_name,
  st.code as station_code,
  st.floor as station_floor,
  st.sort_order as station_sort_order
from public.beds b
left join public.stations st on st.id = b.station_id;

grant select on public.stations to anon, authenticated;
grant select on public.beds_with_stations to anon, authenticated;
grant select, insert, update on public.beds to anon, authenticated;

alter table public.stations enable row level security;

drop policy if exists "Allow public station read" on public.stations;
create policy "Allow public station read"
on public.stations for select
to anon
using (true);

notify pgrst, 'reload schema';

commit;

-- Controls
select count(*) as stations from public.stations;
select count(*) as beds_without_station from public.beds where station_id is null;
select hospital_id, specialty, count(*) as stations
from public.stations
group by hospital_id, specialty
order by hospital_id, specialty
limit 20;
