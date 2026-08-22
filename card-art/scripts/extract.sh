#!/usr/bin/env bash
# Reproducible, READ-ONLY extraction of embedded card images from the Limitless
# set PDFs into card-art/one-piece/raw/ (gitignored). Requires poppler (pdfimages,
# pdftotext). Nothing here promotes assets to the live site — that is a separate,
# reviewed step (see ../README.md). Run manually.
set -euo pipefail

SRC="${1:-/Users/noe/Desktop/One Piece Card data base}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/one-piece/raw"
mkdir -p "$OUT"

command -v pdfimages >/dev/null || { echo "pdfimages (poppler) not found"; exit 1; }

for pdf in "$SRC"/*.pdf; do
  code=$(basename "$pdf" | grep -oE '\([A-Z]{2,4}[0-9]{0,2}\)' | tr -d '()' || true)
  [ -z "$code" ] && continue          # skip the index PDF (no set code)
  dest="$OUT/$code"; mkdir -p "$dest"
  echo "extracting $code ..."
  pdfimages -png "$pdf" "$dest/img" 2>/dev/null || true
  # quick resolution profile (audit aid)
  pdfimages -list "$pdf" 2>/dev/null | awk '$3=="image"{print $4"x"$5}' | sort | uniq -c > "$dest/_dims.txt" || true
done
echo "done -> $OUT"
echo "NOTE: extracted art from these PDFs is Bandai SAMPLE-watermarked / low-res /"
echo "      partial (see reports/art_audit_summary.md) — do NOT promote to public/."
