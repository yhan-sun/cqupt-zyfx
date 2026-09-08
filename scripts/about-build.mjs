import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
const association=JSON.parse(await readFile(path.join(root,'data/association.json'),'utf8'));
const photos=JSON.parse(await readFile(path.join(root,'data/association-media.json'),'utf8'));
const photoMap=Object.fromEntries(photos.map(item=>[item.id,item]));
const e=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const external='target="_blank" rel="noopener noreferrer"';
const prefixFor=filename=>'../'.repeat(Math.max(0,filename.split('/').length-1));
const photo=(id,{prefix='',alt=null,eager=false,className=''}={})=>{
  const item=photoMap[id];
  if(!item)throw new Error('Missing association photo '+id);
  return `<img src="${prefix}assets/photos/${id}.webp" width="${item.width}" height="${item.height}" alt="${e(alt??item.title)}" class="${e(className)}" loading="${eager?'eager':'lazy'}" decoding="async"${eager?' fetchpriority="high"':''} data-running-photo="association-${id}">`;
};

function replaceMain(html,main){
  const start=html.indexOf('<main id="main"');
  const end=html.lastIndexOf('</main>');
  if(start<0||end<start)throw new Error('Main boundary changed');
  return html.slice(0,start)+main+html.slice(end+7);
}
function replaceSection(html,startNeedle,replacement){
  const start=html.indexOf(startNeedle);
  if(start<0)throw new Error('Section not found: '+startNeedle);
  const end=html.indexOf('</section>',start);
  if(end<0)throw new Error('Section end not found: '+startNeedle);
  return html.slice(0,start)+replacement+html.slice(end+10);
}
function setHead(html,{title,description,canonical}){
  html=html.replace(/<title>[^<]*<\/title>/,`<title>${e(title)}</title>`);
  html=html.replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${e(description)}">`);
  html=html.replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${e(title)}">`);
  html=html.replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${e(description)}">`);
  html=html.replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${e(canonical)}">`);
  html=html.replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${e(canonical)}">`);
  return html;
}
function ensureCss(html,prefix=''){
  if(!html.includes('assets/about.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}assets/about.css"></head>`);
  return html;
}
function activeKey(filename){
  if(filename==='index.html')return'home';
  if(filename==='about.html')return'about';
  if(filename==='club.html'||filename==='news.html'||filename.startsWith('news/'))return'events';
  if(filename==='gallery.html')return'gallery';
  if(filename==='science.html'||filename.startsWith('science/'))return'science';
  if(filename==='join.html')return'join';
  return'';
}
function navigation(html,filename){
  const prefix=prefixFor(filename),active=activeKey(filename);
  const links=[['首页',`${prefix}./`,'home'],['协会介绍',`${prefix}about.html`,'about'],['赛事与足迹',`${prefix}club.html`,'events'],['跑步影像',`${prefix}gallery.html`,'gallery'],['科学跑步',`${prefix}science.html`,'science'],['加入我们',`${prefix}join.html`,'join']];
  html=html.replace(/<nav id="main-nav" class="container" aria-label="主导航">[\s\S]*?<\/nav>/,`<nav id="main-nav" class="container" aria-label="主导航">${links.map(([label,href,key])=>`<a href="${href}"${active===key?' aria-current="page"':''}>${label}</a>`).join('')}</nav>`);
  html=html.replace(/<div class="footer-links"><h2>网站导航<\/h2>[\s\S]*?<\/div>/,`<div class="footer-links"><h2>网站导航</h2><a href="${prefix}about.html">协会介绍</a><a href="${prefix}club.html">赛事与足迹</a><a href="${prefix}gallery.html">跑步影像</a><a href="${prefix}science.html">科学跑步</a><a href="${prefix}join.html">加入约跑团</a><a href="${prefix}sources.html">资料来源</a></div>`);
  return html;
}

function aboutMain(){
  const meet=association.campusContext.trackMeet2026;
  return `<main id="main" class="association-page"><div class="breadcrumbs container"><a href="./">首页</a><span> / </span><span>协会介绍</span></div><header class="about-hero"><div class="container about-hero-grid"><div class="about-hero-copy"><p class="about-eyebrow">ABOUT ZYFX · 协会介绍</p><h1>从一圈开始，<br>跑成一群人。</h1><p class="about-lead">${e(association.name)}，也常以「重邮约跑团 / 自邮飞翔」和大家见面。</p><p>${e(association.purpose)}。${e(association.description)}</p><div class="about-hero-actions"><a class="button" href="join.html">加入约跑团 →</a><a href="club.html">看我们跑过什么</a></div><div class="about-hero-tags"><span>校园跑步交流</span><span>不定期活动</span><span>训练分享</span><span>赛事同行</span></div></div><div class="about-hero-visual"><figure>${photo('track-training-duo',{eager:true})}<figcaption>太极运动场 · 协会提供资料图</figcaption></figure><figure>${photo('changjiahui-team-2025',{eager:true})}<figcaption>2025 · 跑友城市跑步记录</figcaption></figure></div></div></header><section class="container about-purpose"><div class="about-section-heading"><p class="section-overline">为什么在这里</p><h2>一个让不同水平都能找到入口的跑步社区。</h2><p>跑步可以很认真，也可以先从一圈、一场轻松约跑、一次打卡开始。</p></div><div class="about-principles">${association.principles.map((item,index)=>`<article><span>${String(index+1).padStart(2,'0')}</span><h3>${e(item.title)}</h3><p>${e(item.text)}</p></article>`).join('')}</div></section><section class="about-president-band"><div class="container about-president"><figure>${photo('track-training-solo')}<figcaption>太极运动场跑步训练 · 协会提供资料图</figcaption></figure><div class="about-president-copy"><p class="section-overline">会长寄语</p><h2>从跑一圈气喘，<br>到从容完成半程马拉松。</h2><p>${e(association.president.story)}</p><blockquote>“${e(association.president.quote)}”</blockquote><p class="about-president-sign">${e(association.president.role)} · ${e(association.president.name)}</p><a href="join.html">从交流和一次轻松跑开始 →</a></div></div></section><section class="container about-modes"><div class="about-section-heading"><p class="section-overline">我们平时怎么跑</p><h2>训练、交流、赛事，以及跑完之后的故事。</h2></div><div class="about-mode-grid"><article class="about-mode about-mode-wide"><figure>${photo('track-training-duo')}</figure><div><span>01 · 校园训练</span><h3>操场，是最日常的起点。</h3><p>校内跑步打卡、轻松跑和训练交流，都可以从太极运动场这样的熟悉场景开始。网站不发布未经确认的固定课表，具体活动看当期群通知。</p></div></article><article class="about-mode"><figure>${photo('qingyuan-campus-talk-2026')}</figure><div><span>02 · 跑友交流</span><h3>把赛道经验带回校园。</h3><p>一次校内分享、一次赛后交流，也能让跑步从个人习惯变成共同话题。</p></div></article><article class="about-mode"><figure>${photo('hundred-mile-southwest-2025')}</figure><div><span>03 · 一起出发</span><h3>去更大的赛场，也记得一起回来。</h3><p>协会资料记录了高校赛事和城市跑步的同行场景；参赛资格、报名和行程仍以赛事规则与实际组织为准。</p></div></article><article class="about-mode"><figure>${photo('changjiahui-medals-2025')}</figure><div><span>04 · 共同完成</span><h3>奖牌是结果，陪伴也是。</h3><p>完赛之后的合影、奖牌和聊天，是很多跑步记忆真正留下来的部分。</p></div></article></div></section><section class="about-campus-band"><div class="container about-campus-grid"><div class="about-campus-copy"><p class="section-overline">跑步在重邮</p><h2>${e(association.campusContext.title)}</h2><p>${e(association.campusContext.text)}</p><div class="about-school-results"><div><strong>第1名 · 85分</strong><span>2026重庆市大学生田径比赛 · 甲组女团体</span></div><div><strong>第6名 · 50.5分</strong><span>2026重庆市大学生田径比赛 · 甲组男团体</span></div><div><strong>体育道德风尚奖</strong><span>重庆邮电大学 · 集体</span></div></div><p class="about-scope">${e(meet.scope)}</p><div class="about-source-links"><a href="${e(meet.source)}" ${external}>重庆市教委成绩册 ↗</a><a href="https://tyxy.cqupt.edu.cn/" ${external}>重庆邮电大学体育学院 ↗</a><a href="https://xcb.cqupt.edu.cn/" ${external}>学校校园体育动态 ↗</a></div></div><div class="about-campus-photos"><figure>${photo('chongqing-college-track-team-2026')}<figcaption>2026重庆市大学生田径比赛 · 学校代表队资料</figcaption></figure><figure>${photo('campus-womens-race-2025')}<figcaption>校运会女子跑步比赛 · 协会提供资料图</figcaption></figure><figure>${photo('chongqing-college-track-awards-2026')}<figcaption>2026重庆市大学生田径比赛 · 奖状记录</figcaption></figure></div></div></section><section class="container about-archive"><div class="about-section-heading"><p class="section-overline">继续了解</p><h2>从协会是谁，到我们真正跑过什么。</h2></div><div class="about-archive-grid"><a href="club.html"><span>赛事与足迹</span><strong>2024—2026 公开记录</strong><p>公众号档案、训练、出征、校友与校园赛事。</p><b>→</b></a><a href="gallery.html"><span>跑步影像</span><strong>真实训练与活动照片</strong><p>协会资料、公众号影像与校园赛事分区归档。</p><b>→</b></a><a href="science.html"><span>科学跑步</span><strong>先理解，再训练</strong><p>热身、训练方法、力量、营养与恢复。</p><b>→</b></a></div></section><section class="about-cta"><div class="container"><div><p class="section-overline">下一次一起跑</p><h2>QQ群 ${e(association.join.group)}</h2><p>把群当作跑步交流入口。活动时间、集合点和配速安排以当期通知为准。</p></div><a class="button" href="join.html">查看加入说明 →</a></div></section></main>`;
}

function homeAbout(){
  return `<section class="home-about-teaser" id="about" aria-labelledby="home-about-title"><div class="container home-about-grid"><div class="home-about-visual"><figure>${photo('track-training-duo')}<figcaption>太极运动场 · 协会提供资料图</figcaption></figure><figure>${photo('track-training-solo')}<figcaption>校园跑步训练</figcaption></figure></div><div class="home-about-copy"><p class="section-overline">协会介绍</p><h2 id="home-about-title">一个人可以开始，<br>一群人更容易坚持。</h2><p>${e(association.purpose)}。这里既欢迎已经有训练目标的跑者，也欢迎还在建立第一段跑步习惯的新手。</p><p>从操场的一圈开始，到一起训练、参加活动、交流赛事经验，跑步把不同年级的人连接在一起。</p><div><a class="button" href="about.html">完整认识协会 →</a><a href="join.html">加入约跑团</a></div></div></div></section>`;
}

function clubSupplement(){
  return `<section class="association-supplement"><div class="container"><div class="section-heading"><div><p class="section-overline">协会补充资料 · 2025—2026</p><h2>公众号之外，还有这些现场。</h2><p class="section-description">以下图片由协会提供，用来补足训练、交流与赛事场景；没有可靠数据的照片不补写名次或个人成绩。</p></div><a class="more" href="about.html">认识协会 →</a></div><div class="association-supplement-grid"><article><figure>${photo('hundred-mile-southwest-2025')}</figure><div><span>2025 · 高校赛事</span><h3>高校百英里西南分站赛</h3><p>团队在赛事现场集结。这里记录同行场景，不从照片推断或补写比赛名次。</p></div></article><article><div class="association-supplement-pair"><figure>${photo('changjiahui-team-2025')}</figure><figure>${photo('changjiahui-medals-2025')}</figure></div><div><span>2025 · 城市跑步</span><h3>长嘉汇：跑完之后的合影</h3><p>跑友合照与完赛奖牌，补上赛道之外的共同记忆。</p></div></article><article><figure>${photo('qingyuan-campus-talk-2026')}</figure><div><span>2026 · 校内交流</span><h3>清远马拉松相关校内分享</h3><p>赛事经验回到校园，跑步也成为可以被分享和讨论的共同语言。</p></div></article><article><div class="association-supplement-pair"><figure>${photo('chongqing-college-track-team-2026')}</figure><figure>${photo('chongqing-college-track-awards-2026')}</figure></div><div><span>2026 · 校园体育背景</span><h3>重庆市大学生田径比赛</h3><p>重庆市教委成绩册显示，重邮获甲组女团体第1、甲组男团体第6，并获集体体育道德风尚奖。这里展示的是学校代表队成绩，不是协会成绩。</p><a href="${e(association.campusContext.trackMeet2026.source)}" ${external}>官方成绩册 ↗</a></div></article></div></div></section>`;
}

function galleryCard(item,index){
  const labels={training:'校园训练',race:'跑团活动',social:'跑友交流',campus:'校园体育'};
  return `<article class="culture-gallery-card association-gallery-card association-gallery-card-${item.category}" data-gallery-page-item data-category="${item.category}"><a href="sources.html#association-photos" data-gallery-photo="association-${item.id}" aria-label="查看${e(item.title)}大图">${photo(item.id)}<span>A${String(index+1).padStart(2,'0')}</span></a><div><p>${e(item.year)} · ${labels[item.category]}</p><h2>${e(item.title)}</h2><p>${e(item.description)}</p><a href="sources.html#association-photos">协会资料说明 →</a></div></article>`;
}
function patchGallery(html){
  const opening='<div class="culture-gallery-grid">';
  if(!html.includes(opening))throw new Error('Gallery grid changed');
  html=html.replace(opening,opening+photos.map(galleryCard).join(''));
  html=html.replace('<strong>20</strong> 张跑团公众号影像','<strong>29</strong> 张协会 / 公众号影像');
  html=html.replace('新增影像来自自邮飞翔官方公众号，保留文章日期与出处。','影像来自协会提供资料与自邮飞翔官方公众号，按训练、赛事、交流和校园体育场景分开标注。');
  html=html.replace('先看跑团自己的训练与活动。','先看协会提供的新影像与公众号档案。');
  html=html.replace('显示 26 张照片','显示 35 张照片');
  html=html.replace('公众号图片未发现开放许可，版权归原权利人；校园赛事图片的来源与权利说明见资料来源页。署名和链接不等同于开放授权。','协会提供图片用于本站建设，公开运营仍应持续确认摄影与肖像使用范围；公众号图片未发现开放许可，版权归原权利人；校园赛事图片的来源与权利说明见资料来源页。署名和链接不等同于开放授权。');
  const match=html.match(/<script type="application\/json" id="running-gallery-data">([\s\S]*?)<\/script>/);
  if(!match)throw new Error('Gallery data changed');
  const current=JSON.parse(match[1]);
  const supplied=photos.map(item=>({id:`association-${item.id}`,src:`assets/photos/${item.id}.webp`,title:item.title,credit:'跑步爱好者协会提供资料图',source:'sources.html#association-photos'}));
  html=html.replace(match[1],JSON.stringify([...supplied,...current]).replaceAll('<','\\u003c'));
  return html;
}

function joinPreview(){
  return `<section class="join-association-preview"><div class="container join-association-preview-grid"><div><p class="section-overline">你要加入的是谁</p><h2>先认识这群一起跑的人。</h2><p>协会不只是一个加群二维码。校园训练、跑友交流、赛事同行和赛后分享，构成了现在公开资料里的日常。</p><div><a href="about.html">认识协会 →</a><a href="gallery.html">看跑步影像 →</a></div></div><div><figure>${photo('track-training-duo')}<figcaption>校园训练</figcaption></figure><figure>${photo('qingyuan-campus-talk-2026')}<figcaption>校内交流</figcaption></figure></div></div></section>`;
}
function sourcesSection(){
  return `<section class="association-photo-sources" id="association-photos"><h2>协会提供图片与介绍资料</h2><p>2026年9月8日，协会为官网建设补充提供了9张训练、活动和校园体育照片，以及一份会长自我介绍。站点将照片转换为去除附带元数据的 WebP 后同站托管，不公开原始压缩包和不必要的个人文件名。</p><p>这些照片按协会提供资料使用，不声明开放许可。公开运营仍应确认摄影者授权、画面中人员的肖像使用范围以及后续撤回机制；图片说明只描述明确场景，不依据画面推断身份、成绩或成员关系。</p><div class="association-photo-source-list">${photos.map(item=>`<div id="source-${item.id}"><strong>${e(item.title)}</strong><span>${e(item.year)} · ${e(item.description)}</span></div>`).join('')}</div><p>其中2026年重庆市大学生田径比赛的学校层面成绩另以重庆市教育委员会公开成绩册核对：<a href="${e(association.campusContext.trackMeet2026.source)}" ${external}>查看官方成绩册 ↗</a>。学校代表队成绩不写成协会成绩。</p></section>`;
}

async function htmlFiles(directory,prefix=''){
  const result=[];
  for(const item of await readdir(directory,{withFileTypes:true})){
    if(item.isDirectory())result.push(...await htmlFiles(path.join(directory,item.name),prefix+item.name+'/'));
    else if(item.name.endsWith('.html'))result.push(prefix+item.name);
  }
  return result;
}

export async function buildAssociationExperience(){
  let index=await readFile(path.join(dist,'index.html'),'utf8');
  let about=replaceMain(index,aboutMain());
  about=setHead(about,{title:'协会介绍｜重庆邮电大学跑步爱好者协会',description:'认识重邮跑步爱好者协会、重邮约跑团与自邮飞翔：校园跑步交流、训练、赛事同行、会长寄语与参与方式。',canonical:'https://yhan-sun.github.io/cqupt-zyfx/about.html'});
  about=ensureCss(about);
  about=navigation(about,'about.html');
  await writeFile(path.join(dist,'about.html'),about);

  index=replaceSection(index,'<section class="about-band" id="about"',homeAbout());
  index=ensureCss(index);index=navigation(index,'index.html');
  await writeFile(path.join(dist,'index.html'),index);

  let club=await readFile(path.join(dist,'club.html'),'utf8');
  const timeline='<section class="container culture-timeline"';
  if(!club.includes(timeline))throw new Error('Culture timeline changed');
  club=club.replace(timeline,clubSupplement()+timeline);
  club=ensureCss(club);club=navigation(club,'club.html');
  await writeFile(path.join(dist,'club.html'),club);

  let gallery=await readFile(path.join(dist,'gallery.html'),'utf8');
  gallery=patchGallery(gallery);gallery=ensureCss(gallery);gallery=navigation(gallery,'gallery.html');
  await writeFile(path.join(dist,'gallery.html'),gallery);

  let join=await readFile(path.join(dist,'join.html'),'utf8');
  const purpose='<section class="container join-purpose"';
  if(!join.includes(purpose))throw new Error('Join purpose changed');
  join=join.replace(purpose,joinPreview()+purpose);
  join=join.replace('href="./#running">查看校园跑步场景 →</a>','href="gallery.html">查看跑步影像 →</a>');
  join=ensureCss(join);join=navigation(join,'join.html');
  await writeFile(path.join(dist,'join.html'),join);

  let sources=await readFile(path.join(dist,'sources.html'),'utf8');
  sources=sources.replace('</main>',sourcesSection()+'</main>');
  sources=ensureCss(sources);sources=navigation(sources,'sources.html');
  await writeFile(path.join(dist,'sources.html'),sources);

  const all=await htmlFiles(dist);
  for(const filename of all){
    if(filename==='404.html'||['index.html','about.html','club.html','gallery.html','join.html','sources.html'].includes(filename))continue;
    const file=path.join(dist,filename);
    let html=await readFile(file,'utf8');
    html=navigation(html,filename);
    await writeFile(file,html);
  }
  return ['about.html'];
}
