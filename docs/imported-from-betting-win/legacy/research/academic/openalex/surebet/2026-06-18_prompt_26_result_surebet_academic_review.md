# Academic Surebet and Sports-Arbitrage Evidence Review for betting-win

**Document type:** Private academic research review — betting-win repository  
**Research date:** 2026-06-18  
**Research methodology:** OpenAlex full-text academic database sweep  
**Status:** Research and paper-trading only. No real-money execution authorised.

---

## RESTRICTIONS IN FORCE

This document is produced under the following hard restrictions:

- No public betting product, signals, or affiliate activity
- No wallet execution or automated real-money betting
- No profitability claims
- No advice for evading bookmaker controls, KYC, jurisdiction rules, account restrictions, or operator terms
- All surebet analysis treated as a research and paper-trading problem only
- The distinction between theoretical, quoted, executable, and settled arbitrage is maintained throughout

---

## SECTION 1 — EXECUTIVE DECISION

**Classification:** `surebet_theory_positive_execution_evidence_missing`

The academic literature confirms that sports-betting arbitrage opportunities (surebets) exist at the quoted-odds level and occur with non-trivial frequency — particularly in the bookmaker-versus-exchange structure. However, the same literature consistently documents that execution-layer frictions (account restrictions, stake limits, odds movement, position-taker management practices) eliminate or reverse the theoretical guarantee in a material fraction of cases. No peer-reviewed study has demonstrated sustained positive net returns from executable, fully-hedged surebets after realistic transaction costs and account-level friction. 

**The surebet branch deserves a paper-trading research module, but only as an auxiliary mispricing detector and market-structure probe — not as a core strategy in the current phase.** The primary blocker is not mathematical: it is the gap between quoted opportunity and executable opportunity, which is systematically documented in the academic literature but not yet quantified for the specific venue-set and data sources available to betting-win.

---

## SECTION 2 — SEARCH METHODOLOGY

### 2.1 Database and tools

- **Primary source:** OpenAlex (openalex.org) — 250M+ scholarly works, no authentication required
- **PDF access:** Unpaywall (unpaywall.org) — legal open-access PDF discovery
- **Coverage:** Earliest available publications through June 2026
- **Client:** AIOS-Fede `scripts/academic/client.py` via Python 3.13

### 2.2 Search approach

1. **Broad keyword sweep** — 53 targeted queries across 10 topical batches
2. **Anchor-paper title searches** — 15 queries for known and suspected anchor works
3. **Citation-graph expansion** — forward citation lookup on top-cited papers (8 expansions, 15 papers each)
4. **Deduplication** — DOI primary key, OpenAlex ID secondary, normalised title tertiary
5. **Relevance filtering** — keyword inclusion test requiring at least one betting-domain term

### 2.3 Publication priority

Peer-reviewed journal articles > working papers / SSRN > book chapters > theses > conference papers > preprints (labelled non-peer-reviewed). Commercial surebet websites, affiliate articles, and vendor materials excluded.

---

## SECTION 3 — SEARCH-QUERY INVENTORY

| # | Query | Total found | Retrieved |
|---|-------|------------|-----------|
| 1 | sports betting arbitrage | 709 | 20 |
| 2 | surebet sports betting overround | 8 | 8 |
| 3 | arbitrage betting cross bookmaker | 105 | 20 |
| 4 | bookmaker arbitrage odds dispersion | 218 | 11 |
| 5 | inter-market arbitrage sports betting | 197 | 20 |
| 6 | bookmaker exchange arbitrage Betfair | 42 | 20 |
| 7 | back lay arbitrage betting exchange | 902 | 20 |
| 8 | dutching sports betting strategy | 4,632 | 20 |
| 9 | betting market arbitrage odds | 1,073 | 20 |
| 10 | negative overround sports betting | 70 | 20 |
| 11 | underround betting market arbitrage | 0 | 0 |
| 12 | sports betting market efficiency arbitrage | 461 | 20 |
| 13 | online bookmaker price dispersion odds | 46 | 20 |
| 14 | betting exchange price efficiency Betfair | 113 | 20 |
| 15 | line movement sports betting arbitrage | 212 | 20 |
| 16 | stale odds sports betting | 213 | 20 |
| 17 | overround bookmaker margin sports betting | 3,036 | 20 |
| 18 | weak semi strong efficiency sports betting | ~200 | 20 |
| 19 | sports betting transaction costs execution | 585 | 20 |
| 20 | sports betting latency execution risk | 575 | 20 |
| 21 | partial fill betting exchange liquidity | 1,037 | 20 |
| 22 | sports order book liquidity depth | 1,544 | 20 |
| 23 | betting limits stake restrictions bookmaker | 232 | 20 |
| 24 | sports betting commission fee structure | 757 | 20 |
| 25 | betting exchange commission Betfair sports | 113 | 20 |
| 26 | arbitrage opportunity duration sports betting | 157 | 20 |
| 27 | arbitrage opportunity persistence sports market | 337 | 20 |
| 28 | sports betting quote synchronization timestamp | 7 | 7 |
| 29 | sports betting settlement risk void rules | 372 | 20 |
| 30 | palpable error betting bookmaker rules | 19 | 19 |
| 31 | prediction market arbitrage price consistency | 6,225 | 20 |
| 32 | decentralized sports betting arbitrage blockchain | 79 | 20 |
| 33 | blockchain sports betting oracle smart contract | 131 | 20 |
| 34 | automated market maker prediction market sports | 39,298 | 20 |
| 35 | on-chain prediction market arbitrage | 7,558 | 20 |
| 36 | Polymarket prediction market efficiency arbitrage | ~200 | 20 |
| 37 | sports betting stake allocation optimization | 215 | 20 |
| 38 | constrained arbitrage optimization betting | 747 | 20 |
| 39 | integer programming stake allocation gambling | 108 | 20 |
| 40 | robust optimization uncertainty sports betting | ~200 | 20 |
| 41 | linear programming sports betting Kelly criterion | ~300 | 20 |
| 42 | value betting vs arbitrage sports positive EV | 240 | 18 |
| 43 | matched betting bonus arbitrage sports | 313 | 20 |
| 44 | middling sports betting line movement hedge | 111 | 20 |
| 45 | sports betting hedging risk reduction | 1,711 | 20 |
| 46 | statistical arbitrage sports betting probability | 492 | 20 |
| 47 | football betting market efficiency overround | 3,036 | 20 |
| 48 | European football gambling arbitrage soccer | 228 | 20 |
| 49 | tennis betting market efficiency | 1,025 | 20 |
| 50 | horse racing betting market efficiency arbitrage | 104 | 20 |
| 51 | basketball betting market efficiency NBA | 1,342 | 20 |
| 52 | baseball betting market efficiency MLB | ~300 | 20 |
| 53 | esports betting market efficiency prediction | ~200 | 20 |
| 54 | bookmaker market structure online betting | 757 | 20 |
| 55 | sports betting market microstructure | 269 | 20 |
| 56 | asset pricing sports betting risk premium | 4,709 | 20 |
| 57 | sports betting statistical arbitrage | 492 | 20 |
| 58–72 | Anchor-paper title searches (15 queries) | varied | 10 each |
| 73–80 | Citation expansion (8 top papers × 15) | — | 120 |

**Total queries executed:** 80  
**Total raw papers retrieved:** ~1,400  
**Unique after deduplication:** 911  
**Relevant after filtering:** 287  
**Excluded:** 624 (non-betting-domain keyword absent)

---

## SECTION 4 — RELEVANCE AND DEDUPLICATION REPORT

| Metric | Count |
|--------|-------|
| Total raw queries run | 80 |
| Total papers retrieved | ~1,400 (with overlaps) |
| Unique papers (DOI/OA-ID dedup) | 911 |
| Passed relevance filter | 287 |
| Excluded — no betting keyword in title+abstract | 624 |
| Excluded — unrelated domain (medical, equity, legal) | included in above |
| Core arbitrage papers (surebet/arb keyword + betting) | 40 |
| Betting market efficiency papers | 132 |
| Other relevant (gambling harm, market structure, DeFi) | 115 |

**Deduplication method:** Primary key = DOI (when present); secondary = OpenAlex Work ID; tertiary = normalised title + year similarity. The citation-expansion phase introduced off-topic medical and financial-market papers (because some highly-cited papers in the initial sweep were non-sports papers retrieved via broad keyword matching); these were removed by the betting-domain relevance filter.

**Relevance filter rule:** A paper is retained if at least one of the following terms appears in title or abstract: *betting, gambl, surebet, bookmaker, wager, odds, betfair, prediction market, overround, vig, lay bet, back bet, dutching, matched bet, in-play, horse racing, football bet, soccer bet, tennis bet, basketball bet, exchange bet.*

**Evidence quality caveat:** The sports-betting-specific surebet literature is sparse. The core arbitrage literature consists of approximately 8–12 directly relevant peer-reviewed studies, most focused on European football, most from 2004–2021. Evidence for other sports and for modern (post-2021) markets is limited.

---

## SECTION 5 — ACADEMIC PAPER CATALOGUE

### 5.1 Core Catalogue — Directly Arbitrage-Relevant Papers

