#!/usr/bin/env python3
from __future__ import annotations

import argparse
import ctypes
import os
import signal
import subprocess
import sys
import time
from pathlib import Path
from typing import Iterable

TOKEN_ENV = "BWS_REMEDIATION_CHILD_TOKEN"
SECRET_ENV_KEYS = {
    "GITHUB_TOKEN",
    "GH_TOKEN",
    "SSH_AUTH_SOCK",
    "SSH_AGENT_PID",
    "PGPASSWORD",
    "DATABASE_URL",
    "DB_URL",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_SESSION_TOKEN",
    "AZURE_CLIENT_SECRET",
    "GOOGLE_APPLICATION_CREDENTIALS",
}
PR_SET_CHILD_SUBREAPER = 36


def fail(message: str, code: int = 2) -> None:
    print(f"ERROR: {message}", file=sys.stderr)
    raise SystemExit(code)


def install_subreaper() -> None:
    try:
        libc = ctypes.CDLL(None, use_errno=True)
        result = libc.prctl(PR_SET_CHILD_SUBREAPER, 1, 0, 0, 0)
    except Exception as exc:
        fail(f"cannot enable child-subreaper containment: {exc}")
    if result != 0:
        errno = ctypes.get_errno()
        fail(f"cannot enable child-subreaper containment: errno={errno}")


def proc_stat(pid: int) -> tuple[int, int] | None:
    try:
        raw = Path(f"/proc/{pid}/stat").read_text(encoding="utf-8", errors="replace")
    except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
        return None
    close = raw.rfind(")")
    if close < 0:
        return None
    fields = raw[close + 2 :].split()
    if len(fields) < 4:
        return None
    try:
        # After the closing parenthesis: state, ppid, pgrp, session, ...
        return int(fields[1]), int(fields[2])
    except ValueError:
        return None


def proc_has_token(pid: int, token: str) -> bool:
    marker = f"{TOKEN_ENV}={token}".encode()
    try:
        return marker in Path(f"/proc/{pid}/environ").read_bytes().split(b"\0")
    except (FileNotFoundError, PermissionError, ProcessLookupError, OSError):
        return False


def snapshot_processes() -> dict[int, tuple[int, int]]:
    snapshot: dict[int, tuple[int, int]] = {}
    proc = Path("/proc")
    if not proc.is_dir():
        fail("bounded child containment requires Linux /proc")
    for entry in proc.iterdir():
        if not entry.name.isdigit():
            continue
        pid = int(entry.name)
        value = proc_stat(pid)
        if value is not None:
            snapshot[pid] = value
    return snapshot


def descendants(snapshot: dict[int, tuple[int, int]], roots: Iterable[int]) -> set[int]:
    result = {pid for pid in roots if pid in snapshot}
    changed = True
    while changed:
        changed = False
        for pid, (ppid, _pgrp) in snapshot.items():
            if pid not in result and ppid in result:
                result.add(pid)
                changed = True
    return result


def living(pids: Iterable[int]) -> set[int]:
    current = os.getpid()
    result: set[int] = set()
    for pid in pids:
        if pid in {current, 0, 1}:
            continue
        try:
            os.kill(pid, 0)
        except (ProcessLookupError, PermissionError):
            continue
        result.add(pid)
    return result


def reap_children() -> None:
    while True:
        try:
            pid, _status = os.waitpid(-1, os.WNOHANG)
        except ChildProcessError:
            return
        if pid == 0:
            return


def terminate_owned(root_pid: int, known: set[int], token: str, grace_seconds: float) -> tuple[list[int], list[int]]:
    current = os.getpid()
    snapshot = snapshot_processes()
    owned = set(known)
    owned.update(descendants(snapshot, {current, root_pid}))
    owned.update(pid for pid in snapshot if proc_has_token(pid, token))
    owned.discard(current)
    owned.discard(0)
    owned.discard(1)
    initially_living = sorted(living(owned - {root_pid}))

    try:
        os.killpg(root_pid, signal.SIGTERM)
    except (ProcessLookupError, PermissionError):
        pass
    for pid in sorted(living(owned), reverse=True):
        try:
            os.kill(pid, signal.SIGTERM)
        except (ProcessLookupError, PermissionError):
            pass

    deadline = time.monotonic() + grace_seconds
    while time.monotonic() < deadline:
        reap_children()
        snapshot = snapshot_processes()
        observed = set(owned)
        observed.update(descendants(snapshot, {current, root_pid}))
        observed.update(pid for pid in snapshot if proc_has_token(pid, token))
        if not living(observed):
            return initially_living, []
        time.sleep(0.05)

    snapshot = snapshot_processes()
    remaining = set(owned)
    remaining.update(descendants(snapshot, {current, root_pid}))
    remaining.update(pid for pid in snapshot if proc_has_token(pid, token))
    for pid in sorted(living(remaining), reverse=True):
        try:
            os.kill(pid, signal.SIGKILL)
        except (ProcessLookupError, PermissionError):
            pass

    deadline = time.monotonic() + max(2.0, grace_seconds)
    while time.monotonic() < deadline:
        reap_children()
        snapshot = snapshot_processes()
        observed = set(remaining)
        observed.update(descendants(snapshot, {current, root_pid}))
        observed.update(pid for pid in snapshot if proc_has_token(pid, token))
        survivors = living(observed)
        if not survivors:
            return initially_living, []
        time.sleep(0.05)
    return initially_living, sorted(survivors)


