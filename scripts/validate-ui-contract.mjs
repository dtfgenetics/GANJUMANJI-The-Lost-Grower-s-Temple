import assert from 'node:assert/strict';
import fs from 'node:fs';

const html = fs.readFileSync('index.html', 'utf8');
const main = fs.readFileSync('src/main.ts', 'utf8');
const styles = fs.readFileSync('src/styles.css', 'utf8');
const release = JSON.parse(fs.readFileSync('public/game-release.json', 'utf8'));

assert.match(html, /name="viewport"[^>]*viewport-fit=cover/, 'mobile viewport must preserve safe-area support');
for (const id of ['game','journalButton','audioButton','continueButton','saveButton','restartButton','health','relics','danger','message','saveStatus','resultModal','continueResultButton','playAgainButton']) {
  assert.match(html, new RegExp(`id="${id}"`), `missing shipped UI hook #${id}`);
}
assert.equal((html.match(/data-region-step=/g) ?? []).length, 5, 'field journal must show all five campaign regions');
assert.equal((html.match(/data-move=/g) ?? []).length, 4, 'touch controls must expose four movement directions');
assert.match(html, /moveButtons\.forEach\(\(button\) => \{ button\.disabled = open; \}\)/, 'opening the journal must disable touch movement controls');
assert.match(html, /gameplayKeys\.has\(event\.key\.toLowerCase\(\)\)/, 'opening the journal must suppress gameplay keys');

assert.match(main, /actionFromKeyboard\(event\)/, 'keyboard movement must route through the shared input adapter');
assert.match(main, /actionFromMoveControl\(button\.dataset\.move\)/, 'touch movement must route through the shared input adapter');
assert.match(main, /scale: \{ mode: Phaser\.Scale\.FIT, autoCenter: Phaser\.Scale\.CENTER_BOTH \}/, 'Phaser board must retain responsive FIT scaling');
assert.match(main, /loadCheckpoint\(storage\)/, 'safe checkpoint recovery must remain wired');
assert.match(main, /saveCheckpoint\(storage, state\)/, 'safe checkpoint persistence must remain wired');
assert.match(main, /resultModal\.hidden = !ended/, 'win/loss result surface must remain state-driven');
assert.match(main, /movesUntilSurge\(state\)/, 'danger HUD must retain exact surge countdown');
assert.match(main, /prefers-reduced-motion: reduce/, 'renderer must respect reduced-motion preferences');

assert.match(styles, /\.mobile-controls button\{min-width:68px;min-height:52px/, 'touch movement controls must stay comfortably above 44px');
assert.match(styles, /@media\(max-width:860px\)[\s\S]*\.mobile-controls\{display:block\}/, 'touch controls must become visible on compact layouts');
assert.match(styles, /@media\(prefers-reduced-motion:reduce\)/, 'CSS must retain reduced-motion handling');
assert.match(styles, /#game canvas\{display:block;width:100%!important;height:100%!important\}/, 'canvas must remain responsive inside the game panel');

assert.equal(release.route, '/games/ganjumanji/');
assert.equal(release.status, 'release-candidate');
assert.equal(release.campaign?.regions, 5);
assert.equal(release.campaign?.relicSeeds, 10);
assert.equal(release.campaign?.saveVersion, 5);
assert.deepEqual(release.input, ['keyboard', 'touch']);
assert.deepEqual(release.campaign?.pressureCurve, [9, 7, 5, 6, 5]);

console.log('Ganjumanji deterministic UI and release contract valid.');
