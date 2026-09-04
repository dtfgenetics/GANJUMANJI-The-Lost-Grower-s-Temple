import { readFile, stat } from 'node:fs/promises';

async function mustExist(path) {
  const info = await stat(path);
  if (!info.isFile()) throw new Error(`${path} is not a file`);
}

await mustExist('dist/index.html');
await mustExist('dist/game-release.json');

const html = await readFile('dist/index.html', 'utf8');
const release = JSON.parse(await readFile('dist/game-release.json', 'utf8'));

if (release.route !== '/games/ganjumanji/') throw new Error('Release route metadata is incorrect.');
if (release.status !== 'release-candidate') throw new Error('Release status must remain explicit.');
if (release.campaign?.regions !== 3 || release.campaign?.relicSeeds !== 6) throw new Error('Campaign release metadata is stale.');
if (release.campaign?.saveVersion !== 4) throw new Error('Release metadata must advertise save version 4.');
if (JSON.stringify(release.campaign?.pressureCurve) !== JSON.stringify([9, 7, 5])) throw new Error('Regional pressure metadata is stale.');
for (const feature of ['expedition kits', 'guardian encounters', 'campaign solvability validation']) {
  if (!release.features?.includes(feature)) throw new Error(`Release metadata is missing ${feature}.`);
}
if (html.includes('/src/main.ts')) throw new Error('Production HTML still references TypeScript source.');
if (!html.includes('/games/ganjumanji/assets/')) throw new Error('Built asset URLs are not mounted under /games/ganjumanji/.');
if (!html.includes('Ganjumanji')) throw new Error('Production HTML is missing the game title.');

console.log('Ganjumanji release bundle validated for /games/ganjumanji/ with save v4 and encounter systems.');
