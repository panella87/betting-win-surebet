
# BWS-W3-T27 implementation packet

> Documentation status: `PROPOSED_NOT_ACTIVE` for T39 and `NOT_ADMITTED` for all tranches. This packet does not authorize source mutation.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T27
CAMPAIGN_ORDER: 26
STAGE: S3
PRIMARY_OWNER: R07
SECONDARY_REVIEWERS: R01, R03, R05, R06, R08, R11, R12
ISSUE_IDS: BWS120-R07-003, BWS120-R07-004, BWS120-R07-005, BWS120-R07-008, BWS120-R07-012, BWS120-R07-014
SEVERITY_COUNTS: {"P1": 5, "P2": 1}
DEPENDENCIES: T24, T26, T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; exact 771-member archive inventory; independently computed inventory digest=b81ff807e4c230bff96fe1fa58f73a2d4bac803ebd7fa58b843cdcb83499f7f0
CURRENT_SOURCE_PATH_CANDIDATES: docs/038_observability_metrics_and_evidence_contract.md, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/paper-runtime-evidence.ts, packages/bootstrap/src/operations/paper-runtime-handoff.ts
SYMBOLS_TO_REVERIFY: 26 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/observability.ts, packages/bootstrap/src/operations/paper-runtime-evidence.ts, packages/bootstrap/src/operations/paper-runtime-handoff.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``content-addressed artifact identity; atomic publication primitive``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 33 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 33 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 10 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 33}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: serialized create-or-compare index; immutable bytes or revalidation; monotonic currentness; reference-aware retention; version/latest transactional recovery
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": false, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T33 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `docs/038_observability_metrics_and_evidence_contract.md` | present=yes | sha256=b244f607ae9a2f03f808cf746aa820a263fb669dadcbc74c9ed5a6ec33b9e556 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/observability.ts` | present=yes | sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | present=yes | sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | present=yes | sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R07-003 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact | reviewed_line_range=L376-L408 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-003 | `packages/bootstrap/src/operations/observability.ts` | symbol=writeJsonFile | reviewed_line_range=L1057-L1062 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-003 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L376-L408 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-004 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact | reviewed_line_range=L376-L408 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-004 | `packages/bootstrap/src/operations/observability.ts` | symbol=readEvidenceIndexEntries / summarizeEntries | reviewed_line_range=L746-L780 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-004 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact / summarizeBwsEvidenceIndex | reviewed_line_range=L376-L417 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-004 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L376-L417 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-005 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact | reviewed_line_range=L376-L408 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-005 | `packages/bootstrap/src/operations/observability.ts` | symbol=summarizeEntries | reviewed_line_range=L746-L758 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-005 | `packages/bootstrap/src/operations/observability.ts` | symbol=readEvidenceIndexEntries | reviewed_line_range=L761-L780 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-005 | `packages/bootstrap/src/operations/observability.ts` | symbol=summarizeEntries / readEvidenceIndexEntries | reviewed_line_range=L746-L780 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-005 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L746-L780 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-008 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact | reviewed_line_range=L376-L408 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-008 | `packages/bootstrap/src/operations/observability.ts` | symbol=collectBwsDiagnosticsBundle | reviewed_line_range=L530-L592 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-008 | `docs/038_observability_metrics_and_evidence_contract.md` | symbol=Evidence index and retention contract | reviewed_line_range=L53-L57 | reviewed_sha256=b244f607ae9a2f03f808cf746aa820a263fb669dadcbc74c9ed5a6ec33b9e556
- BWS120-R07-008 | `packages/bootstrap/src/operations/observability.ts` | symbol=registerBwsEvidenceArtifact / collectBwsDiagnosticsBundle | reviewed_line_range=L376-L408; L530-L592 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-008 | `packages/bootstrap/src/operations/observability.ts` | symbol=None | reviewed_line_range=L376-L408; L530-L592 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-012 | `packages/bootstrap/src/operations/observability.ts` | symbol=collectBwsDiagnosticsBundle | reviewed_line_range=L530-L592 | reviewed_sha256=ab2024a942781e074e1d719a7d368814cf1173fb524c567d2d894ab2ef8c3923
- BWS120-R07-012 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=writeBwsPaperRuntimeEvidence | reviewed_line_range=L375-L404 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-012 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createBwsPaperRuntimeHandoff | reviewed_line_range=L104-L196 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-012 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest | reviewed_line_range=L414-L425 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R07-012 | `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | symbol=None | reviewed_line_range=L375-L404 | reviewed_sha256=d5ece548916a8de8d594fc1121468db2cf8a38d652ac813b458729df48047b7d
- BWS120-R07-014 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createBwsPaperRuntimeHandoff | reviewed_line_range=L186-L195 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-014 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=writeJsonAtomically | reviewed_line_range=L290-L312 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-014 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createBwsPaperRuntimeHandoff / writeJsonAtomically | reviewed_line_range=L186-L195; L290-L312 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-014 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=None | reviewed_line_range=L186-L195; L290-L312 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R07-003 — Evidence-index deduplication and latest-summary publication are not serialized across processes

- Severity: `P1`
- Current behavior: Concurrent publishers can both append an exact duplicate, overwrite each other’s latest summary with different snapshots, or fail on shared publication state. There is no sequence, lock, or compare-and-set authority.
- Expected behavior: Index append, exact duplicate suppression, and latest-summary advancement must be one serialized, crash-recoverable publication transaction.
- Invariant: Index append, exact duplicate suppression, and latest-summary advancement must be one serialized, crash-recoverable publication transaction.
- Root cause: Evidence publication is implemented as independent filesystem operations instead of a single-owner append protocol with a monotonic receipt.
- Trigger: Both processes read the pre-append index before either append/summary write completes.
- Minimal fix boundary: Add one repository-scoped publication lock or durable append repository, assign monotonic entry identity, make duplicate detection atomic, and derive latest.json from the committed append receipt.
- Regression risks:
- A new lock must not deadlock diagnostics or controllers; recovery must distinguish a live owner from stale ownership.

### BWS120-R07-004 — Indexed evidence can be mutated or deleted after registration without invalidating acceptance

- Severity: `P1`
- Current behavior: The index continues to report the old path/hash as recent evidence even when the path no longer exists or contains different bytes. Re-registering the same path with a new hash simply adds another entry.
- Expected behavior: Accepted evidence must be immutable by construction, content-addressed/copied to retained storage, or revalidated against its recorded hash and file identity whenever used as current/accepted evidence.
- Invariant: Accepted evidence must be immutable by construction, content-addressed/copied to retained storage, or revalidated against its recorded hash and file identity whenever used as current/accepted evidence.
- Root cause: The append-only metadata record is treated as immutability proof while the referenced artifact remains mutable path state.
- Trigger: Modify, replace, truncate, or delete the artifact after the index entry is written.
- Minimal fix boundary: Publish evidence to a non-replaceable content-addressed location or bind path inode/content to an immutable receipt; reject same-path content drift and verify existence/hash before acceptance and retention decisions.
- Regression risks:
- Copying large artifacts can increase disk use; use bounded streaming and reference-aware retention.

### BWS120-R07-005 — Evidence “latest” state is append-order state, not monotonic currentness

- Severity: `P1`
- Current behavior: The last appended line becomes current regardless of timestamp, runtime generation, source fingerprint, or campaign relationship.
- Expected behavior: Latest/current evidence must be selected by an explicit monotonic generation or campaign sequence with bounded clock validation and conflict rejection.
- Invariant: Latest/current evidence must be selected by an explicit monotonic generation or campaign sequence with bounded clock validation and conflict rejection.
- Root cause: Physical append position is used as currentness authority without a monotonic logical generation contract.
- Trigger: Append a valid entry whose createdAt/runtime generation is older, unrelated, or implausibly future relative to the current accepted entry.
- Minimal fix boundary: Add explicit campaign/runtime generation, monotonic sequence, bounded timestamp policy, and compare-and-set latest advancement. Preserve conflicting/out-of-order entries as historical without promoting them.
- Regression risks:
- Strict clocks can reject valid delayed uploads; currentness should use logical sequence and treat wall time as bounded evidence, not sole authority.

### BWS120-R07-008 — Retention classes are recorded but no reference-aware retention or pruning lifecycle is implemented

- Severity: `P2`
- Current behavior: Retention class values are written and displayed, but repository-wide tracing found no R07 retention planner/apply path for the observability index or diagnostics directories.
- Expected behavior: Every retention class must have an explicit plan/apply policy that protects accepted ledger rows, active runtimes, unresolved blockers, and retained handoffs while bounding disk/inode growth.
- Invariant: Every retention class must have an explicit plan/apply policy that protects accepted ledger rows, active runtimes, unresolved blockers, and retained handoffs while bounding disk/inode growth.
- Root cause: Retention metadata was implemented without the state machine that interprets it and proves reference safety.
- Trigger: Allow normal repeated evidence production over time.
- Minimal fix boundary: Add dry-run retention planning, immutable reference graph evaluation, bounded apply, interruption recovery, and post-apply index reconciliation. R08 owns generic backup/retention mechanics; R07 owns evidence reference semantics.
- Regression risks:
- Incorrect reference discovery can cause data loss; deletion must remain fail-closed and separately authorized.

### BWS120-R07-012 — Diagnostics, runtime-evidence, and handoff outputs bypass the canonical evidence index and publication transaction

- Severity: `P1`
- Current behavior: These artifacts are written independently. The index may know none of them, runtime-evidence output can replace an existing path, and no shared receipt proves the set completed together.
- Expected behavior: Every acceptance-relevant artifact set must be published once through the canonical index with exact hashes, dependencies, retention class, campaign/runtime generation, and an atomic completion receipt.
- Invariant: Every acceptance-relevant artifact set must be published once through the canonical index with exact hashes, dependencies, retention class, campaign/runtime generation, and an atomic completion receipt.
- Root cause: Core evidence producers implement file creation but not the repository’s declared evidence publication lifecycle.
- Trigger: Complete any diagnostics collection, paper runtime evidence run, or handoff creation.
- Minimal fix boundary: Create one R07 evidence-set transaction that stages immutable files, computes hashes, records dependency edges, appends one committed index receipt, and advances latest only after full verification. Refuse accidental overwrite.
- Regression risks:
- Changing paths can break operator tools; preserve stable aliases as verified pointers to immutable versioned artifacts.

### BWS120-R07-014 — Versioned handoff and latest pointer publish as two independent writes with no crash recovery or digest link

- Severity: `P1`
- Current behavior: The versioned handoff may exist while latest remains stale. Downstream readers have no authoritative way to distinguish an incomplete publication from a historical version.
- Expected behavior: Publish a versioned immutable handoff and its latest pointer under one recoverable transaction; latest must reference the exact version/hash and advance monotonically.
- Invariant: Publish a versioned immutable handoff and its latest pointer under one recoverable transaction; latest must reference the exact version/hash and advance monotonically.
- Root cause: Per-file atomic rename is incorrectly treated as multi-file publication atomicity.
- Trigger: Interrupt publication between the two calls.
- Minimal fix boundary: Add a handoff manifest/commit marker with version path+SHA, atomic compare-and-set latest pointer, and startup recovery. Preserve BWS118-R06-016 as the separate inherited filename-collision root.
- Regression risks:
- Recovery must not promote an uncommitted version merely because its filename sorts last.


## Allowed edit boundary

- Candidate path set: `docs/038_observability_metrics_and_evidence_contract.md`, `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/observability.ts`, `packages/bootstrap/src/operations/paper-runtime-evidence.ts`, `packages/bootstrap/src/operations/paper-runtime-handoff.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/observability.ts` | participating tranches=T22, T26, T27, T28 | predecessor postimage required
- `packages/bootstrap/src/operations/paper-runtime-evidence.ts` | participating tranches=T27, T28 | predecessor postimage required
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | participating tranches=T27, T29 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Artifact hash calculation
- Artifact payload schemas where otherwise valid
- Existing evidence bytes
- Historical evidence retention
- Original producer semantics
- Timestamp-collision root remains inherited
- all betting-win source, checkout, documentation, service, database, and runtime
- append-only audit history
- artifact JSON schemas
- backup-specific retention mechanics owned by R08
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- entry field schema
- exact artifact bytes
- external preflight semantic validation
- historical entries that remain byte-valid
- read-only summary API for a consistent committed index
- retentionClass vocabulary
- source archive bytes
- source archive content verification
- valid single handoff schema

## Prerequisites

- Dependency terminal receipts: T24, T26, T40.
- Review prerequisites: `content-addressed artifact identity; atomic publication primitive`.
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

- `BWS120-R07-003-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=Two-process exact-duplicate barrier test
- `BWS120-R07-003-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=two-process distinct-artifact barrier test
- `BWS120-R07-003-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=crash between append and summary
- `BWS120-R07-003-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=stale writer/CAS rejection
- `BWS120-R07-003-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=restart reconciliation from index
- `BWS120-R07-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=Post-registration mutation
- `BWS120-R07-004-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=post-registration deletion
- `BWS120-R07-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=same-path different-content conflict
- `BWS120-R07-004-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=content-address collision refusal
- `BWS120-R07-004-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=accepted-evidence revalidation
- `BWS120-R07-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=Backdated append
- `BWS120-R07-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=future-dated append
- `BWS120-R07-005-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=delayed old runtime append
- `BWS120-R07-005-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=cross-runtime conflict
- `BWS120-R07-005-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=same-sequence different-hash rejection
- `BWS120-R07-005-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=restart latest reconstruction
- `BWS120-R07-008-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=Plan/apply parity
- `BWS120-R07-008-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=active runtime protection
- `BWS120-R07-008-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=accepted handoff protection
- `BWS120-R07-008-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=unresolved blocker protection
- `BWS120-R07-008-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=interrupted pruning recovery
- `BWS120-R07-008-TEST-06` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=disk/inode bound soak
- `BWS120-R07-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=Each producer indexed exactly once
- `BWS120-R07-012-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=same-output collision
- `BWS120-R07-012-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=crash before/after each staged file
- `BWS120-R07-012-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=index append failure
- `BWS120-R07-012-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=restart reconciliation
- `BWS120-R07-012-TEST-06` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=retention reference graph
- `BWS120-R07-014-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=Crash after version write
- `BWS120-R07-014-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=crash during latest write
- `BWS120-R07-014-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=concurrent publishers
- `BWS120-R07-014-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=latest hash mismatch
- `BWS120-R07-014-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=recovery selects highest committed sequence

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R07-003-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=Two-process exact-duplicate barrier test
- `BWS120-R07-003-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=two-process distinct-artifact barrier test
- `BWS120-R07-003-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=crash between append and summary
- `BWS120-R07-003-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=stale writer/CAS rejection
- `BWS120-R07-003-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=restart reconciliation from index
- `BWS120-R07-004-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=Post-registration mutation
- `BWS120-R07-004-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=post-registration deletion
- `BWS120-R07-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=same-path different-content conflict
- `BWS120-R07-004-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=content-address collision refusal
- `BWS120-R07-004-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=accepted-evidence revalidation
- `BWS120-R07-005-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=Backdated append
- `BWS120-R07-005-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=future-dated append
- `BWS120-R07-005-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=delayed old runtime append
- `BWS120-R07-005-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=cross-runtime conflict
- `BWS120-R07-005-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=same-sequence different-hash rejection
- `BWS120-R07-005-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=restart latest reconstruction
- `BWS120-R07-008-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=Plan/apply parity
- `BWS120-R07-008-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=active runtime protection
- `BWS120-R07-008-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=accepted handoff protection
- `BWS120-R07-008-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=unresolved blocker protection
- `BWS120-R07-008-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=interrupted pruning recovery
- `BWS120-R07-008-TEST-06` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=disk/inode bound soak
- `BWS120-R07-012-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=Each producer indexed exactly once
- `BWS120-R07-012-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=same-output collision
- `BWS120-R07-012-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=crash before/after each staged file
- `BWS120-R07-012-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=index append failure
- `BWS120-R07-012-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=restart reconciliation
- `BWS120-R07-012-TEST-06` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=retention reference graph
- `BWS120-R07-014-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=Crash after version write
- `BWS120-R07-014-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=crash during latest write
- `BWS120-R07-014-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=concurrent publishers
- `BWS120-R07-014-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=latest hash mismatch
- `BWS120-R07-014-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=recovery selects highest committed sequence

