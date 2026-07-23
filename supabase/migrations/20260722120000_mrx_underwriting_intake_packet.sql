-- Launch-ready owner intake and underwriter packet controls.
-- Raw OCR remains in encrypted Supabase document_extractions storage; packet rows
-- carry document status, redacted summaries, staff dispositions, and immutable
-- readiness snapshots only.

alter table public.attachments drop constraint if exists attachments_document_type_check;
alter table public.attachments
  add constraint attachments_document_type_check check (
    document_type is null or document_type in (
      'mineral_deed',
      'royalty_statement',
      'royalty_check_stub',
      'form_1099_misc',
      'oil_gas_lease',
      'lease_amendment',
      'division_order',
      'probate_order',
      'trust_document',
      'purchase_offer',
      'competing_offer',
      'tax_statement',
      'operator_correspondence',
      'county_record',
      'other'
    )
  );

create table if not exists public.underwriting_document_requirements (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mineral_interest_id uuid references public.mineral_interests(id) on delete cascade,
  requirement_key text not null,
  label text not null,
  rationale text,
  situation_code text not null default 'base',
  requirement_level text not null default 'required' check (
    requirement_level in ('required', 'recommended')
  ),
  required boolean not null default true,
  accepted_document_types text[] not null default '{}',
  status text not null default 'needed' check (
    status in ('needed', 'uploaded', 'processing', 'verified', 'waived', 'rejected', 'not_applicable')
  ),
  attachment_id uuid references public.attachments(id) on delete set null,
  verified_by uuid references public.staff_profiles(id) on delete set null,
  verified_at timestamptz,
  waived_by uuid references public.staff_profiles(id) on delete set null,
  waived_at timestamptz,
  waiver_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, requirement_key),
  check (
    status <> 'waived'
    or (waived_by is not null and waived_at is not null and char_length(trim(waiver_reason)) >= 10)
  ),
  check (
    status <> 'verified'
    or (attachment_id is not null and verified_by is not null and verified_at is not null)
  )
);

create table if not exists public.underwriting_packets (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'blocked', 'ready', 'reopened')),
  readiness_version text not null default 'mrx-underwriting-readiness-v1',
  packet_version text not null default 'mrx-underwriting-packet-v1',
  packet_hash text,
  source_fingerprint text not null,
  packet_snapshot jsonb not null,
  blocker_snapshot jsonb not null default '[]'::jsonb,
  finalized_by uuid references public.staff_profiles(id) on delete set null,
  finalized_at timestamptz,
  reopened_by uuid references public.staff_profiles(id) on delete set null,
  reopened_at timestamptz,
  reopen_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Keep this migration forward-safe for preview environments that may have
-- applied an earlier draft before launch review completed.
alter table public.underwriting_document_requirements
  add column if not exists situation_code text not null default 'base',
  add column if not exists requirement_level text not null default 'required';

alter table public.underwriting_packets
  add column if not exists readiness_version text not null default 'mrx-underwriting-readiness-v1',
  add column if not exists packet_version text not null default 'mrx-underwriting-packet-v1',
  add column if not exists packet_hash text,
  add column if not exists blocker_snapshot jsonb not null default '[]'::jsonb,
  add column if not exists reopened_by uuid references public.staff_profiles(id) on delete set null,
  add column if not exists reopened_at timestamptz,
  add column if not exists reopen_reason text;

drop index if exists public.underwriting_packets_profile_ready_idx;
create unique index if not exists underwriting_packets_profile_idx
  on public.underwriting_packets(profile_id);

create index if not exists underwriting_document_requirements_profile_idx
  on public.underwriting_document_requirements(profile_id, status, updated_at desc);

alter table public.underwriting_document_requirements enable row level security;
alter table public.underwriting_packets enable row level security;

drop policy if exists "Owner reads own underwriting checklist rows" on public.underwriting_document_requirements;
-- Owners receive a deliberately sanitized projection from
-- /api/account/underwriting-checklist. Direct row access would expose staff
-- identifiers and waiver reasons, so no owner SELECT policy is created here.

drop trigger if exists underwriting_document_requirements_updated_at
  on public.underwriting_document_requirements;
create trigger underwriting_document_requirements_updated_at
  before update on public.underwriting_document_requirements
  for each row execute function public.set_updated_at();

drop trigger if exists underwriting_packets_updated_at on public.underwriting_packets;
create trigger underwriting_packets_updated_at before update on public.underwriting_packets
  for each row execute function public.set_updated_at();

drop policy if exists "Staff manages underwriting requirements" on public.underwriting_document_requirements;
create policy "Staff manages underwriting requirements"
  on public.underwriting_document_requirements for all
  using (public.is_mrx_admin() or exists (
    select 1 from public.case_assignments ca
    join public.staff_profiles sp on sp.id = ca.staff_profile_id
    where ca.profile_id = underwriting_document_requirements.profile_id
      and sp.user_id = auth.uid()
      and sp.active
  ))
  with check (public.is_mrx_admin() or exists (
    select 1 from public.case_assignments ca
    join public.staff_profiles sp on sp.id = ca.staff_profile_id
    where ca.profile_id = underwriting_document_requirements.profile_id
      and sp.user_id = auth.uid()
      and sp.active
  ));

