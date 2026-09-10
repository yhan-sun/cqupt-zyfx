# Repository guidelines

Read README.md, docs/CONTENT.md and the relevant domain document before changing content. The September 2026 refactor follows the user's request to reduce repetition and distinguish organizations, events and image sources accurately.

## Scope and editorial rules

Keep CQUPT's teal-and-white character, readable Chinese navigation and genuine running photography. Do not add decorative slogans, fabricated counters, automatic carousels or another visual-polish stylesheet.

Navigation is 首页 / 协会介绍 / 活动记录 / 相册 / 跑友风采 / 跑步指南 / 加入我们. The join destination is a distinct action in the same accessible navigation. Keep existing news, note and science URLs working.

The association name and aliases live in data/site.json. Do not redefine a name as merely a QQ channel or a public account. Do not infer a formal relationship between school teams, alumni teams and the association without evidence. Do not infer identity, results, health status or membership from a photograph.

Write concrete public copy: what happened, when, where and how to join. Avoid construction-process language such as 本次提供 or 协会补充. Preserve necessary attribution, event scope, historical labels and health cautions. Source ledgers belong on sources.html, not in every hero or caption. Preserve the supplied president's first-person text as a quotation.

## Data

Current QQ details are owned only by data/join.json. The verified group is 468686951, direct URL https://qm.qq.com/q/9rKOuWR8Ag, QR assets/join-qq.svg. Do not invent signup forms or successes. Contact or participation-scope changes require verification; editorial shortening must not change the verified meaning.

Activities retain eventDate separately from published. Missing event dates remain missing; publication dates must be labeled. Historical recruitment and weekly schedules are not current notices. School volunteer numbers are not club membership; registration awards are not competitive rankings.

Gallery categories describe content, not who supplied the photo. All provided and official photos retain source and rights information. Member images, official-account images and science media have integrity checks; never remove them to accept changed sources.

跑友资料维护在 `data/runner-profiles.json`。这是本人确认的资料展示，不是完整或实时的队员名册；成绩、宣言、年级、学院和照片只在本人提供或明确核实后发布，不做横向排名，不把照片当作身份、成绩或成员关系的推断依据。

## Architecture and verification

Use model.mjs, layout.mjs and page templates. Render each page once. Do not read generated HTML back to rewrite main content, navigation or metadata. Do not edit dist or maintain parallel page copies. Keep runtime JavaScript dependency-free unless a specific need justifies a dependency.

One shared viewer reads visible links in DOM order. Preserve native links without JavaScript, Escape/focus return, modifier-click behavior, reduced-motion preferences and explicit GIF playback. Do not add personal data collection or individual medical recommendations.

Run npm test, npm run build, npm run check and npm run test:e2e against the built site. Media failures must stop the build. Browser checks should verify semantic behavior and link integrity, not freeze decorative prose or incidental card counts. Keep Pages deployment restricted to main and verify the published commit after deployment.