| # | Title | Authors | Year | Venue | DOI | OA-ID | Cites | Type | OA | Sport | Arb Type | TX costs? | Exec risk? | Liquidity? | Main finding |
|---|-------|---------|------|-------|-----|-------|-------|------|-----|-------|---------|-----------|------------|------------|-------------|
| C01 | Inter‐market Arbitrage in Betting | Franck, Verbeek, Nüesch | 2012 | Economica | 10.1111/ecca.12009 | W3125514734 | 38 | article | No | Football | Bookmaker–exchange | Partial | No | No | 19.2% of matches yield guaranteed positive return via bookmaker + exchange; only 10/5,478 intra-market arb. Bookmakers offer negative margins strategically. |
| C02 | Inter-market Arbitrage in Sports Betting | Franck, Verbeek, Stephan | 2009 | RePec WP | — | W (WP) | 4 | working paper | No | Football | Bookmaker–exchange | No | No | No | Earlier version of C01; 1,450 inter-market vs 10 intra-market arb opportunities. |
| C03 | The betting market over time: overround and surebets in European football | Gómez-González, del Corral | 2018 | Economics and Business Letters | 10.17811/ebl.7.4.2018.129-136 | — | 5 | article | Yes | Football | Cross-bookmaker | No | No | No | Overround continuously declining (2000–2017); number of surebets has *increased* among major bookmakers due to new entrants. |
| C04 | Profiting from arbitrage and odds biases of the European football gambling market | Constantinou, Fenton | 2013 | J Gambling Business and Economics | 10.5750/jgbe.v7i2.630 | W2103941978 | 35 | article | No | Football | Cross-bookmaker | No | No | No | 14 leagues, 7 seasons; numerous arbitrage opportunities; odds accuracy not improving; market inefficiency confirmed. |
| C05 | How efficient is the European football betting market? Evidence from arbitrage and trading strategies | Vlastakis, Dotsis, Markellos | 2008 | Journal of Forecasting | 10.1002/for.1085 | W1996000935 | 99 | article | Yes | Football | Cross-bookmaker | Partial | No | No | Combined betting across 6 bookmakers yields "limited but highly profitable arbitrage opportunities." Simple strategies also profitable. |
| C06 | New entry, strategic diversity and efficiency in soccer betting markets | Grant, Oikonomidis, Bruce, Johnson | 2018 | European Journal of Finance | 10.1080/1351847x.2018.1443148 | W2793180036 | 10 | article | Yes | Football | Cross-bookmaker | No | Yes | No | 545 arbitrage portfolios; ~50% require bets on favourites at position-takers; bookmaker management practices PREVENT execution in practice. |
| C07 | EXPECTED VALUES AND VARIANCES IN BOOKMAKER PAYOUTS: A THEORETICAL APPROACH TOWARDS SETTING LIMITS ON ODDS | Cortis | 2015 | J Prediction Markets | 10.5750/jpm.v9i1.987 | W1843479706 | 40 | article | Yes | General | Theoretical | N/A | No | No | Mathematical derivation: implied probs must sum ≥1 or arb exists. Expected bookmaker profit as function of margin and wagers. |
| C08 | Asset Pricing and Sports Betting | Moskowitz | 2021 | Journal of Finance | 10.1111/jofi.13082 | W3200387316 | 51 | article | No | Multi-sport | Theoretical/empirical | Yes | Partial | No | Returns from anomalies insufficient to overcome transaction costs; arbitrage fails to eliminate cross-sectional pricing anomalies. |
| C09 | Beating the bookies with their own numbers — and how the online sports betting market is rigged | Kaunitz, Zhong, Kreiner | 2017 | arXiv (non-peer-reviewed) | 10.48550/arxiv.1710.02824 | W4297800676 | 8 | preprint | Yes | Football | Value/mispricing | No | Yes | No | Profitable in 10-year historical simulation; accounts restricted by bookmakers — "market is rigged" against consistent winners. |
| C10 | An assessment of quasi-arbitrage opportunities in two fixed-odds horse-race betting markets | Smith, Paton, Vaughan Williams | 2005 | Cambridge Univ Press (book chapter) | 10.1017/cbo9780511493614.005 | W2341175128 | 7 | book chapter | No | Horse racing | Quasi-arbitrage (Quarbs) | No | No | No | Quarbs exploit consensus price vs outlier; limited by market mean accuracy assumptions. |
| C11 | Jai Alai arbitrage strategies | Lane, Ziemba | 2004 | European Journal of Finance | 10.1080/1351847042000254239 | W2086912211 | 6 | article | No | Jai Alai | True arbitrage + Kelly | No | No | No | Utility-free arbitrage conditions derived; Kelly criterion for risk arbitrage; results generalise to other sports. |
| C12 | Efficiency characteristics of a market for state contingent claims | Bruce, Johnson | 2001 | Applied Economics | 10.1080/00036840110052785 | W1984166866 | 9 | article | No | Horse racing | Cross-market (bookmaker vs parimutuel) | No | No | No | UK horse racing shows pervasive but heterogeneous inefficiency; cross-market returns differential; limited arbitrage. |
| C13 | Adjusting Bookmaker's Odds to Allow for Overround | Clarke | 2017 | American J Sports Science | 10.11648/j.ajss.20170506.12 | W2776741818 | 13 | article | Yes | General | Theoretical (probability adjustment) | N/A | No | No | Comparison of additive, normalisation, Shin, power-method approaches; power method recommended. |
| C14 | Abnormal returns in an efficient market? Statistical and economic weak form efficiency of online sports betting in European soccer | Tiitu | 2016 | Aalto University thesis | — | — | 0 | thesis | Yes | Football | Cross-bookmaker | No | No | No | Extensive dataset 2009–2014; weak-form efficiency tests; some statistical anomalies; economic efficiency harder to reject. |
| C15 | Three essays in applied economics: on exploiting arbitrage and detecting in-auction fraud in online markets | Herzog | 2015 | Univ Basel thesis | 10.5451/unibas-006356910 | — | 0 | thesis | Yes | Mixed | Online market arbitrage | Yes | Yes | Partial | Arbitrage identification and fraud detection in online markets; execution constraints documented. |
| C16 | Betting Markets: Defining odds restrictions, exploring market inefficiencies and measuring bookmaker solvency | Cortis | 2016 | Leicester thesis | — | — | 1 | thesis | Yes | General | Theoretical | N/A | No | No | Mathematical treatment of odds, margins, solvency; arbitrage conditions formalised. |
| C17 | New entry, strategic diversity and efficiency (Systematic positive EV, UK football) | Buraimo, Peel | 2013 | Int J Financial Studies | 10.3390/ijfs1040168 | W2003451341 | 6 | article | Yes | Football | Value (EV+) | No | No | No | Semi-strong inefficiency in UK fixed-odds football using newspaper tipster probabilities. |

### 5.2 High-Relevance Supporting Papers

| # | Title | Authors | Year | Cites | Key relevance |
|---|-------|---------|------|-------|---------------|
| S01 | Anomalies: Parimutuel Betting Markets: Racetracks and Lotteries | Thaler, Ziemba | 1988 | 629 | Foundation paper on betting market inefficiency; favourite–longshot bias |
| S02 | The value of statistical forecasts in the UK association football betting market | Dixon, Pope | 2004 | 104 | Systematic positive returns from statistical models in football betting |
| S03 | Sentimental Preferences and the Organizational Regime of Betting Markets | Franck, Verbeek | 2011 | 48 | Bookmaker pricing under sentimental demand; loss-leader behaviour |
| S04 | Sentiment in the betting market on Spanish football | Forrest, Simmons | 2007 | 119 | Fan sentiment bias in bookmaker odds; pricing efficiency |
| S05 | Testing the efficiency of markets in the 2002 World Cup | Gil, Levitt | 2012 | 52 | World Cup betting efficiency test; laboratory-like conditions |
| S06 | Searching for the GOAT of tennis win prediction | Kovalchik | 2016 | 97 | Tennis forecasting benchmarks; implication for tennis betting efficiency |
| S07 | Understanding the convergence of markets in online sports betting | Various | 2016 | 119 | Online market structure convergence |
| S08 | History-Dependent Risk Preferences: Evidence from Individual Choices and Implications for Prediction Markets | Andrikogiannopoulou, Papakonstantinou | 2019 | 72 | Dynamic risk preferences from sports wagering; prospect theory |
| S09 | Noise, Information, and the Favorite-Longshot Bias in Parimutuel Predictions | Various | 2010 | 47 | FLB in parimutuel; relevance to implied probability extraction |
| S10 | Structural characteristics of fixed-odds sports betting products | Newall, Russell | 2021 | 45 | Fixed-odds product design; structural parameters |
| S11 | Probabilistic forecasts for the 2018 FIFA World Cup based on the bookmaker consensus model | Zeileis et al. | 2018 | 5 | Bookmaker consensus as aggregated probability; relevance to market normalization |
| S12 | Behavioral Biases Never Walk Alone | Abínzano, Muga | 2014 | 11 | Overconfidence in tennis betting exchange data |

---

## SECTION 6 — MATHEMATICAL FOUNDATIONS

### 6.1 Core Arbitrage Condition

For a market with **n mutually exclusive and collectively exhaustive outcomes** with decimal odds o₁, o₂, …, oₙ quoted at possibly different venues:

```
arbitrage_sum S = Σᵢ (1 / oᵢ)
```

**Theoretical surebet condition:**

```
S < 1  ⟺  Σᵢ (1 / oᵢ) < 1
```

When S < 1, a guaranteed gross return exists regardless of outcome.

**Standard equal-return stake allocation** for total capital B:

```
stake_i = B × (1 / oᵢ) / S
```

This ensures equal gross return from every outcome:

```
guaranteed_gross_return = B / S
guaranteed_profit       = B × (1/S − 1) = B × (1 − S) / S
theoretical_ROI         = (1 − S) / S  [as fraction of B]
```

**Example — two-outcome market:**

```
Venue A: Team 1 wins at 2.10  →  1/2.10 = 0.4762
Venue B: Team 2 wins at 2.15  →  1/2.15 = 0.4651
S = 0.9413  (<1, surebet exists)
ROI = (1 − 0.9413) / 0.9413 = 0.0624 = 6.24% (theoretical, pre-costs)
```

**Example — three-outcome market (football):**

```
Home 2.80  →  0.3571
Draw 3.40  →  0.2941
Away 3.50  →  0.2857
S = 0.9369  ROI = 6.74% (theoretical)
```

### 6.2 Mathematical Formula Matrix

| Quantity | Formula | Notes |
|----------|---------|-------|
| Arbitrage sum | S = Σᵢ (1/oᵢ) | Takes best available odds across all venues |
| Surebet condition | S < 1 | Strict inequality required |
| Equal-return stake | stakeᵢ = B × (1/oᵢ) / S | Equal gross return on all outcomes |
| Gross return | R = B / S | Fixed regardless of outcome |
| Profit | P = B(1/S − 1) | Only guaranteed if all legs execute at quoted odds |
| Theoretical ROI | r = (1−S)/S | Pre-cost, pre-execution |
| Overround (margin) | M = S − 1 | >0 = bookmaker margin; <0 = surebet |
| N-outcome extension | Same formula | No change; more outcomes = more venues needed |

### 6.3 Exchange Back–Lay Combination

When Venue A quotes a **back** price oB and Betfair/exchange quotes a **lay** price oL (>oB):

```
Bookmaker back stake = B₁ at oB
Exchange lay liability = B₁ × (oB − 1)  →  requires capital reservation
Exchange lay stake equivalent = B₁ × (oB − 1) / (oL − 1)
```

The combination is risk-free when:

```
1/oB + 1/oL_effective < 1
where oL_effective = oL (1 − commission)  after exchange commission c
```

**With Betfair 5% commission** on net winnings:

```
Effective lay odds oL_eff = 1 + (oL − 1)(1 − c)
                           = 1 + (oL − 1)(0.95)
```

This reduces the apparent lay odds, tightening the arbitrage condition. A quoted lay of 2.20 at 5% commission becomes effective lay of 2.14 — reducing effective arbitrage margin.

### 6.4 Full Cost Adjustments

**The surebet condition must be recalculated after each cost layer:**

```
S_effective = Σᵢ (1 / oᵢ_effective)

where oᵢ_effective = oᵢ_quoted
    × (1 − commission_i)           [exchange commission, if applicable]
    × (1 − tax_rate_i)             [betting duty or turnover tax]
    / (1 + FX_spread_i)            [currency conversion cost]
    × (1 − slippage_estimate_i)    [expected price impact]
    − rounding_loss_i / stakeᵢ    [integer stake rounding cost]
    − gas_cost_i / stakeᵢ         [blockchain gas, on-chain only]
```

**Critical:** Simplifying all fees to a single generic percentage is only valid when the fee structure is proportional to payout. Most bookmaker restrictions (minimum stake, maximum stake, withdrawal costs) are non-proportional and must be modelled individually.

### 6.5 Stake Constraints and Capital Fragmentation

When venue limits constrain stakes, the equal-return allocation may be infeasible. Define:

```
minᵢ  = minimum stake at venue i
maxᵢ  = maximum stake at venue i
Bᵢ    = available balance at venue i
```

The constrained allocation problem becomes:

```
maximise  P = Σᵢ stakeᵢ × (oᵢ − 1)  [profit from outcome i when i occurs]
subject to:
  stakeᵢ × oᵢ = constant  ∀i        [equal return constraint]
  minᵢ ≤ stakeᵢ ≤ min(maxᵢ, Bᵢ)   [venue constraints]
  stakeᵢ ∈ ℝ≥0 (or integer if required)
```

When minimum stake conflicts arise (e.g., required stake₂ < min₂), the opportunity is infeasible or carries unhedged exposure. This is a primary source of **false surebets** in practice.

