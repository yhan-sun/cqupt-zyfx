import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const external = 'target="_blank" rel="noopener noreferrer"';
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const official = JSON.parse(await readFile(path.join(root, 'data/official-posts.json'), 'utf8'));
const media = JSON.parse(await readFile(path.join(dist, 'media/official/credits.json'), 'utf8'));
const mediaMap = Object.fromEntries(media.map(item => [item.id, item]));

const prefixFor = filename => '../'.repeat(Math.max(0, filename.split('/').length - 1));
const localImage = (id, prefix = '', alt = null, className = '') => {
  const item = mediaMap[id];
  if (!item) throw new Error('Missing official image: ' + id);
  return `<img class="${className}" src="${prefix}media/official/${id}.webp" width="${item.builtWidth}" height="${item.builtHeight}" alt="${e(alt ?? item.title)}" loading="lazy" decoding="async" data-official-image="${id}">`;
};
const articleSource = post => `<a class="official-source" href="${e(post.source)}" ${external}>公众号原文 ↗</a>`;
const factCells = facts => facts.map(fact => `<div class="club-fact"><strong>${e(fact.value)}</strong><span>${e(fact.label)}</span></div>`).join('');

function homeSection() {
  const latest = official.posts.find(post => post.id === 'qingyuan-2026');
  const test = official.posts.find(post => post.id === 'test-2025');
  const relay = official.posts.find(post => post.id === 'relay-2024');
  return `<section class="club-footprints-home section" id="footprints" aria-labelledby="footprints-title"><div class="container"><div class="section-heading"><div><p class="section-overline">跑团档案 · CQUPT自邮飞翔</p><h2 id="footprints-title">从太极运动场，跑到全国高校赛场</h2><p class="section-description">依据自邮飞翔公众号公开记录整理，保留文章日期与原文入口。</p></div><a class="more" href="club.html">查看跑团足迹 <span aria-hidden="true">→</span></a></div><div class="footprint-home-grid"><a class="footprint-feature" href="club.html#post-qingyuan-2026"><figure>${localImage(latest.image,'','2026清远马拉松后重邮跑团合影')}<figcaption>2026.03 · 清远马拉松高校联赛</figcaption></figure><div class="footprint-feature-copy"><p class="footprint-kicker">最新公开记录</p><h3>高校联赛<br>全国第六</h3><p>${e(latest.summary)}</p><span>查看完整记录 →</span></div></a><div class="footprint-home-facts"><div class="footprint-big-fact"><strong>16:54:38</strong><span>2026 清远高校联赛<br>公众号公布的团体计分总用时</span></div><div class="footprint-home-lines"><a href="club.html#post-test-2025"><time>2025.09</time><div><strong>23名成员 · 5K测试</strong><span>太极运动场的一次集体测试记录</span></div><b>→</b></a><a href="club.html#post-qingyuan-2025"><time>2025.03</time><div><strong>43名校友 · 清远集结</strong><span>文章记录来自7个省市的校友参与</span></div><b>→</b></a><a href="club.html#post-relay-2024"><time>2024.05</time><div><strong>马拉松战队首次出征</strong><span>十人接力，团体第20名</span></div><b>→</b></a></div><p class="footprint-home-note">“首次出征”仅指公众号所述马拉松战队首次出征，不用于推断协会成立时间。<a href="club.html#sources">查看全部8篇公众号资料</a></p></div></div></div></section>`;
}

function trainingArchive(prefix = '../') {
  const training = official.historicalTraining;
  return `<aside class="club-training-archive" aria-labelledby="club-training-title"><div class="club-training-head"><div><p class="sc-overline">跑团训练档案</p><h2 id="club-training-title">公众号里的真实训练结构</h2></div><span>2025 秋招历史资料</span></div><p class="club-training-warning"><strong>不是当前课表。</strong>${e(training.notice)}</p><div class="club-training-days">${training.items.map(item => `<div><time>${e(item.day)}</time><strong>${e(item.type)}</strong><span>${e(item.time)}</span><p>${e(item.detail)}</p></div>`).join('')}</div><div class="club-training-links"><a href="#method-interval">间歇跑 →</a><a href="#method-tempo">阈值 / 节奏 →</a><a href="strength.html">力量训练 →</a><a href="#method-long-run">长距离 →</a></div><p class="club-training-place">${e(training.place)}</p><a class="official-source" href="${e(training.source)}" ${external}>查看2025年10月20日公众号原文 ↗</a></aside>`;
}

