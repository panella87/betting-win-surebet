
# External-upstream hold verification

## Scope

T29/T36 and BWS-600/BWS-710 hold verification.

## Prerequisites

- independently supplied accepted read-only handoff/evidence package
- no direct betting-win checkout/source/service/database/documentation access
- exact external authority decision

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Verify the supplied handoff package offline by exact digest, schema, source generation, provider lineage, and acceptance owner.
2. Require real provider-to-PostgreSQL-to-API parity for BWS-600.
3. Require accepted runtime `betting-win.b1_multi_venue_markets.v1` for BWS-710.
4. Reject fixture, mock, local export, placeholder, synthesized schedule, local API, declaration, example, or caller assertion.
5. If evidence is unavailable, emit external-pending and hold-retention receipts without promotion.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  handoff="${BWS_ACCEPTED_HANDOFF_FILE:?BWS_ACCEPTED_HANDOFF_FILE is required}"
  expected="${BWS_ACCEPTED_HANDOFF_SHA256:?BWS_ACCEPTED_HANDOFF_SHA256 is required}"
  test -f "$handoff" && test ! -L "$handoff"
  observed="$(timeout 120s sha256sum "$handoff" | awk '{print $1}')"
  test "$observed" = "$expected"
  printf 'ACCEPTED_HANDOFF_BYTES_MATCH
'
)
```


## External/managed action boundary

This runbook validates a separately supplied accepted handoff offline. It does not contact or inspect a betting-win checkout or runtime.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
