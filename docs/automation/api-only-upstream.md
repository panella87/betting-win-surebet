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
- Supported root runtime wrappers enforce `SUREBET_RUNTIME_MODE=paper`, `SUREBET_PROVIDER_CONNECTIONS=disabled`, and `SUREBET_EXECUTION_ENABLED=false`; these are not operator-selectable fallbacks.
- Explicit process values take precedence for approved connection settings, while `.env` supplies the canonical `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` tuple.
- The wrapper derives internal `SUREBET_PG_*` values from `POSTGRES_*`, rejects URL-style database variables, and uses repo-owned defaults for internal BWS intervals, worker identity, API transport, cockpit mode, upstream lock path, and the standard private-paper schedule path.
- `BWS_PRIVATE_PAPER_SCHEDULE_PATH` may be explicitly overridden, but the wrapper never creates fixture schedule content or falls back to a fixture.
- Retired export selectors and `SUREBET_PINNED_BUNDLE` are scrubbed from runtime children.

## Historical export code

Historical pinned-export parsers may remain for deterministic fixture and backtest compatibility. They are not operator-selectable runtime transports and are not exposed by package scripts or the root CLI.

## Validation

```bash
npm run validate:api-only-upstream
```
