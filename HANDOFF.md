# ChaseTrackr — Session Handoff

You are resuming work on the ChaseTrackr website redesign. The previous Claude
Code session died mid-task. Read this whole file before doing anything. Act as a
senior software/web engineer: verify before you write, split large tasks, and
never put a fabricated or unverifiable value in front of a user.

---

## Product in one line
ChaseTrackr is a TCG **price-intelligence and portfolio** web app for One Piece
and Pokémon chase cards. It tracks prices, fires custom price alerts, shows
portfolio gain/loss. **It is NOT a marketplace** — no buy/sell/bid/offer/cart/
vault/auction, anywhere, ever.

## Authoritative context files (read these first)
- `CLAUDE.md` (project root) — build rules, brand tokens, hard rules
- `.claude/skills/chasetrackr-web/SKILL.md` — the alt.xyz→ChaseTrackr layout
  system and component mapping
- `brand_assets/chasetrackr_brand_guidelines_v2.html` — palette, type, buttons
- `reference/ALT_WEBPAGE.pdf`, `ALT_CARD_WEBPAGE.pdf`, `LUFFY___Browse___Alt.pdf`
  — the alt.xyz layouts we mirror structurally (NOT their commerce, colors, fonts)

## Design intent
Copy alt.xyz's **structure and information density**. Override its look entirely
with ChaseTrackr brand: navy (#0A1628) top bar + hero band, light body, blue
(#2979FF) accents, cyan (#00D4FF) on "Trackr" only, gold (#F5A623) for chase.
Nunito 800/900 for display+prices, Exo 2 for everything else, self-hosted.

---

## Infrastructure (VERIFIED — trust this)
- Backend: Render, `https://chasetrackr-backend.onrender.com` (repo
  SleepyLoaf5447/chasetrackr-backend, branch main, auto-deploys on push)
- DB: Render Postgres (recently upgraded off the expired free tier — now on the
  $6/mo Basic plan; DB is LIVE). ~279 chase rows, thousands of catalog rows.
- Website project: local, on git branch `redesign`. Served via
  `node serve.mjs` on `http://localhost:3000`.
- iOS app: separate, uses `GET /cards/search`. Do not touch iOS in this work,
  but note shared concerns below.

## Backend endpoints that exist
- `POST /api/v1/search-card` — body {query, game, chase_only, rarity, card_type,
  set, offset, limit} → {results, count, total, query}. Returns full Card incl.
  `game`. **This is the endpoint the website search uses.** total is COUNT(*)
  before limit. ORDER BY market_price DESC NULLSLAST, name, id.
- `GET /cards/search` — thin iOS-compat alias (only q/game/rarity). Don't use on web.
- `GET /api/v2/card/{id}/prices` — aggregator + cache (Pokémon 24h / OP 6h /
  chase 1h TTL). NOTE: current_price is null for OP cards (no DB write path).
- `GET /api/v1/card/{id}/history` — price history (needs cron to have run ≥2x
  before 7d-change is meaningful).
- `GET /api/v1/sets`, portfolios/alerts/wishlist endpoints, admin seed endpoints.
- `POST /admin/seed-chase-prices` — re-applies chase_cards.py hardcoded prices.

## Pricing state (IMPORTANT)
- Bulk fetch (`price_bulk_service.py`) scraped Limitless HTML → wrote market_price
  for 136 standard-print OP cards. It correctly SKIPS is_chase=true rows.
- Chase prices come from `chase_cards.py` hardcoded values, applied via
  `/admin/seed-chase-prices`, matched by number+variant+is_chase.
- `current_price` is null across OP cards by design. Do NOT set
  current_price = market_price (breaks the market×2+current weighting in
  _aggregate() and shows two identical numbers under different labels).
- Cron: `render.yaml` + `scripts/price_refresh.py`, daily 04:00 UTC, direct-DB.
  Confirm it throttles between requests (name_scraper.py uses time.sleep(0.25)).

## Images (RESOLVED — do not re-investigate)
Every public One Piece card image source (Limitless, Bandai official, community
sites) serves Bandai's deliberate "SAMPLE" watermark. There is no clean source
without licensing. **Decision: styled placeholders for MVP.**
`CT.cardImage(card)` is the single swappable image function across all surfaces:
OP cards → branded navy SVG placeholder (rarity-colored border, CT monogram,
name, set/number); Pokémon → real pokemontcg.io URLs. When art is licensed
later, it's a one-function change. iOS (`chase_cards.py`, `Card.swift`) uses the
same CDN and has the same problem — flag but don't change iOS here.

---

## What's DONE
- Site restructured to 4 pages: `index.html` (home), `search.html`, `card.html`,
  `signin.html`, plus `data/cards.js` (offline fallback only), `brand_assets/`,
  `reference/`, `.claude/skills/`.
- **search.html** wired to `POST /api/v1/search-card`: 350ms debounce,
  AbortController, skeleton loading, honest "backend unreachable" fallback banner,
  facet counts from live results, tab counts from live results, chase-only
  server-side. `mapCard()` normalizes backend→frontend: game 'onepiece'→'ONE
  PIECE', strips duplicate SETCODE- prefix from `number`, feeds CT.cardImage().
- **Pagination**: backend supports offset/limit/total; frontend UI still hidden
  (`display:none`) until fully wired — that's fine for now.
- **Homepage**: alt-style structure built (navy bar, centered search, "Featured
  Chase Cards" hero row with dividers not containers, chip tab-bar, Top Rising/
  Falling, right rail). BUT it still reads invented values from `data/cards.js` —
  **home is NOT yet wired to the backend.**
- Chase prices: `/admin/seed-chase-prices` applied 11 rows. Luffy OP05-119-p2
  Manga Art = $3600 (correct, verified). game tabs, double-prefix ID, and
  placeholder design bugs all fixed.

## What's NOT done / known issues
1. **THE IMMEDIATE TASK (below)** — verify the 11 priced chase rows.
2. Home not wired to backend (depends on task 1 + on deciding how to source a
   "featured" set — there's no /featured endpoint; search chase_only ordered by
   price is the closest).
3. 7d-change chips on home have no data behind them until price history
   accumulates — show price, HIDE the change chip until history exists.
4. Name cleanup: scraper produced `Monkey.D.Luffy`, `Eustass"Captain"Kid` —
   malformed dots/quotes. Clean in mapCard() before home goes live.
5. Auth is UI-only (signin.html). Submit handlers are stubbed with TODO. Real
   auth later hits the Render backend — keep it a one-function swap.
6. `card.html` and any surface reusing card display must route through the SAME
   `mapCard()`, or the game/prefix/name bugs reappear per-page.
7. Pagination UI still hidden — wire when ready (offset/limit/total all exist).

---

## >>> IMMEDIATE TASK — do this first, exactly this, then stop and report <<<

Context: `chase_cards.py` prices chase cards by matching number+variant. We
discovered its number→character assumptions are WRONG for at least two rows:
- OP02-099 in the real TCG is **Sakazuki**, not "Portgas D. Ace" as the file
  assumed → $75 landed on Sakazuki.
- OP08-099 is **Kalgara**, not "Shanks" → $150 landed on Kalgara.
Because the file's assumptions proved unreliable, ALL 11 priced chase rows must
be verified before we trust any of them. A wrong-but-plausible price is worse
than no price for a valuation product.

The 11 currently-priced chase rows (from a live query):
```
op-op05-119-p2  Monkey.D.Luffy         Manga Art       $3600
op-op09-118-p2  Gol.D.Roger            Manga Art       $2000
op-op13-120-p2  Sabo                   Manga Art       $900
op-op01-120-p2  Shanks                 Manga Art       $800
op-op03-099-p1  Charlotte Katakuri     Alternate Art   $180
op-op08-099-p2  Kalgara                Alternate Art   $150   <-- intended Shanks
op-op13-120-p4  Sabo                   Special Card    $130
op-op01-120-p4  Shanks                 Alternate Art   $120
op-op13-120-p5  Sabo                   Alternate Art   $100
op-op02-099-p2  Sakazuki               Alternate Art   $75    <-- intended Ace
op-op10-099-p1  Eustass"Captain"Kid    Alternate Art   $70
```

Steps:
1. For EACH of the 11 rows, compare the DB name against the character
   `chase_cards.py` intended to price (read the file's entry for that
   number+variant). Pay special attention to the three OP13-120 Sabo variants
   ($900/$130/$100) and OP03-099 Katakuri ($180) — confirm those numbers really
   are those characters and that the intended price maps to the right row.
2. Produce a VERIFICATION TABLE: row id | DB name | file's intended name |
   MATCH/MISMATCH | current price. **Report this table and STOP. Do not write
   anything to the DB yet.** Wait for confirmation.
3. (Next turn, after I approve the table) For every MISMATCH row, set
   market_price = NULL — unpriced-but-honest beats priced-but-wrong. For the
   rows that intended Ace (OP02-099) and Shanks-alt (OP08-099): do NOT guess
   corrected numbers; leave them null and add them to a running note
   `PRICING_TODO.md` listing chase characters whose correct card numbers still
   need identifying.

Execution rules for this task (the last session died here — avoid the trap):
- This is READ-ONLY until the table is approved. No DB writes in the same turn
  as the verification.
- Do the verification as ONE focused pass. Don't chain the whole 279-card list
  back into context — work only from the 11 rows above.
- If a step balloons, stop and report progress rather than looping.

## Working method for the rest of the session (learned the hard way)
- Split big asks into read-only-verify → approve → write. Never verify and
  mutate the DB in one turn.
- Prove each change: after any fix, show the specific evidence it worked (a
  curl, a screenshot compared to the reference PDF, a row count).
- Never display a value you can't attribute — no fabricated facet counts,
  no placeholder prices, no 7d-change without history. Null/hidden > wrong.
- Keep context lean: restate tasks in a sentence; don't paste giant JSON dumps.
- One screenshot pass is never enough — compare to the reference PDF and list
  measured mismatches before re-tuning.

## Phase 6 hardening — deferred security items (record only; do NOT fix now)
1. **CORS is `allow_origins=["*"]`** (main.py). Fine for dev; before public
   launch, tighten to the real domains (https://chasetrackr.com + the local dev
   origin). Note: locking this down is also a prerequisite for #2 (cookies need
   a specific origin + allow_credentials, which "*" forbids).
2. **JWT is stored in localStorage** (js/auth.js) — readable by any injected
   script (XSS tradeoff). Move to an httpOnly, Secure, SameSite cookie set by
   the backend on login/register, with CORS credentials enabled. Frontend then
   drops the Authorization header and sends credentials:'include'.

NOTE: this HANDOFF.md currently lives in ~/Downloads (not version-controlled).
Consider moving it into a repo so these items aren't lost.
