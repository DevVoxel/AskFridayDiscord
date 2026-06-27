#!/usr/bin/env bash
#
# Build Vencord with the AskFriday plugin compiled in.
#
# Usage:
#   ./build.sh                      # clone/update Vencord in ~/Vencord, then build
#   VENCORD_DIR=~/code/Vencord ./build.sh
#
# Re-runnable: updates the Vencord checkout, re-copies the plugin, rebuilds.
# When it finishes, point Vesktop at the printed dist folder (or run `pnpm inject`
# in that folder for stock desktop Discord).

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_SRC="$SCRIPT_DIR/askFriday"
VENCORD_DIR="${VENCORD_DIR:-$HOME/Vencord}"
VENCORD_REPO="https://github.com/Vendicated/Vencord"

note() { printf '\033[1;35m==>\033[0m %s\n' "$*"; }
die()  { printf '\033[1;31merror:\033[0m %s\n' "$*" >&2; exit 1; }

# 1. dependencies
for cmd in git node; do
    command -v "$cmd" >/dev/null || die "$cmd not found - install it first"
done
if ! command -v pnpm >/dev/null; then
    command -v corepack >/dev/null && corepack enable pnpm >/dev/null 2>&1 || true
    command -v pnpm >/dev/null || die "pnpm not found - run: npm i -g pnpm"
fi
[ -d "$PLUGIN_SRC" ] || die "plugin source not found at $PLUGIN_SRC"

# 2. clone or update Vencord
if [ -d "$VENCORD_DIR/.git" ]; then
    note "updating Vencord in $VENCORD_DIR"
    git -C "$VENCORD_DIR" pull --ff-only || note "pull skipped (local changes in the Vencord tree)"
else
    note "cloning Vencord into $VENCORD_DIR"
    git clone --depth 1 "$VENCORD_REPO" "$VENCORD_DIR"
fi

# 3. install Vencord dependencies
note "installing Vencord dependencies"
( cd "$VENCORD_DIR" && pnpm install --frozen-lockfile )

# 4. sync the plugin (fresh copy; drop dev-only files that aren't part of the build)
DEST="$VENCORD_DIR/src/userplugins/askFriday"
note "copying AskFriday into src/userplugins"
mkdir -p "$VENCORD_DIR/src/userplugins"
rm -rf "$DEST"
cp -r "$PLUGIN_SRC" "$DEST"
rm -f "$DEST/pure.test.ts" "$DEST/smoke.ts"

# 5. build
note "building Vencord"
( cd "$VENCORD_DIR" && pnpm build )

DIST="$VENCORD_DIR/dist"
printf '\n'
note "done - built Vencord with AskFriday"
cat <<EOF
  dist: $DIST

Load it:
  Vesktop  ->  Settings > Vencord, set the Vencord location / custom build to:
                 $DIST
               then restart Vesktop.
  Discord  ->  cd "$VENCORD_DIR" && pnpm inject     (stock desktop client)

Then enable AskFriday under Vencord > Plugins and open its cog to configure.
EOF
