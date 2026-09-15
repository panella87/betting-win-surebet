#!/usr/bin/env python3
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
import platform
import re
import secrets
import signal
import subprocess
import sys
import tempfile
import time
import urllib.parse
from pathlib import Path
from typing import Any

PROGRAM = "BWS_FINAL_REMEDIATION_R01_R12_V1"
SCHEMA = "bws-remediation-trusted-evidence-v1"
SECRET_ENV_PATTERN_PARTS = (
    "TOKEN", "PASSWORD", "PASSWD", "SECRET", "CREDENTIAL", "PRIVATE", "COOKIE",
    "AUTH", "API_KEY", "ACCESS_KEY", "PGPASSWORD", "DATABASE_URL", "DB_URL",
    "SSH_AUTH_SOCK", "GITHUB_TOKEN", "AWS_", "AZURE_", "GOOGLE_",
)
SAFE_ENV_EXACT = {
    "PATH", "LANG", "LC_ALL", "LC_CTYPE", "TZ", "TERM", "USER", "LOGNAME", "SHELL",
    "XDG_RUNTIME_DIR", "DBUS_SESSION_BUS_ADDRESS", "DISPLAY", "WAYLAND_DISPLAY",
    "PGHOST", "PGPORT", "PGUSER", "PGDATABASE", "NODE_OPTIONS", "NPM_CONFIG_CACHE",
}
EVIDENCE_EXCLUDED_PREFIXES = ("artifacts/", ".git/", "node_modules/", "dist/", "coverage/")


def die(message: str) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(1)


def sha256_bytes(value: bytes) -> str:
    return hashlib.sha256(value).hexdigest()


def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()


def file_digest_and_size(path: Path) -> tuple[str, int]:
    h = hashlib.sha256()
    size = 0
    if path.exists():
        with path.open("rb") as handle:
            for chunk in iter(lambda: handle.read(1024 * 1024), b""):
                h.update(chunk)
                size += len(chunk)
    return h.hexdigest(), size


def terminate_process_group(process: subprocess.Popen[bytes]) -> int | None:
    try:
        os.killpg(process.pid, signal.SIGTERM)
    except ProcessLookupError:
        pass
    try:
        return process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        try:
            os.killpg(process.pid, signal.SIGKILL)
        except ProcessLookupError:
            pass
        return process.wait(timeout=10)


def canonical_digest(value: Any) -> str:
    return sha256_bytes(json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode())


def atomic_json(path: Path, value: dict[str, Any]) -> None:
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


def load_module(repo: Path):
    path = repo / "docs" / "remediation" / PROGRAM / "activation" / "validate_activation_package.py"
    spec = importlib.util.spec_from_file_location("bws_activation_validator", path)
    if spec is None or spec.loader is None:
        die(f"cannot import activation validator: {path}")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def scrubbed_environment(
    tmp_home: Path,
    tmp_dir: Path,
    tranche: str,
    requirement: str,
    execution_token: str,
) -> tuple[dict[str, str], str]:
    env: dict[str, str] = {}
    for key, value in os.environ.items():
        upper = key.upper()
        if key in SAFE_ENV_EXACT or key.startswith("BWS_"):
            if any(part in upper for part in SECRET_ENV_PATTERN_PARTS):
                continue
            env[key] = value
    env.update(
        {
            "HOME": str(tmp_home),
            "XDG_CONFIG_HOME": str(tmp_home / ".config"),
            "XDG_CACHE_HOME": str(tmp_home / ".cache"),
            "TMPDIR": str(tmp_dir),
            "CI": "1",
            "GIT_TERMINAL_PROMPT": "0",
            "BWS_TRUSTED_EVIDENCE": "1",
            "BWS_ACTIVE_TRANCHE": tranche,
            "BWS_TEST_REQUIREMENT_ID": requirement,
            "BWS_TRUSTED_EXECUTION_TOKEN": execution_token,
        }
    )
    env.setdefault("PATH", os.environ.get("PATH", "/usr/bin:/bin"))
    env.setdefault("LANG", "C.UTF-8")
    env.setdefault("LC_ALL", "C.UTF-8")
    env_fingerprint = canonical_digest(
        {
            "keys": sorted(env),
            "values": {key: sha256_bytes(value.encode()) for key, value in sorted(env.items())},
        }
    )
    return env, env_fingerprint


