# 030 - Upstream compatibility and pin contract

```text
current_managed_runtime_transport=api_only
operator_selectable_runtime_mode=no
export_runtime_fallback=prohibited
data_plane_lock=config/betting-win.upstream.lock.json
future_execution_sdk_lock=separate_required_before_bws900
```

## Development checkout

The autonomous run receives `BETTING_WIN_REPO_PATH` pointing to the existing betting-win Git checkout. It resolves the canonical path and verifies the Git toplevel, current 40-character commit, Git tree, deterministic tracked-tree listing fingerprint, package versions, and required capabilities from committed `HEAD`.

All source evidence is read through Git objects, including `git show HEAD:package.json`, committed workspace package manifests, and `git show HEAD:packages/provider-collection/src/index.ts`. Uncommitted working-tree modifications, untracked automation files, and runtime locks are outside the pin. BWS must not clone, create a temporary worktree, clean, reset, commit, start, stop, or otherwise modify the betting-win checkout or service.

## Data-plane runtime lock

BWS generates `config/betting-win.upstream.lock.json` conforming to `schemas/betting-win-upstream-lock.v1.schema.json` from the existing checkout's committed `HEAD`.

Required evidence includes repository/path, `sourceView=committed_git_head`, 40-character commit SHA, Git tree SHA, root/package versions, SHA-256 of the exact `git ls-tree -r --full-tree HEAD` byte stream, fingerprint algorithm, contract schema/alias/profile, capabilities, and verification timestamp. Placeholders and unknown values are rejected. Generation fails if committed `HEAD` changes during verification.

This lock proves source compatibility. It does not prove that a running API exposes the required BWS wire contract or that provider-to-PostgreSQL-to-API runtime acceptance has passed.

## Compatibility input contracts

### workspace

Development-only read-only compatibility generation and testing. It must not create an unresolved production `file:../betting-win` dependency.

### export

Historical deterministic compatibility input. It requires immutable paths, SHA-256, `betting-win.strategy-export.v1`, profile `surebet_standard_binary_v0`, provider generations, and lineage. Export is not a BWS-600 runtime transport.

### api

The current managed runtime contract. It requires an explicit operator-approved read-only base URL, accepted contract/version negotiation, compatible routes and response envelope, bounded pagination/timeout/retry/backoff, committed-HEAD provenance, and retained real provider-to-PostgreSQL-to-API parity. The local BWS API cannot satisfy the upstream betting-win contract.

The inspected betting-win source currently exposes `/dashboard/*` from its operator server, while BWS expects `/contract` and `/query/*` with a different envelope. The lock must not hide this cross-repository wire incompatibility.

## Future SDK artifact lock

A future BWS-900 dependency on `@betting-win/execution-sdk` requires a separate immutable lock. At minimum it records:

```text
package_name
semantic_version
npm_pack_sha256
package_export_map_sha256
node_engine
consumer_install_proof
provider_capability_set
real_write_authorization_state
source_commit_or_release_reference
```

The SDK lock must not reuse or replace the data-plane upstream lock.

## No fallback

A selected compatibility input or fixed API runtime fails when misconfigured or incompatible. No fallback is allowed from API to export, export to fixture, workspace to local mock, dashboard endpoint to inferred query contract, or SDK method to a BWS-local provider adapter.
