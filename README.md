# Ganjumanji: The Lost Grower's Temple

Status: **3D browser vertical slice in verification / not public yet**.

This repository is the canonical production home for an original DTF Genetics third-person exploration game. The first playable chamber, **Temple Atrium**, is now implemented in Three.js/TypeScript and is intentionally kept outside the public DTFSeeds playable catalog until its exact release candidate passes deterministic, build, desktop-browser, and mobile/touch verification.

## Temple Atrium loop

- Explore an original 3D grow-temple chamber.
- Recover the Root, Canopy, and Resin Seed Sigils.
- Avoid spore-vent hazards while managing 3 Resolve.
- Recover all three sigils to open the Canopy Gate.
- Reach the gate to clear the chamber.

Controls: **WASD / arrow keys** to move, **Shift** to sprint, **R** to restart. Responsive touch controls are included for mobile-width play.

## Architecture

- `src/simulation/` — serializable deterministic state, movement, collision, hazards, pickups, gate and win rules.
- `src/render/` — Three.js scene, chase camera, lighting, code-built placeholder environment, WebGL lifecycle.
- `src/input.ts` — keyboard/touch input mapping.
- `src/ui/` — DOM HUD and completion UI.
- `test/` — deterministic rules and Chromium desktop/mobile QA.
- `docs/GAME_BIBLE.md` — current gameplay/product direction.
- `docs/ARCHITECTURE.md` — runtime boundaries and future GLB/physics policy.
- `docs/IP_BOUNDARY.md` — original-expression and asset-provenance rules.

The first playable uses code-built geometry so there are no unverified third-party art dependencies. Production 3D assets will use GLB/glTF 2.0 after their provenance and optimization are verified.

## Local verification

```bash
npm install
npm run verify
```

`npm run verify` runs deterministic simulation tests, strict TypeScript/build checks, and Chromium desktop/mobile browser tests.

## DTFSeeds integration

The Vite build uses the intended future base path `/games/ganjumanji/`, but this README does **not** claim the route is deployed. Do not add a public Play button or public-game count until:

1. the exact canonical Ganjumanji candidate is green;
2. DTFSeeds packaging/route registration is added through `dtfgenetics/Thc`;
3. the integrated public-suite build passes;
4. the visitor-facing route is deployed and verified.

The project must remain independently designed and must not copy protected board layouts, artwork, text, characters, logos, code, or other expression from existing games.