drop policy if exists "Staff reads underwriting packet snapshots" on public.underwriting_packets;
create policy "Staff reads underwriting packet snapshots"
  on public.underwriting_packets for select
  using (public.is_mrx_admin() or exists (
    select 1 from public.case_assignments ca
    join public.staff_profiles sp on sp.id = ca.staff_profile_id
    where ca.profile_id = underwriting_packets.profile_id
      and sp.user_id = auth.uid()
      and sp.active
  ));

drop policy if exists "Staff writes underwriting packet snapshots" on public.underwriting_packets;
create policy "Staff writes underwriting packet snapshots"
  on public.underwriting_packets for all
  using (public.is_mrx_admin() or exists (
    select 1 from public.case_assignments ca
    join public.staff_profiles sp on sp.id = ca.staff_profile_id
    where ca.profile_id = underwriting_packets.profile_id
      and sp.user_id = auth.uid()
      and sp.active
  ))
  with check (public.is_mrx_admin() or exists (
    select 1 from public.case_assignments ca
    join public.staff_profiles sp on sp.id = ca.staff_profile_id
    where ca.profile_id = underwriting_packets.profile_id
      and sp.user_id = auth.uid()
      and sp.active
  ));

-- Final readiness and the staff-workspace transition are one transaction.
-- These RPCs are service-role only; the API performs staff authentication,
-- role checks, case access checks, and readiness derivation before invoking
-- them. Direct browser clients cannot execute either function.
create or replace function public.finalize_underwriting_packet(
  p_profile_id uuid,
  p_staff_id uuid,
  p_readiness_version text,
  p_packet_version text,
  p_packet_hash text,
  p_source_fingerprint text,
  p_packet_snapshot jsonb,
  p_finalized_at timestamptz
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.internal_case_workspaces
  set status = 'ready_for_review', updated_by = p_staff_id
  where profile_id = p_profile_id;
  if not found then
    raise exception 'underwriting_workspace_required';
  end if;

  insert into public.underwriting_packets (
    profile_id, status, readiness_version, packet_version, packet_hash,
    source_fingerprint, packet_snapshot, blocker_snapshot, finalized_by,
    finalized_at, reopened_by, reopened_at, reopen_reason
  ) values (
    p_profile_id, 'ready', p_readiness_version, p_packet_version, p_packet_hash,
    p_source_fingerprint, p_packet_snapshot, '[]'::jsonb, p_staff_id,
    p_finalized_at, null, null, null
  )
  on conflict (profile_id) do update set
    status = excluded.status,
    readiness_version = excluded.readiness_version,
    packet_version = excluded.packet_version,
    packet_hash = excluded.packet_hash,
    source_fingerprint = excluded.source_fingerprint,
    packet_snapshot = excluded.packet_snapshot,
    blocker_snapshot = excluded.blocker_snapshot,
    finalized_by = excluded.finalized_by,
    finalized_at = excluded.finalized_at,
    reopened_by = null,
    reopened_at = null,
    reopen_reason = null;
end;
$$;

create or replace function public.reopen_underwriting_packet(
  p_profile_id uuid,
  p_staff_id uuid,
  p_readiness_version text,
  p_packet_version text,
  p_source_fingerprint text,
  p_packet_snapshot jsonb,
  p_blocker_snapshot jsonb,
  p_reopen_reason text,
  p_reopened_at timestamptz
) returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  update public.internal_case_workspaces
  set status = 'underwriting', updated_by = p_staff_id
  where profile_id = p_profile_id;
  if not found then
    raise exception 'underwriting_workspace_required';
  end if;

  insert into public.underwriting_packets (
    profile_id, status, readiness_version, packet_version, packet_hash,
    source_fingerprint, packet_snapshot, blocker_snapshot, finalized_by,
    finalized_at, reopened_by, reopened_at, reopen_reason
  ) values (
    p_profile_id, 'reopened', p_readiness_version, p_packet_version, null,
    p_source_fingerprint, p_packet_snapshot, p_blocker_snapshot, null,
    null, p_staff_id, p_reopened_at, p_reopen_reason
  )
  on conflict (profile_id) do update set
    status = excluded.status,
    readiness_version = excluded.readiness_version,
    packet_version = excluded.packet_version,
    packet_hash = null,
    source_fingerprint = excluded.source_fingerprint,
    packet_snapshot = excluded.packet_snapshot,
    blocker_snapshot = excluded.blocker_snapshot,
    finalized_by = null,
    finalized_at = null,
    reopened_by = excluded.reopened_by,
    reopened_at = excluded.reopened_at,
    reopen_reason = excluded.reopen_reason;
end;
$$;

revoke all on function public.finalize_underwriting_packet(
  uuid, uuid, text, text, text, text, jsonb, timestamptz
) from public, anon, authenticated;
revoke all on function public.reopen_underwriting_packet(
  uuid, uuid, text, text, text, jsonb, jsonb, text, timestamptz
) from public, anon, authenticated;
grant execute on function public.finalize_underwriting_packet(
  uuid, uuid, text, text, text, text, jsonb, timestamptz
) to service_role;
grant execute on function public.reopen_underwriting_packet(
  uuid, uuid, text, text, text, jsonb, jsonb, text, timestamptz
) to service_role;
