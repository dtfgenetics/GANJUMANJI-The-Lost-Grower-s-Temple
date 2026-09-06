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
if (release.version !== '0.4.0') throw new Error('Release version must advertise the five-region campaign.');
if (release.campaign?.regions !== 5 || release.campaign?.relicSeeds !== 10) throw new Error('Campaign release metadata is stale.');
if (release.campaign?.saveVersion !== 5) throw new Error('Release metadata must advertise save version 5.');
if (JSON.stringify(release.campaign?.pressureCurve) !== JSON.stringify([9, 7, 5, 6, 5])) throw new Error('Regional pressure metadata is stale.');
for (const feature of ['five-region campaign', 'separate autosave and safe-checkpoint recovery', 'exact surge countdown', 'campaign solvability validation']) {
  if (!release.features?.includes(feature)) throw new Error(`Release metadata is missing ${feature}.`);
}
if (html.includes('/src/main.ts')) throw new Error('Production HTML still references TypeScript source.');
if (!html.includes('/games/ganjumanji/assets/')) throw new Error('Built asset URLs are not mounted under /games/ganjumanji/.');
if (!html.includes('Ganjumanji')) throw new Error('Production HTML is missing the game title.');
if (!html.includes('Glasshouse Ruins') || !html.includes('Seed Throne')) throw new Error('Production HTML is missing the expanded campaign path.');
if (!html.includes('Continue from Safe Checkpoint')) throw new Error('Production HTML is missing safe-checkpoint recovery UI.');

console.log('Ganjumanji 0.4.0 release bundle validated for /games/ganjumanji/ with five regions, save v5, and safe checkpoint recovery.');
