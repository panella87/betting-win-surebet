# Current implementation task

Repository: betting-win-surebet.

Objective: inspect the current code, docs, validation output, and the full surebet blueprint. The paper-controller pinned-bundle command hardening is implemented: `SUREBET_PINNED_BUNDLE` paths are shell-quoted before `bash -lc`, `SUREBET_REQUIRE_PINNED_BUNDLE` is strict `0` or `1`, and the controller must fail fast when a configured pinned bundle path is missing, remote, outside the repo, non-JSON, a symlink, or not a regular file.

Fix only confirmed repo-local validation/tooling defects, documentation drift, approved automation-maintenance gaps, private-paper local fixture bugs, or pinned-bundle preflight/reporting defects. Do not report the full product blueprint as complete merely because the repo-local fixture backlog is exhausted. If no concrete safe repo-local defect exists and Federico has not provided a real repo-local pinned `betting-win` export/interface, produce the required cycle artifacts and write:

```text
BLOCKED=yes
```

Use `AUTONOMOUS_GOAL_COMPLETE=yes` only for a bounded repo-local task that is genuinely complete and does not mask the external pinned-interface blocker.

Constraints:

```text
provider_connections=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
protected_automation_files=read_only_except_explicit_automation_maintenance_task
protected_file_exception=none_currently_active
required_operator_env=none_for_normal_runs
```

Do not invent new SURE-002A or SURE-002B backlog work. The safe repo-local backlogs are complete; future automation-maintenance work must be explicitly approved and bounded. Do not add provider connections, direct `betting-win` DB reads, execution paths, public reports, profitability claims, or live-readiness claims.

## Current automation state

Autopilot shell automation alignment is implemented. Future implementation should fix only confirmed repo-local validation/tooling defects or stop with `BLOCKED=yes` when the only remaining product blocker is the missing pinned `betting-win` interface.

provider_connections=prohibited
execution=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
