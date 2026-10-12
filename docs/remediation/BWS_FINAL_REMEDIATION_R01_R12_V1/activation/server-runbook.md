# Server launch contract

Target repository: `$HOME/app_testing/betting-win-surebet`.

Before T39 is accepted, `update_git.sh` is itself inside the admitted correction boundary. Bootstrap synchronization therefore uses a strict, non-interactive, fast-forward-only Git update without mutating repository Git configuration. SSH remotes require an already pinned host key and batch authentication; missing trust or credentials stop the launch.

## Exact foreground launch

Run this command on the server from a persistent operator session. For a first launch it performs a clean, strict fetch and fast-forward update. For a resumed campaign it refuses to change Git authority and requires `HEAD` to remain equal to the commit recorded in campaign state.

```bash
(
  set -Eeuo pipefail
  umask 077

  repo="$HOME/app_testing/betting-win-surebet"
  state="$repo/artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json"

  fail() {
    printf 'ERROR: %s\n' "$*" >&2
    return 1
  }

  [[ -d "$repo/.git" && ! -L "$repo" ]] ||
    fail "repository missing or unsafe: $repo"

  cd "$repo"

  if [[ -e "$state" || -L "$state" ]]; then
    [[ -f "$state" && ! -L "$state" ]] ||
      fail "campaign state is not a safe regular file: $state"

    admitted_commit="$(python3 - "$state" <<'PY_STATE'
import json
import re
import sys

with open(sys.argv[1], encoding='utf-8') as handle:
    value = json.load(handle).get('initial_git', {}).get('commit')

if not isinstance(value, str) or re.fullmatch(r'(?:[0-9a-f]{40}|[0-9a-f]{64})', value) is None:
    raise SystemExit(2)

print(value)
PY_STATE
    )" || fail 'campaign state has no valid initial Git commit'

    [[ "$(git rev-parse --verify HEAD)" == "$admitted_commit" ]] ||
      fail 'current HEAD differs from the admitted campaign commit; do not delete or replace campaign state'
  else
    [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] ||
      fail 'first campaign launch requires a clean worktree and index'

    branch="$(git symbolic-ref --quiet --short HEAD)" ||
      fail 'repository is not on a local branch'
    remote="$(git config --get "branch.$branch.remote")" ||
      fail "branch has no configured remote: $branch"
    [[ -n "$remote" && "$remote" != '.' ]] ||
      fail "branch remote is invalid for strict synchronization: $remote"

    upstream_ref="$(git rev-parse --verify --symbolic-full-name '@{upstream}')" ||
      fail "branch has no valid upstream: $branch"
    [[ "$upstream_ref" == refs/remotes/* ]] ||
      fail "upstream is not a remote-tracking ref: $upstream_ref"

    GIT_TERMINAL_PROMPT=0 \
    GIT_SSH_COMMAND='ssh -o BatchMode=yes -o StrictHostKeyChecking=yes' \
      timeout --foreground 120s git fetch --prune "$remote"

    git show-ref --verify --quiet "$upstream_ref" ||
      fail "fetched upstream ref is missing: $upstream_ref"
    git merge-base --is-ancestor HEAD "$upstream_ref" ||
      fail 'local HEAD is ahead of or diverged from the fetched upstream'
    timeout --foreground 120s git merge --ff-only "$upstream_ref"

    [[ -z "$(git status --porcelain=v1 --untracked-files=all)" ]] ||
      fail 'repository is not clean after fast-forward synchronization'
  fi

  [[ -s "$HOME/.nvm/nvm.sh" ]] ||
    fail "nvm loader missing: $HOME/.nvm/nvm.sh"

  set +u
  if ! . "$HOME/.nvm/nvm.sh"; then
    set -u
    fail 'failed to load nvm runtime'
  fi
  if ! nvm use 20.20.2 >/dev/null; then
    set -u
    fail 'Node 20.20.2 is not installed or could not be selected'
  fi
  set -u

  [[ "$(node --version)" == 'v20.20.2' ]] ||
    fail "exact Node v20.20.2 is required; observed $(node --version 2>/dev/null || printf missing)"

  BWS_CAMPAIGN_DURATION=7d \
  BWS_MODEL=cli-default \
  BWS_FALLBACK_MODEL=none \
    bash docs/remediation/BWS_FINAL_REMEDIATION_R01_R12_V1/activation/run-unattended-remediation-campaign.sh
)
```

The command never deletes campaign state, force-unlocks, changes Git configuration, stashes local work, resets, or starts a detached process. `StrictHostKeyChecking=yes` means an absent or mismatched SSH host key is a blocker; pin and verify the destination key independently before first contact.

A clean worktree and index are required only before the campaign state is first created. A resumed campaign may legitimately contain retained source deltas from its admitted or accepted tranches. Do not clean, reset, stash, or overwrite those deltas. The launcher validates the unchanged Git commit, branch, and upstream, then re-derives the exact current delta from retained preimages and receipts before continuing.

After synchronization, the operator activates exact Node `v20.20.2` and invokes `run-unattended-remediation-campaign.sh` in the foreground. The launcher initializes or resumes `artifacts/remediation_campaign/BWS_FINAL_REMEDIATION_R01_R12_V1/campaign-state.json`, obtains one kernel lock, captures one preimage per tranche, and processes exactly one admitted tranche at a time.

Orders 1 through 13 use repeated bounded direct Codex attempts. Every Codex process runs below `scripts/run_bounded_remediation_child.py`, which acts as a Linux child subreaper, clips the timeout to the persistent operator deadline, disables interactive or remote Git transport, removes inherited repository/SSH/database credential variables, and terminates only the owned process group and tracked descendants before the launcher validates state. An attempt that ends without a result may retry inside the same persisted operator window. A malformed candidate result is preserved under `invalid-results/`; the current source delta is rechecked against the original preimage before any retry. Existing controller locks stop pre-S2 work and are never deleted by this launcher.

The immutable checksum manifest is loaded from the Git commit captured when campaign state is first admitted. The launcher requires that commit, branch, and upstream to remain unchanged across every attempt and restart; changing Git refs or committing a replacement manifest cannot redefine acceptance. Campaign state, tranche-preimage digests, and the launcher lock's device/inode identity are retained and rechecked around every child and proof cycle.

Every complete candidate receipt is independently replayed by `scripts/validate_remediation_tranche_evidence.py`. The verifier executes each exact test argv in a scrubbed bounded process group, recomputes output digests and environment identities, checks for surviving owned descendants, records dynamically executed repository paths from Node V8 coverage, Python tracing, and Bash source tracing, retains `/proc` observations as diagnostics only, builds proof-lane receipts, and writes the trusted attestation required for advancement. Static filename mentions cannot satisfy production-entrypoint proof.

After all thirteen S1/S2 tranches are accepted and every historical result/preimage/attestation chain is revalidated, later tranches use the repaired `run-autonomous-implementation.sh` with one exact composite prompt and 72-hour child windows clipped to the persisted campaign deadline. The repaired controller is itself contained by the same subreaper with a reserved finalization margin. A state-only claim cannot enable the controller.

Default cumulative operator window: 28 days. The recommended bounded campaign command may set seven days. Pre-S2 attempt ceiling: 12 hours. Post-S2 controller attempt ceiling: 72 hours. Restarting does not reset the cumulative window.

No force unlock is attempted. The launcher returns to the same shell on completion, blocker, validation failure, deadline, or interruption. No existing controller is invoked before all thirteen S1/S2 results are accepted and the S2 verifier passes.
