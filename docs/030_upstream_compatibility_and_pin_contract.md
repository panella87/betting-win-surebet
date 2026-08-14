# 030 - Upstream compatibility and pin contract

```text
current_managed_runtime_transport=api_only
operator_selectable_runtime_mode=no
export_runtime_fallback=prohibited
```

## Development checkout

The autonomous run receives `BETTING_WIN_REPO_PATH` pointing to the existing betting-win Git checkout. It resolves the canonical path and verifies the Git toplevel, current 40-character commit, Git tree, deterministic tracked-tree listing fingerprint, package versions, and required capabilities from committed `HEAD`.

All source evidence is read through Git objects, including `git show HEAD:package.json`, committed workspace package manifests, and `git show HEAD:packages/provider-collection/src/index.ts`. Uncommitted working-tree modifications, untracked automation files, and runtime locks are outside the pin. BWS must not clone, create a temporary worktree, clean, reset, commit, or otherwise modify the betting-win checkout.

## Runtime lock

BWS generates `config/betting-win.upstream.lock.json` conforming to `schemas/betting-win-upstream-lock.v1.schema.json` from the existing checkout's committed `HEAD`.

Required evidence includes repository and path, `sourceView=committed_git_head`, 40-character commit SHA, 40-character Git tree SHA, root and package versions, SHA-256 of the exact `git ls-tree -r --full-tree HEAD` byte stream, fingerprint algorithm identifier, contract schema, alias and profile, capabilities, and verification timestamp. Placeholders and unknown values are rejected. Generation fails if committed `HEAD` changes during verification.

## Compatibility input contracts

These contracts describe retained development, parser, fixture, backtest, and migration compatibility. They are not parallel operator-selectable managed runtime modes.

### workspace

Development-only read-only compatibility generation and testing. It must not create an unresolved production `file:../betting-win` dependency.

### export

Historical deterministic compatibility input. It requires an immutable path, expected SHA-256, `betting-win.strategy-export.v1`, profile `surebet_standard_binary_v0`, accepted export kind and profile, provider generations, and lineage. Export is not a BWS-600 runtime transport.

### api

The current managed runtime contract. It requires an explicit operator-approved read-only base URL, contract and version negotiation, bounded pagination, timeout, retry and backoff, and provenance. BWS must not accept provider URLs or provider credentials. The local BWS API cannot satisfy the upstream betting-win contract.

## No fallback

A selected compatibility input or the fixed API runtime fails when misconfigured or incompatible. It must not fall back from API to export, export to fixture, or workspace to local mock. Managed runtime is API-only and exposes no upstream mode selector.
