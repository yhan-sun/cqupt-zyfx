import { readFile, writeFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root=path.resolve(import.meta.dirname,'..');
const dist=path.join(root,'dist');

async function htmlFiles(directory,prefix=''){
  const files=[];
  for(const item of await readdir(directory,{withFileTypes:true})){
    if(item.isDirectory())files.push(...await htmlFiles(path.join(directory,item.name),prefix+item.name+'/'));
    else if(item.name.endsWith('.html'))files.push(prefix+item.name);
  }
  return files;
}

const prefixFor=filename=>'../'.repeat(Math.max(0,filename.split('/').length-1));

export async function buildMotionExperience(){
  const files=await htmlFiles(dist);
  for(const filename of files){
    if(filename==='404.html')continue;
    const full=path.join(dist,filename);
    let html=await readFile(full,'utf8');
    const prefix=prefixFor(filename);
    if(!html.includes('assets/motion.css'))html=html.replace('</head>',`<link rel="stylesheet" href="${prefix}assets/motion.css"></head>`);
    if(!html.includes('assets/motion.js'))html=html.replace('</head>',`<script type="module" src="${prefix}assets/motion.js"></script></head>`);
    await writeFile(full,html);
  }
  return files.filter(filename=>filename!=='404.html');
}
