# Campaign solver acceptance criteria

The campaign-solvability regression gate is considered healthy only when all of the following are true:

1. A complete winning campaign route exists.
2. The winning route is under 220 successful moves.
3. Dominance pruning never removes a label that is earlier or has a resource advantage not matched by the dominating label.
4. Surge phase remains part of structural identity because future damage timing depends on it.
5. Remaining/consumed relics, hazards, wards, kits, guardians, checkpoints, and cleared regions remain part of structural identity because they change future transitions.
6. Absolute campaign turn is not part of structural identity because runtime mechanics depend on regional surge phase; total move count is tracked separately as search depth for the 220-move design constraint.
7. The solver is test-only and never enters the production bundle.

A solver timeout or implementation search budget must never be interpreted as proof that the campaign itself is unwinnable.
