# BWS117 Wave 01 repository profile

```text
REPOSITORY_PROFILE
REPOSITORY_NAME: betting-win-surebet
REPOSITORY_SLUG: betting-win-surebet
CURRENT_ARCHIVE_FILENAME: betting-win-surebet117.zip
CURRENT_ARCHIVE_SHA256: 0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494
ARCHIVE_ROOT_LAYOUT: 618 unique repository-relative regular files; no wrapping directory, duplicate path, unsafe path, symlink, directory entry, or special member
PRIMARY_LANGUAGES: TypeScript/TSX, JavaScript/MJS, Python, Bash, SQL, Markdown, JSON, CSV, TSV
PACKAGE_MANAGERS: npm workspaces with package-lock.json; packageManager field not declared
BUILD_SYSTEMS: TypeScript compiler, npm workspaces, Vite operator cockpit, Python repository validators
RUNTIME_REQUIREMENTS: Node >=20 <21; canonical repository runtime 20.20.2; Python 3 and Bash for repository tooling
RUNTIME_ACTIVATION_METHOD: .nvmrc=20.20.2 and . "$HOME/.nvm/nvm.sh" && nvm use 20 when Node validation is required
VERSION_CONTROL_EXPECTED: Git worktree; Git metadata intentionally absent from source ZIP
DOCUMENTATION_ROOTS: root Markdown, docs/, decisions/, research/
REVIEW_DOCUMENT_LOCATION: No prior review tree discovered; new minimal convention docs/reviews/BWS117/wave-01/
DOCUMENTATION_FORMATS: Markdown plus JSON/TSV machine companions
DOCUMENTATION_BUILD_OR_LINK_CONFIG: docs/000_documentation_index.md is the complete Markdown inventory; no separate documentation-site build discovered
CANONICAL_STATUS_DOCUMENTS: 1) docs/automation/current-implementation-task.md for current task/controller; 2) docs/repo_status_current.md for detailed state; 3) PROJECT_STATUS.md as operator mirror; 4) docs/000_documentation_index.md for authority order
CANONICAL_TASK_OR_ROADMAP_DOCUMENTS: docs/automation/current-implementation-task.md; docs/041_external_runtime_preflight_and_bws600_campaign.md; docs/047 through docs/051 for B1; backlog CSVs
BINDING_BLUEPRINTS_OR_ADRS: docs/001, docs/002, docs/027, docs/041, docs/047 through docs/051, ADR-0001 through ADR-0006
REPOSITORY_VALIDATORS: scripts/validate_repo.py; validate_contract_boundary.py; validate_no_provider_connections.py; validate_no_execution_paths.py; validate_bws_b1_authority.py; validate_bws_b1_boundary.py; validate_bws_b1_acceptance.py; validate_full_implementation_program.py; validate_remaining_operator_runtime_program.py; validate_source_manifest.py
DOCUMENTATION_VALIDATORS: scripts/validate_documentation_slimming.py plus overlay-local JSON, TSV, link, hash, mode, final-newline, and controlled-path checks
UPDATE_OR_PULL_HELPER: ./update_git.sh --pull
LOCAL_OPERATOR_ENVIRONMENT: Windows WSL; /mnt/c/Users/feder/Desktop/Development/GitHub/betting-win-surebet
REMOTE_OR_SERVER_WORKFLOW: $HOME/app_testing/betting-win-surebet (documented as /home/dev/app_testing/betting-win-surebet); post-commit synchronization through update_git.sh --pull
ARTIFACT_LOCATIONS: repository root artifacts.zip; artifacts/; numbered local artifacts ZIP and betting-win-surebet source ZIP produced by pull_artifacts_and_zip_codebase.sh
GENERATED_OR_TRANSIENT_LOCATIONS: dist/, node_modules/, artifacts/, *.zip, .automation/tmp/, .automation/locks/, .automation/corrupt/, runtime inputs and generated lock file
PROTECTED_MUTABLE_DOCUMENTS: AGENTS.md, PROJECT_STATUS.md, README.md, docs/000_documentation_index.md, docs/002_dependency_contract_with_betting_win.md, docs/012_runbook.md, docs/041_external_runtime_preflight_and_bws600_campaign.md, docs/047_b1_cross_venue_offline_falsification_program.md, docs/048_b1_upstream_contract.md, docs/049_b1_market_equivalence.md, docs/050_b1_falsification_acceptance.md, docs/051_b1_implementation_map.md, docs/MASTER_PLAN.md, docs/automation/README.md, docs/automation/api-only-upstream.md, docs/automation/current-implementation-task.md, docs/repo_status_current.md
UNRESOLVED_DISCOVERY_GAPS: No Git history in archive; canonical Node 20.20.2 unavailable in supplied review environments; disposable PostgreSQL unavailable for R03; no accepted betting-win runtime handoff; no actual target pull or commit performed
END_REPOSITORY_PROFILE
```

## Status authority ranking

1. `docs/automation/current-implementation-task.md` owns current task and controller routing.
2. `docs/repo_status_current.md` owns detailed operational state and blocker truth.
3. `PROJECT_STATUS.md` is the concise operator-facing mirror.
4. `docs/000_documentation_index.md` owns documentation navigation and authority order.

The independent review tree is subordinate to all four and cannot authorize runtime, deployment, provider, database, or execution activity.
