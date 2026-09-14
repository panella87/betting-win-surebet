
# BWS-W3-T29 implementation packet

> Current campaign state: `NOT_ADMITTED`. This packet defines future scope only; source mutation is prohibited until the active launcher admits this exact tranche after all dependencies are accepted.

## Canonical packet fields

```text
TRANCHE_ID: BWS-W3-T29
CAMPAIGN_ORDER: 40
STAGE: S5
PRIMARY_OWNER: R07
SECONDARY_REVIEWERS: R01, R02, R03, R04, R06, R09, R10, R11, R12
ISSUE_IDS: BWS120-R07-013, BWS120-R07-015, BWS120-R07-016, BWS120-R07-017, BWS120-R07-018, BWS120-R07-019
SEVERITY_COUNTS: {"P1": 5, "P2": 1}
DEPENDENCIES: T27, T28, T47
EXTERNAL_ACCEPTANCE_PENDING: yes
CURRENT_SOURCE_AUTHORITY: frozen application-source baseline betting-win-surebet122.zip sha256=e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd; documentation-audit preimage betting-win-surebet125.zip sha256=72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f with 995 regular files and no accepted remediation source result; this overlay changes documentation only; exact checkout/Git/source state must be reverified before editing
CURRENT_SOURCE_PATH_CANDIDATES: .automation/lib/controller_hardening_v2.sh, check_progress.sh, docs/041_external_runtime_preflight_and_bws600_campaign.md, open_log.sh, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, packages/bootstrap/src/operations/paper-runtime-handoff.ts, run-paper-autopilot.sh, run-paper-evaluation.sh, tests/b1-runtime-evidence.test.ts, tests/bws-final-local-acceptance.test.ts, watch_progress.sh
SYMBOLS_TO_REVERIFY: 31 detailed records below
ALLOWED_EDIT_BOUNDARY: listed current paths are candidates only; exact set TO_CONFIRM_DURING_ADMISSION after current-source reverification
READ_ONLY_SHARED_PATHS: .automation/lib/controller_hardening_v2.sh, open_log.sh, packages/bootstrap/src/operations/b1-runtime-evidence.ts, packages/bootstrap/src/operations/external-runtime-preflight.ts, packages/bootstrap/src/operations/final-local-acceptance.ts, packages/bootstrap/src/operations/paper-runtime-handoff.ts, run-paper-autopilot.sh, run-paper-evaluation.sh, tests/b1-runtime-evidence.test.ts, tests/bws-final-local-acceptance.test.ts
PROHIBITED_PATHS: all paths outside exact admission; betting-win; runtime/config/secret/database/service/deployment paths not explicitly admitted
UNCHANGED_AUTHORITIES: campaign membership/dependencies/owner/holds/betting-win prohibition and detailed unchanged areas below
INVARIANTS: one invariant per finding below
ROOT_CAUSES: one root cause per finding below
TRIGGERS: one trigger per finding below
CURRENT_BEHAVIOR: one current behavior per finding below
EXPECTED_BEHAVIOR: one expected behavior per finding below
MINIMAL_FIX_BOUNDARY: one minimal boundary per finding below; no unrelated refactor
PREREQUISITES: dependencies plus review prerequisites ``T27; T28; accepted external campaign manifest authority``
CURRENT_SOURCE_REVERIFICATION_PROCEDURE: execute the bounded checklist below before editing; moved/resolved/contradicted source blocks the tranche
IMPLEMENTATION_TASK_BREAKDOWN: reverify, decide exact contract, capture preimage, implement minimal coherent boundary, execute bound proof, issue receipts
FAIL_CLOSED_REQUIREMENTS: missing/blank/null/unknown/conflicting authority or evidence blocks; no inferred pass
NO_DEFAULT_OR_FALLBACK_REQUIREMENTS: no silent config, source, environment, external-evidence, fixture, marker, or status fallback
FOCUSED_TESTS: 37 exact requirement records below
PRODUCTION_ENTRYPOINT_TESTS: 37 exact requirement records below
NEGATIVE_AND_ADVERSARIAL_TESTS: 11 classified records below
CONCURRENCY_OR_CRASH_TESTS: 1 classified records below
ENVIRONMENT_PROOF: {"NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION": 37}
NODE_RUNTIME_REQUIREMENT: v20.20.2 exact for Node evidence; Node 22 is supplementary only
ROLLBACK_AND_RECOVERY_PLAN: restore every changed preimage byte/mode, remove only transaction-owned additions, verify unchanged authority, emit rollback receipt
PREIMAGE_RECEIPT_REQUIREMENTS: detailed list below
POSTIMAGE_RECEIPT_REQUIREMENTS: detailed list below
TEST_RECEIPT_REQUIREMENTS: detailed list below
ENVIRONMENT_RECEIPT_REQUIREMENTS: detailed list below
ACCEPTANCE_AUTHORITY: source/lifecycle same generation; controller consumes exact manifest; parent verifies child evidence digest; acceptance verifies artifact graph; B1 authority not caller asserted; newest-run selection by parsed time and identity
ALLOWED_TERMINAL_STATES: ACCEPTED, BLOCKED, SOURCE_COMPLETE_EXTERNAL_PENDING
BLOCKS: {"bws_600": true, "bws_710": true, "deployment": true, "release": true, "review_progression": false}
REGRESSION_RISKS: union of finding-specific risks below
COMPLETION_MARKER: schema-valid tranche-result receipt digest in an allowed terminal state; no text marker alone is sufficient
NEXT_TRANCHE_RULE: admit BWS-W3-T32 only after this terminal receipt and dependency recheck
```

