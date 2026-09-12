
# Documentation decisions and unresolved activation-time fields

## Explicit documentation decisions

- The new package is added only under `docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1`. Protected mutable authority documents are not replaced or edited.
- Campaign-map JSON controls tranche identity, membership, order, stage, owner, paths, tests, environments, and acceptance authority.
- Detailed cumulative findings and test-evidence records supply exact behaviors, invariants, symbols, correction boundaries, risks, and proof requirements.
- Current source-path entries remain candidates until a tranche admission re-verifies them.
- The BWS122 archive SHA-256 and exact member inventory are baseline authority; `SOURCE_MANIFEST.json` remains stale and unchanged.
- All package files are new documentation additions with mode `0644`; there are no replacements.

## `TO_CONFIRM_DURING_ADMISSION`

The following cannot be authoritative from an archive/planning package and must be captured later:

- current Git HEAD, branch, upstream, and dirty state;
- whether each reviewed symbol/line range moved or was independently corrected after BWS122;
- exact final edit set when a moved symbol or newly required test path is discovered;
- concrete focused and production-entrypoint command binding for requirements whose tests do not yet exist;
- disposable/managed proof-environment identities, runtime resources, and cleanup owners;
- T39 canonical nested-secret allowlist decisions and pinned SSH host-key material location;
- implementation postimages, executed test outputs, environment evidence, reviewers, and receipt digest chain;
- accepted external upstream handoff and parity/resource evidence for BWS-600/BWS-710;
- any later explicit activation, queue, controller, release, deployment, or execution decision.

These fields are explicit gaps, not silent defaults. They block the relevant transition until captured.
