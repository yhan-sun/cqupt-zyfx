import { readFile, writeFile, mkdir, rm, cp } from 'node:fs/promises';
import path from 'node:path';
import { renderSite } from './render.mjs';
import { createModel } from './model.mjs';
import { buildMedia } from './media.mjs';
import { buildScienceMedia } from './science-media.mjs';
import { buildOfficialMedia } from './official-media.mjs';
import { buildPhotoMedia } from './photo-media.mjs';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const offline = process.argv.includes('--offline');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await buildMedia({ offline });
await buildScienceMedia({ offline });
await buildOfficialMedia({ offline });
const photoMedia = await buildPhotoMedia();
const media = JSON.parse(await readFile(path.join(dist, 'media/credits.json'), 'utf8'));
const model = createModel({ media, photoMedia });
const pages = renderSite(model);
await mkdir(path.join(dist, 'assets'), { recursive: true });
for (const file of ['site.css', 'editorial.css', 'site.js', 'science.css', 'science.js', 'science-core.mjs', 'mark.svg', 'join-qq.svg']) {
  await cp(path.join(root, 'assets', file), path.join(dist, 'assets', file));
}
for (const [filename, html] of pages) {
  await mkdir(path.dirname(path.join(dist, filename)), { recursive: true });
  await writeFile(path.join(dist, filename), html);
}
await writeFile(path.join(dist, '.nojekyll'), '');
await writeFile(path.join(dist, 'CNAME'), `${new URL(model.site.origin).hostname}\n`);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${model.site.origin}sitemap.xml\n`);
const locations = [...pages.keys()].filter(file => !['404.html', 'news.html'].includes(file))
  .map(file => `<url><loc>${model.site.origin}${file === 'index.html' ? '' : file}</loc></url>`).join('');
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${locations}</urlset>\n`);
await writeFile(path.join(dist, 'build.json'), JSON.stringify({ commit: process.env.GITHUB_SHA || 'local', pages: pages.size, photos: model.photos.length }) + '\n');
console.log(`Built ${pages.size} static pages and ${model.photos.length} responsive photographs${offline ? ' from verified caches' : ''}.`);
