# 046 - Final local acceptance implementation blueprint

> **Completed historical implementation blueprint.** `BWS-599` is validated. This file remains acceptance and recovery history, not current controller routing. Current authority is `docs/automation/current-implementation-task.md`; the selected route is `run-paper-autopilot.sh` for the externally gated API-only BWS-600 campaign.

```text
parent_task=BWS-599
cohesive_tranche=final_acceptance
status=VALIDATED
routing_status=HISTORICAL_COMPLETED_BLUEPRINT
safe_local_terminal_gate=BWS-599
current_runtime_upstream_mode=api_only
```

## Historical goal

The completed task proved the complete private BWS application from a clean release extraction as one integrated, closed-execution acceptance suite. `BWS-599` was not a documentation-only or unit-test gate.

## Clean-room boundary

The acceptance runner created explicit temporary paths for:

```text
release extraction
private environment file with synthetic test values
disposable PostgreSQL database
runtime state
structured logs
evidence index
backup and restore output
upgrade target and rollback release
soak campaign state
final artifacts
```

It could use the existing betting-win checkout only through the validated committed-HEAD lock boundary and could not clone or modify that checkout.

## Acceptance stages

### Stage 1: release and install

- verify release archive, manifest, checksums, and executable modes;
- verify Node 20 and PostgreSQL compatibility;
- verify private configuration presence and closed policy;
- create and migrate only the disposable `surebet.*` database;
- prove the release did not depend on the original source checkout.

### Stage 2: runtime and automation

- start the full product-owned stack on unique loopback ports;
- verify exact lifecycle ownership, status, progress, logs, and diagnostics;
- historically run explicit export and loopback API convergence compatibility cases separately;
- verify the accepted API-only managed runtime, scheduler, worker, API, cockpit, health, readiness, and metrics;
- run standalone paper evaluation in runtime-evidence mode;
- run a bounded paper-autopilot source-defect, implementation-handoff, and re-evaluation flow using atomic child results;
- preserve parent-only Telegram behavior through dry-run notification capture.

The historical export convergence case proved deterministic non-runtime compatibility. It did not authorize an export runtime selector and cannot validate `BWS-600`.

### Stage 3: data lifecycle and recovery

- create and verify a BWS-only backup;
- restore into another disposable database and prove invariants;
- execute upgrade planning and a successful target upgrade;
- exercise failed readiness and migration interruption;
- verify safe rollback decisions and blocked unsafe rollback;
- resume an interrupted upgrade from exact checkpoints.

### Stage 4: soak and external handoff

- consume accepted `BWS-592` multi-hour soak evidence and rerun bounded representative faults in the clean room;
- verify all test-owned processes, leases, databases, and temporary files were cleaned up;
- historically run `BWS-593` preflight with deterministic export and loopback API compatibility inputs;
- generate the final `bws.external_runtime_campaign.v1` handoff without starting `BWS-600`;
- publish one immutable final acceptance manifest referencing every stage and SHA-256.

The current BWS-600 handoff must select API and reject export, fixture, mock, local-BWS API, and synthesized schedule evidence.

## Final acceptance manifest

The final manifest binds:

```text
release, source and upstream-lock fingerprints
migration and database proof
runtime lifecycle and process identities
API, cockpit, health, readiness and metrics evidence
paper evaluation and paper-autopilot evidence
backup, restore, upgrade and recovery evidence
soak and failure-injection evidence
external campaign-manifest fingerprint
cleanup result
provider/execution closed result
complete artifact archive SHA-256
```

Missing, stale, or mismatched evidence blocks validation. No evidence may be inferred from stdout alone.

## Validation and ledger transition

The runner completed focused stage tests, the clean-room integrated suite, and `npm run validate`. Only then did `BWS-599` become `VALIDATED` and the local implementation controller report `AUTONOMOUS_GOAL_COMPLETE=yes`.

`BWS-600` remains separately blocked on operator-approved read-only API input and retained runtime evidence. `BWS-900` remains parked.

## Unchanged areas

Do not mutate active project databases, active operator services, betting-win source, provider accounts, or execution state. All acceptance-owned resources must be uniquely identified and cleaned up by the suite that created them.
