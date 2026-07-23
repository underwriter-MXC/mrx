alter table public.messages
  add column if not exists ghl_message_id text,
  add column if not exists ghl_synced_at timestamptz,
  add column if not exists ghl_sync_error text;

create unique index if not exists messages_ghl_message_unique
  on public.messages(ghl_message_id)
  where ghl_message_id is not null;

create index if not exists messages_pending_ghl_sync_idx
  on public.messages(conversation_id, created_at)
  where ghl_synced_at is null;

alter table public.document_extractions
  add column if not exists ghl_message_ids text[] not null default '{}',
  add column if not exists ghl_synced_at timestamptz,
  add column if not exists ghl_sync_error text;

create index if not exists document_extractions_pending_ghl_sync_idx
  on public.document_extractions(created_at)
  where ghl_synced_at is null;

alter table public.profiles
  add column if not exists ghl_last_conversation_sync_at timestamptz;

comment on column public.document_extractions.encrypted_raw_text is
  'AES-GCM encrypted raw OCR retained in Supabase only; it must not be copied to GHL or other downstream systems.';

comment on column public.document_extractions.redacted_text is
  'Redacted OCR used for AI fact extraction, owner memory, and approved downstream summaries.';
