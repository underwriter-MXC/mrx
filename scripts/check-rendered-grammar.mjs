import { access, readFile, readdir } from 'node:fs/promises';
import { extname, join, relative } from 'node:path';
import { Worker } from 'node:worker_threads';

const reportAll = process.argv.includes('--report-all');
// Smaller chunks keep native lint calls responsive for the growing rendered
// corpus while preserving the same prose extraction and finding rules.
const MAX_GRAMMAR_CHUNK_CHARS = 25_000;
const vercelRoot = new URL('../dist/client/', import.meta.url);
const genericRoot = new URL('../dist/', import.meta.url);
let root = genericRoot;

try {
  await access(vercelRoot);
  root = vercelRoot;
} catch {
  await access(genericRoot);
}

const ignoredKinds = new Set([
  'Capitalization',
  'Formatting',
  'Miscellaneous',
  'Punctuation',
  'Readability',
  'Redundancy',
  'Regionalism',
  'Repetition',
  'Spelling',
  'Style',
  'Typo',
  'WordChoice',
]);

function decodeHtml(value) {
  const named = {
    amp: '&',
    apos: "'",
    gt: '>',
    lt: '<',
    nbsp: ' ',
    quot: '"',
  };

  return value.replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    if (code.startsWith('#x')) return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    if (code.startsWith('#')) return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    return named[code.toLowerCase()] ?? entity;
  });
}

function visibleProse(html) {
  const withoutHiddenContent = html
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(script|style|noscript|svg|template)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ');
  const prose = [];
  const proseElement = /<(p|li|figcaption)\b[^>]*>([\s\S]*?)<\/\1>/gi;

  for (const match of withoutHiddenContent.matchAll(proseElement)) {
    const text = decodeHtml(match[2].replace(/<br\b[^>]*>/gi, ' ').replace(/<[^>]+>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();
    if (text) prose.push(text);
  }

  return prose;
}

async function htmlFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await htmlFiles(path)));
    else if (extname(entry.name) === '.html') files.push(path);
  }
  return files;
}

const findings = [];
const reviewedFalsePositives = [
  {
    kind: 'Agreement',
    problem: 'is',
    context: 'the single most important thing we can tell you is this:',
  },
  {
    kind: 'Usage',
    problem: 'do to',
    context: 'what you can do to mitigate risks',
  },
  {
    kind: 'Usage',
    problem: 'Damages',
    context: 'Damages: Compensation for any losses',
  },
  {
    kind: 'Grammar',
    problem: 'will specifies',
    context: 'deceased’s will specifies different beneficiaries',
  },
  {
    kind: 'Agreement',
    problem: 'a dealbreaker',
    context: 'Any such clause should be a dealbreaker.',
  },
  {
    kind: 'Grammar',
    problem: ' ',
    context: 'Report Summary Status',
  },
];

function isReviewedFalsePositive(finding) {
  return reviewedFalsePositives.some(
    (reviewed) =>
      finding.kind === reviewed.kind &&
      finding.problem === reviewed.problem &&
      finding.context.includes(reviewed.context),
  );
}
const uniqueProse = new Map();

for (const path of await htmlFiles(root.pathname)) {
  const file = relative(root.pathname, path);
  if (file.startsWith('assets/')) continue;
  for (const text of visibleProse(await readFile(path, 'utf8'))) {
    const existing = uniqueProse.get(text);
    if (existing) existing.files.add(file);
    else uniqueProse.set(text, { text, files: new Set([file]) });
  }
}

const chunks = [];
let currentChunk = { text: '', segments: [] };

for (const segment of uniqueProse.values()) {
  const separator = /[.!?]["')\]]?$/.test(segment.text)
    ? '\n\nGrammar boundary.\n\n'
    : '.\n\nGrammar boundary.\n\n';
  if (currentChunk.text.length + segment.text.length + separator.length > MAX_GRAMMAR_CHUNK_CHARS) {
    chunks.push(currentChunk);
    currentChunk = { text: '', segments: [] };
  }
  const start = currentChunk.text.length;
  currentChunk.text += segment.text;
  const end = currentChunk.text.length;
  currentChunk.segments.push({ ...segment, start, end });
  currentChunk.text += separator;
}
if (currentChunk.text) chunks.push(currentChunk);

function lintChunkBatch(chunksForWorker) {
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./lint-rendered-grammar-worker.mjs', import.meta.url), {
      workerData: { chunks: chunksForWorker },
    });
    worker.once('message', (message) => {
      if (message.error) reject(new Error(message.error));
      else resolve(message.findings);
    });
    worker.once('error', reject);
    worker.once('exit', (code) => {
      if (code !== 0) reject(new Error(`Grammar worker exited with code ${code}.`));
    });
  });
}

const workerCount = Math.min(6, chunks.length);
const workerBatches = Array.from({ length: workerCount }, () => []);
for (const [index, chunk] of chunks.entries()) {
  workerBatches[index % workerCount].push({ index, text: chunk.text });
}

console.log(`Grammar check: linting ${chunks.length} chunks across ${workerCount} workers.`);
const lintResults = (await Promise.all(workerBatches.map(lintChunkBatch)))
  .flat()
  .sort((left, right) => left.chunkIndex - right.chunkIndex || left.span.start - right.span.start);

for (const lint of lintResults) {
  const kind = lint.kind;
  if (!reportAll && ignoredKinds.has(kind)) continue;
  const chunk = chunks[lint.chunkIndex];
  const segment = chunk.segments.find(
    (candidate) => lint.span.start >= candidate.start && lint.span.end <= candidate.end,
  );
  if (!segment) continue;
  const finding = {
    file: [...segment.files][0],
    duplicateCount: segment.files.size - 1,
    kind,
    message: lint.message,
    problem: chunk.text.slice(lint.span.start, lint.span.end),
    suggestions: lint.suggestions,
    context: segment.text,
  };
  if (!reportAll && isReviewedFalsePositive(finding)) continue;
  findings.push(finding);
}

if (findings.length) {
  console.error(`MRX rendered grammar check found ${findings.length} issue(s):`);
  for (const finding of findings) {
    const replacement = finding.suggestions.length
      ? ` Suggested: ${finding.suggestions.join(' | ')}`
      : '';
    const duplicates = finding.duplicateCount
      ? ` (also on ${finding.duplicateCount} rendered page(s))`
      : '';
    console.error(
      `- ${finding.file}${duplicates}: [${finding.kind}] "${finding.problem}" ${finding.message}${replacement}\n  ${finding.context}`,
    );
  }
  process.exit(1);
}

console.log('MRX rendered grammar check passed.');
