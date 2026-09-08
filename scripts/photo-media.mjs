import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import { createModel } from './model.mjs';
import { root, sha256 } from './media-utils.mjs';

export async function buildPhotoMedia() {
  const output = path.join(root, 'dist/media/photos');
  await mkdir(output, { recursive: true });
  const result = [];
  for (const photo of createModel().photos) {
    const sourcePath = path.join(root, photo.kind === 'member' ? photo.src : `dist/${photo.src}`);
    const raw = await readFile(sourcePath);
    if (photo.kind === 'member' && sha256(raw) !== photo.sha256) throw new Error(`Member image changed: ${photo.id}`);
    const metadata = await sharp(raw, { limitInputPixels: 35_000_000 }).metadata();
    if (photo.kind === 'member' && (metadata.width !== photo.width || metadata.height !== photo.height)) {
      throw new Error(`Member image dimensions changed: ${photo.id}`);
    }
    const widths = [...new Set([480, 960, 1600].map(width => Math.min(width, metadata.width)))];
    const variants = [];
    for (const width of widths) {
      const { data, info } = await sharp(raw, { limitInputPixels: 35_000_000 })
        .rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 79, effort: 5 })
        .toBuffer({ resolveWithObject: true });
      const filename = `${photo.id}-${width}.webp`;
      await writeFile(path.join(output, filename), data);
      variants.push({ src: `media/photos/${filename}`, width: info.width, height: info.height, bytes: data.length });
    }
    const full = variants.at(-1);
    result.push({ id: photo.id, src: full.src, width: full.width, height: full.height, variants });
  }
  await writeFile(path.join(output, 'manifest.json'), JSON.stringify(result, null, 2) + '\n');
  return result;
}
