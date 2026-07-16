# 033 - Continuous private-paper runtime foundation

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
validated_foundation_gate=BWS-580
active_remaining_program=docs/034_remaining_operator_runtime_implementation_program.md
safe_local_terminal_gate=BWS-599
continuous_runtime_evidence_gate=BWS-600
execution_gate=BWS-900
```

## Validated foundation

`BWS-520` through `BWS-580` are validated. They added:

- executable loopback-only API and bounded worker entrypoints;
- explicit immutable-export and typed read-only API convergence passes;
- persisted convergence and scheduler checkpoints;
- deterministic private-paper jobs and bounded worker processing;
- an API-only lifecycle owner with exact process identity;
- persisted runtime/API/cockpit visibility;
- integrated loopback acceptance and machine-readable runtime handoff packaging.

These results remain binding and must not regress.

## Why BWS-580 is not the final local gate

The validated components are still assembled as bounded passes and component-level acceptance. Current source inspection shows:

```text
convergence service loop=missing
scheduler service loop=missing
worker service loop=missing
managed full-stack lifecycle=missing
managed cockpit server=missing
root lifecycle wrappers=missing
service-owned paper evaluation=missing
paper autopilot lifecycle integration=missing
database backup/restore/retention=missing
release/upgrade/recovery/soak acceptance=missing
```

The safe local terminal gate therefore moves to `BWS-599`. The active program is `docs/034_remaining_operator_runtime_implementation_program.md`.

## Carry-forward requirements

All remaining tasks must preserve:

- exact committed-HEAD upstream lock;
- explicit export or API mode with no fallback;
- fixed-point calculations;
- `surebet.*` ownership only;
- deterministic job, checkpoint and evidence identities;
- private-only strategy evidence;
- loopback-only BWS listeners;
- provider connections and execution disabled;
- no public signals or profitability claims;
- exact process ownership and no name-based killing;
- parent-only Telegram for autopilots;
- post-lock artifact refresh and atomic child results.

## Protected automation sequencing

Product service work `BWS-581` through `BWS-586` should prefer unprotected package and CLI surfaces. `BWS-587` through `BWS-589` intentionally integrate the exact protected subset declared in the current task and `docs/036_root_wrappers_and_paper_automation_integration.md`.

`AUTOMATION_ALLOW_PROTECTED_CHANGES=1` does not authorize arbitrary protected changes. The implementation controller must enforce the task-file exact allowlist.

## External gate

`BWS-600` remains blocked until `BWS-599` is validated and the operator supplies accepted read-only betting-win runtime input plus private configuration and retained evidence.
