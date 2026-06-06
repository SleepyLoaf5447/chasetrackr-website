# CLAUDE.md - Frontend Website Rules
## Always Do First
- **Invoke the "frontend-design" skill** before writing any frontend code, every sessi
## Reference Images
⁃	If a reference image is provided: match layout, spacing, typography, and color exact
⁃	If no reference image: design from scratch with high craft (see guardrails below).
⁃	Screenshot your output, compare against reference, fix mismatches, re-screenshot. Do
## Local Server
⁃	**Always serve on localhost** - never screenshot a "file:///" URL.
⁃	Start the dev server: "node servemjs" (serves the project root at "http://localhost
⁃	"serve.mjs" lives in the project root. Start it in the background before taking any
⁃	If the server is already running, do not start a second instance.
# Screenshot Workflow
⁃	Puppeteer is installed at C:/Users/nateh/AppData/Local/Temp/puppeteer-test/*. Chrom
⁃	**Always screenshot from localhost:** node screenshot.mjs http://localhost: 3000*
⁃	Screenshots are saved automatically to /temporary screenshots/screenshot-N.png' (a
⁃	Optional label suffix: "node screenshot.mjs http://localhost:3000 label' → saves as
⁃	"screenshot.mjs" lives in the project root. Use it as-is.
⁃	After screenshotting, read the PNG from "temporary screenshots/" with the Read tool
⁃	When comparing, be specific: "heading is 32px but reference shows ~24px", "card gap
⁃	Check: spacing/padding, font size/weight/line-height, colors (exact hex), alignment,
## Output Defaults
⁃	Single "index.html' file, all styles inline, unless user says otherwise
Tailwind CSS via CDN: "‹script src-"https://cdn.tailwindcss.com">/script>*

## Output Defaults
⁃	Single "index.html" file, all styles inline, unless user says otherwise
⁃	Tailwind CSS via CDN: *<script src="https://cdn.tailwindcss.com">/script>*
⁃	Placeholder images: ^https://placehold.co/WIDTHxHEIGHT*
⁃	Mobile-first responsive
## Brand Assets
⁃	Always check the "brand_assets/" folder before designing. It may contain logos, colo
⁃	If assets exist there, use them. Do not use placeholders where real assets are avail
⁃	If a logo is present, use it. If a color palette is defined, use those exact values
## Anti-Generic Guardrails
⁃	**Colors:** Never use default Tailwind palette (indigo-500, blue-600, etc.). Pick a
⁃	**Shadows: ** Never use flat " shadow-md". Use layered, color-tinted shadows with low
⁃	**Typography:** Never use the same font for headings and body. Pair a display/serif
⁃	**Gradients:** Layer multiple radial gradients. Add grain/texture via SVG noise filt
⁃	**Animations:** Only animate "transform" and "opacity". Never "transition-all'. Use
⁃	**Interactive states:** Every clickable element needs hover, focus-visible, and acti
⁃	**Images:** Add a gradient overlay (bg-gradient-to-t from-black/60°) and a color tr
⁃	**Spacing:** Use intentional, consistent spacing tokens - not random Tailwind steps.
⁃	**Depth: ** Surfaces should have a layering system (base → elevated → floating), not
## Hard Rules
⁃	Do not add sections, features, or content not in the reference
⁃	Do not "improve" a reference design - match it
⁃	Do not stop after one screenshot pass
⁃	Do not use transition-all"
Do not use default Tailwind blue/indigo as primary color

