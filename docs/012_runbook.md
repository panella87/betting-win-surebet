# 012 - Operator runbook

## Active remediation campaign

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
activation_state=ACTIVE
current_admitted_tranche=BWS-W4-T39
current_campaign_order=1
current_stage=S1
canonical_node=v20.20.2
```

Use the active admission, plan, task, launcher, and server command under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/`. The first 13 campaign orders are direct bounded implementation sessions. Do not start an existing root controller as the remediation driver before S2 is fully accepted.

## Operator sequence

1. Work in `$HOME/app_testing/betting-win-surebet` on the target.
2. Pull only through the repository helper when the local commit has been pushed.
3. Activate exact Node `v20.20.2` in the parent shell.
4. Start the active remediation launcher from a persistent operator session.
5. Let the launcher select exactly one admitted task and enforce the global 28-day window.
6. On stop or block, preserve the exact campaign artifact directory and current source.
7. Return both the numbered artifact ZIP and numbered source ZIP.
8. Resume only from current repository and retained state evidence.

## Safety

Do not access or mutate `betting-win`, providers, credentials, live accounts, release, deployment, or execution. Do not manually delete locks, kill broad process sets, or bypass failed receipt validation. Test-owned PostgreSQL or loopback processes must be disposable, bounded, and exactly owned.

## Holds

BWS-600, BWS-710, BWS-900, release, deployment, and live execution remain blocked or parked throughout this documentation and remediation route unless separately accepted by their own immutable decision authority.

## Historical private-paper route

The block below is retained for validator compatibility. It describes the route before remediation activation.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
parent_program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-600
safe_local_terminal_gate=BWS-599
selected_controller=run-paper-autopilot.sh
bws600_current_task=BWS-600
bws600_selected_controller=run-paper-autopilot.sh
bws600_launch_status=BLOCKED_CROSS_REPO_API_HANDOFF_NOT_ACCEPTED
```

BWS-600 remains an external evidence hold, not the currently selected implementation task. BWS-900 remains separately parked execution.
