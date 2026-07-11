# Autonomous implementation rules: betting-win-surebet

`run-autonomous-implementation.sh` is the root source implementation controller.
It is for bounded repo-local implementation work only. It does not run a service,
prove runtime readiness, connect to providers, or execute orders.

Default command, after activating Node 20 in the parent shell:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
bash ./run-autonomous-implementation.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none
```

Do not use `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for normal source implementation. It is only for explicit automation maintenance or repo standardization work approved by Federico.

Common command after paper-mode handoff, after the same Node activation:

```bash
bash ./run-autonomous-implementation.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none \
  --handover-paper-mode
```

Useful flags now supported:

```text
--prompt-file PATH
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
--handover-paper-mode
--handover-bugfix-audit
--print-config
--stream / --no-stream
```

There is no `--task` flag. Use `--prompt-file` or
`docs/automation/current-implementation-task.md`.

`--check-only` must fail when validation fails; in plain operator terms, check-only must fail when validation fails. It must not hide failed validation
with `|| true` or treat a failed validation as a successful no-op.

Each Codex cycle must write real required artifacts, including
`continue_status.txt`. Missing, empty, placeholder, malformed, multiple-line, or
unknown status artifacts fail closed. Valid status lines are:

```text
CONTINUE_REQUIRED=yes
AUTONOMOUS_GOAL_COMPLETE=yes
BLOCKED=yes
```

Exit codes:

```text
0 = check-only passed or AUTONOMOUS_GOAL_COMPLETE=yes
1 = setup/controller/local validation failure before classified implementation state
2 = blocked by Codex, validation, tooling, malformed artifacts, or safety gate
3 = duration/max-cycle budget elapsed while CONTINUE_REQUIRED=yes remains
130 = interrupted
```

Telegram is wired through `.automation/lib/telegram_notify.sh`. It sends one final
message per run and can be disabled with `TELEGRAM_NOTIFY=0`.

For the current repo state, normal autonomous implementation should not open new
feature work. Do not invent additional local backlog work. The repo-local backlogs are complete, but the full product blueprint is not complete until the pinned `betting-win` interface exists. The completed ledgers are:

```text
docs/014_sure_001_remaining_hardening_backlog.md
docs/015_local_engine_implementation_backlog.md
docs/017_private_paper_mode_implementation_backlog.md
```

The controller may only:

```text
repair a concrete repo-local validation/tooling defect
repair documentation drift that contradicts the current safety gate
repair deterministic local fixture/private paper-mode bugs
repair pinned-bundle path preflight/reporting defects
stop with BLOCKED=yes when no safe defect exists and the only remaining product blocker is Federico's missing pinned `betting-win` interface
```

Use `AUTONOMOUS_GOAL_COMPLETE=yes` only for a bounded repo-local task that is genuinely complete; do not use it to imply the full surebet blueprint is done while real upstream evaluation is blocked.

It must not connect to providers, read live upstream services, implement execution,
add predictive/value-betting scope, share bankroll/account state with
`betting-win-betting`, or mark real upstream evaluation ready without Federico's
pinned `betting-win` bundle.

Before finishing each cycle, validation must include the configured repo command
from `automation.config.sh`, currently `npm run validate`.

Protected automation files must not change unless the explicit task is automation
maintenance.


## Paper autopilot handoff metadata

When launched with `--handover-paper-mode`, implementation writes `.automation/paper-mode-handover.env` with `IMPLEMENTATION_SOURCE_CHANGED`, `IMPLEMENTATION_SOURCE_VALIDATION_PASSED`, and `PRIVATE_PAPER_REEVALUATION_REQUIRED`. The paper autopilot uses those fields to decide whether a new private paper evaluation is justified.


## Hardened validation and handoff contract

Before the first Codex cycle, the controller runs the configured validation and preserves its exact artifacts under `preflight/baseline-validation`. A red baseline is implementation evidence, not a silent success and not an automatic reason to skip the bounded task. `--check-only` still fails when that baseline is red.

The controller tracks source change and validation across the whole run. Runtime handoff files, locks, logs, archives, dependencies, and generated artifacts do not count as implementation progress. A later model or capacity failure does not erase evidence that an earlier cycle made and validated a real source change.

Paper and bugfix handoffs are parsed as strict `KEY=VALUE` data. Duplicate keys, repository mismatch, unsupported schema, invalid booleans, stale/consumed fingerprints, missing evidence, or an unauthorized protected-file change fail closed. Autopilot handoffs may authorize only an exact comma-separated protected-file allowlist. The broad `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` override remains manual-only.

The bugfix consumer entrypoint is:

```bash
bash ./run-autonomous-implementation.sh   --duration 72h   --model cli-default   --fallback-model none   --handover-bugfix-audit
```

It consumes `.automation/autonomous-implementation-handover.env` and writes the verified return handoff `.automation/bugfix-mode-handover.env`. The producer is `run-autonomous-bugfix.sh`; unattended campaigns are coordinated by `run-bugfix-autopilot.sh`. Do not fabricate the handoff manually.

Every terminal run prints exactly one machine-readable record for `run_dir`, `final_status`, `stop_reason`, `final_exit_code`, and `cycles_completed`. Final `artifacts.zip` creation is bounded by `--zip-timeout`.