function sourceSection() {
  return `<section class="official-source-section" id="official-wechat"><h2>CQUPT自邮飞翔公众号资料</h2><p>以下8篇文章由委托方提供，本站于${e(official.reviewedAt)}逐篇读取并整理。文章中的事实按原文日期保留，不把历史招新、旧训练时间或未来愿景写成当前通知。</p><div class="official-source-list">${official.posts.map(post => `<article><time datetime="${post.published}">${post.published.replaceAll('-','.')}</time><div><h3><a href="${e(post.source)}" ${external}>${e(post.originalTitle)} ↗</a></h3><p>${e(post.summary)}</p></div></article>`).join('')}</div><h3 class="official-media-heading">公众号图片</h3><p>本版选用其中8幅团队、校园训练或赛事照片，构建时从文章图片源取得、校验哈希并转码后同站托管。图片未发现开放许可，版权仍归原权利人；署名和链接不等于本站取得开放授权。</p><div class="official-media-source-grid">${media.map(item => `<div id="official-${item.id}">${localImage(item.id,'',item.title)}<p><strong>${e(item.title)}</strong><span>${e(item.credit)} · ${e(item.published)}</span><a href="${e(item.article)}" ${external}>所在公众号文章 ↗</a></p></div>`).join('')}</div></section>`;
}

function archiveCard(post, index) {
  const image = post.image ? `<figure>${localImage(post.image,'',post.title)}<figcaption>${e(mediaMap[post.image].credit)} · ${e(mediaMap[post.image].published)}</figcaption></figure>` : `<div class="club-archive-text-visual" aria-hidden="true"><span>TRAINING<br>ARCHIVE</span><b>2025</b></div>`;
  return `<article class="club-timeline-item" id="post-${post.id}" data-official-post data-year="${post.year}"><div class="club-timeline-date"><span>${e(post.year)}</span><time datetime="${post.published}">${post.published.slice(5).replace('-','.')}</time><i>${String(index + 1).padStart(2,'0')}</i></div><div class="club-timeline-media">${image}</div><div class="club-timeline-copy"><p class="club-category">${e(post.category)}${post.eventDate ? ` · ${post.eventDate.replaceAll('-','.')}` : ` · 发布于 ${post.published.replaceAll('-','.')}`}</p><h2>${e(post.title)}</h2><p class="club-summary">${e(post.summary)}</p><div class="club-facts">${factCells(post.facts)}</div><p class="club-note">${e(post.note)}</p>${articleSource(post)}</div></article>`;
}

