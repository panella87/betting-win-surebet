
# BWS-W3-T33 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T33
CAMPAIGN_ORDER: 27
STAGE: S3
PRIMARY_OWNER: R09
SECONDARY_REVIEWERS: R03, R06, R07, R10, R11, R24
ISSUE_IDS: BWS120-R09-001, BWS120-R09-002, BWS120-R09-003, BWS120-R09-004
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T27, T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/release-packaging.ts, packages/bootstrap/src/operations/release-upgrade.ts, tests/bws-release-packaging.test.ts, tests/bws-release-upgrade.test.ts
SYMBOLS_TO_REVERIFY: 15 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/release-upgrade.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``exact manifest/path-set authority; atomic multi-artifact publication``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 20 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 20 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 5 classified records below
CONCURRENCY_OR_CRASH_TESTS: 2 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 20}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: incompatible/unknown runtime fails; published archive mandatory; no undeclared members; all release targets commit atomically with predecessor preservation
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": false, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W1-T13 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/release-packaging.ts` | present=yes | sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/release-upgrade.ts` | present=yes | sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-release-packaging.test.ts` | present=yes | sha256=3462fc7e28e82057b26cf805ee7b868e1863ca2cf6b24a1e45593c4ebc8abae2 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-release-upgrade.test.ts` | present=yes | sha256=87838040f891b46b10e329808c71e0f8c120ef3d3dfd29afa7283c6c371a7227 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R09-001 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyBwsReleaseInstallation / runBwsReleasePreflight | reviewed_line_range=606-760 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-001 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest | reviewed_line_range=260-277 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R09-001 | `tests/bws-release-packaging.test.ts` | symbol=extracted release verifies itself through the bundled CLI | reviewed_line_range=132-203 | reviewed_sha256=3462fc7e28e82057b26cf805ee7b868e1863ca2cf6b24a1e45593c4ebc8abae2
- BWS120-R09-002 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyBwsReleaseInstallation / verifyArchiveIfPresent | reviewed_line_range=606-671; 796-807 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-002 | `packages/bootstrap/src/operations/release-upgrade.ts` | symbol=verifyTargetInstallEvidence | reviewed_line_range=1341-1368 | reviewed_sha256=5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7
- BWS120-R09-002 | `tests/bws-release-upgrade.test.ts` | symbol=target install verification fixture | reviewed_line_range=413-427 | reviewed_sha256=87838040f891b46b10e329808c71e0f8c120ef3d3dfd29afa7283c6c371a7227
- BWS120-R09-002 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyArchiveIfPresent / verifyBwsReleaseInstallation | reviewed_line_range=606-671; 796-807 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-003 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyArchiveIfPresent | reviewed_line_range=817-858 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-003 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyManifestAgainstReleaseDirectory | reviewed_line_range=900-949 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-003 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyChecksumsFile | reviewed_line_range=964-996 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-003 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=buildReleaseManifestInventory | reviewed_line_range=1281-1302 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-003 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=verifyManifestAgainstReleaseDirectory / verifyChecksumsFile / verifyArchiveIfPresent | reviewed_line_range=817-858; 900-996; 1263-1302 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-004 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=createBwsReleasePackage | reviewed_line_range=534-588 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-004 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=commitOutputTarget | reviewed_line_range=1305-1331 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce
- BWS120-R09-004 | `packages/bootstrap/src/operations/release-packaging.ts` | symbol=createBwsReleasePackage / commitOutputTarget | reviewed_line_range=534-588; 1305-1331 | reviewed_sha256=d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R09-001 — Install verification records incompatible runtimes and an unperformed server check as a passed preflight

