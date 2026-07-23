-- Forward-safe staff workspace migration. The owner-memory baseline also contains
-- the first notes/files definition for fresh installs; IF NOT EXISTS and policy
-- replacement keep this migration safe for environments that already applied it.

create table if not exists public.internal_case_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  note_type text not null default 'case_review',
  provenance text not null default 'staff_analysis',
  source_name text,
  source_url text,
  visibility text not null default 'internal' check (visibility = 'internal'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internal_case_notes
  add column if not exists provenance text not null default 'staff_analysis',
  add column if not exists source_name text,
  add column if not exists source_url text;

alter table public.internal_case_notes
  drop constraint if exists internal_case_notes_note_type_check,
  drop constraint if exists internal_case_notes_provenance_check;
alter table public.internal_case_notes
  add constraint internal_case_notes_note_type_check check (
    note_type in (
      'case_review', 'document_review', 'research', 'production', 'parcel_gis',
      'title', 'tax_roll', 'operator', 'comparable', 'valuation_prep', 'assignment'
    )
  ),
  add constraint internal_case_notes_provenance_check check (
    provenance in (
      'confirmed', 'stated', 'estimated', 'assumed', 'not_found',
      'cannot_verify', 'staff_analysis'
    )
  );

create table if not exists public.internal_case_files (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  storage_bucket text not null default 'staff-case-files' check (storage_bucket = 'staff-case-files'),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  purpose text not null default 'case_workspace',
  status text not null default 'pending_upload',
  visibility text not null default 'internal' check (visibility = 'internal'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internal_case_files
  drop constraint if exists internal_case_files_mime_type_check,
  drop constraint if exists internal_case_files_purpose_check,
  drop constraint if exists internal_case_files_status_check;
alter table public.internal_case_files
  add constraint internal_case_files_mime_type_check check (
    mime_type in (
      'application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/csv',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )
  ),
  add constraint internal_case_files_purpose_check check (
    purpose in (
      'case_workspace', 'mineralholders_import', 'research_source', 'production',
      'parcel_gis', 'title_review', 'tax_roll', 'operator', 'comparable',
      'underwriter_brief', 'data_pull_brief', 'valuation_support'
    )
  ),
  add constraint internal_case_files_status_check check (
    status in ('pending_upload', 'ready', 'rejected', 'deleted')
  );

create table if not exists public.internal_case_workspaces (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  status text not null default 'intake' check (
    status in (
      'intake', 'needs_info', 'research', 'underwriting', 'ready_for_review', 'offer_pending',
      'offer_sent', 'due_diligence', 'documents_complete', 'title_review',
      'closing_scheduled', 'closed', 'lost', 'on_hold'
    )
  ),
  case_rating text not null default 'unrated' check (
    case_rating in ('unrated', 'cold', 'warm', 'hot', 'priority')
  ),
  priority text not null default 'normal' check (priority in ('normal', 'high', 'urgent')),
  intake_confidence_score smallint check (
    intake_confidence_score is null or intake_confidence_score between 0 and 100
  ),
  verification_confidence text not null default 'unknown' check (
    verification_confidence in ('unknown', 'low', 'medium', 'high')
  ),
  underwriter_brief text not null default '',
  data_pull_brief text not null default '',
  confidence_gaps text not null default '',
  recommended_focus text not null default '',
  risk_flags jsonb not null default '[]'::jsonb check (jsonb_typeof(risk_flags) = 'array'),
  canonical_extraction_policy text not null default 'full_county_42_column' check (
    canonical_extraction_policy = 'full_county_42_column'
  ),
  valuation_status text not null default 'blocked_pending_methodology_approval' check (
    valuation_status in ('blocked_pending_methodology_approval', 'human_review', 'approved')
  ),
  opportunity_value_cents bigint check (opportunity_value_cents is null or opportunity_value_cents >= 0),
  opportunity_size_label text,
  mineral_rights_count integer check (mineral_rights_count is null or mineral_rights_count >= 0),
  last_contact_at timestamptz,
  ghl_opportunity_id text,
  ghl_pipeline_id text,
  ghl_pipeline_stage_id text,
  ghl_pipeline_name text,
  ghl_pipeline_stage_name text,
  ghl_pipeline_status text,
  created_by uuid references public.staff_profiles(id) on delete set null,
  updated_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.internal_case_workspaces
  add column if not exists case_rating text not null default 'unrated',
  add column if not exists opportunity_value_cents bigint,
  add column if not exists opportunity_size_label text,
  add column if not exists mineral_rights_count integer,
  add column if not exists last_contact_at timestamptz,
  add column if not exists ghl_opportunity_id text,
  add column if not exists ghl_pipeline_id text,
  add column if not exists ghl_pipeline_stage_id text,
  add column if not exists ghl_pipeline_name text,
  add column if not exists ghl_pipeline_stage_name text,
  add column if not exists ghl_pipeline_status text;

alter table public.internal_case_workspaces
  drop constraint if exists internal_case_workspaces_status_check,
  drop constraint if exists internal_case_workspaces_case_rating_check,
  drop constraint if exists internal_case_workspaces_opportunity_value_cents_check,
  drop constraint if exists internal_case_workspaces_mineral_rights_count_check;
alter table public.internal_case_workspaces
  add constraint internal_case_workspaces_status_check check (
    status in (
      'intake', 'needs_info', 'research', 'underwriting', 'ready_for_review', 'offer_pending',
      'offer_sent', 'due_diligence', 'documents_complete', 'title_review',
      'closing_scheduled', 'closed', 'lost', 'on_hold'
    )
  ),
  add constraint internal_case_workspaces_case_rating_check check (
    case_rating in ('unrated', 'cold', 'warm', 'hot', 'priority')
  ),
  add constraint internal_case_workspaces_opportunity_value_cents_check check (
    opportunity_value_cents is null or opportunity_value_cents >= 0
  ),
  add constraint internal_case_workspaces_mineral_rights_count_check check (
    mineral_rights_count is null or mineral_rights_count >= 0
  );

comment on table public.internal_case_workspaces is
  'Staff-only case dossier. It is never returned by owner account, chat, or export APIs.';
comment on column public.internal_case_workspaces.canonical_extraction_policy is
  'Claude-import default: preserve the unmodified full-county MineralHolders 42-column export.';
comment on column public.internal_case_workspaces.valuation_status is
  'Production valuation remains blocked until a qualified human approves the methodology.';
comment on column public.internal_case_workspaces.ghl_pipeline_stage_id is
  'Real GoHighLevel stage id from configured MRX pipeline mapping or live sync; never a placeholder.';

create index if not exists internal_case_notes_profile_idx
  on public.internal_case_notes(profile_id, created_at desc);
create index if not exists internal_case_files_profile_idx
  on public.internal_case_files(profile_id, created_at desc);
create index if not exists internal_case_workspaces_queue_idx
  on public.internal_case_workspaces(status, priority, updated_at desc);
create index if not exists internal_case_workspaces_search_idx
  on public.internal_case_workspaces(case_rating, status, last_contact_at desc, updated_at desc);

drop trigger if exists internal_case_notes_updated_at on public.internal_case_notes;
create trigger internal_case_notes_updated_at before update on public.internal_case_notes
  for each row execute function public.set_updated_at();
drop trigger if exists internal_case_files_updated_at on public.internal_case_files;
create trigger internal_case_files_updated_at before update on public.internal_case_files
  for each row execute function public.set_updated_at();
drop trigger if exists internal_case_workspaces_updated_at on public.internal_case_workspaces;
create trigger internal_case_workspaces_updated_at before update on public.internal_case_workspaces
  for each row execute function public.set_updated_at();

alter table public.internal_case_notes enable row level security;
alter table public.internal_case_files enable row level security;
alter table public.internal_case_workspaces enable row level security;

drop policy if exists "Assigned staff read internal case notes" on public.internal_case_notes;
create policy "Assigned staff read internal case notes" on public.internal_case_notes for select
  using (visibility = 'internal' and public.can_access_profile(profile_id));
drop policy if exists "Assigned staff create internal case notes" on public.internal_case_notes;
create policy "Assigned staff create internal case notes" on public.internal_case_notes for insert
  with check (
    visibility = 'internal'
    and public.can_access_profile(profile_id)
    and exists (
      select 1 from public.staff_profiles s
      where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true
    )
  );

drop policy if exists "Assigned staff read internal case files" on public.internal_case_files;
create policy "Assigned staff read internal case files" on public.internal_case_files for select
  using (visibility = 'internal' and public.can_access_profile(profile_id));
drop policy if exists "Assigned staff create internal case files" on public.internal_case_files;
create policy "Assigned staff create internal case files" on public.internal_case_files for insert
  with check (
    visibility = 'internal'
    and public.can_access_profile(profile_id)
    and exists (
      select 1 from public.staff_profiles s
      where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true
    )
  );
drop policy if exists "Assigned staff update own pending internal case files" on public.internal_case_files;
create policy "Assigned staff update own pending internal case files" on public.internal_case_files for update
  using (
    visibility = 'internal'
    and status = 'pending_upload'
    and public.can_access_profile(profile_id)
    and (
      public.is_mrx_admin()
      or exists (
        select 1 from public.staff_profiles s
        where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true
      )
    )
  )
  with check (visibility = 'internal' and public.can_access_profile(profile_id));

drop policy if exists "Assigned staff read internal case workspaces" on public.internal_case_workspaces;
create policy "Assigned staff read internal case workspaces" on public.internal_case_workspaces for select
  using (public.can_access_profile(profile_id));
drop policy if exists "Assigned staff create internal case workspaces" on public.internal_case_workspaces;
create policy "Assigned staff create internal case workspaces" on public.internal_case_workspaces for insert
  with check (
    public.can_access_profile(profile_id)
    and exists (
      select 1 from public.staff_profiles s
      where s.id = created_by and s.user_id = auth.uid() and s.active = true
    )
  );
drop policy if exists "Assigned staff update internal case workspaces" on public.internal_case_workspaces;
create policy "Assigned staff update internal case workspaces" on public.internal_case_workspaces for update
  using (public.can_access_profile(profile_id))
  with check (
    public.can_access_profile(profile_id)
    and exists (
      select 1 from public.staff_profiles s
      where s.id = updated_by and s.user_id = auth.uid() and s.active = true
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'staff-case-files',
  'staff-case-files',
  false,
  26214400,
  array[
    'application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Keep the private dossier intact when an anonymous intake profile is merged
-- into an existing verified owner profile. This replaces the latest prior
-- function definition from the geography migration.
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
      and verified_at is not null
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
      update public.internal_case_notes set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.internal_case_files set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.consent_receipts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.appointments set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.communication_dispatches set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.geography_resolutions set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.audit_events set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;

      if exists (
        select 1 from public.internal_case_workspaces where profile_id = anonymous_profile_id
      ) then
        if exists (
          select 1 from public.internal_case_workspaces where profile_id = canonical_profile_id
        ) then
          update public.internal_case_workspaces canonical
          set underwriter_brief = concat_ws(
                E'\n\n--- MERGED INTAKE ---\n\n',
                nullif(canonical.underwriter_brief, ''),
                nullif(anonymous.underwriter_brief, '')
              ),
              data_pull_brief = concat_ws(
                E'\n\n--- MERGED INTAKE ---\n\n',
                nullif(canonical.data_pull_brief, ''),
                nullif(anonymous.data_pull_brief, '')
              ),
              confidence_gaps = concat_ws(
                E'\n\n',
                nullif(canonical.confidence_gaps, ''),
                nullif(anonymous.confidence_gaps, '')
              ),
              recommended_focus = concat_ws(
                E'\n\n',
                nullif(canonical.recommended_focus, ''),
                nullif(anonymous.recommended_focus, '')
              ),
              risk_flags = canonical.risk_flags || anonymous.risk_flags,
              updated_at = greatest(canonical.updated_at, anonymous.updated_at)
          from public.internal_case_workspaces anonymous
          where canonical.profile_id = canonical_profile_id
            and anonymous.profile_id = anonymous_profile_id;
          delete from public.internal_case_workspaces where profile_id = anonymous_profile_id;
        else
          update public.internal_case_workspaces
          set profile_id = canonical_profile_id
          where profile_id = anonymous_profile_id;
        end if;
      end if;

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
