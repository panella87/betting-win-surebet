# 011 — Validation matrix

SURE-001 acceptance requires:

```bash
npm run typecheck
npm test
python3 scripts/validate_repo.py
python3 scripts/validate_contract_boundary.py
python3 scripts/validate_no_provider_connections.py
python3 scripts/validate_no_execution_paths.py
python3 scripts/validate_fixture_integrity.py
```

The validators are part of the product boundary. Weakening them requires an explicit ADR.
