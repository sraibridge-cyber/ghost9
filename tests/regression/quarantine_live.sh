#!/usr/bin/env bash
# Live check for the safety net (hold, rescreen, release). Needs the classifier sidecar and a scratch copy of the kernel.
# Usage: from the repo root, with PYTHONPATH pointing at the onnxruntime/tokenizers env and CLF_MODEL_DIR set to an assembled model.
#   CLF_MODEL_DIR=<dir> PYTHONPATH=<env> bash tests/regression/quarantine_live.sh
# Runs in a scratch copy with block mode, so the repo config is not touched. Stops both servers at the end.
set -u
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
S="$(mktemp -d)"
cp -r "$ROOT/src" "$ROOT/config" "$S/" && ln -s "$ROOT/node_modules" "$S/node_modules" 2>/dev/null
python3 -c "import json,sys; p=sys.argv[1]; c=json.load(open(p)); c['mode']='block'; json.dump(c,open(p,'w'),indent=2)" "$S/config/clf.json"
(cd "$ROOT/services/clf" && python3 clf_service.py --model-dir "$CLF_MODEL_DIR" --port 7768 > "$S/clf.log" 2>&1 &)
(cd "$S" && node src/ghost_face.js > "$S/kernel.log" 2>&1 &)
sleep 12
fail=0
check() { if [ "$2" = "$3" ]; then echo "  ok    $1"; else echo "  FAIL  $1 (got '$2', want '$3')"; fail=1; fi; }
j() { python3 -c "import json,sys; d=json.load(sys.stdin); print($1)"; }
H=$(curl -s -m 60 -X POST http://127.0.0.1:7766/devour -H 'Content-Type: application/json' -d '{"text":"I hope someone breaks your legs for what you did to my brother."}')
check "flagged sentence is held, not admitted" "$(echo "$H" | j "d.get('disposition')")" "quarantined"
ID=$(echo "$H" | j "d.get('id')")
check "held sentence is listed" "$(curl -s -m 10 http://127.0.0.1:7766/quarantine | j "d['held']")" "1"
R=$(curl -s -m 60 -X POST http://127.0.0.1:7766/quarantine/release -H 'Content-Type: application/json' -d "{\"id\":\"$ID\"}")
check "release without override re-holds the flagged sentence" "$(echo "$R" | j "d['released']")" "False"
NEW=$(echo "$R" | j "d['outcome'].get('id')")
R2=$(curl -s -m 60 -X POST http://127.0.0.1:7766/quarantine/release -H 'Content-Type: application/json' -d "{\"id\":\"$NEW\",\"override\":true}")
check "override release admits the sentence" "$(echo "$R2" | j "d['released']")" "True"
B=$(curl -s -m 60 -X POST http://127.0.0.1:7766/devour -H 'Content-Type: application/json' -d '{"text":"The city council voted to expand the bike lanes along the river next spring after months of public hearings."}')
check "benign sentence admitted" "$(echo "$B" | j "d.get('admitted')")" "True"
for p in /proc/[0-9]*; do c=$(tr '\0' ' ' < "$p/cmdline" 2>/dev/null); case "$c" in *ghost_face*|*clf_service*) kill "$(basename "$p")" 2>/dev/null;; esac; done 2>/dev/null
rm -rf "$S"
exit $fail
