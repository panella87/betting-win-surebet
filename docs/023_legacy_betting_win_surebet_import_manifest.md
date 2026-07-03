# 023 — Legacy betting-win surebet import manifest

This manifest records the safe rehome of surebet-specific historical material imported from the original `betting-win` repository.

## Current status

```text
legacy_surebet_import_status=imported_and_rehomed
operator_move_status=complete
operator_move_required=no
source_import_path_removed=yes
source_import_path_present=no
docs_legacy_destination=docs/legacy/surebet-research
research_legacy_destination=research/imported-from-betting-win/legacy/surebet
schemas_legacy_destination=schemas/imported-from-betting-win/legacy/surebet
templates_legacy_destination=templates/imported-from-betting-win/legacy/surebet
active_authority=no
```

The stale staging path below must not exist in the final source tree:

```text
docs/imported-from-betting-win
```

If that path reappears, remove it after confirming the archive paths above contain the imported material.

## Imported Markdown archive

Surebet-specific historical Markdown belongs under:

```text
docs/legacy/surebet-research/
```

Those files are historical lineage only. They are not active implementation authority and must not override the active three-repo boundary docs.

## Imported research artifacts

Raw OpenAlex outputs, synthesis CSVs, and reference-bot research artifacts belong under:

```text
research/imported-from-betting-win/legacy/surebet/
```

These artifacts are retained for traceability. They are not operator documentation, provider adapters, or current readiness evidence.

## Imported schema and template drafts

Historical SQL drafts and templates belong under:

```text
schemas/imported-from-betting-win/legacy/surebet/
templates/imported-from-betting-win/legacy/surebet/
```

The SQL files are not active migrations. The templates are not active runbooks.

## Classification rule

Import here only material about surebet or complete-set logic, such as scenario cashflows, stake vectors, capacity, completion, residual exposure, settlement replay, and surebet-family research.

Do not import predictive/value-betting feature/model/CLV docs as active authority. Those belong to `betting-win-betting`.

Do not import provider adapters, canonical history, raw provider capture, or source-lineage ownership as active authority. Those remain in `betting-win`.

Current authority remains:

```text
repo_role=surebet_strategy_execution_repo
provider_truth_owner=betting-win
predictive_strategy_owner=betting-win-betting
backtesting_owner=betting-win-surebet
paper_mode_owner=betting-win-surebet
future_live_decision_owner=betting-win-surebet_after_explicit_gate
account_policy=separate_from_betting-win-betting
```
