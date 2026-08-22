# card-art — authorized artwork ingestion & audit workspace

Discrete, reversible home for card-art ingestion. **Isolated from app logic** and
**not served**: the website deploys from `public/`, and only *approved, clean,
display-grade* assets are ever copied into `public/card-art/` (a separate reviewed
step). Image binaries here are git-ignored (see `.gitignore`); reports, manifests,
schema, and scripts are tracked.

## Layout
```
card-art/
├── one-piece/
│   ├── raw/           # untouched pdfimages extracts, per source PDF (gitignored)
│   ├── normalized/    # cleaned/renamed OPXX/OPXX-nnn.png (gitignored)
│   └── quarantine/    # ambiguous / mis-mapped / watermarked / low-res (gitignored)
├── pokemon/           # (Pokémon art is currently a live provider: pokemontcg.io)
├── metadata/          # per-asset json (dims, hash, ocr, mapping)
├── manifests/         # artwork_manifest.json + manifest.schema.json
├── reports/           # art_audit_summary.md + *.csv audit outputs
└── scripts/           # reproducible extraction/OCR tooling
```

## Current status
See `reports/art_audit_summary.md`. The only OP source audited (the Limitless set
PDFs) is **watermarked ("SAMPLE"), low-res, and ~47% complete** → NOT display-grade.
So the `local` provider is **disabled** and no assets are promoted to
`public/card-art/`. The branded placeholder remains the live default.

## How artwork resolves on the site (switchable provider chain)
Defined in `public/data/cards.js` — every surface calls `CT.cardImage(card)`:
```
CT.artChain = ['pokemon', 'local', 'sample', 'placeholder']   // first ENABLED wins
CT.artProviders = {
  pokemon:     { enabled: true  },   // real pokemontcg.io (Pokémon)
  local:       { enabled: false },   // public/card-art/one-piece/... (OP) — enable when clean assets exist
  sample:      { enabled: false },   // Limitless SAMPLE CDN — DEV ONLY, never public
  placeholder: { enabled: true  },   // branded fallback, always last
}
```
Turn a source on/off by flipping `enabled` — no card-component changes. A runtime
404 on any provider falls back to the placeholder via `CT.imgFallback`, so the UI
never shows a broken image.

## To enable local art once a CLEAN source exists
1. Place approved, un-watermarked, high-res files at
   `public/card-art/one-piece/<SET>/<SET>-<number>[_p1|_p2].png`.
2. Set `CT.artProviders.local.enabled = true` in `public/data/cards.js`.
3. Re-run the website visual audit.

## Reproduce the extraction (read-only, into gitignored raw/)
`scripts/extract.sh` documents the exact `pdfimages` commands. Nothing runs
automatically; extraction is a manual, reviewed step.
