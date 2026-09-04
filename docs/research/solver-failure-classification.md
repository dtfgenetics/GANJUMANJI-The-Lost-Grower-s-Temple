# Solver failure classification

- `No winning label exists under 220 moves` => game/content balance defect.
- `Search implementation times out or exhausts an arbitrary node budget` => solver defect or performance issue, not proof of unwinnability.
- `Dominance regression fails` => solver correctness defect.
- `Unit/build/browser checks fail after solver passes` => implementation or UI regression outside campaign reachability.
