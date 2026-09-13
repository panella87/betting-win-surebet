# Active remediation campaign admission

```text
program_id=BWS_FINAL_REMEDIATION_R01_R12_V1
repository=betting-win-surebet
activation_state=ACTIVE
current_tranche=BWS-W4-T39
campaign_order=1
stage=S1
owner=R10
user_authorization=explicit_2026_09_13_longest_safe_unattended
```

The user explicitly authorized the longest safe unattended implementation path. This admission activates the fixed 47-tranche remediation program and admits only `BWS-W4-T39` now. Later tranches are preauthorized only for sequential admission after the current tranche is `ACCEPTED` and every declared dependency is `ACCEPTED`.

Exactly one source-mutating tranche may be active. Orders 1 through 13 use bounded direct Codex sessions because the existing autonomous controllers remain prohibited until S2 is accepted. Orders 14 through 47 may use the repaired implementation controller, one exact tranche per invocation.

The immutable live campaign state is written under `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json`. Runtime receipts are artifacts, not source authority. The launcher stops on any blocked, failed, missing, stale, malformed, or non-accepted result.

All existing BWS-600, BWS-710, BWS-900, release, deployment, and live-execution holds remain unchanged. No `betting-win` checkout, service, database, source, or documentation access is authorized.
