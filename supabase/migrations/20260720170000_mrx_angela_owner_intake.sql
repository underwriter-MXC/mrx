-- Forward-only Angela owner-intake upgrade. This repeats the relevant
-- owner-case additions idempotently so production receives them even when an
-- earlier staff-workspace migration was already applied before intake shipped.

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
  drop constraint if exists internal_case_workspaces_status_check;

alter table public.internal_case_workspaces
  add constraint internal_case_workspaces_status_check check (
    status in (
      'intake', 'needs_info', 'research', 'underwriting', 'ready_for_review', 'offer_pending',
      'offer_sent', 'due_diligence', 'documents_complete', 'title_review',
      'closing_scheduled', 'closed', 'lost', 'on_hold'
    )
  );

create index if not exists mineral_interests_intake_review_idx
  on public.mineral_interests(profile_id, lease_status, producing_status, updated_at desc);

comment on column public.mineral_interests.raw_intake_answers is
  'Structured owner-provided Angela intake answers. Unknown values remain explicit and are never guessed.';
comment on column public.mineral_interests.unknown_fields is
  'Information still helpful for Senior Underwriter preparation and consent-gated owner follow-up.';

notify pgrst, 'reload schema';
