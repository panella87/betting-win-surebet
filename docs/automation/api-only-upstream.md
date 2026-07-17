# API-only betting-win upstream contract

## Binding decision

BWS consumes betting-win only through the accepted read-only HTTP API.

The runtime transport is fixed. Operators do not set `BWS_UPSTREAM_MODE`, and no export-path selector or automatic file fallback is accepted.

## Required behavior

- Paper evaluation and paper autopilot report `upstream_mode=api`.
- Runtime lifecycle, scheduler, soak, release, upgrade, diagnostics, and external preflight use the read-only API tuple.
- Missing, unreachable, or incompatible betting-win API evidence produces a precise runtime-evidence blocker.
- Source-fix handoffs preserve API campaign identity automatically.
- BWS never contacts providers directly and never writes betting-win-owned state.

## Historical export code

Historical pinned-export parsers may remain for deterministic fixture and backtest compatibility. They are not operator-selectable runtime transports and are not exposed by package scripts or the root CLI.

## Validation

```bash
npm run validate:api-only-upstream
```