## Current source-path candidates

- `.automation/lib/controller_hardening_v2.sh` | present=yes | sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `check_progress.sh` | present=yes | sha256=26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `docs/041_external_runtime_preflight_and_bws600_campaign.md` | present=yes | sha256=2b660f97040f6893f0110172a0f3e5ebe0b6e25f64f0e8ea4daf8ab310242620 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `open_log.sh` | present=yes | sha256=3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | present=yes | sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | present=yes | sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | present=yes | sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | present=yes | sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-autopilot.sh` | present=yes | sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `run-paper-evaluation.sh` | present=yes | sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667 | mode=0744 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/b1-runtime-evidence.test.ts` | present=yes | sha256=aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435 | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `tests/bws-final-local-acceptance.test.ts` | present=yes | sha256=c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d | mode=0644 | authorization=TO_CONFIRM_DURING_ADMISSION
- `watch_progress.sh` | present=yes | sha256=dddaf227440e6b848f7a33d2b92aebc06ad729b35f8f87cb95a51750676144e8 | mode=0755 | authorization=TO_CONFIRM_DURING_ADMISSION

These are current-source candidates from the campaign map. They are not unconditional edit authorization. A moved symbol or needed additional path stops admission for explicit reconciliation.

## Symbols to reverify

- BWS120-R07-013 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createBwsPaperRuntimeHandoff | reviewed_line_range=L104-L147 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-013 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createSourceHandoffArchive | reviewed_line_range=L198-L223 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-013 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=handoff assembly | reviewed_line_range=L148-L184 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-013 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=createBwsPaperRuntimeHandoff / createSourceHandoffArchive | reviewed_line_range=L104-L223 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-013 | `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | symbol=None | reviewed_line_range=L104-L223 | reviewed_sha256=6152e779214713ae2faa4ad1d447bc43e4d47c2c1a47d33c83fe303787d9a76f
- BWS120-R07-015 | `packages/bootstrap/src/operations/external-runtime-preflight.ts` | symbol=createBwsExternalRuntimeCampaignManifest | reviewed_line_range=L248-L432 | reviewed_sha256=724a419567dc2c6f737166660092d5c0d8e09be24a4b22bc9377c324949ec427
- BWS120-R07-015 | `docs/041_external_runtime_preflight_and_bws600_campaign.md` | symbol=BWS-600 evidence campaign | reviewed_line_range=L53-L68 | reviewed_sha256=2b660f97040f6893f0110172a0f3e5ebe0b6e25f64f0e8ea4daf8ab310242620
- BWS120-R07-015 | `run-paper-autopilot.sh` | symbol=defaults / run_child_controller | reviewed_line_range=L15-L30; L842-L872 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-015 | `run-paper-evaluation.sh` | symbol=run_runtime_evidence_mode | reviewed_line_range=L845-L919 | reviewed_sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667
- BWS120-R07-015 | `run-paper-autopilot.sh` | symbol=controller admission / run_child_controller | reviewed_line_range=L15-L30; L842-L872 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-015 | `run-paper-autopilot.sh` | symbol=None | reviewed_line_range=L15-L30; L842-L872 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-016 | `.automation/lib/controller_hardening_v2.sh` | symbol=automation_v2_publish_child_result | reviewed_line_range=L439-L612 | reviewed_sha256=d67e2780d7968e5f25b0c7735486b140aa186708bbddda1b3d90cbb5f21f19a1
- BWS120-R07-016 | `run-paper-evaluation.sh` | symbol=run_runtime_evidence_mode | reviewed_line_range=L845-L933 | reviewed_sha256=d7d821119d51c3dd5bbcf7a80f0e98488ebd38f7d771310265939a918505e667
- BWS120-R07-016 | `run-paper-autopilot.sh` | symbol=run_child_controller | reviewed_line_range=L906-L933 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-016 | `run-paper-autopilot.sh` | symbol=completion case / write_final_summary | reviewed_line_range=L942-L975; L1196-L1205 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-016 | `run-paper-autopilot.sh` | symbol=run_child_controller / completion case / write_final_summary | reviewed_line_range=L906-L975; L1196-L1205 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-016 | `run-paper-autopilot.sh` | symbol=None | reviewed_line_range=L906-L975; L1196-L1205 | reviewed_sha256=fa9afc727218b6e533c6f3ef1c2bbb3af9e2c5182538276f509f1986bdfac661
- BWS120-R07-017 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=createBwsFinalLocalAcceptanceRuntimeResult | reviewed_line_range=L411-L531 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R07-017 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=readRuntimeEvidenceFile / resolveEvidencePath | reviewed_line_range=L942-L980 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R07-017 | `tests/bws-final-local-acceptance.test.ts` | symbol=runtime evidence acceptance test | reviewed_line_range=L144-L182 | reviewed_sha256=c2ca8b6bfb9fb49cc387c781844440de074932533cd97acddaa60679281c6b2d
- BWS120-R07-017 | `packages/bootstrap/src/operations/final-local-acceptance.ts` | symbol=None | reviewed_line_range=L411-L531 | reviewed_sha256=1f7b5675b2d307cf8ecc7ab791eba825036ba850fe28ccacae1f8a78deb6a3c5
- BWS120-R07-018 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=B1RuntimeAcceptanceEvidence | reviewed_line_range=L5-L17 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS120-R07-018 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=evaluateB1RuntimeEvidenceAcceptance | reviewed_line_range=L231-L255 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS120-R07-018 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=validateEvidence / dataCoverageBlockers | reviewed_line_range=L309-L365; L469-L480 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS120-R07-018 | `tests/b1-runtime-evidence.test.ts` | symbol=sampleEvidence | reviewed_line_range=L262-L272 | reviewed_sha256=aebe980faa9efd95c354aace00456a9f93b5952b0e2e29936189dd9d9a68b435
- BWS120-R07-018 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=evaluateB1RuntimeEvidenceAcceptance / validateEvidence | reviewed_line_range=L5-L17; L231-L365; L469-L480 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS120-R07-018 | `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | symbol=None | reviewed_line_range=L5-L17; L231-L365; L469-L480 | reviewed_sha256=80ea2ca2a8b071dc1fdafc614594fac3d642b0416bcf6beec4c515cd707adbe8
- BWS120-R07-019 | `check_progress.sh` | symbol=latest_run selection | reviewed_line_range=L27-L35 | reviewed_sha256=26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb
- BWS120-R07-019 | `open_log.sh` | symbol=default RUN_DIR selection | reviewed_line_range=L42-L45 | reviewed_sha256=3a9886b0439c468483142d77e22bcab874c14fb2dd50c5293d014727f0c7a7b1
- BWS120-R07-019 | `watch_progress.sh` | symbol=check_progress delegation | reviewed_line_range=L1-L40 | reviewed_sha256=dddaf227440e6b848f7a33d2b92aebc06ad729b35f8f87cb95a51750676144e8
- BWS120-R07-019 | `check_progress.sh` | symbol=None | reviewed_line_range=L27-L35 | reviewed_sha256=26bb85d1ff30c852af5370c158ff00c62b6e87a54a11f870983273b7a0cb6cdb

