#!/usr/bin/env bash
set -u
ROOT=/home/red/angular-reporting-reference/.worktrees/t_d37c4224
OUT=$ROOT/docs/readiness/m3kit-ui-tournament/2026-07-06/raw
PROMPT_FILE=$ROOT/docs/readiness/m3kit-ui-tournament/2026-07-06/contestant-prompt.md
mkdir -p "$OUT"
cd "$ROOT"
run() {
  local slug="$1"; shift
  echo "=== $slug ===" >&2
  {
    echo "# Raw run: $slug"
    echo
    echo '```text'
    timeout 900 "$@"
    code=$?
    echo '```'
    echo
    echo "exit_code: $code"
  } > "$OUT/$slug.md" 2> "$OUT/$slug.stderr"
  echo "$slug exit $code" >&2
}
run codex-gpt-5-5 env HOME=/home/red codex exec -C "$ROOT" -s read-only -m gpt-5.5 --output-last-message "$OUT/codex-gpt-5-5.last.md" - < "$PROMPT_FILE"
run claude-fable env HOME=/home/red claude --model fable -p --allowedTools Read --max-turns 4 --no-session-persistence "$(cat "$PROMPT_FILE")"
run agy-gemini-3-5-flash-medium env HOME=/home/red agy --print --print-timeout 10m --model "Gemini 3.5 Flash (Medium)" "$(cat "$PROMPT_FILE")"
run agy-claude-sonnet-4-6-thinking env HOME=/home/red agy --print --print-timeout 10m --model "Claude Sonnet 4.6 (Thinking)" "$(cat "$PROMPT_FILE")"
run opencode-deepseek-v4-flash-free env HOME=/home/red opencode run --model opencode/deepseek-v4-flash-free --dir "$ROOT" "$(cat "$PROMPT_FILE")"
