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
    .replaceAll('委托方提供 · 本站不声明开放许可','协会侧提供 · 本站不声明开放许可');
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
  if(!sources.includes('协会侧补充照片')){
    const section=`<section id="association-supplied-media"><h2>协会侧补充照片</h2><p>另有 ${data.items.length} 张校园训练、校内赛事和跑友合影由协会侧提供。它们用于补充协会介绍和影像档案，版权与使用范围按提供方说明处理；本站不宣称开放许可，也不从照片自行识别个人身份或成绩。</p><p>其中，2026 年重庆市大学生田径比赛的公开成绩只作为学校体育背景；2025 年长嘉汇半程马拉松的公开信息只用于说明赛事场景。两者都不写作协会主办活动或协会团体成绩。</p><a href="about.html#member-media">查看协会补充照片与说明 →</a></section>`;
    sources=sources.replace('</main>',section+'</main>');
  }
  await writeFile(sourcePath,sources);
}
