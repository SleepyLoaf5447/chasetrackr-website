# One Piece Card-Art Audit — Source: local set PDFs

Source: `/Users/noe/Desktop/One Piece Card data base/` — 58 per-set gallery PDFs
(+ 1 `Card Database` index PDF). Extraction tool: `pdfimages` (poppler).
Read-only audit; nothing published. Date stamped by the run that produced it.

## VERDICT: these PDFs are NOT a display-grade source. `local` provider stays DISABLED.

Three independent, evidence-backed disqualifiers — any one is blocking; all three apply:

1. **Watermarked (unlicensed).** Every card carries a large Bandai **"SAMPLE"**
   overprint + "BANDAI MADE IN JAPAN" fine print. Confirmed by direct image read:
   - OP01-001 Roronoa Zoro (600×838) — SAMPLE across center.
   - OP05-011 Bartholomew Kuma (490×684) — SAMPLE across center.
   This is exactly the unlicensed art `CLAUDE.md`/`HANDOFF.md` decided not to ship.
2. **Low resolution.** Card images are **490×684** or **600×838**; plus 261×358
   thumbnails. Below a crisp card (~745×1040+). Every asset is an upgrade candidate.
3. **Incomplete for the sets that matter.** Main boosters (OP01–OP17) and EB sets
   contain only **~25 full images each = ~18–43% of the set**. Total **1,191**
   full-size art images vs **2,506** DB cards (~47% catalogue, ~20% on the
   high-value booster surface). Starter decks (ST) are complete/over-complete
   (they're small). The booster PDFs are highlight exports, not full galleries.

## Coverage per set (full-size images ≥490px wide vs DB cards)

| Set | art imgs | DB cards | coverage | note |
|---|---:|---:|---:|---|
| OP01–OP15 | ~25 each | 121–140 | **18–21%** | partial (booster highlights only) |
| OP16, OP17 | 25 each | 0 | orphan | **DB missing these sets** |
| EB01/EB02/EB03 | 26 each | 61/66/68 | 38–43% | partial |
| PRB01 / PRB02 | 26 / 26 | 38 / 11 | 68% / >100% | partial / DB under-ingested |
| ST01–ST14 | 16–26 | 15–19 | ~100%+ | complete |
| ST15–ST20, ST23 | 15–23 | 1–6 | >100% | **DB under-ingested** |
| ST21,22,24–36 | 6–32 | 0 | orphan | **DB missing (14 decks)** |
| PROMO | 0 | 91 | 0% | no art source |
| **TOTAL** | **1,191** | **2,506** | **~47%** | |

## DB-side findings surfaced by the audit (separate from art quality)
- **17 sets missing from the DB entirely** (0 cards, art exists): OP16, OP17,
  ST21, ST22, ST24–ST36 → catalogue-ingestion gap.
- **Under-ingested sets**: ST15–ST20, ST23, PRB02 (few DB cards vs art).
- **PROMO** (91 DB cards) has no dedicated art source.

## Card ID verification (OCR) — not run
- The PDFs have **no text layer** (`pdftotext` → 0 card-ID tokens); card numbers
  are printed on the raster art. **tesseract is not installed**, so OCR-verified
  per-card mapping was not performed. Deferred until a display-grade source
  exists (mapping watermarked, partial, low-res art that won't ship is low value).

## Recommendation
Obtain a **clean, licensed, complete, high-res** OP art source (official API,
purchased assets, or your own un-watermarked scans). The switchable resolver and
this workspace are built and ready — enabling `local` (or an `external` provider)
is then a config flip, no UI rewrite. Until then, the branded placeholder remains
the polished, honest default.
