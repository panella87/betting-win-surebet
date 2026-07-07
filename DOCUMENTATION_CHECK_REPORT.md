# Documentation check report — standardized automation alignment

Date: 2026-07-06
Source checked: attachment-agnostic current repo tree. For this audit, the uploaded source of truth was `betting-win-surebet30.zip`. Future audits should use the uploaded repo zip named in the prompt, not this historical attachment filename.

## Result

Documentation/config alignment was refreshed for the standardized automation command surface.

Confirmed current automation surface:

```text
zip_codebase.sh
pull_artifacts_and_zip_codebase.sh
update_git.sh
run-autonomous-implementation.sh
run-paper-evaluation.sh
run-autonomous-bugfix.sh
automation.config.sh
docs/automation/
.automation/
.automation/lib/telegram_notify.sh
```

Obsolete files must remain absent:

```text
run-paper-evaluation-12h.sh
stop-autonomous-run.sh
scripts/stop-autonomous-run.sh
```

## Current repo state

```text
repo=betting-win-surebet
current_task=SURE-002B_PRIVATE_PAPER_MODE_INTAKE
current_task_status=complete_repo_local_private_paper_mode_backlog_blocked_on_pinned_interface
mode=private_paper_only
provider_connections=prohibited
execution=prohibited
runtime_service=none
```

The root controllers are the canonical daily entrypoints. Historical `commands/run-sure-*` wrappers remain compatibility wrappers only.

## Documentation alignment decisions

- Active docs now point operators to root controllers instead of phase wrappers.
- `STARTER_PACK.md` is labeled historical and no longer reads as current SURE-001-only status.
- `docs/automation/SSH_KEY_SETUP.md` now reflects the actual `pull_artifacts_and_zip_codebase.sh` contract: explicit `.env`/environment settings, `sshpass`, no `automation.config.sh`, and no default remote host.
- `docs/automation/POST_OVERLAY_CLEANUP.md` now states no current cleanup is pending and only documents obsolete helper names as files that must remain absent.
- Paper-evaluation docs now describe the actual no-service behavior: private fixture smoke now, no service lifecycle, no provider calls, one final Telegram notification, and handoff rather than integrated bugfix repair. Real pinned-bundle smoke is documented as reserved until the known shell-hardening gate lands.

## Remaining non-documentation note

Before using a real `SUREBET_PINNED_BUNDLE`, the known runtime hardening item remains paper-controller pinned-bundle shell-command quoting and strict pinned-bundle boolean validation. This report does not implement runtime logic.

## Validation path

```bash
. "$HOME/.nvm/nvm.sh" && nvm use 20
npm run validate
```

Boundary-specific validation, after the same Node activation:

```bash
npm run validate:boundary
```

Ops validation, after the same Node activation:

```bash
npm run validate:ops
```


## Follow-up documentation recheck — 2026-07-06

A second audit found one remaining active-doc ambiguity: some paper-evaluation
runbook sections presented the real `SUREBET_PINNED_BUNDLE` command as an
immediate operator path even though status docs already said pinned-bundle use
must wait for paper-controller shell-command quoting and strict boolean
validation hardening. Active docs now consistently state that the safe current
paper command is private fixture smoke only, and the next repo-local source task
is the pinned-bundle command-construction hardening before any real pinned bundle
is used.

## Follow-up documentation recheck — 2026-07-06, second pass

A third audit found active markdown docs aligned with the standardized root automation command surface. The only remaining stale reference was a root `OVERLAY_MANIFEST.json` copied from an older drag-and-drop overlay. That file claimed an obsolete cleanup command and was not active repo authority. It is now removed from source authority, ignored by Git, and documented as generated overlay metadata that may be safely removed if it reappears.

No changes were needed to application source, strategy logic, runtime controller behavior, package scripts, or automation command contracts.

## Follow-up documentation recheck — 2026-07-06, third pass

A fourth audit found active markdown docs aligned with the standardized root automation command surface. The stale root `OVERLAY_MANIFEST.json` file still appeared in the uploaded repo zip, which made source-manifest validation stale before cleanup even though the active docs already treated that file as generated overlay metadata.

The source-manifest validator/regenerator now explicitly ignore `OVERLAY_MANIFEST.json`, matching `.gitignore` and the post-overlay cleanup documentation. Removing the file is still recommended for a clean operator workspace, but its presence no longer becomes source authority or breaks validation.

## Follow-up documentation recheck — 2026-07-06, fifth pass

