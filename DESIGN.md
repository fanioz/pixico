# Pixico · Aesthetic Pixel Studio — Design Spec

Extracted from `pixico-aesthetic-editor.html` on 2026-09-27. Single-file Apple-system prototype for aesthetic pixel-art lovers.

## 1. Product overview

**Tagline:** “A soft place to draw loud little icons.”
**Pitch:** The Pixico grid editor retuned for cozy / pastel aesthetics — pastel palettes first, chunky shapes, live store mockups, one-tap store-true export.
**Audience:** sticker-shop owners, cozy-game fans, app-icon doodlers, aesthetic pixel-art lovers evaluating product feel.
**Page rhythm:** topnav → hero-split → 3-up features → working studio → quote → starter log-list → centered CTA → footer.

## 2. Brand & tokens (Apple system, verbatim)

```css
--bg: #ffffff;
--surface: #f5f5f7;
--surface-warm: #fbfbfd;
--fg: #1d1d1f;
--fg-2: #424245;
--muted: #6e6e73;
--meta: #86868b;
--border: #d2d2d7;
--border-soft: #e8e8ed;
--accent: #0071e3;
--accent-on: #ffffff;
--accent-hover: #0077ed;
--accent-active: #0066cc;
--success: #16a34a;
--warn: #eab308;
--danger: #dc2626;
```

Derived local: `--accent-soft: color-mix(accent 10%, transparent)`, `--fg-soft: color-mix(fg 5%, transparent)`.

- **Section rhythm:** white hero → white features → pale-gray studio band (`--surface`) → white quote/templates/CTA. Binary light rhythm, no black chapters in this cut.
- **Accent budget:** single blue `#0071e3`, used for eyebrow, pill, primary CTA, swatch focus, range accent. Max 2 accent hits per viewport.
- **Surfaces:** `--bg` page, `--surface` studio shell / hero-visual, `--bg` cards inside; dark ink `#1d1d1f` reserved for canvas-stage + selected tool/segment.
- **Borders:** `--border` controls, `--border-soft` inner cards / swatch grid. Elevation: flat default, `0 12px 32px rgba(0,0,0,0.08)` on studio-shell + hero-visual.
- **Motion:** `--motion-fast 150ms`, `--motion-base 220ms`, `--ease-standard cubic-bezier(0.28,0,0.22,1)`. Button press `translateY(1px)`. Focus ring `0 0 0 4px color-mix(accent, transparent 65%)`.

## 3. Typography

- Display: `SF Pro Display, SF Pro Icons, Helvetica Neue, Helvetica, Arial, sans-serif` — h1/h2/h3, logo, quote.
- Body: `SF Pro Text` + same fallbacks — lead, features, meta.
- Mono: `SF Mono, ui-monospace, JetBrains Mono, Menlo, Monaco, Consolas, monospace` — eyebrow, meta, px counts, pills.
- Scale in file: `h1 clamp(44px,6vw,68px) / 1.04 / -0.015em / 600`, `h2 clamp(30px,4vw,44px) / 1.08`, `h3 22px`, `lead 19px muted`, `body 16px / 1.55`, `meta 13px mono muted`.
- Copy tone: soft, lowercase-adjacent playfulness (“fiddly gone, cute kept”, “pays for boba”).

## 4. Layout system

- Container `1120px`, gutter `32px`. Section padding `clamp(48px,7vw,96px)`, hairline `1px var(--border)` between sections.
- Grids: `.grid-3` features, `.grid-2-1 (1.55fr 1fr)` studio (canvas | tools), `.preview-row 3-col`, `.hero-split 1fr 1fr`. Collapse to 1-col ≤920px.
- Topnav: sticky, `blur(14px)`, `color-mix(bg 88%, transparent)`, logo + 4 links (Studio / Why soft / Starters / Export) + pill `Open studio`. Links hidden ≤760px.
- Footer: hairline top, `© Pixico · 2026` left, `soft pixels · store-ready · hello@pixico.app` right.

## 5. Sections & content

### 5.1 Hero-split (`data-od-id="hero-split"`)
- Left: eyebrow `Pixico · Cozy pixel studio`, H1, lead (“grids, PICO-8, one-click store export — retuned for aesthetic lovers”), CTA row: primary `Start drawing` → scrolls to studio, ghost arrow `Browse starters` → templates. Micro-meta: `16 · 24 · 32 grids · offline-first · 512 / 1024 store PNG`.
- Right: `hero-visual` card — row `Live · boba cat` pill + `32 × 32 · Sweetie-16` meta, 32×32 canvas rendered pixelated, tag row: `pastel first / chunky 1-px line / store preview`.
- Hero art = procedural boba-cat (see §7), checker underpaint alternating `#f5f5f7 / #ffffff` for transparency.

### 5.2 Features (`feature-export / feature-palette / feature-pixelize`)
Three flat cards, 36px bordered mark + h3 + 15px muted copy:
1. **Store-true export** — “One tap to Google Play 512, App Store 1024, Windows ICO.”
2. **Pastel-first palettes** — “Sweetie-16, milk-tea, Game Boy first. Full PICO-8 one tap away.”
3. **Photo → pixel, softly** — “Drop a café photo. Posterize + chunky dither, never blur.” ( aspirational — no uploader wired in this cut).

### 5.3 Studio (`data-od-id="studio"`, gray band)
Header row: eyebrow + H2 “Draw here. It actually works.” + lead, right meta `autosaves locally · {N²} px`.
`studio-shell` (26px radius, raised shadow) contains canvas left, controls right.

### 5.4 Quote
Large `"` mark (110px, accent 16%), 24–30px Display quote: “It finally feels like drawing stickers, not configuring a build…” — Riko, sticker-shop owner.

