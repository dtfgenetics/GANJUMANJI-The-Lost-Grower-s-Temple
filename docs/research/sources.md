# Solver research sources

The 2026-09-04 campaign-solver correction was informed by literature on resource-constrained shortest-path search and state-dominance pruning, including:

- G. A. Korsah, A. Stentz, and M. B. Dias, **DD* Lite: Efficient Incremental Search with State Dominance**, Carnegie Mellon University Robotics Institute, 2007.
- S. Ahmadi, A. Raith, G. Tack, and M. Jalili, **Resource Constrained Pathfinding with Enhanced Bidirectional A* Search**, AAAI 2025.
- S. Ahmadi, A. Raith, and M. Jalili, **Resource Constrained Pathfinding with A* and Negative Weights**, 2025.
- L. Di Puglia Pugliese and F. Guerriero, **A survey of resource constrained shortest path problems: Exact solution approaches**, Networks, 2013.

The implementation does not reproduce these algorithms wholesale. It applies the directly relevant principle: for a fixed structural state, prune only resource labels that are dominated by another label reached no later with equal-or-better remaining resources.
