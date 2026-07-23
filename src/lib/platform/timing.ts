export const PRODUCTION_MINIMUM_GUIDE_REPLY_MS = 2_000;

export function guideReplyDelay(production: boolean, configured: unknown) {
  const parsed = Number(configured ?? PRODUCTION_MINIMUM_GUIDE_REPLY_MS);
  const safe = Number.isFinite(parsed) ? parsed : PRODUCTION_MINIMUM_GUIDE_REPLY_MS;
  return production ? Math.max(PRODUCTION_MINIMUM_GUIDE_REPLY_MS, safe) : Math.max(0, safe);
}

export function remainingGuideReplyDelay(
  minimumDelay: number,
  requestedDelay: number,
  responseStartedAt: number,
  now: number,
) {
  // A zero minimum is reserved for non-production automated tests. It must
  // disable the small conversational pauses passed by scripted call sites too.
  if (minimumDelay === 0) return 0;
  const threshold = Math.max(minimumDelay, requestedDelay);
  return Math.max(0, responseStartedAt + threshold - now);
}
