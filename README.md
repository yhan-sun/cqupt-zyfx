# 自邮飞翔 · 重邮约跑团

重庆邮电大学跑步爱好者协会展示网站。以纸白、跑道红、运动摄影与编辑式排版呈现校园跑步社群，不使用虚构人数、赛事战绩、训练安排或报名通道。

预期 Pages 地址：https://yhan-sun.github.io/cqupt-zyfx/ 。首次上线必须在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**；地址是否已上线请以 Actions 部署记录和实际访问为准。

## 本地运行

需要 Node.js 22 或更高版本。生产代码没有第三方 JavaScript 依赖。

```sh
npm ci
npm run dev
```

打开 http://localhost:4173 。

```sh
npm test
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

离线检查可使用 `npm run build -- --offline`，此模式保留原始图片地址，不代表照片已下载。正式构建要求两张授权摄影成功下载、通过 JPEG 类型与大小检查，随后同站托管，失败则终止构建。

## 浏览器验证

```sh
python -m pip install playwright==1.55.0
python -m playwright install chromium
REQUIRE_LOCAL_MEDIA=1 python tests/browser.py
```

另一个终端先运行上面的 dist 服务。默认测试地址为 http://127.0.0.1:4173/cqupt-zyfx/ ，可通过 `SITE_URL` 覆盖。`CHROMIUM_PATH` 可指定已有浏览器。测试覆盖桌面、320/390/768px、菜单、筛选、路线切换、弹窗焦点、配速边界、复制反馈、无 JavaScript 降级和正式图片加载。截图保存在 `test-results/`。

## 内容维护

- `data/site.mjs`：社团信息、经核实的报名 URL、路线文字与来源、手记详情。
- `index.html`：静态首屏、手记列表摘要与 FAQ。为保证无 JavaScript 可读，修改列表时需与数据文件同步。
- `data/media.json`、`sources.html`：摄影来源、作者、许可与公开资料依据。
- `assets/styles.css`：设计变量与响应式布局；`assets/app.js`：渐进增强交互；`assets/core.mjs`：纯计算与过滤逻辑。
- `docs/CONTENT.md`：上线内容边界和交接清单。

## 自动部署

`.github/workflows/pages.yml` 在 main 推送和 Pull Request 时执行单元/内容测试、正式构建、真实 Chromium 测试并保存截图。只有 main 的非 PR 工作流可以部署，并且部署必须依赖所有构建与测试成功。

工作流遵循最小权限：构建只读；部署仅需要 `pages: write` 和 `id-token: write`。不需要仓库保存任何 PAT。第一次开启 Pages 是仓库管理员设置，不冒充 `GITHUB_TOKEN` 可以取得管理员权限。启用后可在 Actions 重跑失败的 deploy job，或手动运行整个工作流。

## 素材与隐私

Braden Collum 的跑步照片采用 Unsplash License；Junyi Lou 的重邮腾飞门照片采用 CC BY-SA 4.0，改编版本保留同一许可。详见网站“素材与说明”。新闻只使用自行编写的简短摘要和原文链接，不拷贝新闻图片。原创标记不冒充官方校徽或历史会徽。

没有账号、报名后端或追踪脚本。配速计算只在浏览器进行；复制只在点击后写入剪贴板，不读取内容。没有以公开 Issue 收集手机号、学号或报名资料的流程。
