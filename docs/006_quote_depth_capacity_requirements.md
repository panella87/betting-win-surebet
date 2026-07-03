# 006 — Quote, depth, and capacity requirements

A candidate needs retained quote/depth evidence from `betting-win`; fabricated fillability
is prohibited.

Required fields for future implementation:

- Quote source manifest hash.
- Quote timestamp and freshness policy.
- Outcome-specific price.
- Available capacity.
- Fee and cost inputs.
- Rounding and minimum-size constraints.

SURE-001 exposes only the type shape and blocker helpers. Future backtests or paper runs must use pinned `betting-win` quote/depth evidence rather than direct provider calls or a local canonical-history database.
