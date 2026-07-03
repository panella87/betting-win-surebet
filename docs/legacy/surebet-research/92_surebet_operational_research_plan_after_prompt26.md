# Surebet operational research plan after Prompt 26

## Scope

The next operational surebet work must be tailored to betting-win rather than copying a generic top-10-bookmaker workflow.

Primary questions:

1. Which currently researched venues expose overlapping sports and settlement-equivalent markets?
2. Which sources expose executable depth, not only top prices?
3. Can equivalent markets be matched deterministically across SX, Azuro, Polymarket and any free/public reference source?
4. Are persistent private snapshots permitted?
5. What sequence risk remains when legs cannot settle atomically?

## Required operational matrices

- venue and jurisdiction availability;
- event and participant identity;
- regulation/overtime scope;
- handicap and quarter-line representation;
- retirement, postponement, abandonment and void rules;
- oracle/result source and dispute process;
- quote timestamp and source latency;
- executable size and minimum/maximum stake;
- fees, commission, gas, FX and token risk;
- settlement duration and capital lock;
- API/storage terms.

## Free-only constraint

The first experiment must use protocol-native/public data where possible. Paid enterprise feeds are not a prerequisite for schema design, but lack of reliable historical multi-venue odds may prevent a credible frequency or CLV study. That limitation must be reported rather than silently filled with scraped or unlicensed data.

## No evasion

The research may document account restrictions as execution friction. It must never propose multi-accounting, identity manipulation, KYC evasion, geoblocking evasion or deceptive behaviour.
