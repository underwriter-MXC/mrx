create extension if not exists pgcrypto;
create extension if not exists vector;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  profile_id uuid,
  anonymous_session_hash text,
  title text,
  summary text,
  status text not null default 'open' check (status in ('open', 'archived', 'deleted')),
  last_persona text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  conversation_id uuid unique references public.conversations(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  normalized_email text,
  phone text,
  normalized_phone text,
  email_verified_at timestamptz,
  phone_verified_at timestamptz,
  timezone text,
  ghl_contact_id text,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.conversations
  add constraint conversations_profile_id_fkey
  foreign key (profile_id) references public.profiles(id) on delete set null;

create table public.profile_identifiers (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  kind text not null check (kind in ('email', 'phone')),
  normalized_value text not null,
  display_value text,
  verified_at timestamptz,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (profile_id, kind, normalized_value)
);

create unique index profile_identifiers_verified_unique
  on public.profile_identifiers(kind, normalized_value)
  where verified_at is not null;

create table public.device_sessions (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  active_conversation_id uuid references public.conversations(id) on delete set null,
  user_id uuid references auth.users(id) on delete cascade,
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  persona text,
  event_type text not null default 'message' check (event_type in ('message', 'handoff', 'profile_prompt', 'appointment', 'consent', 'notice')),
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  openai_response_id text,
  created_at timestamptz not null default now()
);

create table public.mineral_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete set null,
  label text,
  state text,
  county text,
  legal_description text,
  parcel_reference text,
  operator text,
  lease_name text,
  well_names text[] not null default '{}',
  ownership_type text,
  net_mineral_acres numeric,
  royalty_decimal numeric,
  inherited boolean,
  status text not null default 'active' check (status in ('active', 'sold', 'unknown', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column primary_mineral_interest_id uuid
  references public.mineral_interests(id) on delete set null;

create table public.attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  mineral_interest_id uuid references public.mineral_interests(id) on delete set null,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  document_type text,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  status text not null default 'quarantined' check (status in ('quarantined', 'queued', 'scanning', 'extracting', 'ready', 'rejected', 'failed', 'deleted')),
  rejection_reason text,
  processed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_processing_jobs (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null references public.attachments(id) on delete cascade,
  status text not null default 'queued' check (status in ('queued', 'dispatched', 'scanning', 'ocr', 'extracting', 'complete', 'failed')),
  attempt_count integer not null default 0,
  worker_job_id text,
  idempotency_key text not null unique,
  error_code text,
  error_detail text,
  available_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.document_extractions (
  id uuid primary key default gen_random_uuid(),
  attachment_id uuid not null unique references public.attachments(id) on delete cascade,
  encrypted_raw_text text,
  redacted_text text,
  page_count integer,
  pii_categories text[] not null default '{}',
  extraction_version text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_facts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  mineral_interest_id uuid references public.mineral_interests(id) on delete cascade,
  field text not null,
  value jsonb not null,
  source text not null check (source in ('owner_chat', 'owner_profile', 'document_ai', 'staff', 'system')),
  source_message_id uuid references public.messages(id) on delete set null,
  source_attachment_id uuid references public.attachments(id) on delete set null,
  source_page integer,
  source_excerpt text,
  confidence numeric(4,3) check (confidence is null or (confidence >= 0 and confidence <= 1)),
  status text not null default 'candidate' check (status in ('candidate', 'confirmed', 'superseded', 'rejected')),
  supersedes_id uuid references public.owner_facts(id) on delete set null,
  confirmed_at timestamptz,
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.owner_memory_chunks (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  conversation_id uuid references public.conversations(id) on delete cascade,
  mineral_interest_id uuid references public.mineral_interests(id) on delete cascade,
  attachment_id uuid references public.attachments(id) on delete cascade,
  source_type text not null check (source_type in ('conversation', 'document', 'summary')),
  content text not null,
  embedding vector(1536),
  created_at timestamptz not null default now()
);

create table public.consent_receipts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms', 'marketingSms', 'call', 'documentAi', 'account')),
  purpose text not null default 'communication',
  granted boolean not null,
  disclosure_version text not null,
  disclosure_text text,
  submitted_value text,
  source_url text not null,
  utm jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table public.appointments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  ghl_appointment_id text not null unique,
  ghl_contact_id text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  status text not null check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.staff_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'underwriter', 'reviewer')),
  display_name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.case_assignments (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete cascade,
  assigned_by uuid references public.staff_profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (profile_id, staff_profile_id)
);

create table public.internal_case_notes (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  body text not null check (char_length(body) between 1 and 10000),
  note_type text not null default 'case_review' check (note_type in ('case_review', 'document_review', 'research', 'valuation_prep', 'assignment')),
  visibility text not null default 'internal' check (visibility = 'internal'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.internal_case_files (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  staff_profile_id uuid not null references public.staff_profiles(id) on delete restrict,
  storage_bucket text not null default 'staff-case-files' check (storage_bucket = 'staff-case-files'),
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 26214400),
  purpose text not null default 'case_workspace' check (purpose in ('case_workspace', 'research_source', 'underwriter_prep', 'title_review', 'valuation_support')),
  status text not null default 'pending_upload' check (status in ('pending_upload', 'ready', 'deleted')),
  visibility text not null default 'internal' check (visibility = 'internal'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references auth.users(id) on delete set null,
  profile_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  target_type text,
  target_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.deletion_receipts (
  id uuid primary key default gen_random_uuid(),
  user_hash text not null,
  scope text not null,
  completed_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create table public.knowledge_documents (
  id uuid primary key default gen_random_uuid(),
  canonical_url text not null unique,
  title text not null,
  body text not null,
  author_slug text,
  reviewer_slugs text[] not null default '{}',
  categories text[] not null default '{}',
  tags text[] not null default '{}',
  states text[] not null default '{}',
  sources jsonb not null default '[]'::jsonb,
  reviewed_at timestamptz,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  content text not null,
  ordinal integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, ordinal)
);

create table public.crm_sync_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_event_id text not null,
  event_type text not null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  error_code text,
  created_at timestamptz not null default now(),
  unique (provider, external_event_id)
);

create index conversations_user_idx on public.conversations(user_id, updated_at desc);
create index conversations_profile_idx on public.conversations(profile_id, updated_at desc);
create index device_sessions_user_idx on public.device_sessions(user_id, last_seen_at desc);
create index messages_conversation_idx on public.messages(conversation_id, created_at);
create index mineral_interests_profile_idx on public.mineral_interests(profile_id, updated_at desc);
create index owner_facts_profile_idx on public.owner_facts(profile_id, mineral_interest_id, field, created_at desc);
create index owner_facts_conversation_idx on public.owner_facts(conversation_id, created_at desc);
create index attachments_user_idx on public.attachments(user_id, created_at desc);
create index attachments_profile_idx on public.attachments(profile_id, created_at desc);
create index internal_case_notes_profile_idx on public.internal_case_notes(profile_id, created_at desc);
create index internal_case_files_profile_idx on public.internal_case_files(profile_id, created_at desc);
create index document_jobs_status_idx on public.document_processing_jobs(status, available_at);
create index owner_memory_embedding_idx on public.owner_memory_chunks using hnsw (embedding vector_cosine_ops);
create index knowledge_documents_search_idx on public.knowledge_documents using gin (to_tsvector('english', title || ' ' || body));
create index knowledge_chunks_embedding_idx on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

create trigger conversations_updated_at before update on public.conversations for each row execute function public.set_updated_at();
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create trigger identifiers_updated_at before update on public.profile_identifiers for each row execute function public.set_updated_at();
create trigger interests_updated_at before update on public.mineral_interests for each row execute function public.set_updated_at();
create trigger facts_updated_at before update on public.owner_facts for each row execute function public.set_updated_at();
create trigger attachments_updated_at before update on public.attachments for each row execute function public.set_updated_at();
create trigger document_jobs_updated_at before update on public.document_processing_jobs for each row execute function public.set_updated_at();
create trigger document_extractions_updated_at before update on public.document_extractions for each row execute function public.set_updated_at();
create trigger appointments_updated_at before update on public.appointments for each row execute function public.set_updated_at();
create trigger staff_profiles_updated_at before update on public.staff_profiles for each row execute function public.set_updated_at();
create trigger internal_case_notes_updated_at before update on public.internal_case_notes for each row execute function public.set_updated_at();
create trigger internal_case_files_updated_at before update on public.internal_case_files for each row execute function public.set_updated_at();
create trigger knowledge_documents_updated_at before update on public.knowledge_documents for each row execute function public.set_updated_at();

create or replace function public.is_mrx_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.staff_profiles
    where user_id = auth.uid() and role = 'admin' and active = true
  );
$$;

create or replace function public.can_access_profile(target_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_mrx_admin() or exists (
    select 1
    from public.case_assignments assignment
    join public.staff_profiles staff on staff.id = assignment.staff_profile_id
    where assignment.profile_id = target_profile_id
      and staff.user_id = auth.uid()
      and staff.active = true
  );
$$;

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
      update public.mineral_interests set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.owner_facts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.internal_case_notes set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.internal_case_files set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.consent_receipts set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
      update public.appointments set profile_id = canonical_profile_id where profile_id = anonymous_profile_id;
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

create or replace function public.purge_abandoned_anonymous_data(retention_days integer default 30)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  delete from public.conversations
  where user_id is null
    and updated_at < now() - make_interval(days => greatest(retention_days, 1));
  get diagnostics deleted_count = row_count;
  delete from public.device_sessions where expires_at < now();
  delete from public.deletion_receipts where expires_at < now();
  return deleted_count;
end;
$$;

alter table public.conversations enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_identifiers enable row level security;
alter table public.device_sessions enable row level security;
alter table public.messages enable row level security;
alter table public.mineral_interests enable row level security;
alter table public.owner_facts enable row level security;
alter table public.owner_memory_chunks enable row level security;
alter table public.attachments enable row level security;
alter table public.document_processing_jobs enable row level security;
alter table public.document_extractions enable row level security;
alter table public.consent_receipts enable row level security;
alter table public.appointments enable row level security;
alter table public.staff_profiles enable row level security;
alter table public.case_assignments enable row level security;
alter table public.internal_case_notes enable row level security;
alter table public.internal_case_files enable row level security;
alter table public.audit_events enable row level security;
alter table public.deletion_receipts enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.crm_sync_events enable row level security;

create policy "Owners and assigned staff read profiles" on public.profiles for select
  using (user_id = auth.uid() or public.can_access_profile(id));
create policy "Owners update profiles" on public.profiles for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners and assigned staff read identifiers" on public.profile_identifiers for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and (p.user_id = auth.uid() or public.can_access_profile(p.id))));
create policy "Owners and assigned staff read conversations" on public.conversations for select
  using (user_id = auth.uid() or public.can_access_profile(profile_id));
create policy "Owners update conversations" on public.conversations for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "Owners and assigned staff read messages" on public.messages for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.user_id = auth.uid() or public.can_access_profile(c.profile_id))));
create policy "Owners and assigned staff read interests" on public.mineral_interests for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and (p.user_id = auth.uid() or public.can_access_profile(p.id))));
create policy "Owners update interests" on public.mineral_interests for update
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Owners insert interests" on public.mineral_interests for insert
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Owners and assigned staff read facts" on public.owner_facts for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.user_id = auth.uid() or public.can_access_profile(c.profile_id))));
create policy "Owners and assigned staff read memory" on public.owner_memory_chunks for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and (p.user_id = auth.uid() or public.can_access_profile(p.id))));
create policy "Owners and assigned staff read attachments" on public.attachments for select
  using (user_id = auth.uid() or public.can_access_profile(profile_id));
