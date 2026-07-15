# Paper evaluation controller: betting-win-surebet

`run-paper-evaluation.sh` remains the standalone retained fixture/pinned-bundle evaluator while the executable continuous runtime is implemented.

It is not the current implementation controller. Its no-service private paper behavior is transitional and fail closed. It must not be used to classify `BWS-520` through `BWS-580` as external-only work.

Current inputs remain repo-local fixtures or an explicit pinned bundle through `SUREBET_PINNED_BUNDLE`. Direct provider calls, direct betting-win database reads and execution remain prohibited.

After `BWS-580`, an explicit automation integration review must connect this controller or its parent to the new machine-readable continuous-runtime evaluation command without weakening lock, handoff, artifact or Telegram finalization contracts.
