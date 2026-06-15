/**
 * Per-page BreadcrumbList factory. Per SEO plan §2.2.
 */
import type { BreadcrumbList, ListItem } from 'schema-dts';
import { SITE } from '../lib/site';

export type Crumb = { name: string; path: string };

export function breadcrumbList(items: Crumb[]): BreadcrumbList {
  const itemListElement: ListItem[] = items.map((item, idx) => ({
    '@type': 'ListItem',
    position: idx + 1,
    name: item.name,
    item: item.path === '/' ? `${SITE.url}/` : `${SITE.url}${item.path}`,
  }));
  return {
    '@type': 'BreadcrumbList',
    itemListElement,
  };
}
