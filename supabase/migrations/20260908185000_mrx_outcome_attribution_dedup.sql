-- Outcome-attribution replay guard for staff-recorded case outcomes.
-- Stores only deterministic aggregate-safe dedup keys in audit metadata; no owner
-- notes, document contents, raw conversation text, or PII are introduced here.

create unique index if not exists audit_events_profile_type_dedup_key_idx
  on public.audit_events(profile_id, event_type, ((metadata->>'dedupKey')))
  where metadata ? 'dedupKey';

comment on index public.audit_events_profile_type_dedup_key_idx is
  'Suppresses replay duplicates for MRX privacy-safe attribution outcome audit events.';
