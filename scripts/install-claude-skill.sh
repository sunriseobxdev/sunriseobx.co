#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(dirname "$SCRIPT_DIR")"
SKILL_SRC="$REPO_DIR/claude-plugin/skills/sunrise"
SKILL_DST="$HOME/.claude/skills/sunrise"

# Ensure target directory exists
mkdir -p "$HOME/.claude/skills"

# Remove old install if present
if [ -L "$SKILL_DST" ]; then
    rm "$SKILL_DST"
    echo "Removed existing symlink at $SKILL_DST"
elif [ -d "$SKILL_DST" ]; then
    rm -rf "$SKILL_DST"
    echo "Removed existing directory at $SKILL_DST"
fi

# Symlink skill into Claude's skills directory
ln -s "$SKILL_SRC" "$SKILL_DST"
echo "Installed sunrise skill: $SKILL_DST -> $SKILL_SRC"

# Verify
if [ -f "$SKILL_DST/SKILL.md" ]; then
    echo "Skill verified. Restart Claude Code to load it."
else
    echo "ERROR: SKILL.md not found after install" >&2
    exit 1
fi
