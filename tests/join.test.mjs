import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const join = JSON.parse(await readFile(new URL('../data/join.json', import.meta.url), 'utf8'));
const qr = await readFile(new URL('../assets/join-qq.jpg', import.meta.url));
const builder = await readFile(new URL('../scripts/join-build.mjs', import.meta.url), 'utf8');

test('join: supplied QQ group is stored as current verified participation information', () => {
  assert.equal(join.groupName, '重邮约跑团');
  assert.equal(join.platform, 'QQ');
  assert.equal(join.groupNumber, '468686951');
  assert.equal(join.reviewedAt, '2026-09-07');
  assert.equal(join.source, '跑团提供');
});

test('join: current wording keeps irregular activities and event participation conditional', () => {
  assert.match(join.purpose, /重邮学子/);
  assert.match(join.description, /不定期/);
  assert.match(join.description, /有机会/);
  assert.match(join.currentNotice, /当期通知/);
  assert.match(join.audience, /群管理员/);
});

test('join: four participation modes cover conversation, check-in, training and races', () => {
  assert.deepEqual(join.activities.map(item => item.id), ['talk','checkin','learn','race']);
  for (const item of join.activities) assert.ok(item.title && item.summary);
});

test('join: QR is a real local JPEG asset and not a hotlink', () => {
  assert.equal(join.qrImage, 'assets/join-qq.jpg');
  assert.ok(qr.length > 1024);
  assert.equal(qr[0], 0xff);
  assert.equal(qr[1], 0xd8);
  assert.equal(qr[qr.length - 2], 0xff);
  assert.equal(qr[qr.length - 1], 0xd9);
});

test('join: current data does not inherit expired recruitment deadlines or personal contacts', () => {
  const text = JSON.stringify(join);
  assert.ok(!text.includes('2025.10.27'));
  assert.ok(!/1[3-9]\d{9}/.test(text));
  assert.ok(!text.includes('成绩门槛'));
});

test('join: generated experience includes standalone page, source note and no registration form', () => {
  assert.ok(builder.includes("return ['join.html']"));
  assert.ok(builder.includes('加入跑团信息'));
  assert.ok(builder.includes('网站没有入群申请表或报名后台'));
  assert.ok(!builder.includes('<form'));
});
