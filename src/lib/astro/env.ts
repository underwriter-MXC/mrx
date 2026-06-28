/**
 * Typed env var access. Per Architecture Plan §9, the contract is:
 *
 *   PUBLIC_GTM_ID          (client-visible; GTM container)
 *   PUBLIC_MRX_GHL_CALENDAR_URL (client-visible; direct GHL calendar URL for homepage CTAs)
 *   PUBLIC_MRX_PHONE_TEL   (client-visible; tel:+... click-to-call CTA, optional)
 *   PUBLIC_MRX_PHONE_LABEL (client-visible; accessible label for the phone CTA, optional)
 *   MRX_GHL_API_KEY        (secret; GHL API token, stage 08)
 *   MRX_GHL_LOCATION_ID    (secret; GHL sub-account location)
 *   MRX_GHL_CALENDAR_URL   (secret; calendar URL /book redirects to)
 *   MRX_PDF_URL            (secret; signed URL of the free-guide PDF)
 *   MRX_CONTACT_NOTIFY_EMAIL (secret; email-routed Cloudflare Worker target)
 *
 * PUBLIC_-prefixed env vars are available to client code. The MRX_*
 * secrets are server-only and only resolvable inside the 2 hybrid
 * Cloudflare Functions in src/pages/api/.
 */
export type PublicEnv = {
  PUBLIC_GTM_ID?: string;
  PUBLIC_SITE_URL?: string;
  PUBLIC_MRX_GHL_CALENDAR_URL?: string;
  PUBLIC_MRX_PHONE_TEL?: string;
  PUBLIC_MRX_PHONE_LABEL?: string;
};

export type ServerEnv = {
  MRX_GHL_API_KEY?: string;
  MRX_GHL_LOCATION_ID?: string;
  MRX_GHL_CALENDAR_URL?: string;
  MRX_PDF_URL?: string;
  MRX_CONTACT_NOTIFY_EMAIL?: string;
};

export function publicEnv(): PublicEnv {
  // import.meta.env is the Vite/Astro env access path.
  return {
    PUBLIC_GTM_ID: import.meta.env.PUBLIC_GTM_ID as string | undefined,
    PUBLIC_SITE_URL: import.meta.env.PUBLIC_SITE_URL as string | undefined,
    PUBLIC_MRX_GHL_CALENDAR_URL: import.meta.env.PUBLIC_MRX_GHL_CALENDAR_URL as string | undefined,
    PUBLIC_MRX_PHONE_TEL: import.meta.env.PUBLIC_MRX_PHONE_TEL as string | undefined,
    PUBLIC_MRX_PHONE_LABEL: import.meta.env.PUBLIC_MRX_PHONE_LABEL as string | undefined,
  };
}

export function serverEnv(locals: App.Locals): ServerEnv {
  // Production (Cloudflare Pages): locals.runtime.env gives the env binding.
  // Local dev / previews / non-Cloudflare runtimes: fall back to process.env
  // so the same code path works in `astro dev` and in any non-CF test.
  // The Cloudflare Locals augmentation is only loaded under
  // @astrojs/cloudflare (see tsconfig.json types), so we cast.
  const runtimeEnv = ((locals as unknown as { runtime?: { env?: Record<string, string | undefined> } })
    ?.runtime?.env ?? {}) as Record<string, string | undefined>;
  const procEnv = (typeof process !== 'undefined' ? process.env : {}) as Record<string, string | undefined>;
  const pick = (k: string) => runtimeEnv[k] ?? procEnv[k];
  return {
    MRX_GHL_API_KEY: pick('MRX_GHL_API_KEY'),
    MRX_GHL_LOCATION_ID: pick('MRX_GHL_LOCATION_ID'),
    MRX_GHL_CALENDAR_URL: pick('MRX_GHL_CALENDAR_URL'),
    MRX_PDF_URL: pick('MRX_PDF_URL'),
    MRX_CONTACT_NOTIFY_EMAIL: pick('MRX_CONTACT_NOTIFY_EMAIL'),
  };
}
