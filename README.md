# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。第二版参考重邮现版官网：青绿色、白底、中文栏目、通栏校园照片与日期式新闻列表。移除第一版的跑道红、大英文、贴纸印章及口号式文案。

预期 Pages 地址：https://yhan-sun.github.io/cqupt-zyfx/ 。是否已上线，以同一提交的部署记录及实际访问为准。首次启用需要管理员在 Settings → Pages → Source 选择 GitHub Actions。

## 开发与构建

Node.js 22+、Python 3.12+，以及 Pillow。浏览器运行代码没有第三方 JavaScript 依赖。

```sh
python -m pip install Pillow==11.3.0
npm ci
npm run dev
```

打开 http://localhost:4173/ 。正式构建从14个已登记的图片地址取得照片和学校标识，验证图片、移除附带元数据，生成 WebP 与响应式小图，全部同站托管。网络失败会重试，最终失败则停止构建，不以空白图片通过。

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
```

先启动 dist 服务。`SITE_URL` 可指定其他预览服务；`CHROMIUM_PATH` 可指定已安装的 Chromium。截图和结果保存在 `test-results/`。

Actions 运行单元与内容检查、图片处理、桌面/手机浏览器检查、静态多页面路由检查，以及无 JavaScript 降级检查。构建只读，只有 main 部署任务有 `pages: write` 与 `id-token: write`；不会在失败后跳过门禁。推送设计分支仅构建不部署。

`npm run preview:export` 导出 `cqupt-campus-preview.html`，把8个页面、照片、样式及交互内置到一个离线 HTML，适合直接用浏览器预览。完整生产网站在 `dist/`，包含真正独立的新闻详情页，不依赖 SPA 重定向。

## 维护位置

| 文件 | 内容 |
| --- | --- |
| `data/content.json` | 社团名称、经核实的招新链接、轮播、赛事、社团手记、相册和跑步场地 |
| `data/media.json` | 每项图片的原始地址、供稿方、年份及权利说明 |
| `scripts/render.mjs` | 构建时生成8个页面，详情页与首页共用同一资料源 |
| `scripts/media.py` | 图片验证、响应式压缩与来源记录 |
| `assets/styles.css` | 重邮风格布局与手机适配 |
| `assets/app.js` | 手动轮播、筛选、图片查看、菜单、配速和复制 |
| `docs/CONTENT.md` | 资料边界及运营交接 |

不要直接编辑 dist。新增赛事应补齐来源与日期，配图年份必须与说明一致。2026年报道使用明确标注的校园资料图，不冒充当届比赛现场。

## 素材权利与隐私

当前资料包括重邮官网校园图片、学校供稿的2024年比赛照片、2025年报道现场图，以及 Junyi Lou 的2019年腾飞门照片。腾飞门为 CC BY-SA 4.0，Elaron 的田径场资料图为 CC BY 2.0；其余官网和新闻图片未发现开放许可，署名不等于已获授权。运营方正式使用前须确认许可范围或换成自有照片。完整出处随站点生成在 sources.html。

学校标识仅用于识别所属学校，不宣称学校认证。本项目没有报名后台，不保存个人信息，不伪造报名成功。配速与复制只在本地执行，照片不使用外部热链。

## 并发内容迁移

改版期间主分支新增了 8c7f88c 的田径场稿件。原稿完整保存在 `data/contributions/track-prep.original.json`，展示内容迁移到 `data/content.json` 的 notes 和 `notes/track-prep.html`。旧稿的招新表述不作为当前报名通知。Elaron 的2007年田径场资料照已核对 CC BY 2.0 许可，明确不是重邮校园照片。
