import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createModel, runners } from '../scripts/model.mjs';
import { renderSite } from '../scripts/render.mjs';

const pages = renderSite(createModel());
const siteCss = await readFile(new URL('../assets/site.css', import.meta.url), 'utf8');

test('runners: profile data keeps the supplied fields and registered image', () => {
  assert.equal(runners.items.length, 11);
  const profile = runners.items.find(item => item.id === 'hu-gang');
  const secondProfile = runners.items.find(item => item.id === 'yu-peijun');
  const thirdProfile = runners.items.find(item => item.id === 'yang-haoxian');
  const fourthProfile = runners.items.find(item => item.id === 'yang-tao');
  const fifthProfile = runners.items.find(item => item.id === 'jiang-lin');
  const sixthProfile = runners.items.find(item => item.id === 'chai-weiyu');
  const seventhProfile = runners.items.find(item => item.id === 'jin-weicheng');
  const eighthProfile = runners.items.find(item => item.id === 'wang-xuecong');
  const ninthProfile = runners.items.find(item => item.id === 'yang-pengyu');
  const tenthProfile = runners.items.find(item => item.id === 'liu-ake');
  const eleventhProfile = runners.items.find(item => item.id === 'he-yao');
  assert.ok(profile);
  assert.ok(secondProfile);
  assert.ok(thirdProfile);
  assert.ok(fourthProfile);
  assert.ok(fifthProfile);
  assert.ok(sixthProfile);
  assert.ok(seventhProfile);
  assert.ok(eighthProfile);
  assert.ok(ninthProfile);
  assert.ok(tenthProfile);
  assert.ok(eleventhProfile);
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
  assert.deepEqual(
    { name: thirdProfile.name, grade: thirdProfile.grade, college: thirdProfile.college, image: thirdProfile.image },
    { name: '杨昊贤', grade: '2023级', college: '国际学院', image: 'runner-yang-haoxian' }
  );
  assert.deepEqual(thirdProfile.records.map(record => [record.label, record.value]), [
    ['5000m PB', '17:30'],
    ['2025垫江半马', '1:21:30'],
    ['2025重庆马拉松（全马）', '2:59:47']
  ]);
  assert.equal(thirdProfile.motto, '我是奶龙！我就是奶龙！！！');
  assert.deepEqual(
    { name: fourthProfile.name, grade: fourthProfile.grade, college: fourthProfile.college, image: fourthProfile.image },
    { name: '杨涛', grade: '2026级研', college: '集成电路学院', image: 'runner-yang-tao' }
  );
  assert.deepEqual(
    { name: fifthProfile.name, grade: fifthProfile.grade, college: fifthProfile.college, image: fifthProfile.image },
    { name: '江林', grade: '2023级', college: '人工智能学院', image: 'runner-jiang-lin' }
  );
  assert.deepEqual(
    { name: sixthProfile.name, grade: sixthProfile.grade, college: sixthProfile.college, image: sixthProfile.image },
    { name: '柴威宇', grade: '2024级', college: '安法学院', image: 'runner-chai-weiyu' }
  );
  assert.deepEqual(
    { name: seventhProfile.name, grade: seventhProfile.grade, college: seventhProfile.college, image: seventhProfile.image },
    { name: '金炜程', grade: '2023级', college: '通信学院', image: 'runner-jin-weicheng' }
  );
  assert.deepEqual(
    { name: eighthProfile.name, grade: eighthProfile.grade, college: eighthProfile.college, image: eighthProfile.image },
    { name: '王学聪', grade: '2022级研', college: '经济管理学院', image: 'runner-wang-xuecong' }
  );
  assert.deepEqual(
    { name: ninthProfile.name, grade: ninthProfile.grade, college: ninthProfile.college, image: ninthProfile.image },
    { name: '杨鹏宇', grade: '2021级', college: '安法学院', image: 'runner-yang-pengyu' }
  );
  assert.deepEqual(
    { name: tenthProfile.name, grade: tenthProfile.grade, college: tenthProfile.college, image: tenthProfile.image },
    { name: '刘阿克', grade: '2022级', college: '人工智能学院', image: 'runner-liu-ake' }
  );
  assert.deepEqual(tenthProfile.records.map(record => [record.label, record.value]), [
    ['5000m PB', '17:54'],
    ['2025年仁寿半程马拉松', '1:22:41'],
    ['2025年垫江马拉松（全马）', '2:58:49']
  ]);
  assert.equal(tenthProfile.motto, 'Keep Running!');
  assert.deepEqual(
    { name: eleventhProfile.name, grade: eleventhProfile.grade, college: eleventhProfile.college, image: eleventhProfile.image },
    { name: '何耀', grade: '2023级', college: '通信学院', image: 'runner-he-yao' }
  );
  assert.deepEqual(eleventhProfile.records.map(record => [record.label, record.value]), [
    ['5000m PB', '18:30'],
    ['万州马拉松（半马）', '1:22:59'],
    ['上合昆明马拉松（全马）', '3:22:33']
  ]);
  assert.equal(eleventhProfile.motto, '听风');
});

