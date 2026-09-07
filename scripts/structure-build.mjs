import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const content = JSON.parse(await readFile(path.join(root, 'data/content.json'), 'utf8'));
const official = JSON.parse(await readFile(path.join(root, 'data/official-posts.json'), 'utf8'));
const campusMedia = JSON.parse(await readFile(path.join(dist, 'media/credits.json'), 'utf8'));
const officialMedia = JSON.parse(await readFile(path.join(dist, 'media/official/credits.json'), 'utf8'));
const campusMap = Object.fromEntries(campusMedia.map(item => [item.id, item]));
const officialMap = Object.fromEntries(officialMedia.map(item => [item.id, item]));
const external = 'target="_blank" rel="noopener noreferrer"';
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

const prefixFor = filename => '../'.repeat(Math.max(0, filename.split('/').length - 1));
const campusImage = (id, prefix = '', alt = null) => {
  const item = campusMap[id];
  if (!item) throw new Error('Missing campus image: ' + id);
  return `<img src="${prefix}media/${id}.${item.format || 'webp'}" width="${item.width}" height="${item.height}" alt="${e(alt ?? item.title)}" loading="lazy" decoding="async" data-running-photo="${id}">`;
};
const officialImage = (id, prefix = '', alt = null) => {
  const item = officialMap[id];
  if (!item) throw new Error('Missing official image: ' + id);
  return `<img src="${prefix}media/official/${id}.webp" width="${item.builtWidth}" height="${item.builtHeight}" alt="${e(alt ?? item.title)}" loading="lazy" decoding="async" data-running-photo="${id}">`;
};

function replaceRange(html, startNeedle, endNeedle, replacement = '') {
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0) return html;
  return html.slice(0, start) + replacement + html.slice(end);
}

function replaceMain(html, main) {
  const start = html.indexOf('<main id="main"');
  const end = html.lastIndexOf('</main>');
  if (start < 0 || end < start) throw new Error('Main boundary changed');
  return html.slice(0, start) + main + html.slice(end + 7);
}

function setHead(html, {title, description, canonical}) {
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${e(title)}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${e(description)}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, `<meta property="og:title" content="${e(title)}">`);
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${e(description)}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, `<meta property="og:url" content="${e(canonical)}">`);
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${e(canonical)}">`);
  return html;
}

function activeKey(filename) {
  if (filename === 'index.html') return 'home';
  if (filename === 'club.html' || filename === 'news.html' || filename.startsWith('news/')) return 'events';
  if (filename === 'gallery.html') return 'gallery';
  if (filename === 'science.html' || filename.startsWith('science/')) return 'science';
  if (filename === 'join.html') return 'join';
  return '';
}

function navigation(html, filename) {
  const prefix = prefixFor(filename);
  const active = activeKey(filename);
  const links = [
    ['首页', `${prefix}./`, 'home'],
    ['协会介绍', `${prefix}./#about`, 'about'],
    ['赛事与足迹', `${prefix}club.html`, 'events'],
    ['跑步影像', `${prefix}gallery.html`, 'gallery'],
    ['科学跑步', `${prefix}science.html`, 'science'],
    ['加入我们', `${prefix}join.html`, 'join']
  ];
  html = html.replace(/<nav id="main-nav" class="container" aria-label="主导航">[\s\S]*?<\/nav>/, `<nav id="main-nav" class="container" aria-label="主导航">${links.map(([label, href, key]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ''}>${label}</a>`).join('')}</nav>`);
  html = html.replace(/<div class="footer-links"><h2>网站导航<\/h2>[\s\S]*?<\/div>/, `<div class="footer-links"><h2>网站导航</h2><a href="${prefix}club.html">赛事与足迹</a><a href="${prefix}gallery.html">跑步影像</a><a href="${prefix}science.html">科学跑步</a><a href="${prefix}join.html">加入约跑团</a><a href="${prefix}sources.html">资料来源</a></div>`);
  if (!html.includes('assets/structure.css')) html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/structure.css"></head>`);
  return html;
}

const eventCards = (prefix = '') => content.stories.map(story => `<article class="merged-event-card"><a href="${prefix}news/${story.id}.html" class="merged-event-photo">${campusImage(story.image, prefix, story.imageNote)}<span>${story.year}</span></a><div><p>${story.date.replaceAll('-', '.')} · ${e(story.sourceName)}</p><h3><a href="${prefix}news/${story.id}.html">${e(story.title)}</a></h3><p>${e(story.summary)}</p><a href="${prefix}news/${story.id}.html">查看赛事资料 →</a></div></article>`).join('');

