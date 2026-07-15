# Current product routing

`BWS_FULL_PLATFORM_IMPLEMENTATION_V1` has an active safe source queue from `BWS-520` through `BWS-580` under `run-autonomous-implementation.sh`; hardened controller internals below remain unchanged.

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

Artifact publication is repository-wide: all five root controllers and `automation_build_artifacts_zip` rebuild repo-root `artifacts.zip` from the complete `artifacts/` directory. The archive intentionally preserves the full evidence tree rather than selecting only the current run directory, and uses standard ZIP fast Deflate level 1 to reduce finalization latency. After successful strict lock release, the controller atomically refreshes only the current run final-summary entries on a copied archive so downloaded evidence contains the authoritative lock-release fields; a bounded full rebuild is the fail-closed fallback.

`run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, and `run-paper-evaluation.sh` acquire this shared lock before creating run artifacts. Their finalizers expose release status, preserve unverifiable active-child locks, convert release failures into blocked results, and refresh terminal evidence instead of suppressing cleanup errors.

`telegram_notify.sh` is wired into all five root controllers. Direct standalone
runs of `run-autonomous-implementation.sh`, `run-autonomous-bugfix.sh`, and
`run-paper-evaluation.sh` send their own final completion notification unless the
operator explicitly sets `TELEGRAM_NOTIFY=0`. Both parent autopilots launch every
child with `TELEGRAM_NOTIFY=0` and send only the parent campaign-final Telegram
notification after child cleanup and lock finalization.

Parent controllers no longer infer terminal state by grepping streamed child output. Each parent gives its child a repo-contained `child_terminal_result.env` target; the standalone child publishes one strict atomic result only after final lock classification, and the parent validates controller identity, parent PID, repository, run containment, process exit code, and lock-release fields before consuming any handoff. Codex output may contain repeated `final_status=` or `stop_reason=` text without terminating the campaign.

This repo does not yet have an executable service-owned paper lifecycle. `run-paper-evaluation.sh` is the
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

`.automation/lib/controller_hardening_v2.sh` contains protected fail-closed helpers for semantic handoff fingerprints, repo-local path checks, source fingerprints, atomic child-result side-channel publication and validation, process identity verification, bounded ZIP creation, complete-file atomic parent-lock claims, strict parent-lock ownership, file-mtime heartbeat inspection, zombie-aware PID checks, and verified TERM/KILL termination.


## Bugfix autopilot

`run-bugfix-autopilot.sh` is the unattended bounded source-audit campaign parent. It calls only `run-autonomous-bugfix.sh` and `run-autonomous-implementation.sh --handover-bugfix-audit`, requires a clean re-audit of the same campaign area after each implementation, and never calls paper evaluation or service lifecycle commands. It now runs the shared cross-controller incompatibility preflight, atomically claims a complete parent lock before campaign artifact creation, uses `HEARTBEAT_SOURCE=file_mtime` without rewriting lock contents, and classifies child-cleanup or lock-release failure as a preserved-lock blocker before Telegram notification.


`run-paper-evaluation.sh` now creates canonical schema-v1 paper handoffs with atomic writes, source/evidence hashes, and semantic fingerprints. `run-autonomous-implementation.sh` independently verifies the exact schema, producer identity, source fingerprint, run containment, and evidence SHA before accepting either a paper or bugfix handoff.

`run-paper-autopilot.sh` now consumes only canonical schema-v1 paper handoffs. It verifies the producer controller, exact key allowlist, child result, source fingerprint, producer run containment, evidence SHA-256, and semantic fingerprint without rewriting the handoff. Its implementation return contract is validated independently and its paper child receives the configured ZIP timeout.

`run-paper-autopilot.sh` and `run-bugfix-autopilot.sh` now share complete-file atomic parent-lock claims, strict ownership checks, file-mtime-only heartbeats, one-second heartbeat shutdown polling, zombie-aware liveness, and verified TERM/KILL completion. Their finalizers treat active-child identity/termination failure and strict lock-release failure as blocked terminal states, preserve the lock when present, refresh evidence, and send Telegram only after final classification.
