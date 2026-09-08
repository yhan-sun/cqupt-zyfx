import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
const data=JSON.parse(await readFile(new URL('../data/member-media.json',import.meta.url),'utf8'));
test('association: nine supplied images are explicitly registered',()=>{assert.equal(data.items.length,9);assert.equal(new Set(data.items.map(x=>x.id)).size,9);for(const x of data.items){assert.match(x.file,/\.webp$/);assert.ok(x.title&&x.description&&x.width>0&&x.height>0)}});
test('association: public evidence is scoped to school/event context',()=>{const athletics=data.items.filter(x=>x.evidence?.includes('jw.cq.gov.cn'));assert.equal(athletics.length,2);assert.ok(athletics.every(x=>x.description.includes('协会')||x.description.includes('赛事')));const text=JSON.stringify(data);assert.ok(!text.includes('协会女子团体第一'));assert.ok(!text.includes('协会获得甲组女子团体第一'))});
test('association: supplied captain statement remains distinct from invented history',()=>{assert.equal(data.captain.name,'胡钢');assert.equal(data.captain.story.length,3);assert.ok(data.captain.story.join('').includes('2023年'));assert.ok(!JSON.stringify(data).includes('协会成立于2023'))});
