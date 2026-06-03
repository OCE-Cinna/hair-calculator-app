# Cinna's PAH — Protective Afro-Hairstyle Visualizer & Calculator

A Semester 3 HBO-ICT student project at Fontys University of Applied Sciences. The application digitizes experience-based knowledge in Afro-hair care, helping users estimate hair extension requirements through a formula-backed pack calculator and a real-time 3D braid visualizer.

> **Live demo:** [cinna-pah.web.app](https://cinna-pah.web.app)

---

## Tech Stack

| Category | Technology |
|----------|-----------|
| **Framework** | React 19 + Vite |
| **3D Engine** | React Three Fiber / Three.js |
| **State** | Zustand (with `persist` middleware) |
| **Styling** | Tailwind CSS v4 — OKLCH glassmorphism design system |
| **Animation** | Framer Motion |
| **3D Assets** | Blender (`custom_bust.glb`, Draco compressed) |
| **Hosting** | Firebase Hosting |
| **Testing** | Vitest + React Testing Library |
| **License** | AGPL-3.0-only |

---

## Features

- **Pack Calculator** — Formula validated against professional stylist benchmarks:
  `(style + thickness + density) × length × 0.95`
  Produces both an exact decimal and a rounded bundle count.

- **3D Hair Visualizer** — Baked scalp parting data (`box_braids.json`) drives a `CatmullRomCurve3` + `TubeGeometry` renderer. All braid splines are merged into a single draw call via `mergeGeometries`.

- **Preset Gallery** — Six built-in hairstyle presets (Hip Locs, Knotless, Box Braids, Jumbo Twists, Bob Twists, Long Twists) plus a custom preset creator. Presets are persisted to `localStorage`.

- **Dev Kit** — Professional calibration panel: tune the pack calibration factor, adjust 3D collision sphere radii, hot-swap the bust model and scalp mask, and trigger a fresh parting bake.

- **Glassmorphism UI** — Dual light/dark theme with OKLCH color tokens, ambient orbs, and `backdrop-filter: blur()` glass panels. Blur is automatically reduced on mobile for performance.

- **Responsive Layout** — Single `<Experience />` WebGL context that reflows between portrait mobile (vertical stack) and desktop/landscape (horizontal sidebar layout) via a custom `landscape:` Tailwind breakpoint.

- **Haptic Feedback** — Slider drag and button interactions pulse `navigator.vibrate()` on supported Android devices.

---

## Getting Started

### Prerequisites

- Node.js v18+
- npm

### Install & run

```bash
git clone https://github.com/OCE-Cinna/hair-calculator-app.git
cd hair-calculator-app
npm install
npm run dev
```

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server (Vite HMR) |
| `npm run build` | Generate production bundle |
| `npm run preview` | Preview production build locally |
| `npm test` | Run Vitest unit + integration tests |

### Required assets

Place the following in `public/`:

| Path | Purpose |
|------|---------|
| `public/models/custom_bust.glb` | Draco-compressed head & torso mesh |
| `public/textures/scalp_mask.jpeg` | UV region mask — R=top, G=sides, B=back, black=parting |
| `public/presets/*.jpg` | Preset preview images |

> Braid geometry is generated procedurally at runtime from `src/data/partings/box_braids.json` — no additional GLB hair assets are required.

---

## Project Structure

```
src/
├── features/
│   ├── 3d/
│   │   ├── Experience.jsx          # R3F Canvas, lighting, orbit controls
│   │   ├── HeadModel.jsx           # Theme-aware bust loader (Draco + skin material)
│   │   ├── ViewportControls.jsx    # In-canvas toggle buttons (braids, lighting, roots)
│   │   └── styles/
│   │       └── BoxBraidsRenderer.jsx  # CatmullRom spline + TubeGeometry hair renderer
│   ├── calculator/
│   │   └── HairPacksPanel.jsx      # Sliders, style selector, pack result display
│   └── devkit/
│       ├── DevKit.jsx              # Dev Kit overlay panel
│       └── BakePartings.jsx        # One-shot offline raycasting bake utility
├── layouts/
│   ├── LeftSidebar.jsx             # Desktop navigation sidebar
│   └── PresetPanel.jsx             # Animated preset column (desktop/landscape)
├── components/
│   ├── PresetGallery.jsx           # Horizontal mobile preset strip
│   └── ui/
│       ├── BurgerMenu.jsx          # Mobile/desktop navigation drawer
│       └── ThemeSwitcher.jsx       # Light / dark / system toggle
├── stores/
│   ├── hairStore.js                # User state: slider positions, theme, custom presets
│   └── devStore.js                 # Dev state: DEV_CONFIG, asset overrides, bake trigger
├── constants/
│   ├── hairConfig.js               # STYLE_MAP, THICKNESS_MAP, LENGTH_MAP, DENSITY_MAP
│   └── presets.js                  # INITIAL_PRESETS, STYLE_ALIASES, parsePresetFilename
├── utils/
│   └── calculator.js               # calculateHairPacks() — pure function, independently tested
├── data/
│   └── partings/
│       └── box_braids.json         # Baked scalp parting points {p, n, r}
└── index.css                       # OKLCH design tokens, @theme block, glass utilities
```

---

## How the 3D Hair Works

The visualizer uses a **bake-once, render-many** pipeline:

### 1. Offline bake (`BakePartings.jsx`)
A one-shot utility in the Dev Kit that:
1. Shoots rays from a spherical grid onto the head mesh
2. Samples UV intersections against `scalp_mask.jpeg` to classify each point (`t`=top, `s`=sides, `b`=back)
3. Applies Y-floor guards, a center parting strip, overlap prevention, and explicit X-axis mirroring
4. Downloads the result as `box_braids.json`

The JSON is committed to `src/data/partings/` and imported statically.

### 2. Runtime rendering (`BoxBraidsRenderer.jsx`)
For each baked point, the renderer:
1. Picks a **drape direction** based on the region (forehead sweeps laterally, crown sweeps back, sides drop down)
2. Runs a **20-step physics loop**: lerps toward gravity `[0,-1,0]`, applies head and torso sphere collision push-outs, breaks at a floor Y of `0.0` (shoulder)
3. Feeds the collected positions into a **`CatmullRomCurve3`** for a smooth spline
4. Extrudes a **`TubeGeometry`** (radius `0.015`, 20 tube segments, 5 radial segments) along the spline
5. All tubes are merged into a single mesh via **`mergeGeometries`** — one GPU draw call for the entire head

---

## Dev Kit

Enable the **Dev Kit** from the sidebar (desktop) or burger menu (mobile). It is intended for the developer and professional stylists.

| Feature | Description |
|---------|-------------|
| **Pack Calibration Factor** | Adjust the `0.95` normalization scalar live |
| **Collision Geometry** | Tune head/torso sphere center and radius values |
| **Bust Combos** | Save and restore pairs of `(custom_bust.glb, scalp_mask.jpeg)` |
| **Model Override** | Hot-swap the bust GLB at runtime via file upload |
| **Bake Partings** | Re-run the offline raycasting bake and download a new `box_braids.json` |

---

## Pack Calculator

The formula used:

```
Estimated Bundles = (style + thickness + density) × length × calibrationFactor
```

**Baseline anchor** (all multipliers = `1.0` at these settings):

| Parameter | Setting | Coefficient |
|-----------|---------|-------------|
| Style | Box Braids | `1.0` |
| Thickness | Medium | `1.0` |
| Density | Medium | `1.0` |
| Length | Shoulder (24") | `1.0` |

Result at baseline: `(1.0 + 1.0 + 1.0) × 1.0 × 0.95 = 2.85` → **3 packs**

See [`docs/HAIR_MATH.md`](./docs/HAIR_MATH.md) for full coefficient tables.

---

## Documentation

| Document | Contents |
|----------|----------|
| [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) | System overview, state stores, rendering pipeline |
| [`docs/HAIR_MATH.md`](./docs/HAIR_MATH.md) | Pack formula, all coefficient tables, calibration factor |
| [`docs/PROCEDURAL_PLACEMENT.md`](./docs/PROCEDURAL_PLACEMENT.md) | Bake pipeline and runtime draping algorithm in detail |
| [`docs/UI_UX_EVOLUTION.md`](./docs/UI_UX_EVOLUTION.md) | Design system, glassmorphism rationale, mobile/browser fixes |
| [`docs/DEV_LOG.md`](./docs/DEV_LOG.md) | Chronological development log |
| [`CONTRIBUTING.md`](./CONTRIBUTING.md) | Branch strategy, commit conventions, PR process |

---

## License

Licensed under the **GNU Affero General Public License v3.0 (AGPL-3.0-only)**.

Any modified version deployed as a web service must also release its source code. See [LICENSE](./LICENSE) for details.
