# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。网站参考重庆邮电大学现版官网的青绿色、白底、中文栏目与校园摄影。当前一级信息架构为：**首页 / 协会介绍 / 赛事与足迹 / 跑步影像 / 科学跑步 / 加入我们**。

Pages：https://yhan-sun.github.io/cqupt-zyfx/ 。主要入口：

- 赛事与足迹：https://yhan-sun.github.io/cqupt-zyfx/club.html
- 跑步影像：https://yhan-sun.github.io/cqupt-zyfx/gallery.html
- 科学跑步：https://yhan-sun.github.io/cqupt-zyfx/science.html
- 加入约跑团：https://yhan-sun.github.io/cqupt-zyfx/join.html

## 赛事与足迹

`club.html` 以“自邮飞翔自己的训练、出征与交流”为主线整理委托方提供的 8 篇 `CQUPT自邮飞翔` 公众号记录，并把 2024–2026 三届重邮人马拉松作为校园主场档案放在同页查阅。学校校园赛事不写成跑团主办活动。

页面不再只用“时间 + 一张图 + 一段文字”的新闻时间线，而是按 2026 / 2025 / 2024 三个年度章节展开，并加入训练、一起出发、赛道之外三组影像叙事。历史招新、训练时间、旧二维码和个人成绩表仍不会作为当前通知发布。

原 `news.html` 保留兼容入口，三个赛事正文 `news/marathon-*.html` 继续可直达。

## 跑步影像

`gallery.html` 当前包含 **26 张**带说明和出处的真实跑步照片：

- **20 张自邮飞翔公众号影像**：太极运动场集体训练、5K 测试、跑团合影、清远/重庆/贵阳赛事集结、赛道旗帜、跑友自拍和赛后交流等。
- **6 张校园赛事影像**：来自重邮人马拉松公开资料，与跑团自己的公众号照片分区展示。

页面支持“校园训练 / 跑团赛事 / 团队合影 / 跑友交流 / 校园赛事”筛选与键盘可操作的大图查看。首页只保留文化叙事预览，不再堆完整相册。

## 开发与构建

Node.js 22+、Python 3.12+、Pillow。浏览器端没有第三方 JavaScript 运行依赖。

```sh
python -m pip install Pillow==11.3.0
npm ci
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

正式构建会验证并同站托管校园/赛事图片、科学跑步动作媒体和公众号跑团资料图。20 张公众号图片均登记原文章、尺寸和 SHA-256；源文件变化时构建失败，不自动接受未知替换。跑团提供的 QQ 二维码解析为 `https://qm.qq.com/q/9rKOuWR8Ag`，站内使用同一目标生成的 `assets/join-qq.svg`。

最终构建顺序：基础静态页 → 公众号档案 → QQ 加入体验 → 六项信息架构 → 自邮飞翔文化叙事层。`scripts/culture-build.mjs` 最后重组首页、`club.html` 和 `gallery.html`，因此不要直接编辑 `dist`。

## 自动化检查

```sh
npm test
python -m pip install playwright==1.55.0
python -m playwright install chromium
python tests/structure_browser.py
```

浏览器门禁覆盖：20 张公众号图片、6 张校园赛事图片、三年度跑团档案、影像筛选与键盘大图、旧赛事深链接、科学跑步、QQ 加入入口、320/390/768/1024/1440 px、移动菜单、无 JavaScript 阅读和同站图片加载。只有 `main` 部署任务拥有 `pages: write` 与 `id-token: write`。

## 主要维护位置

| 文件 | 内容 |
| --- | --- |
| `data/content.json` | 基础站点与三届校园赛事资料 |
| `data/official-posts.json` | 8 篇 CQUPT自邮飞翔公众号事实整理 |
| `data/official-media.json` | 20 张公众号训练/活动/赛事照片的来源、尺寸与哈希 |
| `data/club-culture.json` | 年度章节、影像叙事、每篇文章的照片组合与分类 |
| `data/join.json` | 当前 QQ 群号、加群链接、参与说明和核对日期 |
| `data/science.mjs` | 科学跑步专题、训练方法、动作与参考资料 |
| `scripts/official-build.mjs` | 公众号资料基础档案与来源页 |
| `scripts/join-build.mjs` | `join.html` 与 QQ 入群体验 |
| `scripts/structure-build.mjs` | 六项导航、赛事合并和基础跑步影像页 |
| `scripts/culture-build.mjs` | 最终跑团文化首屏、年度时间线、首页和 26 图影像页 |
| `assets/culture.css` | 跑团文化、年度章节、照片拼贴与影像页布局 |
| `assets/gallery.js` | 跑步影像筛选与大图渐进增强 |
| `docs/OFFICIAL-ARCHIVE.md` | 公众号历史资料语义与权利边界 |
| `docs/SCIENCE.md` | 科学跑步维护规则 |

## 当前加入入口

2026-09-07 由跑团提供并核对：QQ 群 `468686951`，QQ 加群入口 `https://qm.qq.com/q/9rKOuWR8Ag`。具体入群审核、活动时间、集合点、配速分组和赛事报名，以群内当期通知及赛事主办方规则为准。网站没有入群申请表或报名后台。

## 素材权利与隐私

公众号新增图片仍**未发现开放许可**，版权归原权利人；来源页保留文章入口与权利说明。署名不等于获得开放授权。正式运营方应继续确认摄影与肖像使用范围，或逐步替换为取得授权的跑团自有照片。

不公开学生手机号、学号、健康信息、报名资料，不从照片推断个人身份或成绩，也不复制公众号个人成绩表。

## 科学跑步专区

专区包括首页、热身、拉伸、训练方法、力量、营养补给、恢复安全和参考资料 8 个页面；含 10 种训练方法、14 个动作、12 个原始 GIF 与 4 幅静态分解图。动图默认静止并由用户手动播放；补给计算只做标签算术，不生成个体营养处方。