function archiveMain() {
  const latest = official.posts[0];
  const about = official.about;
  const training = official.historicalTraining;
  return `<main id="main" class="club-archive-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>跑团足迹</span></div><section class="club-archive-hero"><div class="container club-archive-hero-grid"><div class="club-archive-hero-copy"><p class="club-eyebrow">CQUPT 自邮飞翔 · 官方公众号资料档案</p><h1>从太极运动场，<br>到全国赛道。</h1><p>这不是一组宣传口号，而是8篇公开文章留下的真实跑团记录：训练、测试、接力、城市马拉松、高校联赛，以及跨越不同年级的校友集结。</p><div class="club-hero-links"><a class="button" href="#timeline">按年份看足迹 →</a><a href="#training-history">看历史训练结构 ↓</a></div><p class="club-hero-source">资料账户：CQUPT自邮飞翔 · 核对于 ${e(official.reviewedAt)}</p></div><figure class="club-archive-hero-photo">${localImage(latest.image,'',latest.title)}<figcaption><span>2026.03</span><strong>清远马拉松高校联赛 · 全国第六</strong><a href="${e(latest.source)}" ${external}>公众号原文 ↗</a></figcaption></figure></div></section><section class="container club-proof"><div class="club-proof-copy"><p class="section-overline">跑团是谁</p><h2>在校生与校友，<br>因为长跑重新聚在一起。</h2><p>${e(about.summary)}</p><p>这条信息来自2025年秋季招新文章。本站据此补全“自邮飞翔”的队伍构成，但不把当时的成绩门槛、二维码、手机号或截止日期继续当作当前招新信息。</p><a class="official-source" href="${e(about.source)}" ${external}>查看原始介绍 ↗</a></div><figure class="club-proof-photo">${localImage('2025-test-team','','太极运动场5公里测试后跑团合影')}<figcaption>太极运动场 · 2025年九月5K测试资料照</figcaption></figure></section><section class="club-record-strip"><div class="container">${[['2024.05','首次接力出征','第20名'],['2025.03','清远高校联赛','西南地区第1'],['2026.03','清远高校联赛','全国第6']].map(([date,label,value]) => `<div><time>${date}</time><span>${label}</span><strong>${value}</strong></div>`).join('')}</div></section><section class="container club-timeline-section" id="timeline" aria-labelledby="timeline-title"><div class="section-heading"><div><p class="section-overline">2024 — 2026</p><h2 id="timeline-title">跑团足迹</h2><p class="section-description">按公众号发布时间倒序整理；每条记录都可回到原文。</p></div><div class="club-year-filter" role="group" aria-label="筛选跑团足迹年份" hidden><button data-club-year="all" aria-pressed="true">全部</button><button data-club-year="2026" aria-pressed="false">2026</button><button data-club-year="2025" aria-pressed="false">2025</button><button data-club-year="2024" aria-pressed="false">2024</button></div></div><p id="club-filter-status" class="sr-only" role="status" aria-live="polite">显示 ${official.posts.length} 条跑团记录</p><div class="club-timeline">${official.posts.map(archiveCard).join('')}</div></section><section class="club-training-history" id="training-history"><div class="container"><div class="club-training-history-heading"><div><p class="section-overline">训练档案 · 2025</p><h2>一周怎么练，公众号曾经这样记录。</h2></div><p>${e(training.notice)}</p></div><div class="club-training-history-grid">${training.items.map(item => `<div><time>${e(item.day)}</time><span>${e(item.time)}</span><strong>${e(item.type)}</strong><p>${e(item.detail)}</p></div>`).join('')}</div><div class="club-training-history-foot"><p>${e(training.place)}</p><div><a href="science/training.html">看科学跑步 · 训练方法 →</a><a href="${e(training.source)}" ${external}>查看历史公告原文 ↗</a></div></div></div></section><section class="container club-source-ledger" id="sources"><div class="section-heading"><div><p class="section-overline">原始资料</p><h2>8篇公众号文章</h2></div><span>历史记录，不代替当前通知</span></div><div class="club-source-ledger-list">${official.posts.map(post => `<a href="${e(post.source)}" ${external}><time>${post.published.replaceAll('-','.')}</time><span>${e(post.originalTitle)}</span><b>↗</b></a>`).join('')}</div><p class="club-rights-note">公众号文章与图片版权归原权利人。本站按委托方提供的公开资料进行摘要、事实整理和版式引用，不宣称公众号图片具有开放许可。旧招新二维码、手机号、个人测试成绩表及已过期截止日期未收录。</p></section></main>`;
}

