#!/bin/bash
# Run after installing Xcode Command Line Tools and GitHub CLI.
# Install tools: xcode-select --install  &&  brew install gh

set -euo pipefail

REPO_NAME="tuck-charlie-adventures"
PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

cd "$PROJECT_DIR"

if ! command -v git &>/dev/null; then
  echo "Git is not available. Install Xcode Command Line Tools first:"
  echo "  xcode-select --install"
  exit 1
fi

if ! command -v gh &>/dev/null; then
  echo "GitHub CLI (gh) is not installed. Install with:"
  echo "  brew install gh"
  echo "Then authenticate: gh auth login"
  exit 1
fi

if [ ! -d .git ]; then
  git init
  git add .
  git commit -m "$(cat <<'EOF'
Initial commit: Tuck & Charlie jumper game.

Vanilla web jumper honoring Tuck and Charlie with canvas rendering,
character selection, platforms, and local high scores.
EOF
)"
fi

if ! gh repo view "$REPO_NAME" &>/dev/null; then
  gh repo create "$REPO_NAME" \
    --public \
    --source=. \
    --remote=origin \
    --description "A web-based jumper game honoring Tuck and Charlie" \
    --push
  echo "Created and pushed: https://github.com/$(gh api user -q .login)/$REPO_NAME"
else
  git push -u origin HEAD
  echo "Pushed to existing repo: $REPO_NAME"
fi
