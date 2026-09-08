import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

const data=JSON.parse(await readFile(new URL('../data/association.json',import.meta.url),'utf8'));

test('association: nine supplied photos are uniquely pinned',()=>{
  assert.equal(data.media.length,9);
  assert.equal(new Set(data.media.map(x=>x.id)).size,9);
  assert.equal(new Set(data.media.map(x=>x.filename)).size,9);
  for(const item of data.media){
    assert.match(item.sha256,/^[a-f0-9]{64}$/);
    assert.match(item.filename,/\.webp$/);
    assert.ok(item.width>400&&item.height>400);
  }
});
test('association: president story remains an attributed personal account',()=>{
  assert.equal(data.president.name,'胡钢');
  assert.equal(data.president.grade,'25级');
  assert.equal(data.president.runningSince,2023);
  assert.match(data.president.story,/自述/);
  assert.ok(data.president.quote.length>20);
});
test('association: school athletics result is explicitly school-level',()=>{
  assert.equal(data.schoolAthletics.scope,'school');
  assert.match(data.schoolAthletics.note,/不等同于跑步爱好者协会战绩/);
  assert.match(data.schoolAthletics.source,/^https:\/\/jw\.cq\.gov\.cn\//);
  assert.deepEqual(data.schoolAthletics.facts.slice(0,2).map(x=>[x.value,x.detail]),[['第1','85分'],['第6','50.5分']]);
});
test('association: supplied metadata does not introduce private contact details',()=>{
  const text=JSON.stringify(data);
  assert.ok(!/1[3-9]\d{9}/.test(text));
  assert.ok(!/二维码|微信号|手机号/.test(text));
});
