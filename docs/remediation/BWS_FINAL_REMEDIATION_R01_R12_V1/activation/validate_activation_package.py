#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import shlex
import shutil
import stat
import subprocess
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path, PurePosixPath
from typing import Any

PROGRAM = "BWS_FINAL_REMEDIATION_R01_R12_V1"
BASELINE_ARCHIVE = "betting-win-surebet122.zip"
BASELINE_SHA256 = "e303719e5ce64df47df7b0594433a8978e3b01c5a3d0d0bd9129b9b6340b20cd"
HOLDS = {
    "BWS-600": "BLOCKED",
    "BWS-710": "BLOCKED",
    "BWS-900": "PARKED_NOT_AUTHORIZED",
    "deployment": "BLOCKED",
    "live_execution": "PROHIBITED",
    "release": "BLOCKED",
}
TERMINAL_RESULT_STATES = {
    "ACCEPTED",
    "BLOCKED",
    "SOURCE_COMPLETE_EXTERNAL_PENDING",
}
HEX64 = re.compile(r"^[0-9a-f]{64}$")
GIT_OBJECT = re.compile(r"^(?:[0-9a-f]{40}|[0-9a-f]{64})$")
EXCLUDED_TREE_PARTS = {
    ".git",
    ".cache",
    ".mypy_cache",
    ".npm",
    ".pytest_cache",
    ".ruff_cache",
    ".turbo",
    ".venv",
    "__pycache__",
    "artifacts",
    "coverage",
    "dist",
    "node_modules",
    "venv",
}
ENV_TEMPLATE_NAMES = {
    ".env.dist",
    ".env.example",
    ".env.sample",
    ".env.template",
}
SECRET_COMPONENTS = {
    ".credentials",
    ".secrets",
    "credentials",
    "secrets",
}
SECRET_FILENAMES = {
    ".pgpass",
    "id_dsa",
    "id_ecdsa",
    "id_ed25519",
    "id_rsa",
    "known_hosts",
}
SECRET_SUFFIXES = {
    ".db",
    ".kdb",
    ".key",
    ".p12",
    ".pem",
    ".pfx",
    ".sqlite",
    ".sqlite3",
}
PROTECTED_AUTOMATION_FILES = {
    "zip_codebase.sh",
    "pull_artifacts_and_zip_codebase.sh",
    "update_git.sh",
    "check_progress.sh",
    "watch_progress.sh",
    "open_log.sh",
    "start.sh",
    "stop.sh",
    "run-autonomous-implementation.sh",
    "run-paper-evaluation.sh",
    "run-paper-autopilot.sh",
    "run-autonomous-bugfix.sh",
    "run-bugfix-autopilot.sh",
    "automation.config.sh",
    ".automation/lib/run_common.sh",
    ".automation/lib/controller_hardening_v2.sh",
    ".automation/lib/temp_inode_guard.sh",
    ".automation/lib/telegram_notify.sh",
    "cleanup_automation_temp_inode_residue.sh",
    "cleanup_automation_artifact_residue.sh",
    "docs/automation/PROTECTED_AUTOMATION_FILES.md",
}
REQUIRED_IMMUTABLE_AUTHORITY_PATHS = {
    "automation.config.sh",
    "docs/automation/PROTECTED_AUTOMATION_FILES.md",
    f"docs/remediation/{PROGRAM}/campaign-order.json",
    f"docs/remediation/{PROGRAM}/maps/dependency-dag.json",
    f"docs/remediation/{PROGRAM}/maps/finding-to-tranche.json",
    f"docs/remediation/{PROGRAM}/maps/path-to-tranche.json",
    f"docs/remediation/{PROGRAM}/schemas/tranche-result.schema.json",
    "docs/reviews/BWS121/wave-04/test-evidence-matrix.json",
    "scripts/validate_remediation_tranche_evidence.py",
    "scripts/run_bounded_remediation_child.py",
    "scripts/validate_repo.py",
}
TRUSTED_EVIDENCE_SCHEMA = "bws-remediation-trusted-evidence-v1"
TRIVIAL_EXECUTABLES = {"true", "false", "echo", "printf", "test", ":"}
FORBIDDEN_TEST_EXECUTABLES = {
    "sudo", "su", "ssh", "scp", "sftp", "rsync", "kill", "killall", "pkill",
    "reboot", "shutdown", "poweroff", "halt", "docker", "podman",
}
SUPPORT_PATH_PREFIXES = ("tests/", "scripts/", "schemas/", "docs/")


