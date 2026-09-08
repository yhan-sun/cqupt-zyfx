import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { normalizeQuery, matchesResource, calculateFuel } from '../assets/science-core.mjs';
import { chapters, methods, exercises, references } from '../data/science.mjs';
import { movementMedia, sciencePaths } from '../scripts/science.mjs';
import { renderSite } from '../scripts/render.mjs';
import { createModel } from '../scripts/model.mjs';

const pages=renderSite(createModel());

test('science: six chapters, ten methods, fourteen exercises, eight static paths',()=>{
  assert.equal(chapters.length,6);assert.equal(methods.length,10);assert.equal(exercises.length,14);assert.equal(sciencePaths.length,8);
  for(const path of sciencePaths) assert.ok(pages.has(path),path);
});
test('science: every chapter section and training method resolves references',()=>{
  const refs=new Set(references.map(r=>r.id));
  assert.equal(refs.size,references.length);
  for(const chapter of chapters) {
    assert.equal(new Set(chapter.sections.map(s=>s.id)).size,chapter.sections.length);
    for(const section of chapter.sections) for(const id of section.sources||[]) assert.ok(refs.has(id),id);
  }
  for(const method of methods) {
    assert.ok(method.goal && method.how && method.pitfall && method.effort);
    assert.ok(method.sources.length);
    for(const id of method.sources) assert.ok(refs.has(id),id);
  }
  for(const ref of references) assert.match(ref.url,/^https:\/\//);
});
test('science: twelve original GIFs and four licensed static files are pinned',()=>{
  assert.equal(movementMedia.length,16);
  assert.equal(movementMedia.filter(m=>m.frames>1).length,12);
  assert.equal(movementMedia.filter(m=>m.frames===1).length,4);
  for(const m of movementMedia) {
    assert.ok(m.author && m.license && m.note && m.source && m.licenseUrl);
    assert.match(m.url,/^https:\/\/upload\.wikimedia\.org\//);
    assert.match(m.sha256,/^[a-f0-9]{64}$/);
    assert.ok(m.posterFrame>=0 && m.posterFrame<m.frames);
  }
});
test('science: every exercise has mechanics, cautions, adaptations and real media',()=>{
  const ids=new Set(movementMedia.map(m=>m.id));
  for(const x of exercises) {
    assert.ok(x.steps.length>=2 && x.caution && x.easier);
    for(const id of x.media) assert.ok(ids.has(id),id);
  }
  for(const c of chapters) for(const s of c.sections) for(const id of s.exercises||[]) assert.ok(exercises.some(x=>x.id===id));
});
test('science: GIFs never autoplay and no remote image hotlinks exist',()=>{
  for(const path of sciencePaths) {
    const html=pages.get(path);
    assert.ok(!/<img[^>]*src="[^"]*\.gif"/.test(html));
    assert.ok(!/<img[^>]*src="https?:/.test(html));
    assert.ok(html.includes('不是个体训练、诊疗或营养处方'));
  }
});
test('science: motion controls start unpressed and hidden until JS is available',()=>{
  const html=pages.get('science/strength.html');
  const controls=[...html.matchAll(/<button[^>]*data-motion="[^"]+"[^>]*>/g)].map(m=>m[0]);
  assert.equal(controls.length,8);
  for(const control of controls) assert.ok(control.includes('aria-pressed="false"') && control.includes(' hidden'));
});
test('science: Chinese, aliases and case-insensitive lookup are available',()=>{
  assert.equal(normalizeQuery('  ＦＡＲＴＬＥＫ  '),'fartlek');
  assert.ok(matchesResource('法特莱克 Fartlek 速度游戏','fartlek','training','all'));
  assert.ok(matchesResource('法特莱克 Fartlek 速度游戏','法特莱克 速度','training','training'));
  assert.ok(!matchesResource('法特莱克','法特莱克','training','movement'));
  assert.ok(!matchesResource('法特莱克','<script>','training','all'));
  assert.ok(pages.get('science.html').includes('发科莱特'));
});
test('fuel: unit conversion with fractional packet equivalents',()=>{
  assert.deepEqual(calculateFuel(90,30,25,0),{total:45,remaining:45,gelEquivalent:1.8,overage:0});
  assert.deepEqual(calculateFuel(120,45,30,30),{total:90,remaining:60,gelEquivalent:2,overage:0});
});
test('fuel: other carbohydrate is counted once and negative remainder is prevented',()=>{
  assert.deepEqual(calculateFuel(90,30,25,60),{total:45,remaining:0,gelEquivalent:0,overage:15});
  assert.deepEqual(calculateFuel(45,0,25,0),{total:0,remaining:0,gelEquivalent:0,overage:0});
});
test('fuel: rejects nonfinite, negative, missing numerical values and unsafe ranges',()=>{
  for(const args of [[0,30,25,0],[721,30,25,0],[90,-1,25,0],[90,91,25,0],[90,30,0,0],[90,30,101,0],[90,30,25,-1],[90,30,25,1081],[NaN,30,25,0],[90,Infinity,25,0],[90,30,null,0]]) assert.equal(calculateFuel(...args),null);
});
test('fuel: permitted boundary is math, not a personalized nutrition recommendation',()=>{
  const result=calculateFuel(720,90,100,1080);
  assert.equal(result.total,1080);assert.equal(result.remaining,0);
  const page=pages.get('science/nutrition.html');
  assert.ok(page.includes('工具只做') && page.includes('不是精确到某一分钟'));
});
