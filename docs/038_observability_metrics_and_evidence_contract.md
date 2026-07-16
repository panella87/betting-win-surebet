# 038 - Observability, diagnostics and evidence contract

## Scope

This contract defines `BWS-586` and contributes to the final acceptance tasks.

## Structured logs

Every managed role must emit redacted JSON lines containing:

```text
timestamp
level
service role
runtime id
process identity
selected upstream mode
checkpoint or job id when applicable
event code
bounded details
```

Secrets, complete connection URLs, passwords, tokens and raw provider credentials are prohibited. Log files require bounded rotation and deterministic ownership.

## Metrics

Expose loopback-only machine-readable metrics for:

- upstream pass count, duration, last success and last blocker;
- scheduler cycles, duplicate suppression and queue depth;
- worker claims, lease renewals, successes, retries, dead letters and processing duration;
- API request counts, latency, errors and response sizes;
- cockpit readiness and asset fingerprint;
- database connectivity and migration state;
- evidence publication and retention results.

Metrics must not include profitability, public signals, provider account data or secrets.

## Diagnostics

Provide a read-only diagnostics command that collects:

- source and upstream lock fingerprints;
- lifecycle state and exact process ownership;
- health/readiness and metrics snapshots;
- database migration and queue summaries;
- recent redacted logs;
- recent immutable evidence index entries;
- configuration presence without configuration values.

The diagnostic bundle must be repo-local, atomic, checksum-addressed and safe to include in `artifacts.zip`.

## Evidence index and retention

Maintain an append-only index for lifecycle, runtime, paper-evaluation, backup/restore, release and recovery evidence. Index entries include schema, file path, SHA-256, creation time, source fingerprint, runtime id and retention class.

Retention may remove expired files only after verifying they are not referenced by an accepted ledger row, active runtime, unresolved blocker or retained campaign handoff.
