# SSH and artifact-pull configuration

Current helper contract: `pull_artifacts_and_zip_codebase.sh` uses `sshpass` and reads explicit connection settings from environment first, then `.env`. It does not use `automation.config.sh` and it has no default remote host. Its admitted pre-T39 executable preimage also sets `StrictHostKeyChecking=accept-new` and `BatchMode=no`.

## Pre-T39 host-trust boundary

Until T39 is accepted, do not use this helper to establish first contact with a destination. `SSH_PASSWORD` is reusable authentication material, so the destination host key must already be independently verified and pinned in the local SSH trust store before the helper is invoked. An absent or mismatched key is a blocker. Do not delete or bypass an existing host-key record to make the transfer proceed.

Required settings:

```text
SSH_HOST=...
SSH_USER=...
SSH_PASSWORD=...
REMOTE_REPO=/home/dev/app_testing/<repo-name>
```

Optional settings:

```text
REMOTE_ARTIFACT=/custom/path/artifacts.zip
ENV_FILE=/custom/path/.env
```

Default flow after the trust precondition above is satisfied:

```bash
./pull_artifacts_and_zip_codebase.sh
```

The helper downloads server `artifacts.zip` to the next local numbered `artifactsN.zip`, then calls `bash ./zip_codebase.sh` to create the local codebase zip. It does not mutate the remote repo.

SSH key setup can still be useful for manual operator access, but it is not the active contract for this helper unless the script is explicitly changed in a future automation-maintenance task. Do not document key-only usage as the current pull-helper behavior.
