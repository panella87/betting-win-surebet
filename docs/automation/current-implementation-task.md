# Current implementation task

Repository: `betting-win-surebet`.

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-599
current_task_status=VALIDATED
safe_local_terminal_gate=BWS-599
external_runtime_gate=BWS-600
```

## Campaign objective

This file retains the validated completion record for the final safe local component required for a real operator-runnable continuous private-paper BWS application. Use `backlog/bws_full_implementation.csv` as the binding dependency ledger and `backlog/bws_remaining_safe_local_map.csv` as the dependency-ordered implementation map.

`BWS-599` is validated. No dependency-ready safe local `PENDING` row remains through `BWS-599`.

Prefer the largest safe cohesive tranche:

```text
tranche_1=BWS-599_final_clean_room_acceptance
```

Each binding ledger row must still be validated separately. Do not merge unrelated work or mark a dependent row complete before its own proof passes.

## Required reading

1. `AGENTS.md`
2. `docs/repo_status_current.md`
3. `docs/MASTER_PLAN.md`
4. `docs/028_full_implementation_program.md`
5. `docs/029_full_implementation_task_ledger.md`
6. `docs/034_remaining_operator_runtime_implementation_program.md`
7. `docs/039_release_deployment_and_upgrade_contract.md`
8. `docs/040_soak_failure_injection_and_operator_acceptance.md`
9. `docs/041_external_runtime_preflight_and_bws600_campaign.md`
10. `docs/042_release_packaging_implementation_blueprint.md`
11. `docs/043_upgrade_rollback_recovery_implementation_blueprint.md`
12. `docs/044_soak_failure_injection_implementation_blueprint.md`
13. `docs/045_external_runtime_preflight_implementation_blueprint.md`
14. `docs/046_final_local_acceptance_implementation_blueprint.md`
15. `backlog/bws_full_implementation.csv`
16. `backlog/bws_remaining_safe_local_map.csv`

The validated service, database, observability, wrapper and paper-controller contracts in `docs/035` through `docs/038` remain binding carry-forward requirements.

## Verified carry-forward state

`BWS-100` through `BWS-593` are validated. Preserve their contracts. Do not reimplement or weaken validated functionality merely to create work.

The `BWS-589` runtime-evidence paper-autopilot change required a reviewed protected update to `run-autonomous-implementation.sh` so selected mode and campaign identity survive implementation return handoffs. That source is now accepted carry-forward baseline. The protected integration phase is closed.

Carry-forward upstream proof must prove the betting-win committed HEAD remains unchanged during lock verification, retain no placeholder fields, and use no clone or temporary worktree.

The previously remaining concrete gap is now closed:

```text
integrated clean-room final local acceptance=validated
```

## First task

```text
id=BWS-599
objective=validated integrated clean-room final local acceptance
largest_safe_tranche=complete_BWS-599_final_local_acceptance
```

Required outcomes:

- create a clean release extraction and prove it installs, preflights and migrates without depending on the source checkout;
- run the full stack, diagnostics, paper evaluation and bounded paper-autopilot acceptance against exact repo-owned loopback services;
- verify backup, restore, upgrade, rollback decision and interrupted recovery paths against disposable acceptance-owned targets;
- consume the validated `BWS-592` soak/failure evidence and `BWS-593` external preflight manifest inputs inside one final immutable acceptance manifest;
- verify cleanup of acceptance-owned processes, databases, leases and temporary files without mutating unrelated services or persistent project databases;
- preserve execution-disabled, provider-disabled, loopback-only and no-fallback boundaries;
- update the task ledger only after complete proof and `npm run validate` pass.

## Full remaining sequence

```text
BWS-599  integrated final local acceptance (validated)
```

## Protected automation authorization

The protected wrapper and paper-controller integration tasks are complete. The current release, recovery, soak, preflight and final-acceptance queue does not authorize protected automation edits.

```text
automation_maintenance_allowed=no
allowed_protected_files=none
```

Rules:

- Do not set `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for this campaign.
- Any protected automation change is a blocker unless a later external overlay explicitly updates this task source first.
- Do not broaden authorization from inside an autonomous cycle.

## Campaign budgets

```text
campaign_duration=72h
max_cycles=200
recommended_cycle_timeout=6h
validation_timeout=45m
```

The `BWS-599` clean-room acceptance is validated. A successful completion cycle now reports `AUTONOMOUS_GOAL_COMPLETE=yes`.

## Process-test authorization

Do not start, stop, restart, kill, detach or replace pre-existing services or user sessions.

Bounded repo-owned child processes launched by tests are allowed when the active task requires lifecycle, crash, restart, shutdown or recovery proof. They must use unique identities and ports, remain loopback-only, and be cleaned up by the creating test.

Disposable PostgreSQL proof may create and drop only uniquely named test databases using the existing private test role.

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
