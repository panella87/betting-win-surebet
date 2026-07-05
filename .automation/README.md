# `.automation/`

Repo-local automation support files for `betting-win-surebet`.

Active shared helpers:

```text
.automation/lib/run_common.sh
.automation/lib/telegram_notify.sh
```

`run_common.sh` is used by the current long controllers. `telegram_notify.sh` is
installed for the standardized completion-notification contract and is ready to be
wired into the long controllers in a later explicit run-controller wave.

This repo has no service-owned paper lifecycle. Local paper evidence is written
under `artifacts/`, and the read-only progress helpers inspect those artifact
folders directly.
