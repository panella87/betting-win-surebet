## 2026-07-17 - API-only upstream transport

- Removed the operator-selectable upstream mode and export path from active configuration, controllers, root CLI, package scripts, and runtime handoffs.
- Fixed active BWS runtime entrypoints to the betting-win read-only API and retired the executable export convergence CLI without changing historical deterministic evidence contracts.
- Added an API-only repository validator and regression coverage, including the temp/inode guard dependency in copied controller sandboxes.

# Changelog

## 2026-07-17 - Repository temp and inode safety

- Fixed the unbounded `bws-paper-runtime-evidence-*` test fixture leak by registering recursive `node:test` teardown.
- Added one repository-scoped temp session per root-controller invocation under `.automation/tmp`, with distinct parent/child ownership, atomic metadata, heartbeat, stale recovery, byte/inode preflight, per-run budgets, and a bounded watchdog.
- Added a dry-run-first cleanup command for dead marker-owned sessions and the confirmed legacy BWS fixture prefix.
- Added static and executable regression coverage plus repository validation and executable-mode enforcement.
- Preserved controller routing, lock semantics, notification ownership, artifact contracts, provider prohibition, and the closed execution gate.

## 2026-07-16 - Clean-checkout validation and cockpit build isolation

- Made `npm test` bootstrap its ignored repo-local artifacts directory and generate plus verify the exact committed-HEAD betting-win lock before the serialized compiled test suite.
- Removed the hidden dependency on stale `artifacts/` and `config/betting-win.upstream.lock.json` state from previous controller runs.
- Hardened the managed Vite cockpit builder and routed `validate:web` through it so browser asset publication cannot delete `dist/apps/web/src`, which is required by the read-only API and operator lifecycle CLIs.
- Replaced the release-packaging test-only cockpit-source restore workaround with assertions against the production build script and added the same fail-closed assertion to upgrade/recovery tests.
- Preserved the active `BWS-592` implementation queue, closed provider/execution boundaries, and exact upstream committed-HEAD verification.

## 2026-07-16 - Post-BWS-589 blueprint and protected-policy reconciliation

- Verified that the latest campaign implemented and validated `BWS-581` through `BWS-589`, then ended with `protected_files_changed` because the historical allowlist omitted the required `run-autonomous-implementation.sh` runtime-evidence return-handoff change.
- Accepted that reviewed source as carry-forward baseline and closed the protected integration phase; the active `BWS-590` through `BWS-599` task now sets `automation_maintenance_allowed=no` and `allowed_protected_files=none`.
- Reconciled stale status, starter, backlog and automation documentation to `BWS-589=VALIDATED` and `BWS-590=PENDING`.
- Added detailed release, recovery, soak, external-preflight and final-acceptance blueprints in `docs/042` through `docs/046`.
- Added `backlog/bws_remaining_safe_local_map.csv` with dependency-ordered subtasks, acceptance criteria, validation, blockers and unchanged areas.
- Increased the recommended autonomous cycle ceiling to six hours so the required two-hour `BWS-592` soak can include setup, recovery and cleanup while the 72-hour parent campaign continues through `BWS-599`.

## 2026-07-16 - Remaining operator runtime program and exact task-file maintenance policy

- Reclassified the validated `BWS-520` through `BWS-580` result as a bounded runtime foundation rather than final operator completion.
- Added a dependency-ordered remaining implementation queue from `BWS-581` through `BWS-599` covering continuous services, full-stack lifecycle, cockpit serving, database operations, observability, protected wrapper integration, paper lifecycle, release/recovery, soak proof and external-runtime preflight.
- Added detailed contracts `docs/034` through `docs/041` and ADR-0006.
- Selected `BWS-581` under `run-autonomous-implementation.sh`; `BWS-600` remains externally blocked and `BWS-900` parked.
- Replaced the no-handoff blanket `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` behavior with a unique task-file `automation_maintenance_allowed` marker and exact `allowed_protected_files` enforcement.
- Allowed only bounded repo-owned loopback child processes in task-required tests while continuing to prohibit mutation of pre-existing services or sessions.
- Added repository, program, continuation and controller contract validation for the rebaseline.

## 2026-07-15 - Continuous private-paper runtime implementation rebaseline

- Corrected the premature `SAFE_LOCAL_COMPLETE` classification after fresh paper-autopilot evidence proved the active controller remained `single_pass_no_service`.
- Preserved validated `BWS-100` through `BWS-510` and added the dependency-ordered `BWS-520` through `BWS-580` executable continuous-runtime source queue.
- Restored `run-autonomous-implementation.sh` as the selected controller and retained `BWS-600` as the separate accepted external-runtime evidence gate.
- Added `docs/033_continuous_private_paper_runtime_program.md` and updated validators/tests to fail if the library-only loopback surface is again treated as an operator-runnable continuous service.

# 2026-07-15 - Parent child-result side-channel hardening

- Replaced paper and bugfix parent parsing of streamed `child_output.log` machine-like lines with a strict atomic `child_terminal_result.env` side channel.
- Added child finalizer publication after lock-release classification for implementation, paper-evaluation, and bug-audit controllers.
- Bound parent PID, parent/child controller identity, repository, canonical run-directory containment, process exit code, cycle count, and lock-release state before any handoff can advance.
- Added explicit `PAPER_AUTOPILOT_BLOCKED_CHILD_RESULT` and `BUGFIX_AUTOPILOT_BLOCKED_CHILD_RESULT` fail-closed classifications.
- Added regression coverage proving repeated `final_status=` and `stop_reason=` text in streamed child output no longer truncates a valid multi-round campaign.
- Preserved 7-day parent and 72-hour child budgets, child Telegram suppression, post-lock artifact refresh, no-provider/no-execution boundaries, and standalone notification behavior.

