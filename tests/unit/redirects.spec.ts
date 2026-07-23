import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const vercel = JSON.parse(readFileSync(new URL('../../vercel.json', import.meta.url), 'utf8'));

describe('canonical owner-situation redirects', () => {
  it('permanently redirects the legacy WordPress date archives to canonical article URLs', () => {
    expect(vercel.redirects).toEqual(
      expect.arrayContaining([
        {
          source: '/2026/06/02/:slug',
          destination: '/blog/:slug/',
          permanent: true,
        },
        {
          source: '/2026/06/02/:slug/',
          destination: '/blog/:slug/',
          permanent: true,
        },
        {
          source: '/2026/06/03/:slug',
          destination: '/blog/:slug/',
          permanent: true,
        },
        {
          source: '/2026/06/03/:slug/',
          destination: '/blog/:slug/',
          permanent: true,
        },
      ]),
    );
  });

  it('permanently redirects the obsolete 1031 route', () => {
    expect(vercel.redirects).toContainEqual({
      source: '/1031-exchanger',
      destination: '/1031-exchange/',
      permanent: true,
    });
    expect(vercel.redirects).toContainEqual({
      source: '/1031-exchanger/',
      destination: '/1031-exchange/',
      permanent: true,
    });
  });

  it('permanently redirects the common Contact Us route', () => {
    expect(vercel.redirects).toContainEqual({
      source: '/contact-us',
      destination: '/contact/',
      permanent: true,
    });
  });
});
