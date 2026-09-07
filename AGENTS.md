# Repository guidelines

Read README.md, docs/CONTENT.md, data/media.json, data/join.json and the relevant domain docs before changing content.

The current user direction supersedes the first edition: follow CQUPT's teal-and-white university style, clear Chinese navigation, sourced campus photography and dated news. Do not restore the warm-paper/red campaign design, giant English slogans, sticker seals, fake counters or generic stock runners.

Source content is structured under data/. Render static HTML through the build scripts; never maintain a second stale copy in the repository root or edit dist. Every news or archive fact that came from an external publication keeps its source and date.

Preserve keyboard operation, manual (not autoplay) carousel, gallery focus restoration, mobile navigation, no-JavaScript reading and relative paths for project Pages. Keep runtime JavaScript dependency-free unless a concrete need justifies a change.

Run npm test, npm run build and all Chromium suites. Failed media fetches or image validation must fail production builds, not substitute a broken image. Respect the deployment gate and minimal permissions.

Never claim attribution grants a license. Retain original rights, authorship, years and source links. Do not fabricate school endorsement, association history, results, event schedules, QR codes or membership contacts. Public join information may be published only when the running group/user has supplied or explicitly verified it; preserve its review date and current-vs-historical boundary. Never add private phone numbers, student IDs, health data or registration records to the public repository.

The current QQ join source lives in data/join.json and assets/join-qq.jpg. Group number, QR, group name, audience wording or participation description changes require re-verification. Do not resurrect old WeChat recruitment deadlines, old QR codes, historical achievement thresholds or past weekly training times as current information. The site must keep a text fallback for the QR and must not create a fake registration-success flow.

Official-account archive content lives in data/official-posts.json and data/official-media.json. Preserve scope on ambiguous numbers and historical claims; read docs/OFFICIAL-ARCHIVE.md before changing the archive.

Scientific running content lives in data/science.mjs and data/science-media.json. Preserve the separation between evidence, original educational examples and movement illustrations. Do not add unsourced dosage rules, weight-loss targets, diagnosis tools or fabricated professional review. GIFs start as static posters, are explicitly played, and retain original provenance. Never remove SHA-256 or frame validation to bypass changed sources. Run the science unit and browser suites in addition to existing, official-archive and join regression tests.