def normalized_exit_code(returncode: int | None) -> int:
    if returncode is None:
        return 125
    if returncode < 0:
        return min(255, 128 + abs(returncode))
    return min(255, returncode)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--timeout-seconds", required=True, type=int)
    parser.add_argument("--kill-grace-seconds", type=float, default=10.0)
    parser.add_argument("--label", required=True)
    parser.add_argument("command", nargs=argparse.REMAINDER)
    args = parser.parse_args()

    repo = Path(args.repo).resolve()
    if not repo.is_dir() or (repo / "package.json").is_symlink():
        fail(f"invalid repository root: {repo}")
    if args.timeout_seconds < 1 or args.kill_grace_seconds < 1:
        fail("timeout and kill grace must be positive")
    command = list(args.command)
    if command and command[0] == "--":
        command = command[1:]
    if not command or any(not isinstance(part, str) or not part for part in command):
        fail("bounded child command is missing or malformed")

    install_subreaper()
    token = os.urandom(32).hex()
    env = os.environ.copy()
    for key in SECRET_ENV_KEYS:
        env.pop(key, None)
    env.update(
        {
            TOKEN_ENV: token,
            "GIT_TERMINAL_PROMPT": "0",
            "GCM_INTERACTIVE": "Never",
            "GIT_ALLOW_PROTOCOL": "file",
            "GIT_ASKPASS": "/bin/false",
            "SSH_ASKPASS": "/bin/false",
        }
    )

    interrupted: int | None = None

    def on_signal(signum: int, _frame: object) -> None:
        nonlocal interrupted
        interrupted = signum

    for signum in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(signum, on_signal)

    try:
        process = subprocess.Popen(
            command,
            cwd=repo,
            env=env,
            stdin=None,
            stdout=None,
            stderr=None,
            start_new_session=True,
        )
    except Exception as exc:
        fail(f"unable to start bounded child {args.label}: {exc}")

    known: set[int] = {process.pid}
    supervisor_pid = os.getpid()
    deadline = time.monotonic() + args.timeout_seconds
    timed_out = False
    while True:
        snapshot = snapshot_processes()
        known.update(descendants(snapshot, {supervisor_pid, process.pid}))
        known.update(pid for pid in snapshot if proc_has_token(pid, token))
        observed = process.poll()
        if interrupted is not None:
            break
        if observed is not None:
            # Permit subreaper reparenting to settle before final containment check.
            time.sleep(0.05)
            break
        if time.monotonic() >= deadline:
            timed_out = True
            break
        time.sleep(0.05)

    leaked, survivors = terminate_owned(process.pid, known, token, args.kill_grace_seconds)
    try:
        process.wait(timeout=1)
    except (subprocess.TimeoutExpired, ChildProcessError):
        pass
    reap_children()

    if survivors:
        print(
            f"ERROR: bounded child containment failed label={args.label} survivors={','.join(map(str, survivors))}",
            file=sys.stderr,
        )
        raise SystemExit(125)
    if interrupted is not None:
        print(f"BWS_BOUNDED_CHILD_INTERRUPTED label={args.label} signal={interrupted}", file=sys.stderr)
        raise SystemExit(130)
    if timed_out:
        print(
            f"BWS_BOUNDED_CHILD_TIMEOUT label={args.label} timeout_seconds={args.timeout_seconds}",
            file=sys.stderr,
        )
        raise SystemExit(124)
    if leaked:
        print(
            f"ERROR: bounded child left descendants after its root exited "
            f"label={args.label} terminated={','.join(map(str, leaked))}",
            file=sys.stderr,
        )
        raise SystemExit(125)

    code = normalized_exit_code(process.returncode)
    print(f"BWS_BOUNDED_CHILD_RESULT label={args.label} exit={code} containment=PASSED")
    raise SystemExit(code)


if __name__ == "__main__":
    main()
