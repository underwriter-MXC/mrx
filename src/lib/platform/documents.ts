import { getSupabaseServer } from './supabase';
import { runtimeEnv, runtimeFlag } from './runtime-env';

type DocumentMemoryChunk = { source_type?: string | null; content: string };

export type DocumentReadSummary = {
  content: string;
  memory: string;
  metadata: {
    kind: 'document_read_summary';
    documentType: string;
    pageCount: number;
    fields: Record<string, string[]>;
    piiCategories: string[];
    confidence: 'candidate_owner_verification_needed';
  };
};

function readableDocumentType(value?: string | null) {
  return (value || 'other').replaceAll('_', ' ');
}

export function inferDocumentType(text: string, declaredType?: string | null) {
  if (declaredType && declaredType !== 'other') return declaredType;
  const rules: Array<[string, RegExp]> = [
    ['royalty_statement', /\b(?:revenue statement|royalty statement|owner net value)\b/i],
    ['royalty_check_stub', /\b(?:royalty check|check stub|check amount)\b/i],
    ['division_order', /\bdivision order\b/i],
    ['lease_amendment', /\blease amendment\b/i],
    ['oil_gas_lease', /\b(?:oil and gas|oil & gas)\s+lease\b/i],
    ['mineral_deed', /\b(?:mineral|royalty)\s+deed\b/i],
    ['form_1099_misc', /\b(?:1099-MISC|Form 1099)\b/i],
    ['probate_order', /\b(?:probate|order admitting will|letters testamentary)\b/i],
    ['trust_document', /\b(?:declaration of trust|trust agreement)\b/i],
    ['tax_statement', /\b(?:ad valorem|property tax statement|tax assessor)\b/i],
    ['purchase_offer', /\b(?:purchase offer|offer to purchase)\b/i],
    ['operator_correspondence', /\boperator correspondence\b/i],
  ];
  return rules.find(([, pattern]) => pattern.test(text))?.[0] ?? 'other';
}

function unique(values: Array<string | null | undefined>, limit = 6) {
  const seen = new Set<string>();
  const output: string[] = [];
  for (const value of values) {
    const clean = value?.replace(/\s+/g, ' ').trim();
    if (!clean || clean.length < 2) continue;
    const key = clean.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    output.push(clean);
    if (output.length >= limit) break;
  }
  return output;
}

function dollars(text: string) {
  return unique(
    [...text.matchAll(/\$\s?\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g)].map((match) => match[0]),
    8,
  );
}

function titleCaseLabel(value: string) {
  return value
    .toLowerCase()
    .replace(/\b\w/g, (character) => character.toUpperCase())
    .replace(/\bApi\b/g, 'API');
}

function revenueFigures(text: string) {
  const amount = String.raw`((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})`;
  const labels =
    'check amount|check total|net revenue|owner net value|owner gross value|gross owner amount|owner taxes|owner deductions|tax or deduct amount|amount after taxes and deductions';
  const afterLabel = new RegExp(String.raw`\b(${labels})\s*[:#-]?\s*\$?\s*${amount}`, 'gi');
  const beforeLabel = new RegExp(String.raw`\$?\s*${amount}\s*(${labels})\b`, 'gi');
  return unique(
    [
      ...dollars(text),
      ...[...text.matchAll(afterLabel)].map((match) => `${titleCaseLabel(match[1])}: $${match[2]}`),
      ...[...text.matchAll(beforeLabel)].map(
        (match) => `${titleCaseLabel(match[2])}: $${match[1]}`,
      ),
    ],
    10,
  );
}

function lineValues(text: string, patterns: RegExp[]) {
  return unique(
    patterns.flatMap((pattern) => [...text.matchAll(pattern)].map((match) => match[1] || match[0])),
  );
}

