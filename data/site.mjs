export const site = Object.freeze({
  name: '自邮飞翔',
  fullName: '重庆邮电大学跑步爱好者协会',
  alias: '重邮约跑团',
  repository: 'https://github.com/yhan-sun/cqupt-zyfx',
  verifiedAt: '2026-09-07',
  join: {
    verified: false,
    url: null,
    label: '查看入团方式',
    notice: '入群方式与本学期约跑安排正在核实。请通过校内社团招新渠道联系跑步爱好者协会，确认后再加入；本站暂不收集报名信息。'
  }
});

export const routes = Object.freeze({
  track: {
    number: '01', title: '太极运动场', tag: '从熟悉的一圈开始',
    description: '不用先决定跑多远。找一个舒服的节奏，绕着操场跑一跑，把注意力交还给呼吸和脚步。',
    facts: ['操场绕圈', '距离自己定', '适合结伴'],
    note: '场地开放、跑道使用与集合位置，以学校及组织者当日通知为准。示意图不代表实际测绘。',
    map: 'https://uri.amap.com/search?keyword=%E9%87%8D%E5%BA%86%E9%82%AE%E7%94%B5%E5%A4%A7%E5%AD%A6%E5%A4%AA%E6%9E%81%E8%BF%90%E5%8A%A8%E5%9C%BA&city=%E9%87%8D%E5%BA%86',
    source: 'https://www.cq.chinanews.com.cn/news/2025/0330/39-48269.html'
  },
  campus: {
    number: '02', title: '校园里的慢跑', tag: '换条路，也换个心情',
    description: '重邮的校园马拉松曾经过樱花大道与校园地标。日常跑步不必照搬赛道，选择开放、熟悉、人车较少的路段就好。',
    facts: ['校园路跑', '留意来车', '不追求配速'],
    note: '这是路线灵感，不是已勘测的导航路线。遵守校园管理要求，路口减速，避开施工与拥挤路段。',
    map: 'https://uri.amap.com/search?keyword=%E9%87%8D%E5%BA%86%E9%82%AE%E7%94%B5%E5%A4%A7%E5%AD%A6&city=%E9%87%8D%E5%BA%86',
    source: 'https://www.cqnews.net/app/content_1487904406326575104.html'
  }
});

export const stories = Object.freeze([
  {
    id: 'campus-2026', category: 'campus', date: '2026-03-29', eyebrow: '校园赛事 · 2026.03',
    title: '樱花开的时候，重邮又跑了起来。',
    paragraphs: [
      '2026年3月29日，第八届重邮人马拉松比赛在太极运动场开跑。赛道经过校园樱花大道与标志性建筑。',
      '这是一条把日常校园连成赛道的路线：熟悉的路口、路边的春色，和同一方向的脚步。校友、师生在这里相遇。',
      '本文为校园赛事公开报道摘编，不代表跑步爱好者协会主办，也不作为新的报名或活动通知。'
    ],
    source: 'https://www.cqnews.net/app/content_1487904406326575104.html', sourceName: '第1眼TV－华龙网 · 2026年3月29日报道'
  },
  {
    id: 'campus-2025', category: 'campus', date: '2025-03-29', eyebrow: '校园赛事 · 2025.03',
    title: '在最熟悉的校园，遇见一条赛道。',
    paragraphs: [
      '2025年3月29日，第七届重邮人马拉松比赛在太极运动场举行，同时启动建校75周年系列活动。',
      '报道中的“樱花赛道”途经校园地标，设置了个人、接力与体验等不同组别。跑步让平时匆匆走过的校园，多了一种打开方式。',
      '本文为校园赛事资料回顾，图片为2019年腾飞门校园资料照，并非该届比赛现场。具体赛事信息请查看原始报道。'
    ],
    source: 'https://www.cq.chinanews.com.cn/news/2025/0330/39-48269.html', sourceName: '中新网重庆 · 2025年3月30日报道'
  },
  {
    id: 'club-record', category: 'club', date: null, eyebrow: '社团档案 · 公开成绩记录',
    title: '自邮飞翔，把名字留在赛道上。',
    paragraphs: [
      '公开完赛成绩页面中，可以查到“重庆邮电大学－自邮飞翔”和“重庆邮电大学－自邮飞翔二队”两个队名。',
      '本站保留原始成绩查询入口，不转载个人成绩、姓名或联系方式；队伍名以原页面记载为准。',
      '由于已检索页面不足以确认完整赛事名称、日期与团体名次，这里不补写这些信息，也不据此宣称获奖。'
    ],
    source: 'https://frontend.moveclub.vip/match-time-display/memberwap?matchid=800&trackid=486', sourceName: '赛事公开完赛成绩页面 · matchid 800 / trackid 486'
  }
]);
