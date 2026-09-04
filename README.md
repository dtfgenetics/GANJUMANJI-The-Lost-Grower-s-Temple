# Ganjumanji: The Lost Grower's Temple

Status: **playable browser vertical slice / active development**.

Ganjumanji is an original DTF Genetics top-down temple-expedition browser game built with Phaser, TypeScript, and Vite. Gameplay state is owned outside the renderer so rules, progression, input, and saves remain deterministic and testable.

## Current playable loop

- Explore an 11×9 temple grid with keyboard or touch controls.
- Recover all three relic seeds before escaping through the vault gate.
- Avoid one-use temple traps and survive periodic temple surges.
- Collect resin wards that absorb one future damage event.
- Discover one-use sanctuary checkpoints that can restore health.
- Save manually or continue from automatic movement checkpoints.
- Restart cleanly without retaining stale expedition state.
- Win by recovering every relic seed and reaching the vault; lose when health reaches zero.

## Architecture

- `src/game/model.ts` — deterministic expedition rules and saveable simulation state.
- `src/game/input.ts` — physical keyboard/touch input mapped into game actions.
- `src/game/storage.ts` — versioned save serialization and migration.
- `src/main.ts` — Phaser rendering and DOM HUD integration.
- `test/` — deterministic rules, input, and save tests.
- `e2e/` — desktop/mobile Playwright acceptance with screenshot evidence.
- `.github/workflows/ci.yml` — tests, TypeScript/Vite production build, browser acceptance, screenshots, and deployable build artifact.

## DTFSeeds integration

The Vite production base is configured for `/games/ganjumanji/`. Keep the project gated from the public playable catalog until the vertical slice has completed browser QA, visual review, production packaging, and live-route verification on dtfseeds.com.

## Next milestone

Expand the vertical slice into a larger expedition structure with multiple temple rooms/regions, data-driven encounters, inventory/tools, persistent expedition progression, production art/animation/audio, and stronger accessibility/mobile playtesting without moving gameplay rules into Phaser scenes.
