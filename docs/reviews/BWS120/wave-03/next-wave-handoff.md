# BWS Wave 03 to Wave 04 review handoff

## Frozen baseline

```text
repository=betting-win-surebet
archive=betting-win-surebet120.zip
sha256=d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb
regular_files=695
canonical_runtime=Node_20.20.2
confirmed_findings=137
P0=5
P1=115
P2=17
```

## R10 exclusive ownership

Configuration and environment precedence; CLI parsing; missing/null/blank/zero/false semantics; filesystem roots; symlink and traversal confinement; secrets and redaction policy; loopback/external-destination policy; repository boundary; update/root wrappers.

R10 must consume without duplicating R01-001/R01-009, R03-001, R06 ownership/path dependencies, R07-001/R07-002, R08-001/R08-002, and R09-005/R09-006/R09-019.

## R11 exclusive ownership

Tests, validators, fixtures, generated output, source manifest, build graph, package scripts, runtime-version enforcement, production-entrypoint coverage, false-green acceptance, and exact archive/source proof.

R11 owns `KNOWN_BASELINE_MANIFEST_DRIFT` and must evaluate why validators passed while 137 findings remained reachable. It must not reissue application root causes under validator IDs.

## R12 exclusive ownership

Autonomous controllers, child-result protocols, lock/lease files, handoffs, artifact directories, cleanup, inode/disk guards, Telegram routing, interruption/restart, and campaign finalization.

R12 must consume R06-015/R06-016, R07 evidence/controller findings, and R09 soak/promotion dependencies without duplicating their source roots.

## Shared restrictions

```text
mode=read_only_research
source_mutation=no
documentation_mutation=no
controller_execution=no
service_control=no
database_mutation=no
provider_access=no
betting_win_access=no
implementation_prompt=no
live_operation=no
```

All 137 IDs remain stable. The Wave 03 overlay is documentation only and is not landed until exact postimages are present in a later archive or the transactional installer succeeds.
