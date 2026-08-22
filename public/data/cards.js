// TODO: replace with GET /api/v1/search-card from https://chasetrackr-backend.onrender.com
// Shape mirrors the real backend response schema.
// All data exposed as window globals so pages can <script src="data/cards.js"> without modules.

window.CT = window.CT || {};

// ── Image system ──────────────────────────────────────────────────────────────

function _rarityAccent(rarity) {
  const r = (rarity || '').toLowerCase();
  if (r.includes('manga') || r.includes('treasure') || r.includes('alternate')) return '#F5A623';
  if (r.includes('secret')) return '#00D4FF';
  if (r.includes('special illustration') || r.includes('ultra')) return '#7B61FF';
  return '#2979FF';
}

// Branded card placeholder — 2:3 ratio, deliberate design.
// Replaces SAMPLE-watermarked Limitless CDN images for One Piece until licensing is resolved.
window.CT.cardPlaceholder = function(card) {
  const accent  = _rarityAccent(card.rarity);
  const id      = ((card.setCode || '—') + '-' + (card.number || '?')).toUpperCase();
  const rawName = (card.name || 'Unknown').toUpperCase();

  // Split name into up to two lines at ~13 chars
  const words = rawName.split(' ');
  let l1 = '', l2 = '';
  for (const w of words) {
    if (!l1 || (l1 + ' ' + w).length <= 13) l1 += (l1 ? ' ' : '') + w;
    else l2 += (l2 ? ' ' : '') + w;
  }
  if (l2.length > 13) l2 = l2.slice(0, 12) + '…';

  const esc = s => s.replace(/[<>&"']/g, c => ({'<':'&lt;','>':'&gt;','&':'&amp;','"':'&quot;',"'":'&#39;'}[c]));

  // Rarity label — short form
  const rarityFull = (card.rarity || '').toUpperCase();
  const rarityLabel = rarityFull.includes('MANGA') ? 'MANGA'
                    : rarityFull.includes('ALT')   ? 'ALT ART'
                    : rarityFull.includes('SPECIAL') ? 'SPECIAL'
                    : rarityFull.includes('TREASURE') ? 'TREASURE'
                    : rarityFull.includes('SECRET') ? 'SECRET RARE'
                    : rarityFull.includes('SUPER')  ? 'SUPER RARE'
                    : rarityFull.includes('LEADER') ? 'LEADER'
                    : rarityFull || 'CARD';

  const nameY  = l2 ? '213' : '220';
  const name2Y = '230';

  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'>
  <defs>
    <linearGradient id='bg' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%'   stop-color='#0D1E3A'/>
      <stop offset='100%' stop-color='#07111F'/>
    </linearGradient>
    <linearGradient id='glow' x1='0' y1='0' x2='0' y2='1'>
      <stop offset='0%'   stop-color='${accent}' stop-opacity='0.28'/>
      <stop offset='70%'  stop-color='${accent}' stop-opacity='0.06'/>
      <stop offset='100%' stop-color='${accent}' stop-opacity='0'/>
    </linearGradient>
    <radialGradient id='orb' cx='50%' cy='38%' r='48%'>
      <stop offset='0%'   stop-color='${accent}' stop-opacity='0.15'/>
      <stop offset='100%' stop-color='${accent}' stop-opacity='0'/>
    </radialGradient>
    <pattern id='dots' width='18' height='18' patternUnits='userSpaceOnUse'>
      <circle cx='9' cy='9' r='1' fill='rgba(255,255,255,0.045)'/>
    </pattern>
  </defs>

  <!-- Base -->
  <rect width='200' height='300' rx='10' fill='url(#bg)'/>
  <rect width='200' height='300' rx='10' fill='url(#dots)'/>
  <rect width='200' height='180' rx='10' fill='url(#glow)'/>
  <ellipse cx='100' cy='115' rx='76' ry='70' fill='url(#orb)'/>

  <!-- Rarity border — 3px, vivid -->
  <rect x='1.5' y='1.5' width='197' height='297' rx='9' fill='none'
        stroke='${accent}' stroke-width='3' stroke-opacity='0.7'/>
  <!-- Inner accent line -->
  <rect x='6' y='6' width='188' height='288' rx='6' fill='none'
        stroke='${accent}' stroke-width='0.75' stroke-opacity='0.2'/>

  <!-- Top cap bar -->
  <rect width='200' height='5' rx='10' fill='${accent}' fill-opacity='0.95'/>

  <!-- CT monogram — large, structural, low opacity -->
  <text x='100' y='138' text-anchor='middle'
        font-family='Georgia,serif' font-size='72' font-weight='900'
        fill='${accent}' fill-opacity='0.07' letter-spacing='-2'>CT</text>

  <!-- Rarity label — small caps, high up, accent colored -->
  <text x='100' y='52' text-anchor='middle'
        font-family='monospace' font-size='9' font-weight='700'
        letter-spacing='3' fill='${accent}' fill-opacity='0.85'>${esc(rarityLabel)}</text>

  <!-- Diamond divider -->
  <polygon points='100,60 104,64 100,68 96,64'
           fill='${accent}' fill-opacity='0.5'/>

  <!-- Card ID — quiet, small, below monogram -->
  <text x='100' y='182' text-anchor='middle'
        font-family='monospace' font-size='10' font-weight='600'
        letter-spacing='1.5' fill='rgba(255,255,255,0.38)'>${esc(id)}</text>

  <!-- Name — dominant, white, bottom third -->
  <text x='100' y='${nameY}' text-anchor='middle'
        font-family='Arial Black,Arial,sans-serif' font-size='15' font-weight='900'
        fill='white' fill-opacity='0.95'>${esc(l1)}</text>
  ${l2 ? `<text x='100' y='${name2Y}' text-anchor='middle'
        font-family='Arial Black,Arial,sans-serif' font-size='15' font-weight='900'
        fill='white' fill-opacity='0.95'>${esc(l2)}</text>` : ''}

  <!-- Bottom accent strip -->
  <rect x='70' y='258' width='60' height='2' rx='1' fill='${accent}' fill-opacity='0.4'/>
</svg>`;

  return 'data:image/svg+xml,' + encodeURIComponent(svg);
};

// ── SWITCHABLE ARTWORK RESOLVER ──────────────────────────────────────────────
// CT.cardImage(card) is the ONE image abstraction every surface calls. Internally
// it is now a provider chain: each provider returns a URL for the card or null to
// pass. Resolution walks CT.artChain in order and returns the first ENABLED
// provider's URL; a runtime 404 falls back to the branded placeholder via
// CT.imgFallback. This makes any source switchable on/off WITHOUT touching card
// components (see card-art/README.md).
//
// PROVIDER STATUS (see card-art/reports/art_audit_summary.md):
//   pokemon     — real pokemontcg.io art (Pokémon only). ENABLED.
//   local       — authorized local OP assets under public/card-art/. DISABLED:
//                 the only OP source audited so far (the Limitless set PDFs) is
//                 Bandai "SAMPLE"-watermarked, low-res (≤600×838), and covers
//                 only ~20% of main sets — not display-grade. Enable once clean,
//                 licensed, complete, high-res assets are promoted into
//                 public/card-art/one-piece/.
//   sample      — Limitless SAMPLE-watermarked CDN. DISABLED / DEV-ONLY. Never
//                 enable for a shared/public build (unlicensed, defaced art).
//   placeholder — branded navy SVG. ALWAYS enabled, always last.
window.CT.artProviders = {
  pokemon:     { enabled: true  },
  local:       { enabled: false, base: 'card-art/one-piece' },
  sample:      { enabled: false },
  placeholder: { enabled: true  },
};
window.CT.artChain = ['pokemon', 'local', 'sample', 'placeholder'];

// Back-compat: the old single switch. 'sample' flips the sample provider on for
// local dev; anything else keeps it off. Kept so existing code/paths still work.
window.CT.IMAGE_MODE = 'placeholder';
if (window.CT.IMAGE_MODE === 'sample') window.CT.artProviders.sample.enabled = true;

window.CT._artResolvers = {
  pokemon(card) {
    return (card.game === 'POKÉMON' && card._pkSetId)
      ? `https://images.pokemontcg.io/${card._pkSetId}/${card.number}_hires.png` : null;
  },
  local(card) {
    if (card.game !== 'ONE PIECE' || !card.setCode || !card.number) return null;
    const v = card.printVariant ? `_${card.printVariant}` : '';
    return `${window.CT.artProviders.local.base}/${card.setCode}/${card.setCode}-${card.number}${v}.png`;
  },
  sample(card) {
    if (card.game !== 'ONE PIECE') return null;
    const v = card.printVariant ? `_${card.printVariant}` : '';
    return `https://limitlesstcg.nyc3.cdn.digitaloceanspaces.com/one-piece/${card.setCode}/${card.setCode}-${card.number}${v}_EN.webp`;
  },
  placeholder(card) { return window.CT.cardPlaceholder(card); },
};

window.CT.cardImage = function(card) {
  for (const name of window.CT.artChain) {
    const cfg = window.CT.artProviders[name];
    if (!cfg || !cfg.enabled) continue;
    const url = window.CT._artResolvers[name] && window.CT._artResolvers[name](card);
    if (url) return url;
  }
  // Guaranteed non-empty: branded placeholder so we never emit a dead <img>.
  return window.CT.cardPlaceholder(card);
};

// If an external image 404s (some Limitless promo/variant URLs do), fall back to
// the branded placeholder so a card is NEVER an empty void. Surfaces attach this
// via CT.imgAttrs(); it rebuilds the placeholder from data-* stamped on the img.
window.CT.imgFallback = function(img) {
  img.onerror = null;   // guard against loops (data-URIs never 404)
  img.src = window.CT.cardPlaceholder({
    rarity:  img.dataset.rarity,
    setCode: img.dataset.setcode,
    number:  img.dataset.number,
    name:    img.alt,
  });
};

// Canonical <img> attributes for a card: primary src + placeholder-on-error.
// Every surface should build images as `<img ${CT.imgAttrs(card, eager)} />`.
window.CT.imgAttrs = function(card, eager) {
  const esc = (s) => String(s == null ? '' : s).replace(/"/g, '&quot;');
  return `src="${window.CT.cardImage(card)}" alt="${esc(card.name)}"` +
         ` data-rarity="${esc(card.rarity)}" data-setcode="${esc(card.setCode)}"` +
         ` data-number="${esc(card.number)}" onerror="window.CT.imgFallback(this)"` +
         (eager ? '' : ' loading="lazy"');
};

// iOS note: same CDN pattern is used in chase_cards.py and Card.swift.
// Update CT.cardImage first; iOS changes are a separate task.

// ── Card data ─────────────────────────────────────────────────────────────────
window.CT.CARDS = [
  {
    id: 'op05-119',
    name: 'Monkey D. Luffy',
    set: 'Awakening of the New Era',
    setCode: 'OP05',
    number: '119',
    rarity: 'Manga Rare',
    variant: 'Manga Art',
    printVariant: 'p2',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'luffy',
    currentPrice: 240,
    marketPrice: 228,
    change7d: 18.2,
    change30d: 41.5,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 238, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 245, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 228, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op01-120',
    name: 'Shanks',
    set: 'Romance Dawn',
    setCode: 'OP01',
    number: '120',
    rarity: 'Secret Rare',
    variant: 'Alternate Art',
    printVariant: 'p1',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'shanks',
    currentPrice: 185,
    marketPrice: 175,
    change7d: 6.4,
    change30d: 22.1,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 183, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 190, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 175, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op13-119',
    name: 'Portgas D. Ace',
    set: 'Side Character Encyclopedia',
    setCode: 'OP13',
    number: '119',
    rarity: 'Manga Rare',
    variant: 'Manga Art',
    printVariant: 'p2',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'ace',
    currentPrice: 320,
    marketPrice: 298,
    change7d: 24.6,
    change30d: 58.3,
    confidence: 'MEDIUM',
    sources: [
      { name: 'TCGPlayer',     price: 315, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 332, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 298, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op02-120',
    name: 'Roronoa Zoro',
    set: 'Paramount War',
    setCode: 'OP02',
    number: '001',
    rarity: 'Secret Rare',
    variant: 'Leader Alt Art',
    printVariant: 'p1',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'zoro',
    currentPrice: 98,
    marketPrice: 102,
    change7d: -3.9,
    change30d: 11.2,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 96,  updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 101, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 102, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op04-119',
    name: 'Nami',
    set: 'Kingdoms of Intrigue',
    setCode: 'OP04',
    number: '119',
    rarity: 'Treasure Rare',
    variant: 'Parallel Foil',
    printVariant: 'p1',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'nami',
    currentPrice: 145,
    marketPrice: 138,
    change7d: 9.1,
    change30d: 28.7,
    confidence: 'MEDIUM',
    sources: [
      { name: 'TCGPlayer',     price: 143, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 149, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 138, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op03-099',
    name: 'Charlotte Katakuri',
    set: 'Pillars of Strength',
    setCode: 'OP03',
    number: '099',
    rarity: 'Super Rare',
    variant: 'Standard',
    printVariant: null,
    isChase: false,
    game: 'ONE PIECE',
    currentPrice: 28,
    marketPrice: 27,
    change7d: 3.7,
    change30d: -2.1,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 27, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 29, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 27, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'op07-119',
    name: 'Tony Tony Chopper',
    set: '500 Years in the Future',
    setCode: 'OP07',
    number: '119',
    rarity: 'Manga Rare',
    variant: 'Manga Art',
    printVariant: 'p2',
    isChase: true,
    game: 'ONE PIECE',
    characterSlug: 'chopper',
    currentPrice: 110,
    marketPrice: 104,
    change7d: 12.8,
    change30d: 33.4,
    confidence: 'MEDIUM',
    sources: [
      { name: 'TCGPlayer',     price: 108, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 114, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 104, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'sv3pt5-201',
    name: 'Charizard ex',
    set: '151',
    setCode: 'SV3.5',
    number: '201',
    rarity: 'Special Illustration Rare',
    variant: 'SIR',
    printVariant: null,
    isChase: true,
    game: 'POKÉMON',
    _pkSetId: 'sv3pt5',
    currentPrice: 195,
    marketPrice: 188,
    change7d: 4.2,
    change30d: 14.8,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 192, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 199, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 188, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'swsh7-215',
    name: 'Umbreon VMAX',
    set: 'Evolving Skies',
    setCode: 'SWSH7',
    number: '215',
    rarity: 'Alternate Art',
    variant: 'Secret Rare',
    printVariant: null,
    isChase: true,
    game: 'POKÉMON',
    _pkSetId: 'swsh7',
    currentPrice: 278,
    marketPrice: 265,
    change7d: 2.1,
    change30d: -5.3,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 275, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 283, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 265, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'sv5-191',
    name: 'Tera Rayquaza ex',
    set: 'Temporal Forces',
    setCode: 'SV5',
    number: '191',
    rarity: 'Special Illustration Rare',
    variant: 'SIR',
    printVariant: null,
    isChase: true,
    game: 'POKÉMON',
    _pkSetId: 'sv5',
    currentPrice: 88,
    marketPrice: 82,
    change7d: 7.3,
    change30d: 19.4,
    confidence: 'MEDIUM',
    sources: [
      { name: 'TCGPlayer',     price: 86, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 91, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 82, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'swsh8-185',
    name: 'Mew VMAX',
    set: 'Fusion Strike',
    setCode: 'SWSH8',
    number: '185',
    rarity: 'Alternate Art',
    variant: 'Secret Rare',
    printVariant: null,
    isChase: true,
    game: 'POKÉMON',
    _pkSetId: 'swsh8',
    currentPrice: 62,
    marketPrice: 59,
    change7d: -1.6,
    change30d: 8.2,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 61, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 64, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 59, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
  {
    id: 'sv4-086',
    name: 'Pikachu ex',
    set: 'Paradox Rift',
    setCode: 'SV4',
    number: '086',
    rarity: 'Ultra Rare',
    variant: 'Double Rare',
    printVariant: null,
    isChase: false,
    game: 'POKÉMON',
    _pkSetId: 'sv4',
    currentPrice: 18,
    marketPrice: 17,
    change7d: -0.5,
    change30d: 4.1,
    confidence: 'HIGH',
    sources: [
      { name: 'TCGPlayer',     price: 18, updatedAt: '2026-07-15T22:00:00Z' },
      { name: 'eBay (avg)',    price: 19, updatedAt: '2026-07-15T20:00:00Z' },
      { name: 'PriceCharting', price: 17, updatedAt: '2026-07-15T18:00:00Z' },
    ],
  },
];

// TODO: replace with GET /api/v1/chase-radar
window.CT.CHASE_RADAR = {
  rising: [
    { id: 'op13-119', name: 'Ace OP13 MR',      change7d: 24.6 },
    { id: 'op05-119', name: 'Luffy OP05 MR',     change7d: 18.2 },
    { id: 'op07-119', name: 'Chopper OP07 MR',   change7d: 12.8 },
    { id: 'op04-119', name: 'Nami OP04 TR',       change7d: 9.1  },
    { id: 'sv5-191',  name: 'Rayquaza SV5 SIR',  change7d: 7.3  },
  ],
  falling: [
    { id: 'op02-120',  name: 'Zoro OP02 SR',   change7d: -3.9 },
    { id: 'swsh8-185', name: 'Mew VMAX AA',     change7d: -1.6 },
    { id: 'sv4-086',   name: 'Pikachu ex UR',   change7d: -0.5 },
  ],
};

// TODO: replace with GET /api/v2/card/{id}/history
window.CT.mockHistory = function(cardId, days) {
  const card = window.CT.CARDS.find(c => c.id === cardId);
  const base = card ? card.currentPrice : 100;
  const change = card ? card.change30d : 10;
  const pts = [];
  for (let i = days; i >= 0; i--) {
    const noise = Math.sin(i * 0.41) * 0.09 + Math.sin(i * 0.17) * 0.05;
    const trend = (days - i) / days * (change / 100) * 0.7;
    pts.push({
      day: i,
      price: Math.max(base * 0.3, base * (1 - trend + noise)),
    });
  }
  return pts.reverse();
};

// ── Character registry (One Piece) ───────────────────────────────────────────
window.CT.CHARACTERS = {
  luffy:   { name: 'Monkey D. Luffy',   series: 'Straw Hat Pirates' },
  zoro:    { name: 'Roronoa Zoro',       series: 'Straw Hat Pirates' },
  nami:    { name: 'Nami',               series: 'Straw Hat Pirates' },
  chopper: { name: 'Tony Tony Chopper',  series: 'Straw Hat Pirates' },
  shanks:  { name: 'Shanks',             series: 'Four Emperors'     },
  ace:     { name: 'Portgas D. Ace',     series: 'Whitebeard Pirates'},
};

// ── Rarity tag styles — single source of truth
window.CT.RARITY = {
  'All Cards':                 { bg: '#EBF3FF', color: '#0D3B8F' },
  'Chase Only':                { bg: '#E0F9FF', color: '#006688' },
  'Common':                    { bg: '#E6FAF4', color: '#005C3B' },
  'Uncommon':                  { bg: '#E0F7FA', color: '#00695C' },
  'Rare':                      { bg: '#E8F4FF', color: '#0D3B8F' },
  'Super Rare':                { bg: '#EDF0FF', color: '#3D4FC4' },
  'Holo Rare':                 { bg: '#DFF7FF', color: '#0369A1' },
  'Ultra Rare':                { bg: '#EDE9FF', color: '#4B35CC' },
  'Secret Rare':               { bg: '#FFF3E0', color: '#8B5000' },
  'Leader':                    { bg: '#FFE8EC', color: '#C0003C' },
  'Manga Rare':                { bg: '#FCE8F0', color: '#881337' },
  'Manga Art':                 { bg: '#FCE8F0', color: '#881337' },   // DB rarity value for manga chase
  'Alternate Art':             { bg: '#FDE6FF', color: '#A21CAF' },
  'Special Rare':              { bg: '#F5E8FF', color: '#7E22CE' },
  'Special Card':              { bg: '#F5E8FF', color: '#7E22CE' },   // DB rarity value for SP chase
  'Special Illustration Rare': { bg: '#F5E8FF', color: '#7E22CE' },
  'Treasure Rare':             { bg: '#FFF7E0', color: '#7A5200' },
  'Promo':                     { bg: '#F1F5F9', color: '#475569' },
};
window.CT.rarityStyle = function(r) {
  return window.CT.RARITY[r] || { bg: '#EBF3FF', color: '#0D3B8F' };
};
