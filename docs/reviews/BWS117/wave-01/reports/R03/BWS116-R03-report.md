# BWS116-R03 PostgreSQL persistence, job ownership, scheduler checkpoints, and private-paper state correctness

## Review verdict

```text
REVIEW_ID=BWS116-R03
REPOSITORY=betting-win-surebet
ARCHIVE_SHA256=6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376
ARCHIVE_REGULAR_FILES=618
ARCHIVE_IDENTITY=PASS
ARCHIVE_PATH_AND_TYPE_SAFETY=PASS
EXTRACTION_INTEGRITY=PASS
POSTGRESQL_EXECUTION=UNAVAILABLE
ACTUAL_NODE_RUNTIME=v22.16.0
CANONICAL_NODE_20_20_2_ACCEPTANCE=NOT_RUN
CONFIRMED_FINDINGS=17
P0=1 P1=13 P2=3 P3=0
OVERALL_VERDICT=BLOCKED_SOURCE_CORRECTNESS_REMEDIATION_REQUIRED
SOURCE_OR_REPOSITORY_MUTATION=NO
NETWORK_PROVIDER_ACCOUNT_DATABASE_ACCESS=NO
```

The frozen archive is exact: its SHA-256 matches the required authority, it contains 618 regular files, and no duplicate, unsafe, symlink, or special members were found. The package identity is `betting-win-surebet@0.1.0-bws-full-platform`. The current routing documents still identify BWS-600 as externally blocked, BWS-599 as the historical safe-local terminal gate, BWS-710 as externally blocked, and BWS-900 as parked. Those historical claims were treated as inputs, not proof.

R03 confirmed one P0 schema-ownership escape, thirteen P1 transaction/state/recovery defects, and three P2 boundedness/operational defects. The dominant root cause is that durable state authority is repeatedly checked in one `psql` process and mutated in another, while long-running services lack real cancellation and several aggregate operations have no atomic completion record.

## Source authority and method

- Reviewed archive path: `/mnt/data/betting-win-surebet116(2).zip`
- Expected and actual SHA-256: `6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376`
- Regular files: `618`
- ZIP path safety: no absolute paths, parent traversal, Windows-drive paths, backslash aliases, duplicate paths, symlinks, or special entries.
- Extraction was re-hashed after all inspection; every path, size, and SHA-256 still matches the archive.
- PostgreSQL was not available. No persistent or disposable database was contacted or created.
- Actual Node runtime was `v22.16.0`. Node 22 tests and the inert loader harness are supplementary, not canonical Node 20.20.2 acceptance.
- All temporary harnesses and generated review outputs remained outside the extracted source tree.

## Intended persistence authority

The repository documents define `surebet.*` as the only owned schema, require deterministic idempotency, optimistic conflict handling, bounded retention with preserved accepted references, persisted scheduler/worker checkpoints, stale-lease recovery without double finalization, and no implicit migration during status. The source implements substantial safeguards, but the confirmed findings below show that those invariants are not enforced atomically at the database boundary.

## Migration inventory and application order

| Order | Migration | SHA-256 | Tables |
|---:|---|---|---|
| 1 | `001_create_upstream_locks_and_import_runs.sql` | `9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584` | `surebet.upstream_locks`, `surebet.import_runs` |
| 2 | `002_create_pinned_strategy_exports.sql` | `ade03b500f36cfc1bd1b85aaa551db6945918e25a64f6934b3d85f6eec245e3d` | `surebet.pinned_strategy_exports` |
| 3 | `003_create_strategy_ledger_entries.sql` | `b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071` | `surebet.strategy_ledger_entries` |
| 4 | `004_create_worker_jobs.sql` | `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c` | `surebet.worker_jobs`, `surebet.worker_job_checkpoints`, `surebet.worker_job_dead_letters` |
| 5 | `005_create_upstream_export_convergence_checkpoints.sql` | `8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c` | `surebet.upstream_export_convergence_checkpoints` |
| 6 | `006_create_upstream_api_convergence_checkpoints.sql` | `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7` | `surebet.upstream_api_convergence_checkpoints` |
| 7 | `007_create_private_paper_runtime_scheduler_checkpoints.sql` | `b0ec918132e247f3265145787e3bf9b30320ae2c415937c0578d373e5ec8be57` | `surebet.private_paper_runtime_scheduler_checkpoints` |
| 8 | `008_create_b1_upstream_convergence_checkpoints.sql` | `33a2287c537afe1aa2a666b14365fa3a3247900d41d4303116fdcecd04b54672` | `surebet.b1_upstream_convergence_checkpoints` |
| 9 | `009_create_b1_backtest_runs.sql` | `c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea` | `surebet.b1_backtest_runs` |
| 10 | `010_create_b1_candidate_snapshots.sql` | `83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a` | `surebet.b1_candidate_snapshots` |
| 11 | `011_create_b1_simulation_results.sql` | `3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa` | `surebet.b1_simulation_results` |
| 12 | `012_create_b1_private_observation_cycles.sql` | `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6` | `surebet.b1_private_observation_cycles` |

Current order is lexical and reconciles to `001` through `012`. No duplicate migration name exists in the archive. Each migration is submitted in a transaction with its ledger insert. The current SQL object inventory is `surebet.*`-qualified. These facts do not cure the migration-source and scope-authority defect in BWS116-R03-001.

## Complete durable state-machine model

### Migration state

```text
UNINITIALIZED
  -- explicit apply should own bootstrap --> LEDGER_PRESENT
LEDGER_PRESENT
  -- for each archive migration under one owner --> APPLIED(name, sha256)
APPLIED_SET
  -- exact set/digest comparison --> COMPATIBLE | INCOMPATIBLE
```
Current deviations: status performs the bootstrap transition; application has no global migration owner; unknown applied rows do not make compatibility fail.

### Import and convergence state

```text
IMPORT: ABSENT -> RUNNING -> SUCCEEDED | FAILED
EXPORT CHECKPOINT: index N -> index N+1 -> COMPLETED
API CHECKPOINT: (cycle, resource, page, cursor) -> next page/resource/cycle
SCHEDULER CHECKPOINT: last cycle N | null -> cycle N+1
B1 OBSERVATION: ABSENT -> STARTED -> COMPLETED | BLOCKED
```
The preconditions are checked in TypeScript after one read, but the updates generally filter only by primary ID. The intended monotonic transitions are therefore vulnerable to stale writes and conflicting finalizers.

### Worker job state

```text
PENDING(attempt=0)
  -- atomic claim/SKIP LOCKED --> LEASED(attempt+1, owner, token, expires)
LEASED
  -- heartbeat/checkpoint --> LEASED
  -- retryable failure --> RETRY_WAIT -> LEASED
  -- completion --> SUCCEEDED
  -- terminal failure --> DEAD_LETTERED
  -- lease expiry --> DEAD_LETTERED (current implementation)
```
There are no durable `cancelled`, `timed_out`, `unknown`, or `abandoned` states. Claim is atomic, and the dead-letter paths are fenced. Heartbeat, checkpoint, completion, and retry are not fenced in their own mutations. Expiry always bypasses remaining retry budget.

### Standard private-paper aggregate

```text
WORKER JOB -> SOURCE FETCH -> RUNTIME RESULT -> STRATEGY LEDGER -> WORKER TERMINAL
```
The runtime supports an optional previous state, but the persisted job payload and production adapter do not reconstruct it. A crash after ledger insertion and before job completion can replay the same logical cycle against changed API input and create a second logical incarnation.

### B1 private-paper aggregate

```text
WORKER JOB
  -> OBSERVATION STARTED
  -> BACKTEST PARENT
  -> CANDIDATE/SIMULATION CHILDREN
  -> OBSERVATION COMPLETED | BLOCKED
  -> WORKER SUCCEEDED | DEAD_LETTERED
```
Parent/children and observation/job terminality are separate commits without a durable aggregate completion protocol. Crash windows can leave permanently partial graphs or contradictory terminals.

## Required-question conclusions

| Question | Conclusion |
|---|---|
| 1. Partial write represented as complete? | Yes. B1 parent rows suppress child repair; observation and worker terminals can diverge; status can manufacture bootstrap state. |
| 2. Duplicate economic/evidence effects? | Yes. Non-atomic idempotency and absent durable previous cycle state permit divergent replay of one logical cycle. |
| 3. All idempotency claims atomic? | No. Most create methods are read-then-insert across psql sessions. |
| 4. Can concurrent workers claim the same job? | The claim CTE prevents simultaneous claim of one eligible row. Later mutations are not equivalently fenced. |
| 5. Can stale worker publish after lease loss/takeover? | Yes through the read/mutation gap and ID-only UPDATE predicates; late checkpoints are also possible. |
| 6. Monotonic lease epochs? | No. Lease token exists, but no epoch exists and token is omitted from several mutation predicates. |
| 7. Can scheduler checkpoint regress/skip/advance early? | Yes under concurrent advancers because expected state is not in the UPDATE predicate. Sequential crash after deterministic job creation can recover. |
| 8. Can retry budgets reset/inflate? | Normal attempt_count is incremented at claim, but lease expiry bypasses the remaining budget and caller time can distort availability. |
| 9. Distinct durable failure states? | No. cancelled, timed_out, unknown, and abandoned are absent; timeout is only a late classification. |
| 10. Crash/restart deterministic? | Not for standard API-backed cycles, B1 parent/child graphs, or B1 observation/job terminal gaps. |
| 11. Can migration SQL escape surebet.*? | Yes through caller-selected migration directories and unrecognized executable SQL families. Current frozen migrations themselves do not escape. |
| 12. Can config/psql target or failure be hidden? | The explicit target tuple is fail-fast, but psql is unbounded and status mutates. Ambient libpq policy remains an R10 hypothesis. |
| 13. Semantic loss for timestamps/money/JSON? | Bigint projections are generally text-safe and JSON is canonicalized. Timestamp chronology is not enforced. |
| 14. Can retention remove required evidence? | Yes for export convergence references; API references instead make the same generated plan fail at delete time. |
| 15. Do tests reproduce PostgreSQL concurrency? | No. PostgreSQL tests were skipped here and the source tests do not cover the confirmed adversarial interleavings. |

