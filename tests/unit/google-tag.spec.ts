import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layout = readFileSync(new URL('../../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');

describe('Google tag integration', () => {
  it('fails on with the verified production Google tag ID', () => {
    expect(layout).toContain("'GT-WFMD2MXW'");
    expect(layout).toContain('import.meta.env.PUBLIC_GOOGLE_TAG_ID');
    expect(layout).toContain('import.meta.env.PUBLIC_GTM_ID');
  });

  it('loads gtag.js and initializes the configured tag', () => {
    expect(layout).toContain('https://www.googletagmanager.com/gtag/js?id=${googleTagId}');
    expect(layout).toContain("window.gtag('js', new Date())");
    expect(layout).toContain("window.gtag('config', googleTagId)");
    expect(layout).not.toContain('https://www.googletagmanager.com/gtm.js?id=');
  });

  it('hydrates the sitewide assistant after critical content can paint', () => {
    expect(layout).toContain('<AskTommy');
    expect(layout).toContain('client:idle');
    expect(layout).not.toContain('client:load');
  });

  it('uses a query-free page_location for every sitewide analytics event', () => {
    expect(layout).toContain('function __mrxSafePageLocation()');
    expect(layout).toContain('var pageLocation = __mrxSafePageLocation();');
    expect(layout).not.toContain('var pageLocation = articleCtx ? __mrxSafePageLocation() : window.location.href;');
  });
});
