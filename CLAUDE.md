# CLAUDE.md — ChaseTrackr Website

## Always Do First
- Invoke the `frontend-design` skill before writing any frontend code, every session.
- Invoke the `chasetrackr-web` skill (`.claude/skills/chasetrackr-web/SKILL.md`).
- Read `chasetrackr_brand_guidelines_v2.html` (repo root, dev-only — kept out of
  the `public/` publish dir so it isn't served on the live site) — it is authoritative.
- Site files live under `public/` (Render's publish directory); dev artifacts
  (this file, HANDOFF.md, serve.mjs, brand guidelines) stay at the repo root.

## What This Product Is
ChaseTrackr is a TCG **price-intelligence and portfolio** web app for One Piece
and Pokémon collectors, focused on high-value "chase" cards.

**It is NOT a marketplace.** Never add buying, selling, bidding, offers, carts,
checkout, vaulting, or auctions. The reference site (alt.xyz) has these — we copy
its layout, not its commerce.

## Reference Material
- `reference/ALT_WEBPAGE.pdf` — home / featured layout
- `reference/ALT_CARD_WEBPAGE.pdf` — card detail layout
- `reference/LUFFY___Browse___Alt.pdf` — search / browse layout
- `reference/` also holds app screenshots. Match the app for identity, alt for structure.

Match layout, spacing, and information density from the PDFs. Override all of
alt's colors and fonts with ChaseTrackr's. Never copy alt's copy, images, or fonts.

## Brand Tokens
```
--blue #2979FF   --cyan #00D4FF   --gold #F5A623   --navy #0A1628
--bg #F4F8FF     --surface #EBF3FF --white #FFFFFF  --border #C5D9F5
--text-mid #3A5A8A --muted #7A96BB
--green #00C48C (up)  --red #FF4D6A (down)  --purple #7B61FF (ultra rare)
```
Light theme. Only the top bar and hero band are navy.

## Typography
- **Nunito** 800/900 — logotype, hero headings, displayed prices.
- **Exo 2** 400–800 — body, buttons, labels, data, nav.
- Self-host from `brand_assets/` via `@font-face`. No Google Fonts CDN.
- Never use one font for both roles.

## Local Server
- Always serve on localhost — never screenshot a `file:///` URL.
- Start: `node serve.mjs` (serves project root). PORT: [CONFIRM]
- `serve.mjs` lives in the project root. If it's already running, don't start a second instance.

## Screenshot Workflow
- Always screenshot from `http://localhost:[PORT]`.
- After screenshotting, read the PNG back and compare against the matching
  reference PDF.
- Be specific when comparing: "heading is 32px, reference reads ~48px",
  "card gap is 12px, reference ~24px".
- Check: spacing/padding, font size/weight/line-height, exact hex colors,
  alignment, border radius, shadow depth.
- Minimum two passes per page. Never stop after one.

## Output Defaults
- Mobile-first responsive.
- Keep all placeholder card data in one `data/cards.js` export, marked
  `TODO: replace with GET /api/v1/search-card`.
- Backend (for later): `https://chasetrackr-backend.onrender.com`

## Anti-Generic Guardrails
- **Colors:** never the default Tailwind palette. Use the brand tokens.
- **Shadows:** layered, color-tinted, low opacity. Never flat `shadow-md`.
- **Typography:** pair the two fonts — never one for everything.
- **Gradients:** layer multiple; add grain/texture via SVG noise filter.
- **Animations:** only `transform` and `opacity`. Never `transition-all`.
- **Interactive states:** hover + focus-visible + active on every clickable element.
- **Spacing:** consistent tokens, not random steps.
- **Depth:** a real layering system (base → elevated → floating), not flat.

## Hard Rules
- No marketplace features — ever.
- Don't invent credibility stats. Mark any placeholder numbers with a TODO.
- Don't add sections or features not in the reference or the app.
- Don't "improve" the reference layout — match its structure.
- Don't stop after one screenshot pass.
- Auth is UI-only for now. Stub handlers with a TODO.
