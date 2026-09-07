import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const official = JSON.parse(await readFile(path.join(root, 'data/official-posts.json'), 'utf8'));
const culture = JSON.parse(await readFile(path.join(root, 'data/club-culture.json'), 'utf8'));
const content = JSON.parse(await readFile(path.join(root, 'data/content.json'), 'utf8'));
const officialMedia = JSON.parse(await readFile(path.join(dist, 'media/official/credits.json'), 'utf8'));
const campusMedia = JSON.parse(await readFile(path.join(dist, 'media/credits.json'), 'utf8'));
const officialMap = Object.fromEntries(officialMedia.map(item => [item.id, item]));
const campusMap = Object.fromEntries(campusMedia.map(item => [item.id, item]));
const postMap = Object.fromEntries(official.posts.map(post => [post.id, post]));
const postForImage = {};
for (const [postId, ids] of Object.entries(culture.postImages)) for (const id of ids) postForImage[id] = postMap[postId];
const external = 'target="_blank" rel="noopener noreferrer"';
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));

function replaceMain(html, main) {
  const start = html.indexOf('<main id="main"');
  const end = html.lastIndexOf('</main>');
  if (start < 0 || end < start) throw new Error('Main boundary changed');
  return html.slice(0, start) + main + html.slice(end + 7);
}

function replaceSection(html, startNeedle, endNeedle, replacement) {
  const start = html.indexOf(startNeedle);
  const end = html.indexOf(endNeedle, start + startNeedle.length);
  if (start < 0 || end < 0) throw new Error(`Section boundary changed: ${startNeedle}`);
  return html.slice(0, start) + replacement + html.slice(end);
}

function ensureCultureCss(html, prefix = '') {
  if (!html.includes('assets/culture.css')) html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/culture.css"></head>`);
  return html;
}

function officialImage(id, prefix = '', alt = null, eager = false) {
  const item = officialMap[id];
  if (!item) throw new Error('Missing official media ' + id);
  return `<img src="${prefix}media/official/${id}.webp" width="${item.builtWidth}" height="${item.builtHeight}" alt="${e(alt ?? item.title)}" loading="${eager ? 'eager' : 'lazy'}" decoding="async"${eager ? ' fetchpriority="high"' : ''} data-official-image="${id}" data-running-photo="${id}">`;
}

function campusImage(id, prefix = '', alt = null) {
  const item = campusMap[id];
  if (!item) throw new Error('Missing campus media ' + id);
  return `<img src="${prefix}media/${id}.${item.format || 'webp'}" width="${item.width}" height="${item.height}" alt="${e(alt ?? item.title)}" loading="lazy" decoding="async" data-running-photo="${id}">`;
}

function photoMosaic(ids, {prefix = '', compact = false} = {}) {
  const classes = ['culture-photo-mosaic', `culture-photo-mosaic-${Math.min(ids.length, 4)}`, compact ? 'culture-photo-mosaic-compact' : ''].filter(Boolean).join(' ');
  return `<div class="${classes}">${ids.slice(0, 4).map((id, index) => `<figure class="culture-photo-${index + 1}">${officialImage(id, prefix)}<figcaption>${e(officialMap[id].title)}</figcaption></figure>`).join('')}</div>`;
}

function factCells(post) {
  return `<div class="culture-facts">${post.facts.map(fact => `<div><strong>${e(fact.value)}</strong><span>${e(fact.label)}</span></div>`).join('')}</div>`;
}

function cultureMoment(moment, index) {
  return `<article class="culture-moment"><div class="culture-moment-copy"><span>${String(index + 1).padStart(2, '0')} · ${e(moment.label)}</span><h3>${e(moment.title)}</h3><p>${e(moment.description)}</p><a href="gallery.html">在跑步影像里继续看 →</a></div>${photoMosaic(moment.images, {compact:true})}</article>`;
}