## Confirmed findings summary

| ID | Severity | Title | Release | BWS-600 | B1 | Deployment |
|---|---:|---|:---:|:---:|:---:|:---:|
| `BWS116-R03-001` | P0 | Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL | YES | YES | YES | YES |
| `BWS116-R03-002` | P1 | The migration-status read path creates schema objects before reporting status | YES | YES | YES | YES |
| `BWS116-R03-003` | P1 | Unknown applied migration rows are ignored and can be reported as compatible | YES | YES | YES | YES |
| `BWS116-R03-006` | P1 | Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations | YES | YES | YES | YES |
| `BWS116-R03-007` | P1 | Finalization and checkpoint advances validate expected state in one session but update by ID in another | YES | YES | YES | YES |
| `BWS116-R03-008` | P1 | Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates | YES | YES | YES | YES |
| `BWS116-R03-009` | P1 | Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries | YES | YES | YES | YES |
| `BWS116-R03-010` | P1 | Expired leases are always dead-lettered even when retry budget remains | YES | YES | YES | YES |
| `BWS116-R03-011` | P1 | Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work | YES | YES | YES | YES |
| `BWS116-R03-013` | P1 | Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity | YES | YES | NO | YES |
| `BWS116-R03-014` | P1 | Standard private-paper retries do not reconstruct durable previous cycle state | YES | YES | NO | YES |
| `BWS116-R03-015` | P1 | B1 backtest persistence commits the parent before children and suppresses repair on replay | YES | NO | YES | YES |
| `BWS116-R03-016` | P1 | B1 observation terminality and worker-job terminality can diverge after a crash | YES | NO | YES | YES |
| `BWS116-R03-017` | P1 | Durable lifecycle tables accept impossible timestamp orderings | YES | YES | YES | YES |
| `BWS116-R03-004` | P2 | Concurrent migration applications are not serialized around ledger observation and insertion | YES | YES | YES | YES |
| `BWS116-R03-005` | P2 | psql subprocesses have no explicit timeout or cancellation boundary | YES | YES | YES | YES |
| `BWS116-R03-012` | P2 | Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded | YES | YES | YES | YES |

## Detailed confirmed findings

### BWS116-R03-001 — Migration discovery can escape the repository and the SQL scope scanner admits cross-schema executable DDL

- Severity: **P0**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: Migration source authority and every SQL object reachable through applySurebetMigrations
- Current source evidence:
  - `packages/persistence/src/psql.ts` :: `loadSurebetMigrationFiles` :: lines `94-153` :: SHA-256 `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`. Resolves caller-provided directories without realpath containment or a fixed repository-owned path.
  - `packages/persistence/src/psql.ts` :: `SUREBET_MIGRATION_TARGET_PATTERNS / assertSurebetOnlyMigrationSql` :: lines `14-43; 219-265` :: SHA-256 `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`. Regex allowlist covers only selected statement families and does not inspect functions, procedures, triggers, types, extensions, grants, DO blocks, or dynamic SQL.
  - `packages/persistence/src/migrations.ts` :: `applySurebetMigrations` :: lines `41-90` :: SHA-256 `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`. Executes every migration returned by the permissive loader against the selected database.
- Preconditions: A caller, wrapper, compromised workspace, or future code path can influence repositoryRoot or migrationsDirectory, or a migration contains an executable statement family not covered by the regex scanner.
- Trigger: Load an absolute or traversal-resolved migration directory containing CREATE FUNCTION public.*, or a DO block that dynamically creates a public object, then pass the returned migrations to the normal application path.
- Expected behavior: Migration bytes must come only from the realpath-confined repository database/migrations/surebet directory, and database-level authority must make writes outside surebet.* impossible.
- Current behavior: Absolute and ../ migration directories are accepted. Cross-schema CREATE FUNCTION and dynamic DO SQL are accepted by the scanner. applySurebetMigrations would submit those bytes to psql.
- Impact: A migration invocation can execute cross-schema DDL or other unreviewed SQL. This is a direct schema-ownership escape and meets the P0 taxonomy even though the 12 supplied migrations are currently confined.
- Evidence: An inert external Node harness called only loadSurebetMigrationFiles. It accepted an absolute directory, a traversal directory, CREATE FUNCTION public.r03_escape(), and a dynamic DO block. No SQL or database command was executed.
- Transaction/state-machine analysis: The loader establishes source authority before the migration transaction begins. Because containment and complete statement authority are absent at that boundary, the later per-migration transaction cannot constrain where the SQL writes.
- Root cause: Migration authority is enforced by incomplete lexical matching and caller-selected filesystem paths rather than a fixed, realpath-confined source plus a database role restricted to surebet.*.
- Minimal fix boundary: Confine the migration directory by realpath against the repository root, reject symlink and traversal escapes, remove ordinary caller override from production entrypoints, replace the incomplete regex as the security boundary, and require a database role whose privileges cannot create or mutate objects outside surebet.*.
- Reproduction status: `REPRODUCED_INERT`. runtime=Node v22.16.0 supplementary. database_used=False. harness=/tmp/bws116-r03-review/harness/migration-scope-harness.mjs. result=all three escape cases accepted.
- Required tests:
  - Absolute-path and ../ traversal rejection
  - Symlink escape rejection
  - CREATE FUNCTION/PROCEDURE/TRIGGER/TYPE/EXTENSION and GRANT/REVOKE rejection
  - DO and dynamic SQL rejection
  - Disposable PostgreSQL proof that the migration role cannot write outside surebet.*
- Regression risks:
  - Legitimate future migration syntax may require an explicit reviewed allowlist update
  - Tightening the database role can expose undocumented cross-schema assumptions
- Primary owner: `R03`
- Secondary sectors: `R08`, `R10`, `R11`
- Aliases/dependencies: `KNOWN_BASELINE_MANIFEST_DRIFT is unrelated`
- Explicitly unchanged areas:
  - The 12 migration files in the frozen archive remain byte-unchanged and presently reference surebet.* objects only
  - No migration was applied
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-002 — The migration-status read path creates schema objects before reporting status

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet schema and surebet.schema_migrations
- Current source evidence:
  - `packages/persistence/src/migrations.ts` :: `listAppliedSurebetMigrations` :: lines `92-110` :: SHA-256 `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`. Always executes CREATE SCHEMA IF NOT EXISTS and CREATE TABLE IF NOT EXISTS before reading the ledger.
  - `packages/bootstrap/src/operations/database-lifecycle.ts` :: `getBwsDatabaseMigrationStatus` :: lines `262-308` :: SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Calls the mutating listAppliedSurebetMigrations method from the status operation.
  - `docs/037_database_backup_retention_and_recovery.md` :: `Migration status contract` :: lines `9-19` :: SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. States that no migration may run implicitly for status or dry-run.
- Preconditions: The target database does not yet contain the surebet schema or migration ledger, or the caller expects a strictly read-only status probe.
- Trigger: Run the migration-status operation.
- Expected behavior: Status must report schema and ledger absence without creating either object.
- Current behavior: The status path runs bootstrap DDL first, so an empty database is changed before status is calculated.
- Impact: A read-only diagnostic can alter a database, manufacture the ownership state it is supposed to observe, require write privileges, and mask the distinction between never-initialized and initialized-with-no-migrations.
- Evidence: The call graph is direct: getBwsDatabaseMigrationStatus -> listAppliedSurebetMigrations -> executePsqlCommand(MIGRATION_BOOTSTRAP_SQL). The documented contract explicitly forbids implicit migration during status.
- Transaction/state-machine analysis: The operation performs a write transition (schema/table absent -> present) before constructing its supposedly observational state. No transaction rollback restores the original database.
- Root cause: Bootstrap creation was shared between apply and inspect paths instead of separating read-only catalog inspection from migration initialization.
- Minimal fix boundary: Make status query pg_catalog/information_schema first and report absent objects. Keep MIGRATION_BOOTSTRAP_SQL exclusively in the explicit apply path.
- Reproduction status: `STATICALLY_CONFIRMED`. runtime=not required. database_used=False. limitation=PostgreSQL unavailable, so object creation was not executed.
- Required tests:
  - Status against an empty disposable database leaves schema/table counts unchanged
  - Status under a read-only role reports absence rather than failing or mutating
  - Repeated status is observationally idempotent
- Regression risks:
  - Existing automation that accidentally relies on status to initialize the ledger will fail and must call the explicit migration command
