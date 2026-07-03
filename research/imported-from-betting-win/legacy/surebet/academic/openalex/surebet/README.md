# Surebet academic research

This directory contains the raw Prompt 26 OpenAlex output and a reviewed audit layer.

The raw Markdown and JSON are preserved byte-for-byte as source artifacts. They are not canonical conclusions on their own.

Canonical gate:

```text
surebet_theory_positive_execution_evidence_missing
surebet_module_role = auxiliary_mispricing_detector_research_only
```

Important corrections:

- the raw query audit has 86 queries, not 80;
- 287 works passed a broad automated keyword filter and should not be described as 287 manually reviewed direct surebet papers;
- all eight citation-expansion targets were off-topic;
- working-paper/final versions must not be double-counted;
- the bookmaker-back/exchange-lay commission formula in the raw report requires the correction recorded in `surebet_prompt26_math_corrections.csv`;
- sport rankings, universal margin thresholds and kill thresholds are hypotheses until operationally calibrated.
