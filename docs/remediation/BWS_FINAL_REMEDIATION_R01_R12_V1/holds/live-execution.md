
# live-execution release decision contract

## Current state

`live-execution=PROHIBITED`

## Exact decision owner

separate explicit live-execution authorization program

## Internal prerequisite findings/tranches

- BWS-900 separately authorized
- release and deployment separately accepted
- all execution-path findings and controls accepted

## Required environment receipts

- real target/custody/risk/monitoring/kill-switch/reconciliation proof under separate authority

## External prerequisites

- explicit operator, governance, account, and provider authorization

## Required immutable generation graph

- separately authorized execution campaign and accepted source/config/process/evidence/release/test/environment generations

Every node must name exact parent generations, content digests, clock authority, owner/reviewer, and retained holds. A mutable status document or latest pointer is not sufficient.

## Accepted evidence classes

- schema-valid immutable receipts from the required source, configuration, process, evidence, release, test, environment, tranche, and campaign generations;
- executed production-entrypoint and environment proof bound to the exact accepted postimage;
- independently verifiable external authority where this hold requires it;
- explicit hold-release decision from the decision owner.

## Rejected evidence and prohibited substitutions

- paper success
- backtest success
- runtime readiness
- release/deployment alone
- documentation
- implicit authorization

## Conditions that still retain the hold

- BWS-900 parked
- no separate authorization
- release or deployment blocked
- risk/custody/provider controls incomplete

## Binding rule

Documentation, a source postimage, a static validator, a test list, or source completion alone does not release `live-execution`. `SOURCE_COMPLETE_EXTERNAL_PENDING` retains the hold. Unknown, missing, stale, wrong-generation, caller-asserted, or synthetic evidence retains the hold.
