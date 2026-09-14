# Post-overlay cleanup compatibility record

```text
document_classification=superseded
retained_for=repository_validator_and_historical_cleanup_contract
current_cleanup_action=none
```

This file is no longer an active overlay procedure. `scripts/validate_repo.py` still requires the path, so deleting it would change validation behavior. Current documentation overlays must declare their own exact cleanup or state `none`.

The following obsolete helpers must remain absent:

```text
run-paper-evaluation-12h.sh
stop-autonomous-run.sh
scripts/stop-autonomous-run.sh
```

Current canonical helpers are documented in `docs/automation/README.md`. Temporary controller and artifact cleanup is owned by `cleanup_automation_temp_inode_residue.sh`, `cleanup_automation_artifact_residue.sh`, and the exact task-specific overlay procedure. Do not remove unrelated files, generated evidence, locks, or operator worktrees through this compatibility record.
