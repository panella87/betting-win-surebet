# 039 - Release, deployment and upgrade contract

## Scope

This contract defines `BWS-590` and `BWS-591`.

## Release package

A release is a deterministic private deployment artifact containing:

- exact source commit or source-tree fingerprint;
- source manifest SHA-256;
- package-lock SHA-256;
- Node 20 requirement;
- built application and cockpit asset fingerprints;
- migration inventory and checksums;
- required executable file modes;
- release manifest and checksums;
- no `.env`, credentials, runtime state, database files or historical artifacts.

## Deployment templates

Provide non-privileged templates for operator-managed user services. Templates must:

- run from the canonical BWS repository or release directory;
- reference a private environment file path without embedding secrets;
- start only the product-owned full-stack lifecycle;
- preserve loopback binding;
- use restart policy only after exact process exit, not after manual stop;
- write logs and runtime state to explicit repo-owned or operator-selected paths;
- avoid automatic installation or service enablement during autonomous validation.

## Upgrade

Upgrade preflight must verify:

- current and target release identities;
- clean tracked source or exact release directory;
- backup and restore-verification evidence;
- migration compatibility;
- available disk space;
- no ambiguous active process ownership;
- explicit maintenance window decision when required.

The upgrade flow must drain work, stop the exact stack, apply migrations, start the target release, verify readiness and preserve evidence. It must not reset source, drop databases or silently continue after a failed migration.

## Rollback and recovery

Rollback is allowed only when migration compatibility and retained backup evidence prove it safe. Otherwise the system must remain stopped with a clear recovery plan.

Required proof covers interrupted deployment, failed readiness, failed migration, incompatible rollback, stale lifecycle state and restoration from the last verified backup into a disposable database.
