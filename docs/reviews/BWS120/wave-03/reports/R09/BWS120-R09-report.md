# BWS120-R09 deep review: release packaging, upgrade, rollback, soak, and failure injection

## Executive verdict

```text
review_id=BWS120-R09
repository=betting-win-surebet
archive_sha256=d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb
regular_files=695
archive_path_and_type_safety=PASS
extraction_integrity=PASS
executable_compatibility_with_BWS118=PASS_EXACT_NON_DOCUMENTATION_BYTE_EQUIVALENCE
canonical_runtime=Node_20.20.2
actual_runtime=v22.16.0_SUPPLEMENTARY
confirmed_findings=21
P1=21
release_blocking=21
BWS-600_blocking=21
B1_blocking=21
deployment_blocking=21
inherited_findings_checked=85
duplicated_inherited_root_causes=0
overall_verdict=BLOCKED_SOURCE_CORRECTNESS_REMEDIATION_REQUIRED
```

BWS120 is structurally safe as a ZIP and contains exactly 695 regular files. Relative to BWS118, it adds 38 Wave 02 review documents and edits two documentation indexes. There are no executable-source, test, migration, schema, package, script, or configuration byte differences. The R09 conclusions therefore apply to the same executable lineage already reviewed by R01 through R06.

The release and promotion implementation is not fail-closed enough to authorize deployment or BWS-600 entry. The principal failures are: optional archive identity, permissive install compatibility, non-transactional publication, mutable upgrade plans and paths, no exclusive upgrade owner, classification-only recovery, generic fault simulation, structurally validated but semantically unproven soak evidence, and final acceptance built from caller assertions and mutable paths.

## Source authority and method

- Reviewed archive: `/mnt/data/betting-win-surebet120(3).zip`
- Actual SHA-256: `d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`
- Frozen expected BWS120 hash: not supplied. Identity classification is actual hash recorded plus exact non-documentation compatibility verification against BWS118.
- Comparison baseline: `/mnt/data/betting-win-surebet118(2).zip` (`50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`), 657 regular files.
- Handoff: `/mnt/data/betting-win-surebet-wave02-next-review-handoff-r01-r06-rebased-50bbcb0b-20260912(3).md` (`de53490aeba125d467b7e7561de87a3342f3a9ddf197785a0ddfd82b0c485d1c`).
- Canonical runtime: Node 20.20.2. Available runtime: Node 22.16.0, supplementary only.
- PostgreSQL execution: unavailable. No database was created or contacted.
- Review methods: archive inventory and byte comparison, static call/state tracing, inherited-ledger overlap analysis, bounded source models, bounded tar safety cases, repository validators, and focused tests under the noncanonical runtime.

## Current routing and inherited overlap

Current routing remains `BWS-600=BLOCKED_EXTERNAL_RUNTIME_EVIDENCE`, `BWS-710=BLOCKED_ACCEPTED_BETTING_WIN_B1_MULTI_VENUE_API_REQUIRED`, and `BWS-900=PARKED_NOT_AUTHORIZED`. Historical BWS-590/BWS-591/BWS-592/BWS-599 completion claims were treated as review inputs, not proof.

All 85 inherited R01 through R06 confirmed findings were checked for overlap. R09 preserves their identities and uses explicit dependencies where process ownership/readiness, database transactions, upstream transport, API projection, or evidence publication are upstream root causes. No inherited root cause was reissued under a new R09 ID.

## Architecture and complete state-machine model

### Intended release state machine

```text
SOURCE_BYTES_FROZEN
  -> STAGED_EXACT_CONTENT
  -> ARCHIVE_BUILT_AND_HASHED
  -> INSTALL_VERIFIED_EXACT_ARCHIVE
  -> PREFLIGHT_COMPATIBLE
  -> PUBLISHED_IMMUTABLE_GENERATION
  -> PROMOTABLE
Any missing/unknown/incompatible condition -> NON_PROMOTABLE
```

Reachable current deviations include directory-only verification, incompatible preflight marked passed, undeclared extra release files, and partial/mixed publication generations.

### Intended upgrade/rollback state machine

```text
PLAN_CREATED_AND_CONTENT_HASHED
  -> EXCLUSIVE_OWNER_ACQUIRED(epoch)
  -> PLAN_AND_ALL_INPUTS_REVALIDATED
  -> CURRENT_GENERATION_DRAINED
  -> BACKUP_AND_RESTORE_RECEIPT_VERIFIED
  -> TARGET_EXACT_ARCHIVE_STAGED
  -> MIGRATIONS_APPLIED_AND_VERIFIED
  -> TARGET_GENERATION_READY
  -> UPGRADE_COMMITTED
On failure: TARGET_FENCED_AND_STOPPED -> PRIOR_GENERATION_READY -> ROLLBACK_COMMITTED
Any ambiguity -> RECOVERY_REQUIRED, never success
```

Current deviations include self-authenticating plans, mutable path re-reads, concurrent owners, cross-plan resolved-state reuse, classification-only checkpoint replay, ignored lifecycle outcomes, and rollback overlap with partial targets.

### Intended soak and promotion state machine

```text
MANAGED_RUNNER_STARTED(monotonic_clock, exact generation)
  -> DIAGNOSTICS_OBSERVED
  -> TARGET_SPECIFIC_FAULT_PENDING
  -> FAULT_INJECTED(idempotency token)
  -> RECOVERY_MEASURED
  -> OBSERVATION_THRESHOLDS_SATISFIED
  -> OWNED_RESOURCES_ENUMERATED_ZERO
  -> CUMULATIVE_RESULT_RECONSTRUCTED
  -> VALIDATION_OK
  -> EXTERNAL_PREFLIGHT_BINDS_RESULT_AND_VALIDATION
  -> FINAL_ARCHIVE_AND_COMPONENT_HASH_GRAPH_COMMITTED
```

Current deviations include an instant synthetic executor, generic restart/marker faults, ignored observation semantics, crash-window skip/duplicate behavior, non-convergent resume results, self-reported cleanup, external promotion without soak validation, mutable environment identity, and final manifests that trust caller digests and path references.

## Required-question conclusions

**1. Can one exact release be installed and verified without rebuilding or silently changing source/runtime authority?** No. Archive verification is optional, undeclared files can be accepted, incompatible runtimes can be labelled passed, and plan/apply paths reread mutable bytes.

**2. Is release publication atomic and rollback-safe?** No. Four targets are committed independently, prior targets are deleted during overwrite, and later evidence/result rewrites occur outside the staging transaction.

**3. Are upgrade plans immutable and bound to apply-time inputs?** No. The plan fingerprint is not recomputed and environment/release/evidence bytes are not revalidated before side effects.

**4. Can concurrent or stale upgrade actors execute effects?** Yes. No exclusive owner or fencing epoch exists, resolved state can cross plans, and classification presence is enough to skip transitions.

**5. Does rollback eliminate partial target ownership before restarting the prior release?** No. The prior release can start immediately after a target start exception.

**6. Does soak prove real elapsed time, target-specific failures, bounded progress, and cleanup?** No. A synthetic executor can pass instantly; the managed integration collapses failures; validation ignores operational fields; cleanup is self-attested.

**7. Do crash and restart converge deterministically?** No. Failure/cycle checkpoint order permits skipped or repeated faults, and resumed results conflict with cumulative checkpoint validation.

**8. Does external preflight require canonical successful soak validation?** No. It consumes only manifest/state/last-checkpoint shape and omits result/validation artifacts.

**9. Are environment and final acceptance identities immutable?** No. Environment bytes are omitted, recovery composition is path-based, and final acceptance trusts a caller-supplied archive digest and mutable component paths.

**10. Were live systems or persistent state touched?** No. All work was static or bounded and inert; no provider, service control, persistent database, signer, wallet, or financial operation was used.

## Confirmed findings summary

| ID | Sev. | Title | Release | BWS-600 | Deployment |
|---|---:|---|:---:|:---:|:---:|
| `BWS120-R09-001` | P1 | Install verification records incompatible runtimes and an unperformed server check as a passed preflight | YES | YES | YES |
| `BWS120-R09-002` | P1 | Install and upgrade verification permit release-directory evidence without the published archive | YES | YES | YES |
| `BWS120-R09-003` | P1 | Unmanifested non-forbidden files can pass checksum and archive verification | YES | YES | YES |
| `BWS120-R09-004` | P1 | Release publication is a non-transactional sequence that can expose mixed generations or delete the previous release | YES | YES | YES |
| `BWS120-R09-005` | P1 | Upgrade plan fingerprints are trusted from the plan instead of recomputed from plan content | YES | YES | YES |
| `BWS120-R09-006` | P1 | Upgrade apply does not rebind plan-time environment, release, and install-evidence bytes | YES | YES | YES |
| `BWS120-R09-007` | P1 | Upgrade apply has no exclusive owner or fencing token | YES | YES | YES |
| `BWS120-R09-008` | P1 | Resolved upgrade state can be reused by a different plan fingerprint | YES | YES | YES |
| `BWS120-R09-009` | P1 | Upgrade recovery trusts checkpoint classifications without verifying checkpoint bytes or current target state | YES | YES | YES |
| `BWS120-R09-010` | P1 | Upgrade checkpoints lifecycle success from permissive or ignored lifecycle outcomes | YES | YES | YES |
| `BWS120-R09-011` | P1 | Rollback starts the prior release without first fencing or stopping a partially started target | YES | YES | YES |
| `BWS120-R09-012` | P1 | The public execute command can synthesize an instant passing soak without managed runtime proof | YES | YES | YES |
| `BWS120-R09-013` | P1 | Managed soak collapses eighteen named failures into two generic actions | YES | YES | YES |
| `BWS120-R09-014` | P1 | Soak validation ignores observation readiness, progress, and resource bounds | YES | YES | YES |
| `BWS120-R09-015` | P1 | Soak checkpoint ordering can skip after-cycle faults or duplicate injected faults after a crash | YES | YES | YES |
| `BWS120-R09-016` | P1 | Resumed soak results cannot validate cumulative checkpoint history | YES | YES | YES |
| `BWS120-R09-017` | P1 | Cleanup acceptance is derived from caller/default counters instead of measured owned resources | YES | YES | YES |
| `BWS120-R09-018` | P1 | External preflight promotes schema-shaped soak state without consuming the soak result or validation verdict | YES | YES | YES |
| `BWS120-R09-019` | P1 | External campaign identity omits the environment file bytes | YES | YES | YES |
| `BWS120-R09-020` | P1 | Final recovery evidence combines unrelated schema-shaped artifacts without common byte or generation binding | YES | YES | YES |
| `BWS120-R09-021` | P1 | Final acceptance trusts a caller-supplied archive digest and mutable component paths | YES | YES | YES |

