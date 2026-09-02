export const LEGACY_STAFF_SLUGS = {
  tommy: 'travis',
  cooper: 'connor',
  charlie: 'clay',
  dale: 'owen',
  rebecca: 'laurel',
  angela: 'elena',
  walt: 'wade',
  monty: 'graham',
  cami: 'cora',
  ariana: 'marisol',
  ainsley: 'paige',
} as const;

export function canonicalStaffSlug(slug: string | null | undefined): string {
  if (!slug) return '';
  return LEGACY_STAFF_SLUGS[slug as keyof typeof LEGACY_STAFF_SLUGS] ?? slug;
}

const LEGACY_STAFF_NAMES: Array<[string, string]> = [
  ['Tommy', 'Travis'],
  ['Cooper', 'Connor'],
  ['Charlie', 'Clay'],
  ['Dale', 'Owen'],
  ['Rebecca', 'Laurel'],
  ['Angela', 'Elena'],
  ['Walt', 'Wade'],
  ['Monty', 'Graham'],
  ['Cami', 'Cora'],
  ['Ariana', 'Marisol'],
  ['Ainsley', 'Paige'],
];

export function canonicalizeStaffNames(value: string): string {
  return LEGACY_STAFF_NAMES.reduce((result, [legacy, current]) => {
    return result
      .replaceAll(legacy, current)
      .replaceAll(legacy.toLowerCase(), current.toLowerCase())
      .replaceAll(legacy.toUpperCase(), current.toUpperCase());
  }, value);
}
