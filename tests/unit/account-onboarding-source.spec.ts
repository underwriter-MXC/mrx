import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const accountHub = readFileSync(
  new URL('../../src/components/react/AccountHub.tsx', import.meta.url),
  'utf8',
);
const askTommy = readFileSync(
  new URL('../../src/components/react/AskTommy.tsx', import.meta.url),
  'utf8',
);
const identityApi = readFileSync(
  new URL('../../src/pages/api/chat/identity.ts', import.meta.url),
  'utf8',
);
const mineralInterestApi = readFileSync(
  new URL('../../src/pages/api/account/mineral-interest.ts', import.meta.url),
  'utf8',
);
const attachmentSignApi = readFileSync(
  new URL('../../src/pages/api/chat/attachments/sign.ts', import.meta.url),
  'utf8',
);
const intakeFollowUpApi = readFileSync(
  new URL('../../src/pages/api/account/intake-follow-up.ts', import.meta.url),
  'utf8',
);
const ghlApi = readFileSync(new URL('../../src/lib/platform/ghl.ts', import.meta.url), 'utf8');
const ghlWebhook = readFileSync(
  new URL('../../src/pages/api/webhooks/ghl.ts', import.meta.url),
  'utf8',
);
const siteConfig = readFileSync(new URL('../../src/lib/site.ts', import.meta.url), 'utf8');
const ownerIntakePage = readFileSync(
  new URL('../../src/pages/owner-intake.astro', import.meta.url),
  'utf8',
);
const identityLib = readFileSync(
  new URL('../../src/lib/platform/identity.ts', import.meta.url),
  'utf8',
);
const ownerSessionApi = readFileSync(
  new URL('../../src/pages/api/chat/session.ts', import.meta.url),
  'utf8',
);

