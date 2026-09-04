# Ganjumanji: The Lost Grower's Temple

Status: **playable three-region browser campaign / release candidate in active QA**.

Ganjumanji is an original DTF Genetics top-down temple-expedition browser game built with Phaser, TypeScript, and Vite. Gameplay state is owned outside the renderer so rules, progression, input, records, and saves remain deterministic and testable.

## Current playable campaign

The expedition has a complete beginning-to-end structure:

1. **The Root Halls** — recover 3 relic seeds while learning wards, kits, guardians, and the 9-move surge rhythm.
2. **The Sunken Archive** — recover 2 relic seeds through denser hazards and a faster 7-move surge rhythm.
3. **The Vault Heart** — recover the final relic under critical 5-move surge pressure and escape with the Living Seed Vault.

Across the campaign players can:

- Move with Arrow/WASD keyboard controls or the responsive touch D-pad.
- Navigate region-specific stone layouts, palettes, encounters, and pressure curves.
- Recover 6 campaign relic seeds across 3 regions.
- Avoid one-use traps and survive escalating temple surges.
- Collect resin wards that absorb one future damage event.
- Recover expedition kits that automatically neutralize one guardian encounter.
- Face one-use guardians that damage unprepared explorers but disappear once resolved.
- Secure sanctuary checkpoints that restore health once.
- Save manually or continue from automatic movement checkpoints.
- Continue directly from the loss result surface when a safe checkpoint exists.
- Preserve the previous safe checkpoint after a failed run.
- Record completed expeditions and a persistent best-move escape score.
- Finish through a dedicated win/loss results surface and replay immediately.

## Architecture

- `src/game/content.ts` — data-driven campaign regions, layouts, pickups, guardian encounters, pressure curves, hazards, and palettes.
- `src/game/model.ts` — deterministic expedition rules, transitions, inventory resources, encounters, survival systems, and saveable simulation state.
- `src/game/input.ts` — physical keyboard/touch input mapped into game actions.
- `src/game/storage.ts` — versioned save serialization and migration through save version 4.
- `src/game/records.ts` — persistent best-run and completed-expedition records.
- `src/main.ts` — thin Phaser renderer plus DOM HUD, journal, and results integration.
- `test/campaign-solvability.test.ts` — state-space search proving at least one survivable route through the complete campaign.
- `test/` — deterministic rules, content reachability, input, save migration, balance, and record tests.
- `e2e/` — desktop/mobile Playwright acceptance with screenshot evidence.
- `public/game-release.json` — production route and campaign release metadata.
- `scripts/validate-release.mjs` — verifies the built bundle is safe for `/games/ganjumanji/`.
- `.github/workflows/ci.yml` — tests, build, route validation, browser acceptance, screenshot evidence, and deployable build artifact.

## Production route

The Vite base and release contract target:

`/games/ganjumanji/`

The CI production artifact is intended to be copied into the DTFSeeds public game route only after the release-candidate gates pass. The game should not be marked fully production-ready until the latest CI is green and the deployed route receives browser/live QA.

## Remaining release work

The core campaign, encounter loop, checkpoint recovery, save migration, input paths, mobile HUD, and automated solvability checks are implemented. Remaining work is primarily release polish: stronger production character/environment artwork, richer encounter/pickup feedback, dedicated audio cues, final browser screenshot review, DTFSeeds packaging, and live-route verification.
