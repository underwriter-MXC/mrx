import type { APIRoute } from 'astro';
import { ensureConversation, getSupabaseServer } from '../../../lib/platform/supabase';
import { assertRateLimit, clientKey, json, safeError } from '../../../lib/platform/security';

const COOKIE = 'mrx_conversation';

async function hash(value: string) {
  const data = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(data), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function getOrCreateId(cookies: Parameters<APIRoute>[0]['cookies']) {
  const existing = cookies.get(COOKIE)?.value;
  if (existing && /^[0-9a-f-]{36}$/i.test(existing)) return existing;
  const id = crypto.randomUUID();
  cookies.set(COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure: import.meta.env.PROD,
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
  });
  return id;
}

export const POST: APIRoute = async (context) => {
  try {
    assertRateLimit(`session:${clientKey(context)}`, 20);
    const id = getOrCreateId(context.cookies);
    await ensureConversation(id, await hash(id));
    return json({ ok: true, conversationId: id });
  } catch (error) {
    return safeError(error);
  }
};

export const GET: APIRoute = async (context) => {
  try {
    const id = getOrCreateId(context.cookies);
    const supabase = getSupabaseServer();
    if (!supabase) return json({ ok: true, conversationId: id, messages: [] });
    const [messagesResult, profileResult, factsResult] = await Promise.all([
      supabase
        .from('messages')
        .select('id,role,content,persona,citations,created_at')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true })
        .limit(100),
      supabase
        .from('profiles')
        .select('first_name,last_name,email,phone,timezone')
        .eq('conversation_id', id)
        .maybeSingle(),
      supabase
        .from('owner_facts')
        .select('field,value')
        .eq('conversation_id', id),
    ]);
    if (messagesResult.error) throw messagesResult.error;
    if (profileResult.error) throw profileResult.error;
    if (factsResult.error) throw factsResult.error;
    return json({
      ok: true,
      conversationId: id,
      messages: messagesResult.data ?? [],
      profile: profileResult.data,
      ownerFacts: Object.fromEntries((factsResult.data ?? []).map((fact) => [fact.field, fact.value])),
    });
  } catch (error) {
    return safeError(error);
  }
};
