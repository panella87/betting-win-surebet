
# Hold register

| Hold | Current state | Documentation/source completion releases it? |
|---|---|---|
| BWS-600 | BLOCKED | no |
| BWS-710 | BLOCKED | no |
| BWS-900 | PARKED_NOT_AUTHORIZED | no |
| release | BLOCKED | no |
| deployment | BLOCKED | no |
| live execution | PROHIBITED | no |

Each decision contract is under `holds/`. A hold-release receipt must bind the accepted immutable generation graph and the exact required environment and external evidence. Missing, caller-asserted, fixture, mock, declaration-only, stale, or wrong-generation evidence retains the hold.
