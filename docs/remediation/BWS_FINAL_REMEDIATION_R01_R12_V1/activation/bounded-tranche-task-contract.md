# Bounded tranche task contract

Every task under `tasks/` is an exact one-tranche authority source. The active task must:

1. validate `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json` and prove it names the same tranche in `ADMITTED` state;
2. use the immutable tranche preimage captured by the launcher before editing;
3. reverify every finding against exact current source;
4. implement only the smallest coherent correction boundary and change at least one exact path owned by the tranche before claiming internal completion;
5. define every mapped focused, production-entrypoint, negative, adversarial, concurrency, crash, and environment proof under exact Node `v20.20.2` where Node applies;
6. write one candidate canonical tranche result under the declared artifact path;
7. use only the exact mapped test requirement IDs and preserve their finding membership and production-entrypoint authority;
8. provide each test command as a direct argv array, never `sh -c` or `bash -c`;
9. bind each command to its exact test requirement ID in argv or a referenced repository test source file;
10. bind every production-entrypoint command to a relevant production source path in argv or the referenced test source, and structure the test so trusted replay actually loads, invokes, or executes that exact mapped path;
11. use bounded repository-local commands that own and clean their disposable children; no listed-but-unrun test, placeholder, generic command, source comment, filename-only assertion, or self-reported digest is evidence;
12. report `ACCEPTED` only when every internal requirement is closed, or truthfully report `BLOCKED` or an eligible `SOURCE_COMPLETE_EXTERNAL_PENDING` state;
13. leave trusted test replay, output hashing, proof-environment construction, advancement, and terminal-state persistence to the launcher and validators;
14. preserve the campaign-admission Git commit, branch, upstream, kernel-lock identity, all holds, and every prohibited action.

After implementation and before writing the candidate result, obtain the independently computed receipt context with:

```text
python3 docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/validate_activation_package.py \
  --repo "$PWD" \
  --receipt-context "$BWS_ACTIVE_TRANCHE"
```

The context contains the exact preimage and postimage generation IDs, independently computed changed-path records, parent receipt digest, required test metadata, proof lanes, and allowed terminal states. It contains no secret values.

The launcher then invokes `scripts/validate_remediation_tranche_evidence.py`. That verifier re-executes every command, replaces provisional test and proof fields with observed values, observes dynamically executed repository paths through process records plus language-specific instrumentation, and writes a trusted attestation. A production-entrypoint requirement without an observed mapped production path fails even when its test source contains the right filename. A complete result without that exact attestation cannot be checked or advanced.

Directly necessary support files under `tests/`, `scripts/`, `schemas/`, or `docs/` must contain the tranche ID, one owned finding ID, or an exact mapped test requirement ID. Support-only changes cannot close a tranche; at least one exact mapped or exactly allowed protected path must change.

The task may not edit the activation plan, launcher, validator, seed, immutable authority checksum set, canonical tranche packet, campaign maps, test-evidence matrix, protected-file authority, another tranche task file, Git refs, Git configuration, or the campaign lock path unless the active tranche explicitly owns that exact Git configuration boundary. No tranche may commit or switch the campaign Git anchor.
