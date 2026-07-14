# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` remains the standalone retained fixture/pinned-bundle evaluator during the platform build.

It is not the initial implementation controller. Its current no-service private paper behavior is transitional and must fail closed. After `BWS-510`, an explicit product or automation-maintenance task may extend it to the completed BWS service/runtime.

Current inputs remain repo-local fixtures or an explicit pinned bundle through `SUREBET_PINNED_BUNDLE`. Direct provider calls, direct betting-win DB reads, and execution remain prohibited.

Use paper evaluation only when explicitly requested or after the local platform reaches the required gate.
