# Dependency graph and review-only fix tranches through Wave 03

The Wave 01 and Wave 02 tranches remain binding. Wave 03 adds T26 through T36. No implementation is authorized by this document.

```text
R01-R06 authority foundations
  -> T26/T27/T28/T29 evidence and campaign truth
  -> T30/T31/T32 database lifecycle and recovery
  -> T33/T34 release and upgrade transactionality
  -> T35 soak truth
  -> T36 promotion and final acceptance
  -> Wave 04 R10/R11/R12 assurance closure
```

## BWS-W3-T26

- Issue IDs: `BWS120-R07-001, BWS120-R07-002`
- Primary owner: `R07`
- Secondary areas: `R10, R11, R12`
- Prerequisites: `approved repository-owned log root; closed recursive redaction policy`

**Acceptance conditions.**
- no out-of-repo write/rotation
- all credential-bearing keys and value shapes redacted before persistence

**Focused tests.**
- path/symlink confinement matrix
- Authorization/Cookie/API-key/value redaction matrix

**Explicitly unchanged.**
- log schema for nonsecret fields
- provider/execution holds

## BWS-W3-T27

- Issue IDs: `BWS120-R07-003, BWS120-R07-004, BWS120-R07-005, BWS120-R07-008, BWS120-R07-012, BWS120-R07-014`
- Primary owner: `R07`
- Secondary areas: `R08, R12`
- Prerequisites: `content-addressed artifact identity; atomic publication primitive`

**Acceptance conditions.**
- serialized create-or-compare index
- immutable bytes or revalidation
- monotonic currentness
- reference-aware retention
- version/latest transactional recovery

**Focused tests.**
- multi-process publication
- post-registration mutation
- crash between version/latest
- retention reference tests

**Explicitly unchanged.**
- application semantics upstream of publication

## BWS-W3-T28

- Issue IDs: `BWS120-R07-006, BWS120-R07-007, BWS120-R07-009, BWS120-R07-010, BWS120-R07-011`
- Primary owner: `R07`
- Secondary areas: `R05, R06`
- Prerequisites: `R05 typed response truth; R06 generation/readiness truth`

**Acceptance conditions.**
- non-2xx/schema-invalid fail closed
- no synthetic-ready substitution
- continuous monotonic observation window
- exact generation binding

**Focused tests.**
- HTTP status/schema matrix
- full-window continuity
- clock anomaly tests
- mixed-generation rejection

**Explicitly unchanged.**
- external provider access remains disabled

## BWS-W3-T29

- Issue IDs: `BWS120-R07-013, BWS120-R07-015, BWS120-R07-016, BWS120-R07-017, BWS120-R07-018, BWS120-R07-019`
- Primary owner: `R07`
- Secondary areas: `R01, R06, R09, R12`
- Prerequisites: `T27; T28; accepted external campaign manifest authority`

**Acceptance conditions.**
- source/lifecycle same generation
- controller consumes exact manifest
- parent verifies child evidence digest
- acceptance verifies artifact graph
- B1 authority not caller asserted
- newest-run selection by parsed time and identity

**Focused tests.**
- manifest admission
- child evidence tamper/delete
- placeholder rejection
- B1 forged source rejection
- cross-controller ordering

**Explicitly unchanged.**
- BWS-600 remains blocked until external proof

## BWS-W3-T30

- Issue IDs: `BWS120-R08-001, BWS120-R08-003, BWS120-R08-004`
- Primary owner: `R08`
- Secondary areas: `R03, R10, R11`
- Prerequisites: `approved backup root; snapshot-consistent metadata contract`

**Acceptance conditions.**
- no unrelated recursive deletion
- dump and manifest from one snapshot
- previous verified backup retained until atomic commit

**Focused tests.**
- wrong-root overwrite rejection
- concurrent-write snapshot
- failure-before-rename preservation

**Explicitly unchanged.**
- surebet schema selection

## BWS-W3-T31

- Issue IDs: `BWS120-R08-002, BWS120-R08-005, BWS120-R08-006, BWS120-R08-007, BWS120-R08-008, BWS120-R08-009`
- Primary owner: `R08`
- Secondary areas: `R03, R06, R09, R10, R11`
- Prerequisites: `R03 migration authority; exact database identity; bounded cleanup registry`

**Acceptance conditions.**
- apply revalidates plan target and ledger
- server version evaluated
- receipt binds exact dump and restored semantics
- restart proof authoritative
- orphan cleanup recoverable

**Focused tests.**
- target drift
- version matrix
- dump mutation
- strict manifest/table/ledger
- interrupt cleanup

**Explicitly unchanged.**
- no production database use

## BWS-W3-T32

- Issue IDs: `BWS120-R08-010, BWS120-R08-011, BWS120-R08-012`
- Primary owner: `R08`
- Secondary areas: `R03, R07`
- Prerequisites: `exact database/schema generation identity; reference ownership map`

**Acceptance conditions.**
- plan bound to target
- plan/apply one transaction or fenced protocol
- partial prune impossible
- blocked/terminal provenance retained

**Focused tests.**
- cross-database plan reuse
- concurrent reference change
- partial failure
- all retention scopes

**Explicitly unchanged.**
- retention remains bounded and explicit

## BWS-W3-T33

- Issue IDs: `BWS120-R09-001, BWS120-R09-002, BWS120-R09-003, BWS120-R09-004`
- Primary owner: `R09`
- Secondary areas: `R07, R10, R11`
- Prerequisites: `exact manifest/path-set authority; atomic multi-artifact publication`

**Acceptance conditions.**
- incompatible/unknown runtime fails
- published archive mandatory
- no undeclared members
- all release targets commit atomically with predecessor preservation

