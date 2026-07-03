# 001 — Scope and boundaries

`betting-win-surebet` is a downstream paper-only research repository. It consumes stable
contracts and evidence exports from `betting-win`; it does not collect provider data and
it does not become the shared provider platform.

## In scope for SURE-001

- Repository skeleton.
- Agent authority.
- Documentation and ADRs.
- Type-only contracts and deliberately blocked stubs.
- Boundary validators that fail closed.
- Fixture folders for future pinned `betting-win` exports.

## Out of scope for SURE-001

- Provider connections.
- Direct database access to `betting-win`.
- Real implementation of opportunity solving.
- Real implementation of stake-vector solving.
- Real implementation of leg completion or residual exposure simulation.
- Any live or real-money path.

## Current status

```text
SURE-001 = complete
SURE-002A local fixture engine = complete
solver = local_fixture_only_implemented
completion_simulation = local_fixture_only_implemented
residual_exposure = local_fixture_only_implemented
settlement_replay_consumption = local_fixture_only_implemented
private_reporting = local_fixture_only_implemented
provider connection = prohibited
real-money path = prohibited
real upstream evaluation = blocked pending Federico's pinned betting-win interface
```

The SURE-002A local implementation is deterministic and fixture-only. It is not evidence that any real provider market is exploitable, executable, or ready for live use.
