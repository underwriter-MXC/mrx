import type { APIRoute } from 'astro';
import { z } from 'zod';
import { resolveOwnerSession } from '../../../lib/platform/identity';
import { syncVerifiedOwnerToGhl } from '../../../lib/platform/crm';
import { saveVisibleMessage } from '../../../lib/platform/supabase';
import {
  assertRateLimit,
  assertSameOrigin,
  clientKey,
  json,
  safeError,
} from '../../../lib/platform/security';

const EventSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().min(1).max(4_000),
  persona: z.enum(['tommy', 'cooper', 'charlie', 'dale', 'rebecca', 'angela']).optional(),
  eventType: z
    .enum(['message', 'handoff', 'profile_prompt', 'appointment', 'consent', 'notice'])
    .default('message'),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    assertRateLimit(`event:${clientKey(context)}`, 90);
    const parsed = EventSchema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'invalid_event' }, { status: 400 });
    const session = await resolveOwnerSession(context);
    const id = await saveVisibleMessage({
      conversationId: session.conversationId,
      ...parsed.data,
    });
    try {
      await syncVerifiedOwnerToGhl(session.profileId);
    } catch (error) {
      console.error(
        '[GHL visible message sync]',
        error instanceof Error ? error.message : 'failed',
      );
    }
    return json({ ok: true, id });
  } catch (error) {
    return safeError(error);
  }
};
