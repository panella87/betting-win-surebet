# Baseline authority

## Frozen application-source baseline

```text
archive=betting-win-surebet122.zip
sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd
regular_files=771
architecture_full_member_digest_sha256=4edf784ab0211d73f362b814dae9145523e98aa79471f5011134f20daee83f02
independent_inventory_digest_sha256=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
```

BWS122 remains the frozen finding, dependency, and application-source baseline. The archive SHA-256 and exact member inventory are initial authority; they do not prove the mutable checkout at launch.

## Current documentation-aligned repository snapshot

```text
archive=betting-win-surebet125.zip
sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f
regular_files=995
accepted_remediation_source_result=none
```

BWS125 contains the remediation documentation package, activation authority, and documentation-alignment postimage. It contains no accepted tranche implementation receipt.

## Git fields unavailable from ZIP archives

`git_head`, `git_branch`, `git_upstream`, and `git_dirty_state` remain `TO_CAPTURE_AT_FIRST_LAUNCH`. Neither BWS122 nor BWS125 can prove those mutable checkout properties.

## Source-manifest restriction

Frozen BWS122 finding state:

```text
expected_non_self_entries=770
manifest_entries=617
missing_entries=153
extra_entries=0
mismatched_entries=8
formal_finding=BWS121-R11-001
owner=BWS-W4-T40
```

Current BWS125 drift:

```text
expected_non_self_entries=994
manifest_entries=617
missing_entries=377
extra_entries=0
mismatched_entries=47
preimage_mismatched_entries=38
```

`SOURCE_MANIFEST.json` must not be edited, regenerated, or weakened before admitted T40. Until T40 is accepted, current-source proof binds the frozen baseline, the exact current archive/check-out preimage, and independently captured hashes rather than the stale manifest.

## Protected mutable authority

`baseline/protected-authority-preimages.json` records BWS122 historical preimages. The later validated activation overlay changed only its declared authority documents and pins those active bytes in `activation/immutable-authority.sha256`; the baseline record must not be mistaken for current byte equality.
