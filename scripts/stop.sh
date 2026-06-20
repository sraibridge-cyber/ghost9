#!/bin/bash
pkill -f "ghost_face.js" && echo "FACE stopped" || echo "FACE not running"
pkill -f "ghost_kernel.js" && echo "KERNEL stopped" || echo "KERNEL not running"