function campusEventsSection() {
  return `<section class="container merged-campus-events" id="campus-events" aria-labelledby="campus-events-title"><div class="section-heading"><div><p class="section-overline">校园赛事档案</p><h2 id="campus-events-title">重邮人马拉松 · 2024—2026</h2><p class="section-description">校园赛事与跑团公开足迹放在同一处查阅；赛事并不等同于跑团主办活动。</p></div><a class="more" href="gallery.html">看赛事照片 →</a></div><div class="merged-event-grid">${eventCards('')}</div></section>`;
}

function homeEventStrip() {
  return `<div class="merged-home-events"><div class="merged-home-events-head"><div><span>校园赛事档案</span><strong>重邮人马拉松</strong></div><a href="club.html#campus-events">查看 2024—2026 赛事资料 →</a></div><div>${content.stories.map(story => `<a href="news/${story.id}.html"><time>${story.year}</time><span>${e(story.title.replace(/第[六七八]届/, ''))}</span><b>→</b></a>`).join('')}</div></div>`;
}

const galleryOfficialIds = ['2026-qingyuan-team','2025-test-team','2025-test-run','2025-cqmarathon-10','2024-relay-team','2024-guiyang-team','2024-night-05','2025-qingyuan-06'];
const galleryCampusIds = ['race-2025','race-start','race-relay','race-runners','race-warmup','race-course'];
const trainingIds = new Set(['2025-test-team','2025-test-run']);
const postByImage = Object.fromEntries(official.posts.filter(post => post.image).map(post => [post.image, post]));
const campusDescriptions = {
  'race-2025':'2025年重邮人马拉松比赛现场。校园赛事资料用于记录重邮的跑步氛围，不作为跑团成员身份说明。',
  'race-start':'2024年第六届重邮人马拉松起跑现场，从太极运动场出发。',
  'race-relay':'2024年校园马拉松接力场景，记录校园赛道上的团队协作。',
  'race-runners':'2024年重邮人马拉松跑者经过校园赛道。',
  'race-warmup':'2024年校园马拉松赛前场景，也呈现太极运动场的跑步环境。',
  'race-course':'2024年校园马拉松沿途影像，展示校园里的跑步路线氛围。'
};

function galleryCard(type, id, index) {
  if (type === 'official') {
    const media = officialMap[id];
    const post = postByImage[id];
    const category = trainingIds.has(id) ? 'training' : 'club';
    return `<article class="running-gallery-card" data-gallery-page-item data-category="${category}"><a href="${e(media.article)}" ${external} data-gallery-photo="${id}" data-gallery-type="official" aria-label="查看${e(media.title)}大图">${officialImage(id, '', media.title)}<span class="running-gallery-number">${String(index + 1).padStart(2,'0')}</span></a><div><p>${e(media.published)} · ${category === 'training' ? '校园训练' : '跑团记录'}</p><h2>${e(media.title)}</h2><p>${e(post?.summary || 'CQUPT自邮飞翔公众号公开跑步影像。')}</p><a href="${e(media.article)}" ${external}>公众号原文 ↗</a></div></article>`;
  }
  const media = campusMap[id];
  return `<article class="running-gallery-card" data-gallery-page-item data-category="campus"><a href="${e(media.source)}" ${external} data-gallery-photo="${id}" data-gallery-type="campus" aria-label="查看${e(media.title)}大图">${campusImage(id, '', media.title)}<span class="running-gallery-number">${String(index + 1).padStart(2,'0')}</span></a><div><p>${e(media.year || '校园资料')} · 校园赛事</p><h2>${e(media.title)}</h2><p>${e(campusDescriptions[id])}</p><a href="${e(media.source)}" ${external}>原始资料 ↗</a></div></article>`;
}

