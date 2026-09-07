import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist');
const join = JSON.parse(await readFile(path.join(root, 'data/join.json'), 'utf8'));
const e = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external = 'target="_blank" rel="noopener noreferrer"';

const prefixFor = filename => '../'.repeat(Math.max(0, filename.split('/').length - 1));
const qr = prefix => `<figure class="join-qr-card"><div class="join-qr-heading"><span>${e(join.groupName)}</span><strong>QQ群 ${e(join.groupNumber)}</strong></div><a href="${e(join.joinUrl)}" ${external} aria-label="在QQ中打开重邮约跑团加群入口"><img src="${prefix}${e(join.qrImage)}" width="560" height="560" alt="重邮约跑团QQ群二维码，群号${e(join.groupNumber)}" loading="lazy" decoding="async" data-join-qr></a><figcaption><span>扫码加入群聊</span><small>手机可点二维码打开 QQ；也可搜索群号 ${e(join.groupNumber)}</small></figcaption></figure>`;
const copyControl = (compact = false) => `<div class="join-copy-row${compact ? ' join-copy-row-compact' : ''}"><span><small>QQ群号</small><strong>${e(join.groupNumber)}</strong></span><button type="button" data-copy-group="${e(join.groupNumber)}" hidden>复制群号</button></div><p class="join-copy-status" role="status" aria-live="polite"></p>`;
const directJoin = (label = '在 QQ 中打开加群') => `<a class="button join-direct-button" href="${e(join.joinUrl)}" ${external}>${e(label)} <span aria-hidden="true">↗</span></a>`;
const activityCards = () => join.activities.map((item, index) => `<article class="join-activity"><span>${String(index + 1).padStart(2,'0')}</span><div><h3>${e(item.title)}</h3><p>${e(item.summary)}</p></div></article>`).join('');

function homeJoin() {
  return `<section class="home-join-band" id="join" aria-labelledby="join-title"><div class="container"><div class="home-join-heading"><div><p class="section-overline">加入约跑团</p><h2 id="join-title">在重邮，找到一起跑的人。</h2><p>${e(join.purpose)}。${e(join.description)}</p></div><a class="more" href="join.html">完整加入说明 <span aria-hidden="true">→</span></a></div><div class="home-join-grid"><div class="home-join-activities"><div class="home-join-activity-intro"><strong>交流 · 打卡 · 训练 · 参赛</strong><p>不要求每个人都跑得快。先从适合自己的距离和节奏开始，再决定是否参加集体活动或校外赛事。</p></div>${activityCards()}<p class="join-current-note">${e(join.currentNotice)}</p></div><div class="home-join-qr">${qr('')}${copyControl(true)}${directJoin()}<a class="join-guide-link" href="join.html">查看加入与参与说明 →</a></div></div><div class="home-join-faq" id="faq"><details><summary>刚开始跑步，可以进群交流吗？<span aria-hidden="true">＋</span></summary><p>可以把群作为跑步交流入口。是否参加某次线下活动，请结合自己的健康状况、跑步经验和活动说明决定；具体入群审核以群管理员为准。</p></details><details><summary>平时在哪里跑、什么时候集合？<span aria-hidden="true">＋</span></summary><p>跑团鼓励校内跑步打卡，也会不定期交流或组织活动。具体时间、集合点和配速安排以群内当期通知为准，网站不发布未经确认的固定课表。</p></details><details><summary>可以一起参加校外马拉松吗？<span aria-hidden="true">＋</span></summary><p>有合适机会时可以在群内交流赛事、报名和同行信息。赛事是否成行、报名资格、名额和费用，以赛事主办方规则和群内实际组织情况为准。</p></details></div></div></section>`;
}