- Severity: `P1`
- Current behavior: The result can contain node.compatible=false, postgresql.clientCompatible=false, and serverCompatibilityCheck=not_performed_in_check_only_mode while verifiedChecks still contains non_mutating_preflight_passed.
- Expected behavior: Install verification must fail closed and must not emit a passed-preflight marker until every required runtime and server compatibility condition is positively established.
- Invariant: Install verification must fail closed and must not emit a passed-preflight marker until every required runtime and server compatibility condition is positively established.
- Root cause: Compatibility fields are descriptive rather than gate-authoritative, and downstream promotion trusts a marker rather than recomputing or checking the fields.
- Trigger: Run verify-install and then use the generated result as upgrade or external-runtime evidence.
- Minimal fix boundary: Make preflight return one explicit fail-closed verdict, reject incompatible Node and psql versions, require a bounded server-compatibility receipt before promotion, and make all consumers verify that verdict rather than a marker string.
- Regression risks:
- A check-only diagnostic mode may still be useful, but it must be a distinct non-promotable result schema/status.
- Server checks must remain read-only and bounded.

### BWS120-R09-002 — Install and upgrade verification permit release-directory evidence without the published archive

- Severity: `P1`
- Current behavior: Directory-only verification succeeds, and upgrade target verification ignores archiveCheck.verified and the archive verification marker.
- Expected behavior: Any evidence that authorizes install, upgrade, rollback, soak, or promotion must bind to and verify the exact published archive bytes.
- Invariant: Any evidence that authorizes install, upgrade, rollback, soak, or promotion must bind to and verify the exact published archive bytes.
- Root cause: Archive verification is implemented as an optional enhancement instead of the release authority for every install and upgrade transition.
- Trigger: Call verify-install without --archive, then create or apply an upgrade plan using that result.
- Minimal fix boundary: Require archivePath and its adjacent checksum for promotable install verification, bind the archive digest into the install result, and require exact archive verification in upgrade, external-preflight, and final-acceptance consumers.
- Regression risks:
- Preserve a clearly named directory-audit mode only if it cannot feed promotion.
- Existing historical verification files must be classified non-promotable.

### BWS120-R09-003 — Unmanifested non-forbidden files can pass checksum and archive verification

- Severity: `P1`
- Current behavior: All expected files can verify while an extra non-forbidden file remains accepted in the release and archive.
- Expected behavior: Manifest inventory, checksum inventory, extracted regular-file inventory, and archive inventory must be exact set-equal with no undeclared member.
- Invariant: Manifest inventory, checksum inventory, extracted regular-file inventory, and archive inventory must be exact set-equal with no undeclared member.
- Root cause: The verifier proves inclusion of expected files but not exclusion of every undeclared file.
- Trigger: Verify the extracted release and archive.
- Minimal fix boundary: Construct one normalized expected path map and require exact equality across manifest, SHA256SUMS, extracted directory, and archive before any verification result is emitted.
- Regression risks:
- Generated metadata such as release-manifest.json and SHA256SUMS must be explicitly included in the authoritative set definition.
- Do not weaken existing forbidden-path and symlink checks.

### BWS120-R09-004 — Release publication is a non-transactional sequence that can expose mixed generations or delete the previous release

- Severity: `P1`
- Current behavior: Directory, archive, checksum, and result can belong to different generations. allowOverwrite deletes each previous target before its replacement is guaranteed, and later evidence/result rewrites are outside the staged commit.
- Expected behavior: One release generation must become visible atomically, and a failed publication must preserve the complete prior generation or leave only an explicitly incomplete staging area.
- Invariant: One release generation must become visible atomically, and a failed publication must preserve the complete prior generation or leave only an explicitly incomplete staging area.
- Root cause: A multi-artifact release is published as independent filesystem targets rather than one immutable generation transaction.
- Trigger: Publish with allowOverwrite or inject failure between any two target commits or evidence rewrites.
- Minimal fix boundary: Publish into a new immutable generation directory, fsync and verify all members, then atomically update a single generation pointer/commit marker. Never delete the prior generation until the new generation is fully committed and retained.
- Regression risks:
- Evidence-index publication belongs to R07 and must participate through an explicit handoff rather than mutable post-commit rewrites.
- Cross-filesystem rename assumptions must be defined.


