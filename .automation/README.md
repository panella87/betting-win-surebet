# `.automation/`

Repo-local automation support files for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` is used by the long controllers for locking, validation, Codex
execution, artifact packaging, fail-closed cycle status parsing, required cycle
artifact checks, direct-argv command execution, and content-based source-tree
fingerprints that exclude generated runtime evidence.

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

`run-bugfix-autopilot.sh` is the unattended bounded source-audit campaign parent. It calls only `run-autonomous-bugfix.sh` and `run-autonomous-implementation.sh --handover-bugfix-audit`, requires a clean re-audit of the same campaign area after each implementation, and never calls paper evaluation or service lifecycle commands.
