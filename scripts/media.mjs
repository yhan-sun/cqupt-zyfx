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
  sleep,
  writeJson
} from './media-utils.mjs';

const MAX_BYTES = 15_000_000;
const MAX_PIXELS = 35_000_000;

function imageInput(raw) {
  return sharp(raw, { limitInputPixels: MAX_PIXELS });
}

async function decodeImage(raw) {
  const image = imageInput(raw);
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height) throw new Error('Image has no usable dimensions');
  if (metadata.width * metadata.height > MAX_PIXELS) throw new Error('Image exceeds the pixel limit');
  await image.ensureAlpha().raw().toBuffer();
  return metadata;
}

async function getSource(item, offline) {
  const cache = path.join(root, '.cache');
  const identity = sha256(item.url).slice(0, 16);
  const cached = path.join(cache, `${item.id}-${identity}.source`);
  const legacy = path.join(cache, `${item.id}.source`);
  await ensureDirectory(cache);

  if (await fileExists(cached)) return readFile(cached);
  if (offline && await fileExists(legacy)) return readFile(legacy);
  if (offline) throw new Error(`Offline source missing: ${item.id}`);

  const raw = await retry(
    async () => {
      const candidate = await downloadBytes(item.url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (CQUPT-Running-Website; public source attribution in sources.html)' },
        maxBytes: MAX_BYTES,
        timeoutMs: 25_000
      });
      if (candidate.length < 100) throw new Error(`Invalid image size: ${item.id}`);
      await decodeImage(candidate);
      return candidate;
    },
    {
      attempts: 3,
      shouldRetry: error => error.retryable === true,
      onRetry: (_error, attempt) => sleep((1 + attempt) * 1000)
    }
  );
  await writeFile(cached, raw);
  return raw;
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

async function renderImage(item, raw, output) {
  const pipeline = imageInput(raw).rotate();
  let result;
  if (item.format === 'png') {
    result = await pipeline.ensureAlpha().png({ compressionLevel: 9 }).toBuffer({ resolveWithObject: true });
    await writeFile(path.join(output, `${item.id}.png`), result.data);
  } else {
    result = await pipeline
      .removeAlpha()
      .resize({ width: 1920, height: 1440, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 84, effort: 6 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path.join(output, `${item.id}.webp`), result.data);
  }

  const metadata = { ...item, width: result.info.width, height: result.info.height };
  if (item.format === 'webp' && result.info.width > 700) {
    const smaller = await imageInput(raw)
      .rotate()
      .removeAlpha()
      .resize({ width: 640, height: 640, fit: 'inside', withoutEnlargement: true, kernel: sharp.kernel.lanczos3 })
      .webp({ quality: 81, effort: 6 })
      .toBuffer({ resolveWithObject: true });
    await writeFile(path.join(output, `${item.id}-small.webp`), smaller.data);
    metadata.smallWidth = smaller.info.width;
  }
  return metadata;
}

function integrityError(message) {
  const error = new Error(message);
  error.retryable = false;
  return error;
}

async function downloadPinned(url, expected, itemId) {
  return retry(
    async () => {
      const raw = await downloadBytes(url, {
        headers: { 'User-Agent': 'CQUPT-Running-Website/verified-release-fallback' },
        maxBytes: MAX_BYTES,
        timeoutMs: 20_000
      });
      if (sha256(raw) !== expected.sha256) throw integrityError(`Pinned fallback hash mismatch: ${itemId}/${expected.file}`);
      const metadata = await decodeImage(raw);
      if (metadata.width !== expected.width || metadata.height !== expected.height) {
        throw integrityError(`Pinned fallback dimensions mismatch: ${itemId}/${expected.file}`);
      }
      return raw;
    },
    {
      attempts: 3,
      shouldRetry: error => error.retryable === true,
      onRetry: (_error, attempt) => sleep((1 + attempt) * 1000)
    }
  );
}

async function usePublishedFallback(item, fallbackConfig, output, sourceError) {
  const expected = fallbackConfig.items[item.id];
  if (!expected || sourceError.retryable !== true) throw sourceError;
  const baseUrl = fallbackConfig.baseUrl;
  const mainRaw = await downloadPinned(new URL(expected.file, baseUrl).href, expected, item.id);
  await writeFile(path.join(output, expected.file), mainRaw);
  const metadata = { ...item, width: expected.width, height: expected.height };
  if (expected.small) {
    const smallRaw = await downloadPinned(new URL(expected.small.file, baseUrl).href, expected.small, item.id);
    await writeFile(path.join(output, expected.small.file), smallRaw);
    metadata.smallWidth = expected.small.width;
  }
  console.warn(`Media ${item.id}: origin unavailable, reused hash-pinned derivative from deployed commit ${fallbackConfig.sourceCommit}`);
  return metadata;
}

export async function buildMedia({ offline = false } = {}) {
  const items = await readJson('data/media.json');
  const fallbackConfig = await readJson('data/media-fallback.json');
  const output = path.join(root, 'dist', 'media');
  await ensureDirectory(output);
  const processed = [];

  for (const item of items) {
    let metadata;
    try {
      const raw = await getSource(item, offline);
      await decodeImage(raw);
      metadata = await renderImage(item, raw, output);
    } catch (error) {
      if (offline) throw error;
      metadata = await usePublishedFallback(item, fallbackConfig, output, error);
    }
    processed.push(metadata);
    console.log(`Media ${item.id}: ${metadata.width}x${metadata.height}`);
  }
  await writeJson('dist/media/credits.json', processed);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await buildMedia({ offline: process.argv.includes('--offline') });
}
