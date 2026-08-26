# 006 - Quote, depth, and capacity requirements

BWS uses immutable betting-win exports for historical/replay compatibility and may use only an accepted typed betting-win read-only API for current runtime quote/depth truth. It does not recollect provider books. The current cross-repository runtime API handoff is not yet accepted, so BWS-600 remains blocked.

Eligibility requires explicit freshness, provider generation, side, price, available size, fee/cost, minimum/maximum increment, and source lineage. The solver must respect executable depth and rounding at every leg.

Stale, missing, crossed, insufficient, generation-mismatched, or unbounded input blocks the candidate. Capacity and rejection evidence are retained under `surebet.*`.
