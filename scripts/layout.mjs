import { site } from './model.mjs';

export const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
export const external = 'target="_blank" rel="noopener noreferrer"';
export const prefixFor = file => '../'.repeat(file.split('/').length - 1);
export const localHref = (href, prefix = '') => /^(https?:|mailto:|#)/.test(href) ? href : prefix + href;
export const arrow = '<span aria-hidden="true">→</span>';
const e = escapeHtml;

export function image(item, { prefix = '', eager = false, sizes = '(max-width: 600px) 100vw, (max-width: 960px) 50vw, 380px' } = {}) {
  if (!item) throw new Error('Image metadata is required');
  const variants = item.variants || [];
  const smallest = variants[0];
  const srcset = variants.length > 1 ? ` srcset="${variants.map(v => `${prefix}${e(v.src)} ${v.width}w`).join(', ')}" sizes="${e(sizes)}"` : '';
  return `<img src="${prefix}${e(smallest?.src || item.src)}"${srcset} width="${item.width || 800}" height="${item.height || 600}" alt="${e(item.title)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''}>`;
}

export function photoLink(item, options = {}) {
  const prefix = options.prefix || '';
  return `<a class="photo-link" href="${prefix}${e(item.src)}" data-photo-view="${e(item.id)}" data-title="${e(item.title)}" data-credit="${e(item.sourceLabel || item.credit)}" data-source="${e(localHref(item.source, prefix))}" aria-label="查看大图：${e(item.title)}">${image(item, options)}</a>`;
}

export const breadcrumbs = (label, prefix = '') => `<div class="breadcrumbs container"><a href="${prefix}index.html">首页</a><span aria-hidden="true"> / </span><span>${e(label)}</span></div>`;
export const pageHeading = (title, description = '') => `<header class="page-heading"><h1>${e(title)}</h1>${description ? `<p>${e(description)}</p>` : ''}</header>`;

function viewer() {
  return `<dialog id="photo-viewer" aria-labelledby="photo-title"><div class="viewer-toolbar"><span id="photo-position"></span><button type="button" data-photo-close aria-label="关闭照片" autofocus>关闭 ×</button></div><div class="viewer-image"><img id="photo-image" alt=""><p id="photo-error" role="status" hidden>照片暂时无法加载，请打开原图查看。</p></div><div class="viewer-bottom"><div><h2 id="photo-title"></h2><p id="photo-credit"></p><a id="photo-source" ${external}>来源</a> · <a id="photo-original" ${external}>打开原图</a></div><div class="viewer-controls"><button type="button" data-photo-step="-1" aria-label="上一张照片">←</button><button type="button" data-photo-step="1" aria-label="下一张照片">→</button></div></div></dialog>`;
}

export function page(filename, title, body, { active = '', description = site.description, shareImage = 'media/official/2025-track-training.webp', noindex = false } = {}) {
  const prefix = prefixFor(filename);
  const canonical = new URL(filename === 'index.html' ? './' : filename, site.origin).href;
  const fullTitle = `${title} · ${site.name}`;
  const science = active === 'science';
  const hasPhotos = body.includes('data-photo-view=');
  const pageKey = filename.replace(/\.html$/, '').replaceAll('/', '-');
  const bodyClass = `page page-${active || 'utility'}`;
  const nav = site.navigation.map(item => `<a href="${prefix}${item.path}"${item.key === active ? ' aria-current="page"' : ''}${item.key === 'join' ? ` class="nav-join"${item.key === active ? ' style="color:#fff"' : ''}` : ''}>${e(item.label)}</a>`).join('');
  return `<!doctype html>
<html lang="zh-CN">
<head>
<meta charset="utf-8">${filename === '404.html' ? `<base href="${e(new URL(site.origin).pathname)}">` : ''}<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(fullTitle)}</title><meta name="description" content="${e(description)}">
<link rel="canonical" href="${e(canonical)}"><meta property="og:type" content="website">
<meta property="og:locale" content="zh_CN"><meta property="og:site_name" content="${e(site.name)}">
<meta property="og:title" content="${e(fullTitle)}"><meta property="og:description" content="${e(description)}">
<meta property="og:url" content="${e(canonical)}"><meta property="og:image" content="${e(new URL(shareImage, site.origin).href)}">
<meta name="theme-color" content="#087c80">${noindex ? '<meta name="robots" content="noindex,follow">' : ''}
<link rel="icon" href="${prefix}assets/mark.svg" type="image/svg+xml">
<link rel="stylesheet" href="${prefix}assets/site.css">${science ? `<link rel="stylesheet" href="${prefix}assets/science.css">` : ''}<link rel="stylesheet" href="${prefix}assets/editorial.css">
<script type="module" src="${prefix}assets/site.js"></script>${science ? `<script type="module" src="${prefix}assets/science.js"></script>` : ''}
</head>
<body class="${e(bodyClass)}" data-page="${e(pageKey)}">
<a class="skip-link" href="#main">跳到正文</a>
<header class="site-header"><div class="container header-inner"><a class="brand" href="${prefix}index.html"><span>重庆邮电大学</span><strong>${e(site.shortName)}</strong><small>${e(site.alias)}</small></a><button class="menu-toggle" aria-controls="main-nav" aria-expanded="false" type="button" hidden>菜单</button><nav id="main-nav" aria-label="主导航">${nav}</nav></div></header>
${body}
<footer class="site-footer"><div class="container footer-main"><div><strong>${e(site.name)}</strong><p>${e(site.alias)}</p></div><nav aria-label="页脚导航"><a href="${prefix}join.html">联系跑团</a><a href="${prefix}sources.html">资料与图片来源</a><a href="https://www.cqupt.edu.cn/" ${external}>学校主页 ↗</a><a href="https://github.com/yhan-sun/cqupt-zyfx/issues" ${external}>网站反馈 ↗</a></nav></div><p class="container footer-note">学生社团展示网站 · 非学校行政门户</p></footer>
${hasPhotos ? viewer() : ''}
</body></html>`;
}
