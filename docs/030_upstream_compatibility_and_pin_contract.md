# 030 - Upstream compatibility and pin contract

## Development checkout

The autonomous run receives `BETTING_WIN_REPO_PATH`. It resolves a real canonical path, verifies `package.json`, Git identity, current commit, clean tracked worktree, Git tree, deterministic tracked-tree listing fingerprint, package versions, and required capabilities. It must not modify the checkout.

## Runtime lock

BWS generates `config/betting-win.upstream.lock.json` conforming to `schemas/betting-win-upstream-lock.v1.schema.json` from the actual checkout.

Required evidence includes repository/path, 40-character commit SHA, 40-character Git tree SHA, clean worktree, root/package versions, SHA-256 of the exact `git ls-tree -r --full-tree HEAD` byte stream, fingerprint algorithm identifier, contract schema/alias/profile, capabilities, and verification timestamp. Placeholders and unknown values are rejected.

## Mode contracts

### workspace

Development-only read-only compatibility generation/testing. It must not create an unresolved production `file:../betting-win` dependency.

### export

Requires immutable path, expected SHA-256, `betting-win.strategy-export.v1`, profile `surebet_standard_binary_v0`, accepted export kind/profile, provider generations, and lineage.

### api

Requires explicit read-only base URL, contract/version negotiation, bounded pagination, timeout, retry/backoff, and provenance. BWS must not accept provider URLs or provider credentials.

## No fallback

A selected mode fails when misconfigured or incompatible. It must not fall back from API to export, export to fixture, or workspace to local mock.
