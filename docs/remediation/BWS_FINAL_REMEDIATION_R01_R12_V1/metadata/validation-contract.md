# Documentation-package validation contract

Current validation must prove:

- BWS125 is the exact documentation-aligned repository snapshot and contains no accepted remediation source result;
- the BWS122 finding/dependency baseline, 47 tranches, 173 findings, eight stages, owners, severities, test counts, environments, acyclic DAG, T43-last rule, and P0 corridor remain unchanged;
- `activation/immutable-authority.sha256` and the activation static validator pass;
- T39 is `ADMITTED`, every other tranche is `NOT_ADMITTED`, and no packet claims source completion or acceptance;
- all remediation JSON and JSON Schema documents parse and all receipt examples validate;
- every local Markdown link resolves and every inventory record matches its current path, mode, classification, and content hash;
- executable command documentation matches the actual scripts, including the current explicit-interval limitation in `run-paper-evaluation.sh`;
- BWS-600, BWS-710, BWS-900, release, deployment, and live execution remain blocked, parked, or prohibited;
- `SOURCE_MANIFEST.json` remains stale and unchanged until T40, with current drift recorded rather than hidden;
- the invalid repository file `schemas/bws-release-manifest.v1.schema.json` is reported as a source/schema residual and is not represented as valid evidence;
- no application, test, fixture, migration, schema, validator, controller, runtime configuration, database, service, deployment, Git, or `betting-win` action occurs during documentation alignment.

The original `PROPOSED_NOT_ACTIVE` S0 records and examples remain historical/test material. They are not the current T39 state.