describe('account conversation onboarding source contract', () => {
  it('collects full signup identity and keeps document upload inside protected owner access', () => {
    expect(accountHub).toContain('name="fullName"');
    expect(accountHub).toContain('name="phone"');
    expect(accountHub).not.toContain('name="consentEmail"');
    expect(accountHub).not.toContain('name="consentCall"');
    expect(accountHub).not.toContain('name="consentAiVoice"');
    expect(accountHub).not.toContain('name="consentSms"');
    expect(accountHub).toContain('MRX also requests a passwordless email link for');
    expect(accountHub).toContain('Upload supporting document');
    expect(accountHub).toContain('/api/chat/attachments/sign');
    expect(accountHub).toContain('/api/chat/attachments/complete');
    expect(accountHub).toContain('Create account and continue');
    expect(accountHub).toContain(
      '...(session ? { Authorization: `Bearer ${session.access_token}` } : {})',
    );
    expect(accountHub).toContain("fetch('/api/account/claim'");
    expect(accountHub).toContain("headers: { ...headers, 'Content-Type': 'application/json' }");
    expect(accountHub).toContain("body: '{}'");
  });

  it('extends existing identity and account APIs with validation and tenant-scoped ownership', () => {
    expect(identityApi).toContain('fullName: z.string().trim().min(2).max(160).optional()');
    expect(identityApi).toContain(
      "parsed.data.accountSignup === true ||\n        typeof parsed.data.fullName !== 'undefined' ||\n        typeof parsed.data.phone !== 'undefined'",
    );
    // Per CEO P2 the signup branch must NOT write requested_updates receipts.
    expect(identityApi).not.toContain("purpose: 'requested_updates'");
    expect(identityApi).not.toContain('consentRows(');
    expect(identityApi).not.toContain('if (!accountSignup) {');
    expect(identityApi).toContain("error: 'invalid_full_name'");
    expect(identityApi).toContain(
      'const normalizedPhone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null',
    );
    expect(identityApi).toContain('ownerAccountRedirectTo(');
    expect(identityApi).toContain('requestedPermissions');
    expect(identityApi).toContain('email: false');
    expect(identityApi).toContain('sms: false');
    expect(identityApi).toContain('call: false');
    expect(identityApi).toContain('aiVoice: false');
    expect(mineralInterestApi).toContain('requireOwnerProfileAccess(context)');
    expect(mineralInterestApi).toContain('createNewMineralInterest: true');
    expect(mineralInterestApi).toContain(".eq('profile_id', session.profileId)");
    expect(mineralInterestApi).toContain("field: 'mineral_rights_assessment_intake'");
    expect(mineralInterestApi).toContain("source: 'owner_profile'");
    expect(identityApi).toContain('deviceAccess: true');
    expect(identityLib).toContain("accessMode: 'device' as const");
    expect(identityLib).toContain(".eq('conversation_id', session.conversationId)");
    expect(identityLib).toContain("systemRole: 'unverified_owner_intake_uploads'");
    expect(identityLib).toContain("ban_duration: '876000h'");
    expect(ownerSessionApi).toContain("latestPermission.get('call:requested_updates')");
  });

  it('moves requested_updates consent capture into Ask Tommy, including human phone calls', () => {
    expect(accountHub).not.toContain('Choose how MRX may contact you about this owner account');
    expect(accountHub).not.toContain('CONSENT_DISCLOSURES');
    expect(askTommy).toContain("| 'intro-call-consent'");
    expect(askTommy).toContain('call: nextProfile.permissions.call');
    expect(askTommy).toContain('May an MRX team member call');
    expect(askTommy).toContain('a human MRX team member may call with my requested updates');
  });

  it('gates the Ask Tommy human-call prompt on the published disclosure version', () => {
    // Per CEO P3: the call channel must not be enabled in production until
    // compliance signs off. Default `pending` short-circuits Ask Tommy to
    // "I'll come back to that" without writing any consent receipt.
    expect(askTommy).toContain('isHumanCallChannelEnabled');
    expect(askTommy).toContain("I'll come back to that");
    expect(askTommy).toContain("['email', 'sms', 'aiVoice']");
  });

  it('supports guided owner intake, unknown answers, property documents, and staff follow-up', () => {
    expect(ownerIntakePage).toContain('Guided Mineral Owner Intake');
    expect(accountHub).toContain("accountIntent === 'angela'");
    expect(accountHub).toContain("accountIntent === 'standalone'");
    expect(accountHub).toContain('role="dialog"');
    expect(accountHub).toContain('This takes a couple of minutes');
    expect(accountHub).toContain('that is completely');
    expect(accountHub).toContain('Add another property');
    expect(accountHub).toContain('name="state"');
    expect(accountHub).toContain('name="county"');
    expect(accountHub).toContain('name="townshipDistrict"');
    expect(accountHub).toContain('name="taxParcelId"');
    expect(accountHub).toContain('name="netMineralAcres"');
    expect(accountHub).toContain('name="leaseStatus"');
    expect(accountHub).toContain('name="producingStatus"');
    expect(accountHub).toContain('name="recentCheckAmount"');
    expect(accountHub).toContain('name="ownershipType"');
    expect(accountHub).toContain('unknownFields');
    expect(accountHub).toContain('mineralInterestId: requestedMineralInterestId');
    expect(attachmentSignApi).toContain(
      'mineralInterestId: z.string().uuid().nullable().optional()',
    );
    expect(attachmentSignApi).toContain(
      'mineral_interest_id: parsed.data.mineralInterestId || null',
    );
    expect(attachmentSignApi).toContain("propertyAttachmentQuery.eq('mineral_interest_id'");
    expect(attachmentSignApi).toContain('(totalAttachmentCount ?? 0) >= 25');
    expect(attachmentSignApi).toContain('requireOwnerProfileAccess(context)');
    expect(mineralInterestApi).toContain(
      "status: missingFields.length ? 'needs_info' : 'underwriting'",
    );
    expect(mineralInterestApi).toContain("field: 'missing_info_checklist'");
    expect(mineralInterestApi).toContain('underwriter@mineralrightsxchange.com');
    expect(intakeFollowUpApi).toContain('sendGhlIntakeChecklist');
    expect(intakeFollowUpApi).toContain("purpose: 'missing_info_checklist'");
    expect(ghlApi).toContain('Your MRX property checklist');
    expect(ghlWebhook).toContain('attachmentUrls: mediaUrls');
    expect(ghlWebhook).toContain("field: 'missing_info_reply'");
    expect(siteConfig).toContain("{ label: 'Submit Property Details', href: '/owner-intake/' }");
  });
});