## Negative and adversarial tests

- `BWS120-R07-003-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=Two-process exact-duplicate barrier test
- `BWS120-R07-003-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=stale writer/CAS rejection
- `BWS120-R07-004-TEST-03` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=same-path different-content conflict
- `BWS120-R07-004-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-004 | requirement=content-address collision refusal
- `BWS120-R07-012-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=same-output collision
- `BWS120-R07-014-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=latest hash mismatch

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R07-003-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=crash between append and summary
- `BWS120-R07-003-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-003 | requirement=restart reconciliation from index
- `BWS120-R07-005-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-005 | requirement=restart latest reconstruction
- `BWS120-R07-008-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-008 | requirement=interrupted pruning recovery
- `BWS120-R07-012-TEST-03` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=crash before/after each staged file
- `BWS120-R07-012-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-012 | requirement=restart reconciliation
- `BWS120-R07-014-TEST-01` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=Crash after version write
- `BWS120-R07-014-TEST-02` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=crash during latest write
- `BWS120-R07-014-TEST-03` | category=concurrency_or_ownership | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=concurrent publishers
- `BWS120-R07-014-TEST-05` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-014 | requirement=recovery selects highest committed sequence

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 33 requirements

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

Acceptance authority: serialized create-or-compare index; immutable bytes or revalidation; monotonic currentness; reference-aware retention; version/latest transactional recovery

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T33` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
