# 重庆邮电大学跑步爱好者协会

重邮约跑团 · 自邮飞翔。网站参考重庆邮电大学现版官网的青绿色、白底、中文栏目、通栏校园照片与日期式新闻列表，使用真实校园、跑团与赛事素材组织内容。

Pages：https://cqupt.yhan.fun/ 。主要入口：

- `/about.html`：协会介绍、会长自述、协会侧补充影像与参与方式
- `/club.html`：活动记录，自邮飞翔公众号公开记录与校园赛事档案
- `/gallery.html`：相册，公众号跑团影像、协会补充影像与校园赛事照片
- `/runners.html`：跑友风采，由本人确认的跑友资料、个人记录与跑步照片
- `/science.html`：科学跑步专区
- `/join.html`：当前可核实的 QQ 加入入口

## 开发与构建

Node.js 22+、npm。构建阶段使用 Node.js 的 `sharp` 处理和校验图片；浏览器端没有第三方 JavaScript 运行依赖。

```sh
npm ci
npm run build
node scripts/serve.mjs --dir dist --base /cqupt-zyfx/
```

生产构建不需要 Python；仓库中的浏览器验收脚本使用 Python Playwright，只有执行这组验收命令时才需要 Python 环境。

正式构建会验证并同站托管校园/赛事图片、科学跑步动作媒体和公众号跑团资料图。20 张公众号图片均登记原文章、尺寸和 SHA-256；源文件变化时构建失败，不自动接受未知替换。协会侧另提供 9 张校园跑步、赛事交流与跑友照片，作为独立素材登记，不据此声明开放许可。跑团提供的 QQ 二维码解析为 `https://qm.qq.com/q/9rKOuWR8Ag`，站内使用同一目标生成的 `assets/join-qq.svg`。

最终构建由 `scripts/build.mjs` 统一完成：媒体校验 → 模型组装 → 静态页面渲染 → 资源、CNAME、站点地图与来源收尾。不要直接编辑 `dist`。

## 自动化检查

```sh
python -m pip install playwright==1.55.0
python -m playwright install chromium
python tests/structure_browser.py
python tests/motion_browser.py
```

先启动 `dist` 服务。Actions 运行单元与内容测试、图片校验、桌面/手机浏览器检查、无 JavaScript 降级检查、动作/大图交互检查。`main` 部署后再通过公网 HTTPS 校验关键页面与代表性图片资源。

`npm run preview:export` 导出离线互动预览；生产网站由构建脚本生成独立静态页面。

## 资料维护

- `data/content.json`：基础校园赛事与站点内容。
- `data/official-posts.json`、`data/official-media.json`：CQUPT自邮飞翔公众号公开记录和筛选影像。
- `data/member-media.json`：协会侧本次提供的 9 张补充照片，以及会长本人提供的自述文字。
- `data/runner-profiles.json`：跑友风采的人物资料、个人记录、宣言和本人确认范围；图片必须引用已登记的协会照片。
- `data/science.mjs`、`data/science-media.json`：科学跑步内容及动作图源。

新增或修改资料时，保持“本人自述 / 协会侧提供 / 公众号公开记录 / 外部官方资料”之间的来源边界。不得从照片自行推断个人身份、项目或成绩；学校代表队成绩不能改写为协会成绩，公开赛事背景不能改写为协会主办。

## 素材权利与隐私

校园官网、新闻和公众号图片的署名并不等于开放授权。协会侧补充照片同样不声明开放许可；若公开展示范围发生变化，应由运营方及时替换或下架。

学校标识仅用于学校识别，不宣称学校认证。网站没有报名后台，不保存个人报名数据；QQ 加入方式由委托方提供并核实。历史招新时间、旧二维码和旧训练安排不作为当前通知。
