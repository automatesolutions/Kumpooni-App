-- Run this after the duplicate-key error. Do not re-run the full bootstrap.

select setval(pg_get_serial_sequence('public.service', 'id'), (select max(id) from public.service));
select setval(pg_get_serial_sequence('public.categories', 'id'), (select max(id) from public.categories));

insert into public.store (id, name, address, city, contact_no, latitude, longitude, business_hours, tagline, store_img, store_logo) values
  ('5fb344c6-f65c-444f-8aa5-2396508356fd', 'Auto-Mate', 'BGC, Taguig', 'Taguig', '09171234567', 14.5503, 121.0509, 'Mon–Sat 8:00–18:00', 'Same-day service', null, null),
  ('11111111-1111-1111-1111-111111111111', 'Makati Auto Care', 'Poblacion, Makati', 'Makati', '09181234567', 14.5636, 121.0265, 'Mon–Sat 8:00–17:00', 'Honest prices', null, null),
  ('22222222-2222-2222-2222-222222222222', 'QC Pit Stop', 'Timog Ave, Quezon City', 'Quezon City', '09191234567', 14.6370, 121.0308, 'Daily 7:00–19:00', 'Open late', null, null),
  ('33333333-3333-3333-3333-333333333333', 'Cebu Car Hub', 'IT Park, Cebu City', 'Cebu City', '09201234567', 10.3270, 123.9060, 'Mon–Sat 8:00–18:00', 'Visayas ready', null, null)
on conflict (id) do update set name = excluded.name, latitude = excluded.latitude, longitude = excluded.longitude;

insert into public.store_categories (store_id, category_id)
select s.id, c.id from public.store s cross join public.categories c
on conflict do nothing;

insert into public.service (category_id, store_id, source_id, name, price, short_description, description, inclusion, is_active, is_car_required, type, status, service_type)
select
  cat.id,
  st.id,
  cat_svc.id,
  cat_svc.name,
  round(cat_svc.price * st.mult, 0),
  cat_svc.short_description,
  cat_svc.description,
  cat_svc.inclusion,
  true,
  cat_svc.is_car_required,
  'Service',
  'Active',
  'In-Store'
from public.service cat_svc
join public.categories cat on cat.id = cat_svc.category_id
join (
  select id, 1.00::numeric as mult from public.store where id = '5fb344c6-f65c-444f-8aa5-2396508356fd'
  union all
  select id, 1.12 from public.store where id = '11111111-1111-1111-1111-111111111111'
  union all
  select id, 0.92 from public.store where id = '22222222-2222-2222-2222-222222222222'
  union all
  select id, 1.05 from public.store where id = '33333333-3333-3333-3333-333333333333'
) st on true
where cat_svc.store_id is null
  and not exists (
    select 1 from public.service x
    where x.store_id = st.id and x.source_id = cat_svc.id
  );

insert into public.brand (id, name) values
  (1, 'Toyota'), (2, 'Honda'), (3, 'Mitsubishi'), (4, 'Ford'), (5, 'Hyundai'), (6, 'Nissan'), (7, 'BYD')
on conflict (id) do update set name = excluded.name;

insert into public.model (id, brand_id, name) values
  (1, 1, 'Vios'), (2, 1, 'Fortuner'), (3, 1, 'Innova'),
  (4, 2, 'Civic'), (5, 2, 'CR-V'),
  (6, 3, 'Montero Sport'), (7, 3, 'Mirage'),
  (8, 4, 'Ranger'), (9, 4, 'Everest'),
  (10, 5, 'Tucson'), (11, 6, 'Navara'), (12, 7, 'Atto 3')
on conflict (id) do update set name = excluded.name, brand_id = excluded.brand_id;

select setval(pg_get_serial_sequence('public.service', 'id'), (select max(id) from public.service));
select setval(pg_get_serial_sequence('public.brand', 'id'), (select max(id) from public.brand));
select setval(pg_get_serial_sequence('public.model', 'id'), (select max(id) from public.model));
