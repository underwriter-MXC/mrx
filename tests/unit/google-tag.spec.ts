import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const layout = readFileSync(new URL('../../src/layouts/BaseLayout.astro', import.meta.url), 'utf8');
const aiFirstHome = readFileSync(
  new URL('../../src/components/organisms/AiFirstHome.astro', import.meta.url),
  'utf8',
);

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

  it('sends custom events through gtag.js while preserving the diagnostic dataLayer object', () => {
    expect(layout).toContain('window.dataLayer.push(enriched)');
    expect(layout).toContain("window.gtag('event', payload.event, ga4Params)");
    expect(layout).toContain("if (key !== 'event'");
  });

  it('hydrates the sitewide assistant after critical content can paint', () => {
    expect(layout).toContain('<AskTravis');
    expect(layout).toContain('client:idle');
    expect(layout).not.toContain('client:load');
  });

  it('uses a query-free page_location for every sitewide analytics event', () => {
    expect(layout).toContain('function __mrxSafePageLocation()');
    expect(layout).toContain('var pageLocation = __mrxSafePageLocation();');
    expect(layout).not.toContain(
      'var pageLocation = articleCtx ? __mrxSafePageLocation() : window.location.href;',
    );
  });

  it('never sends owner-entered assistant text to analytics', () => {
    expect(aiFirstHome).not.toContain('mrx_ai_prompt');
    expect(aiFirstHome).toContain("prompt_source: clean ? promptSource : 'empty'");
    expect(aiFirstHome).toContain("replyFor(input?.value || '', 'custom')");
  });
});
