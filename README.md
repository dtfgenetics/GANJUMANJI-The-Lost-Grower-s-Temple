# Ganjumanji: The Lost Grower's Temple

Status: **playable five-region browser campaign / release candidate in active QA**.

Ganjumanji is an original DTF Genetics top-down temple-expedition browser game built with Phaser, TypeScript, and Vite. Gameplay state is owned outside the renderer so rules, progression, input, records, saves, checkpoint recovery, and campaign balance remain deterministic and testable.

## Current playable campaign

The expedition now has a five-region beginning-to-end structure:

1. **The Root Halls** — recover 3 relic seeds while learning wards, kits, guardians, sanctuaries, and the 9-move surge rhythm.
2. **The Sunken Archive** — recover 2 relic seeds through denser hazards and a faster 7-move surge rhythm.
3. **The Vault Heart** — break the first vault seal, recover 1 relic seed, and survive critical 5-move surge pressure.
4. **The Glasshouse Ruins** — enter the overgrown cultivation ruins, recover 2 relic seeds, face denser encounters, and earn a permanent max-health increase for reaching the deeper temple.
5. **The Seed Throne** — recover the final 2 relic seeds under the strongest pressure curve and escape with all 10 campaign relic seeds.

Across the campaign players can:

- Move with Arrow/WASD keyboard controls or the responsive touch D-pad.
- Navigate region-specific layouts, palettes, encounters, and pressure curves.
- Recover 10 campaign relic seeds across 5 regions.
- Read an exact “next surge in N moves” pressure countdown instead of estimating the timer manually.
- Avoid one-use traps and survive escalating temple surges.
- Collect resin wards that absorb one future damage event.
- Recover expedition kits that automatically neutralize one guardian encounter.
- Face one-use guardians that damage unprepared explorers but disappear once resolved.
- Secure sanctuary checkpoints that restore health once and become safe recovery points.
- Carry resources between regions while cleared passages restore health.
- Gain a max-health progression reward when the expedition reaches the Glasshouse Ruins.
- Resume the latest move with normal autosave without confusing that save with a safe recovery checkpoint.
- Recover from a loss using the last true sanctuary/region checkpoint when one exists.
- Preserve backward compatibility with save versions 1–4 through save version 5 migration.
- Record completed expeditions and a persistent best-move escape score.
- Finish through a dedicated win/loss results surface and replay immediately.

## Architecture

- `src/game/content.ts` — data-driven five-region campaign, layouts, pickups, guardian encounters, pressure curves, hazards, progression rewards, and palettes.
- `src/game/model.ts` — deterministic expedition rules, transitions, inventory resources, encounters, survival systems, regional rewards, and saveable simulation state.
- `src/game/input.ts` — physical keyboard/touch input mapped into game actions.
- `src/game/storage.ts` — versioned autosave plus dedicated safe-checkpoint persistence and migration through save version 5.
- `src/game/records.ts` — persistent best-run and completed-expedition records.
- `src/main.ts` — thin Phaser renderer plus DOM HUD, five-stage journal path, recovery controls, and results integration.
- `test/campaign-solvability.test.ts` — state-space search proving at least one survivable route through the complete five-region campaign.
- `test/content.test.ts` — validates region chaining, reachability, unique critical objects, and campaign content integrity.
- `test/input-storage.test.ts` — validates input, autosave/checkpoint separation, and legacy save migration.
- `scripts/validate-ui-contract.mjs` — deterministic shipped-UI validation for mobile viewport behavior, touch/keyboard controls, journal input lockout, HUD/recovery/results hooks, five-stage campaign UI, reduced-motion handling, and the release manifest.
- `public/game-release.json` — production route, version 0.4.0, five-region campaign metadata, and save v5 contract.
- `scripts/validate-release.mjs` — verifies the built bundle is safe and internally consistent for `/games/ganjumanji/`.
- `.github/workflows/ci.yml` — deterministic tests, UI contract, build, release validation, and deployable build artifact.

## Production route

The Vite base and release contract target:

`/games/ganjumanji/`

The CI production artifact is intended to be copied into the DTFSeeds public game route only after the release-candidate gates pass. Every new canonical revision must be repackaged and exact-live-verified before the central DTFSeeds source pin is advanced.

## Current expansion gate

The 0.4.0 branch expands the campaign from 3 to 5 regions, separates ordinary autosave from true safe recovery checkpoints, adds deeper progression, and increases the campaign relic goal from 6 to 10. The branch is not considered shippable until deterministic game/content tests, five-region solvability search, shipped UI-contract validation, TypeScript/Vite build, and production release validation all pass.

## Next gameplay expansion areas

After 0.4.0 is stable, the strongest next additions are richer guardian encounter choices, region-specific relic mechanics, optional side chambers, stronger reward tradeoffs, and more visual/audio feedback for danger, pickups, damage, and progression. Those additions should remain data-driven and covered by deterministic rules tests rather than being buried in Phaser scene state.
