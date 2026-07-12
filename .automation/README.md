# `.automation/`

Repo-local automation support files for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` is used by the long controllers for locking, validation, Codex
execution, artifact packaging, fail-closed cycle status parsing, required cycle
artifact checks, direct-argv command execution, and content-based source-tree
fingerprints that exclude generated runtime evidence. The shared lock layer now atomically claims a complete lock file, records managed child process groups, preserves active-child metadata across heartbeats, checks incompatible root-controller locks, permits only verified parent-launched children, and uses TERM-with-grace before any KILL escalation.

`run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, and `run-paper-evaluation.sh` acquire this shared lock before creating run artifacts. Their finalizers expose release status, preserve unverifiable active-child locks, convert release failures into blocked results, and refresh terminal evidence instead of suppressing cleanup errors.

`telegram_notify.sh` is wired into `run-autonomous-implementation.sh`,
`run-autonomous-bugfix.sh`, and `run-paper-evaluation.sh` for one final completion
notification per run.

This repo has no service-owned paper lifecycle. `run-paper-evaluation.sh` is the
standard no-service private paper controller: it validates source, runs a private
fixture smoke, writes local artifacts, and never starts/stops services or calls
providers. Pinned-bundle paths now fail preflight before run-directory creation or
repo validation unless they resolve to an existing regular, non-symlink, repo-local
JSON file. Known report commands run as direct argv, and the controller verifies that
source and protected automation files remain unchanged. Use real
`SUREBET_PINNED_BUNDLE` input only when a repo-local `betting-win` export exists; it
is still private paper evidence, not live readiness.


## Paper autopilot runtime state

`run-paper-autopilot.sh` writes parent-supervisor artifacts under `artifacts/paper_autopilot_*`. Runtime locks and handoff files remain generated state and are not source authority.

`.automation/lib/controller_hardening_v2.sh` contains protected fail-closed helpers for semantic handoff fingerprints, repo-local path checks, source fingerprints, strict child result extraction, process identity verification, and bounded ZIP creation.


## Bugfix autopilot

`run-bugfix-autopilot.sh` is the unattended bounded source-audit campaign parent. It calls only `run-autonomous-bugfix.sh` and `run-autonomous-implementation.sh --handover-bugfix-audit`, requires a clean re-audit of the same campaign area after each implementation, and never calls paper evaluation or service lifecycle commands. It now runs the shared cross-controller incompatibility preflight before lock acquisition or campaign artifact creation.


`run-paper-evaluation.sh` now creates canonical schema-v1 paper handoffs with atomic writes, source/evidence hashes, and semantic fingerprints. `run-autonomous-implementation.sh` independently verifies the exact schema, producer identity, source fingerprint, run containment, and evidence SHA before accepting either a paper or bugfix handoff.

`run-paper-autopilot.sh` now consumes only canonical schema-v1 paper handoffs. It verifies the producer controller, exact key allowlist, child result, source fingerprint, producer run containment, evidence SHA-256, and semantic fingerprint without rewriting the handoff. Its implementation return contract is validated independently and its paper child receives the configured ZIP timeout.

`run-paper-autopilot.sh` now uses a full-file atomic parent-lock claim. Its finalizer treats active-child identity/termination failure and strict lock-release failure as blocked terminal states, preserves the lock when present, refreshes evidence, and sends Telegram only after final classification.
