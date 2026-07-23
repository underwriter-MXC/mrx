import { mkdir, writeFile } from 'node:fs/promises';
import { randomUUID } from 'node:crypto';
import { resolve } from 'node:path';
import { buildAskTommyScenarios, summarizeAskTommyScenarios } from './lib/ask-tommy-scenarios.mjs';
import { isProductionHostname } from './lib/production-host.mjs';

const baseUrl = (process.env.MRX_STAGING_BASE_URL || '').replace(/\/$/, '');
const secret = process.env.MRX_STAGING_TEST_SECRET;
const vercelProtectionBypass = process.env.MRX_STAGING_VERCEL_BYPASS;
const vercelProtectionCookie = process.env.MRX_STAGING_VERCEL_COOKIE || '';
const runId = process.env.MRX_TEST_RUN_ID || randomUUID();
const dryRun = process.argv.includes('--dry-run');
const outputDirectory = resolve('test-results');
const scenarios = buildAskTommyScenarios(runId);

if (!dryRun) {
  if (!baseUrl || !secret)
    throw new Error('MRX_STAGING_BASE_URL and MRX_STAGING_TEST_SECRET are required.');
  if (isProductionHostname(new URL(baseUrl).hostname)) {
    throw new Error('The 100-owner runner is blocked from the production hostname.');
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
  return [...map].map(([key, next]) => `${key}=${next}`).join('; ');
}

async function request(path, options, ownerIndex, cookie = '') {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      Origin: baseUrl,
      'Content-Type': 'application/json',
      'x-mrx-test-secret': secret,
      'x-mrx-test-owner': `${runId}:${ownerIndex}`,
      ...(vercelProtectionBypass ? { 'x-vercel-protection-bypass': vercelProtectionBypass } : {}),
      'x-forwarded-for': `198.51.100.${(ownerIndex % 200) + 1}`,
      ...(cookie ? { Cookie: cookie } : {}),
      ...options?.headers,
    },
  });
  return { response, cookie: cookieFrom(response, cookie) };
}

async function executeScenario(scenario) {
  let cookie = vercelProtectionCookie;
  const startedAt = Date.now();
  let result = await request(
    '/api/chat/session',
    { method: 'POST', body: '{}' },
    scenario.ordinal,
    cookie,
  );
  cookie = result.cookie;
  if (!result.response.ok) throw new Error(`session ${result.response.status}`);

  result = await request(
    '/api/chat/message',
    {
      method: 'POST',
      body: JSON.stringify({ message: scenario.prompt, path: '/staging-validation/' }),
    },
    scenario.ordinal,
    cookie,
  );
  cookie = result.cookie;
  const transcript = await result.response.text();
  if (!result.response.ok || !transcript.includes('event: done'))
    throw new Error(`chat ${result.response.status}`);
  const guide = transcript.match(/"persona":"([a-z]+)"/)?.[1] || 'unknown';

  result = await request(
    '/api/test/verify-owner',
    {
      method: 'POST',
      body: JSON.stringify(scenario),
    },
    scenario.ordinal,
    cookie,
  );
  cookie = result.cookie;
  if (!result.response.ok)
    throw new Error(`identity ${result.response.status}: ${await result.response.text()}`);

  result = await request(
    '/api/chat/permissions',
    {
      method: 'POST',
      body: JSON.stringify({
        email: scenario.email,
        phone: scenario.phone,
        permissions: scenario.permissions,
        sourceUrl: `${baseUrl}/staging-validation/?test_run_id=${runId}`,
      }),
    },
    scenario.ordinal,
    cookie,
  );
  cookie = result.cookie;
  if (!result.response.ok)
    throw new Error(`permissions ${result.response.status}: ${await result.response.text()}`);

  result = await request('/api/chat/session', { method: 'GET' }, scenario.ordinal, cookie);
  const restored = await result.response.json();
  const messages = restored.messages || [];
  const interests = restored.interests || [];
  const actualPermissions = restored.permissions || {};
  const errors = [];
  if (restored.profile?.first_name !== scenario.firstName) errors.push('first_name');
  if (restored.profile?.last_name !== scenario.lastName) errors.push('last_name');
  if (restored.profile?.email?.toLowerCase() !== scenario.email) errors.push('email');
  if (restored.profile?.phone !== scenario.phone) errors.push('phone');
  if (messages.filter((message) => message.role === 'user').length !== 1)
    errors.push('user_message_count');
  const expectedAssistantMessages = scenario.expectedGuide === 'tommy' ? 1 : 2;
  if (
    messages.filter((message) => message.role === 'assistant').length !== expectedAssistantMessages
  )
    errors.push('assistant_message_count');
  if (interests.length !== scenario.propertyCount) errors.push('property_count');
  for (const channel of ['email', 'sms', 'aiVoice']) {
    if (actualPermissions[channel] !== scenario.permissions[channel])
      errors.push(`permission_${channel}`);
  }
  if (guide !== scenario.expectedGuide) errors.push('guide_routing');
  if (
    /[\u2014\u2013]|(^|\s)---(?=\s|$)/m.test(messages.map((message) => message.content).join('\n'))
  )
    errors.push('prohibited_dash');
  const crmResult = await request(
    '/api/test/sync-owner',
    {
      method: 'POST',
      body: JSON.stringify({ runId: scenario.runId }),
    },
    scenario.ordinal,
    cookie,
  );
  const crm = await crmResult.response.json().catch(() => ({}));
  if (![200, 409].includes(crmResult.response.status))
    errors.push(`crm_sync_${crmResult.response.status}`);
  return {
    ordinal: scenario.ordinal,
    email: scenario.email,
    category: scenario.category,
    expectedGuide: scenario.expectedGuide,
    actualGuide: guide,
    durationMs: Date.now() - startedAt,
    crmSynced: Boolean(crm.synced),
    crmSkipped: crmResult.response.status === 409,
    passed: errors.length === 0,
    errors,
  };
}

