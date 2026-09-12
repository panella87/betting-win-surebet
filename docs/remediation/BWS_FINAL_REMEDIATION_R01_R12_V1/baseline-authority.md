
# Baseline authority

## Exact source baseline

```text
archive=betting-win-surebet122.zip
sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd
regular_files=771
architecture_full_member_digest_sha256=4edf784ab0211d73f362b814dae9145523e98aa79471f5011134f20daee83f02
independent_inventory_digest_sha256=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
```

The archive SHA-256 and the exact member inventory are the initial source authority. The independent inventory digest uses a documented path/mode/content-hash/size record composition; it is additive evidence and does not reinterpret the architecture digest.

## Git fields unavailable from the archive

`git_head`, `git_branch`, `git_upstream`, and `git_dirty_state` are `TO_CAPTURE_AT_ACTIVATION`. The ZIP cannot prove those mutable checkout properties.

## Source-manifest restriction

```text
SOURCE_MANIFEST_authoritative=no
expected_non_self_entries=770
manifest_entries=617
missing_entries=153
extra_entries=0
mismatched_entries=8
formal_finding=BWS121-R11-001
owner=BWS-W4-T40
```

`SOURCE_MANIFEST.json` must not be edited, regenerated, or weakened by this documentation task. The new documentation files are additional expected manifest drift owned by T40. Until T40 is accepted, acceptance binds the BWS122 archive and independent inventories, not the stale repository manifest.

## Protected mutable authority

The exact protected preimages are in `baseline/protected-authority-preimages.json`. Current task, queue, controller, hold, release, deployment, and latest accepted campaign authority remain byte- and mode-identical to BWS122.
