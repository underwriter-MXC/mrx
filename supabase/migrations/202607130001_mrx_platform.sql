create extension if not exists pgcrypto;
create extension if not exists vector;

create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  anonymous_session_hash text,
  title text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users(id) on delete cascade,
  conversation_id uuid unique references public.conversations(id) on delete set null,
  first_name text,
  last_name text,
  email text,
  phone text,
  timezone text,
  ghl_contact_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'system')),
  persona text,
  content text not null,
  citations jsonb not null default '[]'::jsonb,
  openai_response_id text,
  created_at timestamptz not null default now()
);

create table if not exists public.owner_facts (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  field text not null,
  value jsonb not null,
  source text not null,
  confidence numeric(4,3),
  corrected_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (conversation_id, field)
);

create table if not exists public.attachments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  storage_path text not null unique,
  original_name text not null,
  mime_type text not null check (mime_type in ('application/pdf', 'image/jpeg', 'image/png')),
  size_bytes bigint not null check (size_bytes > 0 and size_bytes <= 15728640),
  status text not null default 'quarantined' check (status in ('quarantined', 'ready', 'rejected', 'deleted')),
  rejection_reason text,
  extracted_text text,
  processed_at timestamptz,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.consent_receipts (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  channel text not null check (channel in ('email', 'sms', 'marketingSms', 'call')),
  granted boolean not null,
  disclosure_version text not null,
  disclosure_text text,
  submitted_value text,
  source_url text not null,
  utm jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references public.conversations(id) on delete set null,
  ghl_appointment_id text not null unique,
  ghl_contact_id text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  timezone text not null,
  status text not null check (status in ('confirmed', 'cancelled', 'completed', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.knowledge_documents (
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

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.knowledge_documents(id) on delete cascade,
  content text not null,
  ordinal integer not null,
  embedding vector(1536),
  created_at timestamptz not null default now(),
  unique (document_id, ordinal)
);

create table if not exists public.crm_sync_events (
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

create index if not exists conversations_user_idx on public.conversations(user_id, updated_at desc);
create index if not exists messages_conversation_idx on public.messages(conversation_id, created_at);
create index if not exists attachments_user_idx on public.attachments(user_id, created_at desc);
create index if not exists knowledge_documents_search_idx on public.knowledge_documents using gin (to_tsvector('english', title || ' ' || body));
create index if not exists knowledge_chunks_embedding_idx on public.knowledge_chunks using hnsw (embedding vector_cosine_ops);

alter table public.conversations enable row level security;
alter table public.profiles enable row level security;
alter table public.messages enable row level security;
alter table public.owner_facts enable row level security;
alter table public.attachments enable row level security;
alter table public.consent_receipts enable row level security;
alter table public.appointments enable row level security;
alter table public.knowledge_documents enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.crm_sync_events enable row level security;

create policy "Users read their conversations" on public.conversations for select using (auth.uid() = user_id);
create policy "Users update their conversations" on public.conversations for update using (auth.uid() = user_id);
create policy "Users read their profile" on public.profiles for select using (auth.uid() = user_id);
create policy "Users update their profile" on public.profiles for update using (auth.uid() = user_id);
create policy "Users read their messages" on public.messages for select using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "Users read their owner facts" on public.owner_facts for select using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "Users read their attachments" on public.attachments for select using (auth.uid() = user_id);
create policy "Users read their consent receipts" on public.consent_receipts for select using (exists (select 1 from public.profiles p where p.id = profile_id and p.user_id = auth.uid()));
create policy "Users read their appointments" on public.appointments for select using (exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy "Anyone reads reviewed knowledge" on public.knowledge_documents for select using (published = true and reviewed_at is not null);
create policy "Anyone reads reviewed knowledge chunks" on public.knowledge_chunks for select using (exists (select 1 from public.knowledge_documents d where d.id = document_id and d.published = true and d.reviewed_at is not null));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('owner-documents', 'owner-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do update set public = false, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
