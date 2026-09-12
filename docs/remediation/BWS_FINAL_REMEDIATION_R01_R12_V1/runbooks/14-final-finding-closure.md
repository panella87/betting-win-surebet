
# Final finding-closure proof

## Scope

T43 and final campaign acceptance.

## Prerequisites

- terminal receipts for all 47 tranches
- complete 173-finding map
- all schema and generation contracts
- retained external holds

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Verify every finding maps once to one tranche and one terminal result.
2. Verify every internal closure has exact postimage, executed focused and production-entrypoint tests, required environment receipts, exact Node/runtime, and digest lineage.
3. Reject stale, missing, unexecuted, wrong-runtime, wrong-generation, or mutable-prose authority.
4. Preserve T29/T36 external pending as non-promotable where applicable.
5. Emit campaign result and separate hold decisions; do not infer release/deployment/execution.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  repo="${REPO_DIR:?REPO_DIR is required}"
  program="$repo/docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1"
  test -d "$program"
  timeout 120s python3 -c 'import json,pathlib,sys; p=pathlib.Path(sys.argv[1]); f=json.loads((p/"maps/finding-to-tranche.json").read_text()); d=json.loads((p/"maps/dependency-dag.json").read_text()); assert f["counts"]["findings"]==173 and f["counts"]["unmapped_findings"]==0 and f["counts"]["duplicate_finding_owners"]==0; assert len(d["nodes"])==47 and not d["dependency_cycles"] and d["T43_is_last"]; print("FINAL_CLOSURE_STATIC_INPUTS_VALIDATED_NOT_ACCEPTED")' "$program"
)
```


## External/managed action boundary

Static input validation is not final acceptance; T43 must consume actual terminal receipts and proof generations.

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
