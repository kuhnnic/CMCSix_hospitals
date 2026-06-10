-- Optional: add precise hospital coordinates for the Leaflet map.
-- The dashboard can use lat/lng from Supabase when these columns exist.
-- Adjust table name if your SASIS hospital table is named differently.

alter table public.sasis_hospitals_api
  add column if not exists lat double precision,
  add column if not exists lng double precision;

-- Example updates based on current demo hospital locations.
-- Verify coordinates before productive usage.

update public.sasis_hospitals_api set lat = 47.0573, lng = 8.2984 where lower(name) like '%luks%' and lower(coalesce(place,'')) like '%luzern%';
update public.sasis_hospitals_api set lat = 47.1743, lng = 8.1117 where lower(name) like '%luks%' and lower(coalesce(place,'')) like '%sursee%';
update public.sasis_hospitals_api set lat = 47.0595, lng = 8.0738 where lower(name) like '%luks%' and lower(coalesce(place,'')) like '%wolhusen%';
update public.sasis_hospitals_api set lat = 47.0605, lng = 8.3376 where lower(name) like '%st. anna%' or lower(name) like '%st anna%';
update public.sasis_hospitals_api set lat = 47.0611, lng = 8.3428 where lower(name) like '%sonnmatt%';
update public.sasis_hospitals_api set lat = 47.3907, lng = 8.0470 where lower(name) like '%kantonsspital aarau%';
update public.sasis_hospitals_api set lat = 46.8981, lng = 8.2484 where lower(name) like '%kantonsspital obwalden%';
update public.sasis_hospitals_api set lat = 46.8980, lng = 8.2490 where lower(name) like '%luzerner psychiatrie%' and lower(coalesce(place,'')) like '%sarnen%';
update public.sasis_hospitals_api set lat = 46.9584, lng = 8.3693 where lower(name) like '%spital nidwalden%';
update public.sasis_hospitals_api set lat = 47.6315, lng = 9.2324 where lower(coalesce(place,'')) like '%münsterlingen%' or lower(coalesce(place,'')) like '%muensterlingen%';
update public.sasis_hospitals_api set lat = 47.6900, lng = 8.7560 where lower(name) like '%katharinental%' or lower(coalesce(place,'')) like '%diessenhofen%';
update public.sasis_hospitals_api set lat = 47.5575, lng = 8.8992 where lower(coalesce(place,'')) like '%frauenfeld%';
