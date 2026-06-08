-- CMCSix Hospitals · API View fuer SASIS-Stammdaten
-- Workaround fuer PGRST205 auf public.sasis_hospitals.
-- Die App kann danach public.sasis_hospitals_api lesen.

create or replace view public.sasis_hospitals_api as
select
  id,
  name,
  street,
  place,
  validity_area,
  partner_group,
  partner_subgroup,
  zsr,
  specialties,
  sort_order,
  updated_at
from public.sasis_hospitals;

grant select on public.sasis_hospitals_api to anon, authenticated;

comment on view public.sasis_hospitals_api is 'CMCSix public API view for SASIS hospital master data';

notify pgrst, 'reload schema';

select count(*) as sasis_hospitals_api_rows
from public.sasis_hospitals_api;