function cultureEvent(post, sequence) {
  const ids = culture.postImages[post.id] || (post.image ? [post.image] : []);
  const media = ids.length ? photoMosaic(ids) : `<div class="culture-text-archive"><span>2025</span><strong>训练档案</strong><p>这条记录保留训练结构，不复用旧招新二维码和成绩门槛。</p></div>`;
  return `<article class="culture-event${sequence % 2 ? ' culture-event-reverse' : ''}" id="post-${post.id}" data-official-post data-year="${post.year}"><div class="culture-event-media">${media}</div><div class="culture-event-copy"><div class="culture-event-meta"><span>${e(post.category)}</span><time datetime="${post.eventDate || post.published}">${e((post.eventDate || post.published).replaceAll('-', '.'))}</time></div><h3>${e(post.title)}</h3><p>${e(post.summary)}</p>${factCells(post)}<p class="culture-event-note">${e(post.note)}</p><a class="official-source" href="${e(post.source)}" ${external}>公众号原文 ↗</a></div></article>`;
}

function cultureYear(year, offset) {
  const posts = year.posts.map(id => postMap[id]).filter(Boolean);
  return `<section class="culture-year" id="year-${year.year}" aria-labelledby="year-${year.year}-title"><aside class="culture-year-rail"><strong>${year.year}</strong><span>${e(year.label)}</span><p>${e(year.summary)}</p></aside><div class="culture-year-events">${posts.map((post, index) => cultureEvent(post, offset + index)).join('')}</div></section>`;
}

function campusEventCard(story) {
  return `<article class="culture-campus-card"><a href="news/${story.id}.html">${campusImage(story.image, '', story.imageNote)}<span>${story.year}</span></a><div><p>${e(story.date.replaceAll('-', '.'))} · ${e(story.sourceName)}</p><h3><a href="news/${story.id}.html">${e(story.title)}</a></h3><p>${e(story.summary)}</p><a href="news/${story.id}.html">查看赛事资料 →</a></div></article>`;
}

