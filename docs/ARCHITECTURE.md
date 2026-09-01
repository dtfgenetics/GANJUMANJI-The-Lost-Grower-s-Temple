# Ganjumanji Browser Architecture

## Runtime stack

- Three.js 0.185.1
- TypeScript 7.0.2
- Vite 8.2.2
- DOM HUD and touch controls
- Playwright Chromium QA

Production 3D assets will use GLB/glTF 2.0 when introduced. The first slice intentionally uses code-built geometry so gameplay, scale, navigation, and performance can be validated without an asset dependency.

## Boundaries

### `src/simulation/`
Owns serializable game state, world collision data, hazards, collectibles, Resolve, gate rules, timing, and win state. It has no Three.js, DOM, audio, or browser-object dependencies.

### `src/render/`
Owns Three.js scene graph, camera, lights, procedural placeholder geometry, visual animation, resize behavior, WebGL context handling, and rendering. It consumes simulation state but does not decide gameplay outcomes.

### `src/input.ts`
Maps keyboard and pointer/touch input to movement/sprint/restart intent. Physical key names do not appear in simulation rules.

### `src/ui/`
Owns accessible DOM HUD, objective/status text, transient messages, and completion dialog.

### `test/`
Locks deterministic rules separately from browser/runtime behavior. Browser QA tests real Chromium movement, WebGL canvas creation, mobile layout, touch controls, and restart.

## Simulation timing

The browser runtime uses a 60 Hz fixed simulation step with an accumulator. Render frames may vary, but gameplay movement and rules advance in fixed increments. Frame elapsed time is capped at 250 ms to avoid processing huge background-tab stalls.

## Collision

The first compact atrium uses deterministic circle-vs-AABB collision in the horizontal X/Z plane. This is deliberate: it keeps gameplay authority independent from the renderer and avoids introducing a WASM physics dependency before the game actually needs dynamic 3D bodies.

When meaningful rigid-body physics, slopes, moving platforms, or physics-driven traversal are introduced, evaluate Rapier as the physics bridge while preserving simulation authority and saveable state outside renderer objects.

## Asset policy

- Stable world/gameplay IDs are independent of filenames.
- Shipping models: GLB/glTF 2.0.
- Optimize textures/geometry before shipping.
- Collision proxies must be explicit and must not depend on ornamental mesh topology.
- No third-party asset is accepted without license/provenance review.

## Deployment boundary

Vite is configured with the intended eventual base path `/games/ganjumanji/`, but this repository does not claim that route is public. DTFSeeds integration must happen separately after this canonical repository's vertical slice passes its release gates.