## Allowed edit boundary

- Candidate path set: `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/release-packaging.ts`, `packages/bootstrap/src/operations/release-upgrade.ts`, `tests/bws-release-packaging.test.ts`, `tests/bws-release-upgrade.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/release-upgrade.ts` | participating tranches=T31, T33, T34 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Execution, public signals, and live financial operations remain disabled and out of scope.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T27, T40.
- Review prerequisites: `exact manifest/path-set authority; atomic multi-artifact publication`.
- Exact BWS122 lineage or an explicitly accepted descendant source generation.
- Current protected authority, holds, runtime class, proof environments, rollback root, and exact test bindings.
- Exactly one admitted source-mutating tranche and no controller use before full S2 acceptance.

## Current-source reverification procedure

1. Capture activation-time Git HEAD/branch/upstream/dirty state and the exact source-generation identity.
2. Hash and mode-check every candidate path; compare finding-pinned symbols and reviewed behavior to current code.
3. Trace every caller and production entrypoint needed to establish the current behavior and unchanged boundary.
4. Classify each finding as reverified, moved, already resolved, contradicted, or blocked. Only reverified findings may proceed.
5. Reconcile any moved symbol, new path, dependency, owner, test, or environment need through explicit admission authority. Do not infer permission.
6. Capture a schema-valid current-source-reverification receipt before the first write.

## Implementation task breakdown

1. Freeze exact preimages, modes, shared-path predecessor postimages, and rollback material.
2. Resolve all contract/policy questions stated by the finding records; reject silent defaults.
3. Implement only the smallest coherent boundary that restores the stated invariants.
4. Add or update only explicitly admitted proof paths needed for mapped requirements.
5. Run every focused and production-entrypoint requirement in its mapped environment under exact runtime authority.
6. Run negative/adversarial and concurrency/crash proof where classified.
7. Verify unchanged authorities, non-admitted paths, holds, and source-generation lineage.
8. Emit postimage, test, environment, and tranche-result receipts; otherwise rollback or remain `BLOCKED`.

## Fail-closed and no-fallback requirements

- Missing, blank, null, unknown, malformed, stale, conflicting, wrong-generation, wrong-runtime, or unexecuted evidence is failure.
- No fixture, mock, local export, placeholder, declaration, status string, marker, synthesized schedule, caller assertion, or Node 22 result substitutes for required proof.
- No path, owner, dependency, environment, external authority, or hold decision is inferred.
- `SOURCE_COMPLETE_EXTERNAL_PENDING` is available only where the campaign map marks external acceptance pending and never promotes a hold.

## Focused tests

