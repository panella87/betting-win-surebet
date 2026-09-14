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

## Mutable current-source identity

```text
current_archive_or_checkout=TO_CAPTURE_IN_EXTERNAL_AUDIT_OR_ADMISSION_RECEIPT
repository_documentation_self_attests_current_archive=no
accepted_remediation_source_result=none_recorded_by_current_campaign_authority
```

A rolling numbered source ZIP is an input receipt, not persistent repository authority. Before any source edit, capture the exact archive or checkout identity, extracted-tree digest, Git HEAD, branch, upstream, dirty-state digest, path hashes, modes, and source-manifest observation. Missing or conflicting identity blocks admission.

## Git fields unavailable from ZIP archives

`git_head`, `git_branch`, `git_upstream`, and `git_dirty_state` remain `TO_CAPTURE_AT_FIRST_LAUNCH`. Neither the frozen BWS122 baseline nor repository documentation can prove mutable checkout properties.

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

Latest documented drift observation:

```text
audit_input=betting-win-surebet127.zip
audit_input_sha256=cc976c7efd5a97a262d1772001dda513775a2b282c0d8ec1055ebe97dd8dfdd4
expected_non_self_entries=994
manifest_entries=617
missing_entries=377
extra_entries=0
mismatched_entries=47
observation_authority=historical_only_recompute_at_admission
```

`SOURCE_MANIFEST.json` must not be edited, regenerated, or weakened before admitted T40. Until T40 is accepted, current-source proof binds the frozen baseline, the exact current archive/check-out preimage, and independently captured hashes rather than the stale manifest.

## Protected mutable authority

`baseline/protected-authority-preimages.json` records BWS122 historical preimages. The later validated activation overlay changed only its declared authority documents and pins those active bytes in `activation/immutable-authority.sha256`; the baseline record must not be mistaken for current byte equality.
