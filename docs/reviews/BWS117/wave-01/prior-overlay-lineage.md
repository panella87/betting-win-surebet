# BWS117 Wave 01 prior overlay lineage

```text
PRIOR_OVERLAY_ATTEMPT
ATTEMPT_ID: BWS-HISTORICAL-WAVE73-ECOSYSTEM-ALIGNMENT
BASELINE_ARCHIVE: betting-win-surebet114 (exact archive not supplied)
BASELINE_SHA256: NOT_SUPPLIED
OVERLAY_FILENAME: betting-win-surebet114-betting-win-ecosystem-alignment-wave73-overlay.zip
OVERLAY_SHA256: NOT_SUPPLIED
APPLY_SCRIPT_FILENAME: NOT_SUPPLIED
APPLY_SCRIPT_SHA256: NOT_SUPPLIED
DECLARED_PATH_SET: NOT_SUPPLIED
OBSERVED_RESULT: Referenced by SOURCE_MANIFEST.json and Wave 73 documentation, but exact package and apply receipt are absent.
ROLLBACK_RESULT: NOT_APPLICABLE_OR_NOT_SUPPLIED
CURRENT_POSTIMAGE_MATCH: UNPROVEN_AS_AN_OVERLAY_PACKAGE
CLASSIFICATION: PROCESS_REFERENCE_ONLY
SUPERSEDED_BY: Current BWS117 archive as file authority
EVIDENCE: ["SOURCE_MANIFEST.json overlay field", "docs/000_documentation_index.md documentation_curation_wave=73"]
END_PRIOR_OVERLAY_ATTEMPT
```

```text
PRIOR_OVERLAY_ATTEMPT
ATTEMPT_ID: WRONG-REPOSITORY-BW-WAVE07-20260910
BASELINE_ARCHIVE: betting-win239(1).zip
BASELINE_SHA256: baeb4bfc8f31723d224d57524b69b2cce6ade197bb7c018ae1e47dc6494fec31
OVERLAY_FILENAME: betting-win-cross-review-docs-overlay-r13-r17-r18-wave07-rebased-baeb4bfc-20260910.zip
OVERLAY_SHA256: 633fadc571274fe724b1ad12f237e0fa45ecae858d7783ba0f1bf5833487f5c3
APPLY_SCRIPT_FILENAME: apply-betting-win-cross-review-docs-overlay-r13-r17-r18-wave07-rebased-baeb4bfc-20260910.sh
APPLY_SCRIPT_SHA256: 32fdf8bf4d6d2dc4e2c3de14c5a60d8a65c927d91e9fd9ab916529fa21b0c75b
DECLARED_PATH_SET: 38 betting-win documentation paths under docs/reviews/BW236/wave-07 plus indexes
OBSERVED_RESULT: Repository identity resolved to betting-win@0.48.0, then preimage/postimage state was MIXED_OR_DRIFTED before apply.
ROLLBACK_RESULT: ROLLBACK_RESTORE_FAILED=0; no write phase began.
CURRENT_POSTIMAGE_MATCH: NOT_APPLICABLE_TO_BWS117
CLASSIFICATION: FAILED_BEFORE_APPLY
SUPERSEDED_BY: This BWS-only Wave 01 consolidation
EVIDENCE: ["operator terminal output in conversation", "actual wrong-repository overlay and apply-script hashes"]
END_PRIOR_OVERLAY_ATTEMPT
```

No prior BWS independent-review documentation overlay is proven as landed in BWS117. The earlier BW Wave 07 installer targeted the separate `betting-win` repository and failed before apply; it has no BWS postimage or BWS finding authority.