function joinMain() {
  return `<main id="main" class="join-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>加入我们</span></div><section class="join-hero"><div class="container join-hero-grid"><div class="join-hero-copy"><p class="join-eyebrow">重邮约跑团 · QQ跑步交流平台</p><h1>一起跑，<br>也一起把跑步坚持下去。</h1><p class="join-lead">${e(join.purpose)}</p><p>${e(join.description)}</p><div class="join-hero-actions">${directJoin('打开 QQ 加群')}<a href="#activities">先看看平时做什么</a></div><p class="join-reviewed">群信息由${e(join.source)} · 核对于 ${e(join.reviewedAt)}</p></div><div class="join-hero-qr" id="join-qr">${qr('')}${copyControl()}</div></div></section><section class="container join-purpose" id="activities"><div class="join-section-heading"><p class="section-overline">平时做什么</p><h2>跑步交流，不只有“约一个配速”。</h2><p>从校园里的日常打卡，到训练经验和赛事同行，参与方式可以很轻，也可以随着自己的目标逐步增加。</p></div><div class="join-activity-grid">${activityCards()}</div></section><section class="join-steps-band"><div class="container join-steps-grid"><div><p class="section-overline">怎么加入</p><h2>三步就够。</h2></div><ol><li><span>01</span><div><h3>扫码、点开链接或搜索群号</h3><p>扫描本页二维码，手机也可以直接打开 QQ 加群入口；如果入口失效，搜索群号 <strong>${e(join.groupNumber)}</strong>。</p></div></li><li><span>02</span><div><h3>先看群公告和当期通知</h3><p>确认群规、活动时间、集合点、距离和配速分组，不把网站里的历史训练记录当作当前安排。</p></div></li><li><span>03</span><div><h3>按自己的状态参与</h3><p>新手可以先交流、打卡或参加更轻松的活动；有训练和参赛目标的同学再逐步加入相应内容。</p></div></li></ol></div></section><section class="container join-fit"><div class="join-section-heading"><p class="section-overline">适合怎么参与</p><h2>不同阶段，都可以找到自己的入口。</h2></div><div class="join-fit-grid"><div><strong>刚开始跑</strong><p>先把校内慢跑和规律打卡建立起来，不需要为了跟队而硬追更快的配速。</p><a href="science.html">从科学跑步入门 →</a></div><div><strong>想稳定训练</strong><p>交流轻松跑、长距离、节奏和力量训练，理解训练目的再安排自己的计划。</p><a href="science/training.html">看常用训练方法 →</a></div><div><strong>准备参加比赛</strong><p>关注赛事规则、交通住宿和补给，也可以和有经验的跑友交流，但报名与参赛责任仍由个人确认。</p><a href="club.html">看跑团公开足迹 →</a></div><div><strong>只是想认识跑友</strong><p>从聊天、打卡和一次轻松约跑开始也完全可以。跑步交流平台不等于竞技队选拔。</p><a href="./#running">查看校园跑步场景 →</a></div></div></section><section class="join-note-band"><div class="container"><div><p class="section-overline">当前信息边界</p><h2>群是真的，活动时间要看当期通知。</h2></div><p>${e(join.currentNotice)} ${e(join.audience)}</p></div></section><section class="container join-faq" id="faq"><div class="join-section-heading"><p class="section-overline">常见问题</p><h2>加入前，再确认这些。</h2></div><div class="faq-list"><details><summary>二维码扫不了怎么办？<span aria-hidden="true">＋</span></summary><p>可以直接打开本页的 QQ 加群入口，或者在 QQ 搜索群号 ${e(join.groupNumber)}。如果这些方式都无法找到，说明群信息可能已经更新，请以后续跑团通知为准。</p></details><details><summary>新手或配速比较慢，可以加入吗？<span aria-hidden="true">＋</span></summary><p>这个入口用于跑步交流，不在网站设置配速门槛。参加具体活动时，应先确认距离、配速分组和收尾安排，并按自己能安全完成的节奏参与。</p></details><details><summary>跑团有固定训练时间吗？<span aria-hidden="true">＋</span></summary><p>本站不把历史公告里的训练时间当成当前固定课表。跑团不定期组织交流活动，具体训练、约跑或集合安排以群内当期通知为准。</p></details><details><summary>会一起报名马拉松吗？<span aria-hidden="true">＋</span></summary><p>有机会一起交流和报名校外马拉松赛事，但不代表每场赛事都会统一组织。报名资格、费用、名额和赛事风险提示以主办方规则为准。</p></details><details><summary>网站会收集我的报名资料吗？<span aria-hidden="true">＋</span></summary><p>不会。本网站没有入群申请表或报名后台。扫码、打开 QQ 加群入口或搜索群号后，后续入群流程由 QQ 和群管理员处理。</p></details></div></section><section class="container join-bottom"><div><p class="section-overline">准备好了</p><h2>QQ 群 ${e(join.groupNumber)}</h2><p>扫码、打开 QQ 加群入口，或者复制群号搜索。</p></div><div>${copyControl()}${directJoin('打开 QQ 加群')}</div></section></main>`;
}

function sourceSection() {
  return `<section class="join-source-section" id="join-source"><h2>加入跑团信息</h2><p>重邮约跑团 QQ 群号 <strong>${e(join.groupNumber)}</strong>、“为重邮学子搭建的跑步交流平台”等参与说明，以及用于加入该群的二维码由跑团提供，本站于 ${e(join.reviewedAt)} 核对后发布。提供的二维码可解析为 QQ 加群链接 <a href="${e(join.joinUrl)}" ${external}>打开入口 ↗</a>；站内二维码以同一链接重新生成可缩放 SVG，避免外部图片热链和压缩损坏。</p><p>这一入口与历史公众号招新资料分开维护：旧招新截止日期、旧二维码、成绩门槛和历史训练时间不会自动沿用。当前活动频率、集合地点、赛事报名和群规以群内当期通知为准。</p></section>`;
}