## 2026-07-15 - Post-lock artifact finalization and runtime routing

- Corrected all five root-controller finalizers so the published repo-root `artifacts.zip` is atomically refreshed after successful lock release and therefore contains the authoritative final lock-release fields.
- Added an incremental fast-Deflate refresh that updates only the current run's final summary entries, including the paper evaluator's retained nested copy, on an atomic archive copy; a bounded full archive rebuild remains the fail-closed fallback.
- Preserved corrected full-rebuild behavior for child-cleanup and lock-release failures, and kept Telegram delivery after final lock and artifact classification.
- Transitioned active routing after validated `BWS-510` completion from autonomous implementation to `run-paper-autopilot.sh` for post-implementation runtime/database convergence.
- Kept `BWS-600` blocked on accepted betting-win continuous read-only runtime evidence and kept `BWS-900` parked.

## 2026-07-15 - Fast ZIP packaging and BWS-510 database URL wiring

- Switched controller artifact archives, numbered artifact archives, and numbered codebase archives to Info-ZIP fast Deflate level 1 while preserving the complete artifact-tree and filtered codebase contracts.
- Corrected the codebase exclusion boundary so only repo-root generated `runtime/` evidence is omitted; legitimate `src/runtime/` package source is preserved, and restored the two runtime source files omitted by the prior archive.
- Aligned `SOURCE_MANIFEST.json` generation with packaging by excluding `node_modules`, `dist`, and other generated directories at any depth while retaining nested source-owned runtime modules.
- Kept atomic temporary archives, bounded controller timeouts, SHA-256 output, and standard ZIP compatibility unchanged.
- Allowed the BWS-510 loopback acceptance validator to derive its exact disposable PostgreSQL tuple from `DB_URL_TEST` in the process environment or repo-local `.env` when no explicit `SUREBET_TEST_*` tuple is supplied.
- Rejected partial `SUREBET_TEST_*` tuples, malformed or ambiguous URLs, duplicate `.env` keys, and credential-bearing error output.
- Preserved `BWS-510` as pending until the autonomous controller executes the non-skipped database-backed acceptance proof and canonical validation.

## 2026-07-14 - Complete artifact archive and repo-local packaging hardening

- Changed all five root controllers and the shared archive helper so repo-root `artifacts.zip` recursively contains the complete `artifacts/` directory, rather than only the latest controller run directory.
- Aligned `zip_codebase.sh --artifacts-only` with `zip -q -r <archive> artifacts`, preserving every artifact file and directory without extension-based filtering.
- Removed the codebase zipper's dependency on writable system `/tmp` by creating its transient file list inside the repository and excluding that transient path from the archive.
- Hardened `pull_artifacts_and_zip_codebase.sh` to reject a `REMOTE_REPO` whose basename does not match the local repository, preventing cross-repo artifact downloads, and to invoke the verified executable zipper directly.
- Added regression coverage for full artifact-tree preservation, repo-local `mktemp` use, cross-repo remote rejection, and complete-artifact packaging markers in every root controller.

## 2026-07-14 - BWS-100 existing-checkout committed-HEAD pinning

- Replaced the clean-working-tree prerequisite with an exact `sourceView=committed_git_head` contract.
- Read root/workspace package manifests and provider capability markers from Git objects using `git show HEAD:` instead of working-tree files.
- Allowed the existing `~/app_testing/betting-win` checkout to contain unrelated uncommitted or untracked state without cloning, cleaning, resetting, committing, or copying it.
- Preserved fail-closed commit, Git-tree, tracked-tree fingerprint, schema, package, capability, mismatch, and mid-verification committed-HEAD mutation checks.
- Added deterministic dirty-worktree isolation and root-user unreadable-path coverage.
- Kept `BWS-100` pending until the autonomous controller generates and verifies the runtime lock and passes canonical validation.

# Changelog

## 2026-07-14 - Git executable-mode persistence hardening

- Hardened `update_git.sh --acp` to load the canonical required-executable list, restore owner execute permissions, and force Git index mode `100755` after content staging.
- Prevented Windows/WSL `core.fileMode=false` worktrees from pushing controller scripts as non-executable and blocking Linux server validation.
- Added a local-bare-remote regression proving a fresh clone preserves executable modes even when the source worktree ignores filesystem mode changes.
- Preserved token handling, secret-path refusal, fast-forward pull behavior, and the current BWS-100 implementation queue.

## 2026-07-14 - BWS-100 validation idempotency hardening

- Excluded the generated `config/betting-win.upstream.lock.json` runtime pin from `SOURCE_MANIFEST.json` inclusion so repeated `npm run validate` calls remain stable after upstream-lock generation.
- Added validator and regeneration regressions proving the runtime lock is ignored while source-owned configuration remains tracked.
- Bound the betting-win upstream contract validator to the source-manifest exclusion to prevent the non-idempotent validation defect from returning.
- Serialized Node test-file execution with `--test-concurrency=1` so controller regressions cannot interfere through shared repository locks, artifacts, or handoff state.
- Bound the deterministic test command in `scripts/validate_repo.py` and its contract test.
- Preserved `BWS-100` as pending until a clean real betting-win checkout passes exact lock generation and verification.

## 2026-07-13 - BWS full-platform documentation and implementation rebaseline

- Reframed BWS as the complete downstream surebet application built on betting-win.
- Added the inspected betting-win 0.48.0 capability baseline and runtime lock schema.
- Added the BWS-000 through BWS-900 dependency program and selected BWS-100.
- Replaced historical fixture-complete stop conditions with continuation through BWS-510.
- Preserved provider, betting-win core-write, and execution prohibitions.

# 2026-07-13 - Run-script hardening wave 10: parent-only Telegram routing