- `BWS120-R09-001-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=Node 19/21/22 negative verification
- `BWS120-R09-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=psql below minimum negative verification
- `BWS120-R09-001-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=missing PostgreSQL server receipt negative verification
- `BWS120-R09-001-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=external preflight rejects any false or unknown compatibility field
- `BWS120-R09-001-TEST-05` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=canonical Node 20.20.2 install verification
- `BWS120-R09-002-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=verify-install rejects missing archive for promotable mode
- `BWS120-R09-002-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=upgrade plan rejects archiveCheck.verified=false
- `BWS120-R09-002-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=archive file replaced after directory extraction
- `BWS120-R09-002-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=same directory from a different archive
- `BWS120-R09-002-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=rollback uses retained exact prior archive
- `BWS120-R09-003-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra JavaScript file included in checksums and archive
- `BWS120-R09-003-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra config file
- `BWS120-R09-003-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra executable mode file
- `BWS120-R09-003-TEST-04` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=missing checksum row for an otherwise manifest-declared file
- `BWS120-R09-003-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=duplicate/normalization-collision paths
- `BWS120-R09-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=failure after each rename
- `BWS120-R09-004-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=failure during each evidence registration/rewrite
- `BWS120-R09-004-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=allowOverwrite preserves prior complete release on failure
- `BWS120-R09-004-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=concurrent publishers for the same releaseId
- `BWS120-R09-004-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=reader observes only old or new complete generation

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R09-001-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=Node 19/21/22 negative verification
- `BWS120-R09-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=psql below minimum negative verification
- `BWS120-R09-001-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=missing PostgreSQL server receipt negative verification
- `BWS120-R09-001-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=external preflight rejects any false or unknown compatibility field
- `BWS120-R09-001-TEST-05` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=canonical Node 20.20.2 install verification
- `BWS120-R09-002-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=verify-install rejects missing archive for promotable mode
- `BWS120-R09-002-TEST-02` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=upgrade plan rejects archiveCheck.verified=false
- `BWS120-R09-002-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=archive file replaced after directory extraction
- `BWS120-R09-002-TEST-04` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=same directory from a different archive
- `BWS120-R09-002-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=rollback uses retained exact prior archive
- `BWS120-R09-003-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra JavaScript file included in checksums and archive
- `BWS120-R09-003-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra config file
- `BWS120-R09-003-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=extra executable mode file
- `BWS120-R09-003-TEST-04` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=missing checksum row for an otherwise manifest-declared file
- `BWS120-R09-003-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=duplicate/normalization-collision paths
- `BWS120-R09-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=failure after each rename
- `BWS120-R09-004-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=failure during each evidence registration/rewrite
- `BWS120-R09-004-TEST-03` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=allowOverwrite preserves prior complete release on failure
- `BWS120-R09-004-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=concurrent publishers for the same releaseId
- `BWS120-R09-004-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=reader observes only old or new complete generation

## Negative and adversarial tests

- `BWS120-R09-001-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=Node 19/21/22 negative verification
- `BWS120-R09-001-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=psql below minimum negative verification
- `BWS120-R09-001-TEST-03` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=missing PostgreSQL server receipt negative verification
- `BWS120-R09-001-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-001 | requirement=external preflight rejects any false or unknown compatibility field
- `BWS120-R09-003-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-003 | requirement=duplicate/normalization-collision paths

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R09-002-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-002 | requirement=rollback uses retained exact prior archive
- `BWS120-R09-004-TEST-04` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R09-004 | requirement=concurrent publishers for the same releaseId

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 20 requirements

Node-based proof must report `node --version` exactly `v20.20.2`. Non-Node proof must identify its language/runtime and cannot use Node 22 output as acceptance. Disposable/controlled environments must be identified, isolated, and cleaned; real services or production state are never implied.

## Rollback and recovery plan

- Stop additional transaction-owned writes without terminating unrelated processes.
- Restore replacements from exact preimage bytes and modes; remove only admitted additions.
- Remove only empty directories created by the transaction.
- Re-hash all restored and protected paths; preserve unrelated dirty worktree content.
- Record failed restoration as `ROLLBACK_RESTORE_FAILED` and leave the tranche `BLOCKED`.
- A partial or ambiguous postimage cannot be inherited by the next tranche.

## Receipt requirements

### Preimage

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- candidate paths with sha256, mode, size, and existence
- Git HEAD/upstream/dirty fields captured at activation or explicitly unavailable
- source-manifest stale-state classification

### Postimage

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- exact changed paths, actions, sha256, mode, and size
- preimage-to-postimage relation
- unchanged-path proof and rollback material identity

### Test

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- exact command, bounded timeout, exit status, stdout/stderr digests
- Node/runtime identity
- production-entrypoint flag and evidence path

### Environment

- program_id and tranche_id
- campaign_order and stage
- repository identity and exact source_generation
- created_at with declared clock authority
- owner and reviewer identity
- previous_receipt_sha256 and parent_receipt_sha256 where applicable
- unresolved blockers and retained holds
- proof lane and disposable/target identity
- generation IDs consumed
- result, evidence digests, cleanup result, and external-pending classification

## Acceptance

Acceptance authority: incompatible/unknown runtime fails; published archive mandatory; no undeclared members; all release targets commit atomically with predecessor preservation

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W1-T13` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
