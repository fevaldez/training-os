#!/usr/bin/env python3
"""Focused checks of the non-deploying preview boundary; no application QA."""
import contextlib
import importlib.util
import io
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("preview", Path(__file__).with_name("prepare_pr_s1_preview.py"))
preview = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(preview)
REPO = Path(__file__).resolve().parents[1]
SCRIPT = Path(preview.__file__)


class PreviewBoundary(unittest.TestCase):
    def invoke(self, *args):
        with contextlib.redirect_stdout(io.StringIO()), contextlib.redirect_stderr(io.StringIO()):
            from unittest.mock import patch
            with patch.object(sys, "argv", [str(SCRIPT), *map(str, args)]):
                return preview.main()

    def test_reproducible_pinned_blobs_ignore_dirty_working_files(self):
        # Build from a separate checkout containing deliberately dirty runtime bytes.
        with tempfile.TemporaryDirectory() as temp:
            scratch = Path(temp)
            checkout = scratch / "checkout"
            subprocess.run(["git", "clone", "--shared", "--no-checkout", str(REPO), str(checkout)],
                           check=True, capture_output=True)
            subprocess.run(["git", "-C", str(checkout), "checkout", "--detach", preview.BASE],
                           check=True, capture_output=True)
            (checkout / "index.html").write_text("dirty source must never be copied")
            outputs = [scratch / "one", scratch / "two"]
            for output in outputs:
                self.assertEqual(self.invoke("--repo", checkout, "--output", output), 0)
                self.assertEqual(self.invoke("--repo", checkout, "--output", output, "--verify-only"), 0)
                preview.verify(output, preview.expected_files(REPO))
            first = {str(p.relative_to(outputs[0])): p.read_bytes() for p in outputs[0].rglob("*") if p.is_file()}
            second = {str(p.relative_to(outputs[1])): p.read_bytes() for p in outputs[1].rglob("*") if p.is_file()}
            self.assertEqual(first, second)
            self.assertNotEqual(first["training-os/index.html"], b"dirty source must never be copied")

    def test_refuses_overwrite_checkout_symlink_tamper_and_extra_files(self):
        with tempfile.TemporaryDirectory() as temp:
            output = Path(temp) / "bundle"
            self.assertEqual(self.invoke("--output", output), 0)
            self.assertEqual(self.invoke("--output", output), 1)
            self.assertEqual(self.invoke("--output", REPO / "forbidden-preview"), 1)
            self.assertFalse((REPO / "forbidden-preview").exists())
            link = Path(temp) / "link"
            link.symlink_to(output, target_is_directory=True)
            self.assertEqual(self.invoke("--output", link, "--verify-only"), 1)
            page = output / "training-os/index.html"
            original = page.read_bytes()
            page.write_bytes(b"tampered")
            self.assertEqual(self.invoke("--output", output, "--verify-only"), 1)
            page.write_bytes(original)
            extra = output / "private-backup.json"
            extra.write_text("synthetic unexpected file")
            self.assertEqual(self.invoke("--output", output, "--verify-only"), 1)
            extra.unlink()
            (output / "training-os/sw.js").symlink_to(page)
            self.assertEqual(self.invoke("--output", output, "--verify-only"), 1)


if __name__ == "__main__":
    unittest.main()
