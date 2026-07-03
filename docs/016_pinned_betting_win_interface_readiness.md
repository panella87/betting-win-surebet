# 016 — Pinned betting-win interface readiness checklist

This document is the next handoff gate after SURE-001 and the safe SURE-002A local backlog.

## Current state

```text
SURE-001 hardening = complete
SURE-002A local fixture engine = complete
real upstream evaluation = blocked
provider connections = prohibited
execution = prohibited
profitability claims = prohibited
```

The repo can parse local fixture export bundles, assemble standard-binary complete sets, build terminal scenario cash flows, solve local fixture stake vectors, simulate local completion/residual exposure, consume local settlement replay records, and write private fixture-only reports under `artifacts/`.

This is not real upstream readiness. It is only local deterministic machinery.

## Required pinned interface from betting-win

Federico must provide a pinned `betting-win` contract/export interface before any real upstream evaluation. The handoff must include all of the following:

1. Contract or export package/version identifier.
2. Source manifest hash.
3. Export bundle schema version.
4. Canonical event and market identity records.
5. Provider generation identifiers for every market leg.
6. Rule profile, result-source, finality-policy, and finality-authority fields.
7. Quote/depth/capacity records with observation timestamps, evidence identifiers, quote source manifest hashes, fees, costs, min stake, available size, and currency.
8. Settlement replay records with accepted finality status and replay manifest hash.
9. Statement that the bundle is read-only and produced by `betting-win`, not by `betting-win-surebet`.
10. Explicit confirmation that the bundle contains no credentials, provider private API data, wallet material, or execution instructions.

## Accepted local input shape

The current local fixture reader accepts repo-local JSON files only. It refuses remote URLs and paths outside the repo. A real handoff should be copied into a repo-local fixture or export path deliberately selected by Federico.

The envelope must match:

```text
schema=betting-win.export-bundle.v1
reference.source=betting-win
reference.contractVersion=<non-empty pinned version>
reference.manifestHash=<64 hex characters>
bundleKind=resource_export or read_only_query_export
exportedAt=<ISO UTC timestamp with milliseconds>
records=[...]
```

## What remains prohibited

Even after the pinned interface is provided, this repo must not add provider clients, provider URLs, wallets, signers, order paths, transaction paths, direct `betting-win` database access, `core.*` migrations, public signals, or live/profitability claims.

## Operator smoke after pinned interface

After Federico provides a pinned local export bundle, the first safe smoke remains local and private:

```bash
node cli.js local-report --bundle <repo-local-betting-win-export.json> --output artifacts/local-paper-reports/pinned-interface-smoke.report.json --pinned-intake
```

The report must remain `accepted=false` and `status=fixture_results_only` until later docs explicitly authorize a real evaluation acceptance standard.
