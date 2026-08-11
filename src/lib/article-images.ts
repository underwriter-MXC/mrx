/** Deterministic filename identity for text rendered into article images. */
export function renderedImageTextSlug(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[’']/g, '')
    .replace(/&/g, ' and ')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function articleImageFilenameStem(src: string): string {
  const withoutQuery = src.split(/[?#]/, 1)[0] ?? '';
  const filename = withoutQuery.split('/').filter(Boolean).at(-1) ?? '';
  try {
    return decodeURIComponent(filename).replace(/\.[^.]+$/, '');
  } catch {
    return filename.replace(/\.[^.]+$/, '');
  }
}

export function articleImageFilenameMatchesText(src: string, renderedText: string): boolean {
  const expected = renderedImageTextSlug(renderedText);
  return Boolean(expected) && articleImageFilenameStem(src) === expected;
}