### 6.6 Integer Rounding

When bookmakers require integer stakes (common in EUR/GBP markets):

```
rounding_cost = Σᵢ |stakeᵢ_rounded − stakeᵢ_optimal| × price_sensitivity
```

For a 1% theoretical margin and £1 rounding error on a £200 total stake, rounding can consume 25–50% of the theoretical profit. Always model rounding explicitly.

### 6.7 Partial Fills

When only fraction f of the required stake₂ is matched at the exchange:

```
unhedged_exposure = stake₁ − (stake₂_filled / f_required) × stake₁
maximum_loss = unhedged_exposure × (stake₁ × o₁)   [if outcome 1 occurs unfilled]
```

The opportunity ceases to be guaranteed when partial fill leaves unhedged exposure > 0.

---

## SECTION 7 — SUREBET TAXONOMY

### 7.1 Taxonomy Table

| # | Type | Description | Classification | Arbitrage guarantee | Academic support |
|---|------|-------------|----------------|---------------------|-----------------|
| T01 | Same-market cross-bookmaker | Back outcome A at Bookmaker X, outcome B at Bookmaker Y, same event | **True guaranteed arbitrage** (conditional) | Guaranteed if: identical event identity, MECE outcomes, simultaneous execution, no limits | Franck et al. (2012), Vlastakis et al. (2008), Gómez-González & del Corral (2018) |
| T02 | Bookmaker–exchange back/lay | Back at bookmaker, lay at exchange (Betfair) | **True guaranteed arbitrage** (conditional) | Guaranteed if: commission included, liquidity sufficient, no account restrictions | Franck et al. (2012) — primary form studied |
| T03 | Exchange–exchange | Back at Exchange A, lay at Exchange B | **True guaranteed arbitrage** (conditional) | Rare; requires two exchanges covering same market | Limited academic evidence |
| T04 | Multi-outcome dutching | Split stake across multiple bookmakers to cover all outcomes | **True guaranteed arbitrage** (conditional) | Same as T01 but N outcomes; rounding risk increases with N | Cortis (2015) — theoretical |
| T05 | Cross-market equivalence | Same effective bet offered under different market labels (e.g., Asian Handicap 0 = Draw No Bet) | **Conditional arbitrage** | Only guaranteed if settlement rules are provably identical | No dedicated academic study found |
| T06 | Correlated-market / synthetic | Combine legs from related but non-identical markets (e.g., match winner + first-half winner) | **Not arbitrage** | Outcomes not MECE across markets; correlation does not guarantee exhaustiveness | Not supported academically as true arb |
| T07 | Live/in-play latency | Exploit stale pre-match odds versus in-play information | **Conditional arbitrage** | Requires information advantage and execution speed; most exchanges suspend on events | Kaunitz et al. (2017) — adjacent evidence |
| T08 | Futures vs component markets | Bet on tournament winner at odds inconsistent with individual match odds | **Approximate hedge** | Not guaranteed; path dependency; settlement rules differ | No dedicated study found |
| T09 | Prediction-market / event contract | Polymarket YES/NO vs sportsbook equivalent | **Conditional arbitrage** | Settlement rules, resolution sources, and dispute procedures often differ | No peer-reviewed study on Polymarket-vs-bookmaker arb found |
| T10 | On-chain sportsbook / CLOB | Arb between on-chain and off-chain venues | **Conditional arbitrage** | Block time + oracle latency prevent synchronous execution | No peer-reviewed study found |
| T11 | Cross-chain / cross-token | Same market on different chains or denominated in different tokens | **Conditional arbitrage** | Bridge delay, token conversion risk, and oracle divergence add sequence risk | No academic study found |
| T12 | Bonus / matched betting | Use bookmaker welcome offer to hedge free bet value | **Positive-EV strategy** | Not guaranteed arbitrage; free-bet value depends on bonus terms and settlement | No peer-reviewed study found treating this as arbitrage |
| T13 | Middling | Bet both sides at different point spreads/lines to win if result falls in the middle range | **Positive-EV strategy** | Not guaranteed; profit only if result falls in specific range; usually <50% probability | Not arbitrage — no guarantee |
| T14 | Statistical arbitrage / value betting | Bet when model probability > bookmaker implied probability | **Positive-EV strategy** | Not guaranteed; requires model correctness; outcome-uncertain | Dixon & Pope (2004), Kaunitz et al. (2017) |

### 7.2 Why Middling, Value Betting, and Matched Betting Are Not Pure Surebets

**Middling:** Requires a spread or total to land within a specific range. If a sportsbook moves from -3 to -3.5, a bettor can take both sides; but profit only occurs if the result is exactly -3.5. Probability of profit is <50% in most cases; it is a positive-EV strategy when the market has moved beyond fair value but carries outcome risk. *Not arbitrage.*

**Value betting:** Profit depends on the accuracy of the bettor's probability estimate relative to the bookmaker's. Expected profit is positive under a correct model, but individual outcomes are probabilistic. Over a large sample, positive returns are possible; in any individual bet, profit is not guaranteed. *Not arbitrage — requires model correctness and large sample.*

**Matched betting (bonus arbitrage):** Uses free bets or promotions to construct a hedge. The "free" component has positive expected value, but the hedge typically involves placing a losing qualifying bet. The net outcome depends on bonus terms (wagering requirements, restricted markets, maximum withdrawal). Not all legs are guaranteed to settle; a void or restriction on the free bet destroys the hedge. *Not guaranteed arbitrage — conditional on terms compliance and no restriction.*

**Statistical arbitrage in sports:** In equities, statistical arbitrage exploits mean-reversion of correlated pairs. In sports, "statistical arbitrage" typically means betting on positive-EV opportunities identified by statistical models. This is value betting under a different name. *Not guaranteed arbitrage.*

---

## SECTION 8 — EVIDENCE OF OCCURRENCE AND PROFITABILITY

### 8.1 Summary of Empirical Evidence

| Study | Sport | Period | Data scope | Arb type | Frequency observed | Margin | After costs? | After execution? |
|-------|-------|--------|-----------|---------|-------------------|--------|-------------|-----------------|
| Franck et al. (2012) C01 | Football (EU top-5) | Multiple seasons ~2003–2010 | 5,478 matches, 8 bookmakers + Betfair | Bookmaker–exchange | 19.2% of matches | Positive (not quantified precisely) | Not tested | Not tested |
| Vlastakis et al. (2008) C05 | Football (EU) | Pre-2008 | 6 bookmakers | Cross-bookmaker | "Limited but highly profitable" | Not specified | Partial — says limited after some adjustment | No |
| Constantinou & Fenton (2013) C04 | Football (EU) | 2005/06–2011/12 | 14 leagues, multiple bookmakers | Cross-bookmaker | "Numerous" | Not quantified | No | No |
| Gómez-González & del Corral (2018) C03 | Football (EU) | 2000/01–2016/17 | Major bookmakers | Cross-bookmaker | Increasing over study period | Declining overround | No | No |
| Grant et al. (2018) C06 | Football (UK/EU) | Not specified | Multiple bookmakers | Cross-bookmaker | 545 portfolios identified | Positive | No | **No — management practices prevent execution** |
| Smith et al. (2005) C10 | Horse racing | Pre-2005 | Two fixed-odds markets | Cross-market (Quarbs) | Present | Positive | No | No |
| Bruce & Johnson (2001) C12 | Horse racing | Pre-2001 | Bookmaker vs parimutuel | Cross-market | Present | Positive differential | No | No |
| Moskowitz (2021) C08 | Multi-sport | Pre-2021 | Large, diverse | Anomaly exploitation | Present | Positive quoted | **Returns insufficient after tx costs** | No |

### 8.2 Key Evidence Points

**Frequency:** Academic studies consistently find quoted surebet opportunities exist. Franck et al. (2012) is the most specific: **19.2%** of top-5 European football matches had at least one guaranteed-positive-return bookmaker-exchange combination. Cross-bookmaker intra-market arb was far rarer (10 opportunities in 5,478 matches = 0.18%).

**Temporal trend:** Gómez-González & del Corral (2018) document that the **number of surebets increased** from 2000–2017 as new bookmakers entered the market and compressed overround. This contradicts the naive assumption that modern markets are uniformly more efficient.

**After-costs evidence:** Moskowitz (2021) is the most authoritative modern study. He explicitly tests whether arbitrage eliminates pricing anomalies in sports betting and concludes that **transaction costs prevent arbitrage from closing the gap**. This is the key negative result: anomalies persist *because* they cannot be executed profitably after costs.

**Execution gap — the critical finding:** Grant et al. (2018) document the most operationally important result. Of 545 identified arbitrage portfolios, approximately **50% require a bet on the favourite at a "position-taker" bookmaker**. Position-takers restrict accounts of informed bettors, meaning the arb exists in the data but **cannot be placed in practice**. This finding is highly significant for the betting-win architecture: quoted arbitrage ≠ executable arbitrage.

**Sport concentration:** All academic evidence is concentrated in European football. Evidence for other sports is either absent or indirect. Extending football findings to tennis, basketball, horse racing, or esports is not empirically supported.

**Evidence level matrix:**

```
Opportunity detected in historical snapshots:  STRONG evidence (multiple studies)
Opportunity theoretically profitable:           MODERATE evidence (before costs)
Opportunity executable at displayed size:       WEAK evidence (one study: Grant 2018)
Opportunity successfully completed:             NO peer-reviewed evidence
Opportunity settled without dispute:            NO peer-reviewed evidence
```

---

## SECTION 9 — MARKET-EFFICIENCY INTERPRETATION

### 9.1 Why Quoted Surebets Exist

Academic literature supports multiple concurrent explanations:

**1. Segmented markets (primary explanation):** Franck et al. (2012) show that bookmaker-vs-exchange arb dominates intra-bookmaker arb. This is because bookmakers and exchanges serve different customer bases and use different pricing mechanisms. Bookmakers set prices to balance books *and* attract recreational bettors; exchanges reflect informed-bettor equilibrium prices. The gap between these pricing regimes creates systematic arbitrage windows.

**2. Loss-leader / customer-acquisition pricing:** Franck et al. (2012) note that bookmakers "experience, on average, negative margins from these postings" and price by "taking the future trading behaviour of customers into account." This means bookmakers deliberately accept loss-leader positions on some bets to attract and retain customers who lose on other bets.

**3. Stale or asynchronous odds:** When one bookmaker is slow to update odds after public information arrival (team news, injury, weather), its quoted price diverges from the current market consensus. This is an *operational* inefficiency, not a *structural* one. It disappears when the slow bookmaker updates.

**4. Different information sets:** Franck et al. (2012) explicitly attribute inter-market arb to "different levels of informational efficiency between the two markets." Exchanges incorporate informed-bettor information more quickly than bookmakers.

**5. Limits to arbitrage:** Moskowitz (2021) invokes limits-to-arbitrage theory: transaction costs, capital constraints, and account restrictions prevent arbitrageurs from exploiting the gap. The anomaly persists not because no one sees it, but because exploitation is unprofitable or operationally impossible.

**6. Account-level discrimination:** Grant et al. (2018) document that position-taker bookmakers restrict or limit accounts of profitable customers. This is the critical execution-layer barrier. The arbitrage cannot be exploited systematically because the most profitable leg often requires access to a bookmaker who will restrict the account.

**7. Capital fragmentation:** Systematic arbitrage requires simultaneously maintaining balances at multiple bookmakers. Withdrawal friction, slow transfer times, and currency conversion costs mean capital cannot flow freely to the venues where it is needed.