Reviewed line ranges are provenance from the detailed finding record, not future edit coordinates. Re-open current source and do not rely on stale line numbers.

## Finding contracts

### BWS120-R07-013 — Runtime handoff can combine a lifecycle snapshot with a different source-tree generation

- Severity: `P1`
- Current behavior: The lifecycle snapshot and source archive are sequential observations of mutable state with no lock, tree fingerprint pre/post comparison, or process-executable digest join.
- Expected behavior: A handoff must pin one immutable source/build generation before status inspection, prove the running process uses it, archive exactly it, and compare the resulting digest before publication.
- Invariant: A handoff must pin one immutable source/build generation before status inspection, prove the running process uses it, archive exactly it, and compare the resulting digest before publication.
- Root cause: Source packaging is not performed from a frozen source authority bound to the running process receipt.
- Trigger: Mutate a tracked/source file through an authorized competing process during the handoff window, or inject an archive creator that captures different bytes.
- Minimal fix boundary: Acquire/verify an immutable source generation receipt, capture lifecycle status against it, package from that exact generation, compare pre/post source fingerprints, and fail closed on drift.
- Regression risks:
- Freezing source must not stop or restart active services during review/acceptance; use immutable release bytes or read locks.

### BWS120-R07-015 — The selected BWS-600 controller never consumes or verifies the accepted external campaign manifest

