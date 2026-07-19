# API-only betting-win upstream contract

## Binding decision

BWS consumes betting-win only through the accepted read-only HTTP API.

The runtime transport is fixed. Operators do not set `BWS_UPSTREAM_MODE`, and no export-path selector or automatic file fallback is accepted.

## Required behavior

- Paper evaluation and paper autopilot report `upstream_mode=api`.
- Runtime lifecycle, scheduler, soak, release, upgrade, diagnostics, and external preflight use the read-only API tuple.
- Missing, unreachable, or incompatible betting-win API evidence must produce a precise fail-fast blocker before BWS enters a long runtime-evidence observation window.
- The paper runtime-evidence preflight resolves `BWS_UPSTREAM_API_BASE_URL` from the approved runtime environment/default path, probes `/contract` with the configured timeout and contract version, rejects credential-bearing or non-loopback URLs, and blocks `127.0.0.1:4312` plus loopback aliases such as `localhost:4312` because the local BWS API is not upstream evidence.
- The external runtime preflight applies the same credential-free, loopback-only upstream API boundary and also rejects `127.0.0.1:4312` plus loopback aliases so the local BWS API can never be reused as accepted betting-win evidence.
- Source-fix handoffs preserve API campaign identity automatically.
- BWS never contacts providers directly, never starts or stops betting-win services, and never writes betting-win-owned state.
- Supported root runtime wrappers enforce `SUREBET_RUNTIME_MODE=paper`, `SUREBET_PROVIDER_CONNECTIONS=disabled`, and `SUREBET_EXECUTION_ENABLED=false`; these are not operator-selectable fallbacks.
- Explicit process values take precedence for approved connection settings, while `.env` supplies the canonical `POSTGRES_ADDRESS`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB` tuple.
- The wrapper derives internal `SUREBET_PG_*` values from `POSTGRES_*`, rejects URL-style database variables, and uses repo-owned defaults for internal BWS intervals, worker identity, API transport, cockpit mode, upstream lock path, and the standard private-paper schedule path.
- `BWS_PRIVATE_PAPER_SCHEDULE_PATH` may be explicitly overridden, but the wrapper never creates fixture schedule content or falls back to a fixture.
- Retired export selectors and `SUREBET_PINNED_BUNDLE` are scrubbed from runtime children.
- The BWS local read-only API on `127.0.0.1:4312` is not upstream evidence; it cannot satisfy the required betting-win API preflight.
- When that probe fails, retained bounded evidence includes the redacted configured upstream base URL, probe path, timeout, HTTP status or connection error class, no-export-fallback proof, and the blocker code `PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE`.

## Historical export code

Historical pinned-export parsers may remain for deterministic fixture and backtest compatibility. They are not operator-selectable runtime transports and are not exposed by package scripts or the root CLI.

## Validation

```bash
npm run validate:api-only-upstream
```
