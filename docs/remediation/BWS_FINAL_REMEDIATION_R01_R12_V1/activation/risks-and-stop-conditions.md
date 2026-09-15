# Risks and mandatory stop conditions

The campaign stops without trying an unsafe alternative route when any of these conditions occurs:

- another campaign launcher owns the kernel lock, or the locked path's exact device/inode identity changes during any child or proof cycle;
- any controller lock exists before S2, including a malformed or symlinked lock;
- a tranche cannot reverify its finding against current source;
- a dependency is missing, blocked, stale, not `ACCEPTED`, or its historical result, preimage, digest chain, test set, proof lanes, or trusted attestation no longer validates;
- exact Node `v20.20.2` is unavailable;
- required disposable PostgreSQL, filesystem, systemd, crash/restart, browser, soak, or other environment proof cannot be produced;
- a task changes secret metadata, immutable authority, a future-owner path, an unmapped untraceable path, or a protected file outside its exact allowlist;
- a purported complete tranche changes only support files and no exact owned source path;
- independently computed changed paths differ from the candidate result;
- a test command is trivial, shell-string based, unbound to its exact requirement ID, or trusted replay does not dynamically observe an exact mapped production entrypoint through Node, Python, or Bash execution evidence;
- a bounded Codex/controller child exceeds its clipped timeout, changes or escapes its owned process group, leaves any token-owned or observed descendant, or receives inherited GitHub, SSH-agent, PostgreSQL-password, database-URL, or cloud credential variables;
- trusted test replay fails, times out, uses the wrong Node runtime, leaves a token-owned descendant, cannot clean its disposable environment, or supplies only static filename references instead of dynamic entrypoint execution;
- the campaign-admission Git commit, branch, or upstream changes; the committed immutable manifest differs from the worktree; campaign state, tranche preimage, or launcher-lock identity changes during child execution; or a complete result lacks an exact trusted-evidence attestation bound to current validator and verifier bytes;
- tests time out, exceed the trusted output bound, leak owned descendants, fail production-entrypoint binding, or any repository validator, immutable checksum, or receipt validation fails;
- the persisted operator window or bounded retry ceiling ends;
- external evidence is required and the only lawful terminal state is `SOURCE_COMPLETE_EXTERNAL_PENDING` or `BLOCKED`.

Malformed candidate results are moved under the campaign artifact root for audit and may be retried only while the same tranche remains admitted and the original operator window remains open. Source changes are never silently discarded.

`BLOCKED` and `SOURCE_COMPLETE_EXTERNAL_PENDING` are persisted as terminal, non-advancing outcomes. Restarting the launcher does not rerun them or extend the operator window.

The launcher does not delete locks, kill unrelated processes, infer external evidence, downgrade test scope, substitute Node 22, or continue after an ambiguous trusted result.
