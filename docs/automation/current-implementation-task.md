# Current implementation task

Repository: betting-win-surebet.

Objective: inspect the current code, docs, and validation output. The currently
confirmed safe repo-local tooling defect is paper-controller pinned-bundle command
hardening: quote operator-provided `SUREBET_PINNED_BUNDLE` paths before any
`bash -lc` command construction and validate `SUREBET_REQUIRE_PINNED_BUNDLE` as
strict `0` or `1`. Fix that defect first. This is an explicit automation-maintenance task, so the operator should launch the implementation controller with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`; the protected-file exception is limited to the paper-controller hardening and directly required docs/tests/validators. After it is fixed: Fix only confirmed repo-local validation/tooling defects, documentation drift, or
private-paper local fixture bugs. If no concrete safe defect exists, produce the
required cycle artifacts and write:

```text
AUTONOMOUS_GOAL_COMPLETE=yes
```

Constraints:

```text
provider_connections=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
protected_automation_files=read_only_except_explicit_automation_maintenance_task
protected_file_exception=run-paper-evaluation.sh_only_for_pinned_bundle_command_hardening
required_operator_env=AUTOMATION_ALLOW_PROTECTED_CHANGES=1
```

Do not invent new SURE-002A or SURE-002B backlog work. The safe repo-local
backlogs are complete; the pinned-bundle command hardening above is automation
runtime hygiene, not new product scope. Do not add provider connections, direct
`betting-win` DB reads, execution paths, public reports, profitability claims, or
live-readiness claims.
