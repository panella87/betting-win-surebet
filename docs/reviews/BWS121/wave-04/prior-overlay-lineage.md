# Prior documentation-overlay lineage

## BWS-HISTORICAL-WAVE73-ECOSYSTEM-ALIGNMENT

- Classification: `PROCESS_REFERENCE_ONLY`
- Baseline: `betting-win-surebet114 (exact archive not supplied)` (`NOT_SUPPLIED`)
- Overlay: `betting-win-surebet114-betting-win-ecosystem-alignment-wave73-overlay.zip` (`NOT_SUPPLIED`)
- Result: Referenced by SOURCE_MANIFEST.json and Wave 73 documentation, but exact package and apply receipt are absent.
- Rollback: NOT_APPLICABLE_OR_NOT_SUPPLIED
- Current postimage match: `UNPROVEN_AS_AN_OVERLAY_PACKAGE`

## WRONG-REPOSITORY-BW-WAVE07-20260910

- Classification: `FAILED_BEFORE_APPLY`
- Baseline: `betting-win239(1).zip` (`baeb4bfc8f31723d224d57524b69b2cce6ade197bb7c018ae1e47dc6494fec31`)
- Overlay: `betting-win-cross-review-docs-overlay-r13-r17-r18-wave07-rebased-baeb4bfc-20260910.zip` (`633fadc571274fe724b1ad12f237e0fa45ecae858d7783ba0f1bf5833487f5c3`)
- Result: Repository identity resolved to betting-win@0.48.0, then preimage/postimage state was MIXED_OR_DRIFTED before apply.
- Rollback: ROLLBACK_RESTORE_FAILED=0; no write phase began.
- Current postimage match: `NOT_APPLICABLE_TO_BWS117`

## BWS-WAVE01-R01-R03-DOCS

- Classification: `LANDED_IN_CURRENT_REPOSITORY`
- Baseline: `betting-win-surebet117.zip` (`0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494`)
- Overlay: `betting-win-surebet-cross-review-docs-overlay-r01-r03-wave01-rebased-0d234e00-20260911.zip` (`3e7cac2faa605e946716ea2452198968e40438f0f256c9db5883a2b31863f481`)
- Result: All 40 exact overlay postimages are present in betting-win-surebet118.zip.
- Rollback: NOT_APPLICABLE_TO_CURRENT_POSTIMAGE_PROOF
- Current postimage match: `40_OF_40_EXACT_HASH_AND_MODE_MATCH`

## BWS-WAVE02-R04-R06-DOCS-V1

- Classification: `FAILED_DURING_VALIDATION_AND_ROLLED_BACK`
- Baseline: `betting-win-surebet118.zip` (`50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`)
- Overlay: `betting-win-surebet-cross-review-docs-overlay-r04-r06-wave02-rebased-50bbcb0b-20260912.zip` (`669f1c90dcfef99b543f6223107b60f71052b9b03339c8fe6a0222f2d991981b`)
- Result: All 40 files were applied in the transaction, then the custom Markdown inventory counted 577 dependency/untracked Markdown files and failed validation.
- Rollback: ROLLBACK_RESTORE_FAILED=0; BWS119 member bytes equal BWS118.
- Current postimage match: `NOT_ATTRIBUTED_TO_FAILED_V1; later corrected package landed`

## BWS-WAVE02-R04-R06-DOCS-V2

- Classification: `LANDED_IN_CURRENT_REPOSITORY`
- Baseline: `betting-win-surebet118.zip` (`50bbcb0b476904c8209cf7e1287b5ac4f9091fa07f6fd67523fc5430029417f7`)
- Overlay: `betting-win-surebet-cross-review-docs-overlay-r04-r06-wave02-rebased-50bbcb0b-20260912.zip` (`669f1c90dcfef99b543f6223107b60f71052b9b03339c8fe6a0222f2d991981b`)
- Result: BWS120 contains every exact overlay postimage and mode.
- Rollback: NOT_APPLICABLE_TO_CURRENT_POSTIMAGE_PROOF
- Current postimage match: `40_OF_40_EXACT_HASH_AND_MODE_MATCH`

## BWS-WAVE03-R07-R09-DOCS

- Classification: `LANDED_IN_CURRENT_REPOSITORY`
- Baseline: `betting-win-surebet120.zip` (`d4565c05ecfe63f5d5511f224a20ff20fb82bfc75b23203c94d7d3e98a8c21bb`)
- Overlay: `betting-win-surebet-cross-review-docs-overlay-r07-r09-wave03-rebased-d4565c05-20260912.zip` (`01d666ef2cfda592cc460d555eba1c911a991db142fe5d75cd6f707efd5796ea`)
- Result: All declared Wave 03 postimages and modes are present in BWS121.
- Rollback: NOT_APPLICABLE_TO_CURRENT_POSTIMAGE_PROOF
- Current postimage match: `40_OF_40_EXACT_HASH_AND_MODE_MATCH`
