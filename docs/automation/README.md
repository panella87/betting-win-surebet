# Repo automation contract: betting-win-surebet

```text
program=BWS_FULL_PLATFORM_IMPLEMENTATION_V1
current_task=BWS-510
selected_controller=run-autonomous-implementation.sh
```

The implementation controller reads `docs/automation/current-implementation-task.md`. It must not stop on historical fixture-complete claims.

`BWS-100` validates the committed-`HEAD` upstream lock through `BETTING_WIN_REPO_PATH`. Ongoing implementation must continue to preserve that read-only contract: validation reads committed `HEAD` through Git objects and must not clone, create a temporary worktree, or modify upstream working-tree state.

The hardened controller surface remains:

```text
run-autonomous-implementation.sh
run-autonomous-bugfix.sh
run-bugfix-autopilot.sh
run-paper-evaluation.sh
run-paper-autopilot.sh
```

Parent autopilots launch children with `TELEGRAM_NOTIFY=0` and emit one final campaign message. Standalone controllers retain their own final notification through `.automation/lib/telegram_notify.sh`. Root `run-*` controllers are the notification owners.

The product campaign does not authorize changes to protected automation files. Product source, tests, migrations, configuration schemas, task ledger, and active non-protected status docs may change according to the task.

For status, inspect the newest retained artifact directory and required cycle files. Do not infer success from process exit alone.

For `BWS-510`, the loopback validator accepts either a complete `SUREBET_TEST_*` tuple or `DB_URL_TEST` from the process environment or repo-local `.env`. Partial tuples fail closed, credentials are not printed, and the selected PostgreSQL role must already have `CREATEDB`.

Standard evidence packaging:

```text
./zip_codebase.sh --artifacts-only
```

Every root controller publishes repo-root `artifacts.zip` from the complete `artifacts/` directory, equivalent to a bounded `zip -q -1 -r artifacts.zip artifacts` operation using fast Deflate level 1. It must not package only the latest run directory. The numbered `--artifacts-only` helper follows the same complete-tree contract without filtering nested logs, archives, locks, temporary evidence, or empty directories.

`zip_codebase.sh` creates its transient codebase file list inside the repository, so laptop packaging does not depend on writable `/tmp` or `TMPDIR`. Both numbered codebase archives and complete artifact archives use fast Deflate level 1 to reduce packaging latency without switching to an incompatible archive format or uncompressed output. The codebase exclusion is root-scoped for generated `runtime/` evidence, so legitimate source trees such as `src/runtime/` and `packages/*/src/runtime/` remain in the archive. Source-manifest generation uses the same generated-directory boundary at every depth, excluding nested dependency/build trees without dropping source-owned runtime modules. `pull_artifacts_and_zip_codebase.sh` rejects a `REMOTE_REPO` basename that differs from the local repository name before downloading anything.

Server update semantics remain equivalent to:

```text
git pull --ff-only --autostash
```

For `--acp`, `update_git.sh` loads `tools/required_executable_paths.js`, restores the owner executable bit, and forces each listed path to Git mode `100755` with `git update-index --chmod=+x` after staging. This is required for Windows/WSL worktrees where `core.fileMode=false`; a fresh Linux clone must still receive executable controller and helper files.