function locationValues(text: string) {
  const explicit = lineValues(text, [
    /\b([A-Za-z][A-Za-z .'-]{1,80}\s+County,?\s+(?:Texas|TX|New Mexico|NM|Oklahoma|OK|North Dakota|ND|Colorado|CO|Wyoming|WY|Louisiana|LA))\b/gi,
    /\bCounty\s*[:#-]?\s*([A-Za-z][A-Za-z .'-]{1,80}?)(?=\s{2,}|\s+(?:Operator|API)\b|[,.;\n]|$)/gi,
  ]);
  const stateThenCounty = [
    ...text.matchAll(
      /\bState\s*[:#-]?\s*([A-Z]{2})\s*,?\s*County\s*[:#-]?\s*([A-Za-z][A-Za-z .'-]{1,80}?)(?=\s{2,}|\s+(?:Operator|API)\b|[,.;\n]|$)/gi,
    ),
  ].map((match) => {
    const county = titleCaseLabel(match[2].replace(/\s+County$/i, '').trim());
    return `${county} County, ${match[1].toUpperCase()}`;
  });
  const labeledCountyKeys = new Set(
    stateThenCounty.map((value) => value.split(/\s+County\b/i)[0].toLowerCase()),
  );
  return unique([
    ...stateThenCounty,
    ...explicit.filter(
      (value) => !labeledCountyKeys.has(value.split(/\s+County\b|,/i)[0].toLowerCase()),
    ),
  ]);
}

function visibleList(values: string[]) {
  return values.length ? values.join('; ') : 'not clearly found';
}

function summarySafeText(text: string) {
  return text
    .replace(/\[REDACTED [^\]]+\]/gi, '')
    .replace(/\b\d{3}[- ]?\d{2}[- ]?\d{4}\b/g, '')
    .replace(/\b(?:account|acct|routing|aba)\s*(?:number|no\.?|#)?\s*[:\-]?\s*\d{4,}\b/gi, '')
    .split(/\r?\n/)
    .map((line) => line.replace(/[^\S\r\n]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildDocumentReadSummary(args: {
  originalName: string;
  documentType?: string | null;
  redactedText: string;
  pageCount?: number | null;
  piiCategories?: string[] | null;
}): DocumentReadSummary {
  const text = summarySafeText(args.redactedText).slice(0, 50_000);
  const fields = {
    parties: lineValues(text, [
      /\b(?:payor|operator|company|purchaser)\s*[:#-]?\s*([^\n.;]{2,120})/gi,
      /\b([A-Z][A-Z0-9 &.,'-]{3,80}\s+(?:RESOURCES|OPERATING|ENERGY|OIL|GAS|MINERALS|LLC|INC|LP|LTD)\b)/g,
    ]),
    dates: lineValues(text, [
      /\b(?:statement|check|payment|production|issue)\s*date\s*[:#-]?\s*([^\n.;]{4,40})/gi,
      /\b(\d{1,2}\/\d{1,2}\/\d{2,4}|\d{4}-\d{2}-\d{2}|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
    ]),
    locations: locationValues(text),
    legalDescriptions: lineValues(text, [
      /\b((?:section|sec\.?|township|twp\.?|range|abstract|block|survey|tract|parcel)[^\n]{4,180})/gi,
    ]),
    leasesOrWells: lineValues(text, [
      /\bProperty\s*:\s*([^,\n]{2,160})/gi,
      /\b(?:lease|well)\s*(?:name|no\.?|number|#)?\s*[:#-]?\s*([^\n.;]{2,120})/gi,
    ]),
    identifiers: lineValues(text, [/\b(?:Operator|Enverus)?\s*API\s*#?\s*[-:#]?\s*(\d{8,14})\b/gi]),
    revenueFigures: revenueFigures(text),
    decimals: lineValues(text, [
      /\b(?:owner\s*)?(?:decimal|interest|royalty decimal)\s*[:#-]?\s*(0?\.\d{4,12})\b/gi,
    ]),
  };
  const pageCount = args.pageCount ?? 0;
  const documentType = readableDocumentType(inferDocumentType(text, args.documentType));
  const content = [
    `I finished reading ${args.originalName}.`,
    `Document type: ${documentType}. Pages read: ${pageCount || 'unknown'}.`,
    'I retained the full redacted extraction for follow-up questions; this summary highlights the main fields I found.',
    `Parties/payor mentioned: ${visibleList(fields.parties)}.`,
    `Location mentioned: ${visibleList(fields.locations)}.`,
    `Lease, well, or property references: ${visibleList(fields.leasesOrWells)}.`,
    `API or other property identifiers: ${visibleList(fields.identifiers)}.`,
    `Legal description clues: ${visibleList(fields.legalDescriptions)}.`,
    `Revenue/income figures found: ${visibleList(fields.revenueFigures)}.`,
    `Ownership/royalty decimals found: ${visibleList(fields.decimals)}.`,
    'Please verify these extracted details before MRX treats them as confirmed facts.',
    'What this does not establish: a certified appraisal, market value, title opinion, or individualized legal or tax guidance.',
  ].join('\n');
  return {
    content,
    memory: `Document-read summary for ${args.originalName}: ${content}`,
    metadata: {
      kind: 'document_read_summary',
      documentType,
      pageCount,
      fields,
      piiCategories: args.piiCategories ?? [],
      confidence: 'candidate_owner_verification_needed',
    },
  };
}

export function documentMemoryForPrompt(chunks: DocumentMemoryChunk[], query: string) {
  const queryTerms = new Set(query.toLowerCase().match(/[a-z0-9]{3,}/g) ?? []);
  return chunks
    .map((chunk, index) => ({
      ...chunk,
      index,
      score:
        chunk.source_type === 'summary'
          ? 1_000
          : (chunk.source_type === 'document' ? 100 : 0) +
            [...queryTerms].reduce(
              (total, term) => total + (chunk.content.toLowerCase().includes(term) ? 10 : 0),
              0,
            ),
    }))
    .filter(
      (chunk) =>
        chunk.source_type === 'summary' || chunk.source_type === 'document' || chunk.score > 0,
    )
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 8)
    .map(({ score: _score, index: _index, ...chunk }) => chunk);
}

export function documentWorkerConfigured() {
  return Boolean(
    runtimeFlag('DOCUMENT_UPLOADS_ENABLED') &&
    runtimeEnv('DOCUMENT_WORKER_URL') &&
    runtimeEnv('DOCUMENT_WORKER_TOKEN') &&
    runtimeEnv('DOCUMENT_WORKER_CALLBACK_SECRET') &&
    runtimeEnv('DOCUMENT_ENCRYPTION_KEY'),
  );
}

let workerHealthCache: { checkedAt: number; available: boolean } | null = null;

export async function documentWorkerAvailable(options: { force?: boolean } = {}) {
  if (!documentWorkerConfigured()) return false;
  const now = Date.now();
  if (!options.force && workerHealthCache && now - workerHealthCache.checkedAt < 30_000) {
    return workerHealthCache.available;
  }
  const workerUrl = runtimeEnv('DOCUMENT_WORKER_URL');
  const workerToken = runtimeEnv('DOCUMENT_WORKER_TOKEN');
  if (!workerUrl || !workerToken) return false;
  try {
    const healthUrl = new URL('/health', workerUrl).toString();
    const response = await fetch(healthUrl, {
      headers: { Authorization: `Bearer ${workerToken}` },
      signal: AbortSignal.timeout(2_500),
    });
    workerHealthCache = { checkedAt: now, available: response.ok };
  } catch {
    workerHealthCache = { checkedAt: now, available: false };
  }
  return workerHealthCache.available;
}

function hex(bytes: ArrayBuffer) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function base64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

async function documentEncryptionKey() {
  const encoded = runtimeEnv('DOCUMENT_ENCRYPTION_KEY');
  if (!encoded) throw new Error('document_encryption_key_unavailable');
  const raw = fromBase64(encoded);
  if (raw.byteLength !== 32) throw new Error('document_encryption_key_invalid');
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

export async function encryptDocumentText(value: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    await documentEncryptionKey(),
    new TextEncoder().encode(value),
  );
  return `v1:${base64(iv)}:${base64(new Uint8Array(encrypted))}`;
}

export async function decryptDocumentText(value: string | null | undefined) {
  if (!value) return '';
  const [version, encodedIv, encodedCiphertext] = value.split(':');
  if (version !== 'v1' || !encodedIv || !encodedCiphertext)
    throw new Error('document_ciphertext_invalid');
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(encodedIv) },
    await documentEncryptionKey(),
    fromBase64(encodedCiphertext),
  );
  return new TextDecoder().decode(decrypted);
}

export async function hmacSha256(secret: string, value: string) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return hex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)));
}

export async function verifyWorkerSignature(args: {
  rawBody: string;
  timestamp: string | null;
  nonce: string | null;
  signature: string | null;
}) {
  const secret = runtimeEnv('DOCUMENT_WORKER_CALLBACK_SECRET');
  if (!secret || !args.timestamp || !args.nonce || !args.signature) return false;
  const numericTimestamp = Number(args.timestamp);
  if (
    !Number.isFinite(numericTimestamp) ||
    Math.abs(Date.now() - numericTimestamp * 1_000) > 5 * 60_000
  ) {
    return false;
  }
  const expected = await hmacSha256(secret, `${args.timestamp}.${args.nonce}.${args.rawBody}`);
  if (expected.length !== args.signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) {
    mismatch |= expected.charCodeAt(i) ^ args.signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function dispatchDocumentJob(args: {
  attachmentId: string;
  storagePath: string;
  mimeType: string;
  originalName: string;
  callbackOrigin: string;
}) {
  if (!(await documentWorkerAvailable())) throw new Error('document_worker_unavailable');
  const supabase = getSupabaseServer();
  if (!supabase) throw new Error('supabase_unavailable');
  const idempotencyKey = crypto.randomUUID();
  const { data: signed, error: signedError } = await supabase.storage
    .from('owner-documents')
    .createSignedUrl(args.storagePath, 120, { download: args.originalName });
  if (signedError || !signed?.signedUrl) throw signedError || new Error('signed_download_failed');
  const { data: job, error: jobError } = await supabase
    .from('document_processing_jobs')
    .insert({
      attachment_id: args.attachmentId,
      status: 'dispatched',
      attempt_count: 0,
      idempotency_key: idempotencyKey,
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (jobError) throw jobError;
  const { error: queuedError } = await supabase
    .from('attachments')
    .update({ status: 'queued' })
    .eq('id', args.attachmentId);
  if (queuedError) throw queuedError;
  const workerUrl = runtimeEnv('DOCUMENT_WORKER_URL');
  const workerToken = runtimeEnv('DOCUMENT_WORKER_TOKEN');
  if (!workerUrl || !workerToken) throw new Error('document_worker_unavailable');
  const payload = JSON.stringify({
    jobId: job.id,
    attachmentId: args.attachmentId,
    downloadUrl: signed.signedUrl,
    mimeType: args.mimeType,
    originalName: args.originalName,
    callbackUrl: `${args.callbackOrigin}/api/chat/attachments/worker-callback`,
  });
  let lastError = 'worker_dispatch_failed';
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const { error: attemptError } = await supabase
      .from('document_processing_jobs')
      .update({ attempt_count: attempt, available_at: new Date().toISOString() })
      .eq('id', job.id);
    if (attemptError) throw attemptError;
    try {
      const response = await fetch(workerUrl, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${workerToken}`,
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
        },
        body: payload,
        signal: AbortSignal.timeout(5_000),
      });
      if (response.ok) return { jobId: job.id as string, idempotencyKey };
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.name : 'network_error';
    }
  }
  workerHealthCache = { checkedAt: Date.now(), available: false };
  const { error: jobFailureError } = await supabase
    .from('document_processing_jobs')
    .update({
      status: 'failed',
      error_code: 'worker_dispatch_failed',
      error_detail: lastError.slice(0, 200),
      completed_at: new Date().toISOString(),
    })
    .eq('id', job.id);
  if (jobFailureError) throw jobFailureError;
  const { error: attachmentFailureError } = await supabase
    .from('attachments')
    .update({ status: 'failed' })
    .eq('id', args.attachmentId);
  if (attachmentFailureError) throw attachmentFailureError;
  throw new Error('worker_dispatch_failed');
}
