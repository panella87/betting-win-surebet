# Paper autopilot controller

`run-paper-autopilot.sh` remains the hardened parent workflow for paper evidence and source-fix handoffs:

```text
paper evaluation -> source defect -> implementation -> runtime re-evaluation
```

```text
current_paper_service_lifecycle=full_stack_owned
integration_task=BWS-589
selected_now=yes_for_runtime_evidence_after_upstream_api_preflight
```

`BWS-589` validates the parent against the product-owned full-stack runtime-evidence lifecycle while preserving:

- exact parent and child lock ownership;
- atomic child terminal-result files;
- parent-only Telegram notification;
- validated source/runtime handoffs and semantic repeat guards;
- selected upstream mode and retained campaign directory across source fixes;
- post-lock artifact refresh;
- no parsing machine state from streamed logs.

`BWS-599` has validated the complete local paper-autopilot flow, and the broad bugfix campaign has closed all eight audit areas with a green final cross-area audit. `BWS-600` paper autopilot is selected after the fail-fast upstream betting-win API preflight source fix; launch remains blocked until an authorized contract-compatible downstream handoff, accepted real provider-to-PostgreSQL-to-API parity, and campaign evidence are available.

The paper child starts runtime evidence through `scripts/bws-root-wrapper-runtime.mjs`, but only after the upstream betting-win read-only API preflight succeeds. That wrapper uses explicit process configuration first, derives internal PostgreSQL settings from the private `.env` `POSTGRES_*` tuple, applies repo-owned internal runtime defaults, enforces API-only private paper (`paper`, provider-disabled, execution-disabled), and removes retired export or pinned-bundle runtime inputs before lifecycle inspection. It never substitutes private-paper manifest content. The paper-runtime-evidence wrapper rebuilds the compiled runtime plus managed cockpit assets before collection. Runtime-evidence startup must not treat BWS local API health on `127.0.0.1:4312` as upstream availability. The upstream betting-win API preflight is a separate fail-fast gate; after it passes, BWS local health is observed and blocked readiness remains inside the runtime-evidence observation loop. When API health is not observable, the lifecycle error reports bounded repo-local child stdout/stderr log paths, redacted log tails, and the last health/readiness probes. The runtime-evidence command timeout follows the requested duration plus a 300-second margin so seven-day/72-hour campaigns are not cut down to the short fixture-smoke timeout.
The preflight uses the configured upstream base URL and `/contract` probe, rejects credential-bearing, malformed, non-loopback, and BWS-local `127.0.0.1:4312` loopback aliases such as `localhost:4312`, and retains the fail-fast blocker `PAPER_EVALUATION_BLOCKED_BETTING_WIN_API_UNAVAILABLE` with bounded redacted probe evidence when the upstream API is unavailable or incompatible.

## Cross-repository launch gate

The selected controller is not presently runnable merely because a `betting-win` process answers HTTP. The inspected platform server exposes `/dashboard/*`, while current BWS preflight and query clients require `/contract` and `/query/*` with a versioned response and committed-HEAD provenance envelope. `betting-win` also records that the downstream runtime API handoff is not allowed.

```text
current_cross_repo_runtime_wire_status=NOT_ACCEPTED_NOT_COMPATIBLE
bws600_controller_selection=run-paper-autopilot.sh
bws600_controller_launch=blocked
launch_unblock_authority=accepted_cross_repository_handoff_and_real_provider_parity
```

The parent must fail before a long observation window when that exact handoff is unavailable. It must not scrape dashboard routes, infer an adapter, fall back to exports or fixtures, or operate the upstream repository. See `docs/002_dependency_contract_with_betting_win.md`.

Seven-day and 72-hour durations are ceilings. A bounded task may finish quickly, but the parent or implementation controller must continue while another dependency-ready safe task remains.
