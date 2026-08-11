import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';

const rendered = process.argv.includes('--rendered');
const sourceRoot = new URL('../src/', import.meta.url);
const vercelRenderedRoot = new URL('../dist/client/', import.meta.url);
const genericRenderedRoot = new URL('../dist/', import.meta.url);
const projectRoot = new URL('../', import.meta.url);
const generatedPublicFiles = [
  new URL('../public/llms.txt', import.meta.url),
  new URL('../public/llm.txt', import.meta.url),
  new URL('../public/llms-full.txt', import.meta.url),
];
let root = sourceRoot;
if (rendered) {
  try {
    await access(vercelRenderedRoot);
    root = vercelRenderedRoot;
  } catch {
    await access(genericRenderedRoot);
    root = genericRenderedRoot;
  }
}
const allowedExtensions = rendered
  ? new Set(['.html', '.json', '.txt', '.xml'])
  : new Set(['.astro', '.json', '.md', '.mdx', '.ts', '.tsx']);
const failures = [];
const contentExtensions = new Set(['.json', '.md', '.mdx', '.txt']);
const contentQualityRules = [
  { label: 'doubled apostrophe', pattern: /[A-Za-z]''[A-Za-z]/ },
  {
    label: 'incorrect indefinite article',
    pattern: /\b(?:[Aa] (?:assessment|offer|owner|underwriter)|[Aa]n (?:report|review|sale))\b/,
  },
  {
    label: 'repeated word',
    pattern: /\b(not|the|to|and|or|a|an)\s+\1\b/i,
  },
  {
    label: 'generated comparison phrase',
    pattern:
      /\b(?:strong possible|a strong (?:deals|decisions|offers|outcomes|prices|returns|strategies|terms))\b/i,
  },
  {
    label: 'missing sentence spacing',
    pattern: /[a-z][.!?](?:Because|Given|However|If|Now|That|The|Therefore|This|When)\b/,
  },
  { label: 'space before punctuation', pattern: /[A-Za-z0-9)]\s+[,.!?;]/ },
];

function inspectFile(path, displayRoot) {
  return readFile(path, 'utf8').then((contents) => {
    const lines = contents.split(/\r?\n/);
    const extension = extname(path);
    const frontmatterEnd =
      !rendered && ['.md', '.mdx'].includes(extension) && lines[0]?.trim() === '---'
        ? lines.findIndex((line, index) => index > 0 && line.trim() === '---')
        : -1;
    lines.forEach((line, index) => {
      const location = `${relative(displayRoot.pathname, path)}:${index + 1}`;
      if (/[\u2014\u2013]/.test(line)) failures.push(`${location}: long dash`);
      const trimmed = line.trim();
      if (trimmed !== '---' && /(^|\s)---(?=\s|$)/.test(line)) {
        failures.push(`${location}: visible triple-hyphen separator`);
      }
      if (!contentExtensions.has(extension)) return;
      const inYamlFrontmatter = frontmatterEnd > 0 && index < frontmatterEnd;
      for (const rule of contentQualityRules) {
        // A doubled apostrophe inside a single-quoted YAML scalar is the
        // required serialization of one visible apostrophe. Rendered output
        // is checked separately after the build.
        if (inYamlFrontmatter && rule.label === 'doubled apostrophe') continue;
        if (rule.pattern.test(line)) failures.push(`${location}: ${rule.label}`);
      }
    });
  });
}

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await visit(path);
      continue;
    }
    if (!allowedExtensions.has(extname(entry.name))) continue;
    if (!rendered && path.endsWith('/lib/platform/style.ts')) continue;
    await inspectFile(path, root);
  }
}

await visit(root.pathname);
if (!rendered) {
  for (const file of generatedPublicFiles) {
    try {
      await access(file);
      await inspectFile(file.pathname, projectRoot);
    } catch {
      // Generated public indexes are optional before the first content build.
    }
  }
}

if (failures.length) {
  console.error('MRX public copy contains prohibited dash or content-quality patterns:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`MRX ${rendered ? 'rendered' : 'source'} visible-copy check passed.`);
