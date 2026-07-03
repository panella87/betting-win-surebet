# Stage 25: Prompt 26 surebet academic evidence audit

Status:

```text
surebet_theory_positive_execution_evidence_missing
surebet_auxiliary_mispricing_detector_research_only
```

## Audit scope

This stage preserves and audits:

- the 1,252-line Prompt 26 review;
- the raw OpenAlex JSON containing 911 cumulative unique records and 287 keyword-retained records;
- the complete 86-row query audit;
- the core bibliography and mathematical claims;
- the proposed sport, market, strategy, execution-risk and validation conclusions.

## What survives

1. Fixed-odds surebet mathematics is valid when outcomes are mutually exclusive, collectively exhaustive, rule-compatible and executable.
2. Historical quoted arbitrage opportunities exist, especially in European-football bookmaker/exchange and cross-bookmaker settings.
3. Execution friction is the principal unresolved issue: limits, rejections, latency, incomplete fills, rule asymmetry and account management can destroy the guarantee.
4. The distinction between theoretical, quoted, executable and settled arbitrage is mandatory.
5. A future paper-only surebet detector is useful as a price-quality, market-identity and mispricing research layer.
6. Surebet does not qualify as the core betting-win strategy from this evidence.

## Methodology corrections

The generated narrative reports 80 queries, but the raw audit contains 86: 63 topical searches, 15 anchor searches and 8 citation expansions. The raw_returned total is 1,471 query-result appearances, not merely an unspecified ~1,400.

The eight citation expansions are not valid forward expansions from arbitrage anchors. They target unrelated medical and generic-finance works. Their results cannot be treated as increased surebet literature coverage.

The 287 retained records passed a broad automated filter that accepts generic `gambl` and `prediction market` matches. The reviewed catalogue therefore labels them as retained candidates, not 287 manually screened surebet papers. A deterministic audit classifies only a small subset as direct surebet/arbitrage candidates; most are supporting, tangential or context-only.

## Bibliographic corrections

- `Inter-market Arbitrage in Betting` is the 2013 Economica article, although the final version was received in 2012.
- The 2009/working-paper versions are lineage versions, not independent replications.
- The Fink Tank article is by Babatunde Buraimo, David Peel and Rob Simmons and is value-betting evidence, not the Grant arbitrage paper.
- Moskowitz (2021) is supporting limits-to-arbitrage/anomaly evidence, not a surebet execution study.
- Kaunitz et al. (2017) is a non-peer-reviewed value/mispricing strategy with account-restriction evidence, not pure surebet evidence.

## Mathematics correction

For a bookmaker back bet with stake `B` at decimal odds `O_back`, hedged by laying the same selection at exchange lay odds `O_lay`, with commission `c` on positive lay winnings, the equal-profit lay stake is:

```text
L = B * O_back / (O_lay - c)
```

The equalized profit is:

```text
profit = B * (O_back * (1 - c) / (O_lay - c) - 1)
```

The reciprocal-sum condition used for multiple back odds must not be applied directly to a lay quote. Exact exchange commission rules and aggregate market P&L can change the formula.

## Architecture decision

The surebet branch is retained only as an auxiliary research module with these responsibilities:

- identify cross-source price disagreement;
- stress-test event and market normalization;
- test rule equivalence and settlement compatibility;
- estimate theoretical and executable margin separately;
- preserve every quoted, accepted, rejected, partially filled, voided and settled state in paper simulation;
- provide market-quality signals to later strategy synthesis.

It may not authorize live execution, account-control evasion, multi-accounting, public signals or profitability claims.

## Sequencing

Prompt 27 is already running and must finish before a new broad research prompt is launched. After Prompt 27 is integrated, use Pro Extended Thinking to combine:

- Prompt 26 surebet evidence;
- Prompt 27 cross-sport strategy evidence;
- SX, Azuro and Polymarket source-of-truth gates;
- free-data and retention constraints.

Only that synthesis should define the exact Deep Research venue/rule/API audit.
