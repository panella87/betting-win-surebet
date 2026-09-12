
# Documentation-package validation contract

The generator and transactional tooling must prove:

- exact five input hashes, safe 771-file BWS122 archive, repository identity, and Wave 04 authority;
- 47 unique tranches, 173 unique findings, eight stages, exact owners/severities/tests/environments, acyclic dependencies, T43 last, and all ten P0 findings in S1;
- exactly 47 canonical tranche packets and eight stage documents;
- all mandatory packet fields, 14 receipt contracts/schemas/examples, 14 proof-lane runbooks, six hold decision documents, and all required maps;
- JSON/JSON Schema parsing, example validation, local-link resolution, final newlines, no trailing whitespace, no secret-like example value, and no implementation patch/prompt;
- `PROPOSED_NOT_ACTIVE` for S0/T39, exact retained holds, and unchanged protected authority;
- overlay regular-file-only/path/mode/hash policy and no forbidden path;
- clean apply, exact idempotent apply, mixed-state rejection before write, forced validation failure rollback, empty-directory cleanup, dirty-Markdown preservation, 439 irrelevant dependency Markdown files ignored by canonical inventory, and no-`.git` fallback;
- all BWS122 non-Markdown paths and protected Markdown authority remain byte- and mode-identical;
- `SOURCE_MANIFEST.json` remains unchanged and is honestly classified stale.

The tooling must never use recursive filesystem Markdown discovery as authority. It uses Git-tracked Markdown plus exact overlay additions, or the archived BWS122 inventory when `.git` is absent.
