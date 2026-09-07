# Repository guidelines

Read README.md, docs/CONTENT.md and data/media.json before changing content.

The current user direction supersedes the first edition: follow CQUPT's teal-and-white university style, clear Chinese navigation, sourced campus photography and dated news. Do not restore the warm-paper/red campaign design, giant English slogans, sticker seals, fake counters or generic stock runners.

Source content is data/content.json and data/media.json. Render static HTML through scripts/render.mjs; never maintain a second stale copy in the repository root or edit dist. Every news article has a real static path and a linked source. Dist is generated and ignored.

Preserve keyboard operation, manual (not autoplay) carousel, gallery focus restoration, mobile navigation, no-JavaScript reading and relative paths for project Pages. Keep runtime JavaScript dependency-free unless a concrete need justifies a change.

Run npm test, npm run build and Chromium tests. Failed media fetches or image validation must fail production builds, not substitute a broken image. Respect the deployment gate and minimal permissions. Administrator-only Pages enablement is not a capability of GITHUB_TOKEN.

Never claim attribution grants a license. Retain original rights, authorship, years and source links. Do not fabricate school endorsement, association history, results, event schedules, QR codes or membership contacts. Never add private phone numbers or student IDs to the public repository.