### 5.5 Starters (`data-od-id="templates"`)
Log-rows `110px | 1fr | 110px`: size mono, title + 14px muted desc, `Load` mini-btn. Three rows: Boba cat 32², Cloud frog 32², Shop bow 16². Tap loads into studio + smooth-scrolls up.

### 5.6 CTA-strip
Centered 600px: H2 “Make an icon worth tapping.”, lead “Free to doodle. Export pays for boba…”, primary `Export my icon` triggers PNG download.

## 6. Studio functional spec

- **Canvas:** `<canvas id="pixelCanvas">`, `image-rendering: pixelated`, crosshair, `touch-action:none`. Dark stage (`--fg` bg + checker 14px). Coords bar `X: · Y: · N × N` + hint “click-drag · right-click erases”.
- **Grid sizes:** seg control 16 / 24 / 32 (default 32). Switching blanks canvas, resizes width/height attrs, keeps `imageSmoothingEnabled=false`, pushes history.
- **Tools (4):** Pen / Erase / Fill (flood-fill 4-way) / Shade (darken −14 per tap). Single-select `aria-pressed`, selected = ink fill. Pointerdown + pointermove paint; right-button forces eraser for stroke; `contextmenu` suppressed.
- **Mirror:** toggle `Mirror: off/on`, mirrors on vertical axis (`mx = N-1-x`).
- **History:** stringified grid stack, cap 40, Undo / Redo / Clear buttons.
- **Color:** swatch-grid 8-col, selected = 2px accent outline offset 2px. Custom `<input type=color>` defaults `#ff9ecf`. Palette switcher cycles + sets color to index 5.
- **Palettes (exact):**
  - `Sweetie-16`: `#f4f4f4, #94b0c2, #566c86, #333c57, #77203a, #9c2b3c, #d95763, #e39b7b, #e5b083, #f0d49b, #f7f7c8, #a7d28f, #5a9e6f, #3b6b5a, #2a4a5e, #1a1c2c`
  - `Milk tea`: `#fff8f0, #f5e6d3, #e8c39e, #d29b7b, #a9715b, #6f4e4e, #f9a8c8, #ff9ecf, #c86ba8, #8a5f9e, #5f6caf, #7bd0e8, #a8e6cf, #ffe28a, #ff9e6b, #3b3b4d`
  - `PICO-8`: `#000000, #1d2b53, #7e2553, #008751, #ab5236, #5f574f, #c2c3c7, #fff1e8, #ff004d, #ffa300, #ffec27, #00e436, #29adff, #83769c, #ff77a8, #ffccaa`
  - `Game Boy`: `#0f380f, #306230, #8bac0f, #9bbc0f, #e8f8d0, #ffffff, #f8b8d0, #a078f0`
- **Previews:** three 64×64 canvases (`pvPlay / pvApp / pvHome`) on dark `#0f172a` ground, re-rendered every stroke. Labels: Play 512 / App Store 1024 / Home scr.
- **Export:** `Download PNG` → 512×512, bg `#fff8f0`, 10% padding, crisp rects, downloads `pixico-icon-512.png`. `Copy CSS pixels` → `█ / ·` text grid to clipboard.
- **Persistence note:** copy claims “autosaves locally” — current JS keeps in-memory history only, no localStorage wired. Treat as gap on rebuild.

## 7. Starter pixel recipes (procedural, `P(g,x,y,w,h,c)` rects)

- **Boba cat:** ink cap band (9,5,14,3 `#3b3b4d`), cream face (7,8,18,12 `#fff8f0`), side puffs + pink inner ears `#ff9ecf`, ink eyes 3×4 + white glint, pink blush, purple mouth `#8a5f9e`, milk-tea cup (13,17,6,5 `#e8c39e`, tea `#6f4e4e`, sleeve `#d29b7b`), saucer strip.
- **Cloud frog:** cream cloud (6,16,20,6 `#f5e6d3`), mint body + eye stalks `#a8e6cf`, white eyes + ink pupils, green smile `#5a9e6f`, pink cheek.
- **Shop bow:** default color `#ff9ecf` loops `#c86ba8` center `#8a5f9e` knot + white highlights. Note: loader forces 32-grid, so 16-px bow spec renders centered in 32 field.

## 8. Components & states

- Buttons: `.btn-primary` accent fill / white, hover `#0077ed`, active `#0066cc`; `.btn-secondary` transparent + border, hover border→fg; `.btn-ghost` text, hover→accent + arrow slide; `.mini-btn` 10px radius bordered; `.tool-btn` 12px radius, selected ink fill; `.seg` pill group, selected ink.
- Swatch: 30px min, 8px radius, 14% ink border; selected accent outline.
- Cards: flat feature (no chrome) vs `hero-visual / studio-shell / preview-card` bordered + soft shadow.
- Focus: all interactive `:focus-visible` → accent halo. Contrast: ink-on-white, white-on-accent, muted (4.6:1+) for secondary only.
- Imagery: no raster assets — all visuals are live canvas. No hotlinks. Alt: hero + studio canvases labeled.

## 9. Responsive / a11y / gaps

- Breakpoints: 920px grids stack, 760px nav links hide, 640px log-rows stack. Canvas `width:min(100%,440px)` scales; previews 3→1 col via grid-1col fallback.
- Touch: pointer events + `setPointerCapture`, 44px+ primary CTAs, tool buttons ~56px tall.
- Gaps to close next pass: wire localStorage autosave, add photo→pixel uploader (copy promises it), add 1024/ICO export targets, honor 16-grid for bow loader, add range/brush-size control (CSS exists, input missing).