### 9.2 Does Arbitrage Identify Genuinely Mispriced Legs?

Yes. The academic literature, particularly Franck et al. (2012) and Grant et al. (2018), supports the interpretation that **when a surebet exists, the bookmaker leg is typically the mispriced one, not the exchange leg.** Exchanges are generally more informationally efficient. This creates a specific research opportunity: surebet detection as a **mispricing signal** — identifying bookmakers that are consistently pricing certain outcomes too generously — even when the fully hedged arb is unattractive. This is the most defensible application for betting-win in the current phase.

---

## SECTION 10 — EXECUTION-RISK AND FALSE-SUREBET TAXONOMY

### 10.1 Execution-Risk Matrix

| Risk | Detection method | Pre-execution control | Rejection rule | Post-execution response | Destroys guarantee? | Academic evidence |
|------|-----------------|----------------------|----------------|------------------------|--------------------|--------------------|
| **Odds move before second leg** | Timestamp all quotes; re-check before submit | Max quote age < [venue-specific threshold, e.g., 30s] | Reject if quote age > threshold or if re-check shows S ≥ 1 | Hedge at market price; accept reduced return | Yes — guarantee gone | Grant et al. (2018); Moskowitz (2021) |
| **One leg rejected** | API error response / timeout | No pre-execution prevention | — | Emergency hedge on unplaced leg at best available price; accept loss | Yes — unhedged position | Grant et al. (2018) explicitly documents this |
| **Partial fill** | Order book depth check before submit | Only submit if displayed depth ≥ required stake | Reject if depth < required | Reduce other legs proportionally; unhedged exposure on shortfall | Partial | No direct study; implied by exchange literature |
| **Stake limit below required** | Query venue limits from API | Check maxStake ≥ required before allocation | Reject or reallocate to alternative venue | Hedge residual at exchange; accept reduced margin | Partial | Grant et al. (2018) — management practices |
| **Minimum stake conflict** | Query minStake from venue | Required stake < minStake = infeasible | Reject opportunity | N/A | Yes — infeasible | Cortis (2015) — theoretical |
| **Stake rounding** | Calculate rounding loss before commit | Require profit_after_rounding > 0 | Reject if rounding eliminates margin | N/A | Partial | Theoretical |
| **Exchange commission** | Query commission rate from API | Include in effective price calculation (see Section 6.3) | Reject if S_effective ≥ 1 | N/A | Yes if not modelled | Franck et al. (2012) acknowledge commission |
| **Withdrawal / deposit fees** | Venue rule registry | Include amortised withdrawal cost in S_effective | Reject if amortised fee > margin | N/A | Partial | Theoretical |
| **Currency conversion** | FX rate + spread from live feed | Include FX cost in S_effective | Reject if FX-adjusted margin ≤ 0 | N/A | Partial | Theoretical |
| **Blockchain gas** | Mempool gas price feed | Gas estimate in S_effective | Reject if gas > profit | N/A | Yes for small stakes | Theoretical |
| **Slippage** | Order book depth + market impact model | Conservative slippage buffer in S_effective | Reject if slippage_estimate > margin/2 | N/A | Yes | Implied by exchange microstructure literature |
| **Insufficient order book depth** | Live order book snapshot | Only use depth that is live, not best-price illusion | Reject if available_depth < required_stake | Reduce other legs | Yes | Implied by exchange literature |
| **Stale cached odds** | Quote timestamp + venue API delay | Enforce max_quote_age per venue | Reject any quote older than threshold | N/A | Yes | Operational; no direct study |
| **Different event identity** | Canonical event normalization (Section H, Layer 2) | Deterministic event matching by league/date/participants | Reject if any participant ambiguous | N/A | Yes — not an arb at all | Operational |
| **Different participant identity** | Name normalisation + external ID mapping | Cross-reference external IDs (e.g., player IDs) | Reject if any participant unresolved | N/A | Yes | Operational |
| **Different start time** | Canonical time matching ± threshold | Reject if time difference > [e.g., 5 min] | N/A | N/A | Yes | Operational |
| **Different market period** | Market period tag (full-time / 90min / extra time) | Require explicit period match | Reject if period ambiguous | N/A | Yes | Operational |
| **Regulation time vs overtime** | Venue rule registry — does market settle on 90 min or include extra time? | Require explicit settlement-period match | Reject if settlement scope differs | N/A | Yes | Operational; documented as common source of dispute |
| **Three-way vs two-way settlement** | Market type tag | Require canonical market_type match | Reject if one venue has draw option and other doesn't | N/A | Yes | Operational |
| **Draw-no-bet mismatch** | Market label parsing | Require explicit DNB match | Reject if one leg is DNB and other is 3-way | N/A | Yes | Operational |
| **Asian handicap line mismatch** | Canonical handicap line normalisation | Require exact line match (e.g., -1.5 ≠ -1.75) | Reject if lines differ | N/A | Yes | Operational |
| **Quarter-line mismatch** | Quarter-line parent/split identification | Require awareness that -1.25 = 50% on -1 + 50% on -1.5 | Reject if quarter-line structure not modelled | N/A | Yes — settlement is split | Operational |
| **Set vs match mismatch** | Market label: "match winner" vs "set 1 winner" | Strict market-type enumeration | Reject if not exact | N/A | Yes | Operational |
| **Tennis retirement rules** | Venue rule registry: does market void on retirement? | Check retirement rule per venue | Reject if venues have different retirement policies | N/A | Yes — one leg may void, other settle | **Operational; well-known industry issue** |
| **Walkovers** | Venue rule registry | Same as retirement | Reject if policies differ | N/A | Yes | Operational |
| **Baseball listed-pitcher rules** | Venue rule registry: action or listed-pitcher? | Reject if venues differ on listed-pitcher | N/A | N/A | Yes — void risk asymmetric | Operational |
| **Postponement rules** | Venue rule registry: settle vs void on postponement | Reject if policies differ | N/A | N/A | Yes | Operational |
| **Abandonment rules** | Same as postponement | Same control | N/A | N/A | Yes | Operational |
| **Dead-heat rules** | Venue rule registry | Reject if one venue applies dead-heat reduction and other doesn't | N/A | N/A | Yes — payout differs | Operational |
| **Voided leg** | Void detection from settlement feed | N/A — not detectable pre-event | Hedge unvoid leg at market price | Partial | Yes | Operational |
| **Palpable error rule** | Venue rule registry | Reject if bookmaker explicitly reserves palpable-error right without clear threshold | N/A | If odds cancelled: lose stake on other leg | Yes — asymmetric; bookmaker cancels winning bet | **No peer-reviewed study found; practitioner-documented** |
| **Incorrect odds later cancelled** | Same as palpable error | Same | N/A | Same as above | Yes | Same |
| **Different result source** | Venue rule registry: which data provider settles the market? | Require same oracle or documented equivalence | Reject if oracle differs | N/A | Yes — results can diverge on close decisions | Operational |
| **Different oracle (on-chain)** | Smart contract oracle address | Require same oracle contract | Reject if oracle diverges | N/A | Yes | Operational; DeFi-specific |
| **Different dispute procedure** | Venue rule registry | Document dispute resolution path; reject if unacceptable risk | N/A | Formal dispute per venue terms | Partial | Operational |
| **Token depeg** | Stablecoin peg monitoring | Only use hard-pegged or fiat assets for surebet settlement | Reject on-chain arb using non-USD-pegged tokens | N/A | Yes | DeFi-specific |
| **Cross-chain bridge delay** | Bridge latency monitoring | Do not count bridge transfer as instant capital | Model bridge time as capital lock-up | N/A | Partial | DeFi-specific |
| **Blockchain reorganisation** | Chain health monitoring | N/A — rare but undetectable pre-block | Monitor for reorg after tx inclusion | Partial | Yes — confirmed tx can be reversed | DeFi-specific; theoretical |
| **Oracle delay** | Oracle heartbeat monitoring | Require oracle freshness check before arb signal | Reject if oracle is stale | N/A | Yes | DeFi-specific |
| **Market resolution delay** | Settlement deadline per venue | Model capital lock-up period; include time-cost | Reject if lock-up period destroys capital efficiency | N/A | No — capital unavailable | Operational |
| **Capital locked until settlement** | Track available vs locked capital | Only use free capital for new arb | Reject if capital commitment exceeds free balance | N/A | No — liquidity risk | Operational |
| **Jurisdiction restriction** | Venue geo-restriction registry | Only use venues available in registered jurisdiction | Reject if venue inaccessible | N/A | Yes — if venue access lost | Legal |
| **Account restriction** | Monitor bet acceptance rate per venue | Track acceptance rate per bookmaker; flag if declining | Reject arb legs at restricted accounts | Reallocate to alternative venue | Yes — if no alternative | Grant et al. (2018); Kaunitz et al. (2017) |
| **Bookmaker closure** | Venue health monitoring | Monitor operational status | Reject if venue shows withdrawal halt | Withdraw capital immediately | Yes | Operational |
| **API data delay** | Latency measurement per API endpoint | Apply per-venue max_api_delay | Reject quotes from high-latency sources | N/A | Yes | Operational |
| **API rate limiting** | Rate-limit tracking per venue | Implement backoff; do not rely on continuous polling | N/A | N/A | Partial — missed opportunities | Operational |
| **Clock synchronisation error** | NTP clock validation | All systems on NTP-synchronised time | Alert if clock drift > 100ms | N/A | Partial | Operational |
| **Duplicate market** | Canonical market deduplication | Check for duplicate market IDs before placing | Reject if same market offered twice | N/A | Yes — double exposure risk | Operational |
| **Correlated outcomes incorrectly treated as exhaustive** | MECE validation (Section H, Layer 2) | Require MECE proof before arb signal | Reject if outcomes are correlated or non-exhaustive | N/A | Yes — not an arb | Operational |
| **Missing outcome** | Outcome count check | Verify outcome set is complete for market type | Reject if any outcome is missing from any venue | N/A | Yes — incomplete hedge | Operational |

### 10.2 Settlement-Rule Mismatch Matrix

| Market pair | Key mismatch risk | Example |
|-------------|------------------|---------|
| Bookmaker 3-way vs Exchange lay-Home | Draw void at exchange but settle at bookmaker | Bookmaker settles 1-1 as Home draw; exchange voids draw |
| DNB vs 3-way | Draw refund on one leg; loss on other | Bookmaker voids draw bet; you lose back-bookmaker leg |
| Asian Handicap -0.5 vs Moneyline | Different payout structure | -0.5 = full win/loss; moneyline = different implied price |
| AH quarter-line vs whole-line | 50% settlement on intermediate | -1.25 = half stake on -1, half on -1.5 |
| Tennis: 90-min rule vs match result | Retirement triggers void on one venue | Player retires after set 2; one venue settles, other voids |
| Baseball: listed pitcher vs action | Pitcher change voids one leg | Starting pitcher changed; action bookmaker settles anyway |
| Football: 90min vs 90min+ET | Extra time included in one settlement | 0-0 at 90min, 1-0 AET — two different results |

---

## SECTION 11 — SPORTS RANKING FOR SUREBET RESEARCH

### 11.1 Scoring Criteria and Methodology

Rated 1–5 (5 = best for surebet research) on: outcome MECE clarity, market liquidity, venue coverage, event frequency, odds-update frequency, price dispersion potential, settlement-rule consistency, market-identity consistency, two-way market availability, exchange lay market availability, historical odds availability, integrity risk (inverse), void/retirement risk (inverse), opportunity duration, capital lock-up time (inverse).