- Severity: `P1`
- Current behavior: The controller never reads the manifest. It derives a run identity from its own artifacts directory and launches runtime evidence directly.
- Expected behavior: Controller admission must require one exact accepted campaign manifest, verify schema/hash/semantic fingerprint/currentness, and bind release, source, lock, API input, database, storage, schedule, and evidence paths before any child starts.
- Invariant: Controller admission must require one exact accepted campaign manifest, verify schema/hash/semantic fingerprint/currentness, and bind release, source, lock, API input, database, storage, schedule, and evidence paths before any child starts.
- Root cause: The BWS-593 handoff is produced but not made an executable prerequisite of BWS-600.
- Trigger: Start the selected controller without supplying an accepted bws.external_runtime_campaign.v1 file, or with environment values that differ from a previously generated manifest.
- Minimal fix boundary: Add an explicit manifest argument/environment selector, verify exact content/hash and all bound authorities before lock/run-dir/child creation, and propagate its semantic fingerprint through every child/result/evidence receipt.
- Regression risks:
- Admission ordering must remain fail-closed before creating mutable campaign state.

### BWS120-R07-016 — Paper-autopilot completion trusts a child status label and exit code without an evidence receipt

- Severity: `P1`
- Current behavior: The parent checks status and exit code only. Its summary records labels and a run directory but no exact evidence artifact identity.
- Expected behavior: Parent completion must verify a typed child receipt binding exact campaign manifest, source/data/process generation, evidence result path+hash, observation continuity result, and terminal status before promotion.
- Invariant: Parent completion must verify a typed child receipt binding exact campaign manifest, source/data/process generation, evidence result path+hash, observation continuity result, and terminal status before promotion.
- Root cause: Process ownership authentication is mistaken for semantic evidence authentication.
- Trigger: Delete, mutate, replace, or disconnect the runtime evidence artifact before the parent consumes the child result; alternatively publish a valid label without an evidence digest.
- Minimal fix boundary: Version the child result protocol to include an immutable evidence receipt and campaign fingerprint; verify it atomically before parent state advancement and include it in a signed/hashed parent completion artifact.
- Regression risks:
- Protocol changes affect other autonomous parents; preserve controller-specific validation and reject legacy ready results for BWS-600.

### BWS120-R07-017 — Final-local runtime acceptance validates labels and file existence rather than cryptographic evidence relationships

- Severity: `P1`
- Current behavior: The exact placeholder construction is accepted by the focused test. The final semantic fingerprint hashes the parsed runtime document and absolute path strings, not the bytes/relationships of referenced files.
- Expected behavior: Final acceptance must verify every referenced artifact schema/hash, source/runtime/campaign identity, chronological relationship, immutable index receipt, parent-child completion receipt, and external campaign fingerprint.
- Invariant: Final acceptance must verify every referenced artifact schema/hash, source/runtime/campaign identity, chronological relationship, immutable index receipt, parent-child completion receipt, and external campaign fingerprint.
- Root cause: Final acceptance is a shape/label aggregator rather than a verifier of the evidence graph it claims to bind.
- Trigger: Use arbitrary regular files for lifecycle/diagnostics/handoff, set expected labels in the runtime evidence and parent summary, and include PAPER_AUTOPILOT_ in the capture.
- Minimal fix boundary: Require typed schema validation and SHA-256 for every reference, verify one coherent generation/campaign DAG, consume the canonical index receipt, validate parent/child terminal receipt, and hash all referenced bytes into the final manifest.
- Regression risks:
- Tightening verification will invalidate historical synthetic fixtures; retain them as test-only non-acceptance inputs.

