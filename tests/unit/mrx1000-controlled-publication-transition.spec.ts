import { describe, expect, it } from 'vitest';

import {
  analyzeControlledPublicationTransition,
  sha256Bytes,
  transitionProofMatches,
} from '../../scripts/_mrx1000-controlled-publication-transition.mjs';

const reviewed = Buffer.from(
  [
    '---',
    'title: Exact Reviewed Article',
    'draft: false',
    'publication_status: draft',
    'noindex: true',
    '---',
    '',
    '# Exact Reviewed Article',
    '',
    'Reviewed body.',
    '',
  ].join('\n'),
  'utf8',
);

const entry = {
  article_sha256: sha256Bytes(reviewed),
  repo_sha256: sha256Bytes(reviewed),
  admission_status: 'admitted_exact',
  finalization_state: 'draft_noindex_admitted',
};

describe('MRX1000 controlled publication transition', () => {
  it('accepts the immutable reviewed draft bytes', () => {
    const proof = analyzeControlledPublicationTransition(reviewed, entry);
    expect(proof.authorized).toBe(true);
    expect(proof.state).toBe('reviewed_bytes_current');
    expect(proof.current_body_sha256).toBe(entry.article_sha256);
    expect(transitionProofMatches(proof, structuredClone(proof))).toBe(true);
  });

  it('accepts only the exact publication_status/noindex publication flip', () => {
    const published = Buffer.from(
      reviewed
        .toString('utf8')
        .replace('publication_status: draft', 'publication_status: published')
        .replace('noindex: true', 'noindex: false'),
      'utf8',
    );
    const proof = analyzeControlledPublicationTransition(published, entry);
    expect(proof.authorized).toBe(true);
    expect(proof.state).toBe('controlled_publication_transition');
    expect(proof.normalized_body_sha256).toBe(entry.article_sha256);
    expect(proof.changes).toEqual([
      { field: 'publication_status', from: 'draft', to: 'published' },
      { field: 'noindex', from: true, to: false },
    ]);
  });

  it('fails closed on any additional body mutation', () => {
    const tampered = Buffer.from(
      reviewed
        .toString('utf8')
        .replace('publication_status: draft', 'publication_status: published')
        .replace('noindex: true', 'noindex: false')
        .replace('Reviewed body.', 'Changed body.'),
      'utf8',
    );
    const proof = analyzeControlledPublicationTransition(tampered, entry);
    expect(proof.authorized).toBe(false);
    expect(proof.reason).toBe('normalized_bytes_do_not_match_reviewed_hash');
  });

  it('fails closed when the row lacks exact-admission authority', () => {
    const published = Buffer.from(
      reviewed
        .toString('utf8')
        .replace('publication_status: draft', 'publication_status: published')
        .replace('noindex: true', 'noindex: false'),
      'utf8',
    );
    const proof = analyzeControlledPublicationTransition(published, {
      ...entry,
      admission_status: 'unadmitted',
    });
    expect(proof.authorized).toBe(false);
    expect(proof.reason).toBe('current_bytes_do_not_match_reviewed_hash');
  });

  it('detects a stale or altered serialized proof', () => {
    const proof = analyzeControlledPublicationTransition(reviewed, entry);
    expect(transitionProofMatches({ ...proof, current_body_sha256: '0'.repeat(64) }, proof)).toBe(
      false,
    );
  });
});
