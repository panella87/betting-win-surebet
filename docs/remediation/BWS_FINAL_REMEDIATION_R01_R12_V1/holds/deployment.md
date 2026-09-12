
# deployment release decision contract

## Current state

`deployment=BLOCKED`

## Exact decision owner

explicit deployment acceptance authority

## Internal prerequisite findings/tranches

- release hold separately released
- target plan/identity/rollback accepted
- all deployment-blocking findings closed by T43

## Required environment receipts

- target-specific preflight
- exclusive owner/fencing
- backup/recovery checkpoint
- post-deploy verification and rollback proof

## External prerequisites

- operator-approved target and maintenance authority

## Required immutable generation graph

- accepted release_generation
- target config/process/environment generation
- deployment decision receipt
- campaign closure

Every node must name exact parent generations, content digests, clock authority, owner/reviewer, and retained holds. A mutable status document or latest pointer is not sufficient.

## Accepted evidence classes

- schema-valid immutable receipts from the required source, configuration, process, evidence, release, test, environment, tranche, and campaign generations;
- executed production-entrypoint and environment proof bound to the exact accepted postimage;
- independently verifiable external authority where this hold requires it;
- explicit hold-release decision from the decision owner.

## Rejected evidence and prohibited substitutions

- release artifact alone
- local acceptance
- documentation
- source completion
- unmanaged manual copy
- external pending

## Conditions that still retain the hold

- release blocked
- target/owner/checkpoint unknown
- post-deploy proof unavailable
- any deployment-blocking finding open

## Binding rule

Documentation, a source postimage, a static validator, a test list, or source completion alone does not release `deployment`. `SOURCE_COMPLETE_EXTERNAL_PENDING` retains the hold. Unknown, missing, stale, wrong-generation, caller-asserted, or synthetic evidence retains the hold.
