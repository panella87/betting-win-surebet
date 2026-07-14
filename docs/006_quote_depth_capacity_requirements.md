# 006 - Quote, depth, and capacity requirements

BWS consumes quote/depth records and provenance from betting-win exports or read-only API surfaces. It does not recollect provider books.

Eligibility requires explicit freshness, provider generation, side, price, available size, fee/cost, minimum/maximum increment, and source lineage. The solver must respect executable depth and rounding at every leg.

Stale, missing, crossed, insufficient, generation-mismatched, or unbounded input blocks the candidate. Capacity and rejection evidence are retained under `surebet.*`.
