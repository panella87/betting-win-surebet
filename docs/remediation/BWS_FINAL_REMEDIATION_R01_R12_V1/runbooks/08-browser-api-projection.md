
# Browser/API projection proof

## Scope

T19-T20 browser/API projection proof.

## Prerequisites

- isolated read-only API/browser proof target
- known snapshot/source generation
- no external provider fallback

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Capture exact API origin, schema version, snapshot/cursor identity, and source generation.
2. Use bounded read-only requests through the production API entrypoint.
3. Verify typed success/error responses, cursor binding, continuation, empty/partial/failure distinction, and cancellation.
4. Verify browser model/validator/rendering consumes the same wire contract.
5. Record response bodies by digest and sanitized excerpts only.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  origin="${BWS_PROOF_API_ORIGIN:?BWS_PROOF_API_ORIGIN is required}"
  case "$origin" in http://127.0.0.1:*|http://localhost:*) ;; *) printf 'ERROR: proof origin must be isolated loopback
' >&2; false ;; esac
  timeout 120s curl --fail-with-body --silent --show-error --connect-timeout 5 --max-time 30 "$origin/health" | timeout 120s sha256sum
)
```


## External/managed action boundary

Starting the API/browser target is a separately authorized disposable proof action; this runbook does not start it.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