create policy "Owners and assigned staff read document jobs" on public.document_processing_jobs for select
  using (exists (select 1 from public.attachments a where a.id = attachment_id and (a.user_id = auth.uid() or public.can_access_profile(a.profile_id))));
create policy "Owners and assigned staff read document extractions" on public.document_extractions for select
  using (exists (select 1 from public.attachments a where a.id = attachment_id and (a.user_id = auth.uid() or public.can_access_profile(a.profile_id))));
create policy "Owners and assigned staff read consent" on public.consent_receipts for select
  using (exists (select 1 from public.profiles p where p.id = profile_id and (p.user_id = auth.uid() or public.can_access_profile(p.id))));
create policy "Owners and assigned staff read appointments" on public.appointments for select
  using (exists (select 1 from public.conversations c where c.id = conversation_id and (c.user_id = auth.uid() or public.can_access_profile(c.profile_id))));
create policy "Staff read own profile" on public.staff_profiles for select
  using (user_id = auth.uid() or public.is_mrx_admin());
create policy "Staff read assignments" on public.case_assignments for select
  using (public.can_access_profile(profile_id));
create policy "Admins manage assignments" on public.case_assignments for all
  using (public.is_mrx_admin()) with check (public.is_mrx_admin());
create policy "Assigned staff read internal case notes" on public.internal_case_notes for select
  using (public.can_access_profile(profile_id));
