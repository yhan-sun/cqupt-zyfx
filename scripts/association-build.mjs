import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
const data=JSON.parse(await readFile(path.join(root,'data/association.json'),'utf8'));
const e=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const external='target="_blank" rel="noopener noreferrer"';
const mediaMap=Object.fromEntries(data.media.map(item=>[item.id,item]));
const img=(id,{prefix='',eager=false}={})=>{const m=mediaMap[id];if(!m)throw new Error('Missing association media '+id);return `<img src="${prefix}media/association/${m.filename}" width="${m.width}" height="${m.height}" alt="${e(m.alt)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''} data-running-photo="${id}" data-association-image="${id}">`;};

async function htmlFiles(dir,prefix=''){
  const out=[];
  for(const item of await readdir(dir,{withFileTypes:true})){
    if(item.name==='media'||item.name==='assets')continue;
    if(item.isDirectory())out.push(...await htmlFiles(path.join(dir,item.name),prefix+item.name+'/'));
    else if(item.name.endsWith('.html'))out.push(prefix+item.name);
  }
  return out;
}
const prefixFor=file=>'../'.repeat(Math.max(0,file.split('/').length-1));
function setAssociationNav(html,file){
  const prefix=prefixFor(file);
  html=html.replace(/<a href="[^"]*(?:#about|about\.html)"(?: aria-current="page")?>协会介绍<\/a>/g,`<a href="${prefix}about.html"${file==='about.html'?' aria-current="page"':''}>协会介绍</a>`);
  if(file==='about.html')html=html.replace(/<a href="[^"]+" aria-current="page">(首页|赛事与足迹|跑步影像|科学跑步|加入我们)<\/a>/g,(m,label)=>`<a href="${({首页:prefix+'./','赛事与足迹':prefix+'club.html','跑步影像':prefix+'gallery.html','科学跑步':prefix+'science.html','加入我们':prefix+'join.html'})[label]}">${label}</a>`);
  return html;
}
function setHead(html,title,description,url){
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${e(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${e(description)}">`)
    .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${e(title)}">`)
    .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${e(description)}">`)
    .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`)
    .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`);
  if(!html.includes('assets/about.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/about.css"></head>');
  return html;
}
function replaceMain(html,main){const start=html.indexOf('<main id="main"');const end=html.lastIndexOf('</main>');if(start<0||end<0)throw new Error('Main boundary changed');return html.slice(0,start)+main+html.slice(end+7);}

function aboutMain(){
  const p=data.president;
  return `<main id="main" class="association-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>协会介绍</span></div>
  <section class="association-hero"><div class="container association-hero-grid"><div class="association-hero-copy"><p class="section-overline">ABOUT US · 跑步爱好者协会</p><h1>从一圈开始，<br>跑到更远。</h1><p class="association-lead">${e(data.mission)}</p><div class="association-hero-actions"><a class="button" href="join.html">加入重邮约跑团 →</a><a href="club.html">看看我们跑过什么 →</a></div><div class="association-hero-tags"><span>重邮约跑团</span><span>自邮飞翔</span><span>不同水平都欢迎</span></div></div><figure class="association-hero-photo">${img('captain-hu-run',{eager:true})}<figcaption>协会提供 · 会长胡钢在田径场奔跑</figcaption></figure></div></section>
  <section class="container association-intro" aria-labelledby="association-intro-title"><div><p class="section-overline">我们是谁</p><h2 id="association-intro-title">跑步不是少数人的成绩单。</h2><p>有人刚开始尝试两公里，有人在准备下一场半马，也有人把操场训练当作一天里最放松的时刻。协会更希望把这些不同起点的人连接起来，让跑步在重邮校园里成为可以交流、可以陪伴、也可以长期坚持的事情。</p></div><div class="association-principles">${data.principles.map((item,index)=>`<article><span>0${index+1}</span><h3>${e(item.title)}</h3><p>${e(item.text)}</p></article>`).join('')}</div></section>
  <section class="association-story-band"><div class="container association-story"><div class="association-story-photos"><figure>${img('captain-hu-li-run')}<figcaption>田径场上的同行 · 协会提供</figcaption></figure><figure>${img('2025-campus-games-cai')}<figcaption>校运会赛道影像 · 协会提供</figcaption></figure></div><div class="association-story-copy"><p class="section-overline">会长的话</p><h2>${e(p.name)} · ${e(p.grade)}</h2><p class="association-role">${e(p.role)} · 从 ${p.runningSince} 年开始跑步</p><p>${e(p.story)}</p><blockquote>“${e(p.quote)}”</blockquote><p class="association-context">这是会长的个人跑步经历，不代表每个人都需要以半程马拉松为目标。官网更鼓励按自己的身体状态和训练经验循序渐进。</p></div></div></section>
  <section class="container association-scenes" aria-labelledby="association-scenes-title"><div class="section-heading"><div><p class="section-overline">从校园到赛场</p><h2 id="association-scenes-title">一起训练，也一起去看看更远的路。</h2><p class="section-description">以下均为协会本次提供的活动与跑步影像；只描述已知场景，不凭照片补写个人成绩。</p></div><a class="more" href="gallery.html#association-supplied">去跑步影像看全部 →</a></div><div class="association-scene-grid"><figure>${img('2025-hundred-miles-southwest')}<figcaption><strong>高校百英里 · 西南分站</strong><span>校旗、自邮飞翔旗帜与团队集结</span></figcaption></figure><figure>${img('2025-changjiahui-team')}<figcaption><strong>长嘉汇 · 城市跑步</strong><span>跑步之外，也有城市里的同行</span></figcaption></figure><figure>${img('2026-qingyuan-campus-talk')}<figcaption><strong>清远马拉松 · 校内交流</strong><span>赛前信息和经验也值得一起分享</span></figcaption></figure></div></section>
  <section class="association-school-band"><div class="container association-school-grid"><div><p class="section-overline">校园田径背景 · 官方成绩册</p><h2>${e(data.schoolAthletics.title)}</h2><p>${e(data.schoolAthletics.note)}</p><a href="${e(data.schoolAthletics.source)}" ${external}>${e(data.schoolAthletics.sourceName)} ↗</a></div><div class="association-school-facts">${data.schoolAthletics.facts.map(f=>`<div><strong>${e(f.value)}</strong><span>${e(f.label)}</span><small>${e(f.detail)}</small></div>`).join('')}</div><figure>${img('2026-cq-college-track-team')}<figcaption>重庆邮电大学参赛队现场资料 · 协会提供</figcaption></figure><figure class="association-awards-photo">${img('2026-cq-college-track-awards')}<figcaption>赛事奖状现场资料 · 协会提供</figcaption></figure></div></section>
  <section class="container association-join"><div><p class="section-overline">下一次，可以一起跑</p><h2>不需要先成为“跑得很快的人”。</h2><p>先从认识跑友、一次校园慢跑或一次打卡开始。当前 QQ 群号、二维码和参与说明统一放在加入页面，避免历史招新信息与现在混在一起。</p></div><a class="button" href="join.html">查看加入方式 →</a></section></main>`;
}

function homeAbout(){return `<section class="about-band association-home-about" id="about" aria-labelledby="about-title"><div class="container association-home-grid"><figure>${img('captain-hu-li-run')}<figcaption>协会提供 · 田径场跑步影像</figcaption></figure><div><p class="section-overline">协会介绍</p><h2 id="about-title">有人从一圈就气喘开始，<br>也有人正在准备下一场比赛。</h2><p>${e(data.mission)}</p><p>会长胡钢在自述中说，自己也是从没有运动基础开始。协会希望做的，不是用配速筛选跑者，而是让不同阶段的人都能找到一起跑的人。</p><div class="about-actions"><a class="button" href="about.html">完整认识协会 →</a><a class="plain-link" href="join.html">加入约跑团</a></div></div></div></section>`;}

function clubSupplement(){return `<section class="association-club-supplement" id="member-scenes"><div class="container"><div class="section-heading"><div><p class="section-overline">协会提供资料</p><h2>训练、交流与赛场之外的相遇。</h2><p class="section-description">补充公众号档案之外的协会自有影像。学校层面的田径成绩单独标注，不混作协会成绩。</p></div><a class="more" href="about.html">认识协会 →</a></div><div class="association-club-grid"><article><figure>${img('2025-changjiahui-medals')}</figure><div><span>2025 · 城市跑步</span><h3>跑完之后，也要留下合影。</h3><p>奖牌是一次活动的纪念，更重要的是一起训练、一起出发的人。</p></div></article><article><figure>${img('2026-qingyuan-campus-talk')}</figure><div><span>2026 · 校内交流</span><h3>比赛之前，先把信息讲清楚。</h3><p>校内宣讲和经验交流把赛事从“一个人的报名”变成可以共同准备的过程。</p></div></article><article><figure>${img('2026-cq-college-track-team')}</figure><div><span>2026 · 学校田径</span><h3>校园里也有更专业的田径舞台。</h3><p>这是重庆邮电大学参加重庆市大学生田径比赛的学校层面资料，不等同于协会战绩。</p><a href="about.html#school-athletics">查看官方成绩边界 →</a></div></article></div></div></section>`;}

function associationGalleryCards(){
  const labels={people:'人物',training:'校园训练',race:'校外赛事',school:'学校田径',community:'跑友交流',campus:'校内赛道'};
  return data.media.map((m,index)=>`<article class="culture-gallery-card association-gallery-card" data-gallery-page-item data-category="association"><a href="about.html" data-gallery-photo="${m.id}" aria-label="查看${e(m.title)}大图">${img(m.id)}<span>A${String(index+1).padStart(2,'0')}</span></a><div><p>${m.year} · ${labels[m.category]||'协会资料'}</p><h2>${e(m.title)}</h2><p>协会本次提供的跑步与活动资料，用于补充自邮飞翔公众号档案之外的真实场景。</p><a href="about.html">了解协会 →</a></div></article>`).join('');
}
function augmentGallery(html){
  const marker='<div class="culture-gallery-grid">';
  const pos=html.indexOf(marker);
  if(pos<0)throw new Error('Gallery grid boundary changed');
  const insert=pos+marker.length;
  html=html.slice(0,insert)+associationGalleryCards()+html.slice(insert);
  html=html.replace('<button data-gallery-page-filter="all" aria-pressed="true">全部</button>', '<button data-gallery-page-filter="all" aria-pressed="true">全部</button><button data-gallery-page-filter="association" aria-pressed="false">协会提供</button>');
  html=html.replace('张跑团公众号影像</span>','张跑团公众号影像</span><span><strong>9</strong> 张协会提供影像</span>');
  const match=html.match(/<script type="application\/json" id="running-gallery-data">([\s\S]*?)<\/script>/);
  if(!match)throw new Error('Gallery data missing');
  const current=JSON.parse(match[1]);
  const added=data.media.map(m=>({id:m.id,src:`media/association/${m.filename}`,title:m.title,credit:'协会提供 · 本网站资料',source:'about.html'}));
  html=html.replace(match[0],`<script type="application/json" id="running-gallery-data">${JSON.stringify([...added,...current]).replaceAll('<','\\u003c')}</script>`);
  html=html.replace('<div class="culture-gallery-grid">','<div id="association-supplied"></div><div class="culture-gallery-grid">');
  return html;
}

export async function buildAssociationProfile(){
  const base=await readFile(path.join(dist,'index.html'),'utf8');
  let about=replaceMain(base,aboutMain());
  about=setHead(about,'协会介绍 · 重庆邮电大学跑步爱好者协会','认识重邮约跑团与自邮飞翔：协会初心、会长跑步故事、校园训练、协会提供影像与学校田径背景。','https://yhan-sun.github.io/cqupt-zyfx/about.html');
  about=setAssociationNav(about,'about.html');
  await writeFile(path.join(dist,'about.html'),about);

  let home=base.replace(/<section class="about-band" id="about"[\s\S]*?<\/section>/,homeAbout());
  if(home===base)throw new Error('Homepage about section boundary changed');
  await writeFile(path.join(dist,'index.html'),home);

  let club=await readFile(path.join(dist,'club.html'),'utf8');
  const timeline='<section class="container culture-timeline"';
  const t=club.indexOf(timeline);if(t<0)throw new Error('Club timeline boundary changed');
  club=club.slice(0,t)+clubSupplement()+club.slice(t);
  await writeFile(path.join(dist,'club.html'),club);

  let gallery=await readFile(path.join(dist,'gallery.html'),'utf8');
  gallery=augmentGallery(gallery);
  await writeFile(path.join(dist,'gallery.html'),gallery);

  for(const file of await htmlFiles(dist)){
    const full=path.join(dist,file);
    let html=await readFile(full,'utf8');
    const next=setAssociationNav(html,file);
    if(next!==html)await writeFile(full,next);
  }
  return ['about.html'];
}
