import { fileURLToPath } from 'node:url';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  downloadBytes,
  ensureDirectory,
  readJson,
  retry,
  root,
  sha256,
  writeJson
} from './media-utils.mjs';

const MAX_BYTES = 5_000_000;
const MAX_PIXELS = 16_000_000;

function imageInput(raw) {
  return sharp(raw, { limitInputPixels: MAX_PIXELS });
}

async function validateImage(raw, item) {
  const image = imageInput(raw);
  const metadata = await image.metadata();
  if (metadata.width !== item.width || metadata.height !== item.height) {
    throw new Error(`Unexpected dimensions: ${item.id}`);
  }
  await image.removeAlpha().raw().toBuffer();
}

async function fileExists(filename) {
  try {
    await access(filename);
    return true;
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
}

async function getSource(item, offline) {
  const cache = path.join(root, '.cache', 'official');
  const cached = path.join(cache, `${item.id}.source`);
  await ensureDirectory(cache);

  if (await fileExists(cached)) return readFile(cached);
  if (offline) throw new Error(`Missing offline official image: ${item.id}`);

  return retry(
    async () => {
      const raw = await downloadBytes(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0', Referer: 'https://mp.weixin.qq.com/' },
        maxBytes: MAX_BYTES,
        timeoutMs: 30_000
      });
      if (raw.length < 1000) throw new Error(`Unexpected image size: ${item.id}`);
      if (sha256(raw) !== item.sha256) throw new Error(`Official image source changed; review required: ${item.id}`);
      await validateImage(raw, item);
      await writeFile(cached, raw);
      return raw;
    },
    {
      attempts: 3,
      shouldRetry: error => error.retryable === true
    }
  );
}

async function renderImage(item, raw, output) {
  const result = await imageInput(raw)
    .removeAlpha()
    .resize({ width: 1200, height: 1200, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
    .webp({ quality: 82, effort: 6 })
    .toBuffer({ resolveWithObject: true });
  await writeFile(path.join(output, `${item.id}.webp`), result.data);
  return { ...item, builtWidth: result.info.width, builtHeight: result.info.height };
}

export async function buildOfficialMedia({ offline = false } = {}) {
  const items = await readJson('data/official-media.json');
  const output = path.join(root, 'dist', 'media', 'official');
  await ensureDirectory(output);
  const processed = [];

  for (const item of items) {
    const raw = await getSource(item, offline);
    if (sha256(raw) !== item.sha256) throw new Error(`Invalid cached official image: ${item.id}`);
    await validateImage(raw, item);
    processed.push(await renderImage(item, raw, output));
    console.log(`Official image ${item.id} ${item.width} x ${item.height} SHA-256 verified`);
  }
  await writeJson('dist/media/official/credits.json', processed);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildOfficialMedia({ offline: process.argv.includes('--offline') });
}
