import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access } from 'node:fs/promises';
import { calculateSeconds, formatDuration, filterStories, verifiedJoinUrl } from '../assets/core.mjs';
import { site, stories, routes } from '../data/site.mjs';

test('5 km at 6:00/km is 30 minutes', () => assert.equal(formatDuration(calculateSeconds(5, 6, 0)), '00:30:00'));
test('half marathon rounds once at the final second', () => assert.equal(formatDuration(calculateSeconds(21.0975, 6, 0)), '02:06:35'));
test('marathon at 4:30/km', () => assert.equal(formatDuration(calculateSeconds(42.195, 4, 30)), '03:09:53'));
test('invalid, fractional and out-of-range inputs are rejected', () => {
  for (const args of [[0,6,0],[-1,6,0],[101,6,0],[5,-1,0],[5,31,0],[5,6,60],[5,6,-1],[5,0,59],[5,6.5,0],[5,6,.5],[NaN,6,0],[5,Infinity,0]]) assert.equal(calculateSeconds(...args), null);
});
test('valid boundary pace and distance are supported', () => {
  assert.equal(calculateSeconds(.5, 1, 0), 30);
  assert.equal(calculateSeconds(100, 30, 59), 185900);
});
test('duration formatting handles zero, rounding and invalid values', () => {
  assert.equal(formatDuration(0), '00:00:00');
  assert.equal(formatDuration(59.8), '00:01:00');
  assert.equal(formatDuration(-1), '—');
  assert.equal(formatDuration(NaN), '—');
});
test('story filters do not mutate source data', () => {
  assert.equal(filterStories(stories, 'all').length, 3);
  assert.equal(filterStories(stories, 'campus').length, 2);
  assert.equal(filterStories(stories, 'club').length, 1);
  assert.equal(filterStories(stories, 'unknown').length, 0);
  assert.equal(stories.length, 3);
});
test('unverified, insecure and malformed signup links cannot be enabled', () => {
  for (const join of [null, {}, {verified:false,url:'https://example.org'},{verified:true,url:'javascript:alert(1)'},{verified:true,url:'http://example.org'},{verified:true,url:'bad'}]) assert.equal(verifiedJoinUrl(join), null);
  assert.equal(verifiedJoinUrl({verified:true,url:'https://example.org/join'}), 'https://example.org/join');
  assert.equal(verifiedJoinUrl(site.join), null);
});
test('every factual story and suggested route has an HTTPS source', () => {
  for (const item of [...stories, ...Object.values(routes)]) assert.match(item.source, /^https:\/\//);
  assert.equal(new Set(stories.map(item => item.id)).size, stories.length);
});
test('all local HTML references resolve and anchor ids are unique', async () => {
  for (const filename of ['index.html', 'sources.html']) {
    const html = await readFile(new URL('../' + filename, import.meta.url), 'utf8');
    const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
    assert.equal(new Set(ids).size, ids.length, `${filename}: duplicate ids`);
    for (const [, value] of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
      if (value.startsWith('#')) assert.ok(ids.includes(value.slice(1)), `${filename}: ${value}`);
      else if (!/^(?:https?:|data:)/.test(value)) await access(new URL('../' + value.split('#')[0], import.meta.url));
    }
  }
});
test('media credits are complete and built assets use relative URLs', async () => {
  const media = JSON.parse(await readFile(new URL('../data/media.json', import.meta.url), 'utf8'));
  assert.equal(media.length, 2);
  for (const item of media) {
    assert.ok(item.author && item.source && item.license);
    assert.match(item.filename, /^[a-z]+\.jpg$/);
  }
  const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
  assert.ok(!/src="\//.test(html));
  assert.ok(!/href="\/assets/.test(html));
});
