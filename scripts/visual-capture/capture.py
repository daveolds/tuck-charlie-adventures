#!/usr/bin/env python3
"""
Headless visual capture for Tucker & Charlie Adventures.

Usage:
  python3 scripts/visual-capture/capture.py
  python3 scripts/visual-capture/capture.py --states gameplay-tucker,character-select
  python3 scripts/visual-capture/capture.py --port 8770 --validate
"""

from __future__ import annotations

import argparse
import json
import socket
import subprocess
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DEFAULT_PORT = 8765
DEFAULT_OUT = ROOT / ".visual-screenshots"
VIEWPORT = {"width": 800, "height": 450}

ALL_STATES = [
    "controls",
    "character-select",
    "gameplay-tucker",
    "gameplay-charlie",
    "paused",
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Capture game visual states")
    parser.add_argument("--port", type=int, default=DEFAULT_PORT)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--states", default=",".join(ALL_STATES))
    parser.add_argument("--validate", action="store_true")
    return parser.parse_args()


def pick_free_port(preferred: int) -> int:
    for port in range(preferred, preferred + 20):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            # Confirm nothing else is already serving this port.
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/", timeout=1) as resp:
                    body = resp.read(512).decode("utf-8", errors="ignore")
                    if "Tucker" in body or "Charlie" in body:
                        continue
            except (urllib.error.URLError, TimeoutError, ConnectionResetError):
                pass
            return port
    raise RuntimeError(f"No free port found near {preferred}")


def wait_for_server(url: str, timeout_ms: int = 15000) -> None:
    deadline = time.time() + timeout_ms / 1000
    while time.time() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as resp:
                body = resp.read(1024).decode("utf-8", errors="ignore")
                if resp.status == 200 and ("Tucker" in body or "Charlie" in body):
                    return
        except (urllib.error.URLError, TimeoutError, ConnectionResetError):
            time.sleep(0.2)
    raise RuntimeError(f"Game server at {url} did not become ready within {timeout_ms}ms")


def start_static_server(port: int) -> subprocess.Popen:
    return subprocess.Popen(
        ["python3", "-m", "http.server", str(port), "--bind", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )


def drive_to_state(page, port: int, state: str) -> None:
    base = f"http://127.0.0.1:{port}/index.html"

    if state == "controls":
        page.goto(base, wait_until="networkidle")
        page.wait_for_selector("#controls-panel:not(.hidden)")
    elif state == "character-select":
        page.goto(base, wait_until="networkidle")
        page.click("#next-btn")
        page.wait_for_selector("#select-panel:not(.hidden)")
        page.wait_for_timeout(400)
    elif state == "gameplay-tucker":
        page.goto(base, wait_until="networkidle")
        page.click("#next-btn")
        page.wait_for_selector("#select-panel:not(.hidden)")
        page.click('.char-btn[data-char="tucker"]')
        page.click("#start-btn")
        page.wait_for_selector("#hud:not(.hidden)")
        page.wait_for_timeout(2000)
    elif state == "gameplay-charlie":
        page.goto(base, wait_until="networkidle")
        page.click("#next-btn")
        page.wait_for_selector("#select-panel:not(.hidden)")
        page.click('.char-btn[data-char="charlie"]')
        page.click("#start-btn")
        page.wait_for_selector("#hud:not(.hidden)")
        page.wait_for_timeout(2000)
    elif state == "paused":
        page.goto(base, wait_until="networkidle")
        page.click("#next-btn")
        page.click("#start-btn")
        page.wait_for_selector("#hud:not(.hidden)")
        page.wait_for_timeout(800)
        page.keyboard.press("Escape")
        page.wait_for_selector("#pause-menu:not(.hidden)")
        page.wait_for_timeout(300)
    else:
        raise ValueError(f"Unknown visual state: {state}")


def capture_state(page, name: str, out_dir: Path) -> dict:
    page.wait_for_selector("#game-canvas", state="visible", timeout=10000)
    page.wait_for_timeout(300)

    full_path = out_dir / f"{name}.png"
    canvas_path = out_dir / f"{name}-canvas.png"

    page.screenshot(path=str(full_path), full_page=False)
    page.locator("#game-canvas").screenshot(path=str(canvas_path))

    return {"name": name, "fullPath": str(full_path), "canvasPath": str(canvas_path)}


def ensure_playwright() -> None:
    try:
        from playwright.sync_api import sync_playwright  # noqa: F401
    except ImportError as exc:
        raise SystemExit(
            "Playwright Python package not installed.\n"
            "Run: python3 -m pip install playwright && python3 -m playwright install chromium"
        ) from exc


def main() -> int:
    ensure_playwright()
    from playwright.sync_api import sync_playwright

    args = parse_args()
    states = [s.strip() for s in args.states.split(",") if s.strip()]
    args.out.mkdir(parents=True, exist_ok=True)

    port = pick_free_port(args.port)
    if port != args.port:
        print(f"Port {args.port} busy — using {port}")

    url = f"http://127.0.0.1:{port}/"
    server = start_static_server(port)
    time.sleep(0.4)
    if server.poll() is not None:
        raise RuntimeError(f"Static server failed to start on port {port}")
    results: list[dict] = []
    errors: list[dict] = []

    try:
        wait_for_server(url)

        with sync_playwright() as pw:
            browser = pw.chromium.launch(headless=True)
            context = browser.new_context(
                viewport=VIEWPORT,
                device_scale_factor=1,
            )
            page = context.new_page()

            for state in states:
                try:
                    drive_to_state(page, port, state)
                    shot = capture_state(page, state, args.out)
                    results.append(shot)
                    print(f"✓ captured {state} → {shot['fullPath']}")
                except Exception as err:  # noqa: BLE001
                    message = str(err)
                    errors.append({"state": state, "message": message})
                    print(f"✗ failed {state}: {message}", file=sys.stderr)

            browser.close()

        manifest = {
            "capturedAt": datetime.now(timezone.utc).isoformat(),
            "viewport": VIEWPORT,
            "states": [
                {"name": r["name"], "fullPath": r["fullPath"], "canvasPath": r["canvasPath"]}
                for r in results
            ],
            "errors": errors,
        }
        manifest_path = args.out / "manifest.json"
        manifest_path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Manifest: {manifest_path}")

        if errors and args.validate:
            return 1
        return 0
    except Exception as err:  # noqa: BLE001
        print(str(err), file=sys.stderr)
        return 1 if args.validate else 1
    finally:
        server.terminate()
        try:
            server.wait(timeout=3)
        except subprocess.TimeoutExpired:
            server.kill()


if __name__ == "__main__":
    raise SystemExit(main())