function customizeHead(html) {
  const description = '加入重邮约跑团 QQ 群。面向重邮学子的跑步交流、校园打卡、训练分享和赛事同行入口。';
  html = html.replace(/<title>[^<]*<\/title>/, '<title>加入重邮约跑团｜重庆邮电大学跑步爱好者协会</title>');
  html = html.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${description}">`);
  html = html.replace(/<meta property="og:title" content="[^"]*">/, '<meta property="og:title" content="加入重邮约跑团">');
  html = html.replace(/<meta property="og:description" content="[^"]*">/, `<meta property="og:description" content="${description}">`);
  html = html.replace(/<meta property="og:url" content="[^"]*">/, '<meta property="og:url" content="https://yhan-sun.github.io/cqupt-zyfx/join.html">');
  html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="https://yhan-sun.github.io/cqupt-zyfx/join.html">');
  return html;
}

function enhanceJoinNavigation(html, filename, activeJoin = false) {
  const prefix = prefixFor(filename);
  html = html.replace(/<nav id="main-nav" class="container" aria-label="主导航">[\s\S]*?<\/nav>/, nav => {
    let updated = nav;
    if (activeJoin) updated = updated.replace(/ aria-current="page"/g, '');
    updated = updated.replace(/<a href="[^"]*(?:#join|join\.html)"([^>]*)>加入我们<\/a>/, `<a href="${prefix}join.html"$1${activeJoin ? ' aria-current="page"' : ''}>加入我们</a>`);
    return updated;
  });
  if (!html.includes('assets/join.css')) html = html.replace('</head>', `<link rel="stylesheet" href="${prefix}assets/join.css"></head>`);
  if (!html.includes('assets/join.js')) html = html.replace('</body>', `<script type="module" src="${prefix}assets/join.js"></script></body>`);
  const sourceLink = `<a href="${prefix}sources.html">图片与资料来源</a>`;
  if (html.includes(sourceLink) && !html.includes(`href="${prefix}join.html">加入跑团</a>`)) html = html.replace(sourceLink, `<a href="${prefix}join.html">加入跑团</a>${sourceLink}`);
  if (['index.html','club.html','science.html','news.html'].includes(filename) && !html.includes('mobile-join-dock')) html = html.replace('</body>', `<a class="mobile-join-dock" href="${prefix}join.html"><span>加入约跑团</span><small>QQ ${e(join.groupNumber)}</small></a></body>`);
  return html;
}

async function htmlFiles(directory, prefix = '') {
  const names = [];
  for (const item of await readdir(directory, {withFileTypes:true})) {
    if (item.isDirectory()) names.push(...await htmlFiles(path.join(directory, item.name), prefix + item.name + '/'));
    else if (item.name.endsWith('.html')) names.push(prefix + item.name);
  }
  return names;
}

export async function buildJoinExperience() {
  const indexPath = path.join(dist, 'index.html');
  const index = await readFile(indexPath, 'utf8');
  const mainStart = index.indexOf('<main id="main">');
  const mainEnd = index.lastIndexOf('</main>');
  if (mainStart < 0 || mainEnd < mainStart) throw new Error('Homepage main boundary changed before join page generation');
  let joinPage = index.slice(0, mainStart) + joinMain() + index.slice(mainEnd + 7);
  joinPage = customizeHead(joinPage);
  await writeFile(path.join(dist, 'join.html'), joinPage);

  for (const filename of await htmlFiles(dist)) {
    const filepath = path.join(dist, filename);
    let html = await readFile(filepath, 'utf8');
    if (filename === 'index.html') {
      html = html.replaceAll('href="#join"', 'href="join.html"');
      const start = html.indexOf('<section class="container section join-section" id="join"');
      const end = html.indexOf('<dialog class="photo-dialog"', start);
      if (start < 0 || end < start) throw new Error('Homepage join section boundary changed');
      html = html.slice(0, start) + homeJoin() + '\n    ' + html.slice(end);
    }
    if (filename === 'sources.html' && !html.includes('id="join-source"')) html = html.replace('<section><h2>使用与隐私说明</h2>', sourceSection() + '<section><h2>使用与隐私说明</h2>');
    html = enhanceJoinNavigation(html, filename, filename === 'join.html');
    await writeFile(filepath, html);
  }
  return ['join.html'];
}
