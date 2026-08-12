# Protected automation files

These files define repository automation or operator lifecycle contracts and are read-only during ordinary product, paper and bug-audit cycles:

```text
update_git.sh
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
check_progress.sh
watch_progress.sh
open_log.sh
start.sh
stop.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
run-paper-autopilot.sh
run-bugfix-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
.automation/lib/controller_hardening_v2.sh
.automation/lib/temp_inode_guard.sh
.automation/lib/telegram_notify.sh
cleanup_automation_temp_inode_residue.sh
cleanup_automation_artifact_residue.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

## Exact authorization contract

Protected changes are permitted only when an explicit handoff or the active task source provides exact authorization.

When authorization is active, all of the following are required:

```text
AUTOMATION_ALLOW_PROTECTED_CHANGES=1
automation_maintenance_allowed=yes
allowed_protected_files=<one exact comma-separated list>
```

`AUTOMATION_ALLOW_PROTECTED_CHANGES=1` is not blanket permission. The implementation controller rejects missing, duplicate, malformed, empty or out-of-list authorization. It snapshots every protected path and blocks a cycle if any changed protected path is outside the exact list.

## Historical BWS-587 through BWS-589 authorization

The reviewed integration phase required:

```text
start.sh
stop.sh
check_progress.sh
watch_progress.sh
open_log.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
automation.config.sh
.automation/lib/run_common.sh
docs/automation/PROTECTED_AUTOMATION_FILES.md
```

`run-autonomous-implementation.sh` was required so a runtime-evidence paper handoff could preserve selected upstream mode and campaign identity through the implementation return handoff. The same schema fields are accepted by `run-bugfix-autopilot.sh` when validating a bugfix-mode implementation return handoff; values must remain `none` when runtime evidence is not requested by the bugfix campaign. `run-autonomous-bugfix.sh` must also preserve terminal confirmed-bug handoffs before post-Codex validation, so a known red baseline can be handed to implementation instead of misclassified as an unexpected audit-child exit.

## Current task state

The integration phase is complete. `docs/automation/current-implementation-task.md` now contains:

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for the current `BWS-600` runtime-evidence state, completed `BWS-700` dependency-ready local implementation state, or any ordinary implementation, paper, or bugfix run. Do not broaden authorization from inside an autonomous cycle.

Executable command lists remain in `automation.config.sh`, `tools/required_executable_paths.js` and `scripts/validate_executable_bits.py`.

## Temp/inode safety protection

`.automation/lib/temp_inode_guard.sh` and `cleanup_automation_temp_inode_residue.sh` are protected automation files. Product implementation cycles may not weaken capacity thresholds, ownership checks, path containment, watchdog behavior, or cleanup boundaries.
## BWS Wave 54 controller-return repair

`run-autonomous-implementation.sh` remains protected. The Wave 54 change is limited to bugfix-handoff return classification: validated source-changing repairs return to the bugfix parent for same-area re-audit even if the child-authored continuation marker reports an environment-only block after controller-managed validation passed.

## Artifact residue cleanup protection

`cleanup_automation_artifact_residue.sh`, `.automation/lib/run_common.sh`, and `.automation/lib/controller_hardening_v2.sh` enforce the retained-artifact boundary. They may remove only explicitly allowlisted top-level test/release scratch families and symlink nodes below exact autonomous child `cycles/cycle_<n>/repro/` trees. Regular repro files, canonical controller run directories, handoffs, private-paper reports, runtime evidence, watchdog events, and operator evidence must not be selected by cleanup. A symlink outside that exact nested rule remains fatal. Full and incremental artifact packaging clean transient residue before symlink validation so a failed negative-test fixture cannot block an otherwise validated controller result.

## Bugfix completion next-area contract

`run-bugfix-autopilot.sh` remains protected. A clean audit child may report `NEXT_AUDIT_AREA=none` or the exact next non-closed campaign area. The parent validates any explicit slug against its campaign ledger and rejects skipped, stale, or arbitrary areas before closing the current row. This controller repair does not authorize protected changes during ordinary bugfix runs.

## Parent/child schema transition safety

Protected controller helpers can change only through an exact reviewed maintenance handoff or external overlay. If an authorized child changes lock or terminal-result identity fields while the parent is already running, compatibility is limited to that exact direct parent-child process relationship for one generation. It is not permission to accept arbitrary legacy locks. The lock path, parent PID, direct-parent relationship, controller pairing, repository, script path, command identity, and non-symlink file type must all match. Any unrelated or malformed live lock remains blocking.

New parents use boot ID and process-start ticks for both lock ownership and child-result reconciliation. `RUN_DIR=none` is accepted only for an identity-rich child result that reports an explicit pre-start setup failure with zero cycles and a nonzero exit code.

## Implementation-cycle source-manifest reconciliation

`run-autonomous-implementation.sh` remains protected. After a Codex cycle changes the source fingerprint and the exact protected-file policy passes, the controller deterministically regenerates and validates `SOURCE_MANIFEST.json` before capturing the final cycle diff and running repository validation.

This metadata reconciliation does not broaden the handoff's product scope and does not authorize protected-file changes. A missing, symlinked, or failing manifest generator/validator is a blocking controller error. No manifest refresh occurs when the cycle makes no source change.
