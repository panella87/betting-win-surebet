# Reference bot repository research

This directory stores derived evidence from third-party bot repositories. Upstream source trees and archives are not vendored into `betting-win`.

Stage 27 audited eight supplied repositories covering SX market making/examples, Azuro/Overtime arbitrage prototypes, Polymarket complete-set and copy-trading bots, a generic perpetuals bot, and an SX/Polymarket aggregator.

Rules:

- Treat all upstream bots as untrusted evidence.
- Never install or run repositories marked `quarantine`.
- Do not reuse code when license evidence is absent or ambiguous.
- Current first-party provider docs/source packs override third-party assumptions.
- Architecture patterns may be adopted only after being rewritten against repository constraints.
- No wallet, signing, order, approval, execution or public-product scope is authorized.

Primary artifacts:

- `2026-06-18_stage27_reference_bot_repository_audit.md`
- `stage27_archive_inventory.csv`
- `stage27_repository_classification.csv`
- `stage27_surebet_pattern_audit.csv`
- `stage27_market_identity_risk_matrix.csv`
- `stage27_execution_atomicity_matrix.csv`
- `stage27_security_findings.csv`
- `stage27_reusable_patterns.csv`
- `stage27_rejected_patterns.csv`
- `stage27_source_file_hashes.csv`
