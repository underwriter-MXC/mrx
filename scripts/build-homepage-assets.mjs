import { mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const assetRoot = resolve(projectRoot, 'public/assets/mrx-homepage-v4');
const heroSource = resolve(assetRoot, 'backgrounds/hero-tommy-left-layout.png');
const avatarSource = resolve(assetRoot, 'hermes/tommy-avatar-circle-1200.png');

async function buildHero(width) {
  const base = resolve(assetRoot, `backgrounds/hero-tommy-left-layout-${width}`);
  const pipeline = sharp(heroSource).resize({ width, withoutEnlargement: true });

  await Promise.all([
    pipeline.clone().webp({ quality: 84, smartSubsample: true }).toFile(`${base}.webp`),
    pipeline.clone().avif({ quality: 58, effort: 5 }).toFile(`${base}.avif`),
  ]);
}

async function buildAvatar(width) {
  const output = resolve(assetRoot, `avatars/tommy-hermes-${width}.webp`);
  await sharp(avatarSource)
    .resize({ width, height: width, fit: 'cover' })
    .webp({ quality: 86, smartSubsample: true })
    .toFile(output);
}

await mkdir(resolve(assetRoot, 'avatars'), { recursive: true });
await Promise.all([...[768, 1280, 1536].map(buildHero), ...[128, 256, 512].map(buildAvatar)]);