- Primary owner: `R03`
- Secondary sectors: `R08`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Explicit migration application remains allowed
  - Backup and restore command semantics are not changed by this finding
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-003 — Unknown applied migration rows are ignored and can be reported as compatible

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet.schema_migrations lineage
- Current source evidence:
  - `packages/bootstrap/src/operations/database-lifecycle.ts` :: `buildMigrationChecksumMismatches` :: lines `1054-1075` :: SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Applied migration names absent from the archive are skipped rather than classified as incompatible.
  - `packages/bootstrap/src/operations/database-lifecycle.ts` :: `getBwsDatabaseMigrationStatus` :: lines `278-305` :: SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Compatibility depends only on checksum mismatches for known files and schema existence.
  - `packages/persistence/src/migrations.ts` :: `applySurebetMigrations` :: lines `45-84` :: SHA-256 `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`. The application snapshot verifies known names but does not reject extra ledger rows.
- Preconditions: The selected database contains an applied migration name not present in the frozen archive, such as a newer, renamed, foreign, or manually inserted migration row.
- Trigger: Run migration status or apply from this archive.
- Expected behavior: A frozen binary must classify a divergent or newer migration lineage explicitly and fail closed unless a reviewed forward-compatibility rule proves it safe.
- Current behavior: The unknown row is ignored. If all known checksums match and the schema exists, status is compatible and apply proceeds with the current file set.
- Impact: An older or divergent application can be allowed to operate against a schema it does not understand, producing false migration compatibility and unsafe rollback/upgrade decisions.
- Evidence: The mismatch builder executes continue when expectedSha256 is undefined; compatibility has no unknown-applied-migration reason.
- Transaction/state-machine analysis: Migration compatibility is a set-and-digest comparison. The implementation checks only archive -> ledger presence/pending and known-name digest mismatch, not ledger -> archive surplus, so the relation is not exact.
- Root cause: The migration ledger is treated as a cache of known rows rather than authoritative schema lineage requiring explicit forward/backward compatibility.
- Minimal fix boundary: Add unknownApplied entries to the status contract, make compatibility fail closed by default, and permit forward compatibility only through an explicit reviewed compatibility range or schema capability proof.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False. limitation=No disposable PostgreSQL ledger was available.
- Required tests:
  - Ledger with one unknown applied migration is incompatible
  - Renamed migration and same-SQL/different-name cases
  - Older binary against newer schema
  - Exact known set remains compatible
- Regression risks:
  - A strict set check can block intentional rolling upgrades unless compatibility policy is made explicit
- Primary owner: `R03`
- Secondary sectors: `R08`, `R09`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Known migration checksum checking remains valid
  - No claim is made that the current target database contains an unknown row
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-004 — Concurrent migration applications are not serialized around ledger observation and insertion

- Severity: **P2**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet.schema_migrations and all migration DDL
- Current source evidence:
  - `packages/persistence/src/migrations.ts` :: `applySurebetMigrations` :: lines `41-84` :: SHA-256 `2ae8d8e9d9cdb6c08003371083c2065dd803ad5d82258f5be3166a17da01f57b`. Reads the complete applied ledger once, then applies each absent migration without an advisory lock or in-database compare-and-apply protocol.
- Preconditions: Two application or lifecycle processes invoke migration application against the same database at the same time.
- Trigger: Both processes read the same pre-application ledger and attempt the same migration transaction.
- Expected behavior: Exactly one migrator should own the schema transition; peers should wait and then observe the committed ledger.
- Current behavior: Both callers can classify the migration as absent. One commits; the other can fail on the ledger primary key or on future non-idempotent DDL even though the database reached the desired state.
- Impact: Concurrent startup can create false deployment failure, partial rollout behavior across processes, and nondeterministic operator results.
- Evidence: No pg_advisory_xact_lock, locked ledger row, serializable retry protocol, or re-read inside a migration-owner transaction exists.
- Transaction/state-machine analysis: The observation of absence and the insertion of the migration row are not protected by one ownership fence spanning competing migrators.
- Root cause: Migration application assumes a single caller but the service/lifecycle architecture does not encode that assumption in PostgreSQL.
- Minimal fix boundary: Acquire a repository-specific PostgreSQL advisory lock before bootstrap/ledger inspection, re-read under the lock, apply in deterministic order, and release only after the ledger row is durable.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False. limitation=Concurrent PostgreSQL execution unavailable.
- Required tests:
  - Two concurrent migrators against a disposable database
  - Second migrator waits and returns skipped rather than failing
  - Crash while holding the lock and subsequent recovery
- Regression risks:
  - Lock-key collisions must be avoided
  - Long migrations need an explicit bounded lock-wait policy
- Primary owner: `R03`
- Secondary sectors: `R08`, `R06`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Each individual supplied migration remains wrapped in BEGIN/COMMIT
  - Current migrations use CREATE TABLE/INDEX IF NOT EXISTS
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-005 — psql subprocesses have no explicit timeout or cancellation boundary

- Severity: **P2**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: All repository queries and mutations executed through psql
- Current source evidence:
  - `packages/persistence/src/psql.ts` :: `runPsql` :: lines `191-217` :: SHA-256 `86053cd5690b15a2ba6ea210e3073c3324017d12fb36ec1fe815c84edab50343`. Uses synchronous execFileSync with no timeout, killSignal, or caller cancellation channel.
- Preconditions: psql, DNS/socket connection, authentication, a database lock, query execution, or output delivery stalls.
- Trigger: Invoke any repository, migration, status, scheduler, or worker persistence operation.
- Expected behavior: Every database subprocess must have a bounded command budget, classified timeout, deterministic cleanup, and cancellation propagation from service shutdown.
- Current behavior: The Node process blocks synchronously until psql exits. Service pass timeouts cannot interrupt this child.
- Impact: A single blocked database command can freeze the event loop, prevent lease handling and graceful drain, and make configured service timeout values non-binding.
- Evidence: The execFileSync options set encoding/env/stdio only. No timeout is supplied and no child handle exists for cancellation.
- Transaction/state-machine analysis: All persistence calls are synchronous process ownership boundaries. Without a subprocess deadline, higher-level Promise races cannot regain control while Node is inside execFileSync.
- Root cause: The persistence abstraction omits command-budget and abort ownership from its public configuration.
- Minimal fix boundary: Add a required bounded psql timeout and maximum output size, map timeout/termination distinctly, redact errors, and thread an abort/deadline policy through long-running service calls. Consider a pooled PostgreSQL driver for transactional and cancellation semantics.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Sleeping fake psql is terminated at the configured budget
  - Blocked database query does not prevent service shutdown indefinitely
  - Timeout is distinct from SQL failure and authentication failure
- Regression risks:
  - Too-short defaults can abort legitimate migrations or backups
  - Switching drivers changes error and transaction semantics
- Primary owner: `R03`
- Secondary sectors: `R06`, `R08`, `R10`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - execFileSync argument arrays avoid shell interpolation
  - No credentials were printed during review
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-006 — Repository idempotency claims use read-then-insert races instead of atomic create-or-compare operations

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: upstream_locks, import_runs, pinned_strategy_exports, strategy_ledger_entries, worker_jobs, scheduler checkpoints, convergence checkpoints, B1 records
- Current source evidence:
  - `packages/persistence/src/repositories/upstream-lock-repository.ts` :: `SurebetUpstreamLockRepository.put` :: lines `32-88` :: SHA-256 `c77663c55b41255a4c1f455012d5427b55f8a5cf1c733e7b800cc334f407a8bc`. Checks by ID and fingerprint in separate psql sessions before INSERT.
  - `packages/persistence/src/repositories/import-run-repository.ts` :: `SurebetImportRunRepository.create` :: lines `60-115` :: SHA-256 `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`. Checks existence, then inserts unconditionally.
  - `packages/persistence/src/repositories/strategy-ledger-repository.ts` :: `SurebetStrategyLedgerRepository.create` :: lines `56-143` :: SHA-256 `a3874447d9cf6334eafd4eaf1e7a45c3cd95b48fe865fcc68ba1f5583ca32528`. Checks ID, run fingerprint, and report hash before unconditional INSERT.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `SurebetWorkerJobRepository.create` :: lines `220-270` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Checks job ID then inserts unconditionally.
  - `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` :: `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.create` :: lines `74-121` :: SHA-256 `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489`. Checks checkpoint ID then inserts unconditionally.
  - `packages/persistence/src/repositories/b1-upstream-convergence-repository.ts` :: `SurebetB1UpstreamConvergenceRepository.create` :: lines `59-110` :: SHA-256 `468cde29f264349925fe65e33d5b7e05fb34390877bb0f2503345154160d6884`. Uses the same read-then-insert pattern.
