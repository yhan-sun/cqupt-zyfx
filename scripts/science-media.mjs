import { fileURLToPath } from 'node:url';
import { access, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';
import {
  downloadBytes,
  ensureDirectory,
  readJson,
  retry,
  retryAfterSeconds,
  root,
  sha256,
  sleep,
  writeJson
} from './media-utils.mjs';

const MAX_BYTES = 8_000_000;
const MAX_PIXELS = 12_000_000;

function imageInput(raw, animated = false, pageOptions = {}) {
  return sharp(raw, { animated, limitInputPixels: MAX_PIXELS, ...pageOptions });
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

async function validateAndRender(item, raw, output) {
  const animated = item.frames > 1;
  const image = imageInput(raw, animated);
  const metadata = await image.metadata();
  const height = metadata.pageHeight ?? metadata.height;
  const frames = metadata.pages ?? 1;
  if (metadata.width !== item.width || height !== item.height || frames !== item.frames) {
    throw new Error(`Unexpected dimensions or frame count: ${item.id}`);
  }

  if (animated) {
    for (let frame = 0; frame < item.frames; frame += 1) {
      await imageInput(raw, true, { page: frame, pages: 1 })
        .ensureAlpha()
        .raw()
        .toBuffer();
    }
  } else {
    await imageInput(raw).raw().toBuffer();
  }

  const poster = await imageInput(raw, animated, animated ? { page: item.posterFrame, pages: 1 } : {})
    .flatten({ background: { r: 255, g: 255, b: 255 } })
    .webp({ quality: 90, effort: 6 })
    .toBuffer();
  await writeFile(path.join(output, `${item.id}.webp`), poster);
  if (animated) await writeFile(path.join(output, `${item.id}.gif`), raw);
}

async function getSource(item, offline) {
  const cache = path.join(root, '.cache', 'science');
  const cached = path.join(cache, item.filename);
  await ensureDirectory(cache);

  if (await fileExists(cached)) return readFile(cached);
  if (offline) throw new Error(`Missing offline movement: ${item.id}`);

  return retry(
    async () => {
      await sleep(1_500);
      const raw = await downloadBytes(item.url, {
        headers: { 'User-Agent': 'CQUPT-Running-Education/1.0 (https://github.com/yhan-sun/cqupt-zyfx)' },
        maxBytes: MAX_BYTES,
        timeoutMs: 25_000
      });
      if (raw.length < 100) throw new Error(`Invalid media size: ${item.id}`);
      if (sha256(raw) !== item.sha256) throw new Error(`Source changed; review required: ${item.id}`);
      await writeFile(cached, raw);
      return raw;
    },
    {
      attempts: 4,
      shouldRetry: error => error.retryable === true,
      onRetry: async (error, attempt) => {
        const seconds = retryAfterSeconds(error, attempt, 30);
        console.log(`Source cooldown: ${item.id} ${seconds} seconds`);
        await sleep(seconds * 1000);
      }
    }
  );
}

export async function buildScienceMedia({ offline = false } = {}) {
  const items = await readJson('data/science-media.json');
  const output = path.join(root, 'dist', 'media', 'science');
  await ensureDirectory(output);

  for (const item of items) {
    const raw = await getSource(item, offline);
    if (sha256(raw) !== item.sha256) throw new Error(`Invalid cached source: ${item.id}`);
    await validateAndRender(item, raw, output);
    console.log(`Movement ${item.id} ${item.frames} frames, SHA-256 verified`);
  }
  await writeJson('dist/media/science/credits.json', items);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildScienceMedia({ offline: process.argv.includes('--offline') });
}