## Confirmed findings

### BWS120-R09-001: Install verification records incompatible runtimes and an unperformed server check as a passed preflight

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-packaging.ts::verifyBwsReleaseInstallation / runBwsReleasePreflight`
- **Exact line range:** `606-760`
- **Primary full-file SHA-256:** `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- **Release/upgrade/soak object:** Release install verification and BWS-600 preflight authority

**Current source evidence**

- `packages/bootstrap/src/operations/release-packaging.ts::verifyBwsReleaseInstallation / runBwsReleasePreflight` lines `606-760`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. The preflight returns node.compatible and postgresql.clientCompatible booleans, records the server check as not performed, and does not fail. The caller unconditionally adds non_mutating_preflight_passed.
- `packages/bootstrap/src/operations/external-runtime-preflight.ts::createBwsExternalRuntimeCampaignManifest` lines `260-277`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. External promotion requires only the string marker non_mutating_preflight_passed and does not inspect the runtime-compatibility booleans or require a PostgreSQL server check.
- `tests/bws-release-packaging.test.ts::extracted release verifies itself through the bundled CLI` lines `132-203`, SHA-256 `3462fc7e28e82057b26cf805ee7b868e1863ca2cf6b24a1e45593c4ebc8abae2`. The positive test uses the ambient Node runtime and a fake psql client; it does not exercise incompatible Node/client versions or a missing server-compatibility receipt.

**Preconditions.** The release directory is otherwise well formed, but Node is not major 20, psql is below the minimum client major, or PostgreSQL server compatibility has not been checked.

**Trigger.** Run verify-install and then use the generated result as upgrade or external-runtime evidence.

**Expected behavior.** Install verification must fail closed and must not emit a passed-preflight marker until every required runtime and server compatibility condition is positively established.

**Current behavior.** The result can contain node.compatible=false, postgresql.clientCompatible=false, and serverCompatibilityCheck=not_performed_in_check_only_mode while verifiedChecks still contains non_mutating_preflight_passed.

**Impact.** An incompatible installation can be promoted into upgrade, final-local-acceptance, or BWS-600 evidence, causing runtime failures or unsupported database behavior after release acceptance.

**Evidence.** The exact production branches were modeled with Node 22 and psql 12 against required majors 20 and 14; the branch returns a verification object instead of throwing and includes the passed marker.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model; Node v22.16.0 supplementary tests", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Incompatible booleans coexist with non_mutating_preflight_passed and no exception."}`

**Transaction/state-machine analysis.** CHECKED -> INCOMPATIBLE is incorrectly represented as CHECKED -> PASSED. The server state remains UNKNOWN but is promoted as successful evidence.

**Root cause.** Compatibility fields are descriptive rather than gate-authoritative, and downstream promotion trusts a marker rather than recomputing or checking the fields.

**Minimal fix boundary.** Make preflight return one explicit fail-closed verdict, reject incompatible Node and psql versions, require a bounded server-compatibility receipt before promotion, and make all consumers verify that verdict rather than a marker string.

**Required tests**

- Node 19/21/22 negative verification
- psql below minimum negative verification
- missing PostgreSQL server receipt negative verification
- external preflight rejects any false or unknown compatibility field
- canonical Node 20.20.2 install verification

**Regression risks**

- A check-only diagnostic mode may still be useful, but it must be a distinct non-promotable result schema/status.
- Server checks must remain read-only and bounded.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R10, R11

**Aliases or dependencies**

- BWS118-R06-007 and BWS118-R06-009 own process/readiness false-green behavior after start; this finding owns release/install compatibility promotion.
- KNOWN_BASELINE_MANIFEST_DRIFT remains R11-owned.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-002: Install and upgrade verification permit release-directory evidence without the published archive

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-packaging.ts::verifyArchiveIfPresent / verifyBwsReleaseInstallation`
- **Exact line range:** `606-671; 796-807`
- **Primary full-file SHA-256:** `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- **Release/upgrade/soak object:** Published archive identity and target-install evidence

**Current source evidence**

- `packages/bootstrap/src/operations/release-packaging.ts::verifyBwsReleaseInstallation / verifyArchiveIfPresent` lines `606-671; 796-807`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. Omitting archivePath returns archiveCheck.verified=false without rejection, and the install result is still published.
- `packages/bootstrap/src/operations/release-upgrade.ts::verifyTargetInstallEvidence` lines `1341-1368`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Upgrade planning accepts the install-verification schema, semantic fingerprint, and closed policy without requiring archiveCheck.verified or the archive verification marker.
- `tests/bws-release-upgrade.test.ts::target install verification fixture` lines `413-427`, SHA-256 `87838040f891b46b10e329808c71e0f8c120ef3d3dfd29afa7283c6c371a7227`. The upgrade test deliberately creates target install evidence without supplying archivePath and treats it as valid target evidence.

**Preconditions.** A release directory and install-verification file exist, but the published tarball and .sha256 file are absent or were never verified.

**Trigger.** Call verify-install without --archive, then create or apply an upgrade plan using that result.

**Expected behavior.** Any evidence that authorizes install, upgrade, rollback, soak, or promotion must bind to and verify the exact published archive bytes.

**Current behavior.** Directory-only verification succeeds, and upgrade target verification ignores archiveCheck.verified and the archive verification marker.

**Impact.** Operators can install or promote bytes that were never the published release artifact, defeating source/build/archive identity and reproducible rollback.

**Evidence.** The source and the focused upgrade fixture establish the no-archive path without requiring external execution.

**Reproduction status.** `{"status": "CONFIRMED_BY_SOURCE_AND_FOCUSED_TEST_FIXTURE", "runtime": "Node v22.16.0 supplementary", "harness": "/mnt/data/bws120-r09-work/focused-r09-tests.out", "result": "The upgrade fixture constructs accepted target verification with no archivePath."}`

**Transaction/state-machine analysis.** DIRECTORY_VERIFIED -> PROMOTABLE is reachable while ARCHIVE_VERIFIED remains false. Archive identity is optional rather than a required predecessor state.

**Root cause.** Archive verification is implemented as an optional enhancement instead of the release authority for every install and upgrade transition.

**Minimal fix boundary.** Require archivePath and its adjacent checksum for promotable install verification, bind the archive digest into the install result, and require exact archive verification in upgrade, external-preflight, and final-acceptance consumers.

**Required tests**

- verify-install rejects missing archive for promotable mode
- upgrade plan rejects archiveCheck.verified=false
- archive file replaced after directory extraction
- same directory from a different archive
- rollback uses retained exact prior archive

**Regression risks**

- Preserve a clearly named directory-audit mode only if it cannot feed promotion.
- Existing historical verification files must be classified non-promotable.

**Primary owner.** R09

**Secondary sectors.** R07, R11, R24

**Aliases or dependencies**

- BWS118-R06-003 identifies active-process generation drift; this finding owns release archive identity before execution.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-003: Unmanifested non-forbidden files can pass checksum and archive verification

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-packaging.ts::verifyManifestAgainstReleaseDirectory / verifyChecksumsFile / verifyArchiveIfPresent`
- **Exact line range:** `817-858; 900-996; 1263-1302`
- **Primary full-file SHA-256:** `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- **Release/upgrade/soak object:** Release content closure and package inventory

**Current source evidence**

- `packages/bootstrap/src/operations/release-packaging.ts::verifyArchiveIfPresent` lines `817-858`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. The archive is compared to the extracted directory, but a member is checked against the manifest only when that path is present in the manifest inventory.
- `packages/bootstrap/src/operations/release-packaging.ts::verifyManifestAgainstReleaseDirectory` lines `900-949`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. The verifier iterates expected inventories and selected policy files but does not reject every extracted path absent from the manifest inventory.
- `packages/bootstrap/src/operations/release-packaging.ts::verifyChecksumsFile` lines `964-996`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. The checksum verifier validates listed rows but does not require checksum paths to equal the manifest path set or require every release file to be listed.
- `packages/bootstrap/src/operations/release-packaging.ts::buildReleaseManifestInventory` lines `1281-1302`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. The canonical inventory map is built but never compared as an exact set to the extracted release paths.

**Preconditions.** An additional regular file is added under an allowed path, included in SHA256SUMS, and included in the archive.

**Trigger.** Verify the extracted release and archive.

**Expected behavior.** Manifest inventory, checksum inventory, extracted regular-file inventory, and archive inventory must be exact set-equal with no undeclared member.

**Current behavior.** All expected files can verify while an extra non-forbidden file remains accepted in the release and archive.

**Impact.** Undeclared code, configuration, data, or stale output can ship and execute despite a valid release semantic fingerprint.

**Evidence.** An exact path-set model using one expected file plus extra.js is accepted by each current loop.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Manifest loop, checksum loop, and archive loop all accept the undeclared extra path."}`

**Transaction/state-machine analysis.** MANIFEST_COMPLETE is inferred from per-entry verification; the missing set-equality transition allows MANIFEST_PLUS_UNDECLARED_CONTENT to reach VERIFIED.

**Root cause.** The verifier proves inclusion of expected files but not exclusion of every undeclared file.

**Minimal fix boundary.** Construct one normalized expected path map and require exact equality across manifest, SHA256SUMS, extracted directory, and archive before any verification result is emitted.

**Required tests**

- extra JavaScript file included in checksums and archive
- extra config file
- extra executable mode file
- missing checksum row for an otherwise manifest-declared file
- duplicate/normalization-collision paths

**Regression risks**

- Generated metadata such as release-manifest.json and SHA256SUMS must be explicitly included in the authoritative set definition.
- Do not weaken existing forbidden-path and symlink checks.

**Primary owner.** R09

**Secondary sectors.** R11, R24

**Aliases or dependencies**

