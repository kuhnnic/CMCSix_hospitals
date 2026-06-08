-- Reset seed for stations and beds using existing public.sasis_hospitals.
-- Deletes all rows in public.beds and recreates demo beds.
-- Ensures public.stations exists and beds are linked via station_id.
-- Rules:
-- - occupied/reserved beds always use female or male
-- - free beds in a room with occupied/reserved beds use the same gender
-- - unassigned is only used in rooms without occupied/reserved beds
-- - max 4 beds per room
-- - isolation beds are alone in their room

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

alter table public.beds
  drop constraint if exists beds_station_id_fkey;

delete from public.beds;
delete from public.stations;

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
cross join lateral unnest(h.specialties) with ordinality as s(specialty, idx);

with hs as (
  select st.hospital_id, st.id as station_id, st.specialty, st.name as station, st.sort_order as specialty_index
  from public.stations st
), room_templates as (
  select * from (values
    (1, 1, 'unassigned', true,  array['free']),
    (2, 2, 'female',     false, array['occupied','free']),
    (3, 2, 'male',       false, array['reserved','free']),
    (4, 4, 'female',     false, array['occupied','reserved','free','free']),
    (5, 1, 'unassigned', false, array['cleaning'])
  ) as t(room_variant, bed_count, gender, isolation_room, status_pattern)
), generated as (
  select
    hs.hospital_id,
    hs.station_id,
    hs.specialty,
    hs.station,
    hs.specialty_index,
    t.room_variant,
    (hs.specialty_index::text || lpad(t.room_variant::text, 2, '0')) as room,
    chr(64 + bed_no)::text as bed,
    t.gender,
    t.isolation_room,
    t.status_pattern[bed_no] as status,
    bed_no::int as bed_no
  from hs
  cross join room_templates t
  cross join lateral generate_series(1, t.bed_count) as bed_no
), prepared as (
  select
    hospital_id || '-' || room || '-' || bed as id,
    hospital_id,
    station_id,
    specialty,
    station,
    room,
    bed,
    case
      when isolation_room then 'Isolationsbett'
      when room_variant = 2 and bed_no = 1 then 'Überwachungsbett'
      when room_variant = 5 then 'Barrierefreies Bett'
      when room_variant = 4 and bed_no = 4 then 'Kurzliegerbett'
      else 'Standardbett'
    end as type,
    case when room_variant = 2 and bed_no = 1 then 'Überwachung' else 'Normalpflege' end as care,
    isolation_room as isolation,
    (isolation_room or (room_variant = 2 and bed_no = 1)) as oxygen,
    (room_variant = 2 and bed_no = 1) as monitoring,
    (room_variant = 5) as accessible,
    gender,
    status,
    case
      when status in ('occupied','reserved') then 'Seed: assigned gender required'
      when status = 'free' and gender in ('female','male') then 'Seed: free bed follows assigned room gender'
      when gender = 'unassigned' then 'Seed: room has no occupied/reserved bed'
      else ''
    end as notes
  from generated
)
insert into public.beds (
  id, hospital_id, station_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
)
select
  id, hospital_id, station_id, specialty, station, room, bed, type, care,
  isolation, oxygen, monitoring, accessible, gender, status, notes
from prepared
order by hospital_id, specialty, room, bed;

alter table public.beds
  add constraint beds_station_id_fkey
  foreign key (station_id)
  references public.stations(id)
  on update cascade
  on delete restrict;

create index if not exists stations_hospital_specialty_idx on public.stations (hospital_id, specialty);
create index if not exists beds_station_id_idx on public.beds (station_id);

alter table public.stations enable row level security;

drop policy if exists "Allow public station read" on public.stations;
create policy "Allow public station read"
on public.stations for select
to anon
using (true);

grant select on public.stations to anon, authenticated;
grant select, insert, update on public.beds to anon, authenticated;

notify pgrst, 'reload schema';

commit;

-- Controls
select count(*) as stations from public.stations;
select count(*) as beds from public.beds;
select count(*) as beds_without_station from public.beds where station_id is null;
