# Solvability research — 2026-09-04

## Problem
The campaign solvability CI gate used breadth-first search with exact resource states and an arbitrary explored-state cutoff. After adding health, wards, expedition kits, consumed traps, guardians, checkpoints, relic progress, region transitions, and surge phase, the state space expanded enough that the solver could return `null` without proving the campaign unwinnable.

## Research conclusion
This is a resource-constrained shortest-path problem. The appropriate exact-search pattern is to retain a Pareto frontier of non-dominated resource labels for each structural state. Search literature on resource-constrained pathfinding and state dominance shows that dominance pruning can substantially reduce constrained-search state spaces without discarding feasible solutions when the dominance relation is sound.

## Implemented correction
For identical structural game states and identical surge phase, label A dominates label B only when:

- A arrives in no more moves than B;
- A has at least as much health;
- A has at least as many resin wards; and
- A has at least as many expedition kits.

Only dominated labels are removed. The arbitrary 150,000-state search termination was removed as the feasibility criterion. A separate design constraint remains: a winning route must complete in fewer than 220 moves.

## Why this is safer
The old test conflated `search budget exhausted` with `campaign impossible`. The new test distinguishes those concepts. Campaign balance should only be changed after the improved solver proves there is no acceptable route, not merely because a brute-force frontier became too large.

## Runtime boundary
The solver remains CI/test-only. Production gameplay continues to use the deterministic simulation model directly and carries no search cost.
