# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。网站参考重庆邮电大学现版官网的青绿色、白底、中文栏目与校园摄影。当前一级信息架构收敛为：**首页 / 协会介绍 / 赛事与足迹 / 跑步影像 / 科学跑步 / 加入我们**。

Pages：https://yhan-sun.github.io/cqupt-zyfx/ 。主要入口：

- 赛事与足迹：https://yhan-sun.github.io/cqupt-zyfx/club.html
- 跑步影像：https://yhan-sun.github.io/cqupt-zyfx/gallery.html
- 科学跑步：https://yhan-sun.github.io/cqupt-zyfx/science.html
- 加入约跑团：https://yhan-sun.github.io/cqupt-zyfx/join.html

## 当前结构

`club.html` 将两类不同性质的历史资料放到同一栏目中查阅：一类是委托方提供的 8 篇 `CQUPT自邮飞翔` 公众号跑团记录；另一类是 2024–2026 三届重邮人马拉松公开资料。页面明确区分“跑团公开足迹”和“校园赛事”，不会把学校赛事写成跑团主办活动。

原 `news.html` 保留为兼容入口，提示“校园赛事已并入赛事与足迹”，三个赛事正文 `news/marathon-*.html` 继续保留，避免旧链接失效。

`gallery.html` 是独立的跑步影像页面，当前包含 **14 张**带说明和出处的跑步照片：8 张来自此前整理的 `CQUPT自邮飞翔` 公众号团队/训练/赛事素材，6 张来自校园马拉松公开资料。首页只保留四张影像预览，不再放完整相册。

原“跑步服务”一级栏目和首页服务区已经撤下，不再展示场地切换、配速工具等入口。加入页中原先指向“跑步场景”的链接也改为“跑步影像”。

## 开发与构建

Node.js 22+、Python 3.12+、Pillow。浏览器端没有第三方 JavaScript 运行依赖。

```sh
python -m pip install Pillow==11.3.0
npm ci
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

正式构建处理三类外部媒体：校园/赛事图片、科学跑步动作媒体、公众号跑团资料图。外部媒体按登记信息验证后同站托管；动作与公众号素材还校验固定哈希。跑团提供的 QQ 二维码解析为 `https://qm.qq.com/q/9rKOuWR8Ag`，站内使用由同一链接重新生成的 `assets/join-qq.svg`。

构建顺序为：基础静态页 → 公众号跑团档案 → QQ 加入体验 → 最终信息架构整理。`scripts/structure-build.mjs` 负责最终合并赛事栏目、生成 `gallery.html`、撤下跑步服务并统一全站导航。

当前构建产出 **19 个静态页面**。生产网站在 `dist/`，不依赖 SPA 重定向；不要直接编辑 `dist`。

## 自动化检查

```sh
npm test
python -m pip install playwright==1.55.0
python -m playwright install chromium
python tests/structure_browser.py
```

浏览器门禁覆盖：首页最终结构、赛事与足迹合并、14 张跑步影像与来源、旧赛事深链接、科学跑步、QQ 加入入口、320/390/768/1024/1440 px、移动菜单、无 JavaScript 阅读和同站图片加载。只有 `main` 部署任务拥有 `pages: write` 与 `id-token: write`。

`npm run preview:export` 导出包含当前静态站的离线互动预览。

## 主要维护位置

| 文件 | 内容 |
| --- | --- |
| `data/content.json` | 基础站点与三届校园赛事资料；历史 routes/gallery 字段仍作为基础渲染输入，最终展示由结构构建阶段收敛 |
| `data/official-posts.json` | 8 篇 CQUPT自邮飞翔公众号资料整理 |
| `data/official-media.json` | 公众号团队/训练/赛事图片来源、尺寸与哈希 |
| `data/join.json` | 当前 QQ 群号、加群链接、参与说明和核对日期 |
| `data/science.mjs` | 科学跑步专题、训练方法、动作与参考资料 |
| `scripts/render.mjs` | 基础静态页生成 |
| `scripts/official-build.mjs` | 公众号跑团档案与交叉引用 |
| `scripts/join-build.mjs` | `join.html`、首页加入模块、QQ 入群入口 |
| `scripts/structure-build.mjs` | 最终六项导航、赛事合并、跑步影像页、撤下跑步服务 |
| `assets/structure.css` | 新信息架构、赛事合并与跑步影像样式 |
| `assets/gallery.js` | 跑步影像渐进增强 |
| `docs/CONTENT.md` | 内容边界与运营交接 |
| `docs/OFFICIAL-ARCHIVE.md` | 公众号历史资料语义与权利边界 |
| `docs/SCIENCE.md` | 科学跑步维护规则 |

## 当前加入入口

2026-09-07 由跑团提供并核对：QQ 群 `468686951`，QQ 加群入口 `https://qm.qq.com/q/9rKOuWR8Ag`。定位为面向重邮学子的跑步交流平台，包含不定期交流、校内跑步打卡、训练交流，以及合适机会下的校外赛事交流与同行。

具体入群审核、活动时间、集合点、配速分组和赛事报名，以群内当期通知及赛事主办方规则为准。网站没有入群申请表或报名后台。

## 素材权利与隐私

学校官网、新闻报道和公众号图片中，只有明确登记为开放许可的素材可按相应许可使用；署名不等于取得授权。公众号所选图片未发现开放许可，跑步影像页和来源页均保留这一边界。正式运营方应继续确认摄影与肖像使用范围，或逐步换成取得授权的跑团自有照片。

学校标识只用于识别所属学校，不宣称学校认证。不要公开学生手机号、学号、健康信息、报名资料或从照片推断个人身份/成绩。

## 科学跑步专区

专区包括首页、热身、拉伸、训练方法、力量、营养补给、恢复安全和参考资料 8 个页面；含 10 种训练方法、14 个动作、12 个原始 GIF 与 4 幅静态分解图。动图默认静止并由用户手动播放；补给计算只做标签算术，不生成个体营养处方。维护前阅读 `docs/SCIENCE.md`。
