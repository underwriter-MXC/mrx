import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { spawnSync } from 'node:child_process';
import sharp from 'sharp';

const image = process.env.MRX_DOCUMENT_WORKER_IMAGE || 'mrx-document-worker:validation';
const token = randomUUID();
const callbackSecret = randomUUID();
const container = `mrx-document-worker-${randomUUID().slice(0, 8)}`;
const callbacks = new Map();
const acceptancePdf = process.env.MRX_DOCUMENT_ACCEPTANCE_PDF
  ? readFileSync(process.env.MRX_DOCUMENT_ACCEPTANCE_PDF)
  : null;

function textPdf(lines) {
  const escapedLines = lines.map((line) =>
    line.replaceAll('\\', '\\\\').replaceAll('(', '\\(').replaceAll(')', '\\)'),
  );
  const stream = `BT /F1 18 Tf 72 720 Td ${escapedLines
    .map((line, index) => `${index ? '0 -28 Td ' : ''}(${line}) Tj`)
    .join(' ')} ET`;
  const objects = [
    '<</Type/Catalog/Pages 2 0 R>>',
    '<</Type/Pages/Kids[3 0 R]/Count 1>>',
    '<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Resources<</Font<</F1 5 0 R>>>>/Contents 4 0 R>>',
    `<< /Length ${Buffer.byteLength(stream, 'ascii')} >>\nstream\n${stream}\nendstream`,
    '<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>',
  ];
  let pdf = '%PDF-1.4\n% MRX digital-text validation\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<</Size ${objects.length + 1}/Root 1 0 R>>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return Buffer.from(pdf, 'ascii');
}

const cleanPng = await sharp(
  Buffer.from(`
    <svg width="1400" height="500" xmlns="http://www.w3.org/2000/svg">
      <rect width="1400" height="500" fill="white"/>
      <text x="60" y="150" font-size="76" font-family="sans-serif" fill="black">MRX ROYALTY CHECK</text>
      <text x="60" y="270" font-size="56" font-family="sans-serif" fill="black">Owner document validation</text>
      <text x="60" y="380" font-size="48" font-family="sans-serif" fill="black">SSN 123-45-6789</text>
    </svg>
  `),
)
  .png()
  .toBuffer();
const digitalPdf = textPdf([
  'MRX DIGITAL TEXT LAYER ROYALTY STATEMENT',
  'Dawson County, Texas',
  'Net revenue 873.21',
]);

const eicar = Buffer.from('X5O!P%@AP[4\\PZX54(P^)7CC)7}$EICAR-STANDARD-ANTIVIRUS-TEST-FILE!$H+H*');

function validCallback(req, raw) {
  const timestamp = String(req.headers['x-mrx-timestamp'] || '');
  const nonce = String(req.headers['x-mrx-nonce'] || '');
  const supplied = String(req.headers['x-mrx-signature'] || '');
  const expected = createHmac('sha256', callbackSecret)
    .update(`${timestamp}.${nonce}.`)
    .update(raw)
    .digest('hex');
  return (
    supplied.length === expected.length &&
    timingSafeEqual(Buffer.from(supplied), Buffer.from(expected))
  );
}

const server = createServer((req, res) => {
  if (req.url === '/clean.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': cleanPng.length });
    res.end(cleanPng);
    return;
  }
  if (req.url === '/eicar.png') {
    res.writeHead(200, { 'Content-Type': 'image/png', 'Content-Length': eicar.length });
    res.end(eicar);
    return;
  }
  if (req.url === '/digital.pdf') {
    res.writeHead(200, { 'Content-Type': 'application/pdf', 'Content-Length': digitalPdf.length });
    res.end(digitalPdf);
    return;
  }
  if (req.url === '/acceptance.pdf' && acceptancePdf) {
    res.writeHead(200, {
      'Content-Type': 'application/pdf',
      'Content-Length': acceptancePdf.length,
    });
    res.end(acceptancePdf);
    return;
  }
  if (req.url === '/callback' && req.method === 'POST') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks);
      if (!validCallback(req, raw)) {
        res.writeHead(401).end();
        return;
      }
      const payload = JSON.parse(raw.toString('utf8'));
      callbacks.set(payload.jobId, payload);
      res.writeHead(204).end();
    });
    return;
  }
  res.writeHead(404).end();
});

await new Promise((resolve) => server.listen(0, '0.0.0.0', resolve));
const serverAddress = server.address();
if (!serverAddress || typeof serverAddress === 'string')
  throw new Error('validation_server_failed');