A fifth audit found the active automation command surface aligned and obsolete helper files absent. The remaining documentation drift was operational preflight wording: several active runbooks showed `npm install`, `npm run validate`, or root-controller checks before explicitly activating Node 20. They now state that operators should run `. "$HOME/.nvm/nvm.sh" && nvm use 20` before package installation, validation, or root-controller checks. This matches the standardized automation rule that root controllers inherit the active parent-shell Node runtime and do not source `nvm.sh` themselves.


## Follow-up documentation recheck — 2026-07-06, sixth pass

A sixth audit found the active command surface, obsolete-helper absence, private
paper-mode boundaries, and pinned-bundle hardening notes aligned. The remaining
documentation drift was isolated to standalone controller examples that could be
copy-pasted without first activating the parent-shell Node runtime.

The active controller docs and status examples now show `. "$HOME/.nvm/nvm.sh" &&
nvm use 20` before launching `run-autonomous-implementation.sh`,
`run-autonomous-bugfix.sh`, or `run-paper-evaluation.sh`. This keeps the docs
aligned with the standardized rule that root controllers inherit Node from the
parent shell and do not source `nvm.sh` internally.



## Follow-up documentation recheck — 2026-07-06, seventh pass

A seventh audit checked `betting-win-surebet23.zip` against the standardized
automation surface. Active docs still point to canonical root scripts, obsolete
paper-12h/stop helpers remain absent, `commands/run-sure-*` wrappers remain
compatibility-only, and real pinned-bundle use remains blocked until the known
paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE`
hardening lands.

The remaining documentation drift was isolated to documentation metadata and one
future-use pinned-bundle example: this report still referenced
`betting-win-surebet22.zip`, the validation snippets in this report did not show
the Node 20 parent-shell preflight, and the future pinned-bundle example in
`docs/018_private_paper_mode_runbook.md` did not activate Node 20 before the root
paper controller. Those were updated without changing app source, runtime
controller logic, package scripts, validation logic, or strategy behavior.

## Follow-up documentation recheck - 2026-07-06, eighth pass

An eighth audit checked `betting-win-surebet24.zip` against the standardized
automation surface. Active README, status, runbook, package-script,
root-controller, and automation docs remain aligned: canonical root scripts are
the daily entrypoints, `commands/run-sure-*` wrappers remain compatibility-only,
obsolete paper-12h/stop helpers remain absent, Node 20 parent-shell preflight is
documented, and real pinned-bundle use remains blocked until the known
paper-controller shell-command quoting and strict `SUREBET_REQUIRE_PINNED_BUNDLE`
validation hardening lands.

The remaining documentation/config drift was isolated to `.env.example` and two
validation-matrix descriptions. `.env.example` still contained SURE-001-era
contract/export placeholders instead of the current helper/controller variables
for artifact pulling, Telegram final notifications, and future-use private paper
pinned-bundle settings. `docs/011_validation_matrix.md` still described
autonomous continuation in SURE-001-active language even though the retained
SURE-001/SURE-002A/SURE-002B ledgers are complete. Both references are now
current without changing application source, runtime controller logic, package
scripts, validation logic, strategy behavior, provider integration, execution
paths, or pinned-bundle runtime behavior.

## Follow-up documentation recheck - 2026-07-06, ninth pass

A ninth audit checked `betting-win-surebet25.zip` against the standardized
automation surface. Active docs remain aligned on canonical root scripts,
compatibility-only `commands/run-sure-*` wrappers, absent obsolete paper-12h/stop
helpers, Node 20 parent-shell preflight, protected automation files, no-service
private fixture paper behavior, and the real pinned-bundle hardening gate.

The remaining documentation/control-plane drift was that the active current task
correctly asks for paper-controller pinned-bundle shell-command hardening, but
some operator guidance still implied protected automation files were fully
read-only for that run and did not say to launch the implementation controller
with `AUTOMATION_ALLOW_PROTECTED_CHANGES=1`. The docs now distinguish normal
source implementation from this explicit automation-maintenance exception. The
exception is bounded to the paper-controller hardening task and does not weaken
provider, execution, direct-DB, public-report, profitability, or live-readiness
boundaries.

## Follow-up documentation recheck - 2026-07-06, tenth pass

A tenth audit checked `betting-win-surebet26.zip` against the standardized
automation surface. Active docs, automation docs, status files, runbooks, package
scripts, and executable config remain aligned: canonical root helper/controller
scripts are the daily entrypoints, `commands/run-sure-*` wrappers remain
compatibility-only, obsolete paper-12h/stop helpers remain absent, Node 20
parent-shell preflight is documented, protected automation-file exceptions are
bounded to explicit automation-maintenance tasks, and real pinned-bundle use
remains blocked until the paper-controller shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

The only documentation drift found was this report's source metadata still
pointing to `betting-win-surebet25.zip`. The metadata is now refreshed for the
current uploaded zip. No app source, runtime controller logic, package scripts,
validation logic, strategy behavior, provider integration, execution path, or
pinned-bundle runtime behavior changed.


## Follow-up documentation recheck - 2026-07-06, eleventh pass

An eleventh audit checked `betting-win-surebet27.zip` against the standardized
automation surface. Active docs, automation docs, status files, runbooks, package
scripts, and executable config remain aligned: canonical root helper/controller
scripts are the daily entrypoints, `commands/run-sure-*` wrappers remain
compatibility-only, obsolete paper-12h/stop helpers remain absent, Node 20
parent-shell preflight is documented, protected automation-file exceptions are
bounded to explicit automation-maintenance tasks, and real pinned-bundle use
remains blocked until the paper-controller shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

The only documentation drift found was this report's source metadata and the top
changelog entry still referencing `betting-win-surebet26.zip`. The metadata is
now refreshed for the current uploaded zip. No app source, runtime controller
logic, package scripts, validation logic, strategy behavior, provider
integration, execution path, or pinned-bundle runtime behavior changed.

## Follow-up documentation recheck - 2026-07-06, twelfth pass

A twelfth audit checked `betting-win-surebet28.zip` against the standardized
automation surface. Active docs, automation docs, status files, runbooks, package
scripts, and executable config remain aligned: canonical root helper/controller
scripts are the daily entrypoints, `commands/run-sure-*` wrappers remain
compatibility-only, obsolete paper-12h/stop helpers remain absent, Node 20
parent-shell preflight is documented, protected automation-file exceptions are
bounded to explicit automation-maintenance tasks, and real pinned-bundle use
remains blocked until the paper-controller shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

The only documentation drift found was this report's source metadata and the top
changelog entry still referencing `betting-win-surebet27.zip`. The metadata is
now refreshed for the current uploaded zip. No app source, runtime controller
logic, package scripts, validation logic, strategy behavior, provider
integration, execution path, or pinned-bundle runtime behavior changed.


## Follow-up documentation recheck - 2026-07-06, thirteenth pass

A thirteenth audit checked `betting-win-surebet29.zip` against the standardized
automation surface. Active docs, automation docs, status files, runbooks, package
scripts, and executable config remain aligned: canonical root helper/controller
scripts are the daily entrypoints, `commands/run-sure-*` wrappers remain
compatibility-only, obsolete paper-12h/stop helpers remain absent, Node 20
parent-shell preflight is documented, protected automation-file exceptions are
bounded to explicit automation-maintenance tasks, and real pinned-bundle use
remains blocked until the paper-controller shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

The only documentation drift found was this report's source metadata and the top
changelog entry still referencing `betting-win-surebet28.zip`. The metadata is
now refreshed for the current uploaded zip. No app source, runtime controller
logic, package scripts, validation logic, strategy behavior, provider
integration, execution path, or pinned-bundle runtime behavior changed.

## Follow-up documentation recheck - 2026-07-06, fourteenth pass

A fourteenth audit checked `betting-win-surebet30.zip` against the standardized
automation surface. Active docs, automation docs, status files, runbooks, package
scripts, and executable config remain aligned: canonical root helper/controller
scripts are the daily entrypoints, `commands/run-sure-*` wrappers remain
compatibility-only, obsolete paper-12h/stop helpers remain absent, Node 20
parent-shell preflight is documented, protected automation-file exceptions are
bounded to explicit automation-maintenance tasks, and real pinned-bundle use
remains blocked until the paper-controller shell-command quoting and strict
`SUREBET_REQUIRE_PINNED_BUNDLE` validation hardening lands.

The only documentation drift found was this report's top source metadata and the
latest changelog entry still referencing `betting-win-surebet29.zip`. The top
source metadata is now attachment-agnostic so future uploaded zip filenames do
not create documentation-only drift. The checked attachment name remains recorded
here as historical audit context. No app source, runtime controller logic,
package scripts, validation logic, strategy behavior, provider integration,
execution path, or pinned-bundle runtime behavior changed.

