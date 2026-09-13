# Bounded tranche task contract

Every task under `tasks/` is an exact one-tranche authority source. The active task must:

1. validate `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json` and prove it names the same tranche in `ADMITTED` state;
2. reverify every finding against exact current source before editing;
3. capture complete preimages, path modes, Git identity, source-manifest status, and retained holds;
4. implement only the smallest coherent correction boundary;
5. run every mapped focused, production-entrypoint, negative, adversarial, concurrency, crash, and environment proof under exact Node `v20.20.2` where Node applies;
6. write all required receipts and one canonical tranche result under the artifact root;
7. report `ACCEPTED` only when every internal requirement is closed and every required test or environment proof passed;
8. report `BLOCKED` or `SOURCE_COMPLETE_EXTERNAL_PENDING` truthfully and stop;
9. leave next-tranche admission to the deterministic launcher verifier;
10. preserve all holds and avoid every prohibited action.

The task may not edit the activation plan, launcher, validator, seed, canonical tranche packet, campaign map, or another tranche task file.
