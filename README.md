# Ganjumanji: The Lost Grower's Temple

Status: **playable three-region browser campaign / release candidate in active QA**.

Ganjumanji is an original DTF Genetics top-down temple-expedition browser game built with Phaser, TypeScript, and Vite. Gameplay state is owned outside the renderer so rules, progression, input, records, and saves remain deterministic and testable.

## Current playable campaign

The expedition now has a complete beginning-to-end structure:

1. **The Root Halls** — recover 3 relic seeds and open the first sealed passage.
2. **The Sunken Archive** — recover 2 relic seeds through a denser hazard layout.
3. **The Vault Heart** — recover the final relic and escape with the Living Seed Vault.

Across the campaign players can:

- Move with Arrow/WASD keyboard controls or the responsive touch D-pad.
- Navigate region-specific stone layouts and palettes.
- Recover 6 campaign relic seeds across 3 regions.
- Avoid one-use traps and survive periodic temple surges.
- Collect resin wards that absorb one future damage event.
- Secure sanctuary checkpoints that restore health once.
- Save manually or continue from automatic safe movement checkpoints.
- Preserve the previous safe checkpoint after a failed run.
- Record completed expeditions and a persistent best-move escape score.
- Finish through a dedicated win/loss results surface and replay immediately.

## Architecture

- `src/game/content.ts` — data-driven campaign regions, layouts, pickups, hazards, and presentation palettes.
- `src/game/model.ts` — deterministic expedition rules, transitions, survival systems, and saveable simulation state.
- `src/game/input.ts` — physical keyboard/touch input mapped into game actions.
- `src/game/storage.ts` — versioned save serialization and migration through save version 3.
- `src/game/records.ts` — persistent best-run and completed-expedition records.
- `src/main.ts` — thin Phaser renderer plus DOM HUD/results integration.
- `test/` — deterministic rules, content reachability, input, save migration, and record tests.
- `e2e/` — desktop/mobile Playwright acceptance with screenshot evidence.
- `public/game-release.json` — production route and campaign release metadata.
- `scripts/validate-release.mjs` — verifies the built bundle is safe for `/games/ganjumanji/`.
- `.github/workflows/ci.yml` — tests, build, route validation, browser acceptance, screenshot evidence, and deployable build artifact.

## Production route

The Vite base and release contract target:

`/games/ganjumanji/`

The CI production artifact is intended to be copied into the DTFSeeds public game route only after the release-candidate gates pass. The game should not be marked fully production-ready until the latest CI is green and the deployed route receives browser/live QA.

## Remaining release work

The core game loop and campaign structure are now implemented. Remaining work is release polish rather than foundational architecture: production character/environment artwork, audio cues, final browser screenshot review, live DTFSeeds packaging, and live-route verification.
