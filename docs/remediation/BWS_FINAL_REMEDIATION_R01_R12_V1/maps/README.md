
# Finding, path, and dependency maps

- `finding-to-tranche.json` and `.tsv`: all 173 stable findings, one owning tranche each.
- `path-to-tranche.json`: candidate source paths, ownership sequence, test impact, and baseline evidence.
- `shared-path-locks.md`: all 66 campaign-map shared paths and serialization rules.
- `dependency-dag.json` and `.md`: 47 nodes, acyclic ordering, and T43 final closure.

Validated invariants: `unmapped_findings=0`, `duplicate_finding_owners=0`, `unknown_tranches=0`, `dependency_cycles=0`, `T43_is_last=yes`, `all_P0_findings_in_S1_corridor=yes`.
