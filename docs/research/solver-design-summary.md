# Solver design summary

Campaign solvability is verified with a test-only dominance-pruned breadth-first search over deterministic simulation states. Structural state and resource labels are intentionally separated so CI can prove reachability without confusing resource permutations with distinct world states.
