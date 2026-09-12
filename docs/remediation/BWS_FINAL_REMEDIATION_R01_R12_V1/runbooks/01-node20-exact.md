
# Exact Node 20.20.2 activation and verification

## Scope

Every tranche with Node build, test, CLI, validator, controller, or runtime evidence.

## Prerequisites

- admitted tranche receipt
- NVM installation or an independently verified Node v20.20.2 binary
- no service/controller start

## Safety boundary

- Run only after the relevant tranche is explicitly admitted.
- Ordinary diagnostic commands are bounded to 120 seconds.
- Commands are Linux/WSL compatible, repository-local where possible, and return control to the invoking shell.
- No command starts a current autonomous controller, deploys, migrates a persistent database, controls an unrelated service, exposes a secret in argv, or accesses `betting-win`.
- Disposable or managed environment actions are explicitly operator-run and are not executed by this documentation task.

## Procedure

1. Load the repository-approved Node mechanism in a subshell.
2. Require `node --version` to equal `v20.20.2` byte-for-byte.
3. Capture `command -v node`, Node version, npm version, platform, architecture, and binary SHA-256.
4. Bind the runtime evidence to every test/environment receipt.
5. Reject Node 22 as acceptance even when results pass.

## Bounded diagnostic example

```bash
(
  set -Eeuo pipefail
  repo="${REPO_DIR:?REPO_DIR is required}"
  test -d "$repo" && cd "$repo"
  test -s "$HOME/.nvm/nvm.sh"
  . "$HOME/.nvm/nvm.sh"
  timeout 120s nvm use 20.20.2 >/dev/null
  test "$(node --version)" = "v20.20.2"
  timeout 120s command -v node
  timeout 120s sha256sum "$(command -v node)"
  timeout 120s npm --version
)
```


## External/managed action boundary

none

## Receipt output

Record the exact consumed source/config/process/test/environment generations, command or operator action identity, start/end clocks, result, evidence digests, cleanup result, unresolved blockers, retained holds, owner/reviewer, and parent/previous receipt digests. A listed but unexecuted procedure is not proof.