- No inherited finding owns exact release path-set closure.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-004: Release publication is a non-transactional sequence that can expose mixed generations or delete the previous release

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-packaging.ts::createBwsReleasePackage / commitOutputTarget`
- **Exact line range:** `534-588; 1305-1331`
- **Primary full-file SHA-256:** `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`
- **Release/upgrade/soak object:** Release directory, archive, checksum, result, and evidence publication transaction

**Current source evidence**

- `packages/bootstrap/src/operations/release-packaging.ts::createBwsReleasePackage` lines `534-588`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. Four independently staged targets are renamed one by one; evidence and the result are then rewritten in place twice.
- `packages/bootstrap/src/operations/release-packaging.ts::commitOutputTarget` lines `1305-1331`, SHA-256 `d3b51b0cf2dcd00cb70f2ebc383ed34669484cd39a4c3baeee804d5f845bcdce`. With allowOverwrite, the existing target is recursively removed before each individual rename.

**Preconditions.** A prior release with the same releaseId exists or the process/filesystem fails after one publication step.

**Trigger.** Publish with allowOverwrite or inject failure between any two target commits or evidence rewrites.

**Expected behavior.** One release generation must become visible atomically, and a failed publication must preserve the complete prior generation or leave only an explicitly incomplete staging area.

**Current behavior.** Directory, archive, checksum, and result can belong to different generations. allowOverwrite deletes each previous target before its replacement is guaranteed, and later evidence/result rewrites are outside the staged commit.

**Impact.** Consumers can observe a mixed or partially missing release; a failed overwrite can destroy the previously valid rollback artifact.

**Evidence.** Static ordering proves externally visible intermediate states after each rename and destructive loss windows before each replacement.

**Reproduction status.** `{"status": "STATIC_TRANSACTION_ORDER_CONFIRMED", "runtime": null, "harness": null, "result": "Failure after any commit leaves a partial generation; allowOverwrite removes prior targets before complete replacement."}`

**Transaction/state-machine analysis.** STAGED_ALL -> PUBLISHED_ALL is implemented as four independent PUBLISHED_PARTIAL transitions followed by mutable evidence rewrites, without one commit record or rollback.

**Root cause.** A multi-artifact release is published as independent filesystem targets rather than one immutable generation transaction.

**Minimal fix boundary.** Publish into a new immutable generation directory, fsync and verify all members, then atomically update a single generation pointer/commit marker. Never delete the prior generation until the new generation is fully committed and retained.

**Required tests**

- failure after each rename
- failure during each evidence registration/rewrite
- allowOverwrite preserves prior complete release on failure
- concurrent publishers for the same releaseId
- reader observes only old or new complete generation

**Regression risks**

- Evidence-index publication belongs to R07 and must participate through an explicit handoff rather than mutable post-commit rewrites.
- Cross-filesystem rename assumptions must be defined.

**Primary owner.** R09

**Secondary sectors.** R07, R11, R24

**Aliases or dependencies**

- BWS118-R06-016 owns millisecond lifecycle evidence collisions; this is the release multi-artifact transaction root.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-005: Upgrade plan fingerprints are trusted from the plan instead of recomputed from plan content

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::createBwsReleaseUpgradePlan / readUpgradePlan / assertPlanFingerprint`
- **Exact line range:** `427-443; 1371-1385`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Upgrade plan authority and operator apply token

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::createBwsReleaseUpgradePlan` lines `427-443`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. The plan fingerprint is computed from a subset of planning inputs during creation.
- `packages/bootstrap/src/operations/release-upgrade.ts::readUpgradePlan / assertPlanFingerprint` lines `1371-1385`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Apply validates only the embedded fingerprint shape and compares it to the caller argument; it never recomputes the digest from the parsed plan.

**Preconditions.** A plan file is edited after creation while its embedded planFingerprint and the operator-supplied fingerprint remain unchanged.

**Trigger.** Apply the edited plan.

**Expected behavior.** The apply path must recompute a canonical digest over every authoritative plan field and reject any byte/semantic change.

**Current behavior.** Edited paths, evidence references, runtime directories, status, or policy fields can be accepted as long as the embedded fingerprint remains the expected 64-hex value.

**Impact.** A plan can redirect environment, evidence, target, or state authority after approval without changing the operator token.

**Evidence.** The exact descriptor model changes envFile while retaining the embedded digest; readUpgradePlan and assertPlanFingerprint still accept it.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Tampered plan content is accepted with the original embedded fingerprint."}`

**Transaction/state-machine analysis.** APPROVED_PLAN(A) -> FILE_MUTATED(B) -> APPLY(A_TOKEN) reaches APPLY(B) because the token is compared only to a mutable field in B.

**Root cause.** The plan fingerprint is treated as self-authenticating data rather than a recomputed content commitment.

**Minimal fix boundary.** Define one canonical plan descriptor containing every apply-authoritative field, recompute it on every read, and bind the plan file digest into retained evidence and state.

**Required tests**

- mutate envFile with unchanged fingerprint
- mutate target directory
- mutate checkpoint/state path
- mutate status/reasons/policy
- unknown or extra fields under canonical serialization

**Regression risks**

- Canonicalization must be versioned.
- Secret values should be bound by a restricted digest/receipt without being copied into public evidence.

**Primary owner.** R09

**Secondary sectors.** R07, R10, R11

**Aliases or dependencies**

- No inherited finding owns upgrade-plan self-authentication.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-006: Upgrade apply does not rebind plan-time environment, release, and install-evidence bytes

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::createBwsReleaseUpgradePlan / applyBwsReleaseUpgrade`
- **Exact line range:** `385-475; 519-535; 610-628`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Plan-to-apply time-of-check/time-of-use authority

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::createBwsReleaseUpgradePlan` lines `385-475`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Planning verifies release identities and records environment and evidence hashes.
- `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade` lines `519-535`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Apply rereads the environment file to build persistence/lifecycle configuration but does not compare its bytes to environmentFingerprintSha256.
- `packages/bootstrap/src/operations/release-upgrade.ts::target_staged transition` lines `610-628`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Apply rereads target install evidence by path but does not enforce the plan-retained evidence digest or reverify current/target release directories against their plan-time bytes.

**Preconditions.** The environment file, current release directory, target release directory, or target install-verification file changes after a ready plan is created.

**Trigger.** Apply the unchanged plan and token.

**Expected behavior.** Every plan-time authority must be rehashed/reverified at apply, and any difference must force a new plan.

**Current behavior.** Apply consumes current bytes from mutable paths while retaining plan-time identities and checkpoints.

**Impact.** Database targets, credentials, runtime policy, migration bytes, target code, or evidence can drift between approval and execution.

**Evidence.** Static dataflow shows recorded fingerprints are not compared during apply; the path is reread directly.

**Reproduction status.** `{"status": "STATIC_TOCTOU_CONFIRMED", "runtime": null, "harness": null, "result": "Plan-time digests are recorded but not enforced before side effects."}`

**Transaction/state-machine analysis.** PLANNED(bytes A) -> MUTATED(bytes B) -> APPLY reaches side effects under A identity while using B values.

**Root cause.** The upgrade plan is treated as an advisory snapshot rather than an immutable transaction precondition.

**Minimal fix boundary.** Before acquiring upgrade ownership or stopping services, recompute the plan digest, environment receipt, release manifests/inventories, install-verification digest, backup/restore evidence, and database identity; abort on any mismatch.

**Required tests**

- environment mutation after plan
- target file mutation after plan
- current release mutation after plan
- install verification replacement
- backup/restore evidence replacement
- mutation after pre-apply revalidation but before side effect using immutable handles or generation locks

**Regression risks**

- Revalidation must occur before any lifecycle or database side effect.
- Avoid exposing secret contents in public evidence while still binding exact configuration.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R10, R11

**Aliases or dependencies**

- BWS118-R06-003 owns active process/executable generation; this finding owns plan/apply byte binding.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-007: Upgrade apply has no exclusive owner or fencing token

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade / readOrCreateUpgradeState / appendCheckpointIfMissing`
- **Exact line range:** `519-770; 1388-1485`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Upgrade transaction owner, state file, lifecycle, migration, and checkpoint effects

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade` lines `519-770`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Apply performs stop, backup verification, migration, start, rollback, and result publication without acquiring an exclusive upgrade lease.
- `packages/bootstrap/src/operations/release-upgrade.ts::readOrCreateUpgradeState / appendCheckpointIfMissing` lines `1388-1485`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. The mutable state/checkpoint files are created and replaced without atomic interprocess ownership or a monotonic fencing epoch.

**Preconditions.** Two apply or recover commands for the same plan/evidence directory overlap.

**Trigger.** Launch concurrent upgrade operations before either publishes the next state.

**Expected behavior.** Exactly one generation-bound upgrade owner must execute lifecycle, migration, checkpoint, and rollback effects; stale owners must be fenced.

**Current behavior.** Both commands can read the same state, independently stop/start, apply migrations, append colliding sequence files, and overwrite state/results.

**Impact.** Duplicate or conflicting lifecycle and database effects, corrupted checkpoint history, overlapping rollback, and false terminal results are possible.

**Evidence.** A static interleaving has no linearization point before side effects. Atomic JSON replacement protects bytes, not ownership.

**Reproduction status.** `{"status": "STATIC_INTERLEAVING_CONFIRMED", "runtime": null, "harness": null, "result": "Two callers can share one state snapshot and execute the same transition concurrently."}`

**Transaction/state-machine analysis.** READY -> APPLYING is not an atomic ownership transition. Multiple owners can execute the same state-machine edge, and last-writer state hides earlier effects.

**Root cause.** Upgrade state persistence is used as progress memory but not as an exclusive lease/fence.

**Minimal fix boundary.** Acquire one repository/evidence-directory scoped atomic lease before any apply/recover side effect, assign a monotonic upgrade epoch, bind every checkpoint and lifecycle call to it, and reject stale writers.

**Required tests**

- two processes apply the same plan
- apply and recover overlap
- owner crash and fenced takeover
- stale owner attempts checkpoint after takeover
- concurrent rollback and upgrade completion

**Regression risks**

- Coordinate with R03 database fencing and R06 process ownership without duplicating their lower-layer fixes.
- Emergency recovery needs an explicit, audited takeover path.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R10, R11

