# Paper evaluation rules: betting-win-surebet

`run-paper-evaluation.sh` is the canonical private paper-mode supervisor. Default
duration is 72h.

Canonical commands:

```bash
./run-paper-evaluation.sh
./run-paper-evaluation.sh --adaptive
./run-paper-evaluation.sh --duration 72h --interval 30m
```

This repo has repo-local paper support enabled for repo-local private paper-mode smoke only:

```text
PAPER_SUPPORTED=1
paper_input=tests/fixtures/local-only-export-bundles/solver-ready-resource-export.json
paper_output=artifacts/private-paper-mode/standard-paper-evaluation-*.report.json
provider_connections=prohibited
execution=prohibited
accepted=false_for_private_fixture_reports
real_upstream_evaluation=blocked_until_federico_pinned_betting_win_interface
```

The command is configured in `automation.config.sh`. It runs a local fixture report,
collects logs and health checks, detects crash/error signatures, invokes
`./run-autonomous-bugfix.sh --from-artifacts <cycle-dir>` when bugs are detected,
and then resumes paper evaluation.

`--adaptive` is preserved. Codex receives a paper-health packet and may recommend
only the next wait interval between cycles. The shell clamps the wait to 5..60
minutes and never lets Codex supply arbitrary commands.

A blocked private paper report is not a live opportunity and not a near-success.
It is negative evidence. Preserve the artifact, inspect blockers, and do not loosen
validation.
