# SSH and artifact-pull configuration

Current helper contract: `pull_artifacts_and_zip_codebase.sh` uses `sshpass` and reads explicit connection settings from environment first, then `.env`. It does not use `automation.config.sh` and it has no default remote host.

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

Default flow:

```bash
./pull_artifacts_and_zip_codebase.sh
```

The helper downloads server `artifacts.zip` to the next local numbered `artifactsN.zip`, then calls `bash ./zip_codebase.sh` to create the local codebase zip. It does not mutate the remote repo.

SSH key setup can still be useful for manual operator access, but it is not the active contract for this helper unless the script is explicitly changed in a future automation-maintenance task. Do not document key-only usage as the current pull-helper behavior.
