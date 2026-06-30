# 012 — Runbook

## Bootstrap

```bash
npm install
npm run validate
```

## Expected state after SURE-001

```text
repo skeleton = present
no-provider validator = passing
no-execution validator = passing
contract boundary validator = passing
solver = blocked until SURE-004
simulation = blocked until SURE-005
settlement replay = blocked until SURE-006
```

## Next required input

Provide the pinned `betting-win` contract/export interface before SURE-002 begins.
