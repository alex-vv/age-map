#!/usr/bin/env bash
set -euo pipefail

INPUT="${1:-omsk.geojson}"
OUTPUT="${2:-tiles}"

tippecanoe \
  -e "$OUTPUT" \
  -Z12 -z15 \
  -l omsk \
  --no-tile-compression \
  --drop-densest-as-needed \
  --force \
  "$INPUT"
