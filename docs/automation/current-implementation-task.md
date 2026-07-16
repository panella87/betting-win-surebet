# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-590
current_task_status=PENDING
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

## Campaign objective

Implement every remaining safe local component required for a real operator-runnable continuous private-paper BWS application. Use `backlog/bws_full_implementation.csv` as the binding dependency ledger. Start with the first dependency-ready `PENDING` row, currently `BWS-590`, and continue across validated cycles through `BWS-599`.

Do not stop after one bounded task while another dependency-ready safe row remains.

## Required reading

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `docs/034_remaining_operator_runtime_implementation_program.md`
7. `docs/035_continuous_service_supervisor_contract.md`
8. `docs/036_root_wrappers_and_paper_automation_integration.md`
9. `docs/037_database_backup_retention_and_recovery.md`
10. `docs/038_observability_metrics_and_evidence_contract.md`
11. `docs/039_release_deployment_and_upgrade_contract.md`
12. `docs/040_soak_failure_injection_and_operator_acceptance.md`
13. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
14. `backlog/bws_full_implementation.csv`

## Verified carry-forward state

`BWS-100` through `BWS-589` are validated. Preserve their contracts. Do not reimplement or weaken validated functionality merely to create work.

Carry-forward upstream proof must prove the betting-win committed HEAD remains unchanged during verification, retain no placeholder fields in the lock, and use no clone or temporary worktree.

The current concrete gaps are:

```text
no release/upgrade/rollback/recovery package
no long-running soak/failure-injection acceptance
no external runtime preflight/campaign manifest
```

## First task

```text
id=BWS-590
objective=implement reproducible release and deployment packaging
```

Required outcomes:

- produce a versioned private release package with source/build checksums and exact upstream-lock references;
- add Node 20 and PostgreSQL preflight plus a private environment template without secret output;
- provide user-service templates and a non-mutating install verification path;
- preserve execution-disabled, provider-disabled and no-fallback boundaries throughout packaging and verification;
- update the task ledger only after complete proof and `npm run validate` pass.

## Full remaining sequence

```text
BWS-590  release and deployment packaging
BWS-591  upgrade, rollback and disaster recovery
BWS-592  soak and failure injection
BWS-593  external runtime preflight and campaign manifest
BWS-599  integrated final local acceptance
```

## Protected automation authorization

The later integration tasks require an exact protected subset.

```text
automation_maintenance_allowed=yes
allowed_protected_files=start.sh,stop.sh,check_progress.sh,watch_progress.sh,open_log.sh,run-paper-evaluation.sh,run-paper-autopilot.sh,automation.config.sh,.automation/lib/run_common.sh,docs/automation/PROTECTED_AUTOMATION_FILES.md
```

Rules:

- `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` must be set for this campaign.
- The controller must still enforce the exact list above.
- No protected file outside the list may change.
- Do not edit protected files before the active dependency-ready row requires them.
- Do not broaden the list from inside an autonomous cycle.

## Process-test authorization

Do not start, stop, restart, kill, detach or replace pre-existing services or user sessions.

Bounded repo-owned child processes launched by tests are allowed when the active task requires lifecycle, crash, restart, shutdown or recovery proof. They must use unique identities and ports, remain loopback-only, and be cleaned up by the creating test.

## Continuation rules

```text
CONTINUE_REQUIRED=yes
  while any dependency-ready safe local row through BWS-599 remains PENDING

AUTONOMOUS_GOAL_COMPLETE=yes
  only after BWS-599 is VALIDATED and no dependency-ready safe local work remains

BLOCKED=yes
  only for a concrete unrecoverable repository state or exact missing external evidence
```

`BWS-600` may remain blocked after local completion. `BWS-900` remains parked.

## Safety constraints

```text
BETTING_WIN_REPO_PATH=existing_read_only_checkout
betting_win_checkout_mutation=prohibited
provider_connections=prohibited
provider_credentials=prohibited
direct_betting_win_core_writes=prohibited
execution=prohibited
public_signals=prohibited
profitability_claims=prohibited
automatic_upstream_mode_fallback=prohibited
floating_point_money=prohibited
secret_output=prohibited
pre_existing_service_mutation=prohibited
```

Do not clone the betting-win checkout. Do not invent a contract, endpoint, acceptance result or external runtime evidence.