### BWS120-R07-018 — B1 runtime acceptance trusts a caller-selected “accepted upstream” enum and arbitrary repeated hashes

- Severity: `P1`
- Current behavior: The caller assertion is sufficient to bypass the fixture blocker and can return status=accepted with terminalCode=B1_OFFLINE_ACCEPTANCE_THRESHOLDS_MET. The decision still correctly keeps runtimeEvidence/executable false, but the acceptance label itself is unproven.
- Expected behavior: BWS-710 acceptance must require an immutable accepted upstream resource receipt bound to exact API route/contract/commit/generation/page/data window, exact report artifacts, and deterministic rerun bytes.
- Invariant: BWS-710 acceptance must require an immutable accepted upstream resource receipt bound to exact API route/contract/commit/generation/page/data window, exact report artifacts, and deterministic rerun bytes.
- Root cause: External authority is modeled as a caller-controlled enum instead of a verified resource receipt.
- Trigger: Set inputSource to accepted_betting_win_b1_multi_venue_markets_v1 and supply identical 64-hex values as rerunRunHashes.
- Minimal fix boundary: Replace the enum-only branch with a validated B1 upstream acceptance receipt and exact artifact/hash joins; keep deterministic fixtures permanently blocked from runtime acceptance.
- Regression risks:
- Preserve offline falsification as a distinct non-runtime research result and keep execution/public signals disabled.

### BWS120-R07-019 — Progress and log helpers select the lexically greatest controller prefix instead of the newest run

- Severity: `P2`
- Current behavior: Plain lexical ordering selects paper_autopilot_2020 because the p prefix sorts after b, even though bugfix_autopilot_2099 is newer.
- Expected behavior: The default must select the greatest parsed UTC run timestamp, with deterministic tie handling and explicit controller filtering when needed.
- Invariant: The default must select the greatest parsed UTC run timestamp, with deterministic tie handling and explicit controller filtering when needed.
- Root cause: Run family and timestamp are encoded in one string and sorted as an undifferentiated path.
- Trigger: Create bugfix_autopilot_20990101T000000Z and paper_autopilot_20200101T000000Z directories, then invoke the helper without --run-dir.
- Minimal fix boundary: Parse controller family and timestamp explicitly, compare timestamp values, validate directory schema, and expose the selected family/time in output. Keep explicit --run-dir authoritative.
- Regression risks:
- Changing default selection can surprise operators relying on prefix priority; document and test timestamp authority.


## Allowed edit boundary

- Candidate path set: `.automation/lib/controller_hardening_v2.sh`, `check_progress.sh`, `docs/041_external_runtime_preflight_and_bws600_campaign.md`, `open_log.sh`, `packages/bootstrap/src/operations/b1-runtime-evidence.ts`, `packages/bootstrap/src/operations/external-runtime-preflight.ts`, `packages/bootstrap/src/operations/final-local-acceptance.ts`, `packages/bootstrap/src/operations/paper-runtime-handoff.ts`, `run-paper-autopilot.sh`, `run-paper-evaluation.sh`, `tests/b1-runtime-evidence.test.ts`, `tests/bws-final-local-acceptance.test.ts`, `watch_progress.sh`.
- Exact mutation set, including any test path, is `TO_CONFIRM_DURING_ADMISSION` after current-source reverification.
- Only the minimal coherent correction boundary described by the finding records may be implemented.
- A newly discovered path, generated file, shared integration path, schema, migration, fixture, validator, controller, or package/build change is not implicitly allowed.

## Read-only shared paths and serialization

