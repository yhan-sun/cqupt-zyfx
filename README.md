# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。网站参考重庆邮电大学现版官网的青绿色、白底、中文栏目、校园摄影和日期式新闻列表，内容由校园赛事、跑团足迹、科学跑步、跑步服务和加入入口组成。

Pages：https://yhan-sun.github.io/cqupt-zyfx/ 。当前加入入口：https://yhan-sun.github.io/cqupt-zyfx/join.html 。是否已发布最新版本，以对应 main 提交的 Pages 部署与线上验证为准。

## 开发与构建

Node.js 22+、Python 3.12+、Pillow。浏览器端没有第三方 JavaScript 运行依赖。

```sh
python -m pip install Pillow==11.3.0
npm ci
npm run dev
```

正式构建会处理三类媒体：14 项校园/赛事图片、16 个科学跑步动作媒体、8 幅公众号跑团资料图。外部媒体按登记信息验证后同站托管；动作与公众号素材还校验固定哈希。用户提供的 QQ 入群二维码作为 `assets/join-qq.jpg` 随站点直接发布，不经过第三方图片热链。

```sh
npm test
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

项目子路径测试地址：http://localhost:4173/cqupt-zyfx/ 。`npm run build -- --offline` 仅使用已有外部媒体缓存；缓存缺失时失败，不会用空白或未知图片绕过验证。

## 自动化检查

```sh
python -m pip install playwright==1.55.0
python -m playwright install chromium
python tests/browser.py
python tests/science_browser.py
python tests/official_browser.py
python tests/join_browser.py
```

Actions 覆盖单元/内容检查、图片处理、桌面和手机浏览器、键盘、无 JavaScript、静态直达路由、二维码本地加载、QQ群号文字备用以及历史/当前信息边界。构建只读，只有 main 部署任务拥有 `pages: write` 和 `id-token: write`。

`npm run preview:export` 导出 `cqupt-campus-preview.html`，把当前 **18 个静态页面**、图片、二维码、样式与交互内置为一个离线 HTML。生产网站在 `dist/`，不依赖 SPA 重定向。

## 主要维护位置

| 文件 | 内容 |
| --- | --- |
| `data/content.json` | 基础站点、校园赛事、相册、跑步场景和社团手记 |
| `data/official-posts.json` | 委托方提供的 8 篇 CQUPT自邮飞翔公众号资料整理 |
| `data/official-media.json` | 公众号所选团队/赛事图片的来源、尺寸和哈希 |
| `data/join.json` | 当前 QQ 群号、参与说明、核对日期和活动类型 |
| `assets/join-qq.jpg` | 跑团提供的当前 QQ 群二维码 |
| `data/science.mjs` | 科学跑步专题、训练方法、动作与参考资料 |
| `scripts/render.mjs` | 生成基础 16 个静态页面 |
| `scripts/official-build.mjs` | 加入 `club.html` 并把跑团官方资料交叉引用到站内 |
| `scripts/join-build.mjs` | 加入 `join.html`，升级首页加入模块、导航、来源页和移动入口 |
| `docs/CONTENT.md` | 内容边界、当前加入入口与运营交接 |
| `docs/OFFICIAL-ARCHIVE.md` | 公众号历史资料的语义和权利边界 |
| `docs/SCIENCE.md` | 科学跑步内容与媒体维护规则 |

不要直接编辑 `dist`。

## 跑团足迹与当前加入入口

`club.html` 将委托方提供的 8 篇 `CQUPT自邮飞翔` 公众号文章整理为 2024–2026 跑团档案。历史训练、旧招新截止日期、旧二维码和个人成绩表不会被当作当前通知。

当前可公开加入信息由跑团于 2026-09-07 提供并核对：

- QQ 群：`468686951`
- 群名：重邮约跑团
- 定位：为重邮学子搭建的跑步交流平台
- 内容：不定期交流活动、校内跑步打卡、训练交流，以及合适机会下的校外马拉松赛事交流/同行

具体入群审核、活动时间、集合点、配速分组和赛事报名，以群内当期通知及赛事主办方规则为准。网站没有入群申请表或报名后台，不收集 QQ 号、手机号、学号、健康信息或比赛报名资料。

## 素材权利与隐私

学校官网、新闻报道和公众号图片中，只有明确登记为开放许可的素材可按相应许可使用；署名不等于取得授权。公众号所选图片未发现开放许可，来源页如实保留这一边界。正式运营方应继续确认摄影与肖像使用范围，或逐步换成取得授权的跑团自有照片。

学校标识只用于识别所属学校，不宣称学校认证。用户提供的 QQ 二维码用于当前跑团交流入口，不把其中信息扩展成学校行政服务或固定活动承诺。

## 科学跑步专区

入口：https://yhan-sun.github.io/cqupt-zyfx/science.html 。专区包括首页、热身、拉伸、训练方法、力量、营养补给、恢复安全和参考资料 8 个页面；含 10 种训练方法、14 个动作、12 个原始 GIF 与 4 幅静态分解图。

动图默认静止并由用户手动播放。补给计算只做用户输入的标签算术，不生成个体营养处方、不上传输入。科学资料与动作图源分开溯源，维护前阅读 `docs/SCIENCE.md`。
