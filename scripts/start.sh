#!/bin/bash
cd "$(dirname "$0")/.."
echo "Starting GHOST v9.0.1..."
node src/ghost_face.js &
echo "FACE PID: $! (port 7766)"
node src/ghost_kernel.js &
echo "KERNEL PID: $! (port 7767)"
echo "Use: bash scripts/stop.sh to halt"
wait
