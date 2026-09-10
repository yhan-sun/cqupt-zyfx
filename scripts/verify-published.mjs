import { site } from './model.mjs';

const base = process.env.PAGE_URL || site.origin;
const expectedCommit = process.env.GITHUB_SHA;
const wait = milliseconds => new Promise(resolve => setTimeout(resolve, milliseconds));
async function fetchVerified(file, verify) {
  let last;
  for (let attempt = 0; attempt < 6; attempt++) {
    try {
      const response = await fetch(new URL(file, base), { cache: 'no-store', signal: AbortSignal.timeout(20000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${file}`);
      const bytes = Buffer.from(await response.arrayBuffer());
      if (!verify(bytes, response)) throw new Error(`Published content mismatch: ${file}`);
      console.log(`PASS published ${file}`);
      return;
    } catch (error) {
      last = error;
      if (attempt < 5) await wait(5000);
    }
  }
  throw last;
}
await fetchVerified('build.json', bytes => {
  const data = JSON.parse(bytes.toString('utf8'));
  return (!expectedCommit || data.commit === expectedCommit) && data.pages > 0;
});
for (const item of site.navigation) {
  await fetchVerified(item.path, bytes => {
    const html = bytes.toString('utf8');
    return html.includes('<h1') && html.includes('assets/site.css') && html.includes('assets/site.js') && html.includes('aria-current="page"');
  });
}
for (const file of ['assets/site.css','assets/site.js','assets/science.css','assets/science.js','assets/science-core.mjs']) {
  await fetchVerified(file, bytes => bytes.length > 100 && !bytes.toString('utf8').startsWith('<!doctype'));
}
await fetchVerified('assets/join-qq.svg', bytes => bytes.toString('utf8').includes('<svg'));
for (const file of ['media/photos/member-two-runners-480.webp','media/photos/member-captain-run-1600.webp','media/photos/runner-yu-peijun-1600.webp','media/official/2025-track-training.webp','media/science/calf-raise.webp']) {
  await fetchVerified(file, bytes => bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP');
}
