# Campaign Solvability Solver

The campaign is a resource-constrained pathfinding problem. A simulation state includes map position, consumed pickups/hazards/guardians, relic progress, region progress, surge phase, health, resin wards, and expedition kits.

A naive exact-state BFS grows rapidly because the same structural game state can be reached with many different resource combinations. The solver therefore uses **state dominance**:

- Structural identity includes region, player position, surge phase, consumed/remaining board objects, relic progress, checkpoints, and cleared regions.
- Health, wards, kits, and search depth form the resource label for that structural state.
- Label A dominates label B only when A reaches the same structural state no later and has at least as much health, wards, and kits.
- Dominated labels are pruned; non-dominated labels stay on a Pareto frontier.

This keeps the CI test sound for feasibility while avoiding the false-negative behavior of an arbitrary explored-state cutoff. The solver also retains a hard maximum winning depth of 219 moves because a campaign taking longer than that should be treated as a balance regression even if technically survivable.

The production game does not use this solver at runtime. It exists only as a regression oracle for campaign content and balance.
