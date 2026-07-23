import { readdirSync, readFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

const projectRoot = process.cwd();
const siteSource = readFileSync(join(projectRoot, 'src/lib/site.ts'), 'utf8');
const contactPage = readFileSync(join(projectRoot, 'src/pages/contact.astro'), 'utf8');
const contactRedirect = readFileSync(join(projectRoot, 'src/pages/contact-us.astro'), 'utf8');

function websiteSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const filePath = join(directory, entry.name);
    if (entry.isDirectory()) return websiteSourceFiles(filePath);
    return ['.astro', '.js', '.md', '.mdx', '.ts', '.tsx'].includes(extname(filePath))
      ? [filePath]
      : [];
  });
}

describe('MRX contact surfaces', () => {
  it('uses the underwriter inbox throughout website source', () => {
    const oldAddressFiles = websiteSourceFiles(join(projectRoot, 'src')).filter((file) =>
      readFileSync(file, 'utf8').includes('review@mineralrightsxchange.com'),
    );

    expect(siteSource).toContain("email: 'underwriter@mineralrightsxchange.com'");
    expect(oldAddressFiles).toEqual([]);
  });

  it('publishes Contact Us in the footer navigation', () => {
    expect(siteSource).toContain("{ label: 'Contact Us', href: '/contact/' }");
  });

  it('provides email, chat, phone-scheduling, and privacy-safe contact routes', () => {
    expect(contactPage).toContain('path="/contact/"');
    expect(contactPage).not.toContain('<main');
    expect(contactPage).toContain('mailto:${SITE.email}');
    expect(contactPage).toContain('data-contact-chat');
    expect(contactPage).toContain('href="/book/"');
    expect(contactPage).toContain('Please do not email Social Security numbers');
  });

  it('permanently redirects the common Contact Us slug', () => {
    expect(contactRedirect).toContain('export const prerender = false');
    expect(contactRedirect).toContain("Astro.redirect('/contact/', 301)");
  });
});
