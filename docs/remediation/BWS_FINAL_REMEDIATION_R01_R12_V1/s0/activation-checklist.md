
# S0 activation checklist

Every item must be explicitly satisfied in a later activation cycle.

- [ ] Explicit user authorization names `BWS_FINAL_REMEDIATION_R01_R12_V1` and exactly one tranche.
- [ ] Repository path and package identity match `betting-win-surebet`.
- [ ] BWS122 lineage, current Git HEAD, branch, upstream, and dirty state are captured.
- [ ] Protected mutable authority files match their expected preimages.
- [ ] Current task remains BWS-600, active implementation queue remains none until admission is written, and current holds remain unchanged.
- [ ] Every finding and current symbol is reverified against current source.
- [ ] Exact allowed edits, read-only shared paths, prohibited paths, and rollback root are recorded.
- [ ] Exact Node/runtime, test, environment, and evidence requirements are available.
- [ ] No autonomous controller is running or used for S1/S2.
- [ ] No `betting-win` checkout/source/service/database/documentation access is requested.
- [ ] Admission receipt validates and has a parent/previous digest chain.

Any unchecked item blocks activation.
