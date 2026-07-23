alter table public.profiles
  add column if not exists residence_city text,
  add column if not exists residence_state text,
  add column if not exists residence_state_code text,
  add column if not exists residence_state_fips text,
  add column if not exists residence_county text,
  add column if not exists residence_county_fips text,
  add column if not exists residence_place_geoid text,
  add column if not exists residence_latitude numeric(10, 7),
  add column if not exists residence_longitude numeric(11, 7),
  add column if not exists residence_geography_status text
    check (residence_geography_status is null or residence_geography_status in ('resolved', 'ambiguous', 'needs_detail', 'not_found')),
  add column if not exists residence_geography_updated_at timestamptz;

alter table public.mineral_interests
  add column if not exists city text,
  add column if not exists nearest_city text,
  add column if not exists state_code text,
  add column if not exists county_fips text,
  add column if not exists place_geoid text,
  add column if not exists latitude numeric(10, 7),
  add column if not exists longitude numeric(11, 7),
  add column if not exists plss_id text,
  add column if not exists location_precision text
    check (location_precision is null or location_precision in ('address', 'coordinates', 'section', 'city', 'county')),
  add column if not exists geography_source text,
  add column if not exists geography_status text
    check (geography_status is null or geography_status in ('resolved', 'ambiguous', 'needs_detail', 'not_found')),
  add column if not exists geography_confidence numeric(4, 3)
    check (geography_confidence is null or (geography_confidence >= 0 and geography_confidence <= 1)),
  add column if not exists geography_resolved_at timestamptz;

create table if not exists public.geography_resolutions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  mineral_interest_id uuid references public.mineral_interests(id) on delete set null,
  source_message_id uuid references public.messages(id) on delete set null,
  source_attachment_id uuid references public.attachments(id) on delete set null,
  scope text not null check (scope in ('residence', 'mineral_interest')),
  query_type text not null check (query_type in ('address', 'coordinates', 'plss', 'city_state', 'county_state')),
  input_text text not null,
  status text not null check (status in ('resolved', 'ambiguous', 'needs_detail', 'not_found')),
  city text,
  state text,
  state_code text,
  state_fips text,
  county text,
  county_fips text,
  county_candidates jsonb not null default '[]'::jsonb,
  place_geoid text,
  latitude numeric(10, 7),
  longitude numeric(11, 7),
  precision text not null check (precision in ('address', 'coordinates', 'section', 'city', 'county')),
  confidence numeric(4, 3) not null check (confidence >= 0 and confidence <= 1),
  needs_confirmation boolean not null default true,
  provider text not null,
  provider_vintage text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists geography_resolutions_profile_idx
  on public.geography_resolutions(profile_id, created_at desc);
create index if not exists geography_resolutions_interest_idx
  on public.geography_resolutions(mineral_interest_id, created_at desc);
create index if not exists mineral_interests_geography_idx
  on public.mineral_interests(state_code, county_fips, geography_status);

alter table public.geography_resolutions enable row level security;

create policy "Owners and assigned staff read geography resolutions"
  on public.geography_resolutions for select
  using (
    exists (
      select 1 from public.profiles profile
      where profile.id = profile_id
        and (profile.user_id = auth.uid() or public.can_access_profile(profile.id))
    )
  );

comment on table public.geography_resolutions is
  'Auditable U.S. Census and BLM PLSS geography lookups. Ambiguous or derived results remain marked for owner or staff confirmation.';
comment on column public.mineral_interests.city is
  'Containing Census incorporated or designated place only; do not use for a merely nearby city.';

