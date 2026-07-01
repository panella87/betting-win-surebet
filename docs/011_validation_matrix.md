# 011 — Validation matrix

SURE-001 acceptance requires:

```bash
npm run validate
npm run typecheck
npm test
python3 scripts/validate_repo.py
python3 scripts/validate_contract_boundary.py
python3 scripts/validate_no_provider_connections.py
python3 scripts/validate_no_execution_paths.py
python3 scripts/validate_fixture_integrity.py
python3 scripts/validate_master_plan.py
python3 scripts/validate_executable_bits.py
python3 scripts/validate_artifact_hygiene.py
python3 scripts/validate_node_runtime_loader.py
python3 scripts/validate_shell_local_assignments.py
```

The validators are part of the product boundary. Weakening them requires an explicit ADR.
