import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModel, runners } from '../scripts/model.mjs';
import { renderSite } from '../scripts/render.mjs';

const pages = renderSite(createModel());
const siteCss = await readFile(new URL('../assets/site.css', import.meta.url), 'utf8');

test('runners: profile data keeps the supplied fields and registered image', () => {
  assert.equal(runners.items.length, 2);
  const profile = runners.items.find(item => item.id === 'hu-gang');
  const secondProfile = runners.items.find(item => item.id === 'yu-peijun');
  assert.ok(profile);
  assert.ok(secondProfile);
  assert.deepEqual(
    { name: profile.name, grade: profile.grade, college: profile.college, image: profile.image },
    { name: '胡钢', grade: '2025级', college: '自动化学院', image: 'member-captain-run' }
  );
  assert.deepEqual(profile.records.map(record => [record.label, record.value]), [
    ['5000m PB', '17:24'],
    ['10000m PB', '36:35'],
    ['2025璧山半马', '1:20:57']
  ]);
  assert.equal(profile.motto, '日拱一卒，功不唐捐');
  assert.deepEqual(
    { name: secondProfile.name, grade: secondProfile.grade, college: secondProfile.college, image: secondProfile.image },
    { name: '俞沛君', grade: '2023级', college: '生命健康信息学院', image: 'runner-yu-peijun' }
  );
  assert.deepEqual(secondProfile.records.map(record => [record.label, record.value]), [
    ['5000m PB', '17:59'],
    ['半马 PB', '1:31:52'],
    ['全马 PB', '3:48:00']
  ]);
  assert.equal(secondProfile.motto, '繁霜尽是心头血，洒向千峰秋叶丹');
});

test('runners: page is rendered from the shared model and preserves provenance', () => {
  const html = pages.get('runners.html');
  assert.ok(html);
  for (const text of ['跑友风采', '胡钢', '2025级', '自动化学院', '17:24', '36:35', '1:20:57', '日拱一卒，功不唐捐', '俞沛君', '2023级', '生命健康信息学院', '17:59', '1:31:52', '3:48:00', '繁霜尽是心头血，洒向千峰秋叶丹']) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /data-photo-view="member-captain-run"/);
  assert.match(html, /data-photo-view="runner-yu-peijun"/);
  assert.ok(html.includes('照片由本人提供'));
  for (const removed of ['当前展示', '从一位跑友开始', '资料说明', '不做横向排名', '每位跑友沿用相同的信息结构']) {
    assert.ok(!html.includes(removed), removed);
  }
  assert.ok(!/<img[^>]+src="https?:/i.test(html));
  assert.ok(pages.get('sources.html').includes('id="runner-profiles"'));
});

test('runners: future profile cards alternate photo sides and stack on mobile', () => {
  assert.match(siteCss, /\.runner-profile-card:nth-child\(even\) \{[^}]*grid-template-columns/);
  assert.match(siteCss, /\.runner-profile-card:nth-child\(even\) \.runner-profile-photo \{[^}]*grid-column: 2/);
  assert.match(siteCss, /@media \(max-width: 850px\)[\s\S]*\.runner-profile-card:nth-child\(even\) \.runner-profile-photo/);
});
