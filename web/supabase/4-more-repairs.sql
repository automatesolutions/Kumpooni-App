-- Step 4. Repair files for more than cars and motorcycles.
-- Run after 3-repair-proof.sql, in a new query. Safe to run again.
-- Adds homes, construction, electrical, aircon, appliances, computers, phones, and other.

alter table public.vehicle drop constraint if exists vehicle_kind_check;
alter table public.vehicle add constraint vehicle_kind_check check (kind in (
  'car', 'motorcycle', 'home', 'construction', 'electrical', 'aircon', 'appliance', 'computer', 'phone', 'other'
));
