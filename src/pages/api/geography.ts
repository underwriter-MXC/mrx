import type { APIRoute } from 'astro';
import { z } from 'zod';
import {
  persistGeographyResolution,
  publicGeography,
  resolveUSGeography,
} from '../../lib/platform/geography';
import { resolveOwnerSession } from '../../lib/platform/identity';
import { getSupabaseServer } from '../../lib/platform/supabase';
import { syncVerifiedOwnerToGhl } from '../../lib/platform/crm';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../lib/platform/security';

const Schema = z.object({
  input: z.string().trim().min(2).max(20_000),
  scope: z.enum(['residence', 'mineral_interest']).default('mineral_interest'),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`geography:${clientKey(context)}`, 20, 10 * 60_000);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) {
      return json({ ok: false, error: 'invalid_geography' }, { status: 400 });
    }
    const session = await resolveOwnerSession(context);
    const supabase = getSupabaseServer();
    let priorState: string | null = null;
    if (supabase && session.persisted) {
      if (parsed.data.scope === 'residence') {
        const { data } = await supabase
          .from('profiles')
          .select('residence_state_code,residence_state')
          .eq('id', session.profileId)
          .maybeSingle();
        priorState = data?.residence_state_code || data?.residence_state || null;
      } else {
        const { data } = await supabase
          .from('mineral_interests')
          .select('state_code,state')
          .eq('profile_id', session.profileId)
          .eq('status', 'active')
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        priorState = data?.state_code || data?.state || null;
      }
    }
    const resolution = await resolveUSGeography(parsed.data.input, {
      scope: parsed.data.scope,
      priorState,
      mode: 'profile',
    });
    if (!resolution) {
      return json({ ok: false, error: 'location_not_recognized' }, { status: 422 });
    }
    const saved =
      resolution.status === 'not_found'
        ? { persisted: false, interestId: null }
        : await persistGeographyResolution({
            conversationId: session.conversationId,
            profileId: session.profileId,
            resolution,
          });
    if (session.emailVerified && saved.persisted) {
      try {
        await syncVerifiedOwnerToGhl(session.profileId);
      } catch (error) {
        console.error('[GHL geography sync]', error instanceof Error ? error.message : 'failed');
      }
    }
    return json(
      {
        ok: resolution.status !== 'not_found',
        geography: publicGeography(resolution),
        interestId: saved.interestId,
        persisted: saved.persisted,
      },
      resolution.status === 'not_found' ? { status: 422 } : undefined,
    );
  } catch (error) {
    return safeError(error);
  }
};