**Focused tests.**
- runtime compatibility negatives
- archive absence
- extra path
- fault after each publication step

**Explicitly unchanged.**
- no deployment performed

## BWS-W3-T34

- Issue IDs: `BWS120-R09-005, BWS120-R09-006, BWS120-R09-007, BWS120-R09-008, BWS120-R09-009, BWS120-R09-010, BWS120-R09-011`
- Primary owner: `R09`
- Secondary areas: `R03, R06, R08, R10`
- Prerequisites: `T31; R06 lifecycle fencing; exclusive upgrade epoch`

**Acceptance conditions.**
- plan recomputed
- all inputs rebound
- one owner
- state scoped to plan
- checkpoint bytes/current target verified
- lifecycle failures not success
- partial target fenced before prior restart

**Focused tests.**
- tamper/drift
- two-process ownership
- cross-plan reuse
- checkpoint corruption
- lifecycle matrix
- partial target rollback

**Explicitly unchanged.**
- no live upgrade executed

## BWS-W3-T35

- Issue IDs: `BWS120-R09-012, BWS120-R09-013, BWS120-R09-014, BWS120-R09-015, BWS120-R09-016, BWS120-R09-017`
- Primary owner: `R09`
- Secondary areas: `R06, R07, R08, R11`
- Prerequisites: `authoritative managed runner; fault-specific adapters; owned resource inventory`

**Acceptance conditions.**
- no synthetic instant pass
- each fault distinct
- readiness/progress/resource thresholds enforced
- checkpoint order restart-safe
- resumed result cumulative
- cleanup measured

**Focused tests.**
- all fault types
- crash boundaries
- chunk resume
- health/progress/resource negatives
- resource leak measurement

**Explicitly unchanged.**
- no multi-hour or service run during implementation unit tests

## BWS-W3-T36

- Issue IDs: `BWS120-R09-018, BWS120-R09-019, BWS120-R09-020, BWS120-R09-021`
- Primary owner: `R09`
- Secondary areas: `R01, R07, R08, R10, R12`
- Prerequisites: `T27-T35`

**Acceptance conditions.**
- preflight consumes canonical result and validation
- environment bytes in identity
- all recovery artifacts share generation/content graph
- archive digest independently recomputed and component paths immutable

**Focused tests.**
- forged soak state
- environment mutation
- cross-artifact mismatch
- archive/component tamper

**Explicitly unchanged.**
- BWS-600 and deployment remain blocked until explicit acceptance

# Wave 04 additions and final review dependency closure

The review program is complete. Research can no longer be used as a substitute for remediation; implementation must follow the full dependency graph and exact ownership boundaries.

## BWS-W4-T37

- Issue IDs: `BWS121-R10-001, BWS121-R10-002, BWS121-R10-003, BWS121-R10-008`
- Primary owner: `R10`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Bounded effective configuration, explicit source precedence, blank-value preservation, and scrubbed libpq authority.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T38

- Issue IDs: `BWS121-R10-004, BWS121-R10-005, BWS121-R10-006, BWS121-R10-007, BWS121-R10-009`
- Primary owner: `R10`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Repository-bound CLI/status/log destinations, exact flag parsing, and secret-free PostgreSQL invocation.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T39

- Issue IDs: `BWS121-R10-010, BWS121-R10-011, BWS121-R10-012, BWS121-R10-013`
- Primary owner: `R10`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: One nested secret policy, non-destructive Git config handling, and pinned SSH destination identity.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T40

- Issue IDs: `BWS121-R11-001, BWS121-R11-002`
- Primary owner: `R11`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Exact current source manifest and exact Node 20.20.2 enforcement.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T41

- Issue IDs: `BWS121-R11-003, BWS121-R11-004, BWS121-R11-005, BWS121-R11-006`
- Primary owner: `R11`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Production-entrypoint semantic validators replace token/status self-attestation.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T42

- Issue IDs: `BWS121-R11-007, BWS121-R11-008, BWS121-R11-009`
- Primary owner: `R11`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Repository-wide structural boundary analysis and complete fixture authority.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T43

- Issue IDs: `BWS121-R11-010`
- Primary owner: `R11`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Machine-enforced closure from every stable finding to source postimages, executed tests, and environment receipts.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T44

- Issue IDs: `BWS121-R12-001, BWS121-R12-002, BWS121-R12-003, BWS121-R12-004`
- Primary owner: `R12`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Non-bypassable controller ownership, monotonic heartbeat updates, self-fencing, and child-aware stale takeover.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T45

- Issue IDs: `BWS121-R12-005, BWS121-R12-006, BWS121-R12-007`
- Primary owner: `R12`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Enforced aggregate deadlines, whole-process-group terminality, and durable restart reconciliation.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T46

- Issue IDs: `BWS121-R12-008, BWS121-R12-009, BWS121-R12-010`
- Primary owner: `R12`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Exclusive run identities, quiescent finalization, and lifecycle-aware cleanup.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds

## BWS-W4-T47

- Issue IDs: `BWS121-R12-011, BWS121-R12-012, BWS121-R12-013`
- Primary owner: `R12`
- Prerequisites: all upstream tranches referenced by the affected findings; current-source re-verification before implementation
- Acceptance conditions: Immutable serialized archive generations, explicit publication failure currentness, and linked redacted delivery receipts.
- Focused tests: every required test mapped to these IDs in `test-evidence-matrix.json`
- Broader validation: exact Node 20.20.2, repository aggregate gate, and environment-specific proof where required
- Explicitly unchanged: betting-win; live execution; current BWS-600/BWS-710/BWS-900 holds