- Updated `run-paper-autopilot.sh` so every `run-paper-evaluation.sh` and `run-autonomous-implementation.sh` child is launched with `TELEGRAM_NOTIFY=0`; only the paper parent sends the campaign-final Telegram notification.
- Updated `run-bugfix-autopilot.sh` so every `run-autonomous-bugfix.sh` and `run-autonomous-implementation.sh` child is launched with `TELEGRAM_NOTIFY=0`; only the bugfix parent sends the campaign-final Telegram notification.
- Kept direct standalone runs unchanged: `run-paper-evaluation.sh`, `run-autonomous-implementation.sh`, and `run-autonomous-bugfix.sh` continue to send their own final notification unless the operator explicitly sets `TELEGRAM_NOTIFY=0`.
- Recorded the exact child launch environment in `child_command.txt` and parent lock metadata, including the notification suppression setting and verified parent identity.
- Added executable regression coverage proving child notifications are suppressed while the parent dry-run notification is still emitted once at finalization.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-12 - Run-script hardening wave 9: parent lock and heartbeat safety

- Hardened `run-bugfix-autopilot.sh` with a complete-file atomic parent-lock claim, strict schema/controller/repository/script/PID ownership checks, and no empty or partially formed live lock.
- Replaced full-record parent heartbeat rewrites in both parent controllers with `HEARTBEAT_SOURCE=file_mtime`; heartbeats now touch only lock mtime and poll shutdown once per second without erasing newer `ACTIVE_CHILD_*` metadata.
- Added zombie-aware PID liveness plus verified TERM-first process-group termination, bounded KILL escalation, and post-KILL exit verification in `.automation/lib/controller_hardening_v2.sh`.
- Added truthful bugfix-parent child-cleanup and lock-release finalization. Unsafe release now produces `BUGFIX_AUTOPILOT_BLOCKED_LOCK_RELEASE`, exit code `2`, corrected terminal evidence, and a preserved lock before Telegram notification.
- Hardened both parent `--force-unlock` paths so a lock is removed only after controller and child identity plus process termination are proven.
- Added parent-lock and heartbeat regression coverage and upgraded Telegram actions to `20260712.pretty_v5_parent_lock_actions`.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-12 - Run-script hardening wave 8: paper lock lifecycle and atomic parent finalization

- Hardened `run-paper-evaluation.sh` so it acquires the repo-scoped lock before run-directory creation or stale-handoff rotation, rewrites the lock with the exact run path, and starts the heartbeat only after that rewrite.
- Replaced the suppressed standalone paper lock release with explicit `lock_release_status`, `lock_release_exit_code`, and `lock_preserved` evidence. Unsafe child cleanup or lock release now produces `PAPER_EVALUATION_BLOCKED_LOCK_RELEASE`, exit code `2`, a preserved lock, corrected terminal artifacts, and Telegram notification only after classification.
- Hardened `.automation/lib/run_common.sh` with an atomic full-file hard-link claim so simultaneous standalone controller starts cannot both pass a check-then-write lock race.
- Hardened `run-paper-autopilot.sh` with the same full-file atomic parent-lock claim, strict parent-lock ownership on release, verified TERM/KILL completion during force-unlock, and explicit child-cleanup/lock-release terminal classifications.
- Added `PAPER_AUTOPILOT_BLOCKED_CHILD_IDENTITY` and `PAPER_AUTOPILOT_BLOCKED_LOCK_RELEASE` with preserved-lock evidence and controller-specific Telegram actions.
- Added executable regression coverage for concurrent lock claims, paper standalone release correction, parent child-identity failure, parent release failure, and successful terminal cleanup.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-12 - Run-script hardening wave 7: standalone lock lifecycle and truthful finalization

- Hardened `run-autonomous-implementation.sh` and `run-autonomous-bugfix.sh` so repo-scoped locks are acquired before run-directory creation, preventing empty artifact runs on same-controller or cross-controller lock conflicts.
- Added explicit terminal `lock_release_status`, `lock_release_exit_code`, and `lock_preserved` evidence.
- Replaced suppressed lock-release failures with `BLOCKED=yes`, `stop_reason=lock_release_failed_lock_preserved`, exit code `2`, preserved locks, corrective summaries/archives, and post-classification Telegram notification.
- Delayed implementation handoff consumption and revoked the consumed marker if final lock release fails, then rewrote the return handoff as blocked.
- Normalized unexpected bug-audit shell exits during the active loop to the documented blocked exit code.
- Added executable finalizer regression tests plus controller-contract and documentation alignment.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-11 - Run-script hardening wave 6: bugfix parent preflight and controller-specific Telegram actions

- Hardened `run-bugfix-autopilot.sh` with the shared cross-controller incompatibility guard before parent-lock acquisition or campaign artifact creation, matching the paper parent and standalone controller contract.
- Added regression coverage proving a verified live paper-parent lock blocks bugfix autopilot with no `artifacts/bugfix_autopilot_*` directory created.
- Upgraded `.automation/lib/telegram_notify.sh` to `20260711.pretty_v3_controller_actions` with explicit success, continuation, and next-action guidance for bugfix and paper parent terminal states.
- Added dedicated Telegram guidance for campaign completion, budget exhaustion, audit/implementation child blockers, no-op fixes, handoff mismatches, repeated handoffs, child-identity failures, partial source changes, accepted private reports, and packaging failures.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-11 - Run-script hardening wave 5: strict paper parent and shared lock protocol

