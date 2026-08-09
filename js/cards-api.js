// js/cards-api.js — shared backend adapter for the ChaseTrackr website.
// Loaded by index.html AND search.html, AFTER data/cards.js (needs window.CT).
// This is the SINGLE place that normalizes backend rows → CT card shape, so the
// game/prefix/name fixes live in one function used by every surface.
window.CT = window.CT || {};

window.CT.BACKEND = 'https://chasetrackr-backend.onrender.com';

// ── Name cleanup ────────────────────────────────────────────────────────────
// The name scraper produced malformed strings:
//   'Monkey.D.Luffy'         → 'Monkey D. Luffy'   (dots jammed between words)
//   'Eustass"Captain"Kid'    → 'Eustass "Captain" Kid'  (quotes jammed to letters)
// Idempotent: already-clean names pass through unchanged.
window.CT.cleanName = function (name) {
  if (!name) return '—';
  let n = String(name).trim();

  // Dot-separated names with no spacing: split on '.', re-space, keep single-
  // letter middles as initials ('D' → 'D.'). Only fires when a dot is followed
  // by a non-space, so 'Gol D. Roger' (already correct) is left alone.
  if (/\.\S/.test(n)) {
    const parts = n.split('.').map(s => s.trim()).filter(Boolean);
    n = parts
      .map((p, i) => (i < parts.length - 1 && p.length === 1) ? p + '.' : p)
      .join(' ');
  }

  // Quoted nickname jammed against letters: pad to '… "Nick" …'.
  n = n.replace(/([A-Za-z])"([^"]+)"([A-Za-z])/g, '$1 "$2" $3');

  return n.replace(/\s{2,}/g, ' ').trim();
};

// ── Map backend snake_case row → CT.cardImage()-compatible shape ─────────────
// Backend POST /api/v1/search-card returns Card rows. DB game values are
// 'onepiece' / 'pokemon'; One Piece numbers carry a duplicate 'OP13-' prefix.
window.CT.mapCard = function (c) {
  const sc = (c.set_code || '').toUpperCase();

  const rawGame = (c.game || '').toLowerCase();
  const game = rawGame === 'onepiece' ? 'ONE PIECE'
             : rawGame === 'pokemon'  ? 'POKÉMON'
             : c.game || '';

  // Strip the duplicated set prefix: 'OP13-118' → '118'. Pokémon numbers are
  // already bare and pass through.
  const rawNum = c.number || '';
  const number = rawNum.startsWith(sc + '-') ? rawNum.slice(sc.length + 1) : rawNum;

  const v = (c.variant || '').toLowerCase();
  let printVariant = null;
  if (v.includes('manga'))                                printVariant = 'p2';
  else if (v.includes('alt') || v.includes('alternate')) printVariant = 'p1';

  return {
    id:           c.id,
    name:         window.CT.cleanName(c.name),
    set:          c.set      || '',
    setCode:      sc,
    number:       number,
    rarity:       c.rarity   || 'Unknown',
    variant:      c.variant  || 'Standard',
    printVariant: printVariant,
    isChase:      !!c.is_chase,
    game:         game,
    currentPrice: c.market_price != null ? c.market_price : (c.current_price ?? null),
    marketPrice:  c.market_price  ?? null,
    // Price provenance from search-card's coalesced value:
    //   'high' / 'ambiguous' / 'estimate' (warmed) | 'catalogue' | null (no price)
    confidence:   c.confidence ?? null,
    change7d:     null,   // no history yet — surfaces must NOT fabricate a delta
    _pkSetId:     game === 'POKÉMON' ? sc.toLowerCase() : null,
  };
};

// Owned-card adapter: watchlist / portfolio rows use card_* field names. Route
// them through the SAME CT.mapCard (one normalization path — game, prefix strip,
// name cleanup, printVariant, _pkSetId) rather than re-deriving per page.
window.CT.mapOwnedCard = function (item) {
  const c = window.CT.mapCard({
    id:            item.card_id,
    name:          item.card_name,
    set:           item.card_set,
    set_code:      item.set_code,
    number:        item.card_number,
    rarity:        item.card_rarity,
    variant:       item.variant,
    game:          item.card_game,
    is_chase:      item.is_chase,
    market_price:  item.market_price,
    current_price: item.current_price != null ? item.current_price : item.market_price,
  });
  if (item.confidence != null) c.confidence = item.confidence;
  return c;
};

// ── Blended "top valued" featured selection ─────────────────────────────────
// There is no /featured endpoint and search-card rejects an empty query without
// a filter, so we query each game (ordered by coalesced market_price DESC),
// merge, drop unpriced rows, and take the top N by price. Result: a blended,
// priced-only, highest-value-first list across One Piece + Pokémon.
//
// This is the FEATURED selection (home hero + card-detail related). It EXCLUDES
// confidence === 'ambiguous' so unattributable mappings (e.g. duplicate-productId
// twins that warm to identical prices) never HEADLINE. Ambiguous cards still
// appear in SEARCH — that path (fetchLive in search.html) does not filter them.
window.CT.fetchTopValued = async function (n, signal) {
  const B = window.CT.BACKEND;
  const post = (game) => fetch(`${B}/api/v1/search-card`, {
    method: 'POST',
    signal,
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ query: '', game, limit: 100 }),
  });

  const [r1, r2] = await Promise.all([post('onepiece'), post('pokemon')]);
  if (!r1.ok || !r2.ok) throw new Error(`HTTP ${r1.status}/${r2.status}`);
  const [d1, d2] = await Promise.all([r1.json(), r2.json()]);

  const merged = [...(d1.results || []), ...(d2.results || [])]
    .map(window.CT.mapCard)
    .filter(c => c.marketPrice != null            // priced-only — no null-value cards
              && c.confidence !== 'ambiguous')    // attributable-only — never headline ambiguous mappings
    .sort((a, b) => b.marketPrice - a.marketPrice);

  return n ? merged.slice(0, n) : merged;
};
