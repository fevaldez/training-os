#!/usr/bin/env python3
"""Build/verify a local, SHA-pinned preview directory. Never serve or deploy it."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys

REPOSITORY = "https://github.com/fevaldez/training-os"
BASE = "b82218dbc05662124821d1d6c27369ae717dd767"
SOURCE = "54e25199e33b8cc725d86881b950bb68b4cf0cd4"
BUILD_ID = "pr-s1-" + SOURCE
FILES = (
    "index.html", "version.json", "manifest.webmanifest",
    "training-os-loop-v1-180.png", "training-os-loop-v1-192.png",
    "training-os-loop-v1-512.png", "training-os-loop-v1-1024.png",
)


def git(repo, *args):
    return subprocess.check_output(["git", "-C", str(repo), *args], stderr=subprocess.PIPE)


def sha256(data):
    return hashlib.sha256(data).hexdigest()


def expected_files(repo):
    if git(repo, "cat-file", "-t", SOURCE).strip() != b"commit":
        raise ValueError("Pinned candidate is not a commit")
    git(repo, "merge-base", "--is-ancestor", BASE, SOURCE)
    payload = {}
    for name in FILES:
        entry = git(repo, "ls-tree", SOURCE, "--", name).split(b"\t", 1)[0].split()
        if len(entry) != 3 or entry[0] != b"100644" or entry[1] != b"blob":
            raise ValueError("Expected regular source blob: " + name)
        payload["training-os/" + name] = git(repo, "cat-file", "blob", SOURCE + ":" + name)
    version = json.loads(payload["training-os/version.json"])
    if version["index_sha256"] != sha256(payload["training-os/index.html"]):
        raise ValueError("Candidate index hash disagrees with candidate version.json")
    manifest = json.loads(payload["training-os/manifest.webmanifest"])
    if any(manifest[key] != "/training-os/" for key in ("id", "start_url", "scope")):
        raise ValueError("Pinned manifest path changed")
    provenance = {
        "format": "training-os-preview-v1", "repository": REPOSITORY,
        "sourceCommit": SOURCE, "baseCommit": BASE, "buildId": BUILD_ID,
        "releaseLabel": version["release"], "entryPath": "/training-os/",
        "files": {name: sha256(data) for name, data in sorted(payload.items())},
    }
    payload["preview-provenance.json"] = (json.dumps(provenance, indent=2, sort_keys=True) + "\n").encode()
    return payload


def safe_output(repo, output):
    # Do not modify any registered checkout, Git metadata, or caller's source tree.
    if output.is_symlink():
        raise ValueError("Output must not be a symlink")
    resolved = output.resolve()
    roots = [Path(os.fsdecode(field[len(b"worktree "):])).resolve()
             for field in git(repo, "worktree", "list", "--porcelain", "-z").split(b"\0")
             if field.startswith(b"worktree ")]
    common = Path(os.fsdecode(git(repo, "rev-parse", "--path-format=absolute", "--git-common-dir")).strip()).resolve()
    roots.append(common)
    for root in roots:
        if resolved == root or root in resolved.parents:
            raise ValueError("Output must be outside all Git checkouts and metadata")
    # Also reject an unrelated checkout selected as the destination.
    probe = resolved if resolved.exists() else resolved.parent
    if not probe.is_dir():
        raise ValueError("Output parent must already exist as a directory")
    try:
        git(probe, "rev-parse", "--show-toplevel")
    except subprocess.CalledProcessError:
        pass
    else:
        raise ValueError("Output must be outside any Git checkout")
    return resolved


def verify(output, payload):
    if not output.is_dir():
        raise ValueError("Bundle directory is missing")
    actual = set()
    for path in output.rglob("*"):
        if path.is_symlink():
            raise ValueError("Symlink in bundle: " + str(path))
        if path.is_dir():
            if path.relative_to(output).as_posix() != "training-os":
                raise ValueError("Unexpected directory: " + str(path))
        elif path.is_file():
            actual.add(path.relative_to(output).as_posix())
        else:
            raise ValueError("Non-regular bundle entry: " + str(path))
    if actual != set(payload):
        raise ValueError("Bundle file set differs from the pinned allowlist")
    for name, data in payload.items():
        if (output / name).read_bytes() != data:
            raise ValueError("Bundle differs from pinned bytes: " + name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--repo", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--output", required=True, type=Path, help="New directory outside all checkouts")
    parser.add_argument("--verify-only", action="store_true", help="Read-only comparison with pinned Git blobs")
    args = parser.parse_args()
    try:
        output = safe_output(args.repo, args.output)
        payload = expected_files(args.repo)
        if not args.verify_only:
            # Exclusive creation: never replace an existing artifact or user's files.
            output.mkdir(exist_ok=False)
            (output / "training-os").mkdir()
            for name, data in payload.items():
                with (output / name).open("xb") as handle:
                    handle.write(data)
        verify(output, payload)
        print(json.dumps({"status": "LOCAL_VERIFIED", "buildId": BUILD_ID,
                          "sourceCommit": SOURCE, "fileCount": len(payload),
                          "output": str(output), "deployed": False}, sort_keys=True))
        return 0
    except (ValueError, OSError, KeyError, subprocess.CalledProcessError) as error:
        # Never print Git stderr, environment, credentials, or source contents.
        print("Preview preparation failed: " + str(error), file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