function galleryMain() {
  const cards = [...galleryOfficialIds.map((id, index) => galleryCard('official', id, index)), ...galleryCampusIds.map((id, index) => galleryCard('campus', id, index + galleryOfficialIds.length))].join('');
  const dialogData = [
    ...galleryOfficialIds.map(id => ({id,type:'official',src:`media/official/${id}.webp`,title:officialMap[id].title,credit:officialMap[id].credit,source:officialMap[id].article})),
    ...galleryCampusIds.map(id => ({id,type:'campus',src:`media/${id}.${campusMap[id].format || 'webp'}`,title:campusMap[id].title,credit:campusMap[id].credit,source:campusMap[id].source}))
  ];
  return `<main id="main" class="running-gallery-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>跑步影像</span></div><header class="running-gallery-hero"><div class="container"><p class="section-overline">RUNNING ARCHIVE · 跑步影像</p><h1>镜头里的重邮跑者。</h1><p>校园训练、跑团集结、高校联赛和重邮人马拉松。这里以真实跑步照片为主线，保留时间、场景和原始出处。</p><div class="running-gallery-hero-meta"><span><strong>${galleryOfficialIds.length}</strong> 张公众号跑团资料</span><span><strong>${galleryCampusIds.length}</strong> 张校园赛事影像</span><a href="club.html">去看赛事与足迹 →</a></div></div></header><section class="container running-gallery-body"><div class="running-gallery-toolbar"><div><h2>跑步照片</h2><p>图片说明只描述已知场景，不凭照片推断个人身份或成绩。</p></div><div class="running-gallery-filters" role="group" aria-label="筛选跑步影像" hidden><button data-gallery-page-filter="all" aria-pressed="true">全部</button><button data-gallery-page-filter="club" aria-pressed="false">跑团赛事</button><button data-gallery-page-filter="training" aria-pressed="false">校园训练</button><button data-gallery-page-filter="campus" aria-pressed="false">校园赛事</button></div></div><p id="running-gallery-status" class="sr-only" role="status" aria-live="polite">显示 ${dialogData.length} 张照片</p><div class="running-gallery-grid">${cards}</div><p class="running-gallery-rights">公众号图片未发现开放许可，版权归原权利人；校园赛事图的具体来源与权利说明见资料来源页。本站用于跑团网站资料展示，署名与链接不等同于开放授权。 <a href="sources.html">查看完整来源 →</a></p></section><dialog class="running-gallery-dialog" id="running-gallery-dialog" aria-labelledby="running-gallery-dialog-title"><div class="running-gallery-dialog-bar"><span id="running-gallery-position"></span><button type="button" data-running-gallery-close aria-label="关闭照片">×</button></div><img id="running-gallery-dialog-image" alt=""><div class="running-gallery-dialog-copy"><div><h2 id="running-gallery-dialog-title"></h2><p id="running-gallery-dialog-credit"></p><a id="running-gallery-dialog-source" ${external}>查看原始出处 ↗</a></div><div><button type="button" data-running-gallery-step="-1" aria-label="上一张">‹</button><button type="button" data-running-gallery-step="1" aria-label="下一张">›</button></div></div></dialog><script type="application/json" id="running-gallery-data">${JSON.stringify(dialogData).replaceAll('<','\\u003c')}</script></main>`;
}

function galleryTeaser() {
  const ids = ['2025-test-run','2026-qingyuan-team','2024-relay-team','2024-night-05'];
  return `<section class="container section running-gallery-teaser" aria-labelledby="running-gallery-teaser-title"><div class="section-heading"><div><p class="section-overline">跑步影像</p><h2 id="running-gallery-teaser-title">训练、赛道和一起跑的人。</h2><p class="section-description">从公众号真实跑团照片，到校园马拉松现场，影像单独归档。</p></div><a class="more" href="gallery.html">进入跑步影像 →</a></div><div class="running-gallery-teaser-grid">${ids.map((id,index)=>`<a href="gallery.html" aria-label="进入跑步影像查看${e(officialMap[id].title)}">${officialImage(id,'',officialMap[id].title)}<span><b>${String(index+1).padStart(2,'0')}</b>${e(officialMap[id].title)}</span></a>`).join('')}</div></section>`;
}

