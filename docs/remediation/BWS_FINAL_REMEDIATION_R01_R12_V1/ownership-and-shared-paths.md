# Ownership and shared paths

## Rules

- One primary owner produces each tranche postimage.
- Secondary reviewers may inspect and add acceptance requirements but do not edit the same shared file concurrently.
- A shared path may be edited only by the admitted tranche and only after validating the predecessor postimage.
- The next owner receives the exact postimage hash, mode, test impact, and unresolved blocker handoff.
- A moved or newly required path is `TO_CONFIRM_DURING_ADMISSION`; it is not silently authorized.

## Shared path registry

The campaign map identifies `66` paths referenced by more than one tranche. The complete registry is in `maps/path-to-tranche.json` and `maps/shared-path-locks.md`.

## Primary owners

- R01: 4 tranches
- R02: 3 tranches
- R03: 6 tranches
- R04: 4 tranches
- R05: 3 tranches
- R06: 5 tranches
- R07: 4 tranches
- R08: 3 tranches
- R09: 4 tranches
- R10: 3 tranches
- R11: 4 tranches
- R12: 4 tranches
