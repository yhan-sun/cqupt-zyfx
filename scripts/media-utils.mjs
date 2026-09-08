import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '..');

export const sleep = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));

export const sha256 = value => createHash('sha256').update(value).digest('hex');

export async function readJson(filename) {
  return JSON.parse(await readFile(path.join(root, filename), 'utf8'));
}

export async function writeJson(filename, value) {
  await writeFile(path.join(root, filename), JSON.stringify(value, null, 2) + '\n');
}

export async function ensureDirectory(directory) {
  await mkdir(directory, { recursive: true });
}

function downloadError(message, { retryable = false, retryAfter = '' } = {}) {
  const error = new Error(message);
  error.retryable = retryable;
  error.retryAfter = retryAfter;
  return error;
}

async function readResponseBody(response, maxBytes, url) {
  const contentLength = Number(response.headers.get('content-length'));
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    throw downloadError(`Response is larger than ${maxBytes} bytes: ${url}`);
  }

  if (!response.body) {
    const buffer = Buffer.from(await response.arrayBuffer());
    if (buffer.length > maxBytes) throw downloadError(`Response is larger than ${maxBytes} bytes: ${url}`);
    return buffer;
  }

  const reader = response.body.getReader();
  const chunks = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw downloadError(`Response is larger than ${maxBytes} bytes: ${url}`);
      }
      chunks.push(Buffer.from(value));
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks, total);
}

export async function downloadBytes(url, { headers = {}, maxBytes, timeoutMs = 25_000 } = {}) {
  try {
    const response = await fetch(url, {
      headers,
      signal: AbortSignal.timeout(timeoutMs)
    });
    if (!response.ok) {
      throw downloadError(`HTTP ${response.status} while downloading ${url}`, {
        retryable: response.status === 408 || response.status === 425 || response.status === 429 || response.status >= 500,
        retryAfter: response.headers.get('retry-after') || ''
      });
    }
    const body = await readResponseBody(response, maxBytes, url);
    if (body.length < 1) throw downloadError(`Empty response while downloading ${url}`);
    return body;
  } catch (error) {
    if (typeof error.retryable !== 'boolean') error.retryable = true;
    throw error;
  }
}

export async function retry(operation, { attempts, shouldRetry = () => true, onRetry = async () => {} } = {}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation(attempt);
    } catch (error) {
      if (attempt === attempts - 1 || !shouldRetry(error, attempt)) throw error;
      await onRetry(error, attempt);
    }
  }
  throw new Error('Retry operation did not return a result');
}

export function parseRetryAfter(value) {
  if (!value) return null;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds);
  const date = Date.parse(value);
  if (Number.isNaN(date)) return null;
  return Math.max(0, (date - Date.now()) / 1000);
}

export function retryAfterSeconds(error, attempt, fallbackSeconds) {
  const requested = parseRetryAfter(error.retryAfter);
  const seconds = Math.max(fallbackSeconds * (2 ** attempt), requested ?? 0);
  if (seconds > 240) throw new Error('Source asks for a longer cooldown; retry the build later.', { cause: error });
  return seconds;
}