function clubMain() {
  const heroImages = culture.hero.images;
  const totalImages = new Set(Object.values(culture.postImages).flat()).size;
  const totalPosts = official.posts.length;
  let offset = 0;
  const years = culture.years.map(year => {
    const html = cultureYear(year, offset);
    offset += year.posts.length;
    return html;
  }).join('');
  const training = official.historicalTraining;
  return `<main id="main" class="club-culture-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>赛事与足迹</span></div><section class="culture-hero"><div class="container culture-hero-grid"><div class="culture-hero-copy"><p class="culture-eyebrow">${e(culture.hero.eyebrow)}</p><h1>${e(culture.hero.title).replace('\n','<br>')}</h1><p>${e(culture.hero.description)}</p><div class="culture-hero-actions"><a class="button" href="#timeline">从最新记录开始 →</a><a href="gallery.html">看完整跑步影像</a></div><div class="culture-hero-stats"><div><strong>${totalPosts}</strong><span>篇公众号公开记录</span></div><div><strong>${totalImages}</strong><span>张自邮飞翔公众号影像</span></div><div><strong>2024—2026</strong><span>当前公开档案范围</span></div></div><p class="culture-source-line">资料账户：CQUPT自邮飞翔 · 核对于 ${e(culture.reviewedAt)}</p></div><div class="culture-hero-photos"><figure class="culture-hero-main">${officialImage(heroImages[0], '', null, true)}<figcaption>太极运动场 · 公开训练资料</figcaption></figure><figure>${officialImage(heroImages[1], '', null, true)}<figcaption>清远 · 高校联赛集结</figcaption></figure><figure>${officialImage(heroImages[2], '', null, true)}<figcaption>重庆夜跑 · 跑团旗帜</figcaption></figure></div></div><nav class="container culture-year-nav" aria-label="按年份浏览跑团足迹">${culture.years.map(year => `<a href="#year-${year.year}"><strong>${year.year}</strong><span>${e(year.label)}</span></a>`).join('')}<a href="#campus-events"><strong>主场</strong><span>重邮人马拉松</span></a></nav></section><section class="container culture-identity"><div class="culture-identity-copy"><p class="section-overline">跑团文化</p><h2>成绩之外，还有一起跑的人。</h2><p>现有公众号资料里，训练、出征和赛后交流反复出现。这里把这些团队场景放回档案里，而不是只留下名次和数字。</p></div><div class="culture-identity-tags"><span>太极运动场</span><span>在校生与校友</span><span>集体训练</span><span>高校联赛</span><span>城市马拉松</span><span>赛后交流</span></div></section><section class="culture-moments-band"><div class="container"><div class="section-heading"><div><p class="section-overline">影像里的自邮飞翔</p><h2>同一面旗帜，不同的场景。</h2></div><a class="more" href="gallery.html">查看全部 ${totalImages} 张跑团影像 →</a></div><div class="culture-moments">${culture.moments.map(cultureMoment).join('')}</div></div></section><section class="container culture-timeline" id="timeline" aria-labelledby="culture-timeline-title"><div class="culture-timeline-heading"><div><p class="section-overline">公开足迹 · 2024—2026</p><h2 id="culture-timeline-title">一段段跑出来的记录。</h2><p>按公众号记录整理。每一条都保留原文入口，历史招新、训练时间和旧二维码不作为当前通知。</p></div><nav aria-label="年份快捷入口">${culture.years.map(year => `<a href="#year-${year.year}">${year.year}</a>`).join('')}</nav></div>${years}</section><section class="culture-campus-events" id="campus-events"><div class="container"><div class="section-heading"><div><p class="section-overline">校园主场</p><h2>重邮人马拉松 · 2024—2026</h2><p class="section-description">校园赛事与跑团足迹放在同一页查阅，但赛事本身不等同于自邮飞翔主办活动。</p></div><a class="more" href="gallery.html#campus-running">看校园赛事影像 →</a></div><div class="culture-campus-grid">${content.stories.map(campusEventCard).join('')}</div></div></section><section class="culture-training" id="training-history"><div class="container culture-training-grid"><div><p class="section-overline">训练档案 · 2025</p><h2>公众号曾记录过怎样的一周。</h2><p>${e(training.notice)}</p><a href="science/training.html">去科学跑步理解这些训练 →</a></div><div class="culture-training-days">${training.items.map(item => `<article><div><strong>${e(item.day)}</strong><span>${e(item.time)}</span></div><h3>${e(item.type)}</h3><p>${e(item.detail)}</p></article>`).join('')}<p>${e(training.place)}</p><a class="official-source" href="${e(training.source)}" ${external}>历史公告原文 ↗</a></div></div></section><section class="container culture-sources" id="sources"><div class="section-heading"><div><p class="section-overline">原始资料</p><h2>${totalPosts}篇公众号文章</h2></div><span>公开记录，不代替当前通知</span></div><div>${official.posts.map(post => `<a href="${e(post.source)}" ${external}><time>${post.published.replaceAll('-','.')}</time><span>${e(post.originalTitle)}</span><b>↗</b></a>`).join('')}</div><p>公众号文章和图片版权归原权利人。本站按委托方提供的公开资料进行摘要与版式引用；新增影像仍未发现开放许可。个人成绩表、手机号、旧招新二维码及已过期截止日期不在此处重发。</p></section></main>`;
}

function galleryDescription(id) {
  const category = culture.galleryCategories[id] || 'team';
  const post = postForImage[id];
  if (category === 'training') return '太极运动场的训练、测试或集体跑步记录。具体训练时间以历史资料边界为准。';
  if (category === 'social') return '公众号记录的跑友交流场景，展示赛道之外的团队联系。';
  if (category === 'race') return post ? post.summary : 'CQUPT自邮飞翔公众号公开赛事影像。';
  return post ? post.summary : 'CQUPT自邮飞翔公众号公开团队影像。';
}

function galleryCard(id, index) {
  const item = officialMap[id];
  const category = culture.galleryCategories[id] || 'team';
  const labels = {training:'校园训练', race:'跑团赛事', social:'跑友交流', team:'团队合影'};
  return `<article class="culture-gallery-card culture-gallery-card-${category}" data-gallery-page-item data-category="${category}"><a href="${e(item.article)}" ${external} data-gallery-photo="${id}" aria-label="查看${e(item.title)}大图">${officialImage(id)}<span>${String(index + 1).padStart(2,'0')}</span></a><div><p>${e(item.published)} · ${labels[category]}</p><h2>${e(item.title)}</h2><p>${e(galleryDescription(id))}</p><a href="${e(item.article)}" ${external}>公众号原文 ↗</a></div></article>`;
}

