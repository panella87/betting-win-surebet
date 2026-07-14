# 030 - Upstream compatibility and pin contract

## Development checkout

The autonomous run receives `BETTING_WIN_REPO_PATH` pointing to the existing betting-win Git checkout. It resolves the canonical path and verifies the Git toplevel, current 40-character commit, Git tree, deterministic tracked-tree listing fingerprint, package versions, and required capabilities from committed `HEAD`.

All source evidence is read through Git objects, including `git show HEAD:package.json`, committed workspace package manifests, and `git show HEAD:packages/provider-collection/src/index.ts`. Uncommitted working-tree modifications, untracked automation files, and runtime locks are outside the pin. BWS must not clone, create a temporary worktree, clean, reset, commit, or otherwise modify the betting-win checkout.

## Runtime lock

BWS generates `config/betting-win.upstream.lock.json` conforming to `schemas/betting-win-upstream-lock.v1.schema.json` from the existing checkout's committed `HEAD`.

Required evidence includes repository/path, `sourceView=committed_git_head`, 40-character commit SHA, 40-character Git tree SHA, root/package versions, SHA-256 of the exact `git ls-tree -r --full-tree HEAD` byte stream, fingerprint algorithm identifier, contract schema/alias/profile, capabilities, and verification timestamp. Placeholders and unknown values are rejected. Generation fails if committed `HEAD` changes during verification.

## Mode contracts

### workspace

Development-only read-only compatibility generation/testing. It must not create an unresolved production `file:../betting-win` dependency.

### export

Requires immutable path, expected SHA-256, `betting-win.strategy-export.v1`, profile `surebet_standard_binary_v0`, accepted export kind/profile, provider generations, and lineage.

### api

Requires explicit read-only base URL, contract/version negotiation, bounded pagination, timeout, retry/backoff, and provenance. BWS must not accept provider URLs or provider credentials.

## No fallback

A selected mode fails when misconfigured or incompatible. It must not fall back from API to export, export to fixture, or workspace to local mock.
