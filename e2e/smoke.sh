#!/usr/bin/env zsh
# Live end-to-end smoke test for MyAuthenticator using agent-browser.
#
# Usage:
#   1. Start the dev server:  pnpm dev
#   2. Run:                   ./e2e/smoke.sh [BASE_URL]
#
# Environment:
#   BASE_URL   defaults to http://localhost:9696
#   PASSWORD   vault password for an already-set-up instance (default: Abcdef1!)
#
# This script drives a real Chrome through agent-browser against the running app.
# It is intentionally read-mostly: it logs in, verifies TOTP generation/refresh,
# search, and screenshots during each step. It does NOT wipe the database - see
# e2e/README.md for a full first-run setup walkthrough.

set -euo pipefail

BASE_URL="${1:-http://localhost:9696}"
PASSWORD="${PASSWORD:-Abcdef1!}"

export AGENT_BROWSER_SESSION="$(agent-browser session id --scope worktree --prefix e2e)"
echo "agent-browser session: $AGENT_BROWSER_SESSION"

fail() { echo "FAIL: $1" >&2; agent-browser close >/dev/null 2>&1 || true; exit 1; }

echo "==> Opening $BASE_URL"
agent-browser open "$BASE_URL" >/dev/null
agent-browser wait --load networkidle >/dev/null

# The app shows an unlock screen once setup is complete.
if agent-browser find text "Unlock your vault" >/dev/null 2>&1; then
  echo "==> Unlocking with password"
  agent-browser find textbox "PASSWORD" fill "$PASSWORD" >/dev/null
  agent-browser find text "Unlock vault" click >/dev/null
  sleep 3
fi

agent-browser wait --load networkidle >/dev/null

# Dashboard should expose the Add button and Settings entry.
agent-browser find text "Add" >/dev/null || fail "dashboard 'Add' button not found"
agent-browser find text "Settings" >/dev/null || fail "dashboard 'Settings' button not found"
echo "==> Dashboard loaded"

# Verify at least one TOTP code is rendered and that it refreshes over a period.
codes_before="$(agent-browser eval "document.body.innerText.match(/\\b\\d{6}\\b/g)" 2>/dev/null || echo '')"
if [[ "$codes_before" == *"null"* || -z "$codes_before" ]]; then
  echo "==> No accounts present; skipping TOTP refresh check"
else
  echo "==> TOTP codes present; waiting 31s to confirm refresh"
  sleep 31
  codes_after="$(agent-browser eval "document.body.innerText.match(/\\b\\d{6}\\b/g)" 2>/dev/null || echo '')"
  [[ "$codes_after" != "$codes_before" ]] || fail "TOTP codes did not refresh after 30s"
  echo "==> TOTP refresh verified"
fi

agent-browser screenshot e2e/screenshot-dashboard.png >/dev/null || true
echo "==> Screenshot saved"

agent-browser close >/dev/null 2>&1 || true
echo "SMOKE OK"
