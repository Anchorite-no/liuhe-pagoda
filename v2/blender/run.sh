#!/usr/bin/env bash
# Run a Blender Python script headless: ./run.sh script.py [args...]
B="/c/Program Files/Blender Foundation/Blender 5.2/blender.exe"
HERE="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$1"; shift
"$B" -b --factory-startup --python "$HERE/$SCRIPT" -- "$@"