const campusDescriptions = {
  'race-2025':'2025年重邮人马拉松比赛现场。校园赛事资料用于记录重邮跑步氛围，不用于推断跑团成员身份。',
  'race-start':'2024年第六届重邮人马拉松起跑现场，从太极运动场出发。',
  'race-relay':'2024年校园马拉松接力场景，记录校园赛道上的团队协作。',
  'race-runners':'2024年重邮人马拉松跑者经过校园赛道。',
  'race-warmup':'2024年校园马拉松赛前场景，也呈现太极运动场的跑步环境。',
  'race-course':'2024年校园马拉松沿途影像，展示校园里的跑步路线氛围。'
};
const campusIds = ['race-2025','race-start','race-relay','race-runners','race-warmup','race-course'];

function campusGalleryCard(id, index) {
  const item = campusMap[id];
  return `<article class="culture-gallery-card culture-gallery-card-campus" data-gallery-page-item data-category="campus"><a href="${e(item.source)}" ${external} data-gallery-photo="${id}" aria-label="查看${e(item.title)}大图">${campusImage(id)}<span>${String(index + 1).padStart(2,'0')}</span></a><div><p>${e(item.year || '校园资料')} · 校园赛事</p><h2>${e(item.title)}</h2><p>${e(campusDescriptions[id])}</p><a href="${e(item.source)}" ${external}>原始资料 ↗</a></div></article>`;
}

function galleryMain() {
  const ids = Object.values(culture.postImages).flat().filter((id, index, all) => all.indexOf(id) === index);
  const allDialog = [
    ...ids.map(id => ({id,src:`media/official/${id}.webp`,title:officialMap[id].title,credit:officialMap[id].credit,source:officialMap[id].article})),
    ...campusIds.map(id => ({id,src:`media/${id}.${campusMap[id].format || 'webp'}`,title:campusMap[id].title,credit:campusMap[id].credit,source:campusMap[id].source}))
  ];
  return `<main id="main" class="running-gallery-page culture-gallery-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>跑步影像</span></div><header class="culture-gallery-hero"><div class="container culture-gallery-hero-grid"><div><p class="culture-eyebrow">自邮飞翔 · RUNNING ARCHIVE</p><h1>跑过的地方，<br>一起跑的人。</h1><p>从太极运动场训练，到清远、重庆、贵阳的赛场集结。新增影像来自自邮飞翔官方公众号，保留文章日期与出处。</p><div class="culture-gallery-counts"><span><strong>${ids.length}</strong> 张跑团公众号影像</span><span><strong>${campusIds.length}</strong> 张校园赛事影像</span></div><a href="club.html">回到赛事与足迹 →</a></div><div class="culture-gallery-hero-photos">${['2025-track-training','2026-qingyuan-eventwall','2026-qingyuan-selfie','2024-night-flag'].map(id => `<figure>${officialImage(id, '', null, true)}</figure>`).join('')}</div></div></header><section class="container culture-gallery-body"><div class="culture-gallery-toolbar"><div><p class="section-overline">自邮飞翔影像</p><h2>先看跑团自己的训练与活动。</h2><p>不把成绩截图当照片，也不凭影像推断个人身份和成绩。</p></div><div class="running-gallery-filters" role="group" aria-label="筛选跑步影像" hidden><button data-gallery-page-filter="all" aria-pressed="true">全部</button><button data-gallery-page-filter="training" aria-pressed="false">校园训练</button><button data-gallery-page-filter="race" aria-pressed="false">跑团赛事</button><button data-gallery-page-filter="team" aria-pressed="false">团队合影</button><button data-gallery-page-filter="social" aria-pressed="false">跑友交流</button><button data-gallery-page-filter="campus" aria-pressed="false">校园赛事</button></div></div><p id="running-gallery-status" class="sr-only" role="status" aria-live="polite">显示 ${allDialog.length} 张照片</p><div class="culture-gallery-grid">${ids.map(galleryCard).join('')}</div><section class="culture-campus-gallery" id="campus-running"><div class="section-heading"><div><p class="section-overline">校园主场影像</p><h2>重邮人马拉松</h2><p class="section-description">这些是校园赛事资料，与自邮飞翔公众号跑团影像分开标注。</p></div><a class="more" href="club.html#campus-events">赛事档案 →</a></div><div class="culture-gallery-grid culture-gallery-grid-campus">${campusIds.map((id,index) => campusGalleryCard(id, ids.length + index)).join('')}</div></section><p class="culture-gallery-rights">公众号图片未发现开放许可，版权归原权利人；校园赛事图片的来源与权利说明见资料来源页。署名和链接不等同于开放授权。 <a href="sources.html">查看完整来源 →</a></p></section><dialog class="running-gallery-dialog" id="running-gallery-dialog" aria-labelledby="running-gallery-dialog-title"><div class="running-gallery-dialog-bar"><span id="running-gallery-position"></span><button type="button" data-running-gallery-close aria-label="关闭照片">×</button></div><img id="running-gallery-dialog-image" alt=""><div class="running-gallery-dialog-copy"><div><h2 id="running-gallery-dialog-title"></h2><p id="running-gallery-dialog-credit"></p><a id="running-gallery-dialog-source" ${external}>查看原始出处 ↗</a></div><div><button type="button" data-running-gallery-step="-1" aria-label="上一张">‹</button><button type="button" data-running-gallery-step="1" aria-label="下一张">›</button></div></div></dialog><script type="application/json" id="running-gallery-data">${JSON.stringify(allDialog).replaceAll('<','\\u003c')}</script></main>`;
}