- Preconditions: Two callers create the same logical identity concurrently, with either equal or conflicting payloads.
- Trigger: Both existence checks complete before either INSERT commits.
- Expected behavior: Equal requests should converge to one retained record; conflicting payloads should return the repository-specific deterministic conflict code.
- Current behavior: One INSERT wins and another surfaces a raw wrapped psql uniqueness failure. The loser does not re-read and compare the committed row.
- Impact: Scheduler, convergence, import, and worker retries can be reported as failures even when the desired record is durable. Conflicting payloads lose their typed conflict semantics, weakening recovery decisions.
- Evidence: The pattern recurs across all creation repositories. Database uniqueness prevents many physical duplicates, but it does not provide application-level atomic idempotency or deterministic conflict classification.
- Transaction/state-machine analysis: IDLE/absent -> inserted is claimed in application memory. There is no INSERT ... ON CONFLICT ... RETURNING protocol or transaction that binds claim and comparison.
- Root cause: Idempotency is implemented as optimistic preflight reads rather than a database atomic claim keyed by identity and immutable payload digest.
- Minimal fix boundary: Use one database round trip per create: INSERT ... ON CONFLICT DO NOTHING RETURNING, then fetch and compare in the same transaction; or encode identity plus immutable digest in a conflict-aware UPSERT that never overwrites.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False. limitation=Real concurrent connections unavailable.
- Required tests:
  - Concurrent equal creates converge to one success result
  - Concurrent different creates return the typed conflict
  - Unique secondary identities such as fingerprint/report hash are classified deterministically
  - Scheduler/job restart uses the production repository, not an in-memory fake
- Regression risks:
  - Incorrect ON CONFLICT targets could mask secondary-identity conflicts
  - Automatic overwrite must remain prohibited
- Primary owner: `R03`
- Secondary sectors: `R01`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Existing primary and unique constraints remain useful and must not be removed
  - Pure strategy identity composition remains R02-owned
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-007 — Finalization and checkpoint advances validate expected state in one session but update by ID in another

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: import_runs and all mutable convergence/scheduler/observation checkpoint rows
- Current source evidence:
  - `packages/persistence/src/repositories/import-run-repository.ts` :: `SurebetImportRunRepository.finalize` :: lines `117-157` :: SHA-256 `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`. Reads running state, then UPDATE filters only by import_run_id.
  - `packages/persistence/src/repositories/upstream-api-convergence-repository.ts` :: `SurebetUpstreamApiConvergenceRepository.advance` :: lines `149-198` :: SHA-256 `298c9e2b2d874f5e11e7278893f00acaaaf16b48a47fde0cab41c33e59017ba0`. Checks expected cursor/resource state before an ID-only UPDATE.
  - `packages/persistence/src/repositories/upstream-export-convergence-repository.ts` :: `SurebetUpstreamExportConvergenceRepository.advance` :: lines `115-164` :: SHA-256 `dbfac37a5aac9e6139532312a0635f25f655c8739782e186f72bc6717bd79600`. Checks expected selection index before an ID-only UPDATE.
  - `packages/persistence/src/repositories/private-paper-runtime-scheduler-checkpoint-repository.ts` :: `SurebetPrivatePaperRuntimeSchedulerCheckpointRepository.advance` :: lines `201-236` :: SHA-256 `fd997e6c563e93a0055066ae7ffc64173402495429983e0574b6e929aa743489`. Checks expected cycle number before an ID-only UPDATE.
  - `packages/persistence/src/repositories/b1-private-observation-repository.ts` :: `complete / block` :: lines `119-167` :: SHA-256 `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`. Checks started state before an ID-only terminal UPDATE.
- Preconditions: Two finalizers or checkpoint advancers operate concurrently on the same record.
- Trigger: Both precondition reads observe the same current state, after which the updates execute in a different order.
- Expected behavior: Expected state must be part of the UPDATE predicate and exactly one transition may succeed; retries must compare the retained terminal payload.
- Current behavior: The UPDATE predicates contain only the primary ID. Both callers can pass preflight validation and the later writer can replace the earlier terminal outcome or advance from stale state.
- Impact: Import outcomes, convergence cursors, scheduled cycle identities, and B1 terminal evidence can become last-writer-wins rather than monotonic and conflict-detecting. This permits skipped/reordered work and false terminality.
- Evidence: Every listed method opens separate psql processes for read and write and does not inspect an affected-row RETURNING result tied to expected state.
- Transaction/state-machine analysis: The intended transition is state S(expected) -> S(next), but implementation performs read(S), gap, update(ID). The gap admits an intervening transition and the write does not prove it consumed the state read.
- Root cause: Optimistic concurrency is enforced only in TypeScript, outside the database transaction that owns the state.
- Minimal fix boundary: Move each transition into one SQL statement or transaction with current status/cursor/version in WHERE, use RETURNING, distinguish zero-row stale from missing, and compare retained terminal payloads for idempotent replay.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Two concurrent import finalizers with equal and conflicting outcomes
  - Two API/export cursor advances from one expected cursor
  - Two scheduler instances advancing one checkpoint
  - Concurrent B1 complete versus block
- Regression risks:
  - Adding strict CAS can expose callers that currently depend on silent last-writer-wins behavior
- Primary owner: `R03`
- Secondary sectors: `R01`, `R04`, `R06`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Read model ordering is unchanged
  - Upstream semantic validity remains R01-owned
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-008 — Worker heartbeat, checkpoint, completion, and retry transitions omit the lease fence from their mutation predicates

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet.worker_jobs and surebet.worker_job_checkpoints
- Current source evidence:
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `heartbeatLease / recordCheckpoint` :: lines `438-546` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Ownership is checked by a prior read; heartbeat and job checkpoint update filter only by job_id.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `complete / fail` :: lines `609-692` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Completion and retry UPDATEs filter only by job_id after a prior lease read.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `requireOwnedActiveLease` :: lines `844-879` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Lease validation is performed outside the subsequent mutation.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `deadLetterOwnedJob` :: lines `882-962` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Provides the correct contrasting pattern: status, owner, and token are included in one UPDATE and checked through RETURNING.
- Preconditions: A lease-owning worker overlaps with failure/retry, reaping, another claim, another same-lease mutation, or service shutdown.
- Trigger: The worker passes requireOwnedActiveLease, then another transaction changes the row before the worker mutation executes.
- Expected behavior: Every lease-authorized mutation must atomically require status=leased, exact owner, exact token or epoch, and active lease in the same SQL statement.
- Current behavior: Heartbeat, checkpoint job update, completion, and retry use WHERE job_id only. A stale operation can alter a later lease or race a conflicting transition; checkpoint insertion can publish after the job became terminal.
- Impact: A stale worker can extend a replacement lease, complete work after a retry/reclaim sequence, publish late checkpoints, or produce success/error ordering that does not correspond to a single owner. Duplicate economic/evidence effects become possible.
- Evidence: The source itself demonstrates the missing predicates. deadLetterOwnedJob already uses an atomic fenced UPDATE, showing the intended mechanism exists but is not applied consistently.
- Transaction/state-machine analysis: Lease token is a valid fence only when every mutation consumes it atomically. The current two-phase read then ID-only update makes the token advisory.
- Root cause: Lease ownership and state mutation are split across psql sessions instead of encoded in one conditional database transition.
- Minimal fix boundary: Use conditional UPDATE/CTE statements with job_id, status, lease_owner, lease_token, lease expiry, and optionally monotonic lease_epoch; use RETURNING and zero-row stale-owner classification. Keep checkpoint insert plus job metadata update atomic and fenced.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False. limitation=Race was not executed against PostgreSQL.
- Required tests:
  - Old worker completion after new claim
  - Heartbeat racing retry and replacement claim
  - Checkpoint racing success/dead-letter
  - Completion versus retry race
  - Exactly-once release of lease fields
- Regression risks:
  - Stricter fencing can surface latent late callbacks as errors; callers must treat them as stale completion, not retryable work
- Primary owner: `R03`
- Secondary sectors: `R06`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Atomic FOR UPDATE SKIP LOCKED claim remains a safeguard
  - Dead-letter owner/token CAS remains a safeguard
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-009 — Worker availability and lease validity are controlled by caller timestamps with inconsistent expiry boundaries

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: worker_jobs.available_at, claimed_at, lease_expires_at, last_heartbeat_at and terminal timestamps
- Current source evidence:
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `claimNext` :: lines `355-435` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Uses caller claimedAt for eligibility, claimed_at, heartbeat, and lease expiry.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `validateClaimRequest / validateHeartbeatRequest` :: lines `1166-1200` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Computes lease expiry from caller-provided timestamps.
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `requireOwnedActiveLease / reapExpiredLeases` :: lines `751-879` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Active check rejects only expiry < observedAt, while reaping treats expiry <= reapedAt as expired.
- Preconditions: Worker clocks are skewed, injected incorrectly, move backward, or two operations observe the exact expiry instant.
- Trigger: Claim, heartbeat, completion, failure, or reap uses the supplied timestamp.
- Expected behavior: PostgreSQL should own lease-now and monotonic lease epochs, with one consistent half-open validity rule; business timestamps should be validated for chronology.
- Current behavior: A future caller clock can claim retry work early and create long leases; a past clock can authorize late completion against real time or regress heartbeat fields. At equality, requireOwnedActiveLease accepts while reaper expires.
- Impact: Clock skew can create premature claims, effectively unbounded leases, stale-worker publication, and contradictory active/expired decisions.
- Evidence: All relevant SQL literals are derived from injected strings; no CURRENT_TIMESTAMP predicate or monotonic version is used for lease authority.
- Transaction/state-machine analysis: The lease state machine uses wall-clock values supplied by each actor as authority. Since actors need not share one clock and there is no version fence, time does not establish a total order.
- Root cause: Deterministic test clocks were elevated into production concurrency authority instead of separating observable event time from database lease time.
- Minimal fix boundary: Use database-generated lease timestamps and a monotonic lease epoch/fencing token; define validity as now < expires_at consistently; reject timestamp regression and preserve injected clocks only for non-authoritative evidence fields.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Future-skew claim cannot claim not-yet-available work
  - Past-skew completion after real expiry is rejected
  - Exact expiry instant has one result
  - Heartbeat cannot regress last_heartbeat_at or lease_expires_at
