#!/bin/bash
# Double-click to preview the workshop site locally (macOS).
cd "$(dirname "$0")"
python3 scripts/serve.py . 4173 &
SERVER_PID=$!
sleep 1
open "http://127.0.0.1:4173"
echo "Preview running at http://127.0.0.1:4173 — press Ctrl+C to stop."
wait $SERVER_PID
