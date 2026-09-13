#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

PROGRAM = "BWS_FINAL_REMEDIATION_R01_R12_V1"
HOLDS = {
    "BWS-600": "BLOCKED",
    "BWS-710": "BLOCKED",
    "BWS-900": "PARKED_NOT_AUTHORIZED",
    "deployment": "BLOCKED",
    "live_execution": "PROHIBITED",
    "release": "BLOCKED",
}


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load(path: Path) -> dict:
    if not path.is_file() or path.is_symlink():
        fail(f"missing or unsafe JSON file: {path}")
    try:
        value = json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"invalid JSON {path}: {exc}")
    if not isinstance(value, dict):
        fail(f"expected JSON object: {path}")
    return value


def digest(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def atomic_write(path: Path, value: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(value, indent=2, sort_keys=True) + "\n").encode()
    fd, tmp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as handle:
            handle.write(data)
            handle.flush()
            os.fsync(handle.fileno())
        os.chmod(tmp_name, 0o600)
        os.replace(tmp_name, path)
    finally:
        try:
            os.unlink(tmp_name)
        except FileNotFoundError:
            pass


def root_from_script() -> Path:
    script = Path(__file__).resolve()
    # docs/remediation/PROGRAM/activation/validator -> repository root
    return script.parents[4]


def paths(repo: Path) -> tuple[Path, Path, Path, Path]:
    activation = repo / "docs" / "remediation" / PROGRAM / "activation"
    plan = activation / "unattended-plan.json"
    seed = activation / "campaign-state.seed.json"
    artifact_root = repo / "artifacts" / "remediation_campaign" / PROGRAM
    state = artifact_root / "campaign-state.json"
    return activation, plan, seed, state


def plan_entries(plan: dict) -> list[dict]:
    entries = plan.get("tranches")
    if not isinstance(entries, list) or len(entries) != 47:
        fail("unattended plan must contain exactly 47 tranches")
    return entries


def validate_static(repo: Path) -> None:
    activation, plan_path, seed_path, _ = paths(repo)
    plan = load(plan_path)
    seed = load(seed_path)
    if plan.get("program_id") != PROGRAM or plan.get("activation_state") != "ACTIVE":
        fail("plan program or activation state mismatch")
    if seed.get("program_id") != PROGRAM or seed.get("activation_state") != "ACTIVE":
        fail("seed program or activation state mismatch")
    entries = plan_entries(plan)
    orders = [e.get("campaign_order") for e in entries]
    if orders != list(range(1, 48)):
        fail("campaign orders must be exactly 1..47")
    ids = [e.get("tranche_id") for e in entries]
    if len(set(ids)) != 47:
        fail("tranche IDs must be unique")
    by_id = {e["tranche_id"]: e for e in entries}
    for entry in entries:
        for dep in entry.get("dependencies", []):
            full = dep if dep.startswith("BWS-") else next((x for x in ids if x.endswith(f"-{dep}")), None)
            if full is None or full not in by_id:
                fail(f"unknown dependency {dep} for {entry['tranche_id']}")
            if by_id[full]["campaign_order"] >= entry["campaign_order"]:
                fail(f"non-predecessor dependency {dep} for {entry['tranche_id']}")
        task = repo / entry["task_path"]
        if not task.is_file() or task.is_symlink():
            fail(f"missing or unsafe task file: {entry['task_path']}")
        text = task.read_text(encoding="utf-8")
        required = [
            f"program_id={PROGRAM}",
            f"tranche_id={entry['tranche_id']}",
            f"campaign_order={entry['campaign_order']}",
            f"stage={entry['stage']}",
            f"result_path={entry['result_path']}",
        ]
        for marker in required:
            if marker not in text:
                fail(f"task {entry['task_path']} missing marker {marker}")
        for key in ("automation_maintenance_allowed", "allowed_protected_files"):
            if len(re.findall(rf"^{re.escape(key)}=", text, re.M)) != 1:
                fail(f"task {entry['task_path']} must contain exactly one {key} marker")
        expected_allowed = ",".join(entry.get("allowed_protected_files", [])) or "none"
        if f"allowed_protected_files={expected_allowed}" not in text:
            fail(f"task protected allowlist mismatch: {entry['tranche_id']}")
        expected_mode = "DIRECT_BOUNDED_CODEX" if entry["campaign_order"] <= 13 else "REPAIRED_IMPLEMENTATION_CONTROLLER"
        if entry.get("execution_mode") != expected_mode:
            fail(f"execution mode mismatch: {entry['tranche_id']}")
    print("BWS_REMEDIATION_ACTIVATION_STATIC_OK")


def git_capture(repo: Path) -> dict:
    def run(*args: str) -> str | None:
        try:
            cp = subprocess.run(args, cwd=repo, check=True, text=True, stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30)
            return cp.stdout.strip() or None
        except Exception:
            return None
    status = run("git", "status", "--porcelain=v1", "--untracked-files=all")
    return {
        "commit": run("git", "rev-parse", "HEAD"),
        "branch": run("git", "branch", "--show-current"),
        "upstream": run("git", "rev-parse", "--abbrev-ref", "--symbolic-full-name", "@{u}"),
        "worktree_status_sha256": hashlib.sha256((status or "").encode()).hexdigest(),
    }


def init_state(repo: Path) -> None:
    _, _, seed_path, state_path = paths(repo)
    if state_path.exists():
        state = load(state_path)
        if state.get("program_id") != PROGRAM or state.get("activation_state") != "ACTIVE":
            fail("existing live campaign state has wrong identity")
        print(f"BWS_REMEDIATION_STATE_PRESENT={state_path}")
        return
    state = load(seed_path)
    state["created_at"] = datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
    state["clock_authority"] = "UTC_SYSTEM_CLOCK_AT_OPERATOR_LAUNCH"
    state["initial_git"] = git_capture(repo)
    atomic_write(state_path, state)
    print(f"BWS_REMEDIATION_STATE_INITIALIZED={state_path}")


def resolve_dependency_id(dep: str, entries: list[dict]) -> str:
    if dep.startswith("BWS-"):
        return dep
    matches = [e["tranche_id"] for e in entries if e["tranche_id"].endswith(f"-{dep}")]
    if len(matches) != 1:
        fail(f"cannot resolve dependency {dep}")
    return matches[0]


def validate_state(plan: dict, state: dict) -> None:
    if state.get("program_id") != PROGRAM or state.get("activation_state") != "ACTIVE":
        fail("live state identity mismatch")
    accepted = state.get("accepted_tranches")
    if not isinstance(accepted, list) or len(accepted) != len(set(accepted)):
        fail("accepted tranche list invalid")
    entries = plan_entries(plan)
    expected_prefix = [e["tranche_id"] for e in entries[: len(accepted)]]
    if accepted != expected_prefix:
        fail("accepted tranches are not an exact campaign-order prefix")
    if state.get("last_accepted_order") != len(accepted):
        fail("last accepted order does not match accepted prefix")
    current = state.get("current")
    if len(accepted) == 47:
        if current is not None or state.get("terminal_state") != "COMPLETE":
            fail("complete state is malformed")
    else:
        expected = entries[len(accepted)]
        if not isinstance(current, dict):
            fail("missing current tranche")
        for key in ("campaign_order", "tranche_id", "stage"):
            if current.get(key) != expected.get(key):
                fail(f"live current {key} mismatch")
        if current.get("state") not in ("ADMITTED", "BLOCKED"):
            fail("live current state must be ADMITTED or BLOCKED")
    if bool(state.get("controller_eligible")) != (len(accepted) >= 13):
        fail("controller eligibility does not match S2 acceptance")


def next_task(repo: Path) -> None:
    activation, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_state(plan, state)
    if state.get("terminal_state") == "COMPLETE":
        print("COMPLETE")
        return
    current = state["current"]
    if current["state"] == "BLOCKED":
        fail(f"campaign is blocked at {current['tranche_id']}")
    entry = plan_entries(plan)[current["campaign_order"] - 1]
    print("\t".join([
        str(entry["campaign_order"]),
        entry["tranche_id"],
        entry["stage"],
        entry["execution_mode"],
        str(repo / entry["task_path"]),
        str(repo / entry["result_path"]),
    ]))


def validate_result(repo: Path, tranche_id: str) -> tuple[dict, dict, Path]:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_state(plan, state)
    entries = plan_entries(plan)
    matches = [e for e in entries if e["tranche_id"] == tranche_id]
    if len(matches) != 1:
        fail(f"unknown tranche result request: {tranche_id}")
    entry = matches[0]
    current = state.get("current")
    if not isinstance(current, dict) or current.get("tranche_id") != tranche_id or current.get("state") != "ADMITTED":
        fail(f"tranche is not the unique admitted current tranche: {tranche_id}")
    accepted_set = set(state.get("accepted_tranches", []))
    for dep in entry.get("dependencies", []):
        resolved = resolve_dependency_id(dep, entries)
        if resolved not in accepted_set:
            fail(f"dependency is not accepted: {resolved}")
    result_path = repo / entry["result_path"]
    result = load(result_path)
    exact = {
        "program_id": PROGRAM,
        "record_type": "tranche-result",
        "tranche_id": tranche_id,
        "campaign_order": entry["campaign_order"],
        "stage": entry["stage"],
        "owner": entry["owner"],
        "state": "ACCEPTED",
        "finding_ids": entry["finding_ids"],
        "retained_holds": HOLDS,
        "all_internal_requirements_closed": True,
    }
    for key, expected in exact.items():
        if result.get(key) != expected:
            fail(f"result {tranche_id} field {key} mismatch")
    if result.get("unresolved_blockers") != []:
        fail(f"accepted result has unresolved blockers: {tranche_id}")
    if result.get("node_runtime_identity") != "v20.20.2":
        fail(f"accepted result lacks exact Node v20.20.2: {tranche_id}")
    tests = result.get("test_commands_and_results")
    if not isinstance(tests, list):
        fail(f"result tests are not a list: {tranche_id}")
    if len(tests) < entry["test_requirement_count"]:
        fail(f"result has fewer test executions than required: {tranche_id}")
    requirement_ids = []
    production_count = 0
    for item in tests:
        if not isinstance(item, dict) or item.get("status") != "PASSED" or item.get("exit_code") != 0:
            fail(f"result contains non-passing test: {tranche_id}")
        rid = item.get("test_requirement_id")
        if not isinstance(rid, str) or not rid:
            fail(f"result contains missing test requirement id: {tranche_id}")
        requirement_ids.append(rid)
        if item.get("production_entrypoint") is True:
            production_count += 1
        if item.get("node_version") not in ("v20.20.2", None):
            fail(f"result contains wrong Node test identity: {tranche_id}")
    if len(requirement_ids) != len(set(requirement_ids)):
        fail(f"result contains duplicate test requirement IDs: {tranche_id}")
    if production_count < entry["production_entrypoint_test_count"]:
        fail(f"result has insufficient production-entrypoint proof: {tranche_id}")
    proofs = result.get("proof_environments")
    if not isinstance(proofs, list):
        fail(f"result proof environments are not a list: {tranche_id}")
    proof_lanes = set()
    for proof in proofs:
        if not isinstance(proof, dict):
            fail(f"invalid proof environment record: {tranche_id}")
        lane = proof.get("lane")
        if not isinstance(lane, str) or not lane:
            fail(f"proof environment is missing its lane: {tranche_id}")
        proof_lanes.add(lane)
        if proof.get("result") != "PASSED":
            fail(f"non-passing proof environment: {tranche_id}:{lane}")
        if proof.get("cleanup_result") not in ("PASSED", "NOT_REQUIRED"):
            fail(f"proof environment cleanup is not accepted: {tranche_id}:{lane}")
    expected_lanes = set(entry.get("test_environments", {}).keys())
    if not expected_lanes.issubset(proof_lanes):
        missing = sorted(expected_lanes - proof_lanes)
        fail(f"result is missing required proof lanes for {tranche_id}: {missing}")
    changed = result.get("changed_paths")
    if not isinstance(changed, list):
        fail(f"result changed_paths is not a list: {tranche_id}")
    forbidden = (".git/", "node_modules/", "artifacts/", ".env", "betting-win/")
    immutable_prefix = f"docs/remediation/{PROGRAM}/activation/"
    for item in changed:
        if not isinstance(item, dict) or not isinstance(item.get("path"), str):
            fail(f"invalid changed path record: {tranche_id}")
        path = item["path"]
        if path.startswith("/") or ".." in Path(path).parts:
            fail(f"unsafe changed path: {path}")
        if path.startswith(forbidden):
            fail(f"forbidden changed path in result: {path}")
        if path.startswith(immutable_prefix):
            fail(f"immutable activation authority changed by tranche: {path}")
    if entry["external_acceptance_pending"]:
        # ACCEPTED remains legal only when external evidence was actually present and no hold was promoted.
        if result.get("retained_holds") != HOLDS:
            fail(f"external-pending tranche changed retained holds: {tranche_id}")
    return entry, result, result_path


def check_result(repo: Path, tranche_id: str) -> None:
    _, _, path = validate_result(repo, tranche_id)
    print(f"BWS_REMEDIATION_TRANCHE_RESULT_ACCEPTED={tranche_id}:{digest(path)}")


def advance(repo: Path, tranche_id: str) -> None:
    entry, _, result_path = validate_result(repo, tranche_id)
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    accepted = state["accepted_tranches"] + [tranche_id]
    receipt_sha = digest(result_path)
    state["accepted_tranches"] = accepted
    state["last_accepted_order"] = entry["campaign_order"]
    state["history"].append({
        "accepted_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "campaign_order": entry["campaign_order"],
        "result_path": entry["result_path"],
        "result_sha256": receipt_sha,
        "tranche_id": tranche_id,
    })
    entries = plan_entries(plan)
    if len(accepted) == 47:
        state["current"] = None
        state["terminal_state"] = "COMPLETE"
        state["controller_eligible"] = True
    else:
        nxt = entries[len(accepted)]
        state["current"] = {
            "campaign_order": nxt["campaign_order"],
            "tranche_id": nxt["tranche_id"],
            "stage": nxt["stage"],
            "state": "ADMITTED",
        }
        state["controller_eligible"] = len(accepted) >= 13
    atomic_write(state_path, state)
    print(f"BWS_REMEDIATION_CAMPAIGN_ADVANCED={tranche_id}:{entry['campaign_order']}")


def check_s2(repo: Path) -> None:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_state(plan, state)
    expected = [e["tranche_id"] for e in plan_entries(plan)[:13]]
    if state.get("accepted_tranches", [])[:13] != expected or state.get("last_accepted_order", 0) < 13:
        fail("S2 is not fully accepted")
    if state.get("controller_eligible") is not True:
        fail("controller eligibility is not true after S2")
    for entry in plan_entries(plan)[:13]:
        result_path = repo / entry["result_path"]
        result = load(result_path)
        if result.get("state") != "ACCEPTED":
            fail(f"S2 result not accepted: {entry['tranche_id']}")
    print("BWS_REMEDIATION_S2_CONTROLLER_GATE_ACCEPTED")


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", default=None)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--static", action="store_true")
    group.add_argument("--init-state", action="store_true")
    group.add_argument("--next-task", action="store_true")
    group.add_argument("--result")
    group.add_argument("--advance")
    group.add_argument("--s2", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve() if args.repo else root_from_script()
    if not (repo / "package.json").is_file():
        fail(f"repository root invalid: {repo}")
    if args.static:
        validate_static(repo)
    elif args.init_state:
        init_state(repo)
    elif args.next_task:
        next_task(repo)
    elif args.result:
        check_result(repo, args.result)
    elif args.advance:
        advance(repo, args.advance)
    elif args.s2:
        check_s2(repo)


if __name__ == "__main__":
    main()
