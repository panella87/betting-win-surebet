# 041 - External runtime preflight and BWS-600 campaign

## Scope

`BWS-593` is safe local implementation. `BWS-600` is the external evidence campaign.

```text
runtime_upstream_mode=api_only
automatic_file_fallback=prohibited
selected_controller=run-paper-autopilot.sh
```

## BWS-593 preflight tooling

Provide a fail-closed preflight command for the fixed API-only runtime input:

```text
api mode
  operator-approved read-only base URL
  exact contract version
  bounded pagination, timeout and retry policy
  no provider credentials
```

Export files are not operator-selectable BWS-600 runtime inputs.

The preflight must verify:

- exact `config/betting-win.upstream.lock.json` compatibility;
- API-only input and no fallback;
- private BWS database and runtime configuration presence;
- loopback BWS API/cockpit binding;
- execution and provider connections disabled;
- release/source fingerprints;
- backup and restore-verification freshness;
- available evidence and log storage;
- absence of secrets from generated output.

It writes a machine-readable `bws.external_runtime_campaign.v1` manifest with a semantic fingerprint. It must not contact a provider or start a long campaign during check-only mode.

## BWS-600 evidence campaign

`BWS-600` starts only after `BWS-599` and an accepted campaign manifest.

The campaign uses `run-paper-autopilot.sh` with the service-owned lifecycle. It must retain continuous private-paper evidence for the operator-approved input and classify:

- source defects requiring implementation;
- runtime or configuration blockers;
- upstream compatibility drift;
- data-quality blockers;
- readiness progression;
- campaign completion or continuation.

Loopback fixtures cannot validate `BWS-600`. The gate remains blocked until real operator-approved read-only input and retained evidence exist.

## Execution boundary

`BWS-600` remains private paper only. It does not authorize provider credentials, account mutation, orders, wallets, signers, transactions, public signals or profitability claims. Those remain under separately parked `BWS-900`.
