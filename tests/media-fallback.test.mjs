import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const media=JSON.parse(await readFile(new URL('../data/media.json',import.meta.url),'utf8'));
const fallback=JSON.parse(await readFile(new URL('../data/media-fallback.json',import.meta.url),'utf8'));

test('media fallback: every base media item has a pinned deployed derivative',()=>{
  assert.match(fallback.baseUrl,/^https:\/\/yhan-sun\.github\.io\/cqupt-zyfx\/media\/$/);
  assert.match(fallback.sourceCommit,/^[a-f0-9]{40}$/);
  assert.deepEqual(Object.keys(fallback.items).sort(),media.map(item=>item.id).sort());
  for(const item of media){
    const entry=fallback.items[item.id];
    assert.ok(entry.width>0&&entry.height>0);
    assert.match(entry.sha256,/^[a-f0-9]{64}$/);
    assert.equal(entry.file,`${item.id}.${item.format||'webp'}`);
    if(entry.small){
      assert.ok(entry.small.width>0&&entry.small.height>0);
      assert.match(entry.small.sha256,/^[a-f0-9]{64}$/);
      assert.equal(entry.small.file,`${item.id}-small.${item.format||'webp'}`);
    }
  }
});

test('media fallback: fallback is previous release only, never an alternate attribution source',()=>{
  for(const item of media){
    const entry=fallback.items[item.id];
    assert.ok(!('source' in entry));
    assert.ok(!('license' in entry));
  }
});