**Aliases or dependencies**

- BWS116-R03-004 owns migration transaction mechanics.
- BWS118-R06-001 owns generic lifecycle ownership; this finding owns the upgrade transaction owner.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-008: Resolved upgrade state can be reused by a different plan fingerprint

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade / readOrCreateUpgradeState`
- **Exact line range:** `539-542; 1388-1421`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Upgrade state namespace and plan identity

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade` lines `539-542`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Plan mismatch is rejected only while state.resolved is false.
- `packages/bootstrap/src/operations/release-upgrade.ts::readOrCreateUpgradeState` lines `1388-1421`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. A resolved state with matching current/target semantic fingerprints is returned even when planFingerprint differs.

**Preconditions.** A previous plan reached a resolved terminal state and a new plan for the same current/target semantic fingerprints reuses the same state path.

**Trigger.** Apply the new plan.

**Expected behavior.** State must be immutable and namespaced by exact plan fingerprint; a different plan must start with a new empty state and checkpoint directory.

**Current behavior.** The resolved prior state is accepted and its checkpoints can suppress work in the new plan.

**Impact.** A new upgrade can skip verification, drain, backup, migration, start, or recovery transitions based on unrelated historical checkpoints.

**Evidence.** The exact branch model supplies a resolved old state and a different plan fingerprint; both mismatch guards permit reuse.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Different plan accepted because previous state.resolved=true."}`

**Transaction/state-machine analysis.** RESOLVED(plan A) incorrectly becomes INITIAL_STATE(plan B), carrying terminal history across distinct authorization identities.

**Root cause.** The state path is release-pair scoped rather than plan-identity scoped, and resolved state disables the mismatch invariant.

**Minimal fix boundary.** Require exact plan fingerprint for every state read, use per-plan state/checkpoint directories, and archive rather than reuse resolved state.

**Required tests**

- new plan same releases different environment
- new plan same releases different evidence
- new plan after prior rollback
- state path collision across plans
- explicit archival and fresh-state creation

**Regression risks**

- Historical recovery evidence must remain discoverable without becoming active state.
- Do not silently delete prior terminal evidence.

**Primary owner.** R09

**Secondary sectors.** R07, R10, R11

**Aliases or dependencies**

- No inherited finding owns cross-plan resolved-state reuse.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-009: Upgrade recovery trusts checkpoint classifications without verifying checkpoint bytes or current target state

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade / readOrCreateUpgradeState / hasCheckpoint`
- **Exact line range:** `657-770; 1404-1421; 1428-1493`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Upgrade checkpoint replay and terminal recovery

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade` lines `657-770`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. If target_started already appears in state, apply skips start/readiness and appends recovery_complete before returning upgrade_applied.
- `packages/bootstrap/src/operations/release-upgrade.ts::readOrCreateUpgradeState` lines `1404-1421`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. State loading checks schema and release fingerprints but does not open or validate recorded checkpoint files, hashes, sequence, or details.
- `packages/bootstrap/src/operations/release-upgrade.ts::appendCheckpointIfMissing / hasCheckpoint` lines `1428-1493`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. Resume authority is only whether any state entry has the requested classification.

**Preconditions.** State lists target_started or another completed classification while checkpoint files are missing/tampered or the target process is no longer current and ready.

**Trigger.** Resume apply/recovery.

**Expected behavior.** Resume must validate the full hash-linked checkpoint chain and re-establish current generation-bound lifecycle/database postconditions before advancing.

**Current behavior.** Classification presence suppresses work and can directly produce recovery_complete/upgrade_applied without current target verification.

**Impact.** Tampered or stale state can create false terminality; a dead or replaced target can be reported as successfully upgraded.

**Evidence.** The static model with target_started present and target_process_alive_now=false reaches recovery_complete.

**Reproduction status.** `{"status": "REPRODUCED_BY_STATIC_INTERLEAVING", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Checkpoint presence is enough to skip start and publish completion."}`

**Transaction/state-machine analysis.** PERSISTED_LABEL(target_started) is treated as CURRENT_FACT(target_ready). The recovery machine has no REVALIDATE_POSTCONDITION edge.

**Root cause.** Checkpoint metadata is trusted as state authority without validating referenced artifacts or live postconditions.

**Minimal fix boundary.** On every resume, verify each checkpoint file hash/schema/sequence/plan/epoch, reconstruct state from the chain, then revalidate current release, database ledger, process generation, health, and readiness before any terminal transition.

**Required tests**

- tampered checkpoint file
- missing checkpoint file
- state with duplicate/out-of-order classifications
- target dies after target_started checkpoint
- target generation replaced before resume

**Regression risks**

- Fresh status checks must use R06 generation-safe lifecycle evidence.
- A failed revalidation should preserve ambiguity and require bounded recovery, not overwrite evidence.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R11

**Aliases or dependencies**

- BWS118-R06-003 and BWS118-R06-007 own process generation/readiness truth.
- R07 owns evidence publication integrity.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-010: Upgrade checkpoints lifecycle success from permissive or ignored lifecycle outcomes

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::buildLifecyclePlanReasons / applyBwsReleaseUpgrade`
- **Exact line range:** `564-581; 657-674; 1132-1148`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Drain and target-start lifecycle gates

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::buildLifecyclePlanReasons` lines `1132-1148`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. A running stack is accepted when health is healthy OR readiness is ready, rather than requiring a coherent exact-ready state.
- `packages/bootstrap/src/operations/release-upgrade.ts::drained_before_backup transition` lines `564-581`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. The stopLifecycle return value is ignored and lifecycleStopped=true is checkpointed whenever the promise resolves.
- `packages/bootstrap/src/operations/release-upgrade.ts::target_started transition` lines `657-674`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. The startLifecycle return value is ignored and targetStarted=true is checkpointed whenever the promise resolves.

**Preconditions.** Lifecycle methods resolve with degraded, blocked, already-running, partial, or otherwise non-authoritative outcomes.

**Trigger.** Plan, stop, or start during upgrade.

**Expected behavior.** Upgrade transitions must require explicit exact-owner, stopped/drained, and target-ready outcomes bound to the intended generation.

**Current behavior.** OR logic admits partial readiness; stop/start results are not inspected before success checkpoints are persisted.

**Impact.** Upgrade can migrate against an undrained stack or report a target started when the lifecycle operation returned a degraded/non-ready outcome.

**Evidence.** Static source trace shows the result objects are discarded and booleans are hard-coded into checkpoint details.

**Reproduction status.** `{"status": "STATIC_DATAFLOW_CONFIRMED", "runtime": null, "harness": null, "result": "Lifecycle return values do not govern upgrade checkpoint success."}`

**Transaction/state-machine analysis.** RUNNING(partial) -> DRAINED and START_ATTEMPTED -> TARGET_STARTED are collapsed despite missing authoritative outcomes.

**Root cause.** The orchestrator treats promise resolution as lifecycle success and uses a permissive health/readiness predicate.

**Minimal fix boundary.** Define an exact lifecycle outcome matrix, require both generation-bound health and readiness where applicable, verify stopped/drained state after stop, verify target ready after start, and persist the actual receipts.

**Required tests**

- stop resolves already_running/degraded/blocked
- start resolves started with blocked readiness
- health healthy but readiness blocked
- readiness ready but health blocked
- generation mismatch after start

**Regression risks**

- R06 fixes may change outcome names; R09 should consume an explicit stable contract rather than duplicate process logic.

**Primary owner.** R09

**Secondary sectors.** R06, R07, R11

**Aliases or dependencies**

- BWS118-R06-002
- BWS118-R06-007
- BWS118-R06-009

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-011: Rollback starts the prior release without first fencing or stopping a partially started target

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/release-upgrade.ts::applyBwsReleaseUpgrade rollback branch`
- **Exact line range:** `657-714`
- **Primary full-file SHA-256:** `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`
- **Release/upgrade/soak object:** Failed target start and rollback transaction

**Current source evidence**

- `packages/bootstrap/src/operations/release-upgrade.ts::target start failure and rollback branch` lines `657-714`, SHA-256 `5c5aadcab32d9a937ea6100434f7b3644df5c31954e096af19a80c1958bfeef7`. After startLifecycle throws, rollback evaluation may immediately call startLifecycle for the current release. No target stop, target generation fence, or partial-child cleanup is performed first.

**Preconditions.** Target start creates one or more processes or side effects and then throws or fails readiness; rollback is allowed and requested.

**Trigger.** Execute rollbackOnFailure=true.

**Expected behavior.** Rollback must first establish exclusive ownership, stop/drain/fence every partial target component, verify no target generation remains, then start and verify the prior release.

**Current behavior.** The prior release is started directly while partial target processes may still exist.

**Impact.** Old and new releases can overlap, share ports/state/database writers, and publish conflicting evidence during recovery.

**Evidence.** The error path contains no target lifecycle stop between the failed start and current-release start.

**Reproduction status.** `{"status": "STATIC_INTERLEAVING_CONFIRMED", "runtime": null, "harness": null, "result": "Partial target remains possible when prior release start begins."}`

**Transaction/state-machine analysis.** TARGET_STARTING -> ERROR -> OLD_STARTING lacks TARGET_FENCED/TARGET_STOPPED intermediate states.

**Root cause.** Rollback assumes a thrown target start produced no owned residual process or side effect.

**Minimal fix boundary.** Retain the target runtime generation receipt before start, invoke generation-specific stop/drain on failure, verify zero residual ownership, then start the previous immutable release and validate readiness.

**Required tests**

- target spawns API then throws
- target starts all children but readiness fails
- target stop partially fails
- port conflict during old start
- crash between target cleanup and prior start

**Regression risks**

- Cleanup must not lose emergency control of ambiguous processes.
- Coordinate with R06 shutdown ordering and fencing.

**Primary owner.** R09

**Secondary sectors.** R06, R07, R11

**Aliases or dependencies**

- BWS118-R06-004 owns generic partial-start orphaning.
- BWS118-R06-010 and BWS118-R06-011 own shutdown order/completeness.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-012: The public execute command can synthesize an instant passing soak without managed runtime proof

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign / defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup`
- **Exact line range:** `764-788; 986-1028; 1659-1667; 1911-1960`
- **Primary full-file SHA-256:** `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- **Release/upgrade/soak object:** Soak duration, observations, failures, recovery, and cleanup

**Current source evidence**

- `packages/bootstrap/src/cli/bws-soak-campaign.ts::execute command` lines `72-80`, SHA-256 `55a3b486f879b367fb30e3d67b465e457f1f258c209d131603ce3916e51e534a`. The public execute command calls executeBwsSoakCampaign without managed runtime dependencies or wall-clock timing.
- `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign` lines `764-788`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Missing dependencies select synthetic default observation, failure, and cleanup implementations.
- `packages/bootstrap/src/operations/soak-campaign.ts::validateBwsSoakCampaignExecution / observationBudgetSatisfied` lines `986-1028; 1659-1667`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Validation allows absent runtimeEvidence and treats intervalMs * completedCycleCount as duration proof.
- `packages/bootstrap/src/operations/soak-campaign.ts::defaultObserveCycle / defaultExecuteFailure / defaultVerifyCleanup` lines `1911-1960`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Defaults manufacture ready observations, recovered failures, and zero leaks without touching a target.
- `tests/bws-soak-campaign.test.ts::default failure-matrix test` lines `660-710`, SHA-256 `d0d027bfe0dd0ef866c175c59dfe71cfbc5c1f8707097ac7790298ea96aefe0e`. The test executes all named failures through defaults and expects validation success.

**Preconditions.** A valid campaign manifest and state exist; the operator invokes the execute command rather than the managed run-runtime command.

**Trigger.** Run enough synthetic cycles to satisfy intervalMs * cycle count >= durationMs.

**Expected behavior.** Promotable soak evidence must require the managed wall-clock runner, real diagnostics-backed observations, target-specific failures, measured recovery, and measured cleanup.

**Current behavior.** The execute path completes immediately, synthesizes every positive field, omits runtimeEvidence, and still validates when the arithmetic cycle budget is met.

**Impact.** Two-hour or longer acceptance can be fabricated in milliseconds, allowing untested release/runtime generations into BWS-600 or deployment.

**Evidence.** The exact branch model completes 120 one-minute cycles with no sleep and validates all defaults as successful.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL_AND_REPOSITORY_TEST", "runtime": "Python source model; Node v22.16.0 supplementary fixture", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Synthetic observations, recoveries, and cleanup satisfy validation without wall-clock proof."}`