test('runners: page is rendered from the shared model and preserves provenance', () => {
  const html = pages.get('runners.html');
  assert.ok(html);
  for (const text of [
    '跑友风采', '胡钢', '2025级', '自动化学院', '17:24', '36:35', '1:20:57', '日拱一卒，功不唐捐',
    '俞沛君', '2023级', '生命健康信息学院', '17:59', '1:31:52', '3:48:00', '繁霜尽是心头血，洒向千峰秋叶丹',
    '杨昊贤', '国际学院', '17:30', '1:21:30', '2:59:47', '我是奶龙！我就是奶龙！！！',
    '杨涛', '2026级研', '集成电路学院', '18:24', '1:27:40', '3:09:47', '理论永远是灰色的，而生命之树常青',
    '江林', '人工智能学院', '17:05', '1:20:27', '2:58:41', '长路漫漫，稳即是快',
    '柴威宇', '2024级', '安法学院', '16:55', '1:23:11', '2:52:55', '你说被火烧过才能出现凤凰',
    '金炜程', '通信学院', '16:42', '1:18:59', '2:56:14', '我的少鹏无限猖狂',
    '王学聪', '2022级研', '经济管理学院', '15:45', '1:11:36', '2:28:54', '无人扶我青云志，我自己也不想动',
    '杨鹏宇', '2021级', '17:04', '1:15:19', '2:46:21', '111',
    '刘阿克', '2022级', '17:54', '1:22:41', '2:58:49', 'Keep Running!',
    '何耀', '2023级', '通信学院', '18:30', '1:22:59', '3:22:33', '听风'
  ]) {
    assert.ok(html.includes(text), text);
  }
  assert.match(html, /data-photo-view="member-captain-run"/);
  assert.match(html, /data-photo-view="runner-yu-peijun"/);
  assert.match(html, /data-photo-view="runner-yang-haoxian"/);
  assert.match(html, /data-photo-view="runner-yang-tao"/);
  assert.match(html, /data-photo-view="runner-jiang-lin"/);
  assert.match(html, /data-photo-view="runner-chai-weiyu"/);
  assert.match(html, /data-photo-view="runner-jin-weicheng"/);
  assert.match(html, /data-photo-view="runner-wang-xuecong"/);
  assert.match(html, /data-photo-view="runner-yang-pengyu"/);
  assert.match(html, /data-photo-view="runner-liu-ake"/);
  assert.match(html, /data-photo-view="runner-he-yao"/);
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

test('runners: profile photos enforce height and max-height limits', () => {
  assert.match(siteCss, /\.runner-profile-photo \{[^}]*max-height:\s*410px/);
  assert.match(siteCss, /\.runner-profile-photo \.photo-link \{[^}]*height:\s*100%/);
  assert.match(siteCss, /\.runner-profile-photo img \{[^}]*max-height:\s*100%/);
});

