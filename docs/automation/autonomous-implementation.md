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

For the current approved automation-maintenance task only, the implementation controller must be allowed to touch the specific protected automation file required by the task. Use this command for the paper-controller pinned-bundle shell-command hardening:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
AUTOMATION_ALLOW_PROTECTED_CHANGES=1 bash ./run-autonomous-implementation.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none
```

Do not use `AUTOMATION_ALLOW_PROTECTED_CHANGES=1` for normal source implementation. It is only for explicit automation maintenance or repo standardization work.

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
feature work. Do not invent additional local backlog work. The repo-local backlogs are complete. The completed ledgers are:

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
stop with AUTONOMOUS_GOAL_COMPLETE=yes when no safe defect exists
```

It must not connect to providers, read live upstream services, implement execution,
add predictive/value-betting scope, share bankroll/account state with
`betting-win-betting`, or mark real upstream evaluation ready without Federico's
pinned `betting-win` bundle.

Before finishing each cycle, validation must include the configured repo command
from `automation.config.sh`, currently `npm run validate`.

Protected automation files must not change unless the explicit task is automation
maintenance.