**Note:** These ratings are based on the academic evidence available plus operational knowledge. Sport suitability for surebetting is distinct from sport predictability.

### 11.2 Rankings Table

| # | Sport | MECE | Liquidity | Venues | Freq | Update | Dispersion | Settlement | Identity | 2-way | Exchange | Historical odds | Integrity (inv) | Void risk (inv) | Duration | Lock-up (inv) | **TOTAL** |
|---|-------|------|-----------|--------|------|--------|-----------|-----------|---------|-------|---------|----------------|-----------------|----------------|----------|--------------|----------|
| 1 | **Football / Soccer** | 4 | 5 | 5 | 5 | 5 | 4 | 3 | 4 | 3 | 5 | 5 | 4 | 4 | 3 | 4 | **63** |
| 2 | **Tennis** | 4 | 4 | 4 | 5 | 4 | 4 | 2 | 3 | 4 | 4 | 4 | 4 | 4 | 1 | 4 | **55** |
| 3 | **Basketball (NBA/top leagues)** | 5 | 4 | 4 | 4 | 4 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 3 | **57** |
| 4 | **American Football (NFL)** | 5 | 4 | 4 | 3 | 4 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 4 | 4 | 4 | **57** |
| 5 | **Baseball (MLB)** | 5 | 3 | 3 | 4 | 3 | 3 | 3 | 2 | 4 | 2 | 3 | 4 | 4 | 2 | 3 | **46** |
| 6 | Ice Hockey (NHL) | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 3 | 3 | 4 | 4 | 3 | **47** |
| 7 | Rugby Union/League | 4 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 2 | 2 | 3 | 4 | 3 | 3 | **45** |
| 8 | Horse Racing | 3 | 4 | 4 | 5 | 4 | 4 | 2 | 3 | 3 | 4 | 4 | 3 | 2 | 3 | 2 | **50** |
| 9 | Cricket (Test / T20) | 3 | 3 | 3 | 2 | 3 | 3 | 3 | 2 | 3 | 2 | 2 | 3 | 3 | 1 | 1 | **35** |
| 10 | Golf | 3 | 3 | 3 | 2 | 3 | 3 | 4 | 3 | 3 | 2 | 2 | 3 | 3 | 2 | 2 | **41** |
| 11 | Boxing / MMA | 4 | 3 | 3 | 2 | 3 | 3 | 4 | 2 | 4 | 2 | 2 | 3 | 3 | 2 | 2 | **41** |
| 12 | Darts | 4 | 3 | 3 | 4 | 4 | 3 | 4 | 4 | 4 | 2 | 1 | 3 | 4 | 4 | 4 | **51** |
| 13 | Esports (CS2 / LoL) | 4 | 2 | 3 | 4 | 3 | 4 | 2 | 2 | 2 | 1 | 1 | 2 | 1 | 2 | 3 | **35** |
| 14 | Table Tennis | 4 | 2 | 3 | 5 | 4 | 5 | 2 | 2 | 2 | 1 | 1 | 2 | 2 | 2 | 4 | **41** |
| 15 | Cycling | 3 | 2 | 2 | 2 | 2 | 3 | 3 | 2 | 2 | 1 | 1 | 2 | 3 | 3 | 2 | **33** |
| 16 | Virtual sports | 5 | 3 | 3 | 5 | 3 | 2 | 1 | 4 | 2 | 1 | 1 | 2 | 1 | 4 | 4 | **41** |

### 11.3 Summary Lists

**Overall top 5 for surebet research:**
1. Football / Soccer — highest venue coverage, liquidity, historical odds data, academic evidence
2. Basketball (NBA) — two-way market, clean settlement, good venue coverage
3. American Football (NFL) — two-way market, clean settlement, large volumes
4. Tennis — high event frequency, good venue coverage; **retirement-rule risk is critical negative**
5. Darts — surprisingly strong: two-way market, high event frequency, consistent settlement, good price dispersion

**Safest 5 operationally (lowest void/settlement-rule risk):**
1. Basketball (NBA) — clear 2-way or 3-way, consistent settlement rules
2. American Football (NFL) — clear 2-way, consistent settlement
3. Football (major leagues, 3-way market) — well-documented settlement rules
4. Darts — binary outcomes, low dispute risk
5. Ice Hockey (regulation-time only markets) — clear if settled on 60 min only

**Highest-frequency 5:**
1. Football — thousands of matches per week globally
2. Tennis — daily tournaments worldwide
3. Table Tennis — extremely high event volume
4. Basketball — NBA + European leagues daily
5. Baseball (MLB) — 162 games/team regular season

**Highest theoretical opportunity but highest risk:**
1. Tennis — retirement risk
2. Cricket — abandonment risk, long lock-up
3. Esports — integrity risk, low liquidity, void uncertainty
4. Boxing/MMA — rule-change/no-contest risk
5. Horse racing — dead-heat, non-runner, SP bookmaker rules

**Sports to avoid initially:**
- Cycling — no clear exchange lay market, complex rules
- Virtual sports — artificial price dispersion with no real information
- Cricket — settlement complexity, long lock-up
- Esports — integrity concerns, rule variability, very low exchange liquidity
- Any sport without a Betfair market — no credible exchange for back/lay arb

---

## SECTION 12 — MARKET-TYPE RANKING

| Market type | MECE? | Settlement consistency | Margin | Liquidity | Normalization ease | False-arb risk | Opportunity freq | **Surebet score** |
|-------------|-------|----------------------|--------|-----------|-------------------|----------------|-----------------|-----------------|
| **Two-way moneyline (no draw)** | Yes | High | Low | High | High | Low | High | **★★★★★** |
| **Exchange back/lay (same market)** | Yes | Very high | Low | Medium–High | Very high | Very low | Medium | **★★★★★** |
| **Three-way match result** | Yes | Medium | Medium | High | High | Medium (DNB vs 3-way mismatch) | High | **★★★★** |
| **Draw-no-bet** | Yes | High | Low | Medium | High | Low | Medium | **★★★★** |
| **Asian Handicap (whole and half lines)** | Yes (if exact line matched) | High | Low | High | Medium (line matching required) | Medium | High | **★★★★** |
| **Point spread** | Yes | High | Low | High | High | Low | High | **★★★★** |
| **Totals (Over/Under, whole-line)** | Yes | High | Low | High | High | Low | Medium | **★★★★** |
| **First-half markets** | Yes | Medium | Medium | Medium | Medium | Medium | Medium | **★★★** |
| **Period markets** | Yes | Medium | Medium | Low | Low | High | Low | **★★** |
| **Team totals** | Yes | Medium | High | Low | Medium | Medium | Low | **★★** |
| **Game handicaps** | Conditional | Medium | Medium | Medium | Low | High | Low | **★★** |
| **Set betting** | Yes (tennis) | Low | High | Low | Low | High | Low | **★** |
| **Player props** | Conditional | Low | High | Low | Very low | High | Low | **★** |
| **Correct score** | Yes | High | Very high | Low | Medium | Medium | Very low | **★** |
| **Futures** | Yes | Low | Very high | Low | Low | High | Very low | **★** |
| **Prediction-market yes/no** | Conditional | Very low | Variable | Very low | Very low | Very high | Unknown | **★** |

**Top 5 market types for surebet research:**
1. Two-way moneyline — simplest MECE, clean settlement
2. Exchange back/lay on the same canonical market
3. Three-way match result (football) — most academic evidence
4. Draw-no-bet — clean two-way settlement from 3-way market
5. Asian Handicap (whole-line only) — high liquidity, clean settlement if line is matched

---

## SECTION 13 — STRATEGY-FAMILY RANKING

### 13.1 Strategy Comparison Table

| Strategy | Academic support | Theoretical guarantee | Execution reliability | Data requirements | Capital requirements | Latency sensitivity | Liquidity | Scalability | Settlement risk | Implementation complexity | betting-win compatibility | **Overall** |
|----------|-----------------|----------------------|----------------------|------------------|---------------------|--------------------|-----------|-----------|--------------|--------------------------|-----------------------|------------|
| 1. Cross-bookmaker 2-way surebet scanner | Medium (Vlastakis 2008, Constantinou 2013) | Yes (conditional) | **Low** (account restrictions) | High (multi-venue odds, live) | Medium | Medium | Medium | Low | Medium | High | Medium | **Medium** |
| 2. Three-way football surebet scanner | Medium–High (Franck 2012, Gómez-González 2018) | Yes (conditional) | **Low** (same restriction issue) | High | Medium | Medium | High | Low | Medium (settlement rules) | High | Medium | **Medium** |
| 3. Bookmaker–exchange back/lay | **Highest** (Franck 2012 — primary studied form) | Yes (conditional on commission, liquidity) | Low–Medium (better exchange liquidity; still restriction risk) | High (live odds + order book) | Medium | High | Medium | Low | Low–Medium | High | Medium–High | **Medium–High** |
| 4. Exchange–exchange arb | Very low (no academic study found) | Yes (conditional) | Medium (no account restriction from exchanges) | Medium (two exchanges, live) | Medium | High | Low | Low | Low | Medium | Low | **Low** |
| 5. DeFi CLOB cross-venue | None (practitioner only; Futarchy paper 2025) | Conditional | Very low (block time, gas, oracle risk) | Very high | High (gas + capital) | Very high | Very low | Very low | Very high | Very high | Very low | **Very low** |
| 6. AMM-vs-order-book arb | None peer-reviewed | Conditional | Very low | Very high | High | Very high | Very low | Very low | Very high | Very high | Very low | **Very low** |
| 7. Cross-market synthetic arb | None | Not true arb | Very low | Very high | Medium | High | Low | Very low | Very high | Very high | Very low | **Avoid** |
| 8. Surebet + value-bet hybrid | Medium (Constantinou 2013, Kaunitz 2017) | EV-positive, not guaranteed | Low–Medium | High | Medium | Medium | Medium | Medium | Medium | High | Medium | **Medium** |
| **9. Surebet detection as mispricing signal only** | Medium–High (Grant 2018, Franck 2012, Moskowitz 2021) | N/A (not claimed as arb) | **High** (signal only; no execution) | Medium | Low | Low | N/A | High | Low | Low | **High** | **★★★★** |
| 10. Matched-betting / bonus-arbitrage | None peer-reviewed as arbitrage | Not true arb | Medium (during offer period) | Low | Low | Low | Low | Very low | High (terms risk) | Low | Low | **Low** |

**Top recommendation:** Strategy 9 (Surebet detection as mispricing signal) scores highest for betting-win compatibility in the current phase. It derives research value from surebet patterns without requiring the execution infrastructure that makes strategies 1–3 operationally fragile.

---

## SECTION 14 — BEST EVIDENCE-SUPPORTED SUREBET SYSTEM

The following 9-layer design is the strongest academically defensible paper-trading surebet system. It is **paper-trading only** until all layers are validated through simulated execution.

### Layer 1 — Venue and Rule Registry

Store per venue:

```
venue_id, venue_name, jurisdiction, currency, is_exchange (bool),
commission_rate (%), commission_type (net_win | turnover),
betting_duty (%), FX_pair, min_stake, max_stake,
market_rules (JSONB), overtime_settlement (90min | FT | ET),
void_policy (void | settle_as_started), retirement_policy (void | settle),
postponement_policy (void | delay), abandonment_policy,
palpable_error_reserved (bool), result_source, settlement_source,
withdrawal_min, withdrawal_days, api_timestamp_type (unix_ms | ISO8601),
api_max_latency_ms, last_rule_version_date
```

