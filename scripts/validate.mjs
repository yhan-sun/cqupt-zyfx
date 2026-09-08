import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function validateDirectory(directory) {
  const files = new Map();
  const walk = async folder => {
    for (const entry of await readdir(folder, { withFileTypes: true })) {
      const full = path.join(folder, entry.name);
      if (entry.isDirectory()) await walk(full);
      else if (entry.name.endsWith('.html')) files.set(path.relative(directory, full), await readFile(full, 'utf8'));
    }
  };
  await walk(directory);
  const errors = [];
  let links = 0;
  for (const [filename, html] of files) {
    if ((html.match(/<h1(?:\s|>)/g) || []).length !== 1) errors.push(`${filename}: requires one h1`);
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    if (new Set(ids).size !== ids.length) errors.push(`${filename}: duplicate ids`);
    if (/<img[^>]+src="https?:/i.test(html)) errors.push(`${filename}: remote image`);
    for (const [, raw] of html.replace(/<base\b[^>]*>/g, '').matchAll(/\b(?:href|src|data-motion|data-still|data-source)="([^"]+)"/g)) {
      const href = raw.replaceAll('&amp;', '&');
      if (/^(https?:|mailto:|data:)/.test(href)) continue;
      links++;
      const url = new URL(href, `https://test.invalid/${filename}`);
      let target = decodeURIComponent(url.pathname).slice(1);
      if (!target || target.endsWith('/')) target += 'index.html';
      try {
        const info = await stat(path.join(directory, target));
        if (!info.isFile()) throw new Error('not a file');
        if (url.hash && files.has(target) && !files.get(target).includes(`id="${decodeURIComponent(url.hash.slice(1))}"`)) errors.push(`${filename}: missing anchor ${href}`);
      } catch {
        errors.push(`${filename}: missing resource ${href}`);
      }
    }
    for (const [, value] of html.matchAll(/\bsrcset="([^"]+)"/g)) {
      for (const candidate of value.split(', ')) {
        const href = candidate.trim().split(/\s+/)[0];
        const target = new URL(href, `https://test.invalid/${filename}`).pathname.slice(1);
        try { await stat(path.join(directory, target)); } catch { errors.push(`${filename}: missing srcset ${href}`); }
      }
    }
  }
  if (errors.length) throw new Error(errors.join('\n'));
  return { pages: files.size, links };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await validateDirectory(path.resolve(process.argv[2] || 'dist'));
  console.log(`Validated ${result.pages} pages and ${result.links} local links/resources.`);
}
