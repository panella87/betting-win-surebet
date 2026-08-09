# Artifact retention and cleanup

```text
policy=BWS_AUTOMATION_ARTIFACT_RETENTION_V1
cleanup_script=cleanup_automation_artifact_residue.sh
default_mode=plan
apply_requires=--apply
archive_output=artifacts.zip
controller_evidence_retention=preserve
transient_test_release_residue=remove
```

## Purpose

The repository retains controller evidence under `artifacts/`, but serialized validation also creates temporary release packages, extracted release fixtures, test repositories, and negative-path symlinks. Those scratch paths are not campaign evidence. If retained, they can grow the archive by hundreds of megabytes and a deliberately created test symlink can make fail-closed artifact packaging reject the entire tree.

## Always preserved

Cleanup does not select:

```text
autonomous_implementation_<timestamp>/
autonomous_bugfix_<timestamp>/
bugfix_autopilot_<timestamp>/
paper_evaluation_<timestamp>/
paper_autopilot_<timestamp>/
private-paper-mode/
paper-runtime-evidence/
temp_inode_watchdog_events/
source handoffs, child results and campaign ledgers under canonical run directories
any other top-level path not present in the explicit transient allowlist
```

Historical controller runs are deliberately retained. This policy does not impose a rolling run-count or age-based deletion rule.

## Explicit transient allowlist

Only these top-level names or prefixes are eligible:

```text
test-tmp
release-upgrade-tests
final-local-acceptance-release
manual-release-safety
manual-release-success
bws-release-output-link
paper-preflight-symlink-test
bws-release-package-*
bws-external-runtime-preflight-*
bws-service-runtime-*
bws-soak-campaign-*
symlink-output-*
nested-symlink-output-*
batch-symlink-output-*
batch-nested-symlink-output-*
local-reader-symlink-*
pinned-intake-*
corrected-settlement-input-*
```

These names are repository test/release scratch surfaces. Cleanup is top-level only, validates the canonical repository and artifacts roots, does not follow symlinks, and refuses unknown modes or invalid ages.

## Operator commands

Preview candidates without changing files:

```bash
./cleanup_automation_artifact_residue.sh --plan --min-age-seconds 3600
```

Remove all allowlisted residue and atomically rebuild the retained archive:

```bash
./cleanup_automation_artifact_residue.sh \
  --apply \
  --min-age-seconds 0 \
  --rebuild-artifacts-zip \
  --zip-timeout 30m
```

The old `artifacts.zip` is replaced only after the new archive is complete and passes ZIP integrity validation.

## Controller integration

Full and incremental artifact packaging invoke the same cleanup helper before artifact-tree symlink validation. This preserves fail-closed packaging for retained evidence while preventing intentionally malicious test fixtures from becoming permanent global blockers.

Cleanup is not a substitute for source validation, handoff validation, lock ownership checks, or artifact hygiene validation. Any symlink outside the explicit transient allowlist remains fatal.
