# Autonomous bugfix rules: betting-win-surebet

`run-autonomous-bugfix.sh` is now an audit/handoff controller. It does not patch app
source directly. In plain operator terms, it does not patch app source directly. It audits artifacts first when available, audits source second,
and writes a bounded implementation handoff when confirmed bugs remain.

Default command, after activating Node 20 in the parent shell:

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
bash ./run-autonomous-bugfix.sh \
  --duration 72h \
  --model cli-default \
  --fallback-model none \
  --handover-autonomous-implementation
```

Useful flags:

```text
--from-artifacts PATH
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
--handover-autonomous-implementation
--print-config
--stream / --no-stream
```

Audit order:

```text
Artifacts first
source second
```


## Read-only evidence and mutation safety

The artifact hint is resolved before the current run directory is created. This
prevents the controller from selecting its own new
`artifacts/autonomous_bugfix_*` directory. This prevents a new empty run from being
selected as the retained evidence source when no root `artifacts.zip` is present.

Source immutability is enforced with content fingerprints over tracked files plus
untracked non-ignored files. Runtime artifacts, locks, generated output, archives,
and handoff files are excluded. `git status --short` snapshots remain diagnostic
only: they are not the mutation security gate because an already-dirty file can be
edited again without changing its status line. A content change before, during, or
after validation blocks the audit.

Final stdout always exposes machine-readable `run_dir`, `final_status`,
`stop_reason`, `final_exit_code`, and `cycles_completed` fields for parent tools and
post-run auditing.

When confirmed bugs require source work and
`--handover-autonomous-implementation` is set, the controller writes:

```text
.automation/autonomous-implementation-handover.env
.automation/autonomous-implementation-handover.md
```

The next operator action is then `run-autonomous-implementation.sh`, not another
source-patching bugfix pass.

Telegram is wired through `.automation/lib/telegram_notify.sh`. It sends one final
message per run and can be disabled with `TELEGRAM_NOTIFY=0`.

For this repo, the audit must focus on private paper-mode and local deterministic
surebet code paths:

```text
repo-local pinned bundle intake
local fixture reader containment and symlink/realpath rejection
standard-binary complete-set grouping
quote freshness and currency checks
stake-vector math over local fixtures
leg completion and residual exposure simulation
settlement replay consumption
private report artifact contracts
batch summary generation
validation/source-manifest drift
shell entrypoint safety
```

Do not add provider adapters, live collectors, wallet or order paths, public
reports, profitability claims, or predictive/value-betting work. Missing required
config must fail fast. Do not hide defects with silent defaults.

Protected automation files must not change unless the explicit task is automation
maintenance.


## Autopilot boundary

`run-autonomous-bugfix.sh` remains standalone audit/handoff infrastructure. It is not called by `run-paper-autopilot.sh` in this repo.
