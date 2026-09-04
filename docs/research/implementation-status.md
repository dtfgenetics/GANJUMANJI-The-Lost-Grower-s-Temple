# Solver implementation status

Implemented on main:

- structural-state key separated from resource labels;
- Pareto frontier for health / wards / expedition kits / depth;
- sound dominance rule requiring no-later arrival and equal-or-better resources;
- 219-move maximum search depth as a design constraint;
- dedicated dominance regression test;
- documented research rationale and acceptance criteria.

Pending validation at the time of this note: latest GitHub Actions campaign solver/build/browser run on the current head.