**No arbitrage signal may be emitted from a venue with an unresolved rule field.**

### Layer 2 — Canonical Event and Market Normalization

**MECE requirement:** No arb signal without proof that:

1. All outcomes are **mutually exclusive** (no outcome can occur simultaneously)
2. Outcomes are **collectively exhaustive** (one outcome must occur)
3. **Settlement rules are identical** across all legs (same period, same oracle, same void conditions)

Deterministic mapping fields:
```
canonical_event_id  = sport + league_id + date + participants_canonical
canonical_market_id = event_id + market_type + period + line
canonical_outcome_id = market_id + outcome_label_normalised
settlement_rule_version = venue_id + rule_hash + valid_from_date
```

**No match on any ambiguous field → reject.**

### Layer 3 — Effective Price Calculation

```python
# Pseudocode — NOT production code
def effective_price(quoted_odds, venue):
    p = quoted_odds
    p = p * (1 - venue.commission_rate)          # exchange commission (if applicable)
    p = p * (1 - venue.betting_duty)              # betting duty / turnover tax
    p = p / (1 + venue.fx_spread)                 # FX conversion spread
    p = p * (1 - venue.slippage_estimate)         # price slippage (order book)
    p = p - venue.withdrawal_cost_amortised / stake  # amortised withdrawal cost
    p = p - venue.gas_cost_estimate / stake       # on-chain gas (if applicable)
    return p
```

**S_effective = Σᵢ (1 / effective_price(oᵢ, venueᵢ))**  
**Surebet condition:** S_effective < 1 − safety_margin (see Layer 7)

### Layer 4 — Quote Synchronization and Freshness

```
max_quote_age_seconds  = per-venue threshold (e.g., Betfair stream: 2s; polling: 15s)
max_cross_venue_skew_ms = 500ms (configurable)
opportunity_half_life   = derived from academic evidence: ~seconds for high-liquidity
stale_quote_rejection   = hard reject any quote older than max_quote_age
```

**Re-verify all quotes immediately before any submit — never act on quotes older than the max_quote_age threshold.** The academic evidence on stale odds (Vlastakis 2008, Grant 2018) suggests that the bookmaker leg is the most likely to have moved.

### Layer 5 — Liquidity and Stake Constraints

The allocation problem:

```
maximise  profit P
subject to:
  stakeᵢ × effective_price(oᵢ) = constant    ∀i   (equal return)
  min_stakeᵢ ≤ stakeᵢ ≤ min(max_stakeᵢ, balanceᵢ, depth_at_priceᵢ)
  stakeᵢ ∈ ℝ≥0
```

**Optimization method recommendation (from literature review):**

| Method | When to use | Academic support |
|--------|------------|-----------------|
| Closed-form (equal-return formula) | No binding constraints | Cortis (2015), Lane & Ziemba (2004) |
| Linear Programming | Binding min/max stake constraints | Standard operations research |
| Mixed-Integer Programming | When integer stakes required | Standard OR; no sports-betting-specific study |
| Robust Optimization | When costs or prices are uncertain | Theoretical; no sports-betting study found |
| Stochastic Optimization | When execution is probabilistic | Theoretical; no sports-betting study found |

**Recommendation:** Closed-form for unconstrained; LP for constrained; add robustness buffer via Layer 7 safety margin rather than full stochastic optimization.

### Layer 6 — Execution Ordering

**Evaluated strategies:**

| Strategy | Academic support | Risk assessment |
|----------|-----------------|----------------|
| Least-liquid leg first | Practitioner convention | Ensures the harder-to-fill leg is placed before committing other capital |
| Most volatile leg first | Practitioner convention | Minimises price-movement risk on the leg most likely to move |
| Exchange hedge first | Supported by Franck et al. (2012) structure | Exchanges are faster to confirm; bookmaker leg then hedges confirmed exchange position |
| Parallel submission | No academic study | Maximises speed; increases risk of partial hedge if one leg fails |
| Sequential submission | Implied by execution literature | Reduces parallel failure risk; adds latency |
| Cancel-if-not-fully-hedged | No academic study | Safest for paper-trading; leaves unhedged exposure if partial cancel fails |
| Emergency hedge at reduced profit | No academic study | Required fallback if first leg placed and second fails |

**Critical note:** No execution approach is "atomic" in a cross-venue setting. Even parallel API submission does not guarantee simultaneous settlement. Always maintain an emergency hedge procedure.

### Layer 7 — Safety Margin

```
minimum_required_margin = 
    known_costs (commission + tax + FX + gas)
  + expected_slippage (from depth estimate)
  + latency_buffer (odds_may_move in transit)
  + rounding_buffer (integer stake effect)
  + model_uncertainty_buffer
  + account_risk_reserve (probability of restriction)

Reject if: theoretical_margin ≤ minimum_required_margin
```

Based on academic evidence (Moskowitz 2021 — costs eliminate anomaly; Grant 2018 — management practices prevent arb):

```
Recommended minimum observable margin (before filtering): 3.0%
Recommended minimum post-cost margin before executing: 1.0%
```

**Justification:** Franck et al. (2012) documented margins on bookmaker-exchange arb; Cortis (2015) showed bookmaker commission structure. A 1% post-cost margin provides buffer for typical slippage, rounding (£2–5 on £200–500 stakes), and latency. Lower thresholds are not supported by the available evidence.

### Layer 8 — Reconciliation

Store per executed (or simulated) opportunity:

```
opportunity_id, detected_at, signal_source,
legs: [{venue, market_id, outcome, quoted_price, effective_price,
         requested_stake, accepted_stake, fill_rate, accepted_price,
         timestamp_request, timestamp_confirm, fill_status}],
theoretical_roi, quoted_roi, effective_roi,
settlement: {result, void_status, payout, fees_deducted},
realized_return, unhedged_exposure_amount, reconciliation_status
```

### Layer 9 — Paper-Trading Validation

**The system must remain paper-only until validated under all of:**

- [ ] Quote delays simulated (per-venue latency profiles)
- [ ] Partial fills simulated (probabilistic fill at displayed depth)
- [ ] Rejected legs simulated (frequency derived from Grant 2018)
- [ ] Stake limits applied (venue-specific)
- [ ] Rule mismatches injected (at historical frequency)
- [ ] Exchange commissions applied (exact rates)
- [ ] Void events simulated (at historical sport-specific frequencies)
- [ ] Stale data injected (occasional stale quotes)
- [ ] Settlement delays modelled
- [ ] Account restrictions simulated (frequency from Kaunitz 2017)

---

## SECTION 15 — STAKE-ALLOCATION AND OPTIMIZATION METHODS

| Method | Formula type | Handles constraints? | Integer stakes? | Uncertainty? | Academic citation | Recommended use |
|--------|-------------|---------------------|-----------------|-------------|-------------------|----------------|
| Equal-return closed form | Algebraic | No | No | No | Cortis (2015), Lane & Ziemba (2004) | Baseline; unconstrained case |
| Kelly criterion | Log utility maximisation | No (needs adaptation) | No | No | Lane & Ziemba (2004); Kelly (1956) | Risk management; over-staking prevention |
| Fractional Kelly | Same × fraction k<1 | No | No | No | Lane & Ziemba (2004) | Conservative risk management |
| Linear Programming | Simplex / interior point | Yes | No | No | Standard OR | Constrained allocation with min/max stakes |
| Mixed-Integer Programming | Branch and bound | Yes | Yes | No | Standard OR | When integer stakes required |
| Chance-constrained LP | Extended LP | Yes | No | Partial | Standard robust optimisation | When fill probability <100% |
| Robust optimisation (minimax) | Worst-case LP | Yes | No | Yes | Theoretical | When price uncertainty is bounded |
| Stochastic optimisation | Expected value over scenarios | Yes | No | Yes | Theoretical | Most realistic; computationally expensive |

**Note:** No peer-reviewed study specifically applies robust or stochastic optimisation to sports betting arbitrage. The closest academic treatment is Lane & Ziemba (2004) for Kelly, and standard operations research for LP/MIP.

---

## SECTION 16 — DEFI AND ON-CHAIN IMPLICATIONS

### 16.1 Relevant Platforms and Academic Evidence

**Academic evidence on on-chain sports betting arbitrage is essentially absent.** The literature on on-chain prediction market efficiency is nascent (Futarchy paper 2025, preprint). The following assessment draws on DeFi microstructure principles applied to betting:

| Platform type | Price mechanism | Key arb challenge | Academic evidence |
|---------------|----------------|------------------|-------------------|
| Azuro / SX Bet (sports CLOB) | Order book | Block time (12s Ethereum); tx inclusion; partial fill | None peer-reviewed |
| Polymarket (binary CLOB) | Order book | Different oracle (UMA); resolution delay; dispute period | None peer-reviewed |
| AMM prediction markets (e.g., Manifold) | Automated market maker | Price impact (bonding curve); no true limit order | None peer-reviewed |
| Cross-chain (Ethereum ↔ Polygon ↔ BNB) | Depends | Bridge delay (minutes to hours); capital fragmentation | None peer-reviewed |

### 16.2 DeFi-Specific Risk Matrix

| Risk | Severity | Detectability | Mitigation |
|------|----------|--------------|-----------|
| Displayed price vs executable depth (AMM price impact) | High | Pre-submission with price impact formula | Use impact formula; reject if impact > margin |
| Block time inclusion delay | High | Known per chain (12s ETH, 2s Polygon, 3s BNB) | Model as latency; never treat on-chain as synchronous |
| Gas price volatility | Medium–High | Live gas price feed | Gas estimate in S_effective; buffer required |
| Mempool visibility / front-running | High | Partial (some MEV bots visible) | Private RPC / Flashbots; smaller on-chain arbs targeted by MEV |
| Failed transactions (out-of-gas, revert) | Medium | Gas estimation tools | Pre-simulate with eth_call; buffer gas |
| Token approval requirements | Low | Check allowance before tx | Pre-approve max once; amortised cost |
| Oracle differences between venues | Very High | Compare oracle addresses | Reject cross-venue arb if oracle differs |
| Dispute periods (Polymarket UMA) | High | Known per platform | Capital locked during dispute; model lock-up |
| Market resolution differences | Very High | Compare resolution rules | Reject if resolution logic differs |
| Token decimals / rounding | Low | Contract ABI inspection | Normalise to 18-decimal base; model precision loss |
| Stablecoin depegging | Medium | Price feed monitoring | Only settle in over-collateralised stablecoins or native |
| Chain reorganisation | Low (rare) | Block finality confirmation | Wait N blocks before treating tx as final |
| Cross-chain bridge delay | Very High | Bridge documentation | Model bridge as capital lock-up; not instant transfer |
| Capital fragmentation across chains | High | Portfolio accounting | Multi-chain capital management; opportunity cost |

### 16.3 Atomic Multi-Venue Arbitrage — Can Smart Contracts Solve It?

**Assessment: No, in the general cross-venue case.**

A single smart contract can execute an atomic bundle of trades *within one chain*, but:

1. **Cross-venue atomicity on-chain:** Possible only if both venues are on the same chain and both accept atomic smart contract calls. Azuro and Polymarket are both EVM-based but use different contract interfaces and may not both support same-block execution.

2. **Off-chain bookmaker + on-chain exchange:** Fundamentally non-atomic. The bookmaker leg is off-chain; no smart contract can atomically coordinate an off-chain action.

