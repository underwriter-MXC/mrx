-- Forward-only production upgrade for the searchable staff Owner Cases pipeline.
-- The base workspace migration also contains these definitions for fresh installs.

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

alter table public.mineral_interests
  add column if not exists township_district text,
  add column if not exists block_section text,
  add column if not exists abstract_survey text,
  add column if not exists section_township_range text,
  add column if not exists gross_acres_under_lease numeric,
  add column if not exists lease_status text not null default 'unknown',
  add column if not exists producing_status text not null default 'unknown',
  add column if not exists recent_check_amount text,
  add column if not exists raw_intake_answers jsonb not null default '{}'::jsonb,
  add column if not exists unknown_fields text[] not null default '{}';

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

create index if not exists internal_case_workspaces_search_idx
  on public.internal_case_workspaces(case_rating, status, last_contact_at desc, updated_at desc);

create index if not exists mineral_interests_intake_review_idx
  on public.mineral_interests(profile_id, lease_status, producing_status, updated_at desc);

comment on column public.mineral_interests.unknown_fields is
  'Owner-guided intake fields explicitly marked unknown/not sure; never AI-filled without owner or staff confirmation.';

comment on column public.owner_facts.value is
  'Stores raw guided-intake answers and missing-info checklist items used for consent-gated email/SMS follow-up.';

comment on column public.internal_case_workspaces.ghl_pipeline_stage_id is
  'Real GoHighLevel stage id from configured MRX pipeline mapping or live sync; never a placeholder.';

notify pgrst, 'reload schema';