- Regression risks:
  - Changing time authority can affect deterministic test fixtures and requires explicit database clock control in tests
- Primary owner: `R03`
- Secondary sectors: `R06`, `R10`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - ISO-8601 syntax validation remains useful
  - Pure quote/source currentness remains R01/R02-owned
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-010 — Expired leases are always dead-lettered even when retry budget remains

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet.worker_jobs stale-lease transition and surebet.worker_job_dead_letters
- Current source evidence:
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `reapExpiredLeases / deadLetterExpiredLease` :: lines `751-830; 965-1037` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Every expired leased row is transitioned directly to dead_lettered; retryDelaysMs is not consulted.
  - `docs/035_continuous_service_supervisor_contract.md` :: `Required worker behavior` :: lines `65-72` :: SHA-256 `cae4ce541c65848974de8c4568e72b6d2d3d151d9f2c3eaf52cb50e6777c8505`. Requires stale-lease recovery without double finalization and bounded retry schedules.
  - `database/migrations/surebet/004_create_worker_jobs.sql` :: `surebet.worker_jobs` :: lines `1-111` :: SHA-256 `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`. Stores retry schedule and attempt count but has no abandoned/unknown state or expiry policy field.
- Preconditions: A worker dies or loses connectivity while holding a lease and the job still has configured retry delays remaining.
- Trigger: The next worker pass invokes reapExpiredLeases.
- Expected behavior: The durable policy must distinguish abandoned/unknown work, apply the configured retry budget when replay is safe, and dead-letter only on exhaustion or an explicit non-replayable policy.
- Current behavior: The reaper unconditionally writes dead_lettered with SUREBET_WORKER_JOB_LEASE_EXPIRED. No remaining retry calculation is performed.
- Impact: Transient worker failure becomes permanent work loss. Standard and B1 private-paper cycles can be stranded even though their queue record was explicitly configured with retries.
- Evidence: The normal fail path reads retryDelaysMs[attemptCount-1], but the expired-lease path bypasses it entirely.
- Transaction/state-machine analysis: leased -> expired has only one terminal edge. The configured retry_wait edge is available for handler-reported failure but not for process crash, the exact case durable queues must recover.
- Root cause: Lease expiration policy is hard-coded as terminal rather than derived from retry budget and idempotency/replay safety.
- Minimal fix boundary: Add an explicit atomic expired-lease transition: retry_wait with next availability while budget remains and replay is authorized; dead_lettered only when exhausted or policy says outcome is unknown/non-replayable. Preserve prior lease evidence.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Expired first attempt with remaining retries moves to retry_wait
  - Expired final attempt dead-letters
  - Concurrent reapers transition once
  - Unknown-side-effect policy remains fail-closed
  - Recovered job cannot be finalized by stale worker
- Regression risks:
  - Automatic replay is unsafe until the idempotency and fencing findings are fixed; implementation order must place those first
- Primary owner: `R03`
- Secondary sectors: `R06`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Dead-letter evidence table remains required
  - No live execution path is authorized
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-011 — Configured service timeouts and shutdown signals do not cancel in-flight scheduler or worker work

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: Worker/scheduler durable effects after timeout, cancellation, or service drain
- Current source evidence:
  - `packages/bootstrap/src/workers/bounded-job-worker.ts` :: `RunBoundedWorkerPassRequest / runHandlerWithLeaseRenewal` :: lines `59-77; 313-347` :: SHA-256 `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7`. No AbortSignal or handler deadline exists; the renewal loop can continue forever until the handler settles.
  - `packages/bootstrap/src/operations/private-paper-worker-service.ts` :: `worker pass execution / raceWithTimeout` :: lines `379-395; 552-574` :: SHA-256 `1527b3a36e20f2221793a612011b65edf34d0d190534b95f43136ab9ebe58d36`. After timeout it awaits the same raw pass promise; helper itself awaits passPromise before returning timedOut=true.
  - `packages/bootstrap/src/operations/private-paper-scheduler-service.ts` :: `executePass / raceWithTimeout` :: lines `505-514; 531-553` :: SHA-256 `876cd3d1b142d369b999f10a49e7a01e9b8469af14d84bbef64efdc6ae3bc967`. Uses the same wait-after-timeout pattern.
- Preconditions: A handler, convergence call, psql command, or injected pass promise never settles or settles after passTimeoutMs/SIGTERM.
- Trigger: The timeout fires or shutdownSignal is set while work is in flight.
- Expected behavior: The service must stop awaiting at the deadline, propagate cancellation to underlying work, stop renewing leases, fence late mutations, and report a distinct timeout/cancel state.
- Current behavior: Timeout only changes later classification. Both helpers await the original promise after the sentinel. Worker shutdown is checked only before new claims; the in-flight handler receives no cancellation and continues lease renewal.
- Impact: Graceful shutdown can hang indefinitely, configured timeout budgets are false, late work can publish checkpoints/ledger/terminal results, and resource ownership is not released at the claimed deadline.
- Evidence: The source has two explicit await rawPassPromise paths after timeout and an infinite renewal loop without drain/abort observation.
- Transaction/state-machine analysis: RUNNING has no cancellation transition. TIMEOUT is recorded only after RUNNING eventually terminates, so it is not a state boundary and cannot prevent late durable effects.
- Root cause: Timeout and signal handling are observational wrappers rather than ownership/cancellation mechanisms threaded through worker handlers and repositories.
- Minimal fix boundary: Introduce AbortSignal and absolute deadlines at service, pass, handler, adapter, and persistence boundaries; stop renewal on abort; return at timeout; fence late result publication by lease epoch/status; add cancelled/timed_out/unknown durable states as required.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False. harness_note=Focused tests passed only with resolving fakes; no unresolved-promise test exists.
- Required tests:
  - Never-settling worker handler exits service within timeout
  - SIGTERM during handler stops lease renewal and prevents new durable writes
  - Late handler resolution cannot complete the job
  - Scheduler pass timeout returns without awaiting the pass
  - Timer/listener cleanup occurs exactly once
- Regression risks:
  - Cancellation can expose non-cancellable psql calls until finding 005 is fixed
  - New durable states require migration and API/read-model updates
- Primary owner: `R03`
- Secondary sectors: `R06`, `R10`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Existing drain behavior before new claims remains valid
  - Generic child-process supervision details remain R06-owned
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-012 — Checkpoint, dead-letter, B1 child-row, and expired-lease reads are unbounded

- Severity: **P2**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: worker_job_checkpoints, worker_job_dead_letters, worker_jobs, b1_candidate_snapshots, b1_simulation_results
- Current source evidence:
  - `packages/persistence/src/repositories/worker-job-repository.ts` :: `listCheckpoints / listDeadLetters / reapExpiredLeases` :: lines `573-607; 720-830` :: SHA-256 `263481bca4ae76ceda0e134e7b1d707f17b9de89679c5e0a51f0f5e10431b57e`. Limits are optional or absent; reaper materializes every expired lease and performs one follow-up psql operation per row.
  - `packages/persistence/src/repositories/b1-backtest-run-repository.ts` :: `listCandidates / listSimulationResults` :: lines `285-341` :: SHA-256 `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`. Returns every child row for a run without a limit or cursor.
- Preconditions: Long-running runtime evidence accumulates many checkpoints, dead letters, expired leases, candidates, or simulation results.
- Trigger: A list/read/reaper call runs with default options or on a large B1 run.
- Expected behavior: Persistence APIs must require bounded page sizes and stable cursors; maintenance transitions must process bounded batches atomically.
- Current behavior: Several methods issue no LIMIT. The reaper loads all expired jobs and then creates N additional psql sessions.
- Impact: Memory, output-buffer, process-count, and database-load spikes can block workers and lifecycle diagnostics. Backpressure is undermined precisely during failure accumulation.
- Evidence: The SQL shown contains no LIMIT for dead letters, reaping, or B1 child rows; checkpoint limit is optional and defaults to empty.
- Transaction/state-machine analysis: The state machine has bounded claim maxJobs but an unbounded pre-pass recovery scan. Read-side cardinality is not coupled to configured worker/service limits.
- Root cause: Boundedness is enforced at selected service loops but omitted from repository contracts and maintenance queries.
- Minimal fix boundary: Require explicit positive limits and stable keyset cursors; add a bounded bulk expired-lease CTE with SKIP LOCKED/RETURNING; page B1 children and dead letters.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Large-cardinality query plans use indexes and fixed limits
  - Reaper handles at most batchSize and is repeatable
  - Stable keyset ordering under concurrent inserts
  - psql output remains below configured maximum
- Regression risks:
  - Pagination changes API consumers and evidence aggregation
  - Bulk reaping must preserve per-job dead-letter evidence
- Primary owner: `R03`
- Secondary sectors: `R05`, `R06`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Individual query ordering is deterministic where ORDER BY is present
  - Worker claim maxJobs remains bounded
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

