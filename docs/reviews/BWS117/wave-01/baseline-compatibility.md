# BWS117 Wave 01 baseline compatibility

```text
CURRENT_ARCHIVE=betting-win-surebet117.zip
CURRENT_ARCHIVE_SHA256=0d234e00d015dcab0989b47372ded516bddee9705d9021a0694916dc91a9d494
CURRENT_REGULAR_FILES=618
REVIEW_SOURCE_ARCHIVE=betting-win-surebet116.zip
REVIEW_SOURCE_ARCHIVE_SHA256=6cc5be4e7f3a637d7c0ed9485f246ade4975b5a8e60d3895943e0471afc29376
MEMBER_PATH_SIZE_SHA256_MODE_EQUAL=yes
REPORT_CLASSIFICATION=COMPATIBLE_AND_UNAFFECTED_BY_DELTA
```

BWS116 and BWS117 have different ZIP-container SHA-256 values but identical repository member paths, bytes, sizes, and modes. The reviews are therefore source-compatible without converting the BWS116 archive hash into the BWS117 archive hash.

All 155 source references carried by the three findings files resolve to BWS117 members with exact full-file SHA-256 matches. All three 618-row coverage TSVs reconcile without a missing, extra, size-mismatched, or hash-mismatched path.

Node 20.20.2 was unavailable in the review environments. Node 22 observations remain supplementary. PostgreSQL execution was unavailable for R03. These environment limits do not change source compatibility, but they remain implementation-acceptance gates.

`SOURCE_MANIFEST.json` is not current byte authority. Its 617-path non-self set is complete, but seven stored size/hash values are stale. The documentation overlay does not modify that non-documentation manifest; R11 owns the correction.