const results = [];
let cleanup = { attempted: false, ok: dryRun, deletedConversations: 0, deletedProfiles: 0 };
if (!dryRun) {
  for (let index = 0; index < scenarios.length; index += 5) {
    const batch = scenarios.slice(index, index + 5);
    results.push(
      ...(await Promise.all(
        batch.map(async (scenario) => {
          try {
            return await executeScenario(scenario);
          } catch (error) {
            return {
              ordinal: scenario.ordinal,
              email: scenario.email,
              category: scenario.category,
              passed: false,
              errors: [error instanceof Error ? error.message : 'unknown'],
            };
          }
        }),
      )),
    );
  }

  cleanup = { attempted: true, ok: false, deletedConversations: 0, deletedProfiles: 0 };
  try {
    const cleanupResult = await request(
      '/api/test/cleanup-run',
      {
        method: 'POST',
        body: JSON.stringify({ runId }),
      },
      0,
      vercelProtectionCookie,
    );
    const cleanupBody = await cleanupResult.response.json().catch(() => ({}));
    cleanup = {
      attempted: true,
      ok: cleanupResult.response.ok && cleanupBody.ok === true,
      deletedConversations: cleanupBody.deletedConversations ?? 0,
      deletedProfiles: cleanupBody.deletedProfiles ?? 0,
      ...(!cleanupResult.response.ok
        ? { error: cleanupBody.error || `cleanup_${cleanupResult.response.status}` }
        : {}),
    };
  } catch (error) {
    cleanup = {
      attempted: true,
      ok: false,
      deletedConversations: 0,
      deletedProfiles: 0,
      error: error instanceof Error ? error.message : 'cleanup_failed',
    };
  }
}

const report = {
  runId,
  generatedAt: new Date().toISOString(),
  mode: dryRun ? 'fixture-validation' : 'staging-integration',
  population: summarizeAskTommyScenarios(scenarios),
  results,
  cleanup,
  passed: dryRun
    ? true
    : results.length === 100 && results.every((result) => result.passed) && cleanup.ok,
};
await mkdir(outputDirectory, { recursive: true });
await writeFile(
  resolve(outputDirectory, `ask-tommy-100-${runId}.json`),
  `${JSON.stringify(report, null, 2)}\n`,
);
await writeFile(
  resolve(outputDirectory, `ask-tommy-100-${runId}.md`),
  `# Ask Tommy 100-conversation report\n\n- Run: ${runId}\n- Mode: ${report.mode}\n- Owners: ${scenarios.length}\n- Passed: ${report.passed ? 'yes' : 'no'}\n- Failed conversations: ${results.filter((result) => !result.passed).length}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!report.passed) process.exitCode = 1;
