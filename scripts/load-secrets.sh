#!/usr/bin/env bash
# Parse KEY=VALUE lines from .secrets-input.env safely (handles spaces, commas).
# Usage:  eval "$(./scripts/load-secrets.sh)"   -- exports each KEY into env.
# Does NOT echo values to stdout in any other way.
set -euo pipefail
FILE="${1:-.secrets-input.env}"
[ -f "$FILE" ] || { echo "missing $FILE" >&2; exit 1; }

while IFS= read -r line || [ -n "$line" ]; do
  # skip blank lines and comments
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  # KEY before first '='; VALUE = everything after
  key="${line%%=*}"
  val="${line#*=}"
  [[ "$key" =~ ^[A-Z_][A-Z0-9_]*$ ]] || continue
  # single-quote-escape: ' -> '\''
  esc="${val//\'/\'\\\'\'}"
  printf "export %s='%s'\n" "$key" "$esc"
done < "$FILE"