**Transaction/state-machine analysis.** INITIALIZED -> SYNTHETIC_CYCLES -> CLEANUP_VERIFIED -> VALIDATED is a complete promotable path parallel to the stricter managed runtime state machine.

**Root cause.** A test/simulation executor and a production acceptance executor share the same promotable result schema and validator.

**Minimal fix boundary.** Separate simulation from managed acceptance at the type/schema/CLI level. Require managed_runtime evidence, elapsed monotonic time, diagnostics receipts, and target-specific fault/cleanup receipts for any promotable validation.

**Required tests**

- execute result rejected by promotable validator
- no runtimeEvidence negative
- elapsed wall-clock below duration negative
- default observe/failure/cleanup marked simulation-only
- external preflight rejects simulation schema

**Regression risks**

- Keep deterministic simulation for unit tests, but it must be explicitly non-promotable.
- Existing fixtures and historical results need classification.

**Primary owner.** R09

**Secondary sectors.** R06, R07, R11

**Aliases or dependencies**

- BWS118-R06-007 owns false runtime health inputs; this finding owns acceptance of synthetic soak execution.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-013: Managed soak collapses eighteen named failures into two generic actions

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts::PROCESS_RESTART_FAILURE_TARGETS / ARTIFACT_MARKER_FAILURE_TARGETS / executeRestartFailure / executeArtifactMarkerFailure`
- **Exact line range:** `17-39; 121-155; 161-241`
- **Primary full-file SHA-256:** `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`
- **Release/upgrade/soak object:** Failure-injection matrix and cleanup authority

**Current source evidence**

- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts::failure target sets and dispatch` lines `17-39; 121-140`, SHA-256 `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`. Twelve process/database/timeout/lease faults all dispatch to one full-stack restart; six artifact/backup/upgrade/contract faults dispatch to one marker write/delete.
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts::executeRestartFailure / executeArtifactMarkerFailure` lines `161-241`, SHA-256 `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`. The implementation does not inject the named component-specific fault or prove the named expected effect.
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts::verifyDatabaseCleanup` lines `141-155`, SHA-256 `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`. Cleanup checks only the configured database identity and returns leakedDatabases=0 without enumerating campaign-created resources.

**Preconditions.** A managed campaign schedules any named failure target.

**Trigger.** The integration dispatches the failure.

**Expected behavior.** Each named target must have an explicit, target-specific injection, observation, recovery criterion, and cleanup proof.

**Current behavior.** All process targets perform stop/start/status of the full stack; all artifact targets write and delete a marker. The named failure is not actually produced.

**Impact.** The soak can claim coverage of database interruption, malformed API, lease expiry, partial startup, upgrade interruption, backup interruption, and other faults that were never exercised.

