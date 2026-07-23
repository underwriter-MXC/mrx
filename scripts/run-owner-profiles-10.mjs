import { randomUUID } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createClient } from '@supabase/supabase-js';
import {
  TEST_OWNER_INTERESTS,
  TEST_STATEMENT_TOTALS,
  assessmentDetails,
  buildTestOwnerProfiles,
} from './lib/test-owner-profiles.mjs';
import { isProductionHostname } from './lib/production-host.mjs';

const baseUrl = (process.env.MRX_STAGING_BASE_URL || '').replace(/\/$/, '');
const secret = process.env.MRX_STAGING_TEST_SECRET || '';
const vercelProtectionBypass = process.env.MRX_STAGING_VERCEL_BYPASS || '';
const vercelProtectionCookie = process.env.MRX_STAGING_VERCEL_COOKIE || '';
const publicSupabaseUrl = process.env.PUBLIC_SUPABASE_URL || '';
const publicSupabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || '';
const fixturePath = resolve('output/pdf/mrx-dawson-test-data.pdf');
const outputDirectory = resolve('artifacts/test-runs');
const runId = process.env.MRX_TEST_RUN_ID || randomUUID();
const cleanupMode = process.argv.includes('--cleanup');
const dryRun = process.argv.includes('--dry-run');
const allowedCompletionStates = new Set(['quarantined', 'queued', 'ready']);

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] || '' : '';
}

function assertEnvironment() {
  if (!baseUrl || !secret) {
    throw new Error('MRX_STAGING_BASE_URL and MRX_STAGING_TEST_SECRET are required.');
  }
  if (isProductionHostname(new URL(baseUrl).hostname)) {
    throw new Error('The TEST owner runner is blocked from production hostnames.');
  }
  if (!cleanupMode && (!publicSupabaseUrl || !publicSupabaseAnonKey)) {
    throw new Error('PUBLIC_SUPABASE_URL and PUBLIC_SUPABASE_ANON_KEY are required for upload.');
  }
}

function cookieFrom(response, current = '') {
  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return current;
  const first = setCookie.split(';')[0];
  const map = new Map(
    current
      .split(';')
      .filter(Boolean)
      .map((item) => item.trim().split('=')),
  );
  const [name, value] = first.split('=');
  map.set(name, value);
  return [...map].map(([key, valuePart]) => `${key}=${valuePart}`).join('; ');
}

async function request(path, options = {}, ordinal = 0, cookie = '') {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Origin: baseUrl,
      'Content-Type': 'application/json',
      'x-mrx-test-secret': secret,
      'x-mrx-test-owner': `${runId}:${ordinal}`,
      'x-forwarded-for': `198.51.100.${ordinal + 20}`,
      ...(vercelProtectionBypass ? { 'x-vercel-protection-bypass': vercelProtectionBypass } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
      ...(options.headers || {}),
    },
  });
  return { response, cookie: cookieFrom(response, cookie) };
}

async function jsonOrError(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `request_failed_${response.status}`);
  return body;
}

function structuredInterests() {
  return TEST_OWNER_INTERESTS.map((interest) => ({
    ...interest,
    assessmentDetails: assessmentDetails(interest),
  }));
}

async function cleanup(targetRunId) {
  if (!targetRunId) throw new Error('--cleanup requires --run-id <uuid>.');
  const result = await request(
    '/api/test/cleanup-run',
    { method: 'POST', body: JSON.stringify({ runId: targetRunId }) },
    0,
    vercelProtectionCookie,
  );
  return jsonOrError(result.response);
}

