import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { createClient, type Session } from '@supabase/supabase-js';
import './AccountHub.css';

interface Props { supabaseUrl?: string; supabaseAnonKey?: string }
type Conversation = { id: string; title?: string; summary?: string; updated_at: string; messages?: Array<{ id: string; role: string; content: string; persona?: string; created_at: string }>; appointments?: any[] };
type Attachment = { id: string; original_name: string; mime_type: string; size_bytes: number; status: string; created_at: string };

export default function AccountHub({ supabaseUrl, supabaseAnonKey }: Props) {
  const supabase = useMemo(() => supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null, [supabaseUrl, supabaseAnonKey]);
  const [session, setSession] = useState<Session | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => data.subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    if (!session || !supabase) { setLoading(false); return; }
    (async () => {
      await fetch('/api/account/claim', { method: 'POST', headers: { Authorization: `Bearer ${session.access_token}` } });
      const [conversationResult, attachmentResult] = await Promise.all([
        supabase.from('conversations').select('id,title,summary,updated_at,messages(id,role,content,persona,created_at),appointments(*)').order('updated_at', { ascending: false }),
        supabase.from('attachments').select('id,original_name,mime_type,size_bytes,status,created_at').neq('status', 'deleted').order('created_at', { ascending: false }),
      ]);
      setConversations((conversationResult.data as Conversation[]) ?? []);
      setAttachments((attachmentResult.data as Attachment[]) ?? []);
      setLoading(false);
    })();
  }, [session, supabase]);

  async function requestLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const email = String(new FormData(event.currentTarget).get('email') || '');
    const { error } = await supabase.auth.signInWithOtp({ email, options: { emailRedirectTo: location.href } });
    setStatus(error ? 'The sign-in link could not be sent.' : 'Check your email for your private sign-in link.');
  }

  async function downloadExport() {
    if (!session) return;
    const response = await fetch('/api/account/export', { headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!response.ok) return setStatus('The export could not be prepared.');
    const blob = await response.blob();
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `mrx-account-export-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
  }

  async function deleteAttachment(id: string) {
    if (!session || !confirm('Delete this private document from your MRX account?')) return;
    const response = await fetch(`/api/chat/attachments/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
    if (response.ok) setAttachments((current) => current.filter((item) => item.id !== id));
  }

  async function deleteAccount() {
    if (!session || !confirm('Permanently delete your MRX account, conversations, appointments, and private documents? This cannot be undone.')) return;
    const response = await fetch('/api/account', { method: 'DELETE', headers: { Authorization: `Bearer ${session.access_token}` } });
    if (!response.ok) return setStatus('The account could not be deleted.');
    await supabase?.auth.signOut();
    location.href = '/';
  }

  if (!supabase) return <div className="account-card"><h2>Account connection pending</h2><p>The private account area is built and will become active when the Supabase project settings are added.</p></div>;
  if (loading) return <div className="account-card"><p>Loading your private MRX account…</p></div>;
  if (!session) return <form className="account-card account-signin" onSubmit={requestLink}><p className="account-kicker">Private owner account</p><h2>Return to your questions and documents</h2><p>Enter the email you used with Tommy. MRX will send a passwordless sign-in link.</p><label>Email<input name="email" type="email" required autoComplete="email" /></label><button type="submit">Email my sign-in link</button>{status && <p className="account-status">{status}</p>}</form>;

  return <div className="account-hub">
    <header><div><p className="account-kicker">Private owner account</p><h2>Welcome back</h2><p>{session.user.email}</p></div><button type="button" onClick={() => supabase.auth.signOut()}>Sign out</button></header>
    {status && <p className="account-status">{status}</p>}
    <section><div className="account-section-head"><div><h3>Conversations</h3><p>Your saved questions, cited answers, and appointment history.</p></div><button type="button" onClick={() => window.dispatchEvent(new CustomEvent('mrx:open-chat'))}>Ask Tommy</button></div>
      {!conversations.length ? <p className="account-empty">No saved conversations yet.</p> : <div className="account-list">{conversations.map((conversation) => <details key={conversation.id}><summary><span>{conversation.title || conversation.summary || 'Mineral-rights conversation'}</span><time>{new Date(conversation.updated_at).toLocaleDateString()}</time></summary><div>{conversation.messages?.map((message) => <article key={message.id}><small>{message.role === 'assistant' ? `${message.persona || 'tommy'} · MRX AI Guide` : 'You'}</small><p>{message.content}</p></article>)}</div></details>)}</div>}
    </section>
    <section><div className="account-section-head"><div><h3>Private documents</h3><p>Original files remain private and are never copied into GoHighLevel.</p></div></div>
      {!attachments.length ? <p className="account-empty">No private documents attached.</p> : <div className="account-files">{attachments.map((file) => <div key={file.id}><span><strong>{file.original_name}</strong><small>{Math.round(file.size_bytes / 1024)} KB · {file.status}</small></span><button type="button" onClick={() => deleteAttachment(file.id)}>Delete</button></div>)}</div>}
    </section>
    <section className="account-controls"><h3>Your data controls</h3><p>Download a machine-readable copy or permanently delete the account and its private files.</p><div><button type="button" onClick={downloadExport}>Download my data</button><button type="button" className="account-danger" onClick={deleteAccount}>Delete my account</button></div></section>
  </div>;
}
