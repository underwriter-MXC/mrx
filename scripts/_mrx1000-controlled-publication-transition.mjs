import { createHash } from 'node:crypto';

const HEX64 = /^[a-f0-9]{64}$/i;

export function sha256Bytes(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function extractFrontmatterBytes(source) {
  const text = Buffer.isBuffer(source) ? source.toString('utf8') : String(source);
  const match = text.match(/^---(\r?\n)([\s\S]*?)\1---/);
  if (!match) return null;
  return Buffer.from(`${match[2]}${match[1]}`, 'utf8');
}

function replaceSingleFrontmatterScalar(frontmatter, key, from, to) {
  const pattern = new RegExp(`^(${key}:[\\t ]*)${from}([\\t ]*)$`, 'gm');
  const matches = [...frontmatter.matchAll(pattern)];
  if (matches.length !== 1) return null;
  return frontmatter.replace(pattern, `$1${to}$2`);
}

/**
 * Proves the only post-review source mutation is the authorized publication
 * transition for an exact-admission row:
 *
 *   publication_status: draft -> published
 *   noindex: true -> false
 *
 * The proof is byte-exact: reversing those two scalars must reproduce the
 * immutable article_sha256 signed by D-2026-0801-10. Any other source or
 * frontmatter mutation therefore fails closed.
 */
export function analyzeControlledPublicationTransition(source, entry) {
  const currentBytes = Buffer.isBuffer(source) ? source : Buffer.from(source);
  const currentText = currentBytes.toString('utf8');
  const currentBodySha256 = sha256Bytes(currentBytes);
  const currentFrontmatterBytes = extractFrontmatterBytes(currentBytes);
  const currentFrontmatterSha256 = currentFrontmatterBytes
    ? sha256Bytes(currentFrontmatterBytes)
    : null;
  const reviewedBodySha256 = String(entry?.article_sha256 ?? entry?.repo_sha256 ?? '').toLowerCase();
  const exactAdmission =
    entry?.admission_status === 'admitted_exact' &&
    entry?.finalization_state === 'draft_noindex_admitted' &&
    HEX64.test(reviewedBodySha256);

  const base = {
    authorized: false,
    state: 'invalid',
    reason: null,
    exact_admission: exactAdmission,
    reviewed_body_sha256: reviewedBodySha256 || null,
    reviewed_frontmatter_sha256: null,
    current_body_sha256: currentBodySha256,
    current_frontmatter_sha256: currentFrontmatterSha256,
    normalized_body_sha256: null,
    changes: [],
  };

  if (!currentFrontmatterBytes) {
    return { ...base, reason: 'frontmatter_not_detected' };
  }

  if (currentBodySha256 === reviewedBodySha256) {
    return {
      ...base,
      authorized: true,
      state: 'reviewed_bytes_current',
      reason: null,
      reviewed_frontmatter_sha256: currentFrontmatterSha256,
      normalized_body_sha256: currentBodySha256,
    };
  }

  if (!exactAdmission) {
    return { ...base, reason: 'current_bytes_do_not_match_reviewed_hash' };
  }

  const match = currentText.match(/^---(\r?\n)([\s\S]*?)\1---/);
  if (!match) return { ...base, reason: 'frontmatter_not_detected' };
  let normalizedFrontmatter = match[2];
  normalizedFrontmatter = replaceSingleFrontmatterScalar(
    normalizedFrontmatter,
    'publication_status',
    'published',
    'draft',
  );
  if (normalizedFrontmatter == null) {
    return { ...base, reason: 'publication_status_is_not_exactly_published_once' };
  }
  normalizedFrontmatter = replaceSingleFrontmatterScalar(
    normalizedFrontmatter,
    'noindex',
    'false',
    'true',
  );
  if (normalizedFrontmatter == null) {
    return { ...base, reason: 'noindex_is_not_exactly_false_once' };
  }
  if (!/^draft:[\t ]*false[\t ]*$/m.test(normalizedFrontmatter)) {
    return { ...base, reason: 'draft_must_remain_false' };
  }

  const normalizedText = currentText.replace(
    /^---(\r?\n)([\s\S]*?)\1---/,
    (_whole, newline) => `---${newline}${normalizedFrontmatter}${newline}---`,
  );
  const normalizedBytes = Buffer.from(normalizedText, 'utf8');
  const normalizedBodySha256 = sha256Bytes(normalizedBytes);
  const normalizedFrontmatterBytes = extractFrontmatterBytes(normalizedBytes);
  const reviewedFrontmatterSha256 = normalizedFrontmatterBytes
    ? sha256Bytes(normalizedFrontmatterBytes)
    : null;

  if (normalizedBodySha256 !== reviewedBodySha256) {
    return {
      ...base,
      reason: 'normalized_bytes_do_not_match_reviewed_hash',
      reviewed_frontmatter_sha256: reviewedFrontmatterSha256,
      normalized_body_sha256: normalizedBodySha256,
    };
  }

  return {
    ...base,
    authorized: true,
    state: 'controlled_publication_transition',
    reason: null,
    reviewed_frontmatter_sha256: reviewedFrontmatterSha256,
    normalized_body_sha256: normalizedBodySha256,
    changes: [
      { field: 'publication_status', from: 'draft', to: 'published' },
      { field: 'noindex', from: true, to: false },
    ],
  };
}

export function transitionProofMatches(left, right) {
  const keys = [
    'authorized',
    'state',
    'exact_admission',
    'reviewed_body_sha256',
    'reviewed_frontmatter_sha256',
    'current_body_sha256',
    'current_frontmatter_sha256',
    'normalized_body_sha256',
  ];
  return keys.every((key) => left?.[key] === right?.[key]) &&
    JSON.stringify(left?.changes ?? []) === JSON.stringify(right?.changes ?? []);
}
