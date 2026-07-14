import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let serverClient: SupabaseClient | null | undefined;

export function getSupabaseServer() {
  if (serverClient !== undefined) return serverClient;
  const url = import.meta.env.SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL;
  const serviceRole = import.meta.env.SUPABASE_SERVICE_ROLE_KEY;
  serverClient = url && serviceRole
    ? createClient(url, serviceRole, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
    : null;
  return serverClient;
}

export function getSupabasePublicConfig() {
  const url = import.meta.env.PUBLIC_SUPABASE_URL;
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  return url && anonKey ? { url, anonKey } : null;
}

export async function saveMessage(args: {
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  persona?: string;
  citations?: unknown[];
}) {
  const supabase = getSupabaseServer();
  if (!supabase) return;
  const { error } = await supabase.from('messages').insert({
    conversation_id: args.conversationId,
    role: args.role,
    content: args.content,
    persona: args.persona,
    citations: args.citations ?? [],
  });
  if (error) console.error('[Supabase] message insert failed', error.code);
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
