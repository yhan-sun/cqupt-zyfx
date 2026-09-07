import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const official = JSON.parse(await readFile(new URL('../data/official-posts.json', import.meta.url), 'utf8'));
const media = JSON.parse(await readFile(new URL('../data/official-media.json', import.meta.url), 'utf8'));
const culture = JSON.parse(await readFile(new URL('../data/club-culture.json', import.meta.url), 'utf8'));
const posts = official.posts;

const fact = (postId, value) => posts.find(post => post.id === postId)?.facts.some(item => item.value === value);

test('official archive contains exactly the eight supplied CQUPT自邮飞翔 posts', () => {
  assert.equal(official.sourceName, 'CQUPT自邮飞翔');
  assert.equal(posts.length, 8);
  assert.equal(new Set(posts.map(post => post.id)).size, 8);
  assert.equal(new Set(posts.map(post => post.source)).size, 8);
  for (const post of posts) {
    assert.match(post.source, /^https:\/\/mp\.weixin\.qq\.com\/s\//);
    assert.match(post.published, /^20(24|25|26)-\d{2}-\d{2}$/);
    assert.ok(post.originalTitle && post.title && post.summary && post.note);
    assert.ok(post.facts.length >= 1);
  }
});

test('headline results remain tied to the correct source record', () => {
  assert.ok(fact('qingyuan-2026', '全国第6'));
  assert.ok(fact('qingyuan-2026', '16:54:38'));
  assert.ok(fact('qingyuan-2025', '西南地区第1'));
  assert.ok(fact('guiyang-2024', '西南第9'));
  assert.ok(fact('relay-2024', '第20名'));
  assert.ok(fact('test-2025', '23人'));
  assert.ok(fact('night-run-2024', '47位'));
  assert.ok(fact('cqmarathon-2025', '11位'));
});

test('ambiguous figures are explicitly scoped instead of inflated into club statistics', () => {
  const marathon = posts.find(post => post.id === 'cqmarathon-2025');
  const volunteers = marathon.facts.find(item => item.value === '478名');
  assert.match(volunteers.label, /重庆邮电大学赛事志愿者总数/);
  assert.match(volunteers.label, /并非跑团队员人数/);
  const night = posts.find(post => post.id === 'night-run-2024');
  assert.match(night.note, /报名奖名次与比赛竞技名次不是同一概念/);
  const relay = posts.find(post => post.id === 'relay-2024');
  assert.match(relay.note, /不用于推断协会成立年份/);
});

test('2025 recruitment and training information is always marked historical', () => {
  assert.match(official.historicalTraining.label, /历史/);
  assert.match(official.historicalTraining.notice, /不代表当前训练时间/);
  assert.equal(official.historicalTraining.items.length, 3);
  assert.deepEqual(official.historicalTraining.items.map(item => item.day), ['周一', '周三', '周六']);
  const recruit = posts.find(post => post.id === 'recruit-2025');
  assert.match(recruit.note, /历史信息/);
  assert.match(recruit.note, /本站不作为当前招新通知发布/);
});

test('curated data does not republish phone numbers, QR payloads or individual result tables', () => {
  const text = JSON.stringify(official);
  assert.ok(!/1[3-9]\d{9}/.test(text));
  assert.ok(!/weixin:\/\//i.test(text));
  assert.ok(!/https?:\/\/u\.wechat\.com\//i.test(text));
  assert.ok(!/王学聪|周维卓|卓赛|罗渝|杨鹏宇|杨昊贤|朱志伟|秦石磊|侯伟|沈勋/.test(text));
});

test('twenty selected self-flying images are hash-pinned and source-linked', () => {
  assert.equal(media.length, 20);
  assert.equal(new Set(media.map(item => item.id)).size, 20);
  const sources = new Set(posts.map(post => post.source));
  for (const item of media) {
    assert.match(item.url, /^https:\/\/mmbiz\.qpic\.cn\//);
    assert.ok(sources.has(item.article));
    assert.match(item.sha256, /^[a-f0-9]{64}$/);
    assert.ok(item.width >= 900 && item.height >= 500);
    assert.match(item.license, /未发现开放许可/);
  }
});

test('culture story uses every official photo once and keeps all post references valid', () => {
  const ids = new Set(media.map(item => item.id));
  const storyIds = Object.values(culture.postImages).flat();
  assert.equal(storyIds.length, 20);
  assert.equal(new Set(storyIds).size, 20);
  for (const id of storyIds) assert.ok(ids.has(id), id);
  for (const [postId, images] of Object.entries(culture.postImages)) {
    assert.ok(posts.some(post => post.id === postId), postId);
    assert.ok(images.length >= 1 && images.length <= 4);
  }
  assert.deepEqual(culture.years.flatMap(year => year.posts).sort(), posts.map(post => post.id).sort());
});

test('every legacy visual reference used by a post remains in the media registry', () => {
  const ids = new Set(media.map(item => item.id));
  for (const post of posts) {
    if (post.image) assert.ok(ids.has(post.image), post.image);
    if (post.secondaryImage) assert.ok(ids.has(post.secondaryImage), post.secondaryImage);
  }
});