- Hardened `run-paper-autopilot.sh` to accept only the canonical schema-v1 handoff emitted by `run-paper-evaluation.sh`; legacy `REPO_NAME` normalization and consumer-side handoff rewriting are removed.
- Added exact paper and implementation-return key allowlists, producer identity checks, child-result reconciliation, source-fingerprint verification, producer-run/evidence containment, evidence SHA-256 verification, and immutable round copies.
- Forwarded the configured ZIP timeout to the paper child and independently blocked paper-child source mutation.
- Blocked nonterminal implementation retries after a partial source change, because the original paper source fingerprint is stale and no terminal validated return handoff exists.
- Hardened `.automation/lib/run_common.sh` with lock schema v2, duplicate-aware lock fields, cross-controller exclusion, verified parent-child exceptions, managed child process groups, active-child status, heartbeat-safe metadata, zombie detection, and TERM-with-grace force-unlock before KILL escalation.
- Hardened shared process identity checks so they do not depend on readable `/proc/<pid>/cwd` and preserve exact path verification when proc cwd access is restricted.
- Added regression coverage for canonical paper flow, no-op blocking, lock metadata, graceful child termination, unrelated-controller blocking, and verified parent-launched child allowance.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-11 - Run-script hardening wave 4: canonical paper handoff and strict standalone consumption

- Hardened `run-paper-evaluation.sh` to emit a versioned schema-v1 paper-to-implementation handoff with repository/controller identity, stable semantic fingerprint, source fingerprint, immutable source-run identity, and SHA-256-bound evidence.
- Replaced direct handoff redirection with atomic temp-file-and-rename writes, rotated stale standalone paper handoffs before a new run, and fixed failure handoffs to record the classified exit code `2` instead of an unset/default controller status.
- Added timeout-bounded final `artifacts.zip` creation, consistent final-summary rewrite on packaging failure, and a unique machine-readable `paper_result=` record.
- Hardened `run-autonomous-implementation.sh` so standalone paper and bugfix handoffs must match exact schema-v1 key allowlists, the current repository source fingerprint, a repo-contained source run, and a non-symlink evidence file whose SHA-256 matches the handoff.
- Added immutable input-handoff evidence to each implementation run and regression coverage for canonical paper production, valid standalone consumption, evidence tampering, and unknown schema-key rejection.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary.

# 2026-07-11 - Run-script hardening wave 3: strict bug audit and campaign autopilot

- Replaced `run-autonomous-bugfix.sh` with a strict read-only four-state audit controller using `BUGFIX_AUDIT_COMPLETE=yes`, `CONTINUE_REQUIRED=yes`, `HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes`, or `BLOCKED=yes` plus a validated `request_flags.txt` contract.
- Added bounded campaign-area/focus inputs, baseline validation evidence, content-fingerprint immutability checks, context/model failure classification, stable bug signatures, hashed evidence, exact protected-file authorization, and fingerprinted implementation handoffs.
- Added `run-bugfix-autopilot.sh` with an eight-area surebet audit campaign, parent-budget clamping, semantic repeat protection, child-aware locks and heartbeat, explicit machine-result reconciliation, required validated source changes, and mandatory same-area re-audit before closure.
- Added independent parent verification that bug-audit children do not mutate source and that audit handoff source fingerprints match the observed source state.
- Added strict schema-v1 handoff key allowlists, evidence/run-directory and child stdout reconciliation, parent-budget race handling, accurate closed-area round state, and lock preservation when active-child identity cannot be verified during abnormal finalization.
- Registered the new parent in config, package commands, executable validation, progress/log helpers, protected-file docs, status docs, and source-handoff packaging tests.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary. The bugfix parent never calls paper evaluation or service lifecycle commands.

# 2026-07-11 - Run-script hardening wave 2: verified implementation and paper parent contracts

- Hardened `run-autonomous-implementation.sh` with pre-cycle baseline validation, strict paper and bugfix handoff parsing, semantic SHA-256 fingerprints, consumed-handoff rejection, exact protected-file allowlists for automated maintenance, accumulated source-change/validation evidence, classified context/capacity fallback handling, bounded `artifacts.zip`, and machine-readable terminal output.
- Added the strict `--handover-bugfix-audit` consumer and verified return handoffs for both paper re-evaluation and same-area bugfix re-audit. Handoff-triggered implementation no-ops now fail closed unless explicitly authorized.
- Hardened `run-paper-autopilot.sh` with child preflight before campaign artifacts, `--max-rounds 0` as the normal duration/repeat-guard mode, stale-handoff rotation, stable semantic handoff fingerprints, explicit child stdout reconciliation, remaining-parent-budget clamping, active-child lock metadata, verified child process-group termination, atomic handoff consumption, and mandatory post-change paper re-evaluation.
- Added protected shared helpers in `.automation/lib/controller_hardening_v2.sh`, including strict env parsing, unique machine-result extraction, repo-local path checks, source fingerprints, verified process identity, and bounded ZIP creation.
- Added executable behavior coverage for duplicate-key rejection, volatile-field-independent fingerprints, successful paper-to-implementation-to-paper flow, and no-op implementation blocking.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary. The next controller wave remains `run-autonomous-bugfix.sh` plus the missing `run-bugfix-autopilot.sh`.

# 2026-07-11 - Run-script hardening wave 1: paper preflight and bug-audit immutability

- Hardened `run-paper-evaluation.sh` so a supplied pinned bundle must pass existing-file, regular-file, non-symlink, repo-containment, and `.json` preflight before run creation or expensive repo validation.
- Replaced shell-constructed local-report calls with direct argv execution and added source/protected-file immutability verification plus explicit single-pass and machine-readable final-output contracts.
- Hardened `run-autonomous-bugfix.sh` with content-based source fingerprints so edits to already-dirty files are detected, and resolved retained artifact evidence before creating the current run directory.
- Added regression tests and controller-contract validation for early preflight, symlink rejection, direct argv execution, already-dirty mutation detection, artifact-hint ordering, and final stdout fields.
- Preserved the no-service, no-provider, no-direct-DB, no-execution, private-paper-only boundary. `run-autonomous-implementation.sh`, `run-paper-autopilot.sh`, and the missing bugfix parent autopilot remain for later hardening waves.

