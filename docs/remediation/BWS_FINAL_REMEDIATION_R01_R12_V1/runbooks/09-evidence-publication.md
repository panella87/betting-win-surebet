
# Evidence-publication proof

## Scope

T26-T29 and every tranche publishing immutable evidence.

## Prerequisites

- accepted producer generation
- content-addressed destination contract
- redaction policy

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Recompute content hashes before publication.
2. Validate complete reference graph, producer lineage, schema/media type, and redaction.
3. Use create-or-compare and serialized currentness updates.
4. Prove interrupted publication cannot expose a partial current generation.
5. Retain predecessor/reference identities and publish a receipt.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  evidence="${BWS_EVIDENCE_FILE:?BWS_EVIDENCE_FILE is required}"
  test -f "$evidence" && test ! -L "$evidence"
  timeout 120s sha256sum "$evidence"
  timeout 120s stat -c 'mode=%a size=%s path=%n' "$evidence"
)
```


## External/managed action boundary

This diagnostic does not publish, rotate, delete, or mutate evidence.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
