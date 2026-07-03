# 011 — Validation matrix

SURE-001 acceptance requires:

```bash
npm run validate
```

`npm run validate` expands to the following gates. Each one exists to stop a specific boundary failure. These are product controls, not convenience checks. Weakening or removing them requires an explicit ADR.

## Validation gates and exact risks controlled

| Gate | Exact risk it controls |
| --- | --- |
| `npm run typecheck` | TypeScript stubs, contracts, or operator wrappers drift into invalid shapes that still look plausible in a paper-only skeleton. |
| `npm test` | Repo-local contract regressions survive static scans because the failure depends on executable behavior, archive contents, or exact prompt/document markers. |
| `python3 scripts/validate_repo.py` | Required boundary assets disappear, critical validator scripts/tests stop being repo requirements, or the private paper-only package contract drifts. |
| `python3 scripts/validate_contract_boundary.py` | Direct PostgreSQL connection strings, direct DB environment variables, or `core.*` migration text appear in the downstream repo. |
| `python3 scripts/validate_no_provider_connections.py` | Provider dependencies, provider imports, dynamic imports, `require(...)`, or provider URLs creep into the codebase. |
| `python3 scripts/validate_no_execution_paths.py` | Executable `src/` code starts describing wallet, signer, order, transaction, cashout, redemption, or split/merge execution paths. |
| `python3 scripts/validate_fixture_integrity.py` | Placeholder fixture directories stop being empty or the local pinned-interface placeholder starts looking like a real upstream export before Federico provides the real interface. |
| `python3 scripts/validate_master_plan.py` | Current stage/status docs drift away from SURE-002A local-only authority, imply real upstream readiness, or stop preserving the missing pinned `betting-win` interface blocker. |
| `python3 scripts/validate_executable_bits.py` | Required repo-local operator scripts lose executable permission and fail only at handoff/runtime time. |
| `python3 scripts/validate_artifact_hygiene.py` | The source tree or generated archives start carrying local secrets, generated archives, logs, temp files, caches, dependencies, or build output. |
| `python3 scripts/validate_node_runtime_loader.py` | Autonomous wrappers bypass the shared Node runtime loader or start sourcing NVM directly instead of using the repo contract. |
| `python3 scripts/validate_shell_local_assignments.py` | Shell scripts reintroduce same-line dependent `local` assignments that can trip `set -u` with unbound expansion. |
| `python3 scripts/validate_autonomous_controller_contract.py` | The controller accepts malformed cycle artifacts, malformed request flags, malformed continue status, duplicates required reports, or unsafe validation ordering. |
| `python3 scripts/validate_source_manifest.py` | `SOURCE_MANIFEST.json` loses non-empty audit metadata or stops matching the exact current source tree. |
| `python3 scripts/validate_autonomous_continuation_contract.py` | Long autonomous runs stop after one bounded slice even though safe SURE-001 backlog still remains. |
| `python3 scripts/validate_local_engine_backlog_contract.py` | The local implementation backlog disappears or stops enforcing local-only SURE-002A/SURE-007 boundaries. |

## Focused contract tests inside `npm test`

These tests lock the narrow regressions that previously caused or could cause boundary drift:

| Test | Exact risk it controls |
| --- | --- |
| `tests/autonomous-controller-contract.test.ts` | Required cycle report placeholders, duplicate artifact names, or malformed `request_flags.txt` handling return in the controller. |
| `tests/autonomous-continuation-contract.test.ts` | Old one-slice stop wording returns and long runs stop cleanly even though safe SURE-001 work still exists. |
| `tests/packaging-helpers.test.ts` | `zip_codebase.sh` or `create-source-handoff-archive.sh` starts including `.env`, generated archives, artifacts, dependencies, build output, locks, logs, or temp files. |
| `tests/validate-artifact-hygiene.test.ts` | The archive hygiene validator stops rejecting secret-like filenames or log-style generated files inside codebase ZIPs. |
| `tests/validate-fixture-integrity.test.ts` | The local pinned-interface placeholder fixture starts claiming real `betting-win` export metadata or non-empty upstream records. |
| `tests/validate-shell-local-assignments.test.ts` | The shell validator stops rejecting same-line dependent `local` assignments and lets a `set -u` hazard back in. |
| `tests/validate-source-manifest.test.ts` | The manifest regenerator stops matching validator inclusion rules or begins admitting generated junk into `SOURCE_MANIFEST.json`. |
| `tests/validate-repo-contract.test.ts` | `validate_repo.py` stops requiring critical validator tests as first-class repo assets. |
| `tests/local-engine-backlog-contract.test.ts` | The autonomous prompt or status docs stop continuing through the maximum safe local implementation backlog. |
| `tests/betting-win-adapters.test.ts` | Repo-local export bundle and read-only query boundaries stop rejecting symlink/realpath escapes or unsupported runtime resources. |
| `tests/complete-set.test.ts` | Complete-set assembly starts summing quote legs with mixed or unresolved currencies. |
| `tests/local-paper-report.test.ts` | Private report generation emits opportunity candidates without settlement replay evidence, fresh quotes, or same-currency quote legs. |
| `tests/leg-completion.test.ts` | Partial-fill status drifts back to a stale blocked stub instead of pointing to implemented local completion/residual modules. |

| `python3 scripts/validate_local_engine_backlog_contract.py` | The repo claims the SURE-002A local backlog is still active after it is exhausted, or the pinned-interface handoff docs drift away from the blocked-real-upstream truth. |

| `python3 scripts/validate_private_paper_mode_backlog_contract.py` | Private paper-mode intake docs, commands, and autonomous continuation drift into provider/live/execution scope or stop ignoring the active SURE-002B backlog. |
| `python3 scripts/validate_three_repo_surebet_boundary.py` | The three-repo surebet boundary drifts: this repo stops being the surebet strategy/backtest/paper repo, starts claiming provider truth, omits separate-account policy, or fails to keep future live execution behind an explicit gate. |
| `tests/private-paper-mode-backlog-contract.test.ts` | Private paper-mode backlog or smoke command starts accepting remote URLs, provider/database access, execution claims, or non-private artifacts. |
| `tests/three-repo-surebet-boundary.test.ts` | Active docs stop proving the accepted three-repo surebet boundary, separate-account policy, or no-local-move legacy import state. |