const hostUrl = `http://host.docker.internal:${serverAddress.port}`;

function docker(args, options = {}) {
  return spawnSync('docker', args, { encoding: 'utf8', ...options });
}

async function waitForHealth(port) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${port}/health`);
      if (response.ok) return;
    } catch {
      // The worker may still be starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error('worker_health_timeout');
}

async function waitForCallback(jobId) {
  for (let attempt = 0; attempt < 90; attempt += 1) {
    if (callbacks.has(jobId)) return callbacks.get(jobId);
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`callback_timeout:${jobId}`);
}

try {
  const started = docker([
    'run',
    '--rm',
    '-d',
    '--name',
    container,
    '-p',
    '127.0.0.1::8080',
    '-e',
    `DOCUMENT_WORKER_TOKEN=${token}`,
    '-e',
    `DOCUMENT_WORKER_CALLBACK_SECRET=${callbackSecret}`,
    image,
  ]);
  if (started.status !== 0) throw new Error(started.stderr || 'worker_container_failed');

  const portResult = docker(['port', container, '8080/tcp']);
  const port = Number(portResult.stdout.trim().match(/:(\d+)$/)?.[1]);
  if (!port) throw new Error('worker_port_missing');
  await waitForHealth(port);

  const unauthorized = await fetch(`http://127.0.0.1:${port}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Idempotency-Key': randomUUID() },
    body: JSON.stringify({
      jobId: randomUUID(),
      attachmentId: randomUUID(),
      downloadUrl: `${hostUrl}/clean.png`,
      mimeType: 'image/png',
      originalName: 'clean.png',
      callbackUrl: `${hostUrl}/callback`,
    }),
  });
  if (unauthorized.status !== 401) throw new Error(`unauthorized_status:${unauthorized.status}`);

  const submit = async (path, originalName, mimeType = 'image/png') => {
    const jobId = randomUUID();
    const response = await fetch(`http://127.0.0.1:${port}/jobs`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify({
        jobId,
        attachmentId: randomUUID(),
        downloadUrl: `${hostUrl}/${path}`,
        mimeType,
        originalName,
        callbackUrl: `${hostUrl}/callback`,
      }),
    });
    if (response.status !== 202) throw new Error(`job_status:${response.status}`);
    return jobId;
  };

  const cleanJobId = await submit('clean.png', 'clean.png');
  const malwareJobId = await submit('eicar.png', 'eicar.png');
  const digitalPdfJobId = await submit('digital.pdf', 'digital.pdf', 'application/pdf');
  const acceptanceJobId = acceptancePdf
    ? await submit('acceptance.pdf', 'acceptance.pdf', 'application/pdf')
    : null;
  const [clean, malware, digital, acceptance] = await Promise.all([
    waitForCallback(cleanJobId),
    waitForCallback(malwareJobId),
    waitForCallback(digitalPdfJobId),
    acceptanceJobId ? waitForCallback(acceptanceJobId) : Promise.resolve(null),
  ]);

  if (
    clean.status !== 'ready' ||
    !String(clean.rawText || '')
      .toLowerCase()
      .includes('royalty')
  ) {
    throw new Error(`clean_document_failed:${clean.status}`);
  }
  if (malware.status !== 'rejected' || malware.reason !== 'malware_detected') {
    throw new Error(`malware_detection_failed:${malware.status}:${malware.reason}`);
  }
  if (
    digital.status !== 'ready' ||
    !String(digital.rawText || '')
      .toLowerCase()
      .includes('digital text layer') ||
    !String(digital.rawText || '')
      .toLowerCase()
      .includes('dawson county')
  ) {
    throw new Error(`digital_text_pdf_failed:${digital.status}`);
  }
  if (
    acceptance &&
    (acceptance.status !== 'ready' ||
      !String(acceptance.rawText || '')
        .toLowerCase()
        .includes('laguna resources') ||
      !String(acceptance.rawText || '')
        .toLowerCase()
        .includes('dawson'))
  ) {
    throw new Error(`acceptance_pdf_failed:${acceptance.status}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        health: 'ok',
        unauthorizedRequest: 'rejected',
        cleanDocument: clean.status,
        digitalTextPdf: digital.status,
        suppliedAcceptancePdf: acceptance?.status ?? 'not_requested',
        malwareDocument: malware.reason,
        signedCallbacks: 3 + Number(Boolean(acceptance)),
      },
      null,
      2,
    ),
  );
} finally {
  docker(['rm', '-f', container]);
  await new Promise((resolve) => server.close(resolve));
}
