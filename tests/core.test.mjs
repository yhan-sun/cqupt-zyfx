import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { calculateSeconds, formatDuration, verifiedJoinUrl, cycleIndex } from '../assets/core.mjs';
import { renderSite, escapeHtml } from '../scripts/render.mjs';

const content = JSON.parse(await readFile(new URL('../data/content.json', import.meta.url), 'utf8'));
const media = JSON.parse(await readFile(new URL('../data/media.json', import.meta.url), 'utf8'));
const pages = renderSite(content, media);

test('5 km at 6:00 per km is 30 minutes', () => assert.equal(formatDuration(calculateSeconds(5,6,0)), '00:30:00'));
test('half marathon rounds only at the final second', () => assert.equal(formatDuration(calculateSeconds(21.0975,6,0)), '02:06:35'));
test('marathon at 4:30 per km', () => assert.equal(formatDuration(calculateSeconds(42.195,4,30)), '03:09:53'));
test('invalid pace and distance values are rejected', () => {
  for (const args of [[0,6,0],[-1,6,0],[101,6,0],[5,-1,0],[5,31,0],[5,6,60],[5,6,-1],[5,0,59],[5,6.5,0],[5,6,.5],[NaN,6,0],[5,Infinity,0]]) assert.equal(calculateSeconds(...args), null);
});
test('boundary values and formatting', () => {
  assert.equal(calculateSeconds(.5,1,0),30);
  assert.equal(calculateSeconds(100,30,59),185900);
  assert.equal(formatDuration(59.8),'00:01:00');
  assert.equal(formatDuration(NaN),'—');
});
test('cyclic navigation wraps correctly in both directions', () => {
  assert.equal(cycleIndex(-1,3),2);
  assert.equal(cycleIndex(3,3),0);
  assert.equal(cycleIndex(-8,3),1);
  assert.throws(()=>cycleIndex(0,0), RangeError);
  assert.throws(()=>cycleIndex(1.5,3), RangeError);
});
test('unverified and non-HTTPS recruitment links cannot be enabled', () => {
  for (const join of [null, {}, {verified:false,url:'https://example.org'},{verified:true,url:'javascript:alert(1)'},{verified:true,url:'http://example.org'},{verified:true,url:'bad'}]) assert.equal(verifiedJoinUrl(join),null);
  assert.equal(verifiedJoinUrl({verified:true,url:'https://example.org/join'}),'https://example.org/join');
  assert.equal(verifiedJoinUrl(content.join),null);
});
test('HTML escaping handles quotes and executable markup', () => assert.equal(escapeHtml('<script a="x">&\'</script>'), '&lt;script a=&quot;x&quot;&gt;&amp;&#39;&lt;/script&gt;'));
test('three sourced articles are ordered by real event date', () => {
  assert.equal(content.stories.length,3);
  assert.deepEqual(content.stories.map(i=>i.date),['2026-03-29','2025-03-29','2024-03-23']);
  for (const story of content.stories) assert.match(story.source,/^https:\/\//);
});
test('fourteen media entries carry individual provenance and rights', () => {
  assert.equal(media.length,14);
  assert.equal(new Set(media.map(i=>i.id)).size,14);
  for (const image of media) {
    assert.ok(image.title && image.credit && image.license && image.source);
    assert.match(image.url,/^https:\/\//);
    assert.ok(['webp','png'].includes(image.format));
  }
  assert.match(media.find(i=>i.id==='campus-gate').license,/CC BY-SA/);
});
test('all gallery images and hero references exist', () => {
  const ids = new Set(media.map(i=>i.id));
  for (const id of [...content.gallery,...content.slides.map(i=>i.image),...content.routes.map(i=>i.image)]) assert.ok(ids.has(id));
  assert.equal(new Set(content.gallery).size,8);
});
test('all eight static pages and article source captions are rendered', () => {
  assert.equal(pages.size,8);
  for (const story of content.stories) {
    const html = pages.get(`news/${story.id}.html`);
    assert.ok(html.includes(story.imageNote));
    assert.ok(html.includes(escapeHtml(story.source)));
  }
});
test('page ids are unique and all internal page links and anchors resolve', () => {
  for (const [filename, html] of pages) {
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);
    assert.equal(new Set(ids).size,ids.length,filename);
    for (const [, href] of html.matchAll(/\bhref="([^"]+)"/g)) {
      if (/^(https?:|data:)/.test(href) || href.startsWith('/cqupt-zyfx/')) continue;
      const url = new URL(href,'https://test.invalid/'+filename);
      let target = url.pathname.slice(1);
      if (target.endsWith('/')) target += 'index.html';
      if (!target) target = 'index.html';
      if (target.startsWith('assets/')) continue;
      assert.ok(pages.has(target),`${filename} -> ${href}`);
      if (url.hash) assert.ok(pages.get(target).includes(`id="${url.hash.slice(1)}"`),`${filename} -> ${href}`);
    }
  }
});
test('school-style pages have no external image requests or previous campaign slogans', () => {
  for (const html of pages.values()) assert.ok(!/<img[^>]*src="https?:/.test(html));
  const home = pages.get('index.html');
  for (const term of ['下课了','JUST SHOW UP','GO<br>FOR','club-stamp','RUN TOGETHER']) assert.ok(!home.includes(term));
  assert.ok(home.includes('校园赛事') && home.includes('参与须知'));
});
test('no fabricated registration success or unsourced live schedules', () => {
  assert.ok(!pages.get('index.html').includes('报名成功'));
  assert.ok(pages.get('sources.html').includes('署名并不等于授权'));
});
test('concurrent main contribution survives as a separate, non-recruitment note', async () => {
  const original = JSON.parse(await readFile(new URL('../data/contributions/track-prep.original.json', import.meta.url), 'utf8'));
  assert.equal(original.upstreamCommit, '8c7f88cdcc18a1f0631f6653a227cc84c15faf78');
  assert.equal(original.paragraphs.length, 3);
  assert.ok(pages.get('index.html').includes('notes/track-prep.html'));
  assert.ok(pages.get('notes/track-prep.html').includes('非重邮实拍'));
  assert.ok(!pages.get('notes/track-prep.html').includes('正在进行中'));
  assert.equal(media.find(item => item.id === 'track').licenseUrl, 'https://creativecommons.org/licenses/by/2.0');
});