**Evidence.** The exact dispatch model yields one unique implementation for twelve process targets and one for six artifact targets.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_DISPATCH_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "18 names reduce to 2 generic actions."}`

**Transaction/state-machine analysis.** SCHEDULED(target X) -> GENERIC_RESTART_OR_MARKER -> RECOVERED(X) falsely labels generic activity as target-specific proof.

**Root cause.** Failure identity is metadata only; it does not select a target-specific mechanism or proof contract.

**Minimal fix boundary.** Create one implementation registry with an explicit injector, expected observation, recovery verifier, and cleanup verifier per target. Reject any target without a real implementation.

**Required tests**

- each target produces its named effect
- wrong component action cannot satisfy target
- recovery evidence is target-specific
- database/resource enumeration after every fault
- unsupported target fails before campaign start

**Regression risks**

- Several faults depend on R03, R06, R07, and R08 primitives; retain explicit handoffs rather than inventing unsafe direct mutations.
- No real provider or production database should be required for safe local failure tests.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R08, R11

**Aliases or dependencies**

- Inherited R03/R06 findings remain the owners of lower-layer recovery defects.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-014: Soak validation ignores observation readiness, progress, and resource bounds

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/soak-campaign.ts::validateBwsSoakCampaignExecution / buildRuntimeObservation`
- **Exact line range:** `986-1108; 2020-2049`
- **Primary full-file SHA-256:** `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- **Release/upgrade/soak object:** Cycle observation semantics and soak acceptance thresholds

**Current source evidence**

- `packages/bootstrap/src/operations/soak-campaign.ts::validateBwsSoakCampaignExecution` lines `986-1108`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Validation checks structure, counts, failure checkpoint presence, and artifact hashes but never reads cycle observation health/readiness/progress/queue/latency/error values.
- `packages/bootstrap/src/operations/soak-campaign.ts::buildRuntimeObservation` lines `2020-2049`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. The runtime records those fields, derives boundedProgress from a weak lifecycle predicate, and hard-codes latencyMs=0.

**Preconditions.** Every cycle is retained and the structural checkpoint/failure conditions pass, but observations show blocked health/readiness, no progress, queue growth, errors, or excessive resource use.

**Trigger.** Validate the soak result.

**Expected behavior.** Acceptance must enforce explicit monotonic progress, readiness, error, queue, latency, dead-letter, memory, disk, and growth thresholds over the full observation window.

**Current behavior.** Observation detail fields are not consulted, so structurally complete but operationally failed cycles can pass.

**Impact.** A stalled, blocked, or leaking release can obtain a valid soak result and promotion evidence.

**Evidence.** The source-dataflow model injects blocked readiness, boundedProgress=false, high queue depth, and errors; no validator branch reads them.

**Reproduction status.** `{"status": "REPRODUCED_BY_SOURCE_DATAFLOW", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "All adverse observation fields are ignored by validation."}`

**Transaction/state-machine analysis.** OBSERVED_BAD -> RETAINED_CHECKPOINT -> VALIDATED is reachable because observation payload semantics are opaque to the validator.

**Root cause.** The soak validator validates evidence shape and count, not the operational invariants the observations are intended to prove.

**Minimal fix boundary.** Version a threshold contract in the manifest; validate every cycle and aggregate window; measure real latency/resource counters; fail on unknown/missing fields and on sustained regression.

**Required tests**

- blocked health cycle
- blocked readiness cycle
- boundedProgress=false
- monotonic queue growth
- nonzero errors/dead letters
- latency/resource threshold breach
- missing observation field

**Regression risks**

- Thresholds must be explicit and workload-aware, not hidden defaults.
- R07 owns evidence identity; R09 owns the acceptance semantics.

**Primary owner.** R09

**Secondary sectors.** R05, R06, R07, R11

**Aliases or dependencies**

- BWS118-R06-007 identifies false health/readiness production; this finding applies even when observations are truthful.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-015: Soak checkpoint ordering can skip after-cycle faults or duplicate injected faults after a crash

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign / executeFailureStage`
- **Exact line range:** `793-905; 1768-1865`
- **Primary full-file SHA-256:** `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- **Release/upgrade/soak object:** Failure exactly-once state and cycle checkpoint progression

**Current source evidence**

- `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign` lines `793-905`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. cycle_observed advances persisted completedCycleCount before after_cycle failures execute.
- `packages/bootstrap/src/operations/soak-campaign.ts::executeFailureStage` lines `1768-1865`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. failure_injected is checkpointed before the side effect, while deduplication uses only the in-memory failures array populated after recovery.

**Preconditions.** The process crashes after cycle_observed but before after_cycle injection, or after failure_injected/side effect but before recovery and in-memory failure recording.

**Trigger.** Resume the campaign.

**Expected behavior.** Every scheduled fault must be durably exactly-once or explicitly safely replayable, and completedCycleCount must not skip any required stage.

**Current behavior.** After-cycle work can be skipped because resume starts at completedCycleCount+1; an injected fault can run again because the durable checkpoint is not used for deduplication.

**Impact.** Named failure coverage becomes incomplete or duplicate destructive effects occur, while retained state can still look progressive.

**Evidence.** Static crash-window models reproduce both skip and duplicate paths.

**Reproduction status.** `{"status": "REPRODUCED_BY_STATIC_INTERLEAVING", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Crash windows cause skipped after_cycle fault and repeated injected fault."}`

**Transaction/state-machine analysis.** The durable cycle state and durable failure state are not one monotonic transaction. EPHEMERAL_EXECUTED_SET is lost across restart.

**Root cause.** Checkpoint sequencing records intent/progress at boundaries that do not correspond to completed side effects and does not reconstruct fault state from checkpoints.

**Minimal fix boundary.** Model each injection with durable pending/injected/recovery_verified states and an idempotency token; derive resume work from the checkpoint chain; advance cycle completion only after all required stages are terminal.

**Required tests**

- crash at every line between fault checkpoint, side effect, recovery checkpoint, and cycle completion
- replay-safe versus non-replay-safe target behavior
- after_cycle crash/resume
- duplicate fault token rejection
- state reconstruction from checkpoints

**Regression risks**

- Some real failures are inherently non-idempotent and need compensation/fencing.
- Do not claim exactly-once merely from filesystem checkpoints.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R11

**Aliases or dependencies**

- BWS116-R03-007 through BWS116-R03-011 own durable worker lease/retry mechanics below this campaign state machine.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-016: Resumed soak results cannot validate cumulative checkpoint history

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign / validateBwsSoakCampaignExecution`
- **Exact line range:** `790-791; 947-965; 1056-1062`
- **Primary full-file SHA-256:** `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`
- **Release/upgrade/soak object:** Chunked or restarted soak result construction

**Current source evidence**

- `packages/bootstrap/src/operations/soak-campaign.ts::executeBwsSoakCampaign` lines `790-791; 947-965`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Each invocation starts executedCycles and failures as empty arrays, but the result includes every retained checkpoint file in the campaign directory.
- `packages/bootstrap/src/operations/soak-campaign.ts::validateBwsSoakCampaignExecution` lines `1056-1062`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. Validation requires result.executedCycles to equal all retained cycle_observed checkpoints exactly.

**Preconditions.** A campaign completes one or more cycles, stops, then resumes in a later invocation.

**Trigger.** Execute additional cycles and validate the new result.

**Expected behavior.** A resumed result must represent cumulative durable history or validation must compare only a precisely bounded invocation segment.

**Current behavior.** The result lists only cycles from the latest call while validation compares against cumulative checkpoints, so legitimate restart/chunking fails.

**Impact.** The advertised restart/resume path is non-convergent; operators may be forced to discard evidence or rerun campaigns, and a failure may be misdiagnosed as corruption.

**Evidence.** The exact model with retained cycles [1,2] and current executedCycles [2] fails the validator.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Cumulative checkpoints and per-invocation result arrays cannot satisfy equality."}`

**Transaction/state-machine analysis.** RESUME(previous history) -> RESULT(current segment) -> VALIDATE(cumulative history) is internally inconsistent.

**Root cause.** Execution result scope is per invocation while checkpoint and validator scope is per campaign.

**Minimal fix boundary.** Define result scope explicitly. Prefer reconstructing cumulative cycles/failures from the validated checkpoint chain and emitting a cumulative result bound to the terminal state.

**Required tests**

- two-invocation campaign
- resume after crash before result write
- resume with prior recovered failures
- multiple partial chunks
- validator reconstructs canonical cumulative history

**Regression risks**

- Historical results may remain per-invocation and need a new schema/version.
- Do not silently merge inconsistent checkpoint chains.

**Primary owner.** R09

**Secondary sectors.** R07, R11

**Aliases or dependencies**

- No inherited finding owns soak result/checkpoint scope mismatch.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-017: Cleanup acceptance is derived from caller/default counters instead of measured owned resources

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceCleanupResult`
- **Exact line range:** `660-691`
- **Primary full-file SHA-256:** `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- **Release/upgrade/soak object:** Soak and final-acceptance cleanup proof

**Current source evidence**

- `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceCleanupResult` lines `660-691`, SHA-256 `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`. verified is computed solely from caller-provided lease, PID, and file lists; no filesystem, process, lease, or database inspection occurs.
- `packages/bootstrap/src/cli/bws-final-local-acceptance.ts::cleanup command option mapping` lines `75-83`, SHA-256 `218d99afdbef03328786d155dd23766bf87e19a75eb03c5ba1e835922c251d43`. The CLI exposes those counters/lists as operator inputs, making the final gate a self-attestation.
- `packages/bootstrap/src/operations/soak-campaign.ts::defaultVerifyCleanup` lines `1949-1960`, SHA-256 `779c0901b003ad6510608e54136fcb3e5c7dd38f64f07bd5916d49fcafd950a1`. The non-managed soak default returns leakedDatabases=0 and leakedProcesses=0 without observation.
- `packages/bootstrap/src/operations/bws-soak-runtime-integration.ts::verifyDatabaseCleanup` lines `141-155`, SHA-256 `3426f30a61e5e1300b640ca7b242949e7b2627274a399db815ddc40de79976a9`. The managed integration checks only the selected database identity and then reports leakedDatabases=0 without enumerating owned databases/resources.

**Preconditions.** Actual child processes, leases, temporary files/directories, or disposable databases remain, while the caller passes zero/empty values or uses defaults.

**Trigger.** Create cleanup evidence and then finalize or validate acceptance.

**Expected behavior.** Cleanup proof must be generated by authoritative bounded enumeration of every campaign-owned resource and bind each observed resource to the campaign generation.

**Current behavior.** Zero/empty caller values produce verified=true even when unobserved leaks exist.

**Impact.** Leaked processes, leases, databases, and files can survive an accepted campaign and contaminate later tests or production operation.

**Evidence.** The exact branch model supplies zero/empty values while modeling real unobserved leaks; verified remains true.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_BRANCH_MODEL", "runtime": "Python source model; direct TS harness unavailable due external loader resolution", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Self-reported zero values produce verified=true without scans."}`

**Transaction/state-machine analysis.** UNVERIFIED_RESOURCES -> CALLER_SAYS_ZERO -> CLEANUP_VERIFIED has no observation or ownership-discovery transition.

**Root cause.** Cleanup status is an assertion supplied by the same caller being evaluated, not an independently measured receipt.

**Minimal fix boundary.** Move enumeration into trusted operations: query generation-bound process ownership, durable leases, campaign directories, disposable database registry, and temp artifacts; hash the inventory and require zero residuals before verified=true.

**Required tests**

- hidden process with empty caller list
- hidden lease
- remaining file inside declared temp directory
- extra campaign-owned database
- resource created after scan before final commit
- cleanup scan permissions failure

**Regression risks**

- Enumeration must remain confined to campaign-owned resources and must not delete unrelated state.
- R03/R06/R08 own lower-level ownership and cleanup mechanisms.

**Primary owner.** R09

**Secondary sectors.** R03, R06, R07, R08, R10, R11

**Aliases or dependencies**

- BWS118-R06-004/-005/-011/-013 own process cleanup and shutdown defects.
- R08 owns database lifecycle cleanup implementation.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-018: External preflight promotes schema-shaped soak state without consuming the soak result or validation verdict

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/external-runtime-preflight.ts::createBwsExternalRuntimeCampaignManifest / validateSoakEvidence / readSoakCheckpointFile`
- **Exact line range:** `260-267; 529-585; 803-824`
- **Primary full-file SHA-256:** `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- **Release/upgrade/soak object:** BWS-600 external-runtime promotion gate

**Current source evidence**

- `packages/bootstrap/src/operations/external-runtime-preflight.ts::createBwsExternalRuntimeCampaignManifest` lines `260-267`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. The gate reads only soak manifest and state files, not soak-result.json or soak-validation.json.
- `packages/bootstrap/src/operations/external-runtime-preflight.ts::validateSoakEvidence` lines `529-585`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. Selected manifest/state fields and the last checkpoint classification/status are checked, but no full checkpoint chain, artifact archive, failure matrix, observation semantics, or validation.ok is consumed.
- `packages/bootstrap/src/operations/external-runtime-preflight.ts::readSoakStateFile / readSoakCheckpointFile` lines `803-824`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. Readers validate only top-level schema before casting to the expected shape.

**Preconditions.** Schema-shaped soak manifest/state/cleanup checkpoint documents exist with plausible counts and runtimeEvidence, but the campaign result is absent, invalid, tampered, or never passed validation.

**Trigger.** Create the external runtime campaign manifest.

**Expected behavior.** Promotion must require the exact successful soak result and validator output, bind their hashes and campaign fingerprint, and independently verify critical terminal invariants.

**Current behavior.** The preflight can pass without any result or validation artifact and without verifying the checkpoint fingerprint/chain.

**Impact.** Fabricated or partial soak state can unblock BWS-600 even when failures, observations, cleanup, or artifact integrity did not pass.

**Evidence.** The source-dataflow model supplies only manifest, state, and one cleanup checkpoint; promotion remains reachable.

**Reproduction status.** `{"status": "REPRODUCED_BY_SOURCE_DATAFLOW", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Promotion does not require result or validation files."}`

**Transaction/state-machine analysis.** SOAK_STATE_SHAPED -> EXTERNAL_CAMPAIGN_READY bypasses SOAK_RESULT_COMPLETE and SOAK_VALIDATION_OK.

**Root cause.** The promotion gate reimplements a weak subset of soak checks instead of consuming the canonical validated terminal receipt.

**Minimal fix boundary.** Require exact soak manifest/result/validation hashes, validation.ok=true, full campaign fingerprint parity, terminal checkpoint chain verification, and all failure/observation/cleanup gates before external campaign creation.

**Required tests**

- missing soak result
- validation.ok=false
- tampered checkpoint fingerprint
- missing required failure recovery
- result/manifest mismatch
- artifact archive digest mismatch

**Regression risks**

- Avoid circular trust: external preflight should still verify essential bindings rather than trusting one boolean alone.
- R07 owns evidence artifact publication and hash identity.

**Primary owner.** R09

**Secondary sectors.** R07, R11

**Aliases or dependencies**

- BWS120-R09-012 through -017 are upstream soak defects consumed by this promotion bypass.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-019: External campaign identity omits the environment file bytes

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/external-runtime-preflight.ts::createBwsExternalRuntimeCampaignManifest semantic fingerprint descriptor`
- **Exact line range:** `267-280; 332-407`
- **Primary full-file SHA-256:** `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`
- **Release/upgrade/soak object:** Environment and release promotion identity

**Current source evidence**

- `packages/bootstrap/src/operations/external-runtime-preflight.ts::environment read and manifest descriptor` lines `267-280; 332-407`, SHA-256 `724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427`. The environment is validated and selected fields are derived, but the semantic fingerprint contains only envFile path and derived public fields, not an exact secret-safe environment receipt/digest.

**Preconditions.** The private environment file changes in place after preflight, including database or upstream/runtime values not fully represented in the descriptor.

**Trigger.** Reuse the external campaign manifest or compare identities before/after mutation.

**Expected behavior.** Campaign identity must bind the exact effective configuration used by the lifecycle, persistence, and upstream clients, without exposing secrets.

**Current behavior.** Changing file bytes at the same path can leave the semantic fingerprint unchanged.

**Impact.** The same campaign identity can execute against a different database, credentials, timeout/retry tuple, or other runtime configuration than the one reviewed.

**Evidence.** The exact descriptor model changes environment bytes under the same path and produces the same fingerprint.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_DESCRIPTOR_MODEL", "runtime": "Python source model", "harness": "/mnt/data/bws120-r09-work/adversarial_models.py", "result": "Environment byte change does not alter campaign semantic fingerprint."}`

**Transaction/state-machine analysis.** PREFLIGHT(config A) -> ENV_MUTATED(config B) -> RUN(campaign identity A) is not detected.

**Root cause.** The campaign descriptor records a mutable path and partial projections rather than an immutable effective-configuration receipt.

**Minimal fix boundary.** Generate a restricted, secret-safe canonical configuration receipt that covers every effective value and source/precedence decision, bind its digest into the manifest, and revalidate it at campaign start.

**Required tests**

- database name/host/user change
- upstream URL/checkpoint change
- timeout/retry change
- secret-only change with protected digest
- environment path symlink/replacement after preflight

**Regression risks**

- Configuration digest artifacts must have restrictive permissions and must not reveal low-entropy secrets.
- R10 owns repository-wide precedence and secret handling.

**Primary owner.** R09

**Secondary sectors.** R01, R03, R10, R11

**Aliases or dependencies**

- BWS116-R01-007 owns aggregate upstream timeout/retry semantics.
- R10 remains owner of environment tuple/precedence.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-020: Final recovery evidence combines unrelated schema-shaped artifacts without common byte or generation binding

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceRecoveryResult`
- **Exact line range:** `534-657`
- **Primary full-file SHA-256:** `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- **Release/upgrade/soak object:** Upgrade, rollback, backup/restore, retention, and interrupted-recovery acceptance bundle

**Current source evidence**

- `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceRecoveryResult` lines `534-657`, SHA-256 `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`. The function schema/status-checks several files, verifies fingerprint parity only for the successful plan/result pair, and fingerprints mutable file paths plus one plan fingerprint rather than every artifact byte and common generation identity.
- `tests/bws-final-local-acceptance.test.ts::final recovery evidence focused test` lines `211-238`, SHA-256 `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`. The passing test uses independent schema-shaped fixtures and checks only selected output fields.

**Preconditions.** Evidence files from different plans, releases, databases, backups, or generations satisfy the individually checked statuses and schemas.

**Trigger.** Create the final recovery result.

**Expected behavior.** Every artifact must be byte-hashed and relationally bound to one release pair, plan, database identity, backup, runtime generation, and exercise run.

**Current behavior.** Unrelated evidence can be combined; later byte replacement at the same path does not change the result semantic fingerprint.

**Impact.** The final gate can claim successful upgrade, failed readiness, rollback allowed/blocked, restore, retention, and interruption coverage even though those records did not belong to one coherent exercise.

**Evidence.** The exact descriptor model mutates artifact bytes at unchanged paths and retains the same fingerprint; the focused test passes disconnected fixtures.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_DESCRIPTOR_MODEL_AND_FOCUSED_TEST", "runtime": "Node v22.16.0 supplementary plus Python model", "harness": "/mnt/data/bws120-r09-work/final-acceptance-focused.out", "result": "Schema-shaped independent fixtures pass and path-based fingerprint remains stable across byte changes."}`

**Transaction/state-machine analysis.** EVIDENCE_A + EVIDENCE_B + ... -> RECOVERY_ACCEPTED lacks one shared exercise/generation identity and hash-linked graph.

**Root cause.** The composition step validates local shape/status but not cross-artifact provenance or immutable bytes.

**Minimal fix boundary.** Bind each component hash and evidence identity into a versioned recovery graph; require exact common plan/release/database/backup/runtime/exercise identifiers and recompute all hashes at composition.

**Required tests**

- mix successful result from plan A with failed result from plan B
- different database backup/restore
- artifact replacement after read
- different target release fingerprints
- retention plan from unrelated backup

**Regression risks**

- Existing artifacts may lack common IDs and need to remain historical/non-promotable.
- Do not duplicate R08 backup/restore correctness; verify its receipts and relationships here.

**Primary owner.** R09

**Secondary sectors.** R07, R08, R11

**Aliases or dependencies**

- R08 owns backup/restore/retention operations.
- BWS120-R09-005 through -011 own upgrade evidence production defects.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

### BWS120-R09-021: Final acceptance trusts a caller-supplied archive digest and mutable component paths

- **Severity:** P1
- **Confidence:** HIGH
- **Classification:** CONFIRMED_FINDING
- **Primary path and symbol:** `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceManifest`
- **Exact line range:** `694-830`
- **Primary full-file SHA-256:** `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`
- **Release/upgrade/soak object:** Final local acceptance manifest and artifact archive identity

**Current source evidence**

- `packages/bootstrap/src/operations/final-local-acceptance.ts::createBwsFinalLocalAcceptanceManifest` lines `694-830`, SHA-256 `1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5`. The archive SHA is accepted as a caller string with no archive path/open/hash; component files are referenced by mutable paths/selected fields; soakValidation.ok is not required.
- `tests/bws-final-local-acceptance.test.ts::final acceptance manifest focused test` lines `240-287`, SHA-256 `c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d`. The passing test supplies an arbitrary 64-hex string as the archive digest and schema-shaped documents, then expects acceptance.

**Preconditions.** The caller supplies any valid-looking 64-hex digest, component files pass limited schema/field checks, or component bytes later change at the same paths.

**Trigger.** Create the final local acceptance manifest.

**Expected behavior.** Final acceptance must hash the actual immutable archive, hash every component artifact, require each validator verdict including soakValidation.ok=true, and commit one immutable acceptance bundle.

**Current behavior.** No archive is opened; arbitrary digest text is accepted. Component byte hashes are absent from the semantic fingerprint, and a false/missing soak-validation verdict can pass if its artifact digest field matches.

**Impact.** An acceptance manifest can attest to a nonexistent or different archive and can become detached from its component evidence after creation.

**Evidence.** The exact descriptor model and the focused test both accept an arbitrary repeated-1 digest and mutable path-based evidence.

**Reproduction status.** `{"status": "REPRODUCED_BY_EXACT_DESCRIPTOR_MODEL_AND_FOCUSED_TEST", "runtime": "Node v22.16.0 supplementary plus Python model", "harness": "/mnt/data/bws120-r09-work/final-acceptance-focused.out", "result": "Arbitrary digest and schema-shaped fixtures produce accepted manifest."}`

**Transaction/state-machine analysis.** COMPONENTS_SHAPED + CALLER_DIGEST -> FINAL_ACCEPTED bypasses ARCHIVE_HASHED, COMPONENT_HASH_GRAPH_VERIFIED, and ALL_VALIDATORS_OK.

**Root cause.** The final manifest is a caller-composed summary rather than an independently verified immutable acceptance transaction.

**Minimal fix boundary.** Require an actual archive path, recompute its SHA-256, enumerate and hash every component, verify every explicit ok/status field, bind a common generation/exercise graph, publish into an immutable directory, and atomically commit one final receipt.

**Required tests**

- wrong archive bytes with claimed digest
- nonexistent archive
- soakValidation.ok=false
- component mutation after finalization
- component from different campaign
- atomic final-bundle publication failure

**Regression risks**

- Final bundle production must preserve prior accepted bundles and avoid path-only mutable pointers.
- R07/R24 publication mechanics require explicit coordination.

**Primary owner.** R09

**Secondary sectors.** R07, R11, R24

**Aliases or dependencies**

- BWS120-R09-004 owns release publication transactionality.
- BWS120-R09-018 owns the earlier external soak-promotion bypass.

**Explicitly unchanged areas**

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.

**Blocking.** release=true, BWS-600=true, B1=true, deployment=true.

## Hypotheses and environment blockers

- **BWS120-R09-HYP-001 — Archive extraction-before-validation may remain platform-dependent.** NOT_CONFIRMED_ON_GNU_TAR_1_35 GNU tar rejected the bounded ../ traversal archive and symlink-pivot archive before an outside write. Other tar implementations/platforms were not available. Required proof: Run the exact extractor and command arguments on every supported deployment platform with traversal, absolute path, hard-link, symlink-pivot, duplicate, and special-entry archives.
- **BWS120-R09-HYP-002 — Directory writability checks may be false-positive under privilege or ACL differences.** STATIC_SUSPICION_NOT_DYNAMICALLY_PROVEN ensureDirectoryWritable creates/stat-checks directories but the review ran as a privileged container user, making permission falsification unreliable. Required proof: Run as the actual service user against read-only, ACL-denied, NFS, and mount-policy variants.
- **BWS120-R09-HYP-003 — Node engine validation uses a substring rather than a semantic range parser.** CURRENT_PACKAGE_NOT_TRIGGERED assertNodeEngineRange accepts any string containing 20. Current package.json is >=20 <21, so no current release failure was confirmed. Required proof: Mutation tests using misleading engine strings and a decision on exact allowed range semantics.
- **BWS120-R09-ENV-001 — Canonical Node 20.20.2 unavailable.** All Node 22 test observations are supplementary and cannot establish canonical acceptance.
- **BWS120-R09-ENV-002 — Local PostgreSQL/psql unavailable.** No disposable upgrade/migration/restore transaction was executed.
- **BWS120-R09-ENV-003 — Repository dependencies/build and generated upstream lock unavailable.** The broad focused test command had 48 environment/fixture failures, one skip, and no confirmed product assertion failure.
- **BWS120-R09-ENV-004 — Systemd and multi-hour managed soak unavailable/prohibited.** No real service restart, systemd, two-hour soak, or upgrade was run under the read-only safety contract.

## Intentional safeguards and rejected suspicions

- **BWS120-R09-SAFE-001 — Release staging and extraction enforce repository/path confinement and reject symlinks.** Path normalization, boundary checks, lstat checks, and archive-member type validation are present. The bounded traversal and symlink-pivot tar tests were rejected.
- **BWS120-R09-SAFE-002 — Release archive creation uses deterministic tar metadata and a published checksum.** createDeterministicArchive normalizes ordering/metadata and the archive SHA file is generated. Findings concern optional verification and publication atomicity, not absence of deterministic construction.
- **BWS120-R09-SAFE-003 — Upgrade apply and recovery require explicit intent tokens.** apply requires explicitIntent=apply and recovery requires explicitIntent=recover. This blocks accidental invocation but does not fix plan identity or concurrency.
- **BWS120-R09-SAFE-004 — Upgrade planning includes backup, restore, migration, policy, and compatibility gates.** The plan rejects several incompatible database/release/rollback states. R03/R08 defects and R09 binding gaps remain separate.
- **BWS120-R09-SAFE-005 — Managed soak runner rejects missing explicit fault and database-cleanup integrations.** runBwsSoakCampaignRuntime rejects an empty failure schedule and missing executeFailure/verifyDatabaseCleanup dependencies.
- **BWS120-R09-SAFE-006 — Managed soak runner performs real interval sleeps and records wall-clock evidence.** The managed runtime path sleeps per observation and updates elapsedWallClockMs/observationCount. The synthetic execute path remains independently promotable.
- **BWS120-R09-SAFE-007 — Release and promotion policy keeps provider connections and execution closed.** Release, external-preflight, and final-acceptance paths require runtimeMode=paper, providerConnections=disabled, and executionEnabled=false.
- **BWS120-R09-SAFE-008 — Soak checkpoint validation requires a gap-free sequence and terminal cleanup checkpoint.** The validator checks sequence numbers, campaign_initialized first, campaign_completed, and cleanup_verified terminal. Findings concern semantic and restart gaps beyond this safeguard.
- **BWS120-R09-REJ-001 — GNU tar traversal extraction writes outside the destination.** GNU tar 1.35 exited 2 and created no outside file for the bounded ../ member archive. REJECTED_FOR_TESTED_ARCHIVE
- **BWS120-R09-REJ-002 — GNU tar symlink-pivot extraction writes through a prior symlink member.** GNU tar 1.35 exited 2 and created no outside file for the bounded symlink-pivot archive. REJECTED_FOR_TESTED_ARCHIVE
- **BWS120-R09-REJ-003 — The deterministic archive builder is inherently nondeterministic.** The builder normalizes sort order, ownership, timestamps, and compression inputs. The confirmed defects are content closure, optional verification, and multi-target publication. REJECTED_BY_SOURCE_INSPECTION
- **BWS120-R09-REJ-004 — R09 paths enable provider access or live execution.** Reviewed release/promotion policies retain providerConnections=disabled and executionEnabled=false; no provider or financial action was invoked. REJECTED

## Cross-area handoffs

- **BWS120-R09-HANDOFF-001 → R03: Migration application, psql cancellation, and database transaction correctness.** Dependencies: BWS116-R03-003, BWS116-R03-004, BWS116-R03-005, BWS116-R03-011, BWS116-R03-013. R09 must consume corrected database receipts but does not duplicate persistence root causes.
- **BWS120-R09-HANDOFF-002 → R06: Process ownership, exact generation, readiness, shutdown, and partial-start cleanup.** Dependencies: BWS118-R06-001, BWS118-R06-002, BWS118-R06-003, BWS118-R06-004, BWS118-R06-006, BWS118-R06-007, BWS118-R06-009, BWS118-R06-010, BWS118-R06-011, BWS118-R06-012, BWS118-R06-013. Upgrade/soak must consume exact lifecycle receipts after R06 correction.
- **BWS120-R09-HANDOFF-003 → R07: Evidence index, immutable artifact hashes, self-reference, and atomic publication.** Dependencies: none. R09 identifies required evidence relationships; R07 owns evidence publication/index mechanics.
- **BWS120-R09-HANDOFF-004 → R08: Backup, restore, retention, and disposable-resource recovery truth.** Dependencies: none. R09 must require exact R08 receipts but not reimplement backup/restore correctness.
- **BWS120-R09-HANDOFF-005 → R10: Environment tuple, precedence, secrets, path permissions, and CLI authority.** Dependencies: none. R09 requires an immutable secret-safe effective-configuration receipt.
- **BWS120-R09-HANDOFF-006 → R11: Aggregate tests, validators, fixtures, source manifest, and false-green final assurance.** Dependencies: KNOWN_BASELINE_MANIFEST_DRIFT. R11 must prove the corrected R09 paths and close the known manifest drift.
- **BWS120-R09-HANDOFF-007 → R01: Upstream retry/timeout and external API runtime authority.** Dependencies: BWS116-R01-007. External campaign identity must consume, not redefine, corrected upstream client authority.
- **BWS120-R09-HANDOFF-008 → R12: Controller invocation, artifact cleanup, and campaign finalization.** Dependencies: none. R12 owns autonomous controller behavior around these release/soak operations.
- **BWS120-R09-HANDOFF-009 → R24-equivalent publication concern / R07 in this BWS program: Release and handoff publication identity.** Dependencies: none. BWS has no separate completed R24 sector; publication concerns remain explicit for R07/R11/R12 consolidation.

## Test gaps

- **BWS120-R09-TG-001:** Negative install verification for incompatible Node, psql, and missing server proof.
- **BWS120-R09-TG-002:** Promotable install/upgrade rejection when archive verification is absent.
- **BWS120-R09-TG-003:** Exact release path-set equality with undeclared/missing members.
- **BWS120-R09-TG-004:** Fault injection after every release publication step and overwrite preservation.
- **BWS120-R09-TG-005:** Upgrade plan content tamper and post-plan environment/release mutation.
- **BWS120-R09-TG-006:** Two-process apply/recover ownership and fencing.
- **BWS120-R09-TG-007:** Resolved-state cross-plan reuse and corrupted checkpoint-chain recovery.
- **BWS120-R09-TG-008:** Lifecycle outcome matrix for drain, start, target readiness, and rollback cleanup.
- **BWS120-R09-TG-009:** Target-specific failure injection for every soak matrix entry.
- **BWS120-R09-TG-010:** Crash at every fault/cycle checkpoint boundary and restart convergence.
- **BWS120-R09-TG-011:** Chunked/resumed soak cumulative validation.
- **BWS120-R09-TG-012:** Observation health/progress/resource threshold negatives.
- **BWS120-R09-TG-013:** External preflight rejects forged or unvalidated soak state.
- **BWS120-R09-TG-014:** Environment mutation after external manifest creation.
- **BWS120-R09-TG-015:** Measured resource cleanup instead of caller counters.
- **BWS120-R09-TG-016:** Cross-artifact final recovery provenance and final archive/component tamper.

## Validation performed

- Archive SHA/count/path/type/extraction reconciliation: passed.
- Exact non-documentation byte comparison with BWS118: passed.
- Repository validators: validate_repo, remaining operator runtime, B1 acceptance, node runtime loader, no-provider-connections, no-execution-paths, and full implementation program passed.
- Source manifest validator: failed only for the previously accepted `KNOWN_BASELINE_MANIFEST_DRIFT`; not assigned an R09 finding.
- Broad focused Node test command under Node 22: 65 tests, 16 pass, 48 environment/fixture failures caused by the absent generated upstream lock, one PostgreSQL skip, and zero established product assertion failures.
- Final-acceptance focused tests under Node 22: 2 of 2 passed; these positive tests are themselves evidence for findings 020 and 021 because they accept disconnected schema fixtures and an arbitrary digest.
- Fifteen bounded exact-branch/dataflow/interleaving models reproduced the central failure paths without contacting external systems.
- GNU tar 1.35 rejected the bounded traversal and symlink-pivot archives; those tested suspicions were rejected.

## Prioritized review-only remediation order

1. Make release install verification fail closed on exact archive identity and runtime/server compatibility (`001`–`003`).
2. Replace multi-target overwrite publication with one immutable atomic generation commit (`004`).
3. Make upgrade plans self-authenticating and rebind every byte/config/evidence input at apply (`005`–`006`).
4. Add one exclusive upgrade owner/fencing epoch and validated checkpoint-chain recovery (`007`–`009`).
5. Consume exact lifecycle stop/start/readiness receipts and fence partial targets before rollback (`010`–`011`).
6. Separate simulation soak from promotable managed-runtime soak (`012`).
7. Implement target-specific fault injectors and explicit observation/resource thresholds (`013`–`014`).
8. Repair crash/restart exactly-once semantics and cumulative result reconstruction (`015`–`016`).
9. Replace cleanup self-attestation with measured generation-bound inventories (`017`).
10. Require canonical soak result/validation and bind effective environment identity in external preflight (`018`–`019`).
11. Build a hash-linked final recovery graph and recompute the final artifact archive/component hashes (`020`–`021`).
12. After implementation, rerun all focused and aggregate gates under canonical Node 20.20.2 with disposable PostgreSQL and bounded service integration.

## Explicit unchanged areas

- No source, test, migration, schema, configuration, documentation, manifest, or archive member was modified.
- No provider, external API, account, credential, signer, wallet, deployed service, or persistent database was contacted.
- Execution, public signals, and live financial operations remain disabled and out of scope.
- BWS120 differs from BWS118 only through review documentation. No executable conclusion depends on the documentation rebase.
- BWS-600 remains externally blocked; no campaign was started.
- BWS-710 remains blocked on an accepted upstream B1 runtime resource.
- BWS-900 remains parked and unauthorized.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains assigned to R11 rather than duplicated in R09.
- No implementation prompt, overlay, patch, server command, or source change was produced.
