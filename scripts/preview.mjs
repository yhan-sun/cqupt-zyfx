import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const css = await readFile(path.join(dist, 'assets/styles.css'), 'utf8');
const core = (await readFile(path.join(dist, 'assets/core.mjs'), 'utf8')).replace(/export /g, '');
const app = (await readFile(path.join(dist, 'assets/app.js'), 'utf8')).replace(/^import[^;]+;/gm, '');
const names = ['index.html','news.html','sources.html','404.html','news/marathon-2026.html','news/marathon-2025.html','news/marathon-2024.html','notes/track-prep.html'];
const pages = {};
const uri = async filename => {
  const ext = path.extname(filename);
  const type = {'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml'}[ext];
  return `data:${type};base64,${(await readFile(path.join(dist, filename))).toString('base64')}`;
};
for (const filename of names) {
  let html = await readFile(path.join(dist,filename), 'utf8');
  html = html.replace(/<link rel="stylesheet"[^>]*>/g, () => `<style>${css}</style>`);
  html = html.replace(/<script type="module" src="[^"]+"><\/script>/g, '');
  html = html.replace(/\s+srcset="[^"]+"\s+sizes="[^"]+"/g, '');
  const resources = [...new Set([...html.matchAll(/(?:src|href)="((?:\.\.\/)?(?:media|assets)\/[^"#]+)"/g)].map(m => m[1]))];
  for (const resource of resources) html = html.replaceAll(`"${resource}"`, `"${await uri(resource.replace(/^\.\.\//,''))}"`);
  const data = html.match(/<script type="application\/json" id="gallery-data">(.*?)<\/script>/s);
  if (data) {
    const images = JSON.parse(data[1]);
    for (const image of images) if (!image.src.startsWith('data:')) image.src = await uri(image.src);
    html = html.replace(data[1], () => JSON.stringify(images).replaceAll('<','\\u003c'));
  }
  const navigation = `document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||event.defaultPrevented||event.ctrlKey||event.metaKey||a.target==='_blank')return;const href=a.getAttribute('href');if(/^(https?:|mailto:|data:)/.test(href))return;const u=new URL(href,'https://preview.invalid/${filename}');let file=u.pathname.slice(1);if(!file||file.endsWith('/'))file+='index.html';if(file==='${filename}'&&u.hash){event.preventDefault();document.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView();return;}event.preventDefault();parent.postMessage({type:'cqupt-preview-navigation',path:file,anchor:u.hash},'*');});`;
  html = html.replace('</body>', () => `<script type="module">${core}\n${app}\n${navigation}</script></body>`);
  pages[filename] = html;
}
const serialized = JSON.stringify(pages).replaceAll('<','\\u003c');
const output = process.argv[2] || path.join(root, 'cqupt-campus-preview.html');
const shell = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>重庆邮电大学跑步爱好者协会 · 互动预览</title><style>html,body{margin:0;height:100%;background:white}iframe{display:block;width:100%;height:100dvh;border:0}</style><iframe id="site" title="跑步爱好者协会网站预览"></iframe><script>const pages=${serialized};const frame=document.getElementById('site');function show(file,anchor=''){if(!pages[file])file='404.html';frame.onload=()=>{if(anchor)frame.contentDocument?.getElementById(decodeURIComponent(anchor.slice(1)))?.scrollIntoView();};frame.srcdoc=pages[file];}function route(){const parts=decodeURIComponent(location.hash.slice(1)||'index.html').split('!');show(parts[0],parts[1]||'');}window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.data?.type!=='cqupt-preview-navigation')return;location.hash=encodeURIComponent(event.data.path+'!'+event.data.anchor);});window.addEventListener('hashchange',route);route();</script></html>`;
await writeFile(output,shell);
await writeFile(path.join(root,'.cache','preview-home.html'),pages['index.html']);
console.log(`Wrote standalone eight-page preview: ${output}`);