- `.automation/lib/controller_hardening_v2.sh` | participating tranches=T29, T45, T46 | predecessor postimage required
- `open_log.sh` | participating tranches=T29, T38 | predecessor postimage required
- `packages/bootstrap/src/operations/b1-runtime-evidence.ts` | participating tranches=T17, T29, T41 | predecessor postimage required
- `packages/bootstrap/src/operations/external-runtime-preflight.ts` | participating tranches=T03, T04, T27, T29, T31, T33, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/final-local-acceptance.ts` | participating tranches=T29, T31, T35, T36 | predecessor postimage required
- `packages/bootstrap/src/operations/paper-runtime-handoff.ts` | participating tranches=T27, T29 | predecessor postimage required
- `run-paper-autopilot.sh` | participating tranches=T28, T29, T44, T45, T46, T47 | predecessor postimage required
- `run-paper-evaluation.sh` | participating tranches=T28, T29, T44, T46 | predecessor postimage required
- `tests/b1-runtime-evidence.test.ts` | participating tranches=T29, T41 | predecessor postimage required
- `tests/bws-final-local-acceptance.test.ts` | participating tranches=T29, T36 | predecessor postimage required

## Prohibited paths and unchanged authorities

- betting-win checkout, source, documentation, service, database, or runtime
- all paths outside the explicitly admitted tranche path set
- SOURCE_MANIFEST.json except during admitted T40
- credentials, secrets, environment files, database files, PID/lock files, logs, artifacts, node_modules, dist, coverage
- protected mutable authority documents unless a later explicit authority change separately permits a documentation-only update

Unchanged authorities:

- Archive hash/size validation
- BWS-600 closed execution policy
- BWS-900 parked policy
- BWS-900 remains parked
- Existing PID/boot/start-tick ownership checks
- Offline classifier mathematics
- Per-run summary parsing
- Preflight producer validation
- all betting-win source, checkout, documentation, service, database, and runtime
- closed policy fields
- closed provider/execution policy
- current BWS-600/BWS-710/BWS-900, release, deployment, and live-execution holds
- current external blockers
- cycle/round selection inside an already selected run
- executable=false
- explicit runtime-log mode
- handoff JSON field names
- lock release fields
- recovery/backup mechanics outside this runtime acceptance function
- runtimeEvidence=false
- source-before/after mutation check

## Prerequisites

- Dependency terminal receipts: T27, T28, T47.
- Review prerequisites: `T27; T28; accepted external campaign manifest authority`.
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

- `BWS120-R07-013-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=Mutation between status/archive
- `BWS120-R07-013-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=generated dist drift
- `BWS120-R07-013-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=source-manifest/tree mismatch
- `BWS120-R07-013-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=process executable digest mismatch
- `BWS120-R07-013-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=unchanged happy path
- `BWS120-R07-015-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=Missing manifest
- `BWS120-R07-015-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=tampered manifest
- `BWS120-R07-015-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=stale manifest
- `BWS120-R07-015-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=release/lock/input/database/schedule mismatch
- `BWS120-R07-015-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=manifest fingerprint propagation
- `BWS120-R07-015-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=no side effects before failure
- `BWS120-R07-016-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=Evidence deleted after child exit
- `BWS120-R07-016-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=evidence tampered after child exit
- `BWS120-R07-016-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=wrong campaign fingerprint
- `BWS120-R07-016-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=wrong source/runtime generation
- `BWS120-R07-016-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=status/exit mismatch
- `BWS120-R07-016-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=parent restart before promotion
- `BWS120-R07-017-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=Placeholder artifact rejection
- `BWS120-R07-017-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=tampered artifact
- `BWS120-R07-017-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=wrong schema/hash
- `BWS120-R07-017-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=cross-generation mix
- `BWS120-R07-017-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=stale parent summary
- `BWS120-R07-017-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=forged Telegram substring
- `BWS120-R07-017-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=external campaign mismatch
- `BWS120-R07-017-TEST-08` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=accepted happy path
- `BWS120-R07-018-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=Forged accepted enum
- `BWS120-R07-018-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=arbitrary equal hashes
- `BWS120-R07-018-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=hash not matching report bytes
- `BWS120-R07-018-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=wrong contract/generation/page
- `BWS120-R07-018-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=stale data window
- `BWS120-R07-018-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=valid accepted receipt
- `BWS120-R07-018-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=fixture remains blocked
- `BWS120-R07-019-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=Cross-family timestamps
- `BWS120-R07-019-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=same timestamp tie
- `BWS120-R07-019-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=malformed directory ignored
- `BWS120-R07-019-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=explicit --run-dir
- `BWS120-R07-019-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=no artifacts

Exact executable commands are bound during admission because many requirements describe tests that do not yet exist. The binding must map every test ID to a bounded repository-local command and expected proof output before editing.

## Production-entrypoint tests

- `BWS120-R07-013-TEST-01` | category=release_or_deployment | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=Mutation between status/archive
- `BWS120-R07-013-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=generated dist drift
- `BWS120-R07-013-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=source-manifest/tree mismatch
- `BWS120-R07-013-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=process executable digest mismatch
- `BWS120-R07-013-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=unchanged happy path
- `BWS120-R07-015-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=Missing manifest
- `BWS120-R07-015-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=tampered manifest
- `BWS120-R07-015-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=stale manifest
- `BWS120-R07-015-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=release/lock/input/database/schedule mismatch
- `BWS120-R07-015-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=manifest fingerprint propagation
- `BWS120-R07-015-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=no side effects before failure
- `BWS120-R07-016-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=Evidence deleted after child exit
- `BWS120-R07-016-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=evidence tampered after child exit
- `BWS120-R07-016-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=wrong campaign fingerprint
- `BWS120-R07-016-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=wrong source/runtime generation
- `BWS120-R07-016-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=status/exit mismatch
- `BWS120-R07-016-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=parent restart before promotion
- `BWS120-R07-017-TEST-01` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=Placeholder artifact rejection
- `BWS120-R07-017-TEST-02` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=tampered artifact
- `BWS120-R07-017-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=wrong schema/hash
- `BWS120-R07-017-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=cross-generation mix
- `BWS120-R07-017-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=stale parent summary
- `BWS120-R07-017-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=forged Telegram substring
- `BWS120-R07-017-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=external campaign mismatch
- `BWS120-R07-017-TEST-08` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=accepted happy path
- `BWS120-R07-018-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=Forged accepted enum
- `BWS120-R07-018-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=arbitrary equal hashes
- `BWS120-R07-018-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=hash not matching report bytes
- `BWS120-R07-018-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=wrong contract/generation/page
- `BWS120-R07-018-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=stale data window
- `BWS120-R07-018-TEST-06` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=valid accepted receipt
- `BWS120-R07-018-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=fixture remains blocked
- `BWS120-R07-019-TEST-01` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=Cross-family timestamps
- `BWS120-R07-019-TEST-02` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=same timestamp tie
- `BWS120-R07-019-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=malformed directory ignored
- `BWS120-R07-019-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=explicit --run-dir
- `BWS120-R07-019-TEST-05` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=no artifacts