create or replace function public.claim_owner_conversation(
  target_conversation_id uuid,
  target_user_id uuid,
  verified_email text,
  normalized_verified_email text,
  target_device_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  canonical_profile_id uuid;
  anonymous_profile_id uuid;
  existing_identifier_profile_id uuid;
begin
  if target_user_id is null or normalized_verified_email is null then
    raise exception 'verified identity required';
  end if;

  if not exists (
    select 1 from public.conversations
    where id = target_conversation_id and (user_id is null or user_id = target_user_id)
  ) then
    raise exception 'conversation unavailable';
  end if;

  select id into canonical_profile_id from public.profiles where user_id = target_user_id;

  if canonical_profile_id is null then
    select profile_id into existing_identifier_profile_id
    from public.profile_identifiers
    where kind = 'email'
      and normalized_value = normalized_verified_email
    order by verified_at desc nulls last, created_at desc
    limit 1;
  else
    select profile_id into existing_identifier_profile_id
    from public.profile_identifiers
    where kind = 'email'
      and normalized_value = normalized_verified_email
      and verified_at is not null
    limit 1;
    if existing_identifier_profile_id is not null
       and existing_identifier_profile_id <> canonical_profile_id then
      raise exception 'verified email belongs to a different profile';
    end if;
  end if;

  if canonical_profile_id is null then
    canonical_profile_id := existing_identifier_profile_id;
  end if;

  select id into anonymous_profile_id
  from public.profiles
  where conversation_id = target_conversation_id
  limit 1;

  if canonical_profile_id is null and anonymous_profile_id is not null then
    canonical_profile_id := anonymous_profile_id;
    update public.profiles
      set user_id = target_user_id,
          email = verified_email,
          normalized_email = normalized_verified_email,
          email_verified_at = now(),
          last_seen_at = now()
      where id = canonical_profile_id;
  elsif canonical_profile_id is null then
    insert into public.profiles(user_id, conversation_id, email, normalized_email, email_verified_at)
    values (target_user_id, target_conversation_id, verified_email, normalized_verified_email, now())
    returning id into canonical_profile_id;
  else
    if anonymous_profile_id is not null and anonymous_profile_id <> canonical_profile_id then
      update public.profiles canonical
        set first_name = coalesce(canonical.first_name, anonymous.first_name),
            last_name = coalesce(canonical.last_name, anonymous.last_name),
            phone = coalesce(canonical.phone, anonymous.phone),
            normalized_phone = coalesce(canonical.normalized_phone, anonymous.normalized_phone),
            phone_verified_at = case
              when canonical.normalized_phone is not null then canonical.phone_verified_at
              else anonymous.phone_verified_at
            end,
            timezone = coalesce(canonical.timezone, anonymous.timezone),
            ghl_contact_id = coalesce(canonical.ghl_contact_id, anonymous.ghl_contact_id),
            completed_lead_at = coalesce(canonical.completed_lead_at, anonymous.completed_lead_at),
            is_test = canonical.is_test or anonymous.is_test,
            test_run_id = coalesce(canonical.test_run_id, anonymous.test_run_id),
            primary_mineral_interest_id = coalesce(canonical.primary_mineral_interest_id, anonymous.primary_mineral_interest_id),
            residence_city = coalesce(canonical.residence_city, anonymous.residence_city),
            residence_state = coalesce(canonical.residence_state, anonymous.residence_state),
            residence_state_code = coalesce(canonical.residence_state_code, anonymous.residence_state_code),
            residence_state_fips = coalesce(canonical.residence_state_fips, anonymous.residence_state_fips),
            residence_county = coalesce(canonical.residence_county, anonymous.residence_county),
            residence_county_fips = coalesce(canonical.residence_county_fips, anonymous.residence_county_fips),
            residence_place_geoid = coalesce(canonical.residence_place_geoid, anonymous.residence_place_geoid),
            residence_latitude = coalesce(canonical.residence_latitude, anonymous.residence_latitude),
            residence_longitude = coalesce(canonical.residence_longitude, anonymous.residence_longitude),
            residence_geography_status = coalesce(canonical.residence_geography_status, anonymous.residence_geography_status),
            residence_geography_updated_at = coalesce(canonical.residence_geography_updated_at, anonymous.residence_geography_updated_at)
        from public.profiles anonymous
        where canonical.id = canonical_profile_id and anonymous.id = anonymous_profile_id;

      update public.mineral_interests set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.owner_facts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.owner_memory_chunks set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.attachments set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.consent_receipts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.appointments set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.communication_dispatches set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.geography_resolutions set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.audit_events set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;

      insert into public.case_assignments(profile_id, staff_profile_id, assigned_by, created_at)
      select canonical_profile_id, staff_profile_id, assigned_by, created_at
      from public.case_assignments
      where profile_id = anonymous_profile_id
      on conflict do nothing;
      delete from public.case_assignments where profile_id = anonymous_profile_id;

      insert into public.profile_identifiers(
        profile_id, kind, normalized_value, display_value, verified_at, is_primary, created_at, updated_at
      )
      select canonical_profile_id, kind, normalized_value, display_value, verified_at, is_primary, created_at, updated_at
      from public.profile_identifiers
      where profile_id = anonymous_profile_id
      on conflict do nothing;
      delete from public.profile_identifiers where profile_id = anonymous_profile_id;
      delete from public.profiles where id = anonymous_profile_id;
    end if;

    update public.profiles
      set user_id = target_user_id,
          conversation_id = target_conversation_id,
          email = verified_email,
          normalized_email = normalized_verified_email,
          email_verified_at = now(),
          last_seen_at = now()
      where id = canonical_profile_id;
  end if;

  insert into public.profile_identifiers(profile_id, kind, normalized_value, display_value, verified_at, is_primary)
  values (canonical_profile_id, 'email', normalized_verified_email, verified_email, now(), true)
  on conflict do nothing;

  update public.conversations
    set user_id = target_user_id, profile_id = canonical_profile_id, updated_at = now()
    where id = target_conversation_id;
  update public.owner_facts
    set profile_id = canonical_profile_id
    where conversation_id = target_conversation_id and profile_id is null;
  if target_device_hash is not null then
    update public.device_sessions
      set user_id = target_user_id,
          active_conversation_id = target_conversation_id,
          last_seen_at = now()
      where token_hash = target_device_hash;
  end if;

  return canonical_profile_id;
end;
$$;

revoke all on function public.claim_owner_conversation(uuid, uuid, text, text, text)
  from public, anon, authenticated;
grant execute on function public.claim_owner_conversation(uuid, uuid, text, text, text)
  to service_role;