def fail(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def load(path: Path) -> dict[str, Any]:
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


def bytes_digest(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def canonical_digest(value: Any) -> str:
    data = json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")
    return bytes_digest(data)


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")


def parse_datetime(value: Any, label: str) -> None:
    if not isinstance(value, str) or not value:
        fail(f"{label} must be a non-empty RFC3339 timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        fail(f"{label} is not a valid timestamp: {exc}")
    if parsed.tzinfo is None:
        fail(f"{label} must include timezone authority")


def atomic_write(path: Path, value: dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    data = (json.dumps(value, indent=2, sort_keys=True) + "\n").encode("utf-8")
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
    return Path(__file__).resolve().parents[4]


def program_root(repo: Path) -> Path:
    return repo / "docs" / "remediation" / PROGRAM


def activation_root(repo: Path) -> Path:
    return program_root(repo) / "activation"


def campaign_artifact_root(repo: Path) -> Path:
    return repo / "artifacts" / "remediation_campaign" / PROGRAM


def paths(repo: Path) -> tuple[Path, Path, Path, Path]:
    activation = activation_root(repo)
    plan = activation / "unattended-plan.json"
    seed = activation / "campaign-state.seed.json"
    state = campaign_artifact_root(repo) / "campaign-state.json"
    return activation, plan, seed, state


def plan_entries(plan: dict[str, Any]) -> list[dict[str, Any]]:
    entries = plan.get("tranches")
    if not isinstance(entries, list) or len(entries) != 47 or not all(isinstance(x, dict) for x in entries):
        fail("unattended plan must contain exactly 47 tranche objects")
    return entries


def entry_by_id(plan: dict[str, Any], tranche_id: str) -> dict[str, Any]:
    matches = [entry for entry in plan_entries(plan) if entry.get("tranche_id") == tranche_id]
    if len(matches) != 1:
        fail(f"unknown or duplicate tranche identity: {tranche_id}")
    return matches[0]


def resolve_dependency_id(dep: str, entries: list[dict[str, Any]]) -> str:
    if dep.startswith("BWS-"):
        return dep
    matches = [e["tranche_id"] for e in entries if e["tranche_id"].endswith(f"-{dep}")]
    if len(matches) != 1:
        fail(f"cannot resolve dependency {dep}")
    return matches[0]


def parse_config_protected_files(repo: Path) -> set[str]:
    config = repo / "automation.config.sh"
    if not config.is_file() or config.is_symlink():
        fail("automation.config.sh is missing or unsafe")
    text = config.read_text(encoding="utf-8")
    match = re.search(r"(?ms)^AUTOMATION_PROTECTED_FILES=\(\s*(.*?)^\)", text)
    if match is None:
        fail("automation.config.sh lacks AUTOMATION_PROTECTED_FILES")
    try:
        values = shlex.split(match.group(1), comments=True, posix=True)
    except ValueError as exc:
        fail(f"cannot parse AUTOMATION_PROTECTED_FILES: {exc}")
    if not values or len(values) != len(set(values)):
        fail("AUTOMATION_PROTECTED_FILES is empty or contains duplicates")
    return set(values)


def immutable_authority_paths(repo: Path) -> set[str]:
    checksum = activation_root(repo) / "immutable-authority.sha256"
    if not checksum.is_file() or checksum.is_symlink():
        fail("immutable authority checksum file is missing or unsafe")
    paths: set[str] = set()
    for line in checksum.read_text(encoding="utf-8").splitlines():
        if not line.strip():
            continue
        match = re.fullmatch(r"([0-9a-f]{64})  ([^\n]+)", line)
        if match is None:
            fail(f"malformed immutable authority checksum line: {line!r}")
        relative = match.group(2)
        if relative in paths:
            fail(f"duplicate immutable authority path: {relative}")
        paths.add(relative)
    return paths


def trusted_evidence_path(repo: Path, entry: dict[str, Any]) -> Path:
    return campaign_artifact_root(repo) / "trusted-evidence" / f"{entry['campaign_order']:03d}-{entry['tranche_id']}.json"


def command_reference_files(repo: Path, command: list[str]) -> list[Path]:
    candidates: set[Path] = set()
    package_scripts: dict[str, Any] = {}
    try:
        package_scripts = json.loads((repo / "package.json").read_text(encoding="utf-8")).get("scripts", {})
    except Exception:
        package_scripts = {}

    tokens = list(command)
    executable = Path(tokens[0]).name.lower() if tokens else ""
    if executable in {"npm", "pnpm", "yarn"}:
        script_name: str | None = None
        if len(tokens) >= 2 and tokens[1] == "test":
            script_name = "test"
        elif len(tokens) >= 3 and tokens[1] == "run":
            script_name = tokens[2]
        elif executable == "yarn" and len(tokens) >= 2:
            script_name = tokens[1]
        script_value = package_scripts.get(script_name) if isinstance(package_scripts, dict) and script_name else None
        if isinstance(script_value, str):
            try:
                tokens.extend(shlex.split(script_value, posix=True))
            except ValueError:
                tokens.extend(script_value.split())

    path_pattern = re.compile(r"^[A-Za-z0-9_.@+/-]+\.(?:sh|py|mjs|cjs|js|ts|tsx)$")
    for token in tokens:
        stripped = token.strip("'\";,()[]{}")
        if not stripped or not path_pattern.fullmatch(stripped):
            continue
        candidate = Path(stripped)
        target = candidate.resolve() if candidate.is_absolute() else (repo / candidate).resolve()
        try:
            target.relative_to(repo)
        except ValueError:
            continue
        if target.is_file() and not target.is_symlink():
            candidates.add(target)
    return sorted(candidates)


def requirement_command_is_bound(repo: Path, command: list[str], requirement_id: str) -> bool:
    assertion_pattern = re.compile(
        r"(?:\bassert\b|\bexpect\s*\(|strictEqual\s*\(|deepEqual\s*\(|"
        r"throw\s+new\s+Error|raise\s+AssertionError|pytest\.|unittest\.|"
        r"grep\s+-[A-Za-z]*q|\btest\s+[^=]|\[\[)"
    )
    for path in command_reference_files(repo, command):
        relative = str(path.relative_to(repo))
        if not (
            relative.startswith("tests/")
            or relative.startswith("scripts/validate_")
            or relative.startswith("scripts/test_")
            or Path(relative).name.startswith("validate-")
            or Path(relative).name.startswith("test-")
        ):
            continue
        try:
            source = path.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if len(source) < 160:
            continue
        if requirement_id in source and assertion_pattern.search(source):
            return True
    return False


def has_exact_owned_change(repo: Path, entry: dict[str, Any], records: list[dict[str, Any]]) -> bool:
    allowed_protected = set(entry.get("allowed_protected_files", []))
    path_map = load(program_root(repo) / "maps" / "path-to-tranche.json")
    for record in records:
        path = record["path"]
        if path in allowed_protected:
            return True
        for mapped in path_map.get("paths", []):
            if not isinstance(mapped, dict) or mapped.get("path") != path:
                continue
            candidates = mapped.get("candidate_tranches", [])
            if any(
                isinstance(candidate, dict) and candidate.get("tranche_id") == entry["tranche_id"]
                for candidate in candidates
            ):
                return True
    return False


def support_path_is_traceable(repo: Path, record: dict[str, Any], entry: dict[str, Any]) -> bool:
    path = record["path"]
    if not path.startswith(SUPPORT_PATH_PREFIXES):
        return False
    if record.get("action") == "DELETE":
        return False
    target = repo / path
    if not target.is_file() or target.is_symlink():
        return False
    try:
        text = target.read_text(encoding="utf-8", errors="replace")
    except OSError:
        return False
    markers = [entry["tranche_id"], *entry.get("finding_ids", []), *expected_test_requirement_ids(repo, entry["tranche_id"])]
    return any(marker in text for marker in markers)


def validate_trusted_evidence(repo: Path, entry: dict[str, Any], result: dict[str, Any], result_path: Path) -> None:
    attestation_path = trusted_evidence_path(repo, entry)
    attestation = load(attestation_path)
    expected_exact = {
        "schema": TRUSTED_EVIDENCE_SCHEMA,
        "program_id": PROGRAM,
        "tranche_id": entry["tranche_id"],
        "campaign_order": entry["campaign_order"],
        "result_sha256": digest(result_path),
        "result_state": result["state"],
        "exact_preimage_generation_id": result["exact_preimage_generation_id"],
        "exact_postimage_generation_id": result["exact_postimage_generation_id"],
        "validator_sha256": digest(Path(__file__).resolve()),
        "verifier_sha256": digest(repo / "scripts" / "validate_remediation_tranche_evidence.py"),
        "test_records_sha256": canonical_digest(result["test_commands_and_results"]),
        "proof_environments_sha256": canonical_digest(result["proof_environments"]),
    }
    for key, expected in expected_exact.items():
        if attestation.get(key) != expected:
            fail(f"trusted evidence attestation {key} mismatch: {entry['tranche_id']}")
    parse_datetime(attestation.get("verified_at"), f"trusted evidence {entry['tranche_id']} verified_at")
    if attestation.get("all_commands_executed") is not True:
        fail(f"trusted evidence does not prove command execution: {entry['tranche_id']}")
    executions = attestation.get("executions")
    if not isinstance(executions, list):
        fail(f"trusted evidence execution list is malformed: {entry['tranche_id']}")
    if attestation.get("executions_sha256") != canonical_digest(executions):
        fail(f"trusted evidence execution digest mismatch: {entry['tranche_id']}")
    result_tests = result.get("test_commands_and_results")
    if not isinstance(result_tests, list) or len(executions) != len(result_tests):
        fail(f"trusted evidence execution count mismatch: {entry['tranche_id']}")
    by_id = {item.get("test_requirement_id"): item for item in executions if isinstance(item, dict)}
    if len(by_id) != len(executions):
        fail(f"trusted evidence contains duplicate execution IDs: {entry['tranche_id']}")
    for test in result_tests:
        execution = by_id.get(test.get("test_requirement_id"))
        if not isinstance(execution, dict):
            fail(f"trusted evidence missing test execution: {test.get('test_requirement_id')}")
        for key in (
            "command", "working_directory", "timeout_seconds", "status", "exit_code",
            "stdout_sha256", "stderr_sha256", "node_version", "environment_generation_id",
        ):
            if execution.get(key) != test.get(key):
                fail(f"trusted evidence test {key} mismatch: {test.get('test_requirement_id')}")
        evidence_paths = execution.get("entrypoint_evidence_paths")
        if (
            not isinstance(evidence_paths, list)
            or len(evidence_paths) != len(set(evidence_paths))
            or not all(isinstance(value, str) and value for value in evidence_paths)
        ):
            fail(f"trusted evidence entrypoint path list is malformed: {test.get('test_requirement_id')}")
        normalized_evidence: set[str] = set()
        for value in evidence_paths:
            pure = PurePosixPath(value)
            if pure.is_absolute() or ".." in pure.parts or "\\" in value:
                fail(f"trusted evidence contains an unsafe entrypoint path: {test.get('test_requirement_id')}:{value}")
            target = repo / value
            if not target.is_file() or target.is_symlink():
                fail(f"trusted evidence names a missing entrypoint path: {test.get('test_requirement_id')}:{value}")
            normalized_evidence.add(value)
        if test.get("production_entrypoint") is True:
            relevant = relevant_production_paths(repo, test.get("finding_ids") or [])
            observed = sorted(relevant & normalized_evidence)
            if not observed:
                fail(
                    f"trusted execution did not load or execute a mapped production entrypoint: "
                    f"{test.get('test_requirement_id')} relevant={sorted(relevant)} "
                    f"observed={sorted(normalized_evidence)}"
                )


def validate_static(repo: Path) -> None:
    activation, plan_path, seed_path, _ = paths(repo)
    plan = load(plan_path)
    seed = load(seed_path)
    if plan.get("program_id") != PROGRAM or plan.get("activation_state") != "ACTIVE":
        fail("plan program or activation state mismatch")
    if seed.get("program_id") != PROGRAM or seed.get("activation_state") != "ACTIVE":
        fail("seed program or activation state mismatch")
    if plan.get("one_source_mutating_tranche_at_a_time") is not True:
        fail("plan does not preserve one-source-mutating-tranche authority")
    if plan.get("existing_controller_allowed_before_s2") is not False:
        fail("plan illegally permits an existing controller before S2")
    if plan.get("node_runtime") != "v20.20.2":
        fail("plan does not bind exact Node v20.20.2")
    configured_protected = parse_config_protected_files(repo)
    if configured_protected != PROTECTED_AUTOMATION_FILES:
        fail(
            "protected automation authority mismatch; "
            f"missing={sorted(PROTECTED_AUTOMATION_FILES - configured_protected)} "
            f"extra={sorted(configured_protected - PROTECTED_AUTOMATION_FILES)}"
        )
    immutable_paths = immutable_authority_paths(repo)
    required_immutable = set(REQUIRED_IMMUTABLE_AUTHORITY_PATHS)
    required_immutable.update(
        str(path.relative_to(repo))
        for path in sorted((program_root(repo) / "tranches").glob("BWS-*.md"))
    )
    missing_immutable = sorted(required_immutable - immutable_paths)
    if missing_immutable:
        fail(f"immutable authority does not cover acceptance inputs: {missing_immutable}")

    entries = plan_entries(plan)
    orders = [e.get("campaign_order") for e in entries]
    if orders != list(range(1, 48)):
        fail("campaign orders must be exactly 1..47")
    ids = [e.get("tranche_id") for e in entries]
    if len(set(ids)) != 47 or any(not isinstance(value, str) or not value for value in ids):
        fail("tranche IDs must be 47 unique non-empty strings")
    by_id = {e["tranche_id"]: e for e in entries}

    for entry in entries:
        for dep in entry.get("dependencies", []):
            full = resolve_dependency_id(dep, entries)
            if full not in by_id:
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
        allowed_protected = entry.get("allowed_protected_files", [])
        if not isinstance(allowed_protected, list) or not all(isinstance(value, str) for value in allowed_protected):
            fail(f"task protected allowlist is malformed: {entry['tranche_id']}")
        unknown_protected = sorted(set(allowed_protected) - PROTECTED_AUTOMATION_FILES)
        if unknown_protected:
            fail(f"task names non-protected automation paths: {entry['tranche_id']}:{unknown_protected}")
        expected_allowed = ",".join(allowed_protected) or "none"
        if f"allowed_protected_files={expected_allowed}" not in text:
            fail(f"task protected allowlist mismatch: {entry['tranche_id']}")
        expected_mode = "DIRECT_BOUNDED_CODEX" if entry["campaign_order"] <= 13 else "REPAIRED_IMPLEMENTATION_CONTROLLER"
        if entry.get("execution_mode") != expected_mode:
            fail(f"execution mode mismatch: {entry['tranche_id']}")

    finding_map = load(program_root(repo) / "maps" / "finding-to-tranche.json")
    findings = finding_map.get("findings")
    if not isinstance(findings, list) or len(findings) != 173:
        fail("finding map must contain exactly 173 findings")
    if len({item.get("finding_id") for item in findings if isinstance(item, dict)}) != 173:
        fail("finding map contains duplicate or invalid finding IDs")

    matrix = load(repo / "docs" / "reviews" / "BWS121" / "wave-04" / "test-evidence-matrix.json")
    records = matrix.get("records")
    if not isinstance(records, list):
        fail("test evidence matrix records are missing")
    matrix_ids = [item.get("id") for item in records if isinstance(item, dict)]
    if len(matrix_ids) != len(set(matrix_ids)):
        fail("test evidence matrix contains duplicate requirement IDs")
    matrix_set = set(matrix_ids)
    for entry in entries:
        expected_ids = expected_test_requirement_ids(repo, entry["tranche_id"])
        if len(expected_ids) != entry.get("test_requirement_count"):
            fail(f"test requirement count mismatch: {entry['tranche_id']}")
        if not set(expected_ids).issubset(matrix_set):
            fail(f"test evidence matrix is incomplete for {entry['tranche_id']}")
        production = sum(1 for requirement_id in expected_ids if matrix_record_map(repo)[requirement_id].get("production_entrypoint_required") is True)
        if production != entry.get("production_entrypoint_test_count"):
            fail(f"production-entrypoint count mismatch: {entry['tranche_id']}")

    print("BWS_REMEDIATION_ACTIVATION_STATIC_OK")


def git_capture(repo: Path) -> dict[str, Any]:
    def run(*args: str) -> str | None:
        try:
            cp = subprocess.run(
                args,
                cwd=repo,
                check=True,
                text=True,
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                timeout=30,
            )
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
    _, plan_path, seed_path, state_path = paths(repo)
    plan = load(plan_path)
    if state_path.exists():
        state = load(state_path)
        validate_runtime_state(repo, plan, state)
        print(f"BWS_REMEDIATION_STATE_PRESENT={state_path}")
        return
    state = load(seed_path)
    state["created_at"] = utc_now()
    state["clock_authority"] = "UTC_SYSTEM_CLOCK_AT_OPERATOR_LAUNCH"
    state["initial_git"] = git_capture(repo)
    validate_state(plan, state)
    validate_git_anchor(repo, state)
    atomic_write(state_path, state)
    print(f"BWS_REMEDIATION_STATE_INITIALIZED={state_path}")


def validate_state(plan: dict[str, Any], state: dict[str, Any]) -> None:
    if state.get("program_id") != PROGRAM or state.get("activation_state") != "ACTIVE":
        fail("live state identity mismatch")
    if state.get("retained_holds") != HOLDS:
        fail("live state changed retained holds")
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
    terminal = state.get("terminal_state")
    if len(accepted) == 47:
        if current is not None or terminal != "COMPLETE":
            fail("complete state is malformed")
    else:
        expected = entries[len(accepted)]
        if not isinstance(current, dict):
            fail("missing current tranche")
        for key in ("campaign_order", "tranche_id", "stage"):
            if current.get(key) != expected.get(key):
                fail(f"live current {key} mismatch")
        current_state = current.get("state")
        if current_state not in ("ADMITTED", "BLOCKED"):
            fail("live current state must be ADMITTED or BLOCKED")
        if current_state == "ADMITTED" and terminal is not None:
            fail("admitted campaign may not have a terminal state")
        if current_state == "BLOCKED":
            result_state = current.get("result_state")
            if result_state not in ("BLOCKED", "SOURCE_COMPLETE_EXTERNAL_PENDING"):
                fail("blocked campaign lacks a valid terminal result state")
            if terminal != result_state:
                fail("campaign terminal state does not match current result state")
            if not isinstance(current.get("result_sha256"), str) or not HEX64.fullmatch(current["result_sha256"]):
                fail("blocked campaign lacks a valid result digest")
    if bool(state.get("controller_eligible")) != (len(accepted) >= 13):
        fail("controller eligibility does not match S2 acceptance")

    initial_git = state.get("initial_git")
    if not isinstance(initial_git, dict) or set(initial_git) != {
        "commit", "branch", "upstream", "worktree_status_sha256"
    }:
        fail("campaign state initial Git authority is malformed")
    commit = initial_git.get("commit")
    if not isinstance(commit, str) or not GIT_OBJECT.fullmatch(commit):
        fail("campaign state lacks an exact initial Git commit")
    for key in ("branch", "upstream"):
        value = initial_git.get(key)
        if value is not None and (not isinstance(value, str) or not value):
            fail(f"campaign state initial Git {key} is malformed")
    status_digest = initial_git.get("worktree_status_sha256")
    if not isinstance(status_digest, str) or not HEX64.fullmatch(status_digest):
        fail("campaign state initial Git worktree digest is malformed")


def validate_git_anchor(repo: Path, state: dict[str, Any]) -> None:
    initial_git = state["initial_git"]
    current = git_capture(repo)
    for key in ("commit", "branch", "upstream"):
        if current.get(key) != initial_git.get(key):
            fail(
                f"campaign Git {key} changed after admission: "
                f"expected={initial_git.get(key)!r} observed={current.get(key)!r}"
            )


def validate_runtime_state(repo: Path, plan: dict[str, Any], state: dict[str, Any]) -> None:
    validate_state(plan, state)
    validate_git_anchor(repo, state)
    validate_historical_receipt_chain(repo, plan, state)


def next_task(repo: Path) -> None:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
    if state.get("terminal_state") == "COMPLETE":
        print("COMPLETE")
        return
    current = state["current"]
    if current["state"] == "BLOCKED":
        fail(f"campaign is terminal at {current['tranche_id']} with state {current['result_state']}")
    entry = plan_entries(plan)[current["campaign_order"] - 1]
    print(
        "\t".join(
            [
                str(entry["campaign_order"]),
                entry["tranche_id"],
                entry["stage"],
                entry["execution_mode"],
                str(repo / entry["task_path"]),
                str(repo / entry["result_path"]),
            ]
        )
    )


def is_secret_path(relative: PurePosixPath) -> bool:
    lower_parts = tuple(part.lower() for part in relative.parts)
    name = lower_parts[-1]
    if any(part in SECRET_COMPONENTS for part in lower_parts):
        return True
    if name in SECRET_FILENAMES:
        return True
    if name == ".env" or (name.startswith(".env.") and name not in ENV_TEMPLATE_NAMES):
        return True
    if PurePosixPath(name).suffix.lower() in SECRET_SUFFIXES:
        return True
    if re.search(r"(?:^|[._-])(?:credential|secret|token)(?:[._-]|$)", name):
        return True
    return False


def snapshot_tree(repo: Path) -> dict[str, Any]:
    files: list[dict[str, Any]] = []
    protected_secret_metadata: list[dict[str, Any]] = []
    for root, dirs, names in os.walk(repo, topdown=True, followlinks=False):
        root_path = Path(root)
        relative_root = root_path.relative_to(repo)
        dirs[:] = sorted(
            directory
            for directory in dirs
            if directory not in EXCLUDED_TREE_PARTS
            and not (root_path / directory).is_symlink()
        )
        for name in sorted(names):
            path = root_path / name
            relative = path.relative_to(repo)
            pure = PurePosixPath(relative.as_posix())
            if any(part in EXCLUDED_TREE_PARTS for part in pure.parts):
                continue
            if path.is_symlink():
                fail(f"source tree contains an unsafe symlink: {pure}")
            try:
                metadata = path.stat()
            except FileNotFoundError:
                fail(f"source tree changed while being captured: {pure}")
            if not stat.S_ISREG(metadata.st_mode):
                fail(f"source tree contains a special file: {pure}")
            mode = format(stat.S_IMODE(metadata.st_mode), "04o")
            if is_secret_path(pure):
                protected_secret_metadata.append(
                    {
                        "path": pure.as_posix(),
                        "mode": mode,
                        "size": metadata.st_size,
                        "mtime_ns": metadata.st_mtime_ns,
                    }
                )
                continue
            files.append(
                {
                    "path": pure.as_posix(),
                    "sha256": digest(path),
                    "mode": mode,
                    "size": metadata.st_size,
                }
            )
    identity_payload = {
        "files": files,
        "protected_secret_metadata": protected_secret_metadata,
    }
    tree_sha256 = canonical_digest(identity_payload)
    return {
        "files": files,
        "protected_secret_metadata": protected_secret_metadata,
        "tree_sha256": tree_sha256,
        "source_generation_id": f"sha256:{tree_sha256}",
    }


def preimage_path(repo: Path, entry: dict[str, Any]) -> Path:
    return campaign_artifact_root(repo) / "preimages" / f"{entry['campaign_order']:03d}-{entry['tranche_id']}.json"


def prepare_tranche(repo: Path, tranche_id: str) -> None:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
    entry = entry_by_id(plan, tranche_id)
    current = state.get("current")
    if not isinstance(current, dict) or current.get("tranche_id") != tranche_id or current.get("state") != "ADMITTED":
        fail(f"tranche is not the unique admitted current tranche: {tranche_id}")
    accepted_set = set(state.get("accepted_tranches", []))
    for dep in entry.get("dependencies", []):
        resolved = resolve_dependency_id(dep, plan_entries(plan))
        if resolved not in accepted_set:
            fail(f"dependency is not accepted: {resolved}")

    destination = preimage_path(repo, entry)
    if destination.exists():
        existing = load(destination)
        exact = {
            "program_id": PROGRAM,
            "tranche_id": tranche_id,
            "campaign_order": entry["campaign_order"],
            "stage": entry["stage"],
        }
        for key, expected in exact.items():
            if existing.get(key) != expected:
                fail(f"existing preimage {key} mismatch for {tranche_id}")
        generation = existing.get("source_generation_id")
        if not isinstance(generation, str) or not generation.startswith("sha256:"):
            fail(f"existing preimage lacks source generation identity: {tranche_id}")
        identity_payload = {
            "files": existing.get("files"),
            "protected_secret_metadata": existing.get("protected_secret_metadata"),
        }
        recomputed_tree = canonical_digest(identity_payload)
        if existing.get("tree_sha256") != recomputed_tree or generation != f"sha256:{recomputed_tree}":
            fail(f"existing preimage internal digest mismatch: {tranche_id}")
        resumed = snapshot_tree(repo)
        compare_secret_metadata(existing, resumed)
        resumed_delta = changed_path_records(existing, resumed)
        validate_changed_path_authority(repo, plan, entry, resumed_delta)
        print(
            f"BWS_REMEDIATION_PREIMAGE_PRESENT={tranche_id}:{generation}:{destination}:"
            f"resumed_changed_paths={len(resumed_delta)}"
        )
        return

    snapshot = snapshot_tree(repo)
    record = {
        "schema": "bws-remediation-tranche-preimage-v2",
        "program_id": PROGRAM,
        "tranche_id": tranche_id,
        "campaign_order": entry["campaign_order"],
        "stage": entry["stage"],
        "captured_at": utc_now(),
        "clock_authority": "UTC_SYSTEM_CLOCK_AT_PREIMAGE_CAPTURE",
        "git": git_capture(repo),
        **snapshot,
    }
    atomic_write(destination, record)
    print(f"BWS_REMEDIATION_PREIMAGE_CAPTURED={tranche_id}:{record['source_generation_id']}:{destination}")


def file_map(snapshot: dict[str, Any]) -> dict[str, dict[str, Any]]:
    records = snapshot.get("files")
    if not isinstance(records, list):
        fail("tree snapshot files are malformed")
    result: dict[str, dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get("path"), str):
            fail("tree snapshot contains a malformed file record")
        if record["path"] in result:
            fail(f"tree snapshot contains duplicate path: {record['path']}")
        result[record["path"]] = record
    return result


def compare_secret_metadata(preimage: dict[str, Any], postimage: dict[str, Any]) -> None:
    before = preimage.get("protected_secret_metadata")
    after = postimage.get("protected_secret_metadata")
    if before != after:
        before_paths = {item.get("path") for item in before or [] if isinstance(item, dict)}
        after_paths = {item.get("path") for item in after or [] if isinstance(item, dict)}
        changed = sorted(before_paths ^ after_paths)
        fail(f"secret or credential material changed during tranche execution: {changed or 'metadata changed'}")


def changed_path_records(preimage: dict[str, Any], postimage: dict[str, Any]) -> list[dict[str, Any]]:
    before = file_map(preimage)
    after = file_map(postimage)
    records: list[dict[str, Any]] = []
    for path in sorted(set(before) | set(after)):
        left = before.get(path)
        right = after.get(path)
        if left is None:
            records.append(
                {
                    "path": path,
                    "action": "ADD",
                    "preimage_sha256": None,
                    "postimage_sha256": right["sha256"],
                    "preimage_mode": None,
                    "postimage_mode": right["mode"],
                }
            )
        elif right is None:
            records.append(
                {
                    "path": path,
                    "action": "DELETE",
                    "preimage_sha256": left["sha256"],
                    "postimage_sha256": None,
                    "preimage_mode": left["mode"],
                    "postimage_mode": None,
                }
            )
        elif left["sha256"] != right["sha256"] or left["mode"] != right["mode"]:
            records.append(
                {
                    "path": path,
                    "action": "REPLACE",
                    "preimage_sha256": left["sha256"],
                    "postimage_sha256": right["sha256"],
                    "preimage_mode": left["mode"],
                    "postimage_mode": right["mode"],
                }
            )
    return records


def expected_test_requirement_ids(repo: Path, tranche_id: str) -> list[str]:
    finding_map = load(program_root(repo) / "maps" / "finding-to-tranche.json")
    findings = finding_map.get("findings")
    if not isinstance(findings, list):
        fail("finding map is malformed")
    requirement_ids: list[str] = []
    seen: set[str] = set()
    for finding in findings:
        if not isinstance(finding, dict) or finding.get("owning_tranche") != tranche_id:
            continue
        ids = finding.get("test_requirement_ids")
        if not isinstance(ids, list) or not all(isinstance(item, str) and item for item in ids):
            fail(f"finding map test requirements are malformed for {tranche_id}")
        for requirement_id in ids:
            if requirement_id not in seen:
                requirement_ids.append(requirement_id)
                seen.add(requirement_id)
    return requirement_ids


def matrix_record_map(repo: Path) -> dict[str, dict[str, Any]]:
    matrix = load(repo / "docs" / "reviews" / "BWS121" / "wave-04" / "test-evidence-matrix.json")
    records = matrix.get("records")
    if not isinstance(records, list):
        fail("test evidence matrix is malformed")
    result: dict[str, dict[str, Any]] = {}
    for record in records:
        if not isinstance(record, dict) or not isinstance(record.get("id"), str):
            fail("test evidence matrix contains a malformed record")
        if record["id"] in result:
            fail(f"duplicate test evidence requirement: {record['id']}")
        result[record["id"]] = record
    return result


def relevant_production_paths(repo: Path, issue_ids: list[str]) -> set[str]:
    finding_map = load(program_root(repo) / "maps" / "finding-to-tranche.json")
    relevant_paths: set[str] = set()
    for finding in finding_map.get("findings", []):
        if not isinstance(finding, dict) or finding.get("finding_id") not in issue_ids:
            continue
        for source_path in finding.get("relevant_source_paths", []):
            if isinstance(source_path, str) and not source_path.startswith(("tests/", "docs/")):
                relevant_paths.add(source_path)
    return relevant_paths


def production_command_is_bound(
    repo: Path,
    command: list[str],
    issue_ids: list[str],
) -> bool:
    if not command:
        return False
    executable = Path(command[0]).name.lower()
    if executable in TRIVIAL_EXECUTABLES or executable in FORBIDDEN_TEST_EXECUTABLES:
        return False
    if executable in {"bash", "sh", "zsh", "dash"} and any(token in {"-c", "-lc"} for token in command[1:]):
        return False

    relevant_paths = relevant_production_paths(repo, issue_ids)
    if not relevant_paths:
        return False

    joined = " ".join(command)
    if any(path in joined or Path(path).name in joined for path in relevant_paths):
        return True
    for reference in command_reference_files(repo, command):
        try:
            source = reference.read_text(encoding="utf-8", errors="replace")
        except OSError:
            continue
        if any(path in source or Path(path).name in source for path in relevant_paths):
            return True
    return False



def normalize_changed_paths(value: Any, tranche_id: str) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        fail(f"result changed_paths is not a list: {tranche_id}")
    required = {
        "path",
        "action",
        "preimage_sha256",
        "postimage_sha256",
        "preimage_mode",
        "postimage_mode",
    }
    result: list[dict[str, Any]] = []
    seen: set[str] = set()
    for item in value:
        if not isinstance(item, dict) or set(item) != required:
            fail(f"invalid changed path record shape: {tranche_id}")
        path = item.get("path")
        if not isinstance(path, str) or not path or path in seen:
            fail(f"invalid or duplicate changed path: {tranche_id}:{path}")
        pure = PurePosixPath(path)
        if pure.is_absolute() or ".." in pure.parts or "\\" in path:
            fail(f"unsafe changed path: {path}")
        if item.get("action") not in {"ADD", "REPLACE", "DELETE"}:
            fail(f"invalid changed path action: {path}")
        for key in ("preimage_sha256", "postimage_sha256"):
            value_sha = item.get(key)
            if value_sha is not None and (not isinstance(value_sha, str) or not HEX64.fullmatch(value_sha)):
                fail(f"invalid {key} for changed path: {path}")
        for key in ("preimage_mode", "postimage_mode"):
            value_mode = item.get(key)
            if value_mode is not None and (not isinstance(value_mode, str) or not re.fullmatch(r"^[0-7]{4}$", value_mode)):
                fail(f"invalid {key} for changed path: {path}")
        seen.add(path)
        result.append(item)
    return sorted(result, key=lambda item: item["path"])


def validate_changed_path_authority(repo: Path, plan: dict[str, Any], entry: dict[str, Any], records: list[dict[str, Any]]) -> None:
    immutable_prefix = f"docs/remediation/{PROGRAM}/activation/"
    forbidden_prefixes = (".git/", "artifacts/", "node_modules/", "betting-win/")
    protected = set(PROTECTED_AUTOMATION_FILES)
    if parse_config_protected_files(repo) != protected:
        fail("protected automation authority changed during campaign")
    allowed_protected = set(entry.get("allowed_protected_files", []))
    if not allowed_protected.issubset(protected):
        fail(f"tranche protected allowlist is not a subset of canonical protection: {entry['tranche_id']}")

    path_map_doc = load(program_root(repo) / "maps" / "path-to-tranche.json")
    mapped_paths = path_map_doc.get("paths")
    if not isinstance(mapped_paths, list):
        fail("path-to-tranche map is malformed")
    path_owners: dict[str, set[str]] = {}
    for mapped in mapped_paths:
        if not isinstance(mapped, dict) or not isinstance(mapped.get("path"), str):
            fail("path-to-tranche map contains a malformed path")
        candidates = mapped.get("candidate_tranches")
        if not isinstance(candidates, list):
            fail(f"path-to-tranche candidate list is malformed: {mapped['path']}")
        path_owners[mapped["path"]] = {
            candidate.get("tranche_id")
            for candidate in candidates
            if isinstance(candidate, dict) and isinstance(candidate.get("tranche_id"), str)
        }

    exact_owned_change = False
    mapped_parent_dirs = {
        str(PurePosixPath(path).parent)
        for path, owners in path_owners.items()
        if entry["tranche_id"] in owners
    }
    for record in records:
        path = record["path"]
        lower = path.lower()
        if path.startswith(forbidden_prefixes) or lower == ".env" or lower.startswith(".env."):
            fail(f"forbidden changed path in result: {path}")
        if path.startswith(immutable_prefix):
            fail(f"immutable activation authority changed by tranche: {path}")
        if is_secret_path(PurePosixPath(path)):
            fail(f"secret or credential path changed by tranche: {path}")
        if path in protected:
            if path not in allowed_protected:
                fail(f"tranche changed protected automation path without exact allowance: {path}")
            exact_owned_change = True
            continue

        owners = path_owners.get(path)
        if owners is not None:
            if entry["tranche_id"] not in owners:
                fail(f"tranche changed a path owned by another remediation boundary: {path}")
            exact_owned_change = True
            continue

        parent = str(PurePosixPath(path).parent)
        new_in_owned_parent = record.get("action") == "ADD" and parent in mapped_parent_dirs
        if new_in_owned_parent and support_path_is_traceable(repo, record, entry):
            continue
        if support_path_is_traceable(repo, record, entry):
            continue
        fail(f"tranche changed an unmapped and untraceable path: {path}")



def validate_result_shape(repo: Path, result: dict[str, Any]) -> None:
    schema = load(program_root(repo) / "schemas" / "tranche-result.schema.json")
    required = schema.get("required")
    properties = schema.get("properties")
    if not isinstance(required, list) or not isinstance(properties, dict):
        fail("tranche result schema is malformed")
    missing = sorted(set(required) - set(result))
    extras = sorted(set(result) - set(properties))
    if missing:
        fail(f"tranche result is missing required fields: {missing}")
    if extras:
        fail(f"tranche result has unknown fields: {extras}")
    if result.get("example_notice") is not None:
        fail("example tranche receipt cannot be accepted as runtime evidence")


def validate_historical_receipt_chain(repo: Path, plan: dict[str, Any], state: dict[str, Any]) -> None:
    entries = plan_entries(plan)
    accepted = state.get("accepted_tranches", [])
    current = state.get("current")
    blocked_terminal = isinstance(current, dict) and current.get("state") == "BLOCKED"
    expected_count = len(accepted) + (1 if blocked_terminal else 0)
    history = state.get("history")
    if not isinstance(history, list) or len(history) != expected_count:
        fail(
            f"campaign history length mismatch: expected={expected_count} "
            f"observed={len(history) if isinstance(history, list) else 'non-list'}"
        )

    parent_sha = digest(activation_root(repo) / "active-campaign-admission.json")
    for index, event in enumerate(history):
        if not isinstance(event, dict) or set(event) != {
            "recorded_at", "campaign_order", "result_path", "result_sha256",
            "result_state", "tranche_id",
        }:
            fail(f"campaign history event shape is malformed at index {index}")
        entry = entries[index]
        expected_state = "ACCEPTED" if index < len(accepted) else current.get("result_state")
        expected_event = {
            "campaign_order": entry["campaign_order"],
            "result_path": entry["result_path"],
            "result_state": expected_state,
            "tranche_id": entry["tranche_id"],
        }
        for key, value in expected_event.items():
            if event.get(key) != value:
                fail(f"campaign history {key} mismatch at order {entry['campaign_order']}")
        parse_datetime(event.get("recorded_at"), f"history {entry['tranche_id']} recorded_at")
        result_sha = event.get("result_sha256")
        if not isinstance(result_sha, str) or not HEX64.fullmatch(result_sha):
            fail(f"campaign history result digest is malformed: {entry['tranche_id']}")
        result_path = repo / entry["result_path"]
        result = load(result_path)
        if digest(result_path) != result_sha:
            fail(f"campaign history result digest mismatch: {entry['tranche_id']}")
        validate_result_shape(repo, result)
        exact = {
            "program_id": PROGRAM,
            "record_type": "tranche-result",
            "tranche_id": entry["tranche_id"],
            "campaign_order": entry["campaign_order"],
            "stage": entry["stage"],
            "owner": entry["owner"],
            "finding_ids": entry["finding_ids"],
            "retained_holds": HOLDS,
            "acceptance_authority": entry["acceptance_authority"],
            "state": expected_state,
            "parent_receipt_sha256": parent_sha,
            "previous_receipt_sha256": None,
        }
        for key, value in exact.items():
            if result.get(key) != value:
                fail(f"historical result {entry['tranche_id']} field {key} mismatch")
        parse_datetime(result.get("created_at"), f"historical result {entry['tranche_id']} created_at")

        preimage = load(preimage_path(repo, entry))
        if preimage.get("program_id") != PROGRAM or preimage.get("tranche_id") != entry["tranche_id"]:
            fail(f"historical preimage identity mismatch: {entry['tranche_id']}")
        pre_generation = preimage.get("source_generation_id")
        post_generation = result.get("exact_postimage_generation_id")
        if result.get("exact_preimage_generation_id") != pre_generation:
            fail(f"historical result preimage generation mismatch: {entry['tranche_id']}")
        if not isinstance(post_generation, str) or re.fullmatch(r"sha256:[0-9a-f]{64}", post_generation) is None:
            fail(f"historical result postimage generation is malformed: {entry['tranche_id']}")
        identity = result.get("repository_identity")
        expected_identity = {
            "name": "betting-win-surebet",
            "baseline_archive": BASELINE_ARCHIVE,
            "baseline_sha256": BASELINE_SHA256,
            "source_generation_id": pre_generation,
            "git_commit": preimage.get("git", {}).get("commit"),
        }
        if identity != expected_identity:
            fail(f"historical result repository identity mismatch: {entry['tranche_id']}")

        blockers = result.get("unresolved_blockers")
        if not isinstance(blockers, list) or len(blockers) != len(set(blockers)):
            fail(f"historical result blockers are malformed: {entry['tranche_id']}")
        tests = result.get("test_commands_and_results")
        proofs = result.get("proof_environments")
        if not isinstance(tests, list) or not isinstance(proofs, list):
            fail(f"historical result evidence lists are malformed: {entry['tranche_id']}")

        if expected_state in {"ACCEPTED", "SOURCE_COMPLETE_EXTERNAL_PENDING"}:
            expected_ids = set(expected_test_requirement_ids(repo, entry["tranche_id"]))
            observed_ids = [item.get("test_requirement_id") for item in tests if isinstance(item, dict)]
            if len(observed_ids) != len(set(observed_ids)) or set(observed_ids) != expected_ids:
                fail(f"historical result test requirement set mismatch: {entry['tranche_id']}")
            if any(item.get("status") != "PASSED" or item.get("exit_code") != 0 for item in tests):
                fail(f"historical result contains non-passing test evidence: {entry['tranche_id']}")
            expected_lanes = set(entry.get("test_environments", {}))
            observed_lanes = [item.get("lane") for item in proofs if isinstance(item, dict)]
            if len(observed_lanes) != len(set(observed_lanes)) or set(observed_lanes) != expected_lanes:
                fail(f"historical result proof lane set mismatch: {entry['tranche_id']}")
            if any(item.get("result") != "PASSED" for item in proofs):
                fail(f"historical result contains non-passing proof evidence: {entry['tranche_id']}")
            if result.get("node_runtime_identity") != "v20.20.2" or result.get("all_internal_requirements_closed") is not True:
                fail(f"historical complete result lacks exact runtime or closure: {entry['tranche_id']}")
            validate_trusted_evidence(repo, entry, result, result_path)
        else:
            if expected_state != "BLOCKED" or not blockers or result.get("all_internal_requirements_closed") is not False:
                fail(f"historical blocked result is malformed: {entry['tranche_id']}")

        parent_sha = result_sha


def expected_parent_receipt_sha256(repo: Path, plan: dict[str, Any], entry: dict[str, Any]) -> str:
    if entry["campaign_order"] == 1:
        return digest(activation_root(repo) / "active-campaign-admission.json")
    previous = plan_entries(plan)[entry["campaign_order"] - 2]
    previous_result = repo / previous["result_path"]
    previous_record = load(previous_result)
    if previous_record.get("state") != "ACCEPTED":
        fail(f"previous tranche receipt is not accepted: {previous['tranche_id']}")
    return digest(previous_result)


def validate_result(repo: Path, tranche_id: str, require_trusted_evidence: bool = True) -> tuple[dict[str, Any], dict[str, Any], Path, str]:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
    entry = entry_by_id(plan, tranche_id)
    current = state.get("current")
    if not isinstance(current, dict) or current.get("tranche_id") != tranche_id or current.get("state") != "ADMITTED":
        fail(f"tranche is not the unique admitted current tranche: {tranche_id}")
    accepted_set = set(state.get("accepted_tranches", []))
    for dep in entry.get("dependencies", []):
        resolved = resolve_dependency_id(dep, plan_entries(plan))
        if resolved not in accepted_set:
            fail(f"dependency is not accepted: {resolved}")

    preimage_file = preimage_path(repo, entry)
    preimage = load(preimage_file)
    if preimage.get("program_id") != PROGRAM or preimage.get("tranche_id") != tranche_id:
        fail(f"preimage identity mismatch: {tranche_id}")
    postimage = snapshot_tree(repo)
    compare_secret_metadata(preimage, postimage)
    actual_changed = changed_path_records(preimage, postimage)

    result_path = repo / entry["result_path"]
    result = load(result_path)
    validate_result_shape(repo, result)
    result_state = result.get("state")
    if result_state not in TERMINAL_RESULT_STATES:
        fail(f"tranche result is not an allowed terminal state: {tranche_id}:{result_state}")

    exact = {
        "schema_version": "1.0.0",
        "program_id": PROGRAM,
        "record_type": "tranche-result",
        "tranche_id": tranche_id,
        "campaign_order": entry["campaign_order"],
        "stage": entry["stage"],
        "owner": entry["owner"],
        "finding_ids": entry["finding_ids"],
        "retained_holds": HOLDS,
        "acceptance_authority": entry["acceptance_authority"],
        "exact_preimage_generation_id": preimage["source_generation_id"],
        "exact_postimage_generation_id": postimage["source_generation_id"],
    }
    for key, expected in exact.items():
        if result.get(key) != expected:
            fail(f"result {tranche_id} field {key} mismatch")

    parse_datetime(result.get("created_at"), f"result {tranche_id} created_at")
    for key in ("clock_authority", "reviewer"):
        value = result.get(key)
        if not isinstance(value, str) or not value.strip() or re.search(r"(?i)\b(?:placeholder|unknown|tbd|to_capture|example)\b", value):
            fail(f"result {tranche_id} has non-authoritative {key}")

    parent = expected_parent_receipt_sha256(repo, plan, entry)
    if result.get("parent_receipt_sha256") != parent:
        fail(f"result {tranche_id} parent receipt digest mismatch")
    if result.get("previous_receipt_sha256") is not None:
        fail(f"canonical tranche result must not claim an unverified previous retry receipt: {tranche_id}")

    identity = result.get("repository_identity")
    if not isinstance(identity, dict) or set(identity) != {
        "name",
        "baseline_archive",
        "baseline_sha256",
        "source_generation_id",
        "git_commit",
    }:
        fail(f"result repository identity is malformed: {tranche_id}")
    expected_git = preimage.get("git", {}).get("commit")
    if expected_git is not None and (not isinstance(expected_git, str) or not GIT_OBJECT.fullmatch(expected_git)):
        fail(f"captured preimage Git commit is malformed: {tranche_id}")
    expected_identity = {
        "name": "betting-win-surebet",
        "baseline_archive": BASELINE_ARCHIVE,
        "baseline_sha256": BASELINE_SHA256,
        "source_generation_id": preimage["source_generation_id"],
        "git_commit": expected_git,
    }
    if identity != expected_identity:
        fail(f"result repository identity does not match captured preimage: {tranche_id}")

    declared_changed = normalize_changed_paths(result.get("changed_paths"), tranche_id)
    if declared_changed != actual_changed:
        fail(f"result changed_paths does not equal the independently computed postimage delta: {tranche_id}")
    validate_changed_path_authority(repo, plan, entry, actual_changed)

    expected_ids = expected_test_requirement_ids(repo, tranche_id)
    expected_id_set = set(expected_ids)
    matrix = matrix_record_map(repo)
    tests = result.get("test_commands_and_results")
    if not isinstance(tests, list):
        fail(f"result tests are not a list: {tranche_id}")
    tests_by_id: dict[str, dict[str, Any]] = {}
    test_required_fields = {
        "test_requirement_id",
        "finding_ids",
        "command",
        "working_directory",
        "timeout_seconds",
        "status",
        "exit_code",
        "stdout_sha256",
        "stderr_sha256",
        "production_entrypoint",
        "node_version",
        "environment_generation_id",
    }
    for item in tests:
        if not isinstance(item, dict) or set(item) != test_required_fields:
            fail(f"result contains a malformed test record: {tranche_id}")
        requirement_id = item.get("test_requirement_id")
        if requirement_id not in expected_id_set or requirement_id in tests_by_id:
            fail(f"result contains unknown or duplicate test requirement ID: {tranche_id}:{requirement_id}")
        expected_record = matrix.get(requirement_id)
        if expected_record is None:
            fail(f"test requirement is absent from evidence matrix: {requirement_id}")
        if sorted(item.get("finding_ids") or []) != sorted(expected_record.get("issue_ids") or []):
            fail(f"test finding membership mismatch: {requirement_id}")
        if item.get("production_entrypoint") is not expected_record.get("production_entrypoint_required"):
            fail(f"test production-entrypoint authority mismatch: {requirement_id}")
        command = item.get("command")
        if not isinstance(command, list) or not command or not all(isinstance(part, str) and part for part in command):
            fail(f"test command is malformed: {requirement_id}")
        working_directory = item.get("working_directory")
        if not isinstance(working_directory, str) or not working_directory:
            fail(f"test working directory is missing: {requirement_id}")
        working_path = Path(working_directory)
        resolved_working = working_path.resolve() if working_path.is_absolute() else (repo / working_path).resolve()
        try:
            resolved_working.relative_to(repo)
        except ValueError:
            fail(f"test working directory escapes the repository: {requirement_id}")
        if not resolved_working.is_dir():
            fail(f"test working directory does not exist: {requirement_id}")
        if not isinstance(item.get("timeout_seconds"), int) or item["timeout_seconds"] < 1:
            fail(f"test timeout is invalid: {requirement_id}")
        if item.get("node_version") not in ("v20.20.2", None):
            fail(f"test used a non-authoritative Node version: {requirement_id}")
        executable = Path(command[0]).name.lower()
        if executable in TRIVIAL_EXECUTABLES or executable in FORBIDDEN_TEST_EXECUTABLES:
            fail(f"test command uses a forbidden or trivial executable: {requirement_id}:{executable}")
        if executable in {"bash", "sh", "zsh", "dash"} and any(token in {"-c", "-lc"} for token in command[1:]):
            fail(f"test command uses an unauditable shell command string: {requirement_id}")
        joined_command = " ".join(command)
        if re.search(r"(?i)(?:password|passwd|secret|token|api[-_]?key|private[-_]?key|pgpassword)=", joined_command):
            fail(f"test command contains a secret-like argv assignment: {requirement_id}")
        if re.search(r"(?i)://[^/@:\s]+:[^/@\s]+@", joined_command):
            fail(f"test command contains URL userinfo credentials: {requirement_id}")
        if not requirement_command_is_bound(repo, command, requirement_id):
            fail(f"test command is not bound to its exact requirement ID: {requirement_id}")
        if item.get("production_entrypoint") is True and not production_command_is_bound(
            repo, command, expected_record.get("issue_ids") or []
        ):
            fail(f"production-entrypoint test command is not bound to a real repository entrypoint: {requirement_id}")
        tests_by_id[requirement_id] = item

    complete_internal = result_state in {"ACCEPTED", "SOURCE_COMPLETE_EXTERNAL_PENDING"}
    if complete_internal and set(tests_by_id) != expected_id_set:
        missing = sorted(expected_id_set - set(tests_by_id))
        fail(f"result is missing exact test requirements for {tranche_id}: {missing}")
    for requirement_id, item in tests_by_id.items():
        if complete_internal:
            if item.get("status") != "PASSED" or item.get("exit_code") != 0:
                fail(f"result contains a non-passing required test: {requirement_id}")
            for key in ("stdout_sha256", "stderr_sha256"):
                value = item.get(key)
                if not isinstance(value, str) or not HEX64.fullmatch(value):
                    fail(f"passing test lacks exact {key}: {requirement_id}")
            environment_generation = item.get("environment_generation_id")
            if not isinstance(environment_generation, str) or not re.fullmatch(r"sha256:[0-9a-f]{64}", environment_generation):
                fail(f"passing test lacks exact environment generation identity: {requirement_id}")
        else:
            if item.get("status") == "PASSED" and item.get("exit_code") != 0:
                fail(f"passing test has nonzero exit code: {requirement_id}")

    proofs = result.get("proof_environments")
    if not isinstance(proofs, list):
        fail(f"result proof environments are not a list: {tranche_id}")
    expected_lanes = set(entry.get("test_environments", {}).keys())
    proofs_by_lane: dict[str, dict[str, Any]] = {}
    proof_required_fields = {
        "lane",
        "identity",
        "result",
        "evidence_sha256",
        "cleanup_result",
        "source_generation_id",
        "postimage_generation_id",
    }
    for proof in proofs:
        if not isinstance(proof, dict) or set(proof) != proof_required_fields:
            fail(f"invalid proof environment record shape: {tranche_id}")
        lane = proof.get("lane")
        if lane not in expected_lanes or lane in proofs_by_lane:
            fail(f"unknown or duplicate proof lane: {tranche_id}:{lane}")
        identity_value = proof.get("identity")
        if not isinstance(identity_value, str) or not identity_value or re.search(r"(?i)\b(?:placeholder|unknown|tbd|to_capture|example)\b", identity_value):
            fail(f"proof environment lacks authoritative identity: {tranche_id}:{lane}")
        if proof.get("source_generation_id") != preimage["source_generation_id"]:
            fail(f"proof environment source generation mismatch: {tranche_id}:{lane}")
        proofs_by_lane[lane] = proof

    if complete_internal and set(proofs_by_lane) != expected_lanes:
        fail(f"result is missing or inventing proof lanes for {tranche_id}")
    for lane, proof in proofs_by_lane.items():
        if complete_internal:
            if proof.get("result") != "PASSED":
                fail(f"non-passing required proof environment: {tranche_id}:{lane}")
            if proof.get("cleanup_result") not in ("PASSED", "NOT_REQUIRED"):
                fail(f"proof cleanup is not accepted: {tranche_id}:{lane}")
            evidence = proof.get("evidence_sha256")
            if not isinstance(evidence, str) or not HEX64.fullmatch(evidence):
                fail(f"proof environment lacks exact evidence digest: {tranche_id}:{lane}")
            if proof.get("postimage_generation_id") != postimage["source_generation_id"]:
                fail(f"proof environment postimage generation mismatch: {tranche_id}:{lane}")

    blockers = result.get("unresolved_blockers")
    if not isinstance(blockers, list) or len(blockers) != len(set(blockers)) or not all(isinstance(item, str) and item for item in blockers):
        fail(f"result unresolved blockers are malformed: {tranche_id}")
    if result_state == "ACCEPTED":
        if blockers or result.get("all_internal_requirements_closed") is not True:
            fail(f"accepted result retains blockers or open internal requirements: {tranche_id}")
        if result.get("node_runtime_identity") != "v20.20.2":
            fail(f"accepted result lacks exact Node v20.20.2: {tranche_id}")
    elif result_state == "BLOCKED":
        if not blockers or result.get("all_internal_requirements_closed") is not False:
            fail(f"blocked result must name blockers and preserve open internal requirements: {tranche_id}")
        if result.get("node_runtime_identity") not in ("v20.20.2", None):
            fail(f"blocked result contains invalid Node identity: {tranche_id}")
    elif result_state == "SOURCE_COMPLETE_EXTERNAL_PENDING":
        if entry.get("external_acceptance_pending") is not True:
            fail(f"tranche is not eligible for external-pending terminal state: {tranche_id}")
        if not blockers or result.get("all_internal_requirements_closed") is not True:
            fail(f"external-pending result must close internal work and name external blockers: {tranche_id}")
        if result.get("node_runtime_identity") != "v20.20.2":
            fail(f"external-pending result lacks exact Node v20.20.2: {tranche_id}")

    if complete_internal:
        if not actual_changed:
            fail(f"complete tranche result has no source postimage delta: {tranche_id}")
        if not has_exact_owned_change(repo, entry, actual_changed):
            fail(f"complete tranche result changed no exact owned source path: {tranche_id}")
        if require_trusted_evidence:
            validate_trusted_evidence(repo, entry, result, result_path)

    return entry, result, result_path, postimage["source_generation_id"]


def receipt_context(repo: Path, tranche_id: str) -> None:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
    entry = entry_by_id(plan, tranche_id)
    current = state.get("current")
    if not isinstance(current, dict) or current.get("tranche_id") != tranche_id or current.get("state") != "ADMITTED":
        fail(f"tranche is not the unique admitted current tranche: {tranche_id}")
    preimage = load(preimage_path(repo, entry))
    postimage = snapshot_tree(repo)
    compare_secret_metadata(preimage, postimage)
    changed = changed_path_records(preimage, postimage)
    validate_changed_path_authority(repo, plan, entry, changed)
    matrix = matrix_record_map(repo)
    requirement_ids = expected_test_requirement_ids(repo, tranche_id)
    requirements = [
        {
            "test_requirement_id": requirement_id,
            "finding_ids": matrix[requirement_id].get("issue_ids"),
            "production_entrypoint": matrix[requirement_id].get("production_entrypoint_required"),
            "environment": matrix[requirement_id].get("environment"),
            "category": matrix[requirement_id].get("category"),
            "requirement": matrix[requirement_id].get("test_requirement"),
        }
        for requirement_id in requirement_ids
    ]
    context = {
        "program_id": PROGRAM,
        "tranche_id": tranche_id,
        "campaign_order": entry["campaign_order"],
        "stage": entry["stage"],
        "owner": entry["owner"],
        "finding_ids": entry["finding_ids"],
        "acceptance_authority": entry["acceptance_authority"],
        "retained_holds": HOLDS,
        "result_path": entry["result_path"],
        "preimage_path": str(preimage_path(repo, entry).relative_to(repo)),
        "exact_preimage_generation_id": preimage["source_generation_id"],
        "exact_postimage_generation_id": postimage["source_generation_id"],
        "repository_identity": {
            "name": "betting-win-surebet",
            "baseline_archive": BASELINE_ARCHIVE,
            "baseline_sha256": BASELINE_SHA256,
            "source_generation_id": preimage["source_generation_id"],
            "git_commit": preimage.get("git", {}).get("commit"),
        },
        "parent_receipt_sha256": expected_parent_receipt_sha256(repo, plan, entry),
        "previous_receipt_sha256": None,
        "changed_paths": changed,
        "test_requirements": requirements,
        "proof_environment_lanes": sorted(entry.get("test_environments", {}).keys()),
        "allowed_terminal_states": [
            "ACCEPTED",
            "BLOCKED",
            *( ["SOURCE_COMPLETE_EXTERNAL_PENDING"] if entry.get("external_acceptance_pending") is True else [] ),
        ],
    }
    print(json.dumps(context, indent=2, sort_keys=True))


def ensure_operator_window(repo: Path, seconds: int) -> None:
    if seconds < 1:
        fail("operator window must be positive")
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
    stored = state.get("operator_window")
    if stored is None:
        start_epoch = int(datetime.now(timezone.utc).timestamp())
        stored = {
            "started_at": utc_now(),
            "start_epoch": start_epoch,
            "duration_seconds": seconds,
            "deadline_epoch": start_epoch + seconds,
        }
        state["operator_window"] = stored
        atomic_write(state_path, state)
    elif not isinstance(stored, dict):
        fail("operator window state is malformed")
    if stored.get("duration_seconds") != seconds:
        fail(
            f"operator window duration is immutable after first launch; "
            f"stored={stored.get('duration_seconds')} requested={seconds}"
        )
    for key in ("start_epoch", "deadline_epoch"):
        if not isinstance(stored.get(key), int):
            fail(f"operator window lacks integer {key}")
    if stored["deadline_epoch"] != stored["start_epoch"] + seconds:
        fail("operator window deadline is inconsistent")
    print(f"BWS_REMEDIATION_OPERATOR_WINDOW_DEADLINE_EPOCH={stored['deadline_epoch']}")


def check_result(repo: Path, tranche_id: str) -> None:
    _, result, path, _ = validate_result(repo, tranche_id)
    print(f"BWS_REMEDIATION_TRANCHE_RESULT_STATE={result['state']}")
    print(f"BWS_REMEDIATION_TRANCHE_RESULT_VALID={tranche_id}:{digest(path)}")


def advance(repo: Path, tranche_id: str) -> None:
    entry, result, result_path, _ = validate_result(repo, tranche_id)
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    receipt_sha = digest(result_path)
    result_state = result["state"]
    event = {
        "recorded_at": utc_now(),
        "campaign_order": entry["campaign_order"],
        "result_path": entry["result_path"],
        "result_sha256": receipt_sha,
        "result_state": result_state,
        "tranche_id": tranche_id,
    }
    state["history"].append(event)

    if result_state == "ACCEPTED":
        accepted = state["accepted_tranches"] + [tranche_id]
        state["accepted_tranches"] = accepted
        state["last_accepted_order"] = entry["campaign_order"]
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
            state["terminal_state"] = None
            state["controller_eligible"] = len(accepted) >= 13
        atomic_write(state_path, state)
        print(f"BWS_REMEDIATION_CAMPAIGN_ADVANCED={tranche_id}:{entry['campaign_order']}")
        return

    state["current"] = {
        "campaign_order": entry["campaign_order"],
        "tranche_id": tranche_id,
        "stage": entry["stage"],
        "state": "BLOCKED",
        "result_state": result_state,
        "result_path": entry["result_path"],
        "result_sha256": receipt_sha,
        "blocked_at": utc_now(),
    }
    state["terminal_state"] = result_state
    state["controller_eligible"] = len(state["accepted_tranches"]) >= 13
    atomic_write(state_path, state)
    print(f"BWS_REMEDIATION_CAMPAIGN_TERMINAL={tranche_id}:{result_state}:{receipt_sha}")


def check_s2(repo: Path) -> None:
    _, plan_path, _, state_path = paths(repo)
    plan = load(plan_path)
    state = load(state_path)
    validate_runtime_state(repo, plan, state)
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
    group.add_argument("--prepare")
    group.add_argument("--receipt-context")
    group.add_argument("--window-seconds", type=int)
    group.add_argument("--result")
    group.add_argument("--advance")
    group.add_argument("--s2", action="store_true")
    args = parser.parse_args()
    repo = Path(args.repo).resolve() if args.repo else root_from_script()
    package = repo / "package.json"
    if not package.is_file() or package.is_symlink():
        fail(f"repository root invalid: {repo}")
    try:
        package_json = json.loads(package.read_text(encoding="utf-8"))
    except Exception as exc:
        fail(f"package.json is invalid: {exc}")
    if package_json.get("name") != "betting-win-surebet":
        fail(f"repository identity mismatch: {repo}")

    if args.static:
        validate_static(repo)
    elif args.init_state:
        init_state(repo)
    elif args.next_task:
        next_task(repo)
    elif args.prepare:
        prepare_tranche(repo, args.prepare)
    elif args.receipt_context:
        receipt_context(repo, args.receipt_context)
    elif args.window_seconds is not None:
        ensure_operator_window(repo, args.window_seconds)
    elif args.result:
        check_result(repo, args.result)
    elif args.advance:
        advance(repo, args.advance)
    elif args.s2:
        check_s2(repo)


if __name__ == "__main__":
    main()
