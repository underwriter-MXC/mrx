import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { runtimeEnv } from './runtime-env';

let serverClient: SupabaseClient | null | undefined;

export function getSupabaseServer() {
  if (serverClient !== undefined) return serverClient;
  const url = runtimeEnv('SUPABASE_URL') || runtimeEnv('PUBLIC_SUPABASE_URL');
  const serviceRole = runtimeEnv('SUPABASE_SERVICE_ROLE_KEY');
  serverClient =
    url && serviceRole
      ? createClient(url, serviceRole, {
          auth: { persistSession: false, autoRefreshToken: false },
        })
      : null;
  return serverClient;
}

export function getSupabasePublicConfig() {
  const url = runtimeEnv('PUBLIC_SUPABASE_URL');
  const anonKey = runtimeEnv('PUBLIC_SUPABASE_ANON_KEY');
  return url && anonKey ? { url, anonKey } : null;
}

export async function saveMessage(args: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  persona?: string;
  citations?: unknown[];
  eventType?: 'message' | 'handoff' | 'profile_prompt' | 'appointment' | 'consent' | 'notice';
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: args.conversationId,
      role: args.role,
      content: args.content,
      persona: args.persona,
      citations: args.citations ?? [],
      event_type: args.eventType ?? 'message',
      metadata: args.metadata ?? {},
    })
    .select('id')
    .single();
  if (error) console.error('[Supabase] message insert failed', error.code);
  if (!error) {
    await supabase
      .from('conversations')
      .update({
        ...(args.persona ? { last_persona: args.persona } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', args.conversationId);
  }
  return (data?.id as string | undefined) ?? null;
}

export async function ensureConversation(conversationId: string, sessionToken: string) {
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const { error } = await supabase.from('conversations').upsert(
    {
      id: conversationId,
      anonymous_session_hash: sessionToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) console.error('[Supabase] conversation upsert failed', error.code);
}

export async function saveVisibleMessage(args: Parameters<typeof saveMessage>[0]) {
  return saveMessage(args);
}