create policy "Assigned staff create internal case notes" on public.internal_case_notes for insert
  with check (public.can_access_profile(profile_id) and exists (select 1 from public.staff_profiles s where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true));
create policy "Assigned staff read internal case files" on public.internal_case_files for select
  using (public.can_access_profile(profile_id));
create policy "Assigned staff create internal case files" on public.internal_case_files for insert
  with check (public.can_access_profile(profile_id) and exists (select 1 from public.staff_profiles s where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true));
create policy "Assigned staff update own pending internal case files" on public.internal_case_files for update
  using (public.can_access_profile(profile_id) and exists (select 1 from public.staff_profiles s where s.id = staff_profile_id and s.user_id = auth.uid() and s.active = true))
  with check (public.can_access_profile(profile_id) and visibility = 'internal');
create policy "Staff read audit events" on public.audit_events for select
  using (public.can_access_profile(profile_id));
create policy "Anyone reads reviewed knowledge" on public.knowledge_documents for select
  using (published = true and reviewed_at is not null);
create policy "Anyone reads reviewed knowledge chunks" on public.knowledge_chunks for select
  using (exists (select 1 from public.knowledge_documents d where d.id = document_id and d.published = true and d.reviewed_at is not null));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('owner-documents', 'owner-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('staff-case-files', 'staff-case-files', false, 26214400, array['application/pdf', 'image/jpeg', 'image/png', 'text/plain', 'text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

revoke all on function public.claim_owner_conversation(uuid, uuid, text, text, text) from public, anon, authenticated;
revoke all on function public.purge_abandoned_anonymous_data(integer) from public, anon, authenticated;
grant execute on function public.claim_owner_conversation(uuid, uuid, text, text, text) to service_role;
grant execute on function public.purge_abandoned_anonymous_data(integer) to service_role;
