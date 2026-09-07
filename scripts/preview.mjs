import { readFile, writeFile, readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const scripts = ['assets/core.mjs','assets/app.js','assets/science-core.mjs','assets/science.js','assets/join.js'];
const runtime = (await Promise.all(scripts.map(async file => (await readFile(path.join(dist,file),'utf8')).replace(/^import[^;]+;/gm,'').replace(/export /g,'')))).join('\n');
async function htmlFiles(directory, prefix = '') {
  const names = [];
  for (const item of await readdir(directory,{withFileTypes:true})) {
    if (item.isDirectory()) names.push(...await htmlFiles(path.join(directory,item.name),prefix+item.name+'/'));
    else if (item.name.endsWith('.html')) names.push(prefix+item.name);
  }
  return names;
}
const names = await htmlFiles(dist);
const pages = {};
const uris = new Map();
const uri = async filename => {
  if (uris.has(filename)) return uris.get(filename);
  const type = {'.webp':'image/webp','.png':'image/png','.svg':'image/svg+xml','.gif':'image/gif','.jpg':'image/jpeg','.jpeg':'image/jpeg'}[path.extname(filename).toLowerCase()];
  if (!type) throw new Error('Unknown preview image format: '+filename);
  const result = `data:${type};base64,${(await readFile(path.join(dist,filename))).toString('base64')}`;
  uris.set(filename,result);
  return result;
};
for (const filename of names) {
  let html = await readFile(path.join(dist,filename),'utf8');
  for (const match of [...html.matchAll(/<link rel="stylesheet" href="([^"]+)"[^>]*>/g)]) {
    const css = await readFile(path.join(dist,match[1].replace(/^\.\.\//,'')),'utf8');
    html = html.replace(match[0],()=>`<style>${css}</style>`);
  }
  html = html.replace(/<script type="module" src="[^"]+"><\/script>/g,'');
  html = html.replace(/\s+srcset="[^"]+"\s+sizes="[^"]+"/g,'');
  const resources = [...new Set([...html.matchAll(/(?:src|href|data-motion|data-still)="((?:\.\.\/)?(?:media|assets)\/[^"#]+)"/g)].map(m=>m[1]))];
  for (const resource of resources) html = html.replaceAll(`"${resource}"`,`"${await uri(resource.replace(/^\.\.\//,''))}"`);
  const data = html.match(/<script type="application\/json" id="gallery-data">(.*?)<\/script>/s);
  if (data) {
    const images = JSON.parse(data[1]);
    for (const image of images) if (!image.src.startsWith('data:')) image.src = await uri(image.src);
    html = html.replace(data[1],()=>JSON.stringify(images).replaceAll('<','\\u003c'));
  }
  const navigation = `document.addEventListener('click',event=>{const a=event.target.closest('a[href]');if(!a||event.defaultPrevented||event.ctrlKey||event.metaKey||a.target==='_blank')return;const href=a.getAttribute('href');if(/^(https?:|mailto:|data:)/.test(href))return;const u=new URL(href,'https://preview.invalid/${filename}');let file=u.pathname.slice(1);if(!file||file.endsWith('/'))file+='index.html';if(file==='${filename}'&&u.hash){event.preventDefault();document.getElementById(decodeURIComponent(u.hash.slice(1)))?.scrollIntoView();return;}event.preventDefault();parent.postMessage({type:'cqupt-preview-navigation',path:file,anchor:u.hash},'*');});`;
  html = html.replace('</body>',()=>`<script type="module">${runtime}\n${navigation}</script></body>`);
  pages[filename] = html;
}
const serialized = JSON.stringify(pages).replaceAll('<','\\u003c');
const output = process.argv[2] || path.join(root,'cqupt-campus-preview.html');
const shell = `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>重庆邮电大学跑步爱好者协会 · 互动预览</title><style>html,body{margin:0;height:100%;background:white}iframe{display:block;width:100%;height:100dvh;border:0}</style><iframe id="site" title="跑步爱好者协会网站预览"></iframe><script>const pages=${serialized};const frame=document.getElementById('site');function show(file,anchor=''){if(!pages[file])file='404.html';frame.onload=()=>{if(anchor)frame.contentDocument?.getElementById(decodeURIComponent(anchor.slice(1)))?.scrollIntoView();};frame.srcdoc=pages[file];}function route(){const parts=decodeURIComponent(location.hash.slice(1)||'index.html').split('!');show(parts[0],parts[1]||'');}window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||event.data?.type!=='cqupt-preview-navigation')return;location.hash=encodeURIComponent(event.data.path+'!'+event.data.anchor);});window.addEventListener('hashchange',route);route();</script></html>`;
await writeFile(output,shell);
await mkdir(path.join(root,'.cache'),{recursive:true});
await writeFile(path.join(root,'.cache','preview-home.html'),pages['index.html']);
await writeFile(path.join(root,'.cache','preview-science.html'),pages['science.html']);
await writeFile(path.join(root,'.cache','preview-join.html'),pages['join.html']);
await writeFile(path.join(root,'.cache','preview-pages.json'),JSON.stringify(pages));
console.log(`Wrote standalone ${names.length}-page preview: ${output}`);