### BWS116-R03-013 — Import-run retention ignores convergence references, causing either deletion failure or dangling durable identity

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: surebet.import_runs and convergence last_import_run_id references
- Current source evidence:
  - `packages/bootstrap/src/operations/database-lifecycle.ts` :: `buildRetentionPlanQuery / buildRetentionDeleteSql` :: lines `568-598; 854-875` :: SHA-256 `b3e4657765a6152f8ee96e0bf688d4df116412ee08db877dab02abb17f68f377`. Import-run candidates exclude pinned exports only, then are deleted without rechecking convergence references.
  - `database/migrations/surebet/005_create_upstream_export_convergence_checkpoints.sql` :: `surebet.upstream_export_convergence_checkpoints.last_import_run_id` :: lines `1-39` :: SHA-256 `8d3c09c06b61e4fb1774879c51467381b70bbe6f46c86c660345c63667089e3c`. Stores last_import_run_id as plain text without a foreign key.
  - `database/migrations/surebet/006_create_upstream_api_convergence_checkpoints.sql` :: `surebet.upstream_api_convergence_checkpoints.last_import_run_id` :: lines `1-28` :: SHA-256 `3d5ac1c0f2d89aac08acb057668b87b2e9116f274ff78020568dc82522f270f7`. Stores the analogous API reference with a restrictive foreign key.
  - `docs/037_database_backup_retention_and_recovery.md` :: `Retention contract` :: lines `44-54` :: SHA-256 `6d65630b7d351c1e59318f4761cbb05de099d1661c37fea18d5bf603fd560d10`. Requires preservation of references needed by accepted runtime cycles and strategy state.
- Preconditions: A completed old import run is not referenced by pinned_strategy_exports but is referenced by an API or export convergence checkpoint.
- Trigger: Generate and apply an import_runs retention plan containing that run.
- Expected behavior: The plan must exclude every retained reference and revalidate atomically before deletion; equivalent references must have consistent foreign-key semantics.
- Current behavior: The candidate query does not inspect convergence tables. API checkpoint references make DELETE fail through the FK; export checkpoint references allow DELETE and leave last_import_run_id dangling.
- Impact: Retention can produce a plan that cannot be applied or can destroy provenance required to reconstruct convergence state. Partial prune/recovery evidence becomes unreliable.
- Evidence: The two convergence schemas encode the same logical reference differently, while the retention anti-join covers neither.
- Transaction/state-machine analysis: PLANNED -> APPLY is not closed over the actual referential graph. One edge is enforced late by PostgreSQL, another is unenforced, so identical business preconditions produce divergent outcomes.
- Root cause: Retention ownership and schema reference ownership were designed independently without one authoritative dependency graph.
- Minimal fix boundary: Add consistent FKs or explicit immutable-reference tables, anti-join all retained references during planning, recheck in the delete transaction, and classify protected/skipped rows instead of failing the whole plan.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - API-referenced import is excluded
  - Export-referenced import is excluded
  - Concurrent new reference between plan and apply is preserved
  - Plan/apply deletedCount and protectedCount reconcile
- Regression risks:
  - Adding a foreign key requires cleanup of any existing dangling values
  - Retention throughput may fall without supporting indexes
- Primary owner: `R03`
- Secondary sectors: `R08`, `R01`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Pinned export protection remains valid
  - Operational backup/restore command ownership remains R08
- Blocking: release=true, BWS-600=true, B1=false, deployment=true.

### BWS116-R03-014 — Standard private-paper retries do not reconstruct durable previous cycle state

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: strategy_ledger_entries for private_paper_runtime_cycle and worker_jobs payload/checkpoints
- Current source evidence:
  - `packages/bootstrap/src/workers/private-paper-runtime-jobs.ts` :: `PersistedPrivatePaperRuntimeJobPayload / toRuntimeRequest / handler` :: lines `47-56; 90-217; 586-613` :: SHA-256 `cbf9794410c3c374c7cd22844c5fd1c5fc4e51c7322856b921753479f4b0ca5c`. Payload and reconstructed runtime request omit previousState; ledger is persisted before worker completion.
  - `packages/bootstrap/src/runtime/private-paper-runtime.ts` :: `PrivatePaperRuntimeRequest / validateRestartState / buildNextState` :: lines `96-104; 981-1060` :: SHA-256 `252e38a52693f3fa598c9ea92a83b184de0c4b29c4ab0bd5c952b750d009c6f5`. Idempotency mismatch protection is bypassed when previousState is absent.
  - `packages/bootstrap/src/strategy/strategy-ledger.ts` :: `createPrivatePaperStrategyLedgerEntry` :: lines `237-267` :: SHA-256 `d05e339a5692a9218f2146c153570ee7d9c8d79ae88282e162b7ece0c0cb5dbc`. Uses runtimeId:cycleId as runReferenceId but cycleFingerprint as the unique entry/report identity.
  - `database/migrations/surebet/003_create_strategy_ledger_entries.sql` :: `surebet.strategy_ledger_entries` :: lines `1-60` :: SHA-256 `b3a7695bfba8fedaa0bb3fccefdde9ae11d893e63a67b493647f0818ce507071`. Has no uniqueness constraint on run_kind plus run_reference_id.
- Preconditions: An API-backed private-paper job persists its strategy ledger entry, then crashes before worker completion; upstream query results differ when the job is retried.
- Trigger: The retry reconstructs the runtime request from the job payload and fetches current source pages.
- Expected behavior: The same runtimeId/cycleId must be bound to one immutable input digest and prior state; equal replay returns the retained outcome and changed replay is rejected.
- Current behavior: No prior runtime state is persisted or supplied. validateRestartState immediately accepts absence. A changed source produces a different cycle fingerprint and a second ledger identity with the same logical runReferenceId.
- Impact: One logical private-paper cycle can produce divergent accepted/blocked evidence across retries, duplicate ledger effects, and a worker result that does not identify which cycle incarnation is authoritative.
- Evidence: The runtime contains correct restart validation, but the production job adapter never supplies the required previousState and the schema does not enforce unique logical run identity.
- Transaction/state-machine analysis: Logical cycle state spans source fetch, runtime result, ledger insert, checkpoint insert, and worker terminal update. There is no durable aggregate row or transaction binding those phases, and replay begins from an empty prior-state view.
- Root cause: Restart state exists only as an optional in-memory API parameter, not as durable job/cycle authority.
- Minimal fix boundary: Persist a private-paper cycle aggregate keyed by runtimeId/cycleId with immutable input/cycle digest, reconstruct previousState from durable rows, enforce unique logical run reference, and atomically link ledger outcome to worker terminal publication or make replay return the retained result.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Crash after runtime result, after ledger insert, and after final checkpoint
  - Equal retry returns the same ledger/result
  - Changed upstream bytes for same cycle are rejected
  - Fresh process reconstructs previousState from PostgreSQL
- Regression risks:
  - Adding run-reference uniqueness requires resolving any pre-existing duplicates
  - Source-currentness semantics remain R01-owned and must not be weakened
- Primary owner: `R03`
- Secondary sectors: `R01`, `R04`, `R06`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Cycle fingerprint computation remains unchanged
  - No claim is made that pinned-record retries diverge
- Blocking: release=true, BWS-600=true, B1=false, deployment=true.

### BWS116-R03-015 — B1 backtest persistence commits the parent before children and suppresses repair on replay

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: b1_backtest_runs, b1_candidate_snapshots, b1_simulation_results
- Current source evidence:
  - `packages/persistence/src/repositories/b1-backtest-run-repository.ts` :: `SurebetB1BacktestRunRepository.create` :: lines `127-186` :: SHA-256 `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`. Inserts parent, then loops through candidate/simulation inserts in separate psql calls; existing parent with matching runHash returns immediately.
  - `packages/persistence/src/repositories/b1-backtest-run-repository.ts` :: `createCandidateSnapshot / createSimulationResults / insertSimulationResult` :: lines `354-448` :: SHA-256 `fca39b72d06d2685cf82445e95d033830af1eea4b60d9896b8bce69d1d53ec04`. Each child is inserted separately without a parent completion marker or expected child-count verification.
  - `database/migrations/surebet/009_create_b1_backtest_runs.sql` :: `surebet.b1_backtest_runs` :: lines `1-32` :: SHA-256 `c5b9b66325ca16346c48176236b73dea7fd79f51b5b18aba8ae73d33d7ad12ea`. Parent has no persistence-complete state or expected child counts.
  - `database/migrations/surebet/010_create_b1_candidate_snapshots.sql` :: `surebet.b1_candidate_snapshots` :: lines `1-21` :: SHA-256 `83da55cee8bc46ca6f47b8584aaa81c08794a268f5147fc9bef320201a79b78a`. Children are unique per run/candidate but completeness is not constrained.
  - `database/migrations/surebet/011_create_b1_simulation_results.sql` :: `surebet.b1_simulation_results` :: lines `1-20` :: SHA-256 `3e748cb212558268e675df42f809ce9e3cd29b8527a83fd9c00c5897341d15fa`. Simulation children are unique but completeness is not constrained.
