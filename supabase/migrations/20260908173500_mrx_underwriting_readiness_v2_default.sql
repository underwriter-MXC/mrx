-- Advance new underwriting packet writes to readiness v2 without relabeling
-- historical v1 snapshots. Existing rows keep their stored readiness_version;
-- the staff packet API writes the explicit current version when finalizing.

alter table if exists public.underwriting_packets
  alter column readiness_version set default 'mrx-underwriting-readiness-v2';