def node_version(repo: Path, env: dict[str, str]) -> str | None:
    try:
        cp = subprocess.run(
            ["node", "--version"], cwd=repo, env=env, text=True,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30, check=True,
        )
        return cp.stdout.strip() or None
    except Exception:
        return None


def remaining_operator_seconds(module, repo: Path) -> int:
    _, plan_path, _, state_path = module.paths(repo)
    plan = module.load(plan_path)
    state = module.load(state_path)
    module.validate_state(plan, state)
    window = state.get("operator_window")
    if not isinstance(window, dict) or not isinstance(window.get("deadline_epoch"), int):
        die("campaign operator window is absent or malformed")
    return max(0, int(window["deadline_epoch"]) - int(time.time()))



def process_ids_with_token(token: str) -> list[int]:
    marker = f"BWS_TRUSTED_EXECUTION_TOKEN={token}".encode()
    result: list[int] = []
    proc = Path("/proc")
    if not proc.is_dir():
        return result
    for entry in proc.iterdir():
        if not entry.name.isdigit():
            continue
        try:
            environ = (entry / "environ").read_bytes()
        except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
            continue
        if marker in environ.split(b"\0"):
            result.append(int(entry.name))
    return sorted(result)


def cleanup_owned_processes(token: str) -> tuple[str, list[int]]:
    survivors = process_ids_with_token(token)
    if not survivors:
        return "PASSED", []
    for pid in survivors:
        try:
            os.kill(pid, signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            pass
    deadline = time.monotonic() + 5
    while time.monotonic() < deadline:
        remaining = process_ids_with_token(token)
        if not remaining:
            return "FAILED", survivors
        time.sleep(0.1)
    for pid in process_ids_with_token(token):
        try:
            os.kill(pid, signal.SIGKILL)
        except (ProcessLookupError, PermissionError):
            pass
    return "FAILED", survivors

PYTHON_WRAPPER_CODE = r"""from __future__ import annotations
import atexit
import os
import runpy
import sys
import threading

_root = os.path.realpath(os.environ.get("BWS_TRACE_REPO", ""))
_output = os.environ.get("BWS_PYTHON_TRACE_DIR", "")
_seen = set()


def _trace(frame, event, arg):
    if event in {"call", "line"}:
        filename = os.path.realpath(frame.f_code.co_filename)
        if _root and (filename == _root or filename.startswith(_root + os.sep)):
            _seen.add(filename)
    return _trace


def _write():
    if not _output:
        return
    try:
        os.makedirs(_output, mode=0o700, exist_ok=True)
        target = os.path.join(_output, str(os.getpid()) + ".paths")
        with open(target, "w", encoding="utf-8") as handle:
            for value in sorted(_seen):
                handle.write(value + "\n")
    except Exception:
        pass


def _fail(message):
    print(f"BWS Python instrumentation error: {message}", file=sys.stderr)
    raise SystemExit(2)


def _run(argv):
    if not argv:
        _fail("missing Python target")
    index = 0
    while index < len(argv):
        value = argv[index]
        if value == "--":
            index += 1
            break
        if value in {"-u", "-B", "-E", "-s", "-S", "-O", "-OO", "-q", "-I"}:
            index += 1
            continue
        if value in {"-X", "-W"}:
            if index + 1 >= len(argv):
                _fail(f"missing value for {value}")
            index += 2
            continue
        if value.startswith(("-X", "-W")) and len(value) > 2:
            index += 1
            continue
        if value == "-m":
            if index + 1 >= len(argv):
                _fail("missing module after -m")
            module = argv[index + 1]
            sys.argv = [module, *argv[index + 2:]]
            runpy.run_module(module, run_name="__main__", alter_sys=True)
            return
        if value in {"-c", "-"}:
            _fail(f"inline or stdin Python execution is not accepted: {value}")
        if value.startswith("-"):
            _fail(f"unsupported Python interpreter option: {value}")
        break
    if index >= len(argv):
        _fail("missing Python script path")
    script = os.path.realpath(argv[index])
    if not os.path.isfile(script):
        _fail(f"Python script is missing: {script}")
    sys.argv = [script, *argv[index + 1:]]
    sys.path[0] = os.path.dirname(script)
    runpy.run_path(script, run_name="__main__")


sys.settrace(_trace)
threading.settrace(_trace)
atexit.register(_write)
_run(sys.argv[1:])
"""


BASH_ENV_CODE = r'''if [[ -n ${BWS_BASH_TRACE_FILE:-} ]]; then
  trap 'printf "%s\\n" "${BASH_SOURCE[0]}" >> "$BWS_BASH_TRACE_FILE"' DEBUG
fi
'''


def normalize_repo_path(repo: Path, candidate: str | Path, cwd: Path | None = None) -> str | None:
    try:
        value = Path(candidate)
        target = value.resolve() if value.is_absolute() else ((cwd or repo) / value).resolve()
        relative = target.relative_to(repo)
    except (OSError, ValueError):
        return None
    if not target.is_file() or target.is_symlink():
        return None
    return relative.as_posix()


def process_evidence_paths(token: str, repo: Path) -> set[str]:
    result: set[str] = set()
    for pid in process_ids_with_token(token):
        proc = Path(f"/proc/{pid}")
        try:
            cwd = Path(os.readlink(proc / "cwd")).resolve()
        except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
            cwd = repo
        try:
            tokens = [
                part.decode("utf-8", errors="replace")
                for part in (proc / "cmdline").read_bytes().split(b"\0")
                if part
            ]
        except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
            tokens = []
        for token_value in tokens:
            normalized = normalize_repo_path(repo, token_value, cwd)
            if normalized is not None and not normalized.startswith(EVIDENCE_EXCLUDED_PREFIXES):
                result.add(normalized)
        try:
            executable = Path(os.readlink(proc / "exe"))
        except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
            executable = None
        if executable is not None:
            normalized = normalize_repo_path(repo, executable, cwd)
            if normalized is not None and not normalized.startswith(EVIDENCE_EXCLUDED_PREFIXES):
                result.add(normalized)
    return result


def write_instrumentation(temp: Path) -> tuple[Path, Path, Path, Path]:
    node_coverage_dir = temp / "node-coverage"
    python_trace_dir = temp / "python-trace"
    python_wrapper = temp / "python-wrapper.py"
    bash_trace_file = temp / "bash-trace.paths"
    node_coverage_dir.mkdir(mode=0o700)
    python_trace_dir.mkdir(mode=0o700)
    python_wrapper.write_text(PYTHON_WRAPPER_CODE, encoding="utf-8")
    os.chmod(python_wrapper, 0o600)
    bash_env = temp / "bash-env.sh"
    bash_env.write_text(BASH_ENV_CODE, encoding="utf-8")
    os.chmod(bash_env, 0o600)
    return node_coverage_dir, python_trace_dir, python_wrapper, bash_env


def python_instrumented_command(
    command: list[str],
    executable_path: Path | None,
    python_wrapper: Path,
) -> list[str]:
    if not command or executable_path is None:
        return command
    executable_name = Path(command[0]).name.lower()
    is_python_interpreter = bool(
        re.fullmatch(r"python(?:3(?:\.\d+)*)?", executable_name)
        or executable_name in {"pypy", "pypy3"}
    )
    if is_python_interpreter:
        return [str(executable_path), str(python_wrapper), *command[1:]]
    try:
        first_line = executable_path.open("rb").readline(512).decode("utf-8", errors="replace")
    except OSError:
        first_line = ""
    if first_line.startswith("#!") and "python" in first_line.lower():
        return [sys.executable, str(python_wrapper), str(executable_path), *command[1:]]
    return command


def collect_entrypoint_evidence(
    repo: Path,
    process_paths: set[str],
    node_coverage_dir: Path,
    python_trace_dir: Path,
    bash_trace_file: Path,
) -> list[str]:
    # Process command lines are retained for diagnostics but cannot by themselves
    # prove that a production entrypoint executed. Acceptance evidence comes only
    # from language/runtime instrumentation below.
    result: set[str] = set()
    if node_coverage_dir.is_dir():
        for coverage in node_coverage_dir.glob("*.json"):
            try:
                document = json.loads(coverage.read_text(encoding="utf-8"))
            except Exception:
                continue
            records = document.get("result") if isinstance(document, dict) else None
            if not isinstance(records, list):
                continue
            for record in records:
                if not isinstance(record, dict):
                    continue
                url = record.get("url")
                if not isinstance(url, str) or not url:
                    continue
                candidate = (
                    urllib.parse.unquote(urllib.parse.urlparse(url).path)
                    if url.startswith("file:")
                    else url
                )
                normalized = normalize_repo_path(repo, candidate)
                if normalized is not None and not normalized.startswith(EVIDENCE_EXCLUDED_PREFIXES):
                    result.add(normalized)
    if python_trace_dir.is_dir():
        for trace in python_trace_dir.glob("*.paths"):
            try:
                lines = trace.read_text(encoding="utf-8", errors="replace").splitlines()
            except OSError:
                continue
            for line in lines:
                normalized = normalize_repo_path(repo, line)
                if normalized is not None and not normalized.startswith(EVIDENCE_EXCLUDED_PREFIXES):
                    result.add(normalized)
    if bash_trace_file.is_file():
        try:
            lines = bash_trace_file.read_text(encoding="utf-8", errors="replace").splitlines()
        except OSError:
            lines = []
        for line in lines:
            normalized = normalize_repo_path(repo, line)
            if normalized is not None and not normalized.startswith(EVIDENCE_EXCLUDED_PREFIXES):
                result.add(normalized)
    return sorted(result)


def execute_test(
    module,
    repo: Path,
    tranche_id: str,
    item: dict[str, Any],
    evidence_root: Path,
) -> dict[str, Any]:
    requirement_id = item["test_requirement_id"]
    command = item["command"]
    working = Path(item["working_directory"])
    cwd = working.resolve() if working.is_absolute() else (repo / working).resolve()
    try:
        cwd.relative_to(repo)
    except ValueError:
        die(f"test working directory escapes repository: {requirement_id}")

    requested_timeout = int(item["timeout_seconds"])
    max_timeout = int(os.environ.get("BWS_TRUSTED_TEST_MAX_SECONDS", str(72 * 3600)))
    max_output_bytes = int(os.environ.get("BWS_TRUSTED_TEST_MAX_OUTPUT_BYTES", str(64 * 1024 * 1024)))
    if max_timeout < 1 or max_output_bytes < 1024:
        die("trusted test timeout or output bound is invalid")
    remaining = remaining_operator_seconds(module, repo)
    effective_timeout = min(requested_timeout, max_timeout, remaining)
    if effective_timeout < 1:
        return {
            "test_requirement_id": requirement_id,
            "command": command,
            "working_directory": item["working_directory"],
            "timeout_seconds": requested_timeout,
            "status": "BLOCKED",
            "exit_code": None,
            "stdout_sha256": sha256_bytes(b""),
            "stderr_sha256": sha256_bytes(b"operator window exhausted"),
            "stdout_size": 0,
            "stderr_size": len(b"operator window exhausted"),
            "node_version": None,
            "environment_generation_id": "sha256:" + sha256_bytes(b"operator-window-exhausted"),
            "duration_ms": 0,
            "cleanup_result": "NOT_REQUIRED",
            "survivor_pids": [],
            "entrypoint_evidence_paths": [],
            "process_observation_paths": [],
        }

    safe_name = requirement_id.replace("/", "_")
    with tempfile.TemporaryDirectory(prefix=f"{safe_name}-", dir=evidence_root) as temp_name:
        temp = Path(temp_name)
        home = temp / "home"
        scratch = temp / "tmp"
        home.mkdir(mode=0o700)
        scratch.mkdir(mode=0o700)
        stdout_path = temp / "stdout.bin"
        stderr_path = temp / "stderr.bin"
        node_coverage_dir, python_trace_dir, python_wrapper, bash_env_file = write_instrumentation(temp)
        bash_trace_file = temp / "bash-trace.paths"
        execution_token = secrets.token_hex(24)
        env, _unused_fingerprint = scrubbed_environment(
            home, scratch, tranche_id, requirement_id, execution_token
        )
        env.update(
            {
                "NODE_V8_COVERAGE": str(node_coverage_dir),
                "BWS_TRACE_REPO": str(repo),
                "BWS_PYTHON_TRACE_DIR": str(python_trace_dir),
                "BWS_BASH_TRACE_FILE": str(bash_trace_file),
                "BASH_ENV": str(bash_env_file),
                "PYTHONPATH": str(repo),
            }
        )
        env_fingerprint = canonical_digest(
            {
                "keys": sorted(env),
                "values": {key: sha256_bytes(value.encode()) for key, value in sorted(env.items())},
            }
        )
        observed_node = node_version(repo, env)
        executable_path = shutil_which(command[0], env.get("PATH", ""), cwd) if command else None
        executed_command = python_instrumented_command(command, executable_path, python_wrapper)
        executable_sha = sha256_file(executable_path) if executable_path and executable_path.is_file() else None
        environment_generation = "sha256:" + canonical_digest(
            {
                "command": command,
                "executed_command": executed_command,
                "cwd": str(cwd.relative_to(repo)),
                "environment_sha256": env_fingerprint,
                "executable": str(executable_path) if executable_path else None,
                "executable_sha256": executable_sha,
                "instrumentation_sha256": sha256_bytes((PYTHON_WRAPPER_CODE + BASH_ENV_CODE).encode()),
                "node_version": observed_node,
                "platform": platform.platform(),
                "python": sys.version,
            }
        )

        started = time.monotonic()
        status = "FAILED"
        return_code: int | None = None
        observed_process_paths: set[str] = set()
        with stdout_path.open("wb") as stdout, stderr_path.open("wb") as stderr:
            try:
                process = subprocess.Popen(
                    executed_command,
                    cwd=cwd,
                    env=env,
                    stdin=subprocess.DEVNULL,
                    stdout=stdout,
                    stderr=stderr,
                    start_new_session=True,
                )
            except Exception as exc:
                stderr.write(f"unable to start command: {exc}\n".encode())
            else:
                deadline = time.monotonic() + effective_timeout
                while True:
                    observed_process_paths.update(process_evidence_paths(execution_token, repo))
                    observed = process.poll()
                    if observed is not None:
                        return_code = observed
                        status = "PASSED" if observed == 0 else "FAILED"
                        break
                    stdout.flush()
                    stderr.flush()
                    if stdout_path.stat().st_size > max_output_bytes or stderr_path.stat().st_size > max_output_bytes:
                        status = "OUTPUT_LIMIT_EXCEEDED"
                        return_code = terminate_process_group(process)
                        break
                    if time.monotonic() >= deadline:
                        status = "TIMED_OUT"
                        return_code = terminate_process_group(process)
                        break
                    time.sleep(0.05)
        observed_process_paths.update(process_evidence_paths(execution_token, repo))
        cleanup_result, survivor_pids = cleanup_owned_processes(execution_token)
        entrypoint_evidence_paths = collect_entrypoint_evidence(
            repo,
            observed_process_paths,
            node_coverage_dir,
            python_trace_dir,
            bash_trace_file,
        )
        stdout_sha, stdout_size = file_digest_and_size(stdout_path)
        stderr_sha, stderr_size = file_digest_and_size(stderr_path)
        if stdout_size > max_output_bytes or stderr_size > max_output_bytes:
            status = "OUTPUT_LIMIT_EXCEEDED"
            if return_code == 0:
                return_code = 126
        if cleanup_result != "PASSED" and status == "PASSED":
            status = "FAILED"
            if return_code == 0:
                return_code = 125
        duration_ms = int((time.monotonic() - started) * 1000)
        return {
            "test_requirement_id": requirement_id,
            "command": command,
            "working_directory": item["working_directory"],
            "timeout_seconds": requested_timeout,
            "status": status,
            "exit_code": return_code,
            "stdout_sha256": stdout_sha,
            "stderr_sha256": stderr_sha,
            "stdout_size": stdout_size,
            "stderr_size": stderr_size,
            "node_version": observed_node,
            "environment_generation_id": environment_generation,
            "duration_ms": duration_ms,
            "cleanup_result": cleanup_result,
            "survivor_pids": survivor_pids,
            "entrypoint_evidence_paths": entrypoint_evidence_paths,
            "process_observation_paths": sorted(observed_process_paths),
        }

def shutil_which(executable: str, path_value: str, cwd: Path) -> Path | None:
    candidate = Path(executable)
    if candidate.is_absolute():
        return candidate.resolve() if candidate.exists() else None
    if "/" in executable:
        target = (cwd / candidate).resolve()
        return target if target.exists() else None
    for directory in path_value.split(os.pathsep):
        target = Path(directory) / executable
        if target.is_file() and os.access(target, os.X_OK):
            return target.resolve()
    return None


def normalize_candidate(module, repo: Path, tranche_id: str) -> tuple[dict[str, Any], dict[str, Any], Path]:
    _, plan_path, _, _ = module.paths(repo)
    plan = module.load(plan_path)
    entry = module.entry_by_id(plan, tranche_id)
    result_path = repo / entry["result_path"]
    result = module.load(result_path)
    if result.get("state") == "BLOCKED":
        return entry, result, result_path

    tests = result.get("test_commands_and_results")
    if not isinstance(tests, list):
        die(f"candidate result tests are malformed: {tranche_id}")
    for item in tests:
        if not isinstance(item, dict):
            die(f"candidate result contains non-object test: {tranche_id}")
        item["status"] = "PASSED"
        item["exit_code"] = 0
        item["stdout_sha256"] = "0" * 64
        item["stderr_sha256"] = "0" * 64
        item["node_version"] = "v20.20.2"
        item["environment_generation_id"] = "sha256:" + "0" * 64

    result["proof_environments"] = [
        {
            "lane": lane,
            "identity": f"candidate-untrusted:{module.canonical_digest({'tranche': tranche_id, 'lane': lane})}",
            "result": "PASSED",
            "evidence_sha256": "0" * 64,
            "cleanup_result": "PASSED",
            "source_generation_id": result["exact_preimage_generation_id"],
            "postimage_generation_id": result["exact_postimage_generation_id"],
        }
        for lane in sorted(entry.get("test_environments", {}))
    ]
    result["node_runtime_identity"] = "v20.20.2"
    module.atomic_write(result_path, result)
    return entry, result, result_path


def verify(repo: Path, tranche_id: str) -> None:
    if not Path("/proc").is_dir():
        die("trusted evidence replay requires Linux /proc process ownership evidence")
    module = load_module(repo)
    module.validate_static(repo)
    entry, candidate, result_path = normalize_candidate(module, repo, tranche_id)
    if candidate.get("state") == "BLOCKED":
        module.validate_result(repo, tranche_id, require_trusted_evidence=False)
        print(f"BWS_REMEDIATION_TRUSTED_EVIDENCE_SKIPPED={tranche_id}:BLOCKED")
        return

    entry, candidate, result_path, _ = module.validate_result(
        repo, tranche_id, require_trusted_evidence=False
    )
    evidence_root = module.campaign_artifact_root(repo) / "trusted-evidence"
    evidence_root.mkdir(parents=True, exist_ok=True)
    os.chmod(evidence_root, 0o700)

    matrix = module.matrix_record_map(repo)
    executions: list[dict[str, Any]] = []
    final_tests: list[dict[str, Any]] = []
    failed: list[str] = []
    tests = candidate["test_commands_and_results"]
    for item in tests:
        execution = execute_test(module, repo, tranche_id, item, evidence_root)
        executions.append(execution)
        final_item = dict(item)
        for key in (
            "status", "exit_code", "stdout_sha256", "stderr_sha256",
            "node_version", "environment_generation_id",
        ):
            final_item[key] = execution[key]
        final_tests.append(final_item)
        if execution["status"] != "PASSED" or execution["exit_code"] != 0:
            failed.append(f"TRUSTED_TEST_FAILED:{item['test_requirement_id']}:{execution['status']}:{execution['exit_code']}")
            break

    candidate["test_commands_and_results"] = final_tests
    postimage = candidate["exact_postimage_generation_id"]
    preimage = candidate["exact_preimage_generation_id"]
    lanes: dict[str, list[dict[str, Any]]] = {}
    for execution in executions:
        requirement = matrix[execution["test_requirement_id"]]
        lane = requirement.get("environment")
        if not isinstance(lane, str) or not lane:
            die(f"test matrix environment is malformed: {execution['test_requirement_id']}")
        lanes.setdefault(lane, []).append(execution)
    proof_records: list[dict[str, Any]] = []
    for lane in sorted(lanes):
        lane_exec = lanes[lane]
        lane_passed = all(
            item["status"] == "PASSED"
            and item["exit_code"] == 0
            and item.get("cleanup_result") == "PASSED"
            for item in lane_exec
        )
        evidence_sha = module.canonical_digest(lane_exec)
        proof_records.append(
            {
                "lane": lane,
                "identity": f"trusted-execution:sha256:{evidence_sha}",
                "result": "PASSED" if lane_passed else "FAILED",
                "evidence_sha256": evidence_sha,
                "cleanup_result": "PASSED" if lane_passed else "FAILED",
                "source_generation_id": preimage,
                "postimage_generation_id": postimage,
            }
        )
    candidate["proof_environments"] = proof_records

    observed_node = None
    for execution in executions:
        if execution.get("node_version"):
            observed_node = execution["node_version"]
            break
    if observed_node is None:
        observed_node = subprocess.run(
            ["node", "--version"], cwd=repo, text=True,
            stdout=subprocess.PIPE, stderr=subprocess.DEVNULL, timeout=30, check=False,
        ).stdout.strip() or None

    if failed or observed_node != "v20.20.2":
        if observed_node != "v20.20.2":
            failed.append(f"EXACT_NODE_REQUIRED:observed={observed_node!r}")
        candidate["state"] = "BLOCKED"
        candidate["all_internal_requirements_closed"] = False
        candidate["unresolved_blockers"] = sorted(set((candidate.get("unresolved_blockers") or []) + failed))
        candidate["node_runtime_identity"] = observed_node if observed_node == "v20.20.2" else None
    else:
        candidate["node_runtime_identity"] = "v20.20.2"

    module.atomic_write(result_path, candidate)
    if candidate["state"] in {"ACCEPTED", "SOURCE_COMPLETE_EXTERNAL_PENDING"}:
        if len(final_tests) != len(tests):
            die(f"trusted execution did not run every required test: {tranche_id}")
        attestation = {
            "schema": SCHEMA,
            "program_id": PROGRAM,
            "tranche_id": tranche_id,
            "campaign_order": entry["campaign_order"],
            "verified_at": module.utc_now(),
            "clock_authority": "UTC_SYSTEM_CLOCK_AT_TRUSTED_EVIDENCE_REPLAY",
            "result_sha256": module.digest(result_path),
            "result_state": candidate["state"],
            "exact_preimage_generation_id": preimage,
            "exact_postimage_generation_id": postimage,
            "validator_sha256": module.digest(Path(module.__file__).resolve()),
            "verifier_sha256": sha256_file(Path(__file__).resolve()),
            "test_records_sha256": module.canonical_digest(candidate["test_commands_and_results"]),
            "proof_environments_sha256": module.canonical_digest(candidate["proof_environments"]),
            "executions_sha256": module.canonical_digest(executions),
            "all_commands_executed": True,
            "executions": executions,
        }
        attestation_path = module.trusted_evidence_path(repo, entry)
        atomic_json(attestation_path, attestation)

    module.validate_result(repo, tranche_id, require_trusted_evidence=True)
    print(
        f"BWS_REMEDIATION_TRUSTED_EVIDENCE_VALID={tranche_id}:"
        f"state={candidate['state']}:tests={len(final_tests)}"
    )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--tranche", required=True)
    args = parser.parse_args()
    repo = Path(args.repo).resolve()
    package = repo / "package.json"
    if not package.is_file() or package.is_symlink():
        die(f"invalid repository root: {repo}")
    try:
        if json.loads(package.read_text()).get("name") != "betting-win-surebet":
            die(f"repository identity mismatch: {repo}")
    except Exception as exc:
        die(f"invalid package.json: {exc}")
    verify(repo, args.tranche)


if __name__ == "__main__":
    main()