- Preconditions: A psql call fails or the process crashes after the parent row or some child rows commit.
- Trigger: Retry create with the same runId/runHash.
- Expected behavior: Parent and all expected children must commit atomically, or replay must verify and deterministically repair/reject an incomplete graph before presenting the run.
- Current behavior: The parent persists first. On replay, matching parent causes an immediate return and no child completeness check or repair.
- Impact: A B1 run can appear durable and terminal while candidate or simulation evidence is missing. Reports and private observations can reference an incomplete backtest graph indefinitely.
- Evidence: The create method has one psql call for the parent and one or more per candidate/result. The early-return branch checks only runHash.
- Transaction/state-machine analysis: ABSENT -> PARENT_ONLY -> PARTIAL_CHILDREN -> COMPLETE has no stored phase. The public create method treats every state after PARENT_ONLY as COMPLETE on replay.
- Root cause: Aggregate persistence was decomposed into independent repository writes without an aggregate transaction or durable completion invariant.
- Minimal fix boundary: Persist the entire run graph in one PostgreSQL transaction, or add expected child counts/digests and a completion state with locked deterministic repair. Readers must reject non-complete aggregates.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Fault after parent insert
  - Fault after each candidate and simulation insert boundary
  - Replay repairs or rejects partial graph
  - Readers never expose incomplete run as complete
  - Concurrent equal creates converge
- Regression risks:
  - One large transaction can increase lock duration; batching must still preserve an atomic completion marker
- Primary owner: `R03`
- Secondary sectors: `R04`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - B1 mathematical contents remain R02/R04-owned
  - Current parent and child identifiers remain deterministic
- Blocking: release=true, BWS-600=false, B1=true, deployment=true.

### BWS116-R03-016 — B1 observation terminality and worker-job terminality can diverge after a crash

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: b1_private_observation_cycles, b1_backtest_runs and worker_jobs
- Current source evidence:
  - `packages/bootstrap/src/workers/b1-private-observation-jobs.ts` :: `createB1PrivateObservationJobHandler.run` :: lines `59-137` :: SHA-256 `ee293ef0e7a3edeef6ef6729c987f477f049523ccd3d0b150b874796e032a5cc`. Completes/blocks the observation inside the handler, then returns a result; worker-job terminal update occurs later in the bounded worker.
  - `packages/persistence/src/repositories/b1-private-observation-repository.ts` :: `create / complete / block` :: lines `73-167; 268-293` :: SHA-256 `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`. create accepts an existing terminal row by comparing only original started fields, but complete/block reject any non-started status.
  - `packages/bootstrap/src/workers/bounded-job-worker.ts` :: `runBoundedWorkerPass terminal dispatch` :: lines `180-218` :: SHA-256 `3f319fc5ad09636121698b36817f1762c4431dffb775535a2d62e3289b111dd7`. Calls jobs.complete or deadLetterOwnedJob only after the handler returns.
  - `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` :: `surebet.b1_private_observation_cycles` :: lines `1-37` :: SHA-256 `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6`. worker_job_id is not a foreign key and no cross-row terminal consistency constraint exists.
- Preconditions: The process crashes after observations.complete or observations.block commits but before the worker job is completed/dead-lettered.
- Trigger: The same worker job is retried.
- Expected behavior: Replay should detect the retained terminal observation and converge the worker job to the matching retained result without rerunning or contradicting terminal state.
- Current behavior: create returns the existing terminal observation, the backtest parent returns existing, then complete/block throws NOT_STARTED. The bounded worker converts the throw into a dead-letter result, so completed observation and dead-lettered job can coexist.
- Impact: Operational status, queue evidence, and B1 observation evidence disagree. A successful B1 result can be presented as a failed job, or blocked evidence can lose its original reason.
- Evidence: The handler and queue terminal writes are separate. The observation repository is partially idempotent at create but not idempotent at terminal replay.
- Transaction/state-machine analysis: The aggregate has two terminal authorities with a crash gap: observation STARTED -> COMPLETED/BLOCKED, then job LEASED -> SUCCEEDED/DEAD_LETTERED. No transaction or recovery mapping binds them.
- Root cause: Observation terminal persistence and worker terminal persistence were implemented as independent state machines without replay convergence.
- Minimal fix boundary: Make terminal observation methods idempotent-by-payload, persist an authoritative handler outcome, and atomically or recoverably project it to the worker job. Add FK/unique binding between job and observation where appropriate.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Crash after observation complete before job complete
  - Crash after observation block before job dead-letter
  - Retry converges without rerunning backtest
  - Conflicting retained terminal payload is rejected
- Regression risks:
  - Changing blocked handling may affect dead-letter reason semantics and read models
- Primary owner: `R03`
- Secondary sectors: `R04`, `R06`, `R07`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - runtimeEvidence=false and executable=false safeguards remain
  - B1 strategy calculations remain unchanged
- Blocking: release=true, BWS-600=false, B1=true, deployment=true.

### BWS116-R03-017 — Durable lifecycle tables accept impossible timestamp orderings

- Severity: **P1**
- Confidence: **HIGH**
- Classification: `CONFIRMED_FINDING`
- Relevant SQL object or migration: import_runs, worker_jobs, worker_job_checkpoints, b1_private_observation_cycles and related evidence timestamps
- Current source evidence:
  - `database/migrations/surebet/001_create_upstream_locks_and_import_runs.sql` :: `surebet.import_runs` :: lines `16-36` :: SHA-256 `9e42a36b06adc858c25e72c4fd6ab41500cdfdcbbb3e0a7ae556efd2ec771584`. Constrains nullability by outcome but not requested_at <= started_at <= completed_at.
  - `packages/persistence/src/repositories/import-run-repository.ts` :: `validatePendingRecord / validateFinalizeRecord` :: lines `194-230` :: SHA-256 `9bb1a79b2b27ea6cd3eaaf38cb22bb20148615a2400ff929b834ad2dbd08e00b`. Validates timestamp syntax but not chronology.
  - `database/migrations/surebet/004_create_worker_jobs.sql` :: `surebet.worker_jobs and checkpoints` :: lines `1-153` :: SHA-256 `9756445dbfbdac6226413098d1253527578d9420543287842c30d034df162b9c`. Does not enforce available/claim/heartbeat/checkpoint/completion/dead-letter chronology.
  - `database/migrations/surebet/012_create_b1_private_observation_cycles.sql` :: `surebet.b1_private_observation_cycles` :: lines `1-34` :: SHA-256 `5c4858bb130178460e45226677c6cc74610628badeca3632425c0a0838a474a6`. Does not enforce cycle_completed_at >= cycle_started_at.
  - `packages/persistence/src/repositories/b1-private-observation-repository.ts` :: `validateCreateRecord / validateCompleteRecord / validateBlockRecord` :: lines `220-249; 303-322` :: SHA-256 `a057be720b8d7794b5d3a29cac35879ea555a65f2238e085b98fb7ea730f9941`. Checks UTC syntax only.
- Preconditions: A caller clock regresses, inputs are reordered, or a malformed caller supplies syntactically valid timestamps in impossible order.
- Trigger: Create/finalize/heartbeat/checkpoint/complete with a terminal timestamp before the start or prior durable event.
- Expected behavior: Application validation and PostgreSQL CHECK constraints must preserve causal ordering, while retaining explicit source/event timestamps separately when out-of-order arrival is legitimate.
- Current behavior: Rows can satisfy all current constraints while completed_at precedes started_at, B1 completion precedes cycle start, or checkpoints/heartbeats regress.
- Impact: Sorting, retention cutoffs, recovery decisions, duration metrics, and evidence truth can be wrong while rows appear terminal and schema-valid.
- Evidence: All validators shown use regex/Date.parse shape checks. The migrations constrain state/null combinations but have no chronology predicates.
- Transaction/state-machine analysis: Lifecycle transitions have terminal labels but no database causal-order invariant. Therefore terminality is syntactically complete but not temporally coherent.
- Root cause: Timestamp syntax validation was not paired with semantic chronology constraints at repository or schema boundaries.
- Minimal fix boundary: Add explicit chronology validation and CHECK constraints for each state machine; use database authoritative transition time where appropriate; preserve source occurrence time separately from receive/persist time.
- Reproduction status: `STATICALLY_CONFIRMED`. database_used=False.
- Required tests:
  - Import requested/start/complete permutations
  - Worker claim/heartbeat/checkpoint/complete regression
  - B1 cycle completion before start
  - Boundary equality cases
  - Migration of any existing invalid rows is fail-closed and reported
- Regression risks:
  - Existing test fixtures with equal or synthetic timestamps may need clarification
  - Source event timestamps must not be conflated with database transition timestamps
- Primary owner: `R03`
- Secondary sectors: `R01`, `R06`, `R09`, `R11`
- Aliases/dependencies: none
- Explicitly unchanged areas:
  - Timestamp storage remains timestamptz
  - Fixed-point numeric persistence is unchanged
- Blocking: release=true, BWS-600=true, B1=true, deployment=true.

## Hypotheses and environment blockers

- `BWS116-R03-ENV-001` **Canonical Node 20.20.2 runtime unavailable**: The review environment exposed Node v22.16.0. TypeScript emit and focused tests under Node 22 are supplementary only and are not canonical acceptance.
- `BWS116-R03-ENV-002` **Disposable PostgreSQL execution unavailable**: psql and pg_isready were not installed and no local credentials/server were supplied. No database was created or contacted. PostgreSQL isolation, constraint, concurrency, and query-plan behavior therefore remain unexecuted.
- `BWS116-R03-HYP-001` **Ambient libpq environment may alter authentication or session behavior**: runPsql inherits process.env and only overrides PGPASSWORD when an explicit password is supplied. PGPASSFILE, PGSERVICE, PGOPTIONS, SSL variables, and ambient PGPASSWORD require R10 policy review. Explicit -d/-U/-p/-h arguments prevent the main target tuple from silently falling back.

