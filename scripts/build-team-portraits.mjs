import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = new URL('../public/assets/team/', import.meta.url).pathname;
const teamSheet = '/Users/darylhill/Downloads/mrx team headshots 2.jpg';
const charlieSheet = '/Users/darylhill/Downloads/Charlie MRX Team Geologist.jpg';

const portraits = [
  ['tommy', teamSheet, { left: 8, top: 34, width: 300, height: 300 }],
  ['cooper', teamSheet, { left: 321, top: 34, width: 300, height: 300 }],
  ['dale', teamSheet, { left: 633, top: 34, width: 300, height: 300 }],
  ['rebecca', teamSheet, { left: 945, top: 34, width: 300, height: 300 }],
  ['walt', teamSheet, { left: 8, top: 502, width: 300, height: 300 }],
  ['monty', teamSheet, { left: 321, top: 502, width: 300, height: 300 }],
  ['cami', teamSheet, { left: 633, top: 502, width: 300, height: 300 }],
  ['ariana', teamSheet, { left: 945, top: 502, width: 300, height: 300 }],
  ['angela', teamSheet, { left: 8, top: 950, width: 300, height: 300 }],
  ['ainsley', teamSheet, { left: 321, top: 950, width: 300, height: 300 }],
  ['charlie', charlieSheet, { left: 10, top: 60, width: 340, height: 340 }],
];

await mkdir(output, { recursive: true });
for (const [name, source, crop] of portraits) {
  for (const size of [128, 256, 512]) {
    const image = sharp(source).extract(crop).resize(size, size, { fit: 'cover', position: 'attention' });
    await Promise.all([
      image.clone().webp({ quality: 84 }).toFile(join(output, `${name}-${size}.webp`)),
      image.clone().avif({ quality: 56 }).toFile(join(output, `${name}-${size}.avif`)),
      image.clone().jpeg({ quality: 86, progressive: true }).toFile(join(output, `${name}-${size}.jpg`)),
    ]);
  }
}

console.log(`Created ${portraits.length * 9} responsive portrait assets in ${output}`);
