# Immutable-generation architecture

Every downstream receipt names and validates the exact upstream generations it consumes. Equality of labels, paths, mutable pointers, or caller-supplied hashes is insufficient. Raw secrets are never included.

## source_generation

**Owner:** T40 for BWS repository source authority; T02/T03 for upstream object/API source sub-generations

**Immutable identity fields**

- repository
- baseline/archive lineage
- literal commit/tree when available
- complete member/path set
- path modes
- content sha256
- source-manifest status
- upstream object/cycle identities

**Digest composition:** domain-separated canonical encoding of repository identity, parent source generation, sorted path/mode/content hashes, and accepted upstream source receipts

**Timestamps and clock authority:** receipt clock plus source-origin/receive/verify clocks kept distinct

**Parent generation:** prior accepted source_generation or BWS122 baseline

**Consumer validation:** recompute all available hashes; reject omitted, extra, mismatched, stale, or wrong-parent members

**Persistence/publication boundary:** immutable receipt and content-addressed evidence; mutable convenience pointers are non-authoritative

**Currentness rule:** latest explicitly accepted descendant of the admitted parent, never newest filename alone

**Replay rule:** same bytes, modes, identity fields, and parent produce the same digest

**Supersession rule:** new accepted generation references predecessor; predecessor remains addressable

**Conflict behavior:** same identity with different bytes or parents fails closed

**Missing/blank/null/unknown behavior:** missing/blank/null/unknown field blocks consumption

**Permitted external-pending state:** permitted only when local source is complete but accepted external upstream evidence remains unavailable

**Required receipt fields**

- repository
- parent
- member inventory
- digest composition version
- source-manifest classification
- timestamps
- owner/reviewer
- retained holds

## config_generation

**Owner:** T37/T38 and the active tranche owning each explicit configuration contract

**Immutable identity fields**

- normalized key set
- value-source labels
- blank-vs-absent state
- secret-safe value digests
- bounded child-environment key set
- database tuple
- destination policy

**Digest composition:** domain-separated canonical key/source/blank-state map; secrets represented only by approved one-way digests or presence metadata

**Timestamps and clock authority:** admission/receipt clock; no config file mtime authority

**Parent generation:** source_generation

**Consumer validation:** validate explicit source precedence, required fields, blank handling, destination confinement, and secret-safe digest

**Persistence/publication boundary:** receipt only; raw secrets and credentials are never persisted

**Currentness rule:** exact config_generation named by the admitted process/campaign

**Replay rule:** reconstruct equivalent non-secret map from approved protected configuration source

**Supersession rule:** new generation references prior config generation and reason

**Conflict behavior:** same ID with different effective values/source labels fails closed

**Missing/blank/null/unknown behavior:** no default, environment fallback, or blank coercion unless the reviewed contract explicitly permits it

**Permitted external-pending state:** not a substitute for missing internal configuration

**Required receipt fields**

- source_generation_id
- effective key/source map
- secret redaction policy
- database/destination identity
- owner/reviewer
- timestamp

## process_generation

**Owner:** T21-T25 for runtime processes; T44-T47 for controller processes

**Immutable identity fields**

- source/config generation IDs
- executable digest
- argv shape without secrets
- bounded environment digest
- owner/lease/fencing epoch
- PID and process-group identity
- child registry

**Digest composition:** canonical source+config+executable+owner+epoch+child-set record

**Timestamps and clock authority:** database/monotonic process clock as specified by accepted lifecycle contract; wall clock recorded separately

**Parent generation:** source_generation and config_generation

**Consumer validation:** prove owner before side effects, exact executable, fencing epoch, child ownership, and terminality

**Persistence/publication boundary:** durable lifecycle receipt/checkpoint; PID files alone are not authority

**Currentness rule:** highest accepted fencing epoch with live owner proof and matching source/config

**Replay rule:** restart reconciles durable state and does not infer success from stale PID/heartbeat

**Supersession rule:** new fenced owner explicitly supersedes terminal/stale prior generation

**Conflict behavior:** two live owners or non-monotonic heartbeat/epoch blocks and self-fences

**Missing/blank/null/unknown behavior:** unknown owner/child/terminal state is failure, not readiness

**Permitted external-pending state:** not permitted for missing internal ownership proof

**Required receipt fields**

