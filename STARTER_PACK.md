# STARTER_PACK

## Start here

The repository is in the active remediation campaign `BWS_FINAL_REMEDIATION_R01_R12_V1`. The first admitted tranche is `BWS-W4-T39`; current campaign authority records no accepted T39 result. Verify the exact current archive or checkout through an external audit or admission receipt rather than treating a rolling numbered ZIP named in repository documentation as current authority.

```text
repo_role=surebet_strategy_application
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_stage=S1
current_live_execution_gate=closed
canonical_node=v20.20.2
```

Read in this order:

1. `AGENTS.md`
2. `docs/000_documentation_index.md`
3. `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/README.md`
4. `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/active-campaign-admission.md`
5. `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/unattended-plan.json`
6. `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/tasks/001-BWS-W4-T39.md`
7. `docs/automation/README.md`
8. `docs/002_dependency_contract_with_betting_win.md`

## What is authorized

- One source-mutating tranche at a time.
- T39 first, then exact campaign order after accepted dependencies.
- Direct bounded Codex sessions for campaign orders 1 through 13.
- Repaired `run-autonomous-implementation.sh` only after all S2 tranches are accepted.
- Exact task-owned source and test changes, exact protected-file allowlists, and required disposable proof environments.

## What is not authorized

- Existing autonomous controllers as remediation drivers before S2.
- Provider access, `betting-win` checkout access or mutation, live betting, signing, payments, deployment, release, or production promotion.
- Fixture or local API substitution for BWS-600 or BWS-710 external evidence.
- Concurrent source-mutating tranches.
- Unknown receipt states or silent defaults.

## Operator paths

```text
local_repo=/mnt/c/Users/feder/Desktop/Development/GitHub/betting-win-surebet
target_repo=$HOME/app_testing/betting-win-surebet
active_launcher=docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/run-unattended-remediation-campaign.sh
```

Use the exact server command in `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/server-runbook.md`. Run it from a persistent operator session. Do not manually delete locks or bypass the activation validator.

## Returning evidence

After a controller or campaign stops, run `pull_artifacts_and_zip_codebase.sh` from the local repository root. Return both newly numbered files:

- `artifactsN.zip` for retained server evidence;
- `betting-win-surebetN.zip` for current source.

The source ZIP controls current files. The artifact ZIP describes the attempt. Never include `.env`, credentials, databases, `node_modules`, or unretained server logs.

## Historical validation lineage

`BWS_FULL_PLATFORM_IMPLEMENTATION_V1` retains validated gates `BWS-592`, `BWS-593`, and `BWS-599`.

## Historical B1 foundation

BWS-700 dependency-ready local implementation is validated through BWS-820. The completed queue is `backlog/bws_b1_cross_venue_implementation.csv`, with authority in `docs/047_b1_cross_venue_offline_falsification_program.md`. BWS-710 remains externally blocked, and these records are carry-forward regression authority rather than current routing.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
current_task=BWS-600
selected_controller=run-paper-autopilot.sh
active_implementation_queue=none
```

That final block is retained for validator compatibility and records the pre-remediation route only.
