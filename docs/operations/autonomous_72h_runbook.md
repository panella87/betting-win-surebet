# Autonomous 72-hour implementation runbook

## Scope

This runbook applies only to the post-S2 portion of the active remediation campaign or to a separately reviewed standalone source task. It is not valid for remediation campaign orders 1 through 13.

```text
active_program=BWS_FINAL_REMEDIATION_R01_R12_V1
pre_s2_mode=direct_bounded_codex_only
post_s2_mode=repaired_implementation_controller
post_s2_attempt_ceiling=72h
global_campaign_window=28d
canonical_node=v20.20.2
```

## Preconditions

1. The active activation validator reports the complete S2 gate accepted.
2. One exact tranche is admitted and all dependencies are accepted.
3. The immutable task file and exact protected-file allowlist validate.
4. The working repository is the intended server checkout.
5. Exact Node `v20.20.2` is active in the parent shell.
6. No conflicting live controller lock exists.
7. Required disposable environments and disk/inode capacity are available.

The active campaign launcher owns these checks. Do not manually invoke the implementation controller to skip them.

## Attempt contract

The launcher invokes one exact task with:

```text
--duration <=72h
--prompt-file <immutable admitted task>
--model cli-default
--fallback-model none
--cycle-timeout 2h
--validation-timeout 20m
--max-cycles 200
```

A successful attempt must produce the exact tranche result receipt. Exit code 3 may continue only the same admitted tranche. Any other nonzero result stops the campaign. The next tranche is never selected from elapsed time or prose.

## Safety

Do not use `exec`, `exit`, `logout`, shell replacement, broad process killing, manual lock deletion, Git reset/clean/stash/branch switching, deployment, migration of a non-disposable database, provider access, or live execution. Controller commands must return to the current shell.

## Evidence

Return current source and retained artifacts separately. A self-reported success without exact postimage, test, environment, and acceptance receipts is not completion.

## Carry-forward implementation and source-fix runbook

The pre-remediation route below is retained for repository validators and historical interpretation only.

```text
program=BWS_B1_CROSS_VENUE_OFFLINE_FALSIFICATION_V1
selected_controller=run-paper-autopilot.sh
current_task=BWS-600
active_implementation_queue=none
```
