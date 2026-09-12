
# release release decision contract

## Current state

`release=BLOCKED`

## Exact decision owner

explicit release acceptance authority

## Internal prerequisite findings/tranches

- T33 release packaging accepted
- T34 upgrade/rollback accepted
- T35 managed soak accepted
- T36 final promotion graph accepted
- T43 closure accepted

## Required environment receipts

- exact Node/runtime compatibility
- immutable archive/member proof
- upgrade/rollback and recovery proof
- managed soak proof

## External prerequisites

- all external source/runtime holds required by the release target resolved or explicitly excluded by accepted release scope

## Required immutable generation graph

- source_generation
- config_generation
- process_generation
- evidence_generation
- release_generation
- test_generation
- environment_generation
- campaign_generation

Every node must name exact parent generations, content digests, clock authority, owner/reviewer, and retained holds. A mutable status document or latest pointer is not sufficient.

## Accepted evidence classes

- schema-valid immutable receipts from the required source, configuration, process, evidence, release, test, environment, tranche, and campaign generations;
- executed production-entrypoint and environment proof bound to the exact accepted postimage;
- independently verifiable external authority where this hold requires it;
- explicit hold-release decision from the decision owner.

## Rejected evidence and prohibited substitutions

- source build success alone
- documentation
- static marker
- archive existence
- unexecuted tests
- Node 22 pass
- external pending

## Conditions that still retain the hold

- any prerequisite receipt missing
- BWS-600/BWS-710 required by target remains blocked
- archive/runtime/currentness/rollback ambiguity
- external pending

## Binding rule

Documentation, a source postimage, a static validator, a test list, or source completion alone does not release `release`. `SOURCE_COMPLETE_EXTERNAL_PENDING` retains the hold. Unknown, missing, stale, wrong-generation, caller-asserted, or synthetic evidence retains the hold.
