#!/usr/bin/env bash
# Live check for store-not-propagate. Covers the device-only case first (no classifier running), then rescreen.
# Usage: CLF_MODEL_DIR=<assembled model dir> PYTHONPATH=<onnxruntime/tokenizers env> bash tests/regression/quarantine_live.sh
# Runs in a scratch copy with block mode. The repo config is not touched. Stops every server it starts.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
S="$(mktemp -d)"
cp -r "$ROOT/src" "$ROOT/config" "$S/" && ln -s "$ROOT/node_modules" "$S/node_modules" 2>/dev/null
python3 -c "import json,sys; p=sys.argv[1]; c=json.load(open(p)); c['mode']='block'; json.dump(c,open(p,'w'),indent=2)" "$S/config/clf.json"
fail=0
check() { if [ "$2" = "$3" ]; then echo "  ok    $1"; else echo "  FAIL  $1 (got '$2', want '$3')"; fail=1; fi; }
j() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }
stop_all() { for p in /proc/[0-9]*; do c=$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null); case "$c" in *ghost_face*|*clf_service*) kill -9 "$(basename "$p")" 2>/dev/null;; esac; done 2>/dev/null; }
stop_all; sleep 1
(cd "$S" && node src/ghost_face.js > "$S/kernel.log" 2>&1 &)
sleep 8
echo "device-only: classifier not running"
H=$(curl -s -m 60 -X POST http://127.0.0.1:7766/devour -H 'Content-Type: application/json' -d '{"text":"I hope someone breaks your legs for what you did to my brother."}')
check "harm sentence stored as pending, not admitted to the served set" "$(echo "$H" | j "d.get('screen')")" "pending"
B=$(curl -s -m 60 -X POST http://127.0.0.1:7766/devour -H 'Content-Type: application/json' -d '{"text":"The city council voted to expand the bike lanes along the river next spring after months of public hearings."}')
check "benign sentence stored as pending" "$(echo "$B" | j "d.get('screen')")" "pending"
G=$(curl -s -m 60 -X POST http://127.0.0.1:7766/devour -H 'Content-Type: application/json' -d '{"text":"The quick brown fox jumps over the lazy dog"}')
check "sync-gate block is held, not dropped" "$(echo "$G" | j "d.get('disposition')")" "gate_S"
GID=$(echo "$G" | j "d.get('id')")
check "nothing pending is served by /nodes" "$(curl -s -m 10 http://127.0.0.1:7766/nodes | j "d['total']")" "0"
echo "rescreen: classifier comes up"
(cd "$ROOT/services/clf" && PYTHONPATH="$PYTHONPATH" python3 clf_service.py --model-dir "$CLF_MODEL_DIR" --port 7768 > "$S/clf.log" 2>&1 &)
sleep 12
R=$(curl -s -m 120 -X POST http://127.0.0.1:7766/rescreen)
check "rescreen quarantines the harm sentence" "$(echo "$R" | j "d['quarantined']")" "1"
check "rescreen passes the benign sentence" "$(echo "$R" | j "d['passed']")" "1"
check "/nodes serves only the passed sentence" "$(curl -s -m 10 http://127.0.0.1:7766/nodes | j "d['total']")" "1"
echo "override: a human releases the held sync-gate block"
O=$(curl -s -m 60 -X POST http://127.0.0.1:7766/quarantine/release -H 'Content-Type: application/json' -d "{\"id\":\"$GID\",\"override\":true}")
check "override release admits the held sentence" "$(echo "$O" | j "d['released']")" "True"
check "/nodes now serves the released sentence too" "$(curl -s -m 10 http://127.0.0.1:7766/nodes | j "d['total']")" "2"
check "the harm sentence is still held in quarantine" "$(curl -s -m 10 http://127.0.0.1:7766/quarantine | j "d['held']")" "1"
stop_all
rm -rf "$S"
exit $fail
