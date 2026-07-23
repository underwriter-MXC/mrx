const url = process.env.SUPABASE_URL || process.env.PUBLIC_SUPABASE_URL;
const publicKey = process.env.PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !publicKey || !serviceKey) {
  throw new Error(
    'PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, and SUPABASE_SERVICE_ROLE_KEY are required.',
  );
}

async function check(label, key, path) {
  const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/${path}`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(
      `${label} failed (${response.status}): ${body.message || body.code || 'unknown response'}`,
    );
  }
}

await check('Public Supabase key', publicKey, 'knowledge_documents?select=id&limit=1');
await check('Server Supabase key', serviceKey, 'profiles?select=id,completed_lead_at&limit=1');
await check('Communication schema', serviceKey, 'communication_dispatches?select=id&limit=1');
await check(
  'GHL transcript sync schema',
  serviceKey,
  'messages?select=id,ghl_message_id,ghl_synced_at&limit=1',
);
await check(
  'GHL OCR sync schema',
  serviceKey,
  'document_extractions?select=id,ghl_message_ids,ghl_synced_at&limit=1',
);
await check(
  'Owner residence geography schema',
  serviceKey,
  'profiles?select=id,residence_city,residence_county_fips&limit=1',
);
await check(
  'Mineral-interest geography schema',
  serviceKey,
  'mineral_interests?select=id,city,state_code,county_fips,geography_status&limit=1',
);
await check(
  'Geography audit schema',
  serviceKey,
  'geography_resolutions?select=id,status,provider_vintage&limit=1',
);
console.log(
  'Supabase keys and the MRX owner-memory, communication, CRM-sync, and U.S. geography schema are valid.',
);