function enhanceNavigation(html, filename, activeClub = false) {
  const prefix = prefixFor(filename);
  html = html.replace(/<nav id="main-nav" class="container" aria-label="主导航">[\s\S]*?<\/nav>/, nav => {
    let updated = nav;
    if (activeClub) updated = updated.replace(/ aria-current="page"/g, '');
    if (!updated.includes('>跑团足迹</a>')) {
      updated = updated.replace(/(<a href="[^"]*news\.html"[^>]*>校园赛事<\/a>)/, `<a href="${prefix}club.html"${activeClub ? ' aria-current="page"' : ''}>跑团足迹</a>$1`);
    }
    return updated;
  });
  const css = `<link rel="stylesheet" href="${prefix}assets/official.css">`;
  if (!html.includes('assets/official.css')) html = html.replace('</head>', css + `\n<script type="module" src="${prefix}assets/official.js"></script></head>`);
  html = html.replace(/(<div class="footer-links"><h2>网站导航<\/h2>)/, `$1<a href="${prefix}club.html">跑团足迹</a>`);
  return html;
}

function customizeClubHead(html) {
  const description = 'CQUPT自邮飞翔跑团公开足迹：2024—2026赛事、5K测试、校友集结与历史训练结构，资料来自CQUPT自邮飞翔公众号。';
  return html
    .replace(/<title>[^<]*<\/title>/, '<title>跑团足迹｜CQUPT自邮飞翔</title>')
    .replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`)
    .replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="跑团足迹｜CQUPT自邮飞翔">')
    .replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`)
    .replace(/<meta property="og:image" content="[^"]*">/, '<meta property="og:image" content="https://yhan-sun.github.io/cqupt-zyfx/media/official/2026-qingyuan-team.webp">')
    .replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://yhan-sun.github.io/cqupt-zyfx/club.html">')
    .replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://yhan-sun.github.io/cqupt-zyfx/club.html">');
}

async function htmlFiles(directory, prefix = '') {
  const result = [];
  for (const entry of await readdir(directory, {withFileTypes:true})) {
    if (entry.name === '404.html') continue;
    if (entry.isDirectory()) {
      if (['assets','media'].includes(entry.name)) continue;
      result.push(...await htmlFiles(path.join(directory, entry.name), prefix + entry.name + '/'));
    } else if (entry.name.endsWith('.html')) result.push(prefix + entry.name);
  }
  return result;
}

export async function buildOfficialArchive() {
  const originalIndex = await readFile(path.join(dist, 'index.html'), 'utf8');
  const mainStart = originalIndex.indexOf('<main id="main">');
  const mainEnd = originalIndex.lastIndexOf('</main>');
  if (mainStart < 0 || mainEnd < mainStart) throw new Error('Homepage main boundary changed');
  let club = originalIndex.slice(0, mainStart) + archiveMain() + originalIndex.slice(mainEnd + 7);
  club = customizeClubHead(club);
  club = enhanceNavigation(club, 'club.html', true);
  await writeFile(path.join(dist, 'club.html'), club);

  const files = await htmlFiles(dist);
  for (const filename of files) {
    if (filename === 'club.html') continue;
    const filepath = path.join(dist, filename);
    let html = await readFile(filepath, 'utf8');
    html = enhanceNavigation(html, filename, false);
    if (filename === 'index.html') {
      html = html.replace('<section class="container section science-entry"', homeSection() + '<section class="container section science-entry"');
      html = html.replace('<p>这里汇集校园跑步资讯、场地资料与参与指引，方便重邮同学了解跑步活动、认识跑友。</p><p>无论是课后的操场慢跑，还是准备一场校园比赛，都可以从了解协会、确认活动安排开始。</p>', `<p>${e(official.about.summary)}</p><p>从太极运动场的集体测试，到高校联赛和城市马拉松，公众号记录让这支队伍有了可追溯的真实足迹。</p><p class="about-source-note"><a href="${e(official.about.source)}" ${external}>来源：CQUPT自邮飞翔 · 2025.10.20 ↗</a></p>`);
      html = html.replace('<a class="plain-link" href="news.html">查看校园赛事</a>', '<a class="plain-link" href="club.html">查看跑团足迹</a>');
    }
    if (filename === 'science/training.html') html = html.replace('<nav class="sc-toc"', trainingArchive('../') + '<nav class="sc-toc"');
    if (filename === 'sources.html') html = html.replace('<section><h2>使用与隐私说明</h2>', sourceSection() + '<section><h2>使用与隐私说明</h2>');
    await writeFile(filepath, html);
  }
  return ['club.html'];
}
