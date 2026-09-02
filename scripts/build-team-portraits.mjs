import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { join } from 'node:path';

const output = new URL('../public/assets/team/', import.meta.url).pathname;
const teamSheet = '/Users/darylhill/Downloads/mrx team headshots 2.jpg';
const claySheet = '/Users/darylhill/Downloads/Clay MRX Team Geologist.jpg';

const portraits = [
  ['travis', teamSheet, { left: 8, top: 34, width: 300, height: 300 }],
  ['connor', teamSheet, { left: 321, top: 34, width: 300, height: 300 }],
  ['owen', teamSheet, { left: 633, top: 34, width: 300, height: 300 }],
  ['laurel', teamSheet, { left: 945, top: 34, width: 300, height: 300 }],
  ['wade', teamSheet, { left: 8, top: 502, width: 300, height: 300 }],
  ['graham', teamSheet, { left: 321, top: 502, width: 300, height: 300 }],
  ['cora', teamSheet, { left: 633, top: 502, width: 300, height: 300 }],
  ['marisol', teamSheet, { left: 945, top: 502, width: 300, height: 300 }],
  ['elena', teamSheet, { left: 8, top: 950, width: 300, height: 300 }],
  ['paige', teamSheet, { left: 321, top: 950, width: 300, height: 300 }],
  ['clay', claySheet, { left: 10, top: 60, width: 340, height: 340 }],
];

await mkdir(output, { recursive: true });
for (const [name, source, crop] of portraits) {
  for (const size of [128, 256, 512]) {
    const image = sharp(source)
      .extract(crop)
      .resize(size, size, { fit: 'cover', position: 'attention' });
    await Promise.all([
      image
        .clone()
        .webp({ quality: 84 })
        .toFile(join(output, `${name}-${size}.webp`)),
      image
        .clone()
        .avif({ quality: 56 })
        .toFile(join(output, `${name}-${size}.avif`)),
      image
        .clone()
        .jpeg({ quality: 86, progressive: true })
        .toFile(join(output, `${name}-${size}.jpg`)),
    ]);
  }
}

console.log(`Created ${portraits.length * 9} responsive portrait assets in ${output}`);
