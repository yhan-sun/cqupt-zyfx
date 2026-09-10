import test from 'node:test';
import assert from 'node:assert/strict';
import { createModel, runners } from '../scripts/model.mjs';
import { renderSite } from '../scripts/render.mjs';

const pages = renderSite(createModel());

test('runners: profile data keeps the supplied fields and registered image', () => {
  assert.equal(runners.items.length, 1);
  const [profile] = runners.items;
  assert.deepEqual(
    { name: profile.name, grade: profile.grade, college: profile.college, image: profile.image },
    { name: '胡钢', grade: '2025级', college: '自动化学院', image: 'member-captain-run' }
  );
  assert.deepEqual(profile.records.map(record => [record.label, record.value]), [
    ['500m PB', '17:24'],
    ['10000m PB', '36:35'],
    ['2025璧山半马', '1:20:57']
  ]);
  assert.equal(profile.motto, '日拱一卒，功不唐捐');
});

test('runners: page is rendered from the shared model and preserves provenance', () => {
  const html = pages.get('runners.html');
  assert.ok(html);
  for (const text of ['跑友风采', '胡钢', '2025级', '自动化学院', '17:24', '36:35', '1:20:57', '日拱一卒，功不唐捐']) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /data-photo-view="member-captain-run"/);
  assert.ok(html.includes('照片由本人提供'));
  for (const removed of ['当前展示', '从一位跑友开始', '资料说明', '不做横向排名', '每位跑友沿用相同的信息结构']) {
    assert.ok(!html.includes(removed), removed);
  }
  assert.ok(!/<img[^>]+src="https?:/i.test(html));
  assert.ok(pages.get('sources.html').includes('id="runner-profiles"'));
});
