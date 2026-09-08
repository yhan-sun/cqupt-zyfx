import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');
for(const file of ['index.html','club.html','gallery.html']){
  const full=path.join(dist,file);
  let html=await readFile(full,'utf8');
  if(!html.includes('assets/about.css'))html=html.replace('</head>','<link rel="stylesheet" href="assets/about.css"></head>');
  await writeFile(full,html);
}
const sourceFile=path.join(dist,'sources.html');
let sources=await readFile(sourceFile,'utf8');
if(!sources.includes('id="association-supplied"')){
  const section=`<section id="association-supplied"><h2>协会本次提供的跑步与活动图片</h2><p>本轮新增9张图片由跑步爱好者协会直接提供给网站建设使用，包括会长与队员田径场跑步、校运会、长嘉汇、高校百英里西南分站赛、清远马拉松校内交流，以及重庆市大学生田径比赛现场资料。它们与公众号转载图片分开管理，不套用公众号图片“未发现开放许可”的说明。</p><p>网站仅按附件已知信息描述场景，不从照片推断个人身份、比赛名次或成绩。2026年重庆市大学生田径比赛的学校团体成绩另以重庆市教育委员会官方成绩册为依据，并明确属于重庆邮电大学校级参赛成绩，不等同于协会战绩。</p><a href="https://jw.cq.gov.cn/jygz/twygfjy/cjgs/202606/P020260605368104890055.pdf" target="_blank" rel="noopener noreferrer">重庆市教育委员会 · 2026年重庆市大学生田径比赛成绩册 ↗</a></section>`;
  sources=sources.replace('</main>',section+'</main>');
}
await writeFile(sourceFile,sources);