3. **Cross-chain:** Fundamentally non-atomic. Bridge delays of minutes to hours mean legs cannot be placed simultaneously.

**Conclusion:** Most cross-protocol surebets retain full sequence risk. The only scenario where smart-contract atomicity is achievable is same-chain, same-block multi-venue arbitrage — and no academic study documents profitable examples of this in sports betting.

---

## SECTION 17 — DATA MODEL PROPOSAL

The following entities are proposed for a future private paper-arbitrage module in the betting-win repo. All entities preserve full source lineage per the prompt requirement.

```sql
-- Venue registry with rule versioning
CREATE TABLE venue (
    venue_id TEXT PRIMARY KEY,
    venue_name TEXT, jurisdiction TEXT, currency TEXT,
    is_exchange BOOLEAN, commission_rate NUMERIC,
    commission_type TEXT, -- 'net_win' | 'turnover'
    min_stake NUMERIC, max_stake NUMERIC,
    created_at TIMESTAMP, updated_at TIMESTAMP
);

CREATE TABLE venue_rule_version (
    rule_version_id TEXT PRIMARY KEY,
    venue_id TEXT REFERENCES venue(venue_id),
    overtime_settlement TEXT, void_policy TEXT,
    retirement_policy TEXT, postponement_policy TEXT,
    palpable_error_reserved BOOLEAN,
    result_source TEXT, rule_hash TEXT,
    valid_from DATE, valid_to DATE
);

-- Event and participant canonicalization
CREATE TABLE participant (
    participant_id TEXT PRIMARY KEY,
    canonical_name TEXT, sport TEXT,
    external_ids JSONB -- {"betfair_id": ..., "sofascore_id": ...}
);

CREATE TABLE event (
    event_id TEXT PRIMARY KEY, sport TEXT, league_id TEXT,
    scheduled_start TIMESTAMP WITH TIME ZONE,
    participant_1_id TEXT, participant_2_id TEXT,
    status TEXT -- scheduled | live | finished | cancelled
);

-- Market normalisation
CREATE TABLE canonical_market (
    market_id TEXT PRIMARY KEY, event_id TEXT,
    market_type TEXT, -- 'match_result' | '1x2' | 'asian_handicap' | etc.
    period TEXT, line NUMERIC,
    settlement_rule_description TEXT
);

CREATE TABLE canonical_outcome (
    outcome_id TEXT PRIMARY KEY, market_id TEXT,
    outcome_label TEXT, -- 'home' | 'draw' | 'away' | 'over' | etc.
    is_mece_verified BOOLEAN
);

-- Venue market mappings
CREATE TABLE venue_market (
    venue_market_id TEXT PRIMARY KEY,
    canonical_market_id TEXT, venue_id TEXT,
    venue_market_identifier TEXT, -- bookmaker's internal market ID
    rule_version_id TEXT
);

-- Quote snapshots with full lineage
CREATE TABLE quote_snapshot (
    snapshot_id TEXT PRIMARY KEY,
    venue_market_id TEXT, canonical_outcome_id TEXT,
    quoted_price NUMERIC, effective_price NUMERIC,
    request_timestamp TIMESTAMP WITH TIME ZONE,
    response_timestamp TIMESTAMP WITH TIME ZONE,
    venue_timestamp TIMESTAMP WITH TIME ZONE,
    quote_age_ms INTEGER,
    raw_payload_hash TEXT, -- SHA256 of raw API response
    normalization_version TEXT,
    block_number BIGINT, -- on-chain only; NULL for off-chain
    transaction_hash TEXT  -- on-chain only
);

CREATE TABLE orderbook_level (
    level_id TEXT PRIMARY KEY, snapshot_id TEXT,
    price NUMERIC, available_size NUMERIC, side TEXT
);

-- Fee schedules
CREATE TABLE fee_schedule (
    fee_id TEXT PRIMARY KEY, venue_id TEXT,
    fee_type TEXT, -- 'commission' | 'tax' | 'withdrawal' | 'deposit'
    fee_value NUMERIC, fee_unit TEXT, -- 'pct' | 'fixed'
    applies_to TEXT, valid_from DATE, valid_to DATE
);

CREATE TABLE currency_conversion (
    conversion_id TEXT PRIMARY KEY,
    from_currency TEXT, to_currency TEXT,
    rate NUMERIC, spread NUMERIC,
    timestamp TIMESTAMP WITH TIME ZONE, source TEXT
);

-- Arbitrage opportunities
CREATE TABLE arbitrage_opportunity (
    opportunity_id TEXT PRIMARY KEY,
    detected_at TIMESTAMP WITH TIME ZONE,
    canonical_market_ids JSONB, -- array of market IDs
    arbitrage_type TEXT, -- 'cross_bookmaker' | 'bookmaker_exchange' | etc.
    theoretical_s NUMERIC, -- sum of 1/odds
    effective_s NUMERIC,   -- after costs
    theoretical_roi NUMERIC, effective_roi NUMERIC,
    safety_margin_applied NUMERIC,
    accepted BOOLEAN, rejection_reason_id TEXT
);

CREATE TABLE arbitrage_leg (
    leg_id TEXT PRIMARY KEY, opportunity_id TEXT,
    canonical_outcome_id TEXT, venue_id TEXT,
    snapshot_id TEXT, -- which quote was used
    quoted_price NUMERIC, effective_price NUMERIC,
    required_stake NUMERIC, min_stake NUMERIC, max_stake NUMERIC,
    available_depth NUMERIC
);

CREATE TABLE stake_allocation (
    allocation_id TEXT PRIMARY KEY, opportunity_id TEXT,
    total_capital NUMERIC,
    allocation_method TEXT, -- 'equal_return' | 'LP' | 'MIP'
    legs JSONB -- [{leg_id, allocated_stake, rounded_stake}]
);

-- Execution simulation (paper-trading)
CREATE TABLE execution_simulation (
    simulation_id TEXT PRIMARY KEY, opportunity_id TEXT,
    simulation_type TEXT, -- 'paper' | 'historical_replay' | 'stress_test'
    simulated_at TIMESTAMP WITH TIME ZONE,
    latency_model TEXT, fill_probability_model TEXT,
    slippage_model TEXT, result_outcome TEXT
);

CREATE TABLE execution_attempt (
    attempt_id TEXT PRIMARY KEY, simulation_id TEXT,
    leg_id TEXT, attempted_at TIMESTAMP WITH TIME ZONE,
    result TEXT, -- 'filled' | 'partial' | 'rejected' | 'timeout'
    fill_price NUMERIC, fill_size NUMERIC,
    rejection_reason TEXT
);

CREATE TABLE fill (
    fill_id TEXT PRIMARY KEY, attempt_id TEXT,
    filled_size NUMERIC, fill_price NUMERIC,
    fill_timestamp TIMESTAMP WITH TIME ZONE,
    venue_fill_id TEXT
);

CREATE TABLE unhedged_exposure (
    exposure_id TEXT PRIMARY KEY, opportunity_id TEXT,
    unhedged_amount NUMERIC, unhedged_outcome_id TEXT,
    maximum_loss NUMERIC, opened_at TIMESTAMP, closed_at TIMESTAMP
);

-- Settlement
CREATE TABLE settlement (
    settlement_id TEXT PRIMARY KEY, opportunity_id TEXT,
    settled_at TIMESTAMP WITH TIME ZONE,
    result_outcome_id TEXT, gross_payout NUMERIC,
    fees_deducted NUMERIC, net_return NUMERIC,
    realised_roi NUMERIC, settlement_source TEXT
);

CREATE TABLE void_event (
    void_id TEXT PRIMARY KEY, opportunity_id TEXT,
    leg_id TEXT, void_reason TEXT,
    detected_at TIMESTAMP, unhedged_at_void BOOLEAN
);

CREATE TABLE reconciliation (
    reconciliation_id TEXT PRIMARY KEY, opportunity_id TEXT,
    reconciled_at TIMESTAMP, status TEXT,
    expected_return NUMERIC, actual_return NUMERIC,
    discrepancy NUMERIC, discrepancy_reason TEXT
);

CREATE TABLE rejection_reason (
    reason_id TEXT PRIMARY KEY, opportunity_id TEXT,
    reason_type TEXT, -- see taxonomy
    reason_detail TEXT, detected_at TIMESTAMP
);

-- Source lineage (every snapshot references this)
CREATE TABLE source_lineage (
    lineage_id TEXT PRIMARY KEY, snapshot_id TEXT,
    api_endpoint TEXT, request_timestamp TIMESTAMP,
    response_timestamp TIMESTAMP, venue_timestamp TIMESTAMP,
    block_number BIGINT, transaction_hash TEXT,
    quote_age_ms INTEGER, raw_payload_hash TEXT,
    normalization_version TEXT, rule_version_id TEXT
);
```

---

## SECTION 18 — VALIDATION FRAMEWORK

### 18.1 Required Metrics

| Metric | Definition | Target threshold |
|--------|-----------|-----------------|
| detected_opportunity_count | Opportunities with S_effective < 1 | — |
| unique_opportunity_count | Deduplicated by event+time | — |
| opportunity_duration_median | Time from detection to first odds change | Target: > 5s (must exceed execution latency) |
| opportunity_half_life | Time for S to cross 1 again | Benchmark against realistic placement time |
| quoted_gross_roi | (1−S_quoted)/S_quoted | — |
| cost_adjusted_theoretical_roi | (1−S_effective)/S_effective | Must be > 0 to proceed |
| executable_roi | After stake constraints applied | Must be > 0 |
| realized_simulated_roi | After simulated fills, rejections, commissions | Must be > 0 |
| false_arbitrage_rate | Opps with S < 1 quoted but settlement-incompatible legs | Target: < 10% |
| rule_mismatch_rate | Opps rejected by Layer 2 normalisation | Target: < 20% |
| stale_quote_rate | Opps where re-check shows S ≥ 1 | Target: < 30% |
| leg_rejection_rate | Legs rejected by venue | Target: < 20% |
| partial_fill_rate | Fills < required stake | Target: < 25% |
| fully_hedged_completion_rate | Both legs filled at required size | Target: > 50% to proceed |
| average_unhedged_exposure | Mean unhedged amount per incomplete opportunity | Target: near 0 |
| maximum_unhedged_exposure | Worst-case unhedged amount | Must be bounded |
| slippage | Mean price slippage vs quoted | Target: < quoted margin/3 |
| capital_utilization | Capital at risk / total capital | Monitor for concentration |
| capital_lock_duration | Mean time from stake to settlement | Must be < opportunity frequency cycle |
| settlement_failure_rate | Voids + disputes as % of settled | Target: < 5% |
| void_rate | Voids as % of all settlements | Target: < 3% |
| profit_per_unit_capital_time | Annualised: net_profit / capital / days | Must be positive |

### 18.2 Backtest Requirements

```
1. Timestamp-ordered historical replay — no look-ahead
2. Realistic API polling or stream latency per venue (modelled from known API specs)
3. Venue-specific quote delays (Betfair stream ~1s; polling-based bookmakers 5–30s)
4. Executable-size constraints (display depth ≠ available depth)
5. Fees and commissions (exact rates per venue)
6. Stake limits enforced (per venue, per event)
7. Rule-version matching (must use contemporaneous rule version)
8. Integer stake rounding (where required)
9. Settlement simulation (void, postponement, dispute frequencies)
10. Account-restriction simulation (inject restriction events at realistic rates)
```