function homeSection() {
  const ids = culture.hero.images;
  const totalImages = new Set(Object.values(culture.postImages).flat()).size;
  return `<section class="culture-home section" id="footprints" aria-labelledby="culture-home-title"><div class="container culture-home-grid"><div class="culture-home-copy"><p class="section-overline">赛事与足迹 · 自邮飞翔</p><h2 id="culture-home-title">一起训练，也一起出发。</h2><p>从太极运动场的集体训练，到高校联赛与城市马拉松，公众号公开记录把这支跑团的训练、集结和赛后交流串在一起。</p><div class="culture-home-stats"><span><strong>${official.posts.length}</strong>篇公开记录</span><span><strong>${totalImages}</strong>张跑团影像</span><span><strong>2024—2026</strong>档案范围</span></div><div class="culture-home-actions"><a class="button" href="club.html">看赛事与足迹 →</a><a href="gallery.html">看跑步影像</a></div></div><div class="culture-home-photos"><figure class="culture-home-photo-main">${officialImage(ids[0])}<figcaption>太极运动场 · 训练资料</figcaption></figure><figure>${officialImage(ids[1])}<figcaption>清远 · 跑团集结</figcaption></figure><figure>${officialImage('2026-qingyuan-selfie')}<figcaption>赛场 · 跑友合影</figcaption></figure></div></div><div class="container culture-home-events"><span>校园主场</span>${content.stories.map(story => `<a href="news/${story.id}.html"><strong>${story.year}</strong>${e(story.title.replace(/第[六七八]届/, ''))}</a>`).join('')}<a href="club.html#campus-events">全部赛事 →</a></div></section>`;
}

export async function buildClubCulture() {
  let club = await readFile(path.join(dist, 'club.html'), 'utf8');
  club = replaceMain(club, clubMain());
  club = ensureCultureCss(club);
  await writeFile(path.join(dist, 'club.html'), club);

  let gallery = await readFile(path.join(dist, 'gallery.html'), 'utf8');
  gallery = replaceMain(gallery, galleryMain());
  gallery = ensureCultureCss(gallery);
  await writeFile(path.join(dist, 'gallery.html'), gallery);

  let home = await readFile(path.join(dist, 'index.html'), 'utf8');
  home = replaceSection(home, '<section class="club-footprints-home', '<section class="container section science-entry"', homeSection());
  home = ensureCultureCss(home);
  await writeFile(path.join(dist, 'index.html'), home);

  let sources = await readFile(path.join(dist, 'sources.html'), 'utf8');
  sources = sources.replace(/本版选用其中8幅团队、校园训练或赛事照片/, `本版选用其中${officialMedia.length}幅团队、校园训练、赛事或跑友交流照片`);
  sources = ensureCultureCss(sources);
  await writeFile(path.join(dist, 'sources.html'), sources);

  return [];
}
