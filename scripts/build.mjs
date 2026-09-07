import { cp, mkdir, readFile, writeFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const offline = process.argv.includes('--offline');
const origin = 'https://yhan-sun.github.io/cqupt-zyfx/';
const media = JSON.parse(await readFile(path.join(root, 'data/media.json'), 'utf8'));

async function download(item) {
  const cached = path.join(root, '.cache', item.filename);
  try {
    if ((await stat(cached)).size > 1000) return await readFile(cached);
  } catch {}
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const response = await fetch(item.url, {
        signal: AbortSignal.timeout(30000),
        headers: { 'User-Agent': 'CQUPT-Running-Website/1.0 (https://github.com/yhan-sun/cqupt-zyfx)' }
      });
      if (!response.ok) throw new Error(`HTTP ${response.status} for ${item.id}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes.length < 1000 || bytes.length > 12000000 || bytes[0] !== 0xff || bytes[1] !== 0xd8) throw new Error(`Invalid JPEG: ${item.id}`);
      await mkdir(path.dirname(cached), { recursive: true });
      await writeFile(cached, bytes);
      return bytes;
    } catch (error) {
      lastError = error;
      if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 1500 * (attempt + 1)));
    }
  }
  throw lastError;
}

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const name of ['index.html', 'sources.html', '404.html', 'assets', 'data']) {
  await cp(path.join(root, name), path.join(dist, name), { recursive: true });
}
if (!offline) {
  await mkdir(path.join(dist, 'media'), { recursive: true });
  let html = await readFile(path.join(dist, 'index.html'), 'utf8');
  for (const item of media) {
    await writeFile(path.join(dist, 'media', item.filename), await download(item));
    const pattern = new RegExp(`(<img\\b[^>]*data-media="${item.id}"[^>]*\\bsrc=")[^"]*(")`, 'g');
    html = html.replace(pattern, `$1media/${item.filename}$2`);
  }
  html = html.replace(/\s*<link rel="preconnect"[^>]*>/g, '');
  await writeFile(path.join(dist, 'index.html'), html);
}
for (const file of ['index.html', 'sources.html']) {
  const filePath = path.join(dist, file);
  const url = file === 'index.html' ? origin : origin + file;
  let html = await readFile(filePath, 'utf8');
  html = html.replace('</head>', `<link rel="canonical" href="${url}">\n<meta property="og:url" content="${url}">\n</head>`);
  await writeFile(filePath, html);
}
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}sitemap.xml\n`);
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${origin}</loc></url><url><loc>${origin}sources.html</loc></url></urlset>\n`);
console.log(`Built ${dist}${offline ? ' (offline: original remote media URLs retained)' : ' with same-origin photography'}`);