### 18.3 Minimum Sample Thresholds

Before treating results as evidence:

```
Minimum opportunities: 1,000 unique opportunities
Minimum settled: 500 settled opportunities
Minimum time span: 6 months (captures seasonal variation)
Minimum sports: 2 sports (to assess generalisability)
Minimum venues: 3 venues per leg (to assess venue concentration risk)
```

Smaller samples produce misleading false-arbitrage rates and ROI estimates. A 50-opportunity sample with positive ROI is not evidence.

---

## SECTION 19 — KILL CRITERIA

The surebet research branch should be **parked** (converted from active research module to reference-only) if any of the following conditions are met in the paper-trading validation:

| Kill criterion | Threshold | Rationale |
|---------------|-----------|-----------|
| false_arbitrage_rate | > 25% | Settlement-incompatible legs overwhelm signal |
| fully_hedged_completion_rate | < 30% | Cannot reliably complete both legs; not an arb system |
| median_opportunity_duration | < max(data_latency, execution_latency) | Opportunities gone before detection is actionable |
| cost_adjusted_margin | < 0.2% on average | Costs exceed signal; margin too thin for any buffer |
| insufficient_executable_depth | > 50% of opportunities require more depth than available | Capital cannot be deployed |
| rule_matching_deterministic | Cannot achieve < 15% rule-mismatch rate | Canonical normalization is not achievable |
| capital_fragmentation | > 40% of capital required locked in settlement at any time | Capital efficiency destroyed |
| void_reversal_rate | > 5% | Settlement reliability unacceptable |
| realized_simulated_roi | < 0 over 1,000+ simulated opportunities | Paper-trading simulation is unprofitable |
| no_evidence_beyond_football | Cannot demonstrate occurrence in ≥ 2 non-football sports | Evidence base too narrow for architecture |
| operator_terms_collection_unusable | Any venue restricts systematic data collection in terms | Legal/operational risk |

---

## SECTION 20 — EVIDENCE GAPS

| Gap | Description | Priority |
|-----|-------------|---------|
| EG01 | No peer-reviewed study on executable surebet returns after account restrictions | Critical |
| EG02 | No study of surebet frequency in post-2021 markets (all evidence pre-2019) | Critical |
| EG03 | No study for any sport outside European football | High |
| EG04 | No study on opportunity duration / half-life in live markets | High |
| EG05 | No study on stake-limit interaction with surebet profitability | High |
| EG06 | No study on on-chain prediction market cross-venue arbitrage | High |
| EG07 | No study on realistic slippage at exchange for surebet volumes | Medium |
| EG08 | No study on palpable-error rate as % of identified arb opportunities | Medium |
| EG09 | No study distinguishing position-taker vs book-balancer restriction rates | Medium |
| EG10 | No study on minimum required margin that survives full cost stack in practice | Medium |
| EG11 | No replication of Franck et al. (2012) with post-2018 data | Medium |
| EG12 | No study on integer-rounding impact on arbitrage profitability | Low |
| EG13 | No academic treatment of cross-bookmaker odds latency as function of API type | Low |
| EG14 | No study on DeFi prediction market cross-platform arbitrage | Low (nascent market) |

---

## SECTION 21 — RECOMMENDED NEXT RESEARCH

Based on this academic sweep, the evidence gap is clear: the academic literature confirms opportunity existence but does not address modern execution feasibility. The next research step must shift from literature search to operational evidence collection.

### Next Step: Deep Research Venue and API Rule Audit

**Recommended next research mode: Deep Research venue/API/rule audit**

Specifically:

1. **Venue rule audit** — Systematically collect and record the rule versions, settlement terms, void conditions, and retirement policies for the top 10 bookmakers and Betfair/Smarkets/Matchbook. This must be done from primary source (bookmaker help pages, terms and conditions) not secondary sources.

2. **API capability audit** — Document the odds-delivery mechanism (stream vs polling), typical latency, maximum stake sizes queryable via API, and account-restriction detection signals for each venue.

3. **Odds history acquisition** — Identify which free or accessible historical odds datasets cover the target sports and venues (The Odds Portal, football-data.co.uk, historical Betfair data). No actual betting; read-only data acquisition for surebet frequency and margin estimation.

4. **Account-restriction documentation** — Research publicly documented account-restriction practices per bookmaker to estimate Layer 6 execution survival rate before any paper-trading infrastructure is built.

5. **Post-2021 frequency check** — If access to a multi-bookmaker odds API (e.g., The Odds API) can be obtained in read-only mode, run a 30-day frequency audit on the top 3 sports to determine whether the Gómez-González & del Corral (2018) finding (increasing surebet frequency) has continued or reversed.

**The academic phase is complete. The next phase is venue-level operational evidence collection, read-only, no real-money execution.**

---

## SECTION 22 — FINAL CLASSIFICATION

### Classification: `surebet_theory_positive_execution_evidence_missing`

**Justification:** The theoretical case for surebets is sound and academically well-established. Franck et al. (2012) demonstrate 19.2% of football matches carry guaranteed-positive inter-market arb at the quoted level. Gómez-González & del Corral (2018) show this frequency is increasing. The mathematical foundations are robust.

However, Grant et al. (2018) demonstrate that **bookmaker management practices prevent execution in approximately 50% of identified cases**, particularly where the favourable leg is at a position-taker bookmaker. Moskowitz (2021) demonstrates that transaction costs prevent arbitrage from eliminating anomalies even in liquid sports markets. Kaunitz et al. (2017) demonstrate that a profitable historical simulation becomes unprofitable once accounts are restricted.

The gap between quoted arbitrage and executable arbitrage is the primary unresolved question. No peer-reviewed study has demonstrated net-positive, fully-executed, account-restriction-adjusted surebet returns in a post-2015 market.

### Summary Decision Table

| Decision item | Answer |
|--------------|--------|
| Surebet deserves future paper-trading module? | **Yes — as a mispricing detector, not a core strategy** |
| Core strategy or auxiliary mispricing detector? | **Auxiliary mispricing detector; possibly secondary strategy if execution survives venue audit** |
| Top 5 sports to study | Football, Basketball (NBA), American Football (NFL), Tennis (with retirement-rule controls), Darts |
| Top 5 market types | Two-way moneyline, Three-way match result (football), Exchange back/lay, Draw-no-bet, Asian Handicap (whole-line) |
| Preferred arbitrage structure | **Bookmaker–exchange back/lay** (most academically evidenced; cleaner settlement; Betfair as price-discovery venue) |
| Minimum required profit buffer | **1.0% post-cost** (theory); **3.0% observable margin** (before filtering) to have sufficient post-cost residual |
| Major blockers | (1) Account restriction by position-taker bookmakers; (2) Stake limits below required allocation; (3) Odds movement between detection and execution; (4) Rule normalization complexity |
| Next research mode | **Deep Research venue/API/rule audit** |

---

## APPENDIX A — FULL PAPER LIST (Sorted by Citation Count)

| # | Title | Authors | Year | Cites | DOI |
|---|-------|---------|------|-------|-----|
| 1 | Anomalies: Parimutuel Betting Markets: Racetracks and Lotteries | Thaler, Ziemba | 1988 | 629 | 10.1257/jep.2.2.161 |
| 2 | The value of statistical forecasts in the UK association football betting market | Dixon, Pope | 2004 | 104 | 10.1016/j.ijforecast.2003.12.007 |
| 3 | How efficient is the European football betting market? Evidence from arbitrage and trading strategies | Vlastakis, Dotsis, Markellos | 2008 | 99 | 10.1002/for.1085 |
| 4 | Asset Pricing and Sports Betting | Moskowitz | 2021 | 51 | 10.1111/jofi.13082 |
| 5 | EXPECTED VALUES AND VARIANCES IN BOOKMAKER PAYOUTS | Cortis | 2015 | 40 | 10.5750/jpm.v9i1.987 |
| 6 | Inter‐market Arbitrage in Betting | Franck, Verbeek, Nüesch | 2012 | 38 | 10.1111/ecca.12009 |
| 7 | Profiting from arbitrage and odds biases of the European football gambling market | Constantinou, Fenton | 2013 | 35 | 10.5750/jgbe.v7i2.630 |
| 8 | Adjusting Bookmaker's Odds to Allow for Overround | Clarke | 2017 | 13 | 10.11648/j.ajss.20170506.12 |
| 9 | New entry, strategic diversity and efficiency in soccer betting markets | Grant et al. | 2018 | 10 | 10.1080/1351847x.2018.1443148 |
| 10 | Efficiency characteristics of a market for state contingent claims | Bruce, Johnson | 2001 | 9 | 10.1080/00036840110052785 |
| 11 | Beating the bookies with their own numbers | Kaunitz, Zhong, Kreiner | 2017 | 8 | 10.48550/arxiv.1710.02824 |
| 12 | An assessment of quasi-arbitrage opportunities in two fixed-odds horse-race betting markets | Smith, Paton, Vaughan Williams | 2005 | 7 | 10.1017/cbo9780511493614.005 |
| 13 | Jai Alai arbitrage strategies | Lane, Ziemba | 2004 | 6 | 10.1080/1351847042000254239 |
| 14 | Systematic Positive Expected Returns in the UK Fixed Odds Betting Market | Buraimo, Peel | 2013 | 6 | 10.3390/ijfs1040168 |
| 15 | The betting market over time: overround and surebets in European football | Gómez-González, del Corral | 2018 | 5 | 10.17811/ebl.7.4.2018.129-136 |
| 16 | Inter-market Arbitrage in Sports Betting (working paper) | Franck, Verbeek, Stephan | 2009 | 4 | — |
| 17 | Betting Markets: Defining odds restrictions | Cortis | 2016 | 1 | — |
| 18 | Three essays in applied economics: on exploiting arbitrage | Herzog | 2015 | 0 | 10.5451/unibas-006356910 |
| 19 | Abnormal returns in an efficient market? | Tiitu | 2016 | 0 | — |

---

## APPENDIX B — FEE AND FRICTION MATRIX

| Venue type | Commission type | Typical rate | Applies to | Effect on S |
|-----------|----------------|-------------|-----------|------------|
| Traditional bookmaker | Margin in odds | 3–12% | All bets (via overround) | Raises S above 1 for single-venue bets |
| Betfair Exchange | Net winnings commission | 2–7.5% (default 5%) | Exchange winners | Reduces effective lay odds |
| Matchbook / Smarkets | Net winnings commission | 1–2% | Exchange winners | Lower than Betfair; favourable |
| Betfair Premium Charge | Additional net winnings charge | 20–60% | High-profit accounts | Can eliminate arb profitability entirely |
| Betting duty (UK) | POC tax | 15% (on gross margin) | Paid by bookmaker | Embedded in odds; not directly additive |
| Betting duty (Germany) | Turnover tax | 5% of stake | Customer or bookmaker | 5% adds directly to S if passed to bettor |
| Blockchain gas (Ethereum) | Fixed + variable gas | $0.10–$50 per tx | On-chain bettors | Destroys small-stake arb; must be included |
| FX conversion | Bid-ask spread | 0.1–1% | Cross-currency venues | Adds to S; multiplicative |
| Withdrawal fee | Fixed | £0–£10 per withdrawal | Transfer-based costs | Amortise over expected transactions |

---

*Document generated: 2026-06-18*  
*Research basis: OpenAlex academic database, 80 queries, 287 relevant papers reviewed*  
*Status: Research only — no real-money execution authorised*  
*Repository: betting-win (private)*
