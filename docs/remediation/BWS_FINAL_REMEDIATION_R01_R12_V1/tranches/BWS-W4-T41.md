
# BWS-W4-T41 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W4-T41
CAMPAIGN_ORDER: 45
STAGE: S7
PRIMARY_OWNER: R11
SECONDARY_REVIEWERS: R01, R03, R06, R07, R08, R09, R10, R12
ISSUE_IDS: BWS121-R11-003, BWS121-R11-004, BWS121-R11-005, BWS121-R11-006
SEVERITY_COUNTS: {"P1": 4}
DEPENDENCIES: T36, T40
EXTERNAL_ACCEPTANCE_PENDING: no
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: backlog/bws_full_implementation.csv, package.json, packages/bootstrap/src/cli/bws-upstream-api-convergence.ts, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/upstream/src/upstream/betting-win-upstream-lock.ts, scripts/validate_api_only_upstream.py, scripts/validate_betting_win_upstream_contract.py, scripts/validate_bws_b1_acceptance.py, scripts/validate_full_implementation_program.py, scripts/validate_remaining_operator_runtime_program.py, src/upstream/betting-win-upstream-lock.ts, tests/api-only-upstream-contract.test.ts, tests/b1-runtime-evidence.test.ts, tests/betting-win-upstream-contract.test.ts
SYMBOLS_TO_REVERIFY: 15 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: package.json, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/upstream/src/upstream/betting-win-upstream-lock.ts, tests/b1-runtime-evidence.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites `all upstream tranches referenced by the affected findings; current-source re-verification before implementation`
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 18 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 18 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 6 classified records below
CONCURRENCY_OR_CRASH_TESTS: 0 classified records below
ENVIRONMENT_PROOF: {"AS_SPECIFIED_BY_REVIEW": 18}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: Production-entrypoint semantic validators replace token/status self-attestation.
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W4-T42 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `backlog/bws_full_implementation.csv` | present=yes | sha256=bc7380bc47db8aedace602eea5b8556d3afa28582f6e471d5d4353ccd73a4425 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `package.json` | present=yes | sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/cli/bws-upstream-api-convergence.ts` | present=yes | sha256=271a0e0fbf3c733fc502f8accd0a2a2067c70ce6086147994bb993bba83f8f7f | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | present=yes | sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | present=yes | sha256=8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_api_only_upstream.py` | present=yes | sha256=2600a915dd6d55cb67432c7ec2731d44794098d42310f5b6c7195c8d2e69f4f1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_betting_win_upstream_contract.py` | present=yes | sha256=931cd26b0530ee620ede9063a60fb75f3a5835f25860c8b2842f98950d283c54 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_bws_b1_acceptance.py` | present=yes | sha256=f31f3f38125c3c308859278c77eeebf0db0c6fd13a1adc88f7e7e3ca797394ca | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_full_implementation_program.py` | present=yes | sha256=5d81c01587b0b36713da90bf0226ac6c40cfaafbca8af2e6bdf3edd315a653bb | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `scripts/validate_remaining_operator_runtime_program.py` | present=yes | sha256=7c5c302de6ab4483ce21ab6602a5d31ca87c931b570f45184bdb722780ba1cc1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `src/upstream/betting-win-upstream-lock.ts` | present=yes | sha256=01fb9b916a76ce63729eab7426720573fc497c9f88cd296a467a9683ca58807d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/api-only-upstream-contract.test.ts` | present=yes | sha256=10fed128376e386dd0786dd06e4df1b06c712d96673f52a519c5aacdefb03a57 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/b1-runtime-evidence.test.ts` | present=yes | sha256=aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/betting-win-upstream-contract.test.ts` | present=yes | sha256=97ce19a53408d95bc7cc48fb58497fe82b8716067e1cdae1a7aebae32ac1c06d | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS121-R11-003 | `scripts/validate_betting_win_upstream_contract.py` | symbol=main | reviewed_line_range=170-184 | reviewed_sha256=931cd26b0530ee620ede9063a60fb75f3a5835f25860c8b2842f98950d283c54
- BWS121-R11-003 | `src/upstream/betting-win-upstream-lock.ts` | symbol=compatibility shim | reviewed_line_range=1-6 | reviewed_sha256=01fb9b916a76ce63729eab7426720573fc497c9f88cd296a467a9683ca58807d
- BWS121-R11-003 | `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | symbol=production implementation | reviewed_line_range=8-34 | reviewed_sha256=8c0badbfc3dc776eb71e01e1a76280debab30c64739274b06d1ce7343382a6c2
- BWS121-R11-003 | `tests/betting-win-upstream-contract.test.ts` | symbol=static validator wiring test | reviewed_line_range=137-155 | reviewed_sha256=97ce19a53408d95bc7cc48fb58497fe82b8716067e1cdae1a7aebae32ac1c06d
- BWS121-R11-004 | `scripts/validate_api_only_upstream.py` | symbol=CLI marker loop | reviewed_line_range=96-113 | reviewed_sha256=2600a915dd6d55cb67432c7ec2731d44794098d42310f5b6c7195c8d2e69f4f1
- BWS121-R11-004 | `packages/bootstrap/src/cli/bws-upstream-api-convergence.ts` | symbol=runBwsUpstreamApiConvergenceCli | reviewed_line_range=1-12 | reviewed_sha256=271a0e0fbf3c733fc502f8accd0a2a2067c70ce6086147994bb993bba83f8f7f
- BWS121-R11-004 | `tests/api-only-upstream-contract.test.ts` | symbol=static validator tests | reviewed_line_range=15-19; 65-76 | reviewed_sha256=10fed128376e386dd0786dd06e4df1b06c712d96673f52a519c5aacdefb03a57
- BWS121-R11-005 | `scripts/validate_bws_b1_acceptance.py` | symbol=main | reviewed_line_range=28-80 | reviewed_sha256=f31f3f38125c3c308859278c77eeebf0db0c6fd13a1adc88f7e7e3ca797394ca
- BWS121-R11-005 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=B1RuntimeAcceptanceDecision / decision | reviewed_line_range=84-96; 517-537 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS121-R11-005 | `tests/b1-runtime-evidence.test.ts` | symbol=flag assertions and sample evidence | reviewed_line_range=15-24; 262-272 | reviewed_sha256=aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435
- BWS121-R11-005 | `package.json` | symbol=validate:ops / validate:bws-b1 | reviewed_line_range=27; 69-70 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0
- BWS121-R11-006 | `scripts/validate_full_implementation_program.py` | symbol=EXPECTED_STATUS / main | reviewed_line_range=11-36; 133-177; 184-277 | reviewed_sha256=5d81c01587b0b36713da90bf0226ac6c40cfaafbca8af2e6bdf3edd315a653bb
- BWS121-R11-006 | `scripts/validate_remaining_operator_runtime_program.py` | symbol=VALIDATED_IDS / main | reviewed_line_range=9-18; 85-159 | reviewed_sha256=7c5c302de6ab4483ce21ab6602a5d31ca87c931b570f45184bdb722780ba1cc1
- BWS121-R11-006 | `backlog/bws_full_implementation.csv` | symbol=implementation status ledger | reviewed_line_range=1-43 | reviewed_sha256=bc7380bc47db8aedace602eea5b8556d3afa28582f6e471d5d4353ccd73a4425
- BWS121-R11-006 | `package.json` | symbol=validate:implementation-program / validate:remaining-runtime-program | reviewed_line_range=27; 64-66 | reviewed_sha256=b1b69ffa6d0b974c3b3ba55f3ec1acffb21e512c3a862e2a7b2d6b5139e5eac0

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS121-R11-003 — Upstream contract static validator proves comment markers in a shim instead of the production implementation

- Severity: `P1`
- Current behavior: The validator scans comment substrings in the six-line shim and never binds those markers to the package implementation.
- Expected behavior: The validator must inspect and behaviorally exercise the production implementation that generates and verifies the lock; comments and compatibility shims cannot satisfy executable invariants.
- Invariant: The validator must inspect and behaviorally exercise the production implementation that generates and verifies the lock; comments and compatibility shims cannot satisfy executable invariants.
- Root cause: The static proof is based on unparsed substring presence at a compatibility path rather than the executable symbol/call graph or bounded production behavior.
- Trigger: Run scripts/validate_betting_win_upstream_contract.py directly or through its static precheck.
- Minimal fix boundary: Point the validator at the production package path, eliminate comment markers as proof, and add bounded tests through the exported generator/verifier using adversarial Git fixtures. Keep the shim only as a compatibility re-export.
- Regression risks:
- Do not duplicate R01 lock-algorithm findings.
- Preserve offline disposable Git testing and no betting-win checkout mutation.

### BWS121-R11-004 — API-only validator accepts a named import or comment after the enforcement call is removed

- Severity: `P1`
- Current behavior: Any occurrence of the function name is accepted. A dead import, comment, or unreachable branch passes.
- Expected behavior: Every production CLI must prove that enforcement executes before parsing or performing work, and negative tests must invoke each entrypoint with retired/export selectors.
- Invariant: Every production CLI must prove that enforcement executes before parsing or performing work, and negative tests must invoke each entrypoint with retired/export selectors.
- Root cause: The validator proves lexical presence, not invocation, ordering, reachability, or fail-closed behavior.
- Trigger: Run scripts/validate_api_only_upstream.py.
- Minimal fix boundary: Add direct production-entrypoint tests for every CLI with stale selectors, or use an AST/call-graph check that proves an unconditional pre-work call. The static script must not treat imports or comments as enforcement.
- Regression risks:
- Entrypoint tests must remain inert and avoid provider, database, or service access.
- Do not move R01 configuration semantics into R11.

### BWS121-R11-005 — B1 acceptance validator treats status rows, test titles, and literal tokens as executable capability proof

- Severity: `P1`
- Current behavior: The script passes when the actual literal types and values are changed to enabled/allowed and the old strings remain in comments.
- Expected behavior: Acceptance proof must evaluate the production decision contract and behavior, not infer safety from literal tokens, test names, or a self-declared backlog status.
- Invariant: Acceptance proof must evaluate the production decision contract and behavior, not infer safety from literal tokens, test names, or a self-declared backlog status.
- Root cause: Acceptance authority is distributed across marker text, test-title text, command text, and mutable ledger status rather than one executed production contract.
- Trigger: Run scripts/validate_bws_b1_acceptance.py or validate:ops without the separate validate:bws-b1 focused test set.
- Minimal fix boundary: Make the accepted gate execute the production classifier under canonical Node, inspect exact returned no-live fields, validate the external receipt dependency, and treat backlog status only as routing metadata. Either include the focused gate in validate:ops or remove the static script as acceptance proof.
- Regression risks:
- Preserve the existing no-live types and negative focused tests.
- Do not duplicate the underlying B1 authority defect owned by R07.

### BWS121-R11-006 — Implementation-program validators can declare completion with the principal implementation trees absent

- Severity: `P1`
- Current behavior: Both validators return success after packages/bootstrap/src, packages/persistence/src, packages/upstream/src, and src are deleted from a disposable copy.
- Expected behavior: A completion validator must bind every VALIDATED task to exact production paths/symbols, focused tests, and immutable evidence, or be named and scoped only as a documentation/ledger consistency validator.
- Invariant: A completion validator must bind every VALIDATED task to exact production paths/symbols, focused tests, and immutable evidence, or be named and scoped only as a documentation/ledger consistency validator.
- Root cause: Implementation status is treated as an input assertion and checked for internal textual consistency, not derived from source/test/evidence closure.
- Trigger: Run either implementation-program validator.
- Minimal fix boundary: Split documentation consistency from implementation acceptance. Build a task-to-source-to-test-to-evidence map with exact hashes and require production-entrypoint execution before a task can be accepted as implemented.
- Regression risks:
- Do not turn historical documentation into executable routing authority.
- Task mapping must be maintainable and avoid one giant brittle marker list.


## Allowed edit boundary

- Candidate path set: `backlog/bws_full_implementation.csv`, `package.json`, `packages/bootstrap/src/cli/bws-upstream-api-convergence.ts`, `packages/bootstrap/src/operations/b1-runtime-evidence.ts`, `packages/upstream/src/upstream/betting-win-upstream-lock.ts`, `scripts/validate_api_only_upstream.py`, `scripts/validate_betting_win_upstream_contract.py`, `scripts/validate_bws_b1_acceptance.py`, `scripts/validate_full_implementation_program.py`, `scripts/validate_remaining_operator_runtime_program.py`, `src/upstream/betting-win-upstream-lock.ts`, `tests/api-only-upstream-contract.test.ts`, `tests/b1-runtime-evidence.test.ts`, `tests/betting-win-upstream-contract.test.ts`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `package.json` | participating tranches=T21, T38, T40, T41, T42, T43 | predecessor postimage required
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | participating tranches=T17, T29, T41 | predecessor postimage required
- `packages/upstream/src/upstream/betting-win-upstream-lock.ts` | participating tranches=T02, T41 | predecessor postimage required
- `tests/b1-runtime-evidence.test.ts` | participating tranches=T29, T41 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- All adversarial mutations were confined to disposable copies outside the extracted review tree.
- Execution, public signals, profitability claims, live writes, and financial operations remain prohibited and unchanged.
- No persistent database was contacted or mutated; no service, controller, scheduler, worker, or automation process was started.
- No provider, external API, account, credential, signer, wallet, deployed service, or betting-win checkout was contacted.
- No source, test, fixture, migration, schema, configuration, documentation, manifest, or archive member was modified.
- all betting-win source, checkout, documentation, service, database, and runtime
- betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds

## Prerequisites

- Dependency terminal receipts: T36, T40.
- Review prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation.
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

- `BWS121-R11-REQ-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Comments containing all required markers must fail
- `BWS121-R11-REQ-010` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Production implementation missing must fail before build
- `BWS121-R11-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Compiling implementation that omits one Git operation must fail behaviorally
- `BWS121-R11-REQ-012` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Production export and compatibility shim resolve to the same tested functions
- `BWS121-R11-REQ-013` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Remove call but keep import negative case
- `BWS121-R11-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Move call after work negative case
- `BWS121-R11-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Place call in unreachable branch negative case
- `BWS121-R11-REQ-016` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Invoke all production CLIs with each retired selector
- `BWS121-R11-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Ensure help/status semantics remain intentionally defined
- `BWS121-R11-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Capability flag escalation with comment markers
- `BWS121-R11-REQ-019` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Backlog VALIDATED with failed/missing focused tests
- `BWS121-R11-REQ-020` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Forged accepted input-source enum and repeated hashes per BWS120-R07-018
- `BWS121-R11-REQ-021` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Canonical Node 20.20.2 focused B1 gate
- `BWS121-R11-REQ-022` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Static validator cannot pass on comments alone
- `BWS121-R11-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Delete or rename each task-owned production file and require failure
- `BWS121-R11-REQ-024` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Keep status VALIDATED while focused test fails and require failure
- `BWS121-R11-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Change source bytes without updating task proof and require failure
- `BWS121-R11-REQ-026` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=No task may validate solely from marker/title/status text

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS121-R11-REQ-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Comments containing all required markers must fail
- `BWS121-R11-REQ-010` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Production implementation missing must fail before build
- `BWS121-R11-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Compiling implementation that omits one Git operation must fail behaviorally
- `BWS121-R11-REQ-012` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Production export and compatibility shim resolve to the same tested functions
- `BWS121-R11-REQ-013` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Remove call but keep import negative case
- `BWS121-R11-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Move call after work negative case
- `BWS121-R11-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Place call in unreachable branch negative case
- `BWS121-R11-REQ-016` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Invoke all production CLIs with each retired selector
- `BWS121-R11-REQ-017` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Ensure help/status semantics remain intentionally defined
- `BWS121-R11-REQ-018` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Capability flag escalation with comment markers
- `BWS121-R11-REQ-019` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Backlog VALIDATED with failed/missing focused tests
- `BWS121-R11-REQ-020` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Forged accepted input-source enum and repeated hashes per BWS120-R07-018
- `BWS121-R11-REQ-021` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Canonical Node 20.20.2 focused B1 gate
- `BWS121-R11-REQ-022` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-005 | requirement=Static validator cannot pass on comments alone
- `BWS121-R11-REQ-023` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Delete or rename each task-owned production file and require failure
- `BWS121-R11-REQ-024` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Keep status VALIDATED while focused test fails and require failure
- `BWS121-R11-REQ-025` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=Change source bytes without updating task proof and require failure
- `BWS121-R11-REQ-026` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-006 | requirement=No task may validate solely from marker/title/status text

## Negative and adversarial tests

- `BWS121-R11-REQ-009` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Comments containing all required markers must fail
- `BWS121-R11-REQ-010` | category=assurance_or_build | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Production implementation missing must fail before build
- `BWS121-R11-REQ-011` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-003 | requirement=Compiling implementation that omits one Git operation must fail behaviorally
- `BWS121-R11-REQ-013` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Remove call but keep import negative case
- `BWS121-R11-REQ-014` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Move call after work negative case
- `BWS121-R11-REQ-015` | category=unit_or_contract | environment=AS_SPECIFIED_BY_REVIEW | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS121-R11-004 | requirement=Place call in unreachable branch negative case

## Concurrency, cancellation, crash, and restart tests

- No separately classified record

## Environment proof

- AS_SPECIFIED_BY_REVIEW: 18 requirements

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

Acceptance authority: Production-entrypoint semantic validators replace token/status self-attestation.

Allowed terminal states: `ACCEPTED`, `BLOCKED`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W4-T42` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
