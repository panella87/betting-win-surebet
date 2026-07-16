# 043 - Upgrade, rollback and disaster-recovery implementation blueprint

```text
parent_task=BWS-591
cohesive_tranche=release_and_recovery
status=VALIDATED
```

## Goal

Implement an exact-version, evidence-driven upgrade and recovery state machine on top of the validated release package and database lifecycle. The implementation must prove safe decisions rather than promising automatic rollback.

The largest safe cohesive tranche includes deterministic upgrade planning, backup and drain gates, target verification, migration application, readiness classification, rollback eligibility, interrupted-upgrade recovery and disposable restore proof.

## Required contracts

Define machine-readable, schema-validated records for:

```text
bws.upgrade_plan.v1
bws.upgrade_checkpoint.v1
bws.upgrade_result.v1
bws.rollback_decision.v1
bws.recovery_result.v1
```

Every record must bind:

- current and target release semantic fingerprints;
- exact upstream lock;
- source and build checksums;
- current and target migration inventories;
- backup manifest and restore-verification evidence;
- exact lifecycle owner identity and runtime id;
- plan fingerprint, checkpoint sequence and terminal decision;
- evidence file paths and SHA-256 values.

## Planning and preflight

A plan command is read-only. It must verify:

- current and target release directories and manifests;
- target install verification;
- disk capacity and writable operator-selected paths;
- exact process ownership or a confirmed stopped state;
- fresh backup and disposable restore-verification evidence;
- migration forward and rollback compatibility;
- no provider/execution enablement or configuration fallback.

A plan must be deterministic for the same inputs and must not stop services or apply migrations.

## Apply flow

An apply command requires an exact plan fingerprint and explicit operator intent. It must:

1. verify the plan and all referenced evidence again;
2. stop new scheduling and drain only the exact repo-owned stack;
3. create or verify the pre-upgrade backup gate;
4. checkpoint the current release identity and lifecycle state;
5. verify and stage the target release without replacing source in place;
6. apply only compatible BWS-owned migrations;
7. start the target release and perform bounded health/readiness checks;
8. publish terminal evidence or stop at the exact failed checkpoint.

No automatic source reset, database drop, in-place destructive overwrite or silent retry is allowed.

## Rollback decision

Rollback is a decision, not a default action. It is allowed only when:

- the exact previous release remains verified;
- migration compatibility proves the previous code can read the current schema;
- retained backup/restore evidence is valid;
- exact lifecycle ownership is unambiguous;
- the rollback target preserves the closed provider/execution boundary.

When rollback is unsafe, the system remains stopped and writes a recovery-required result naming the missing evidence.

## Interrupted-upgrade recovery

The state machine must resume from retained checkpoints after interruption. It must classify at least:

```text
planned_not_started
drained_before_backup
backup_verified
target_staged
migrations_started
migrations_completed
target_started
readiness_failed
rollback_allowed
rollback_blocked
recovery_complete
```

Restarting the command with the same plan must be idempotent. A different plan or release identity must be rejected while unresolved checkpoints exist.

## Disposable proof

Autonomous validation uses temporary release directories and a uniquely named disposable PostgreSQL database. It must cover:

- successful forward upgrade;
- failed target readiness with safe rollback;
- migration failure before and after schema change;
- rollback blocked by incompatible migration;
- interrupted apply at every durable checkpoint;
- stale lifecycle state and PID reuse defense;
- restore from the last verified backup into a disposable database;
- complete cleanup of only test-owned processes, directories and databases.

## Evidence and acceptance

`BWS-591` becomes validated only when the upgrade, rollback decision and recovery evidence are all immutable, checksum-addressed and indexed. Passing the happy path alone is insufficient.

## Unchanged areas

Do not reset Git, replace an active source checkout, mutate betting-win, restore over a persistent project database, kill by process name or touch unrelated services and sessions.