async function seedOwner(owner, pdfBytes, supabase) {
  let cookie = vercelProtectionCookie;
  let result = await request(
    '/api/chat/session',
    { method: 'POST', body: '{}' },
    owner.ordinal,
    cookie,
  );
  cookie = result.cookie;
  await jsonOrError(result.response);

  result = await request(
    '/api/test/verify-owner',
    {
      method: 'POST',
      body: JSON.stringify({
        runId,
        firstName: owner.firstName,
        lastName: owner.lastName,
        email: owner.email,
        phone: owner.phone,
        interests: structuredInterests(),
        correction: false,
      }),
    },
    owner.ordinal,
    cookie,
  );
  cookie = result.cookie;
  const verified = await jsonOrError(result.response);
  if (!Array.isArray(verified.interestIds) || verified.interestIds.length !== 3) {
    throw new Error(`${owner.displayName}: structured_interest_seed_failed`);
  }

  result = await request(
    '/api/chat/attachments/sign',
    {
      method: 'POST',
      body: JSON.stringify({
        filename: owner.fixtureFileName,
        mimeType: 'application/pdf',
        size: pdfBytes.byteLength,
        mineralInterestId: null,
        documentType: 'other',
        documentProcessingConsent: true,
        disclosureVersion: '2026-07-21-staging-test-fixture',
        sourceUrl: `${baseUrl}/account/?test_run_id=${runId}`,
      }),
    },
    owner.ordinal,
    cookie,
  );
  cookie = result.cookie;
  const signed = await jsonOrError(result.response);
  const uploaded = await supabase.storage
    .from('owner-documents')
    .uploadToSignedUrl(
      signed.path,
      signed.token,
      new Blob([pdfBytes], { type: 'application/pdf' }),
      { contentType: 'application/pdf' },
    );
  if (uploaded.error) throw uploaded.error;

  result = await request(
    '/api/chat/attachments/complete',
    { method: 'POST', body: JSON.stringify({ attachmentId: signed.attachmentId }) },
    owner.ordinal,
    cookie,
  );
  cookie = result.cookie;
  const completed = await jsonOrError(result.response);
  if (!allowedCompletionStates.has(completed.status)) {
    throw new Error(`${owner.displayName}: unexpected_document_status_${completed.status}`);
  }

  result = await request('/api/chat/session', { method: 'GET' }, owner.ordinal, cookie);
  const restored = await jsonOrError(result.response);
  const errors = [];
  if (restored.profile?.first_name !== owner.firstName) errors.push('first_name');
  if (restored.profile?.last_name !== 'TEST') errors.push('last_name');
  if (restored.profile?.email?.toLowerCase() !== owner.email) errors.push('email');
  if (restored.profile?.phone !== owner.phone) errors.push('phone');
  if (restored.interests?.length !== 3) errors.push('interest_count');
  if (restored.documents?.length !== 1) errors.push('document_count');
  for (const expected of TEST_OWNER_INTERESTS) {
    const actual = restored.interests?.find((interest) => interest.label === expected.label);
    if (!actual) errors.push(`missing_${expected.propertyReference}`);
    else {
      if (actual.parcel_reference !== expected.propertyReference) {
        errors.push(`property_reference_${expected.propertyReference}`);
      }
      if (actual.operator !== expected.operator)
        errors.push(`operator_${expected.propertyReference}`);
      if (Number(actual.royalty_decimal) !== expected.royaltyDecimal) {
        errors.push(`royalty_decimal_${expected.propertyReference}`);
      }
      if (actual.net_mineral_acres !== null)
        errors.push(`invented_acres_${expected.propertyReference}`);
    }
  }
  if (errors.length) throw new Error(`${owner.displayName}: ${errors.join(',')}`);

  return {
    ordinal: owner.ordinal,
    displayName: owner.displayName,
    profileId: verified.profileId,
    conversationId: verified.conversationId,
    interestCount: restored.interests.length,
    documentCount: restored.documents.length,
    documentStatus: restored.documents[0].status,
  };
}

async function runSummary() {
  let latest;
  for (let attempt = 0; attempt < 7; attempt += 1) {
    const result = await request(
      '/api/test/run-summary',
      { method: 'POST', body: JSON.stringify({ runId }) },
      0,
      vercelProtectionCookie,
    );
    latest = await jsonOrError(result.response);
    if (
      latest.valid ||
      !latest.documentStates?.some((status) => ['scanning', 'extracting'].includes(status))
    ) {
      return latest;
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 5_000));
  }
  return latest;
}

async function main() {
  const owners = buildTestOwnerProfiles();
  if (dryRun) {
    console.log(
      JSON.stringify(
        {
          ok: true,
          mode: 'dry-run',
          profiles: owners.length,
          interestsPerProfile: TEST_OWNER_INTERESTS.length,
          statementTotals: TEST_STATEMENT_TOTALS,
          names: owners.map((owner) => owner.displayName),
        },
        null,
        2,
      ),
    );
    return;
  }
  assertEnvironment();
  if (cleanupMode) {
    console.log(JSON.stringify(await cleanup(argumentValue('--run-id')), null, 2));
    return;
  }

  const pdfBytes = await readFile(fixturePath);
  if (pdfBytes.byteLength === 0 || pdfBytes.subarray(0, 4).toString() !== '%PDF') {
    throw new Error('The sanitized MRX TEST DATA fixture is missing or invalid.');
  }
  const supabase = createClient(publicSupabaseUrl, publicSupabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const results = [];
  try {
    for (const owner of owners) results.push(await seedOwner(owner, pdfBytes, supabase));
    const summary = await runSummary();
    if (!summary.valid) throw new Error('run_summary_assertions_failed');
    const report = {
      ok: true,
      mode: 'staging-integration',
      stagingUrl: baseUrl,
      runId,
      retainedProfiles: results.length,
      interestsPerProfile: TEST_OWNER_INTERESTS.length,
      totalInterests: results.length * TEST_OWNER_INTERESTS.length,
      fixturesUploaded: results.reduce((total, item) => total + item.documentCount, 0),
      documentStates: summary.documentStates,
      activeOutboundDispatches: summary.totals.activeOutboundDispatches,
      sourcePdfUsed: false,
      cleanupCommand: `pnpm test:owner-profiles:10 -- --cleanup --run-id ${runId}`,
      profiles: results,
    };
    await mkdir(outputDirectory, { recursive: true });
    const reportPath = resolve(outputDirectory, `owner-profiles-10-${runId}.json`);
    await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    console.log(JSON.stringify({ ...report, reportPath }, null, 2));
  } catch (error) {
    let cleanupResult = null;
    try {
      cleanupResult = await cleanup(runId);
    } catch (cleanupError) {
      cleanupResult = {
        ok: false,
        error: cleanupError instanceof Error ? cleanupError.message : 'cleanup_failed',
      };
    }
    throw new Error(
      `${error instanceof Error ? error.message : 'seed_failed'}; partial_run_cleanup=${JSON.stringify(cleanupResult)}`,
    );
  }
}

main().catch((error) => {
  console.error(
    JSON.stringify(
      { ok: false, error: error instanceof Error ? error.message : 'owner_profile_run_failed' },
      null,
      2,
    ),
  );
  process.exitCode = 1;
});
