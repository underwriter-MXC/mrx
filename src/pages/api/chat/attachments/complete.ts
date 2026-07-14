import type { APIRoute } from 'astro';
import { z } from 'zod';
import { getSupabaseServer } from '../../../../lib/platform/supabase';
import { assertSameOrigin, json, safeError } from '../../../../lib/platform/security';

const Schema = z.object({ attachmentId: z.string().uuid() });

function validMagic(bytes: Uint8Array, mime: string) {
  if (mime === 'application/pdf') return String.fromCharCode(...bytes.slice(0, 4)) === '%PDF';
  if (mime === 'image/jpeg') return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  if (mime === 'image/png') return bytes.slice(0, 8).every((byte, index) => byte === [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a][index]);
  return false;
}

export const POST: APIRoute = async (context) => {
  try {
    assertSameOrigin(context.request);
    const parsed = Schema.safeParse(await context.request.json());
    if (!parsed.success) return json({ ok: false, error: 'validation_failed' }, { status: 400 });
    const token = context.request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
    const supabase = getSupabaseServer();
    if (!supabase || !token) return json({ ok: false, error: 'verified_account_required' }, { status: 401 });
    const { data: auth } = await supabase.auth.getUser(token);
    if (!auth.user) return json({ ok: false, error: 'verified_account_required' }, { status: 401 });
    const { data: record } = await supabase.from('attachments').select('*').eq('id', parsed.data.attachmentId).eq('user_id', auth.user.id).single();
    if (!record) return json({ ok: false, error: 'not_found' }, { status: 404 });
    const { data: blob, error: downloadError } = await supabase.storage.from('owner-documents').download(record.storage_path);
    if (downloadError || !blob) throw downloadError || new Error('download failed');
    if (blob.size > 15 * 1024 * 1024) return json({ ok: false, error: 'file_too_large' }, { status: 400 });
    const bytes = new Uint8Array(await blob.arrayBuffer());
    if (!validMagic(bytes, record.mime_type)) {
      await supabase.from('attachments').update({ status: 'rejected', rejection_reason: 'file_signature_mismatch' }).eq('id', record.id);
      return json({ ok: false, error: 'file_signature_mismatch' }, { status: 400 });
    }
    const scanner = import.meta.env.MALWARE_SCAN_URL;
    if (!scanner) return json({ ok: true, status: 'quarantined', message: 'Upload received and awaiting the configured security scanner.' }, { status: 202 });
    const form = new FormData();
    form.set('file', blob, record.original_name);
    const scan = await fetch(scanner, { method: 'POST', headers: import.meta.env.MALWARE_SCAN_TOKEN ? { Authorization: `Bearer ${import.meta.env.MALWARE_SCAN_TOKEN}` } : {}, body: form });
    if (!scan.ok) throw new Error('scanner unavailable');
    const result = await scan.json();
    if (!result.clean) {
      await supabase.storage.from('owner-documents').remove([record.storage_path]);
      await supabase.from('attachments').update({ status: 'rejected', rejection_reason: 'malware_detected' }).eq('id', record.id);
      return json({ ok: false, error: 'file_rejected' }, { status: 400 });
    }
    const readyPath = record.storage_path.replace(/^quarantine\//, 'ready/');
    await supabase.storage.from('owner-documents').copy(record.storage_path, readyPath);
    await supabase.storage.from('owner-documents').remove([record.storage_path]);
    let extractedText: string | null = null;
    if (import.meta.env.DOCUMENT_OCR_URL) {
      const ocr = await fetch(import.meta.env.DOCUMENT_OCR_URL, { method: 'POST', headers: { 'Content-Type': record.mime_type }, body: bytes });
      if (ocr.ok) extractedText = (await ocr.text()).slice(0, 250_000);
    }
    await supabase.from('attachments').update({ storage_path: readyPath, status: 'ready', extracted_text: extractedText, processed_at: new Date().toISOString() }).eq('id', record.id);
    return json({ ok: true, status: 'ready' });
  } catch (error) {
    return safeError(error);
  }
};