# 2026-07-08 - Post-cycle merge-conflict cleanup and validation guard

- Resolved unresolved Git conflict markers left in the paper-controller/autopilot documentation wave.
- Restored `run-paper-evaluation.sh` to a valid no-service controller with shell-quoted pinned-bundle command paths and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation.
- Regenerated `SOURCE_MANIFEST.json` after cleanup.
- Added `validate_repo.py` coverage for unresolved merge conflict markers so this failure class cannot pass repo validation again.

# 2026-07-08 - Paper autopilot shell automation alignment

- Added `run-paper-autopilot.sh` as the no-service parent supervisor for private paper evaluation and bounded implementation handoffs.
- Added Hyperliquid-style HTML Telegram final-card handling with surebet blocked-on-pinned-bundle classification.
- Hardened `run-paper-evaluation.sh` shell quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation.
- Added autopilot handoff metadata, progress/log discovery, zip temp-file hygiene, docs, tests, validators, and source manifest updates.

## 2026-07-08 — Paper pinned-bundle shell hardening and Telegram HTML alignment

- Hardened `run-paper-evaluation.sh` command construction so local fixture and pinned-bundle paths are shell-quoted before execution through `bash -lc`.
- Added strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation: unset, `0`, and `1` are accepted; any other value fails setup.
- Aligned `.automation/lib/telegram_notify.sh` with the latest Hyperliquid pretty HTML final-card helper while keeping surebet blocked-on-pinned-bundle statuses classified as blocked, not success.
- Added Telegram helper regression coverage for HTML parse mode, secret redaction, dry-run output, and status-file overwrite behavior.
- Updated docs/tests/validators/source manifest for the completed hardening while preserving the private paper-only/no-provider/no-execution boundary.

# Changelog

## 2026-07-06 - Documentation recheck: attachment-agnostic audit metadata

- Rechecked active documentation/config references against `betting-win-surebet30.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, bounded protected-file exception for the approved paper-controller hardening task, and no-service/private-fixture paper behavior.
- Updated `DOCUMENTATION_CHECK_REPORT.md` so its top source metadata is attachment-agnostic while recording `betting-win-surebet30.zip` as historical audit context. This avoids future documentation-only drift when a new current zip is uploaded for another recheck.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.


## 2026-07-06 - Documentation recheck: current source metadata refresh for betting-win-surebet29

- Rechecked active documentation/config references against `betting-win-surebet29.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, bounded protected-file exception for the approved paper-controller hardening task, and no-service/private-fixture paper behavior.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` from `betting-win-surebet28.zip` to `betting-win-surebet29.zip`.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.

## 2026-07-06 - Documentation recheck: current source metadata refresh for betting-win-surebet28

- Rechecked active documentation/config references against `betting-win-surebet28.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, bounded protected-file exception for the approved paper-controller hardening task, and no-service/private-fixture paper behavior.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` from `betting-win-surebet27.zip` to `betting-win-surebet28.zip`.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.

## 2026-07-06 - Documentation recheck: current source metadata refresh for betting-win-surebet27

- Rechecked active documentation/config references against `betting-win-surebet27.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, bounded protected-file exception for the approved paper-controller hardening task, and no-service/private-fixture paper behavior.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` from `betting-win-surebet26.zip` to `betting-win-surebet27.zip`.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.

## 2026-07-06 - Documentation recheck: current source metadata refresh

- Rechecked active documentation/config references against `betting-win-surebet26.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, bounded protected-file exception for the approved paper-controller hardening task, and no-service/private-fixture paper behavior.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` from `betting-win-surebet25.zip` to `betting-win-surebet26.zip`.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.

## 2026-07-06 - Documentation recheck: automation-maintenance protected-file exception

- Rechecked active documentation/config references against `betting-win-surebet25.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root helper/controller scripts, compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop helpers, documented Node 20 parent-shell activation, protected automation docs, and no-service/private-fixture paper behavior.
- Updated the current implementation-task and operator docs so the approved paper-controller pinned-bundle shell-command hardening is clearly treated as explicit automation maintenance and launched with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`.
- Kept the protected-file rule for normal implementation, paper evaluation, and bug-audit runs unchanged.
- Preserved the known non-documentation gate: real `SUREBET_PINNED_BUNDLE` use still waits for paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening.
- No application source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.


## 2026-07-06 - Documentation recheck: env template and validation matrix alignment

- Rechecked active documentation/config references against `betting-win-surebet24.zip`.
- Updated `.env.example` from stale SURE-001 contract/export placeholders to the current private-paper operator template for `GITHUB_TOKEN`, SSH artifact pulling, optional `REMOTE_ARTIFACT`, Telegram final notifications, and future-use `SUREBET_PINNED_BUNDLE` / `SUREBET_REQUIRE_PINNED_BUNDLE` settings.
- Refreshed `docs/011_validation_matrix.md` so autonomous continuation risks are described generically as documented safe repo-local backlog work instead of stale SURE-001-active wording.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` for `betting-win-surebet24.zip`.
- No app source, runtime controller logic, package scripts, validation logic, strategy behavior, provider integration, execution path, or pinned-bundle runtime behavior changed.

## 2026-07-06 — Documentation recheck: current-source report and future pinned command preflight