- source/config IDs
- executable digest
- owner/epoch
- process and child identities
- start/terminal times
- termination proof
- retained holds

## evidence_generation

**Owner:** T26-T29 with producing tranche owner for domain-specific evidence

**Immutable identity fields**

- content digest
- media/schema type
- producer process generation
- source/config/test/environment generation IDs
- complete member/reference graph
- publication identity

**Digest composition:** canonical metadata plus exact immutable content bytes and sorted references

**Timestamps and clock authority:** producer monotonic/wall clocks and publication clock recorded distinctly

**Parent generation:** process_generation plus consumed source/config/test/environment generations

**Consumer validation:** recompute content digest, verify producer lineage, schema, reference graph, currentness, and redaction

**Persistence/publication boundary:** content-addressed immutable objects with serialized create-or-compare indexes

**Currentness rule:** monotonic accepted pointer bound to exact generation, never filename mtime alone

**Replay rule:** same inputs reproduce byte-identical evidence or an explicitly versioned semantic equivalent

**Supersession rule:** new evidence retains predecessor/reference links and cannot delete accepted dependencies

**Conflict behavior:** same identity/different content or broken reference blocks publication

**Missing/blank/null/unknown behavior:** missing artifact, digest, producer, reference, or redaction proof is failure

**Permitted external-pending state:** may record unavailable accepted external evidence without promoting gates

**Required receipt fields**

- producer generation
- content hashes
- schema/media type
- references
- publication result
- redaction result
- timestamps
- owner/reviewer

## release_generation

**Owner:** T33/T34/T36; separate release decision owner retains hold authority

**Immutable identity fields**

- source/config/runtime compatibility
- exact archive/member set
- content hashes/modes
- predecessor
- upgrade/rollback plan
- publication targets

**Digest composition:** canonical exact member inventory plus consumed generation IDs and plan digest

**Timestamps and clock authority:** release receipt clock; filesystem mtime is metadata only

**Parent generation:** accepted source/config/process/evidence generations and prior release generation

**Consumer validation:** independently re-read archive, reject undeclared/missing members, validate runtime and predecessor, prove atomic publication

**Persistence/publication boundary:** immutable archive generation and atomic current pointer after all targets commit

**Currentness rule:** explicit accepted publication receipt, not mutable singleton archive presence

**Replay rule:** same member bytes/modes and parents reproduce same release digest

**Supersession rule:** new release preserves accepted predecessor and rollback path

**Conflict behavior:** partial publication or same ID/different bytes leaves release blocked

**Missing/blank/null/unknown behavior:** unknown runtime, component, archive, rollback, or publication state blocks

**Permitted external-pending state:** source-complete release proof cannot release external runtime holds

**Required receipt fields**

- member inventory
- archive digest
- runtime identity
- parent generation graph
- publication targets/results
- rollback checkpoint
- holds

## campaign_generation

**Owner:** S0 admission authority and final T43 campaign closure authority

**Immutable identity fields**

- program ID
- baseline source generation
- ordered 47-tranche map
- stage model
- hold register
- schema versions
- prior campaign generation

**Digest composition:** canonical program authority, ordered tranche identities/dependencies, schema digests, and baseline/hold digests

**Timestamps and clock authority:** campaign admission/result receipt clock

**Parent generation:** prior campaign proposal/admission/result generation

**Consumer validation:** recompute counts, finding uniqueness, order, DAG, schemas, proposed/active state, and holds

**Persistence/publication boundary:** immutable admission/result receipt; mutable task documents remain separate authority until explicitly updated

**Currentness rule:** latest explicitly activated and accepted campaign generation, not this proposal

**Replay rule:** same authority inputs reproduce same campaign digest

**Supersession rule:** new campaign generation references predecessor and explicit authorization

**Conflict behavior:** different membership/order/holds under same ID fails closed

**Missing/blank/null/unknown behavior:** no active campaign is inferred from a proposal or documentation tree

**Permitted external-pending state:** final campaign may preserve external-pending tranches but cannot report released gates

**Required receipt fields**

- program/baseline
- ordered map digest
- schema index
- activation state
- holds
- owner/reviewer
- timestamps
- parent/previous digests

## tranche_generation

**Owner:** the campaign-map primary owner for the exactly admitted tranche

**Immutable identity fields**

