# Bounded tranche task contract

Every task under `tasks/` is an exact one-tranche authority source. The active task must:

1. validate `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json` and prove it names the same tranche in `ADMITTED` state;
2. use the immutable tranche preimage captured by the launcher before editing;
3. reverify every finding against exact current source;
4. implement only the smallest coherent correction boundary;
5. run every mapped focused, production-entrypoint, negative, adversarial, concurrency, crash, and environment proof under exact Node `v20.20.2` where Node applies;
6. write one canonical tranche result under the declared artifact path;
7. use only the exact mapped test requirement IDs and preserve their finding membership and production-entrypoint authority;
8. bind every changed path, preimage, postimage, mode, test output digest, proof environment, and generation identity to actual evidence;
9. report `ACCEPTED` only when every internal requirement is closed and every required test and proof passed;
10. report `BLOCKED` or, only for an eligible tranche, `SOURCE_COMPLETE_EXTERNAL_PENDING` truthfully;
11. leave advancement or terminal-state persistence to the validator;
12. preserve all holds and avoid every prohibited action.

After implementation and before writing the final result, obtain the independently computed receipt context with:

```text
python3 docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/validate_activation_package.py \
  --repo "$PWD" \
  --receipt-context "$BWS_ACTIVE_TRANCHE"
```

The context contains the exact preimage and postimage generation IDs, independently computed changed-path records, parent receipt digest, required test metadata, proof lanes, and allowed terminal states. It contains no secret values.

The task may not edit the activation plan, launcher, validator, seed, immutable authority checksum set, canonical tranche packet, campaign map, or another tranche task file.
