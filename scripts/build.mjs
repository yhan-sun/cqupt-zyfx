import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { renderSite } from './render.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const offline = process.argv.includes('--offline');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
const result = spawnSync(process.env.PYTHON || 'python3', [path.join(root, 'scripts/media.py'), ...(offline ? ['--offline'] : [])], { stdio: 'inherit', cwd: root });
if (result.error) throw result.error;
if (result.status !== 0) throw new Error(`Media processing failed (${result.status})`);
const movementResult = spawnSync(process.env.PYTHON || 'python3', [path.join(root, 'scripts/science-media.py'), ...(offline ? ['--offline'] : [])], { stdio: 'inherit', cwd: root });
if (movementResult.error) throw movementResult.error;
if (movementResult.status !== 0) throw new Error(`Movement processing failed (${movementResult.status})`);
const officialMediaResult = spawnSync(process.env.PYTHON || 'python3', [path.join(root, 'scripts/official-media.py'), ...(offline ? ['--offline'] : [])], { stdio: 'inherit', cwd: root });
if (officialMediaResult.error) throw officialMediaResult.error;
if (officialMediaResult.status !== 0) throw new Error(`Official media processing failed (${officialMediaResult.status})`);
const content = JSON.parse(await readFile(path.join(root, 'data/content.json'), 'utf8'));
const media = JSON.parse(await readFile(path.join(dist, 'media/credits.json'), 'utf8'));
const pages = renderSite(content, media);
for (const [filename, html] of pages) {
  await mkdir(path.dirname(path.join(dist, filename)), { recursive: true });
  await writeFile(path.join(dist, filename), html);
}
await cp(path.join(root, 'assets'), path.join(dist, 'assets'), { recursive: true });
const { buildOfficialArchive } = await import('./official-build.mjs');
const officialPages = await buildOfficialArchive();
const origin = 'https://yhan-sun.github.io/cqupt-zyfx/';
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${origin}sitemap.xml\n`);
const locations = [...pages.keys(), ...officialPages].filter(file => file !== '404.html').map(file => `<url><loc>${origin}${file === 'index.html' ? '' : file}</loc></url>`).join('');
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations}</urlset>\n`);
console.log(`Built ${pages.size + officialPages.length} pages, ${media.length} campus images and a source-verified official club archive${offline ? ' from the offline source cache' : ''}.`);