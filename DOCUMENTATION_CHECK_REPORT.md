# Documentation check report — betting-win-surebet boundary follow-up

Date: 2026-07-03

Source checked: `betting-win-surebet10.zip`

## Result

The three-repo boundary overlay landed correctly, but the uploaded repo now contains a temporary legacy import tree:

```text
docs/imported-from-betting-win/
```

That conflicts with `docs/023_legacy_betting_win_surebet_import_manifest.md`, which still said the legacy surebet material had not been imported. It also leaves raw OpenAlex, bot-reference, schema, and synthesis artifacts under `docs/`, where they can be mistaken for active operator documentation.

## Follow-up action

This follow-up overlay re-homes the imported surebet material into archive-safe destinations:

```text
docs/legacy/surebet-research/
research/imported-from-betting-win/legacy/surebet/
templates/imported-from-betting-win/legacy/surebet/
schemas/imported-from-betting-win/legacy/surebet/
```

The final repo state must remove the temporary source path:

```text
docs/imported-from-betting-win/
```

## Boundary status after cleanup

```text
repo_role=surebet_strategy_execution_repo
strategy_family=surebet_complete_set_only
provider_truth_owner=betting-win
canonical_history_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
legacy_surebet_import_status=imported_and_rehomed
source_import_path_removed=yes
raw_research_artifacts_under_docs=no
```

## Delete/move decision

After applying this overlay, run the cleanup command that removes the temporary import source path:

```bash
rm -rf docs/imported-from-betting-win
```

No additional `mv` command is required because this overlay already includes the re-homed archive copies.