function quickLinks() {
  return `<div class="container quick-links structure-quick-links" aria-label="快捷导航"><a href="club.html"><span class="structure-quick-index">01</span><span><strong>赛事与足迹</strong><small>跑团记录与校园马拉松</small></span><span class="quick-arrow">›</span></a><a href="gallery.html"><span class="structure-quick-index">02</span><span><strong>跑步影像</strong><small>训练、集结与比赛照片</small></span><span class="quick-arrow">›</span></a><a href="science.html"><span class="structure-quick-index">03</span><span><strong>科学跑步</strong><small>训练、力量与营养</small></span><span class="quick-arrow">›</span></a><a href="join.html"><span class="structure-quick-index">04</span><span><strong>加入约跑团</strong><small>QQ群 468686951</small></span><span class="quick-arrow">›</span></a></div>`;
}

function legacyNewsMain() {
  return `<main id="main"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><a href="club.html">赛事与足迹</a><span> / 校园赛事旧入口</span></div><section class="container section merged-news-alias"><p class="section-overline">栏目已合并</p><h1>校园赛事已并入「赛事与足迹」</h1><p>校园马拉松和跑团公开记录现在放在同一页，下面仍保留三届赛事的文章直达入口。</p><a class="button" href="club.html#campus-events">前往赛事与足迹 →</a><div class="merged-event-grid">${eventCards('')}</div></section></main>`;
}

async function htmlFiles(directory, prefix = '') {
  const files = [];
  for (const item of await readdir(directory, {withFileTypes:true})) {
    if (item.isDirectory()) files.push(...await htmlFiles(path.join(directory,item.name), prefix + item.name + '/'));
    else if (item.name.endsWith('.html')) files.push(prefix + item.name);
  }
  return files;
}

export async function buildSiteStructure() {
  let index = await readFile(path.join(dist, 'index.html'), 'utf8');
  let gallery = replaceMain(index, galleryMain());
  gallery = setHead(gallery, {title:'跑步影像｜重邮约跑团',description:'重邮约跑团与重庆邮电大学校园跑步影像：训练、集结、高校联赛和校园马拉松照片及出处。',canonical:'https://yhan-sun.github.io/cqupt-zyfx/gallery.html'});
  gallery = navigation(gallery, 'gallery.html');
  gallery = gallery.replace('</body>', '<script type="module" src="assets/gallery.js"></script></body>');
  await writeFile(path.join(dist, 'gallery.html'), gallery);

  const files = await htmlFiles(dist);
  for (const filename of files) {
    const filepath = path.join(dist, filename);
    let html = await readFile(filepath, 'utf8');
    if (filename === 'gallery.html') continue;
    if (filename === 'index.html') {
      html = replaceRange(html, '<section class="container section news-section"', '<section class="about-band"');
      html = html.replace(/<div class="container quick-links"[\s\S]*?<\/div>\s*<section class="about-band"/, `${quickLinks()}<section class="about-band"`);
      html = replaceRange(html, '<section id="gallery"', '<section class="home-join-band"', galleryTeaser());
      html = html.replace(/(<section class="club-footprints-home[\s\S]*?)(<\/section>)/, `$1${homeEventStrip()}$2`);
    }
    if (filename === 'club.html') {
      html = html.replace('<span>跑团足迹</span>', '<span>赛事与足迹</span>');
      html = html.replace('<h2 id="timeline-title">跑团足迹</h2>', '<h2 id="timeline-title">跑团公开足迹</h2>');
      html = html.replace('<section class="club-training-history"', campusEventsSection() + '<section class="club-training-history"');
      html = setHead(html, {title:'赛事与足迹｜重邮约跑团',description:'重邮约跑团公开足迹与重庆邮电大学校园赛事档案：训练、校友集结、高校联赛和历届重邮人马拉松。',canonical:'https://yhan-sun.github.io/cqupt-zyfx/club.html'});
    }
    if (filename === 'news.html') {
      html = replaceMain(html, legacyNewsMain());
      html = setHead(html, {title:'校园赛事已并入赛事与足迹｜重邮约跑团',description:'校园赛事栏目已并入赛事与足迹，保留历届重邮人马拉松文章入口。',canonical:'https://yhan-sun.github.io/cqupt-zyfx/club.html#campus-events'});
    }
    html = html.replace(/href="(?:\.\.\/)?\.\/#running"/g, `href="${prefixFor(filename)}gallery.html"`);
    html = html.replace('查看校园跑步场景 →', '看跑步影像 →');
    html = html.replace('配速计算只在浏览器进行；', 'QQ群号复制等轻量交互只在浏览器进行；');
    html = navigation(html, filename);
    await writeFile(filepath, html);
  }
  return ['gallery.html'];
}
