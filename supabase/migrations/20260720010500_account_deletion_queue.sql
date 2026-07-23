alter table public.profiles
  add column if not exists pending_deletion_at timestamptz;

create index if not exists profiles_pending_deletion_idx
  on public.profiles(pending_deletion_at)
  where pending_deletion_at is not null;

comment on column public.profiles.pending_deletion_at is
  'Owner-requested account deletion queue timestamp. Retention maintenance may hard-delete matching auth users after the grace window.';