## Intentional safeguards

- `BWS116-R03-SAFE-001` **Persistence configuration rejects missing and mixed explicit host/socket targets**: resolveSurebetPersistenceConfig requires database, user, port, and exactly one of host or socketDirectory.
- `BWS116-R03-SAFE-002` **Current archive migrations are ordered, transaction-controlled externally, and presently surebet-qualified**: The 12 frozen SQL files are lexically ordered 001 through 012, contain no explicit transaction control, and the static inventory found no current object target outside surebet.*.
- `BWS116-R03-SAFE-003` **Worker claim uses one atomic SKIP LOCKED update**: claimNext selects and updates one eligible job in a single CTE with FOR UPDATE SKIP LOCKED and deterministic ordering.
- `BWS116-R03-SAFE-004` **Owned and expired dead-letter transitions use current owner/token predicates**: deadLetterOwnedJob and deadLetterExpiredLease condition the update on current status and lease identity and use RETURNING before inserting dead-letter evidence.
- `BWS116-R03-SAFE-005` **Schema prevents runtime or execution promotion in B1 durable records**: B1 convergence, backtest, and observation migrations constrain runtime_evidence=false and executable=false, preserving the BWS-710/BWS-900 holds.
- `BWS116-R03-SAFE-006` **Scheduler identities are deterministic and sequential replay suppresses a previously created job**: The scheduler derives job IDs from scheduler checkpoint and cycle number and calls create before advancing, so a single-instance crash after create can re-observe the same job on restart.

## Rejected suspicions

- `BWS116-R03-REJ-001` **Current frozen migration files already write outside surebet.***: Rejected. Static inventory of all 12 SQL files found only surebet.* object targets. Finding 001 concerns the general loader/security boundary and future or caller-selected bytes, not a claim that current migrations escape.
- `BWS116-R03-REJ-002` **Archive has duplicate, unsafe, symlink, or special members**: Rejected. Independent ZIP inspection found 618 regular files, no duplicate paths, no unsafe paths, no symlinks, and no special entries.
- `BWS116-R03-REJ-003` **psql command construction uses a shell and directly interpolates command arguments**: Rejected. execFileSync receives an argument array, and repository values use SQL literal escaping. SQL authority and timeout defects remain separate.
- `BWS116-R03-REJ-004` **B1 bigint values are necessarily truncated by JavaScript reads**: Rejected for the reviewed repository projections. bigint columns are generally cast to text before JSON decoding; mathematical interpretation remains R02/R04-owned.
- `BWS116-R03-REJ-005` **Sequential scheduler restart necessarily creates a second job**: Rejected for a single scheduler instance with the same immutable payload. Deterministic job ID plus create/get can suppress it. Concurrent creation and checkpoint races remain findings 006 and 007.

## Cross-area handoffs

- `KNOWN_BASELINE_MANIFEST_DRIFT` -> `R11`: **Known SOURCE_MANIFEST.json drift**. The correct 617 non-self path set has seven stale Graphify/update-tooling hashes or sizes. Per frozen authority, this is not an R03 finding and is handed to R11.
- `BWS116-R03-HO-001` -> `R11`: **Aggregate false-green test and validator ownership**. R11 should incorporate TG-001 through TG-006 and verify that aggregate gates detect the confirmed persistence defects.
- `BWS116-R03-HO-002` -> `R08`: **Operational backup, restore, retention, and migration command lifecycle**. R08 owns command-level operational lifecycle. R03 retains ownership of schema/repository transaction correctness and finding 013 reference integrity.
- `BWS116-R03-HO-003` -> `R06`: **Generic process topology and shutdown ownership**. R06 owns child process topology, start/status/stop, and generic signal/listener lifecycle. R03 finding 011 covers the durable-state cancellation boundary.
- `BWS116-R03-HO-004` -> `R10`: **Environment and CLI precedence for PostgreSQL/libpq variables**. R10 should decide whether ambient libpq variables are permitted and ensure selected tuple/redaction rules are exact.
- `BWS116-R03-HO-005` -> `R04`: **B1 simulation and settlement semantics**. R04 owns whether B1 candidate/simulation contents are correct. R03 finding 015 concerns only atomic durable graph completeness.
- `BWS116-R03-HO-006` -> `R01`: **Upstream semantic validity before persistence**. R01 owns source contract/provenance/currentness semantics. R03 covers transactional storage, CAS, and replay after accepted input.
- `BWS116-R03-HO-007` -> `R02`: **Strategy mathematics and identity before persistence**. R02 owns mathematical/identity correctness. No R03 finding is assigned solely because a value might be mathematically wrong before storage.

## Test gaps

- `BWS116-R03-TG-001` **Migration tests do not exercise repository escape or unrecognized executable SQL**: The focused migration tests cover empty files, transaction keywords, deterministic order, and selected direct targets, but not absolute/traversal/symlink directories, functions, DO blocks, dynamic SQL, grants, or database privilege confinement.
- `BWS116-R03-TG-002` **PostgreSQL idempotency proof is sequential and skipped without explicit disposable configuration**: The focused suite reported six skipped tests, including the disposable PostgreSQL persistence proof. No two-connection race, injected commit failure, or isolation-level test ran.
- `BWS116-R03-TG-003` **Worker tests do not model stale completion after lease transition or takeover**: Worker tests exercise normal claim/heartbeat/retry/dead-letter paths, but do not interleave the production repository methods across two PostgreSQL sessions to prove fencing.
- `BWS116-R03-TG-004` **Standard private-paper restart tests reuse in-memory previousState rather than reconstructing production durable state**: The runtime unit tests demonstrate the optional previousState contract, while the production job payload omits it. There is no fresh-process PostgreSQL crash-window test spanning ledger persistence and worker completion.
- `BWS116-R03-TG-005` **B1 persistence tests do not inject failure between parent and child commits**: No disposable PostgreSQL test crashes after b1_backtest_runs insertion or between candidate/simulation inserts, and no replay-completeness assertion exists.
- `BWS116-R03-TG-006` **Service timeout and shutdown tests use promises that are eventually released**: The tests can classify timeout/drain only after fakes settle; they do not prove a never-settling pass is cancelled, lease renewal stops, or late durable calls are fenced.

The supplementary focused test run under Node 22 executed 68 tests: 62 passed, 0 failed, and 6 were skipped. The skipped set includes the disposable PostgreSQL proof. A separate initial selection included `bws-service-runtime.test.js` and produced five prerequisite failures because the frozen source archive intentionally lacks `config/betting-win.upstream.lock.json`; those failures were not classified as R03 source defects.

## Prioritized review-only remediation order

1. Close BWS116-R03-001 first: fixed migration source, complete scope authority, and restricted database role.
2. Separate observational migration status from bootstrap, require exact migration lineage, and serialize migrators (002-004).
3. Add bounded/cancellable PostgreSQL command ownership (005) before claiming service timeout correctness.
4. Replace read-then-insert and read-then-update patterns with atomic create/compare and CAS transitions (006-007).
5. Make every worker mutation consume lease ownership/epoch atomically and move lease time authority into PostgreSQL (008-009).
6. Define safe expired-lease recovery only after idempotency/fencing are correct (010).
7. Implement real deadline/cancellation propagation and late-completion fences (011).
8. Bound repository lists and lease recovery batches (012).
9. Repair the retention dependency graph and revalidation protocol (013).
10. Add durable standard cycle aggregate/replay state (014).
11. Make B1 parent/child graph and observation/job terminals atomic or convergent (015-016).
12. Add causal timestamp invariants and migrate/reject invalid existing rows (017).
13. Execute two-connection PostgreSQL crash/concurrency tests and full canonical Node 20.20.2 validation before any acceptance claim.

## Explicit unchanged areas

- No source, test, migration, fixture, schema, documentation, configuration, manifest, or archive member was edited.
- No implementation prompt, overlay, patch, or server command was produced.
- No controller, API, scheduler, worker, lifecycle owner, provider connection, external service, account, credential, database, signer, or live operation was started or contacted.
- Pure strategy mathematics, market identity, quote validity, simulation semantics, settlement semantics, generic process topology, public API projection, and release publication remain with R02, R04, R06, R05, R09, R10, R11, and R12 as assigned.
- `KNOWN_BASELINE_MANIFEST_DRIFT` remains an R11 handoff and was not assigned a confirmed R03 finding ID.

## Validation limitations and attestation

- Canonical Node 20.20.2 was unavailable. Node 22 results do not establish canonical acceptance.
- Repository dependencies and `@types/node` were unavailable; no install was permitted. TypeScript emit was therefore supplementary and exited with missing-type diagnostics.
- PostgreSQL client/server was unavailable. All SQL concurrency findings are source-clear but must be reproduced with a disposable two-connection PostgreSQL harness during remediation validation.
- Archive and extraction hashes were reconciled after inspection. The source tree remained byte-identical to the ZIP.
- External network, providers, accounts, credentials, deployed services, `betting-win`, and persistent databases were not accessed.