- Rechecked active automation docs against `betting-win-surebet23.zip`.
- Confirmed the standardized automation command surface remains aligned: canonical root controllers, compatibility-only `commands/run-sure-*` wrappers, Node 20 parent-shell activation, no obsolete stop/paper-12h helpers, and private paper-mode/pinned-bundle hardening boundaries.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` from `betting-win-surebet22.zip` to `betting-win-surebet23.zip` and updated its validation snippets to include the Node 20 parent-shell preflight.
- Updated the future pinned-bundle example in `docs/018_private_paper_mode_runbook.md` so it explicitly activates Node 20 before launching the root paper controller.
- No app source, runtime controller logic, package scripts, validation logic, or strategy behavior changed.

## 2026-07-06 — Documentation recheck: root-controller Node activation examples

- Rechecked active automation docs against `betting-win-surebet22.zip`.
- Updated standalone root-controller command examples so implementation, bugfix, and paper-evaluation controller commands explicitly show parent-shell Node 20 activation before launch.
- Refreshed `DOCUMENTATION_CHECK_REPORT.md` for `betting-win-surebet22.zip`; no app source, runtime controller logic, package scripts, or strategy behavior changed.

## 2026-07-06 — Documentation recheck: Node 20 preflight wording alignment

- Updated active bootstrap/runbook documentation so `npm install`, `npm run validate`, and root-controller check commands are shown after explicit parent-shell Node 20 activation.
- Kept the standardized automation rule unchanged: root controllers inherit the active parent shell runtime and must not source `nvm.sh` themselves.
- Refreshed the documentation check report for `betting-win-surebet21.zip`; no app source, runtime controller, package script, or strategy logic changes were made.


## 2026-07-06 — Documentation recheck: generated overlay manifest ignored by source manifest

- Rechecked active README, status, runbook, and automation docs against the standardized automation command surface after the previous cleanup overlay.
- Confirmed active docs already treat `OVERLAY_MANIFEST.json` as generated drag-and-drop metadata, not repo authority.
- Updated the source-manifest validator/regenerator contract so `OVERLAY_MANIFEST.json` is ignored like other generated overlay/runtime metadata while source-owned automation files remain tracked.
- Added regression coverage so generated overlay metadata cannot stale `SOURCE_MANIFEST.json`, while real source drift is still rejected.
- Updated the documentation check report and post-overlay cleanup note for `betting-win-surebet20.zip`.

## 2026-07-06 — Documentation recheck cleanup: stale overlay manifest removal

- Rechecked active README, status, runbook, and automation docs against the standardized automation surface after the previous documentation alignment overlay.
- Removed stale root `OVERLAY_MANIFEST.json` from source authority because it described an older drag-and-drop overlay and obsolete cleanup command, not the current repo state.
- Added `OVERLAY_MANIFEST.json` to `.gitignore` so future local overlay metadata does not become active source documentation.
- Updated `docs/automation/POST_OVERLAY_CLEANUP.md` and `DOCUMENTATION_CHECK_REPORT.md` to document that stale overlay metadata is generated and may be removed.


## 2026-07-06 — Documentation alignment for standardized automation surface

- Refreshed active README, status, runbook, and automation docs so canonical daily entrypoints are the root scripts: `run-autonomous-implementation.sh`, `run-paper-evaluation.sh`, and `run-autonomous-bugfix.sh`.
- Labeled `STARTER_PACK.md` as historical so it no longer reads as current SURE-001-only status.
- Updated SSH/artifact-pull docs to match the actual `pull_artifacts_and_zip_codebase.sh` contract: explicit `SSH_HOST`, `SSH_USER`, `SSH_PASSWORD`, `REMOTE_REPO`, optional `REMOTE_ARTIFACT`, no `automation.config.sh`, and no default remote host.
- Updated paper-evaluation docs to describe the no-service private fixture/pinned-bundle controller and the remaining pinned-bundle shell-hardening note without changing runtime logic.

## 2026-07-06 — Automation runtime artifact hardening

- Hardened `SOURCE_MANIFEST.json` validation/regeneration so controller-created runtime state under `.automation/locks/`, `.automation/corrupt/`, and exact paper/bugfix/implementation handoff files are ignored while source-owned `.automation` helpers remain tracked.
- Added regression tests proving runtime locks/handoffs do not stale the manifest and that real source drift is still rejected.
- Fixed `run-paper-evaluation.sh` finalizer exit-code capture so `final-summary.md` and Telegram final notifications report the real failing exit status.
- Documented the runtime-artifact policy and preserved the Hyperliquid-style parent-shell runtime, shared Telegram, final-artifacts, and no-service surebet adaptations.

## 2026-07-05 — Paper-evaluation standardization and containment hardening

- Standardized `run-paper-evaluation.sh` with the approved root-controller flags, parent-shell Node assertion, no-service private fixture flow, optional `SUREBET_PINNED_BUNDLE` smoke, `SUREBET_REQUIRE_PINNED_BUNDLE` fail-closed mode, deterministic final statuses, paper-mode implementation handoff, final `artifacts.zip`, and Telegram final notification.
- Hardened `local-report` and `local-report-batch` output containment so dangling output-file symlinks and nested `artifacts/` symlink path components are rejected before outside files or directories can be created.
- Removed shell-level artifact-output `mkdir -p` from the pinned-interface smoke path and automation paper command so CLI containment owns artifact directory creation.
- Converted historical `commands/run-sure-*` wrappers into thin compatibility wrappers over the standardized root controllers.
- Updated docs, validators, and tests to enforce the no-service surebet paper contract while preserving no-provider, no-execution, no-direct-DB, no-public-report, no-profitability-claim, and no-live-readiness boundaries.

## 2026-07-04 — Standard automation contract overlay

- Installed the shared root automation contract: `zip_codebase.sh`, `pull_artifacts_and_zip_codebase.sh`, `update_git.sh`, `run-autonomous-implementation.sh`, `run-paper-evaluation.sh`, `run-autonomous-bugfix.sh`, `automation.config.sh`, `.automation/lib/run_common.sh`, and `docs/automation/*`.
- Added `run-paper-evaluation.sh` as the canonical private paper supervisor, limited in this repo to repo-local fixture paper evaluation until Federico provides the pinned `betting-win` bundle.
- Added `run-autonomous-bugfix.sh` as the canonical proactive/reactive bugfix helper and kept no standalone stop helper.
- Updated automation validators/tests/docs so old controller internals and `run-paper-evaluation-12h.sh` naming are no longer required.
- Preserved hard boundaries: provider connections prohibited, execution prohibited, public signals prohibited, profitability claims prohibited, and real upstream evaluation blocked on the pinned interface.


## 2026-07-03 — Legacy surebet import cleanup confirmed

- Confirmed the temporary `docs/imported-from-betting-win/` staging path is absent after the legacy surebet rehome.
- Updated the documentation check report and overlay manifest so no future operator reads the already-completed cleanup as pending.
- Preserved the accepted three-repo boundary: `betting-win` owns provider truth/canonical history, `betting-win-surebet` owns surebet strategy/backtest/paper/future gated execution decisions, and `betting-win-betting` owns predictive/value betting with a separate account.
- No code, provider adapters, execution paths, strategy behavior, fixtures, or runtime commands changed.

## 2026-07-03 — Legacy surebet import re-homed after boundary landing

- Confirmed the three-repo surebet boundary overlay landed, then re-homed temporary `docs/imported-from-betting-win` material into archive-safe surebet legacy locations.
- Added archive README files for imported legacy docs, raw research artifacts, schema drafts, and templates.
- Updated the legacy import manifest and boundary validator so raw imported research does not remain under active `docs/` and the temporary import source path is removed.
- Preserved current safety gates: provider connections prohibited, execution prohibited, real upstream evaluation blocked until Federico provides a pinned `betting-win` bundle.

## 2026-07-03 — Three-repo surebet boundary documentation rebaseline

- Re-anchored active docs so `betting-win-surebet` is the dedicated surebet/complete-set strategy repo while current live execution remains gated and disabled.
- Added surebet boundary, strategy-state ownership, backtest/paper/live-mode roadmap, separate-account policy, legacy-import manifest, and ADR-0004.
- Added `scripts/validate_three_repo_surebet_boundary.py` and `tests/three-repo-surebet-boundary.test.ts` so docs cannot drift back into provider-truth ownership, predictive/value-betting scope, shared accounts, or ungated live execution.
- Preserved all SURE-002B private paper-mode gates: provider connections prohibited, execution prohibited, real upstream evaluation blocked until Federico provides a pinned `betting-win` bundle.

## 2026-07-02 — SURE-002A local safety bugfix hardening

- Hardened the repo-local export bundle reader against symlink and realpath escapes while preserving the no-provider/no-network boundary.
- Added runtime validation for read-only query resource names so JavaScript callers cannot bypass the TypeScript union.
- Enforced resolved same-currency quote legs before complete-set paper math; `UNKNOWN` and mixed `USD`/`USDC` quote groups now block.
- Required accepted local settlement replay evidence before private opportunity reports can be emitted from local fixture bundles.
- Wired quote freshness into local paper reports using bundle `exportedAt` and a deterministic local freshness window.
- Replaced the stale partial-fill blocked stub with a local status contract pointing to the implemented completion/residual modules.
- Added regression tests for symlink rejection, resource validation, quote currency blocking, settlement-required reporting, stale quote blocking, and partial-fill status.

## 2026-07-02 — SURE-002A local backlog completion handoff

- Synced README, AGENTS, scope, runbook, master-plan, and current-status docs after the 12-cycle SURE-002A local engine run exhausted the safe local backlog.
- Added `docs/016_pinned_betting_win_interface_readiness.md` as the next required handoff checklist before any real upstream evaluation.
- Strengthened local-engine backlog validation so stale docs cannot continue telling agents to invent more local implementation work after both retained backlogs are exhausted.
- Preserved hard boundaries: no provider connections, no execution paths, no direct `betting-win` DB access, no vendored contracts, no public signals, and no profitability claims.

## 2026-07-02 — SURE-002A local engine implementation backlog overlay

- Documented why the latest autonomous run stopped: SURE-001 hardening backlog was exhausted and the controller correctly wrote `AUTONOMOUS_GOAL_COMPLETE=yes`.
- Added `docs/015_local_engine_implementation_backlog.md` so the next run can implement the maximum safe local surebet engine work without a real upstream `betting-win` export bundle.
- Updated autonomous task selection to continue from SURE-001 hardening into SURE-002A local interface/engine implementation while preserving one bounded slice per cycle.
- Added `commands/run-sure-local-engine-autonomous.sh` as the clearer start wrapper for this phase.
- Added `scripts/validate_local_engine_backlog_contract.py` and `tests/local-engine-backlog-contract.test.ts` so the local-only/no-provider/no-execution boundary is validated.
- Updated status/master-plan docs to allow local deterministic contracts, parsers, fixture readers, paper math, state machines, settlement replay consumers, and private reports while keeping real upstream evaluation blocked until Federico provides the pinned interface.


## 2026-07-01 — SURE-001 autonomous continuation backlog overlay

- Documented why the latest run stopped quickly: the controller reached `AUTONOMOUS_GOAL_COMPLETE=yes` after one bounded slice because the prompt still told it to stop after one slice.
- Added `docs/014_sure_001_remaining_hardening_backlog.md` as the active safe SURE-001 backlog for the next autonomous run.
- Updated the controller prompt so each cycle still performs one bounded safe SURE-001 slice, but the run continues with `CONTINUE_REQUIRED=yes` while safe backlog items remain.
- Added a continuation-contract validator and test coverage so the one-slice stop behavior does not silently return.
- Preserved SURE-001 boundaries: no provider connections, execution paths, direct `betting-win` DB access, generated-contract vendoring, solver, simulation, or settlement implementation.

## 2026-07-01 — SURE-001 cycle artifact quality and manifest hardening

- Added fail-closed controller validation for required cycle artifact quality: missing, placeholder, or empty required report artifacts now stop the loop before machine status is accepted.
- Preserved `git_diff.patch` as the only required artifact that may be empty when a cycle genuinely makes no source diff.
- Added `scripts/validate_source_manifest.py` and refreshed `SOURCE_MANIFEST.json` so stale source handoff manifests are caught by `npm run validate`.
- Extended controller contract docs and tests without adding provider connections, execution paths, direct `betting-win` DB access, generated-contract vendoring, or solver implementation.

## 2026-07-01 — SURE-001 autonomous status fail-closed hardening

- Fixed the autonomous controller status parser so malformed, missing, combined, or unknown `continue_status.txt` content fails closed instead of being treated as `CONTINUE_REQUIRED=yes`.
- The controller now fails closed on nonzero Codex cycle exit before accepting any cycle status.
- The controller now requires post-cycle `npm run validate` to pass before accepting `AUTONOMOUS_GOAL_COMPLETE=yes` or any other cycle status.
- Added `scripts/validate_autonomous_controller_contract.py` and wired it into `npm run validate` so future controller/prompt drift is caught.
- Added `docs/013_autonomous_controller_status_contract.md` and updated the autonomous loop contract/run docs.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 autonomous controller and codebase packaging fix

- Fixed the autonomous controller `set -u` startup crash by splitting dependent `local` assignments in `run-autonomous-implementation.sh`.
- The controller now removes only its exact generated root archives (`artifacts.zip`, `autonomous-codebase.zip`) before preflight so a previous completed run cannot poison the next hygiene check.
- The controller now writes a lock PID and can remove the legacy empty lock directory left by the prior `out_dir` crash, while still refusing active PID/nonempty locks.
- Added `scripts/validate_shell_local_assignments.py` so the same Bash `local var=... dependent="$var/..."` regression is caught by `npm run validate`.
- Added repo-local `zip_codebase.sh`, adapted from the main `betting-win` packaging pattern for `betting-win-surebet`.
- Updated `pull_artifacts_and_zip_codebase.sh` to delegate clean codebase packaging to `zip_codebase.sh` and to scan browser duplicate archive names such as `betting-win-surebet1(2).zip` when choosing the next suffix.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 no-source-NVM launcher fix

- Replaced the startup runtime loader with a no-source loader that never sources `nvm.sh` and never calls the NVM shell function.
- The launcher now accepts the current PATH Node when it matches the `.nvmrc` major, otherwise it tries direct already-installed Node binaries under `$NVM_DIR/versions/node/.../bin`.
- Added `validate_node_runtime_loader.py` so future launcher changes cannot reintroduce the WSL/Bash `nvm.sh` startup failure.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## SURE-001 launcher NVM shell-context fix

- Replaced launcher-time `nvm.sh` sourcing with direct `.nvmrc` runtime path discovery.
- Keeps startup visible before validation and avoids WSL/bash `pop_var_context` failures from NVM internals.
- Adds `scripts/load-node-runtime.sh` to executable-bit validation.


## 2026-06-30 — SURE-001 local `.env` hygiene correction

- Allowed a repo-root `.env` file to exist locally when it is explicitly ignored by Git.
- Kept `.env` forbidden in source handoff/codebase archives so secrets are not packaged.
- Preserved SURE-001 boundaries: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.

## 2026-06-30 — SURE-001 master-plan operations overlay

- Added the surebet master plan and current-status docs.
- Added Linux-first repo hygiene files: `.gitattributes`, expanded `.gitignore`, `.env.example`, and `PROJECT_STATUS.md`.
- Added adapted operational shell helpers from the Hyperliquid reference pattern: validation start wrapper, safe no-service stop wrapper, progress/log watchers, Git helper, artifact/codebase pull helper, source handoff archive helper, and autonomous implementation controller.
- Added executable-bit restoration and validation.
- Kept SURE-001 boundaries intact: no provider connections, no execution paths, no direct `betting-win` database access, no vendored generated contracts, and no solver implementation.


## SURE-002B private paper-mode intake overlay

- Added the SURE-002B private paper-mode backlog and runbook for safe repo-local pinned-interface intake and artifact/report hardening.
- Added `commands/run-sure-paper-mode-autonomous.sh` and `commands/run-pinned-interface-smoke.sh`.
- Hardened local report output containment against realpath/symlink escapes.
- Added per-candidate settlement summaries for multi-candidate private paper reports.
- Added validator and tests for the private paper-mode backlog contract.


## 2026-07-06 — Documentation recheck for pinned-bundle hardening gate

- Clarified active runbooks and automation docs so real `SUREBET_PINNED_BUNDLE`
  commands are not presented as ready until paper-controller shell-command
  quoting and strict pinned-bundle boolean validation hardening lands.
- Updated the current implementation task and status docs to identify that
  hardening as the next allowed repo-local tooling task before using a real
  pinned `betting-win` export bundle.
- Refreshed validation-matrix wording from stale SURE-001/SURE-002A phrasing to
  the current completed SURE-002B private paper-mode gate.

## API-only betting-win upstream rebaseline

- Removed the operator-selectable export runtime and the upstream mode setting.
- Fixed runtime convergence, scheduling, paper evaluation, release/recovery, soak, and external preflight to the betting-win read-only API.
- Added API-only contract validation and repaired controller test sandboxes for the temp/inode guard.

## 2026-07-17 - Watchdog measurement-race hardening

- Accepted valid numeric session measurements even when concurrent file deletion makes `du` return non-zero.
- Added bounded consecutive-failure handling for genuinely unusable measurements.
- Preserved exact-owner `TERM` behavior for real capacity breaches and added bounded durable watchdog event evidence outside ephemeral temp sessions.
- Added executable race and exact-owner regression coverage.
