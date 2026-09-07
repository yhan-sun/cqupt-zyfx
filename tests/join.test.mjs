import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const join = JSON.parse(await readFile(new URL('../data/join.json', import.meta.url), 'utf8'));
const qr = await readFile(new URL('../assets/join-qq.svg', import.meta.url), 'utf8');
const builder = await readFile(new URL('../scripts/join-build.mjs', import.meta.url), 'utf8');

test('join: supplied QQ group is stored as current verified participation information', () => {
  assert.equal(join.groupName, '重邮约跑团');
  assert.equal(join.platform, 'QQ');
  assert.equal(join.groupNumber, '468686951');
  assert.equal(join.reviewedAt, '2026-09-07');
  assert.equal(join.source, '跑团提供');
});

test('join: supplied QR resolves to a current HTTPS QQ invitation', () => {
  assert.equal(join.joinUrl, 'https://qm.qq.com/q/9rKOuWR8Ag');
  assert.equal(join.qrImage, 'assets/join-qq.svg');
  assert.match(qr, /^<\?xml/);
  assert.match(qr, /<svg[^>]*width="560"[^>]*height="560"/);
  assert.match(qr, /<path[^>]*fill="#087780"/);
  assert.ok(qr.length > 5000);
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

test('join: current data does not inherit expired recruitment deadlines or personal contacts', () => {
  const text = JSON.stringify(join);
  assert.ok(!text.includes('2025.10.27'));
  assert.ok(!/1[3-9]\d{9}/.test(text));
  assert.ok(!text.includes('成绩门槛'));
});

test('join: generated experience includes standalone page, direct QQ entry, source note and no registration form', () => {
  assert.ok(builder.includes("return ['join.html']"));
  assert.ok(builder.includes('加入跑团信息'));
  assert.ok(builder.includes('打开 QQ 加群'));
  assert.ok(builder.includes('网站没有入群申请表或报名后台'));
  assert.ok(!builder.includes('<form'));
});
