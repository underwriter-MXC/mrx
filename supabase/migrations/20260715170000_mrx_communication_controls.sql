alter table public.profiles
  add column if not exists completed_lead_at timestamptz,
  add column if not exists is_test boolean not null default false,
  add column if not exists test_run_id uuid;

alter table public.conversations
  add column if not exists is_test boolean not null default false,
  add column if not exists test_run_id uuid;

alter table public.attachments
  add column if not exists is_test boolean not null default false,
  add column if not exists test_run_id uuid;

create index if not exists attachments_test_run_idx
  on public.attachments(test_run_id)
  where test_run_id is not null;

alter table public.consent_receipts
  drop constraint if exists consent_receipts_channel_check;

alter table public.consent_receipts
  add constraint consent_receipts_channel_check
  check (channel in ('email', 'sms', 'marketingSms', 'call', 'aiVoice', 'documentAi', 'account')),
  add column if not exists destination text,
  add column if not exists supersedes_id uuid references public.consent_receipts(id) on delete set null;

create index if not exists consent_receipts_latest_idx
  on public.consent_receipts(profile_id, channel, purpose, created_at desc);

create table if not exists public.communication_dispatches (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  consent_receipt_id uuid references public.consent_receipts(id) on delete set null,
  appointment_id uuid references public.appointments(id) on delete set null,
  channel text not null check (channel in ('email', 'sms', 'call', 'aiVoice')),
  purpose text not null,
  provider text not null,
  external_id text,
  destination_hash text,
  status text not null check (status in ('queued', 'suppressed', 'sent', 'delivered', 'failed', 'cancelled', 'revoked')),
  error_code text,
  requested_by text not null default 'owner' check (requested_by in ('owner', 'staff', 'system', 'test')),
  is_test boolean not null default false,
  test_run_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  attempted_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists communication_dispatches_profile_idx
  on public.communication_dispatches(profile_id, created_at desc);
create index if not exists communication_dispatches_status_idx
  on public.communication_dispatches(status, created_at desc);
create index if not exists communication_dispatches_test_run_idx
  on public.communication_dispatches(test_run_id)
  where test_run_id is not null;

drop trigger if exists communication_dispatches_updated_at on public.communication_dispatches;
create trigger communication_dispatches_updated_at
  before update on public.communication_dispatches
  for each row execute function public.set_updated_at();

alter table public.communication_dispatches enable row level security;

create policy "Owners and assigned staff read communication dispatches"
  on public.communication_dispatches for select
  using (
    exists (
      select 1 from public.profiles p
      where p.id = profile_id
        and (p.user_id = auth.uid() or public.can_access_profile(p.id))
    )
  );

create or replace function public.refresh_completed_lead(target_profile_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  is_complete boolean;
begin
  select
    p.first_name is not null and btrim(p.first_name) <> '' and
    p.last_name is not null and btrim(p.last_name) <> '' and
    p.email_verified_at is not null and
    p.normalized_phone is not null and
    exists (
      select 1 from public.consent_receipts c
      where c.profile_id = p.id and c.channel = 'email' and c.purpose = 'requested_updates'
    ) and
    exists (
      select 1 from public.consent_receipts c
      where c.profile_id = p.id and c.channel = 'sms' and c.purpose = 'requested_updates'
    ) and
    exists (
      select 1 from public.consent_receipts c
      where c.profile_id = p.id and c.channel = 'aiVoice' and c.purpose = 'requested_updates'
    )
  into is_complete
  from public.profiles p
  where p.id = target_profile_id;

  update public.profiles
  set completed_lead_at = case
    when is_complete then coalesce(completed_lead_at, now())
    else null
  end
  where id = target_profile_id;

  return coalesce(is_complete, false);
end;
$$;

revoke all on function public.refresh_completed_lead(uuid) from public, anon, authenticated;
grant execute on function public.refresh_completed_lead(uuid) to service_role;

-- Preserve communication audit rows when a verified owner claims an anonymous conversation.
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

  select profile_id into existing_identifier_profile_id
  from public.profile_identifiers
  where kind = 'email'
    and normalized_value = normalized_verified_email
    and verified_at is not null
  limit 1;

  select id into canonical_profile_id from public.profiles where user_id = target_user_id;

  if existing_identifier_profile_id is not null
     and canonical_profile_id is not null
     and existing_identifier_profile_id <> canonical_profile_id then
    raise exception 'verified email belongs to a different profile';
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
        set is_test = canonical.is_test or anonymous.is_test,
            test_run_id = coalesce(canonical.test_run_id, anonymous.test_run_id)
        from public.profiles anonymous
        where canonical.id = canonical_profile_id and anonymous.id = anonymous_profile_id;
      update public.mineral_interests set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.owner_facts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.consent_receipts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.appointments set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.communication_dispatches set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
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

revoke all on function public.claim_owner_conversation(uuid, uuid, text, text, text) from public, anon, authenticated;
grant execute on function public.claim_owner_conversation(uuid, uuid, text, text, text) to service_role;
