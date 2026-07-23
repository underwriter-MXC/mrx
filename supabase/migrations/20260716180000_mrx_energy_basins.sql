alter table public.mineral_interests
  add column if not exists basin_name text,
  add column if not exists basin_code text,
  add column if not exists basin_matches jsonb not null default '[]'::jsonb,
  add column if not exists oil_gas_province text,
  add column if not exists oil_gas_province_code text,
  add column if not exists basin_status text
    check (basin_status is null or basin_status in ('resolved', 'needs_detail', 'not_found', 'unavailable')),
  add column if not exists basin_confidence numeric(4, 3)
    check (basin_confidence is null or (basin_confidence >= 0 and basin_confidence <= 1)),
  add column if not exists basin_needs_confirmation boolean not null default true,
  add column if not exists basin_source text,
  add column if not exists basin_source_vintage text,
  add column if not exists basin_resolved_at timestamptz;

alter table public.geography_resolutions
  add column if not exists basin_name text,
  add column if not exists basin_code text,
  add column if not exists basin_matches jsonb not null default '[]'::jsonb,
  add column if not exists oil_gas_province text,
  add column if not exists oil_gas_province_code text,
  add column if not exists basin_status text
    check (basin_status is null or basin_status in ('resolved', 'needs_detail', 'not_found', 'unavailable')),
  add column if not exists basin_confidence numeric(4, 3)
    check (basin_confidence is null or (basin_confidence >= 0 and basin_confidence <= 1)),
  add column if not exists basin_needs_confirmation boolean not null default true,
  add column if not exists basin_source text,
  add column if not exists basin_source_vintage text;

create index if not exists mineral_interests_basin_idx
  on public.mineral_interests(basin_name, state_code, county_fips)
  where status = 'active';

create index if not exists geography_resolutions_basin_idx
  on public.geography_resolutions(basin_name, created_at desc)
  where basin_status = 'resolved';

comment on column public.mineral_interests.basin_name is
  'Geologic basin mapped from the saved property point. This is not the county or state recording jurisdiction.';
comment on column public.mineral_interests.oil_gas_province is
  'USGS National Oil and Gas Assessment province containing the saved property point when available.';
comment on column public.mineral_interests.basin_needs_confirmation is
  'True when the basin is derived from a survey-section center or otherwise needs tract-boundary confirmation.';
