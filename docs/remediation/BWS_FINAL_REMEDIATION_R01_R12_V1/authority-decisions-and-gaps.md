# Authority decisions and unresolved fields

## Current decisions

- `BWS_FINAL_REMEDIATION_R01_R12_V1` is active; T39 alone is admitted.
- BWS122 remains the frozen finding/dependency/application-source baseline.
- BWS125 (`72a8262a5f94d144bb930cc9fb2778eed672d2a97a252f49b07f7b979b47224f`) is the current documentation-aligned repository archive and contains no accepted remediation source result.
- The active admission, fixed-order plan, immutable task files, and launcher under `activation/` supersede the retained S0 proposal records.
- Exactly one source-mutating tranche may be active. Existing autonomous controllers remain prohibited until the complete S2 gate is accepted.
- Current source paths in packets are candidates requiring first-launch reverification, not unconditional edit permission.
- `SOURCE_MANIFEST.json` remains stale and owned by T40; current BWS125 drift is 994 expected non-self files, 617 manifest entries, 377 missing, 47 mismatched, and 0 extra in the documentation postimage; BWS125 itself had 38 mismatches.
- All existing BWS/release/deployment/live-execution holds remain unchanged.

## Unresolved first-launch fields

The following still require runtime capture and fail closed when absent:

- Git HEAD, branch, upstream, dirty-state digest, and exact checkout identity;
- confirmation that every T39 symbol/path and reviewed behavior remains current;
- exact admitted edit and test-helper set after reverification;
- concrete bounded commands for all 17 T39 requirements;
- disposable environment identities and cleanup ownership;
- canonical nested-secret allowlist and pinned SSH host-key material location;
- implementation postimages, executed test results, reviewers, timestamps, and receipt digest chain.

## Source-contract residual requiring implementation reconciliation

`schemas/bws-release-manifest.v1.schema.json` currently fails strict JSON parsing at end-of-file because its outer object is not closed. This documentation audit does not alter executable schemas or invent a finding owner. The file must not be represented as valid schema evidence; a later admitted implementation cycle must reconcile ownership and proof before correcting it.

## Historical records

The original 161-file documentation package, S0 proposal, BWS-600 paper route, and completed BWS-100 through BWS-599 blueprints remain audit history. They do not select current work.