- tranche ID/order/stage/owner
- finding IDs
- dependencies
- allowed/read-only/prohibited paths
- preimage
- proof bindings
- acceptance authority

**Digest composition:** canonical admission plus preimage, finding, dependency, path, test/environment, and hold identities

**Timestamps and clock authority:** tranche admission/result receipt clock

**Parent generation:** campaign_generation and predecessor accepted tranche postimage/result

**Consumer validation:** verify exactly one admission, dependency terminal states, path boundary, preimage, proof, and allowed transition

**Persistence/publication boundary:** immutable admission and terminal result receipts

**Currentness rule:** the single explicitly admitted non-terminal tranche; all others are NOT_ADMITTED or terminal

**Replay rule:** retry starts from same preimage or a new explicitly reconciled admission

**Supersession rule:** replacement admission references revoked/blocked predecessor and explains source change

**Conflict behavior:** multiple admitted source-mutating tranches or changed membership/owner blocks

**Missing/blank/null/unknown behavior:** no source mutation without complete admission; unknown state fails closed

**Permitted external-pending state:** only campaign-map-marked T29/T36 may use SOURCE_COMPLETE_EXTERNAL_PENDING

**Required receipt fields**

- campaign/tranche IDs
- order/stage/owner
- findings/dependencies
- path boundaries
- pre/post images
- proof generation IDs
- state
- holds
- digest chain

## test_generation

**Owner:** active tranche owner; independent acceptance reviewer verifies production-entrypoint binding

**Immutable identity fields**

- test requirement ID
- finding IDs
- source/postimage generation
- command/working directory
- runtime
- environment
- expected assertions
- stdout/stderr/result digests

**Digest composition:** canonical command, inputs, runtime/environment, test source bytes, result/status, and evidence hashes

**Timestamps and clock authority:** test runner start/end clock with monotonic duration

**Parent generation:** tranche_generation and implementation postimage

**Consumer validation:** command actually executed, bounded, correct runtime/environment, production-entrypoint flag satisfied, output/evidence present

**Persistence/publication boundary:** immutable focused/production-entrypoint test receipts; test listing is non-evidence

**Currentness rule:** receipt postimage/source IDs match the tranche postimage being accepted

**Replay rule:** same inputs rerunnable in declared disposable/controlled environment; nondeterminism is explicit failure or versioned tolerance

**Supersession rule:** rerun receipt references prior failed/stale receipt and same/new postimage

**Conflict behavior:** same test generation ID with different command/result blocks

**Missing/blank/null/unknown behavior:** not run, timeout, skipped, wrong runtime, missing output, or stale postimage does not pass

**Permitted external-pending state:** not used to excuse internal tests

**Required receipt fields**

- test ID/findings
- command
- cwd
- timeout
- exit/status
- runtime
- environment
- postimage
- output digests
- owner/reviewer/timestamps

## environment_generation

**Owner:** proof-lane operator and tranche acceptance reviewer

**Immutable identity fields**

- proof lane
- disposable/target identity
- runtime/tool versions
- configuration digest
- source/postimage/test generation IDs
- resource/process/database identities
- cleanup state

**Digest composition:** canonical environment inventory plus consumed generations, proof result, evidence and cleanup hashes

**Timestamps and clock authority:** environment runner and external source clocks recorded separately

**Parent generation:** tranche/test/process generations

**Consumer validation:** prove correct lane, target, isolation, lineage, bounded operation, evidence, and cleanup

**Persistence/publication boundary:** immutable environment-proof receipt; raw credentials excluded

**Currentness rule:** environment receipt matches exact postimage and required proof lane

**Replay rule:** disposable proof can be rebuilt from declared non-secret contract; managed soak resumes from accepted checkpoint

**Supersession rule:** new environment result references prior result and reason for rerun

**Conflict behavior:** wrong target, stale source, synthetic substitution, or different evidence under same ID blocks

**Missing/blank/null/unknown behavior:** unknown/missing environment identity, cleanup, external authority, or result blocks

**Permitted external-pending state:** allowed only for explicitly required unavailable external upstream acceptance, retained as non-promotable

**Required receipt fields**

- proof lane/target
- runtime/tools
- source/postimage/test IDs
- result/evidence
- resource inventory
- cleanup
- external pending
- holds
- timestamps/reviewers
