#!/usr/bin/env bash
# Run visual capture — prefers Node if available, otherwise Python + Playwright.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$ROOT"

run_node() {
  if command -v npm >/dev/null 2>&1; then
    if [[ ! -d node_modules/playwright ]]; then
      npm install
      npx playwright install chromium
    fi
    node scripts/visual-capture/capture.mjs "$@"
    return 0
  fi
  return 1
}

run_python() {
  if ! python3 -c "import playwright" 2>/dev/null; then
    echo "Installing Python Playwright..."
    python3 -m pip install --user playwright
    python3 -m playwright install chromium
  fi
  python3 scripts/visual-capture/capture.py "$@"
}

if run_node "$@"; then
  exit 0
fi

run_python "$@"