## Negative and adversarial tests

- `BWS120-R07-013-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=source-manifest/tree mismatch
- `BWS120-R07-013-TEST-04` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=process executable digest mismatch
- `BWS120-R07-013-TEST-05` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-013 | requirement=unchanged happy path
- `BWS120-R07-015-TEST-03` | category=evidence_or_artifact | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=stale manifest
- `BWS120-R07-015-TEST-04` | category=persistence_or_migration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-015 | requirement=release/lock/input/database/schedule mismatch
- `BWS120-R07-016-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=status/exit mismatch
- `BWS120-R07-017-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=stale parent summary
- `BWS120-R07-017-TEST-07` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=external campaign mismatch
- `BWS120-R07-017-TEST-08` | category=security_or_confinement | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-017 | requirement=accepted happy path
- `BWS120-R07-018-TEST-05` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-018 | requirement=stale data window
- `BWS120-R07-019-TEST-03` | category=unit_or_integration | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-019 | requirement=malformed directory ignored

## Concurrency, cancellation, crash, and restart tests

- `BWS120-R07-016-TEST-06` | category=restart_or_recovery | environment=NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION | production_entrypoint=yes | status=REQUIRED_NOT_RUN_BY_CONSOLIDATION | issues=BWS120-R07-016 | requirement=parent restart before promotion

## Environment proof

- NODE20_OR_LANGUAGE_NEUTRAL_OFFLINE_OR_CONTROLLED_INTEGRATION: 37 requirements

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

Acceptance authority: source/lifecycle same generation; controller consumes exact manifest; parent verifies child evidence digest; acceptance verifies artifact graph; B1 authority not caller asserted; newest-run selection by parsed time and identity

Allowed terminal states: `ACCEPTED`, `BLOCKED`, `SOURCE_COMPLETE_EXTERNAL_PENDING`.

A schema-valid receipt must bind all findings, exact preimage/postimage, changed modes, executed tests, exact runtime, proof environments, unresolved blockers, retained holds, owner/reviewer, timestamps, and parent/previous receipt digests.

## Next-tranche rule

`BWS-W3-T32` may be proposed only after this tranche has a valid terminal receipt, all its dependencies are rechecked, the predecessor postimage is bound, and exactly one new admission is issued.
