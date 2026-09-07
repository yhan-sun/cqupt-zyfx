# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。第二版参考重邮现版官网：青绿色、白底、中文栏目、通栏校园照片与日期式新闻列表。移除第一版的跑道红、大英文、贴纸印章及口号式文案。

Pages 地址：https://yhan-sun.github.io/cqupt-zyfx/ 。是否已发布最新版本，以同一提交的部署记录及实际访问为准。首次启用需要管理员在 Settings → Pages → Source 选择 GitHub Actions。

## 开发与构建

Node.js 22+、Python 3.12+，以及 Pillow。浏览器运行代码没有第三方 JavaScript 依赖。

```sh
python -m pip install Pillow==11.3.0
npm ci
npm run dev
```

打开 http://localhost:4173/ 。正式构建从14个已登记的校园图片地址取得照片和学校标识，验证图片、移除附带元数据，生成 WebP 与响应式小图；另取得16个动作原始媒体文件，验证哈希、尺寸与所有帧，生成静态预览并保留原始 GIF。全部同站托管。网络失败会重试，最终失败则停止构建，不以空白图片通过。

```sh
npm test
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

项目子路径测试地址：http://localhost:4173/cqupt-zyfx/ 。`npm run build -- --offline` 仅使用已有图片缓存；缓存缺失时失败，不会退回外部图库。

## 自动化检查

```sh
python -m pip install playwright==1.55.0
python -m playwright install chromium
python tests/browser.py
python tests/science_browser.py
```

先启动 dist 服务。`SITE_URL` 可指定其他预览服务；`CHROMIUM_PATH` 可指定已安装的 Chromium。截图和结果保存在 `test-results/`。

Actions 运行单元与内容检查、图片处理、桌面/手机浏览器检查、静态多页面路由检查，以及无 JavaScript 降级检查。构建只读，只有 main 部署任务有 `pages: write` 与 `id-token: write`；不会在失败后跳过门禁。推送设计分支或科学跑步分支仅构建不部署。main 部署后还检查8个科学专区页面和原始GIF的公开HTTPS访问。

`npm run preview:export` 导出 `cqupt-campus-preview.html`，把16个页面、照片、样式及交互内置到一个离线 HTML，适合直接用浏览器预览。完整生产网站在 `dist/`，包含真正独立的新闻和知识详情页，不依赖 SPA 重定向。

## 维护位置

| 文件 | 内容 |
| --- | --- |
| `data/content.json` | 社团名称、经核实的招新链接、轮播、赛事、社团手记、相册和跑步场地 |
| `data/media.json` | 每项校园图片的原始地址、供稿方、年份及权利说明 |
| `scripts/render.mjs` | 构建时生成16个页面，详情页与首页共用同一资料源 |
| `scripts/media.py` | 校园图片验证、响应式压缩与来源记录 |
| `assets/styles.css` | 重邮风格布局与手机适配 |
| `assets/app.js` | 手动轮播、筛选、图片查看、菜单、配速和复制 |
| `docs/CONTENT.md` | 资料边界及运营交接 |

不要直接编辑 dist。新增赛事应补齐来源与日期，配图年份必须与说明一致。2026年报道使用明确标注的校园资料图，不冒充当届比赛现场。

## 素材权利与隐私

当前资料包括重邮官网校园图片、学校供稿的2024年比赛照片、2025年报道现场图，以及 Junyi Lou 的2019年腾飞门照片。腾飞门为 CC BY-SA 4.0，Elaron 的田径场资料图为 CC BY 2.0；其余官网和新闻图片未发现开放许可，署名不等于已获授权。运营方正式使用前须确认许可范围或换成自有照片。完整出处随站点生成在 sources.html。

学校标识仅用于识别所属学校，不宣称学校认证。本项目没有报名后台，不保存个人信息，不伪造报名成功。配速与复制只在本地执行，照片不使用外部热链。

## 并发内容迁移

改版期间主分支新增了 8c7f88c 的田径场稿件。原稿完整保存在 `data/contributions/track-prep.original.json`，展示内容迁移到 `data/content.json` 的 notes 和 `notes/track-prep.html`。旧稿的招新表述不作为当前报名通知。Elaron 的2007年田径场资料照已核对 CC BY 2.0 许可，明确不是重邮校园照片。

## 科学跑步专区

在线入口：https://yhan-sun.github.io/cqupt-zyfx/science.html 。新增 8 个静态页面，保留原有 8 页：专区首页、热身、拉伸、训练方法、力量、营养补给、恢复安全、参考资料。10 种训练方法、14 个动作、12 个原始 GIF、4 幅静态分解图；文字依据和图源独立标注。

- `data/science.mjs`：专题正文、训练分类、动作要点和参考资料。
- `data/science-media.json`：原始图源、作者、许可、尺寸、帧数和 SHA-256。
- `scripts/science.mjs`：专区静态页面与首页入口。
- `scripts/science-media.py`：验证全部动图帧、生成静态预览、同站托管原始 GIF。缓存与下载均校验哈希；图源变更必须重新核实，不能自动接受未知媒体。
- `assets/science.css`、`assets/science.js`、`assets/science-core.mjs`：专区布局、搜索、手动播放和补给标签换算。
- `tests/science.test.mjs`、`tests/science_browser.py`：来源完整性、静态路由、GIF 默认不播放、搜索与营养工具边界、移动端和无 JavaScript 检查。

动图默认展示静态帧，手动播放，同一页面只运行一组，切走标签页会停止。没有用生成式图片冒充真实动作；静态分解图不冒充原始 GIF。补给计算只做用户输入的标签算术，不生成个体营养处方、不上传输入。每页标明适用范围，数值必须带场景、单位与来源。

CDC 原始动画是老年人基础力量教育资料，本站只用来帮助识别动作，不把图源人群或负荷当作跑者专项证据。CC BY-SA 派生静态帧与转码继续遵循原许可。全文资料整理并未经过医师临床审核。维护前阅读 `docs/SCIENCE.md`。
