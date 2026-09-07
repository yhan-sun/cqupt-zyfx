# Repository guidelines

Read README.md, docs/CONTENT.md, data/media.json, data/join.json and the relevant domain docs before changing content.

The current user direction supersedes earlier layouts. Follow CQUPT's teal-and-white university style, clear Chinese navigation and sourced campus/running photography. Do not restore the warm-paper/red campaign design, giant English slogans, sticker seals, fake counters or generic stock runners.

The final first-level information architecture is: `首页 / 协会介绍 / 赛事与足迹 / 跑步影像 / 科学跑步 / 加入我们`. Do not recreate separate first-level `校园赛事`, `跑团足迹`, `校园影像` or `跑步服务` items unless the user explicitly changes direction. `club.html` combines run-club footprints with campus-event archives while preserving their different provenance. `gallery.html` is the standalone running-photo archive. The old `news.html` and `news/marathon-*.html` routes remain compatibility/deep-link pages.

Source content is structured under data/. Render static HTML through the build scripts; never maintain a second stale copy in the repository root or edit dist. The final output is postprocessed by `scripts/structure-build.mjs`, so inspect the built site rather than assuming the base template is the final UI.

Preserve mobile navigation, no-JavaScript reading, relative project-Pages paths and existing keyboard behavior. New interaction must be progressive enhancement; the underlying photo/source/article content must remain usable without JavaScript. Keep runtime JavaScript dependency-free unless a concrete need justifies a change.

Run `npm test`, `npm run build` and `python tests/structure_browser.py` against the built site. Failed media fetches or validation must fail production builds, not substitute blank or unknown images. Respect the Pages deployment gate and minimal permissions.

Never claim attribution grants a license. Retain original rights, authorship, years and source links. Do not fabricate school endorsement, association history, results, event schedules, QR codes or membership contacts. Running-gallery captions may describe only supported scenes; never infer a person's identity, result, health condition or club membership from an image.

Public join information may be published only when the running group/user has supplied or explicitly verified it. The current QQ join source lives in `data/join.json` and `assets/join-qq.svg`: group `468686951`, direct link `https://qm.qq.com/q/9rKOuWR8Ag`. Group number, direct link, QR, name, audience wording or participation description changes require re-verification. Do not resurrect old WeChat recruitment deadlines, old QR codes, historical achievement thresholds or past weekly training times as current information. Keep both text group-number fallback and direct QQ join action; never create fake registration success.

Official-account archive content lives in `data/official-posts.json` and `data/official-media.json`. Preserve scope on ambiguous numbers and historical claims; read `docs/OFFICIAL-ARCHIVE.md`. Eight selected official-account photos also appear on `gallery.html`; they have no known open license, so their rights note and original-article links must remain.

Scientific running content lives in `data/science.mjs` and `data/science-media.json`. Preserve the separation between evidence, original educational examples and movement illustrations. Do not add unsourced dosage rules, weight-loss targets, diagnosis tools or fabricated professional review. GIFs start as static posters, are explicitly played, and retain original provenance. Never remove SHA-256 or frame validation to bypass changed sources.
