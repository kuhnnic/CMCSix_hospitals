-- CMCSix Hospitals · Zimmer- und Bettenregeln
-- Im Supabase SQL Editor ausführen.
-- Diese Migration schützt die wichtigsten Demo-Regeln direkt in der Datenbank.
--
-- Regeln:
-- 1) Alle Betten haben innerhalb eines Spitals eine eindeutige ID.
--    Die globale Primary-Key-ID ist bereits eindeutig; zusätzlich wird hospital_id + id abgesichert.
-- 2) Innerhalb eines Spitals darf dieselbe Zimmernummer nur als ein logisches Zimmer verwendet werden.
--    Da die Tabelle beds pro Bett eine Zeile enthält, teilen sich mehrere Betten desselben Zimmers dieselbe room-Nummer.
-- 3) Pro Zimmer sind maximal 4 Betten erlaubt.
-- 4) Bett-Bezeichnungen, z.B. A/B/C/D, dürfen pro Zimmer nicht doppelt vorkommen.
-- 5) Ein Isolationsbett muss alleine in einem Zimmer stehen.
-- 6) In ein Zimmer mit Isolationsbett darf kein weiteres Bett eingefügt werden.

create unique index if not exists beds_hospital_id_id_unique_idx
on public.beds (hospital_id, id);

create unique index if not exists beds_hospital_room_bed_unique_idx
on public.beds (hospital_id, room, bed);

create or replace function public.validate_bed_room_rules()
returns trigger
language plpgsql
as $$
declare
  existing_count integer;
  existing_isolation boolean;
begin
  if new.room is null or btrim(new.room) = '' then
    raise exception 'Zimmernummer darf nicht leer sein.';
  end if;

  if new.bed is null or btrim(new.bed) = '' then
    raise exception 'Bett-ID darf nicht leer sein.';
  end if;

  select count(*)
  into existing_count
  from public.beds b
  where b.hospital_id = new.hospital_id
    and b.room = new.room
    and b.id <> coalesce(new.id, '');

  if existing_count >= 4 then
    raise exception 'Zimmer % im Spital % hat bereits 4 Betten.', new.room, new.hospital_id;
  end if;

  select exists (
    select 1
    from public.beds b
    where b.hospital_id = new.hospital_id
      and b.room = new.room
      and b.id <> coalesce(new.id, '')
      and b.isolation = true
  )
  into existing_isolation;

  if new.isolation = true and existing_count > 0 then
    raise exception 'Isolationsbett muss alleine im Zimmer % stehen.', new.room;
  end if;

  if new.isolation = false and existing_isolation = true then
    raise exception 'Zimmer % enthält bereits ein Isolationsbett.', new.room;
  end if;

  return new;
end;
$$;

drop trigger if exists beds_validate_room_rules on public.beds;
create trigger beds_validate_room_rules
before insert or update on public.beds
for each row execute function public.validate_bed_room_rules();

-- Kontrolle: Zimmer mit mehr als 4 Betten. Sollte 0 Zeilen liefern.
select hospital_id, room, count(*) as bed_count
from public.beds
group by hospital_id, room
having count(*) > 4;

-- Kontrolle: Isolationszimmer mit weiteren Betten. Sollte 0 Zeilen liefern.
select b.hospital_id, b.room, count(*) as bed_count
from public.beds b
where exists (
  select 1
  from public.beds i
  where i.hospital_id = b.hospital_id
    and i.room = b.room
    and i.isolation = true
)
group by b.hospital_id, b.room
having count(*) > 1;
