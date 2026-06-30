# 004 — Market identity and rule equivalence

A candidate group must not be accepted unless it has exact event and market identity from
`betting-win`, a compatible rule profile, and a resolved generation/result-source policy.

## Required evidence

- Canonical event identity.
- Canonical market identity.
- Provider generation.
- Rule profile version.
- Result-source authority.
- Finality policy.

## Blockers

- Unknown generation.
- Missing canonical identity.
- Unresolved terminal scenarios.
- Ambiguous result source.
- Rule-profile mismatch.

The SURE-001 code only models the shape and blockers. It does not infer identity.
