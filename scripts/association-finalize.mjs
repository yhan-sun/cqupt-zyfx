import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
const data=JSON.parse(await readFile(path.join(root,'data/member-media.json'),'utf8'));

async function htmlFiles(dir,prefix=''){
  const out=[];
  for(const entry of await readdir(dir,{withFileTypes:true})){
    if(entry.isDirectory()&&entry.name!=='assets'&&entry.name!=='media')out.push(...await htmlFiles(path.join(dir,entry.name),prefix+entry.name+'/'));
    else if(entry.isFile()&&entry.name.endsWith('.html'))out.push(prefix+entry.name);
  }
  return out;
}

function normalizeAboutNav(html,file){
  if(file!=='about.html')return html;
  return html.replace(/<nav id="main-nav" class="container" aria-label="主导航">[\s\S]*?<\/nav>/,nav=>{
    nav=nav.replace(/ aria-current="page"/g,'');
    return nav.replace(/<a href="about\.html">协会介绍<\/a>/,'<a href="about.html" aria-current="page">协会介绍</a>');
  });
}

function polishPublicCopy(html){
  return html
    .replaceAll('协会补充影像 · 用户附件','协会补充影像')
    .replaceAll('9张照片由委托方本次提供，和公众号档案分开标注。','9张协会侧补充照片，与公众号公开档案分开标注。')
    .replaceAll('委托方提供 · 本站不声明开放许可','协会侧提供 · 本站不声明开放许可')
    .replaceAll('文字由本人随附件提供','文字由本人提供');
}

export async function finalizeAssociationExperience(){
  for(const file of await htmlFiles(dist)){
    const full=path.join(dist,file);
    let html=await readFile(full,'utf8');
    html=polishPublicCopy(normalizeAboutNav(html,file));
    await writeFile(full,html);
  }
  const sourcePath=path.join(dist,'sources.html');
  let sources=await readFile(sourcePath,'utf8');
  if(!sources.includes('协会侧补充影像')){
    const section=`<section id="association-supplied-media"><h2>协会侧补充影像</h2><p>另有${data.items.length}张校园跑步、赛事交流与跑友合影由协会侧在本次网站完善中直接提供。它们用于补充协会介绍与影像档案，不据此声明开放许可，也不从照片自行识别个人身份或成绩。</p><p>其中，2026重庆市大学生田径比赛的公开成绩仅作为学校体育背景引用；2025重庆（长嘉汇）半程马拉松的公开赛事数据仅用于说明对应场景。两者都不等同于协会主办或协会团体成绩。</p><a href="about.html#member-media">查看协会补充影像与说明 →</a></section>`;
    sources=sources.replace('</main>',section+'</main>');
  }
  await writeFile(sourcePath,sources);
}
