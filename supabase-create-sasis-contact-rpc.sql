-- CMCSix Hospitals
-- RPC-Workaround für PostgREST Schema-Cache-Probleme bei neuen Spalten.
-- In Supabase SQL Editor ausführen.

-- Spalten sicherstellen.
alter table public.sasis_hospitals
  add column if not exists contact_tel text,
  add column if not exists remarks text;

-- Funktion speichert die zwei Dashboard-only Felder direkt in der Basistabelle.
create or replace function public.update_sasis_contact_fields(
  p_id text,
  p_contact_tel text,
  p_remarks text
)
returns table (
  id text,
  contact_tel text,
  remarks text
)
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.sasis_hospitals h
     set contact_tel = p_contact_tel,
         remarks = p_remarks
   where h.id = p_id;

  if not found then
    raise exception 'No hospital found for id %', p_id using errcode = 'P0002';
  end if;

  return query
  select h.id::text, h.contact_tel, h.remarks
    from public.sasis_hospitals h
   where h.id = p_id;
end;
$$;

-- Rechte für Demo-App.
grant execute on function public.update_sasis_contact_fields(text, text, text) to anon, authenticated;

grant select on public.sasis_hospitals to anon, authenticated;
grant update (contact_tel, remarks) on public.sasis_hospitals to anon, authenticated;

-- PostgREST Schema-Cache refreshen, damit die RPC sichtbar wird.
select pg_notify('pgrst', 'reload schema');
notify pgrst, 'reload schema';

-- Kontrolltest: Funktion muss sichtbar sein.
select routine_schema, routine_name
from information_schema.routines
where routine_schema = 'public'
  and routine_name = 'update_sasis_contact_fields';
