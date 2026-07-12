# Autonomous bugfix rules: betting-win-surebet

`run-autonomous-bugfix.sh` is a read-only audit and strict implementation-handoff controller. It must not patch app source directly.

Default standalone command after activating Node 20 in the parent shell:

```bash
bash ./run-autonomous-bugfix.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none \
  --handover-autonomous-implementation
```

Important flags:

```text
--from-artifacts PATH
--prompt-file PATH
--bugfix-focus-file PATH
--campaign-area SLUG
--repo-dir PATH
--cycle-timeout VALUE
--validation-timeout VALUE
--install-timeout VALUE
--zip-timeout VALUE
--max-cycles N
--sandbox MODE
--auto-install
--check-only
--status
--force-unlock
--allow-parallel
--handover-autonomous-implementation
--no-context-retry
--print-config
--stream / --no-stream
```

The retained artifact hint is resolved before the current run directory is created. Source immutability uses content fingerprints over tracked files plus untracked non-ignored files, so edits to already-dirty files are detected. Runtime artifacts, locks, archives, generated output, and handoff files are excluded.

Each cycle uses exactly one terminal state:

```text
BUGFIX_AUDIT_COMPLETE=yes
CONTINUE_REQUIRED=yes
HANDOVER_AUTONOMOUS_IMPLEMENTATION=yes
BLOCKED=yes
```

`request_flags.txt` is a strict machine contract containing bug presence, handoff requirement, campaign area, evidence completeness, stable bug IDs, bounded implementation scope, and exact protected-file authorization. Duplicate, unknown, missing, or contradictory fields fail closed.

Confirmed bugs produce `.automation/autonomous-implementation-handover.env` with schema version, repository identity, audit area, stable bug signature, source fingerprint, evidence hash, exact implementation scope, protected-file allowlist, and semantic SHA-256 fingerprint. The consumer is:

```bash
bash ./run-autonomous-implementation.sh --handover-bugfix-audit
```

A validation-red baseline is audit evidence, not automatic controller failure. Clean audit completion still requires validation to pass. Context-window and model-availability failures are classified; retries are allowed only while source remains unchanged.

The allowed audit surface is repo-local private-paper logic, validators, deterministic fixtures, report contracts, filesystem safety, automation handoffs, and packaging. Provider adapters, live collectors, direct upstream database access, wallets, orders, transactions, public reports, profitability claims, and execution-readiness claims remain prohibited.


## Standalone lock lifecycle

The audit controller resolves its retained evidence first, then acquires and verifies its repo-scoped lock before creating `artifacts/autonomous_bugfix_*`. A live same-controller or incompatible-controller lock therefore leaves no empty audit run directory. After run creation, the lock is refreshed with the exact artifact path and managed-child heartbeat metadata.

Final lock release is part of the terminal audit contract. Output now includes `lock_release_status`, `lock_release_exit_code`, and `lock_preserved`. A child-identity or termination failure produces `BLOCKED=yes`, `stop_reason=lock_release_failed_lock_preserved`, exit code `2`, a preserved lock, a corrective final summary and `artifacts.zip`, and only then the final Telegram card. Unexpected shell exits while the audit loop is active are normalized to `BLOCKED=yes` with `stop_reason=unexpected_controller_exit` and the documented blocked exit code `2`.
