# Architecture

Cinna's PAH is a client-side React application with no backend. All computation runs in the browser. The three concerns (state, calculation, and 3D rendering) are kept deliberately separate.

## System overview

```
Browser
├── React (UI shell, sliders, menus)
│   └── Zustand (shared state — two stores)
├── React Three Fiber / Three.js (3D scene)
│   ├── Baked parting data (JSON, pre-computed)
│   ├── BoxBraidsRenderer (CatmullRom spline + TubeGeometry)
│   ├── Physics loop (draping + collision)
│   └── EffectComposer (post-processing)
└── calculator.js (pack estimation formula)
```

Data flows in one direction. The user moves a slider → Zustand updates → components read new values → scene and panel re-render. The formula runs from the same store values but independently of the 3D scene.

---

## State management

Two Zustand stores in `src/stores/`. They are intentionally separate so that calibration state (Dev Kit / Stylist Mode) never pollutes the user's saved presets.

### useHairStore

Persisted to `localStorage` under the key `hair-storage`. Only dynamic user selections are persisted; the static lookup maps are defined in `src/constants/hairConfig.js` and referenced by the store to avoid storing large constant objects in localStorage on every write.

| Key | Type | Description |
|-----|------|-------------|
| `stylePos` | `1–4` | Index into STYLE_MAP |
| `thicknessPos` | `1–6` | Index into THICKNESS_MAP |
| `lengthPos` | `1–6` | Index into LENGTH_MAP |
| `densityPos` | `1–5` | Index into DENSITY_MAP |
| `theme` | `'light' \| 'dark' \| 'system'` | UI theme |
| `customPresets` | `Preset[]` | User-created presets |
| `showScalpPattern` | `boolean` | Overlay parting pattern in viewport |
| `showBraids` | `boolean` | Toggle braid mesh visibility |
| `showOnlyRoots` | `boolean` | Show only root segments (for debugging partings) |
| `lightingMode` | `'natural' \| 'studio' \| 'moody'` | Active lighting preset |
| `_hasHydrated` | `boolean` | Guards against rendering before localStorage is read |

Viewport settings (`showScalpPattern`, `showBraids`, `showOnlyRoots`, `lightingMode`) are **not** persisted — they reset on page load.

`selectStyle(pos)` is a compound action: it sets the style position **and** applies that style's bundled default thickness, length, and density positions from `STYLE_MAP`.

Static maps (`STYLE_MAP`, `THICKNESS_MAP`, etc.) are exposed on the store for selector compatibility but sourced from `CONFIG_MAPS` in `hairConfig.js`.

### useDevStore

Persisted to `localStorage` under the key `hair-dev-storage`. Controls the Dev Kit panel and holds all runtime calibration state.

| Key | Type | Description |
|-----|------|-------------|
| `isEnabled` | `boolean` | Dev Kit on/off |
| `debugRaycast` | `boolean` | Show collision wireframes in 3D viewport |
| `shouldBake` | `boolean` | Triggers a one-shot bake of parting points |
| `assets` | `Record<slot, url>` | Hot-swap slots for model overrides (blob URLs) |
| `bustCombos` | `BustCombo[]` | Saved bust + mask combinations |
| `DEV_CONFIG` | `object` | Collision geometry and calibration values |

The `DEV_CONFIG` object is the source of truth for 3D physics geometry and calibration. When a stylist adjusts a slider in the panel, `updateDevConfig(key, val)` writes directly to this object and the scene re-renders on the next frame.

**DEV_CONFIG fields:**

| Field | Default | Description |
|-------|---------|-------------|
| `headCenterY` | `1.25` | Vertical center of the head collision sphere |
| `headCenterZ` | `0.0` | Z offset of head sphere |
| `headRadius` | `0.95` | Radius of head collision sphere |
| `torsoCenterY` | `0.2` | Vertical center of torso collision sphere |
| `torsoRadius` | `1.25` | Radius of torso collision sphere |
| `torsoStretchX` | `1.5` | X-axis scale applied to torso sphere for ellipsoid shape |
| `torsoStretchZ` | `1.5` | Z-axis scale applied to torso sphere for ellipsoid shape |
| `torsoPushOut` | `0.5` | Aggressiveness of torso push-out on hair |
| `partingRowMultiplier` | `5` | Row density multiplier for bake |
| `partingPointMultiplier` | `5` | Point density multiplier for bake |
| `thicknessDensityScale` | `true` | Whether thickness affects strand count |
| `calibrationFactor` | `0.95` | Pack formula normalization factor |
| `centerPartingWidth` | `0.08` | Width of the clear center parting on top |
| `partThickness` | `0.08` | Minimum distance between adjacent parting points |

`bustCombos` supports CRUD via `addBustCombo`, `deleteBustCombo`, and `applyBustCombo`. `applyBustCombo` writes `custom_bust` and `scalp_mask` into `assets`, switching the scene's model and scalp mask in one action.

---

## Pack estimation formula

`src/utils/calculator.js` contains the single exported function:

```js
calculateHairPacks(style, thickness, density, length, factor = 0.95)
// returns: (style + thickness + density) * length * factor
```

The coefficient values come from the store maps. Plugging in defaults (Medium thickness, Shoulder length, Medium density, Box Braids):

```
(1.0 + 1.0 + 1.0) * 1.0 * 0.95 ≈ 2.85 packs
```

The `factor` parameter defaults to `0.95` but is exposed to Stylist Mode via `DEV_CONFIG.calibrationFactor`. Changing it does not affect the 3D rendering, only the number displayed on screen.

### Configuration maps (`src/constants/hairConfig.js`)

`CONFIG_MAPS` is the single source of truth for all slider coefficients and defaults.

**STYLE_MAP** — `[label, packMult, defaultThicknessPos, defaultLengthPos, defaultDensityPos]`

| Pos | Style | Pack mult | Default thickness | Default length | Default density |
|-----|-------|-----------|-------------------|----------------|-----------------|
| 1 | Box Braids | 1.0 | Medium (4) | Shoulder (3) | Medium (3) |
| 2 | Knotless | 1.2 | Smedium (3) | Shoulder (3) | Full (4) |
| 3 | Twists | 0.9 | Medium (4) | Shoulder (3) | Medium (3) |
| 4 | Locs | 1.1 | Smedium (3) | Waist (5) | Low (2) |

**THICKNESS_MAP** — `[label, coefficient]` (baseline = Medium at 1.0)

| Pos | Label | Coefficient |
|-----|-------|-------------|
| 1 | Micro | 0.29 |
| 2 | Small | 0.57 |
| 3 | Smedium | 0.71 |
| 4 | Medium | 1.0 |
| 5 | Large | 1.71 |
| 6 | Jumbo | 3.57 |

**LENGTH_MAP** — `[label, coefficient]` (baseline = Shoulder at 1.0)

| Pos | Label | Coefficient |
|-----|-------|-------------|
| 1 | Ear (10") | 0.4 |
| 2 | Jaw (12") | 0.5 |
| 3 | Shoulder (24") | 1.0 |
| 4 | Mid-back (30") | 1.25 |
| 5 | Waist (36") | 1.5 |
| 6 | Hip (48") | 2.0 |

**DENSITY_MAP** — `[label, coefficient]`

| Pos | Label | Coefficient |
|-----|-------|-------------|
| 1 | Very Low | 0.5 |
| 2 | Low | 0.7 |
| 3 | Medium | 1.0 |
| 4 | Full | 2.0 |
| 5 | Very Full | 3.0 |

**DENSITY_COUNTS** — raw strand counts per density position used by the bake tool:
`{ 1: 20, 2: 40, 3: 60, 4: 100, 5: 150, 6: 220, 7: 320 }`

---

## 3D rendering pipeline

The scene lives inside `src/features/3d/Experience.jsx`. It runs inside a React Three Fiber `<Canvas>` and communicates with the rest of the app exclusively through the Zustand stores.

> **Current focus mode**: The 3D viewport is locked to Box Braids / Shoulder / Medium / Medium regardless of slider position. The UI sliders still drive the pack calculation but do not change the 3D model. This is an intentional baseline while the parting system matures.

### Baked parting data

Parting point placement is **no longer computed at runtime via raycasting**. It is pre-computed offline and stored as a compact JSON file at `src/data/partings/box_braids.json`.

Each entry is:
```json
{ "p": [x, y, z], "n": [nx, ny, nz], "r": "t" }
```
- `p` — world-space position on the scalp surface
- `n` — outward surface normal at that point
- `r` — region: `"t"` (top), `"s"` (sides), `"b"` (back)

This file is imported directly by `BoxBraidsRenderer` at module load and does not change at runtime unless the stylist triggers a re-bake.

### Baking partings (BakePartings)

`src/features/devkit/BakePartings.jsx` is a one-shot R3F component that regenerates `box_braids.json`. It is only mounted when `shouldBake` is `true` in `useDevStore`.

The bake algorithm:
1. Generates candidate ray origins in concentric spherical rows around the head center (`center = [0, 1.4, 0]`, `radius = 2.5`).
2. Each row sits at a vertical angle `phi` between 0 (crown) and 1.4 radians (nape).
3. For each candidate, a ray fires inward and intersects the scalp mesh.
4. UV coordinates are sampled against the `scalp_mask.jpeg` to classify the hit into a region (top/sides/back).
5. A Y-position floor per region (`0.85` for top and sides, `0.58` for back) prevents hair from spawning on the neck or face boundary.
6. The center parting strips a band of width `0.05` along `x = 0` for top-region points.
7. A minimum distance of `0.025` between points prevents overlap.
8. Each accepted point is explicitly mirrored across the X-axis for guaranteed left-right symmetry.

When the bake finishes, the data is serialized to JSON and downloaded as `box_braids.json`. The stylist replaces the file in `src/data/partings/` and the scene picks it up on the next build.

### Step 1 — Hair draping (BoxBraidsRenderer)

`src/features/3d/styles/BoxBraidsRenderer.jsx` reads the baked point array and builds the full 3D hair in a `useMemo`. It uses `THREE.CatmullRomCurve3` + `THREE.TubeGeometry` and merges all tubes into a single draw call via `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils`.

For each baked point the renderer:

1. **Resolves a drape direction** from the region:
   - `top, front (z > 0)` — sweeps laterally away from center and forward
   - `top, crown/back (z ≤ 0)` — sweeps backward and down
   - `sides` — sweeps slightly back and down
   - `back` — falls straight down with a slight backward lean

2. **Runs a physics loop** (20 iterations, step size `0.1`):
   - Each iteration lerps direction toward gravity `[0, -1, 0]` by `j * 0.05`.
   - **Head collision**: if the cursor enters the head sphere, it is pushed out radially; front-facing points additionally receive a lateral push.
   - **Torso collision**: if the cursor enters the torso sphere, it is pushed out radially.
   - Loop stops when `currentPos.y ≤ 0.0` (shoulder floor).

3. **Builds a spline**: `CatmullRomCurve3` over the collected points, extruded as a tube with radius `0.015`, 20 curve segments, and 5 radial segments.

All collision sphere parameters are read from `DEV_CONFIG` and can be tuned live in the Dev Kit.

### Style renderers

The renderer directory `src/features/3d/styles/` contains one file per style. Currently only `BoxBraidsRenderer` has a full implementation. `KnotlessRenderer`, `TwistsRenderer`, and `LocsRenderer` are stubs.

### Lighting

`DynamicLighting` (inside `Experience.jsx`) adapts the scene lights to the active `lightingMode` from `useHairStore`:

| Mode | Description |
|------|-------------|
| `natural` | Warm ambient + directional with a soft rim light |
| `studio` | Bright neutral multi-directional setup |
| `moody` | Low ambient, warm key, coloured fill and back lights |

A `CameraFollowLight` directional light tracks the camera position every frame to maintain consistent fill regardless of orbit angle.

### Viewport controls

`ViewportControls` (`src/features/3d/ViewportControls.jsx`) is an overlay panel positioned top-right of the canvas. It provides:
- **Parting pattern toggle** — shows/hides the scalp UV guide texture
- **Braids visibility toggle** — hides/shows the braid mesh
- **Root-only toggle** — shows only the root segments (disabled when braids are hidden)
- **Lighting cycle** — cycles through `natural → studio → moody` with an animated icon transition

All toggles write to `useHairStore` via their respective setters.

### Post-processing

The scene uses `@react-three/postprocessing` with:
- **Bloom** (luminance threshold 1.0, mipmap blur, intensity 0.2, radius 0.4) — subtle glow on highlights
- **Noise** (opacity 0.02) — film grain for depth
- **Vignette** — darkens edges
- **ACES Filmic tone mapping** — consistent exposure across light and dark themes

On mobile (`/iPhone|iPad|iPod|Android/i`), Bloom and Noise are disabled, `multisampling` drops to 0, `dpr` cap drops from `[1, 2]` to `[1, 1.5]`, and `antialias` is disabled.

An `ExperienceErrorBoundary` wraps the Canvas to catch WebGL or asset loading errors without crashing the whole app.

### Model format

GLB files for the bust are loaded with Draco compression via the Google CDN decoder (`https://www.gstatic.com/draco/versioned/decoders/1.5.5/`). The following models are preloaded:

| Slot | File | Purpose |
|------|------|---------|
| Bust | `custom_bust.glb` | Head and shoulder mesh |
| Box braids segment | `hair_box_mid.glb` | Reference (not used in tube renderer) |
| Twists segment | `hair_twist_mid.glb` | Reference |
| Locs segment | `hair_loc_mid.glb` | Reference |

In Dev Kit mode, bust and scalp mask can be replaced at runtime via file upload slots. Uploaded files are converted to blob URLs and stored in `useDevStore.assets` under the keys `custom_bust` and `scalp_mask`.

---

## Component responsibilities

| Component | Responsibility |
|-----------|---------------|
| `App.jsx` | Root shell — layout, theme hydration, preset selection |
| `src/layouts/LeftSidebar.jsx` | Desktop icon rail — menu, presets, Dev Kit, theme, GitHub |
| `src/layouts/PresetPanel.jsx` | Desktop collapsible preset column |
| `src/components/ui/BurgerMenu.jsx` | Mobile slide-out info/navigation drawer |
| `src/components/ui/ThemeSwitcher.jsx` | Light/dark/system theme toggle (horizontal + vertical variants) |
| `src/components/PresetGallery.jsx` | Mobile horizontal preset gallery |
| `src/components/Sliders.jsx` | Reusable slider primitives |
| `src/features/3d/Experience.jsx` | R3F Canvas, lighting, orbit controls, post-processing, error boundary |
| `src/features/3d/HeadModel.jsx` | GLTF loader, skin material, scalp mask texture |
| `src/features/3d/ViewportControls.jsx` | Overlay viewport toggle buttons (pattern, braids, roots, lighting) |
| `src/features/3d/styles/BoxBraidsRenderer.jsx` | Baked-data reader, spline builder, merged tube mesh |
| `src/features/3d/styles/KnotlessRenderer.jsx` | Stub |
| `src/features/3d/styles/TwistsRenderer.jsx` | Stub |
| `src/features/3d/styles/LocsRenderer.jsx` | Stub |
| `src/features/devkit/DevKit.jsx` | Dev Kit UI — calibration sliders, asset uploads, bake trigger, bust combo manager |
| `src/features/devkit/BakePartings.jsx` | One-shot R3F parting bake tool; downloads `box_braids.json` |
| `src/features/calculator/HairPacksPanel.jsx` | Calculator results display and parameter inputs |

---

## Presets system

`src/constants/presets.js` defines two things:

1. **`INITIAL_PRESETS`** — a hardcoded array of 15 preset objects with `id`, `label`, `sublabel`, `image`, and `bgGradient`. IDs follow the naming convention `{length}_{thickness}_{style}` (e.g. `waist_small_boxbraid`).
2. **`parsePresetFilename(filename)`** — parses a preset filename using `STYLE_ALIASES`, `LENGTH_ALIASES`, and `THICKNESS_ALIASES` dictionaries to derive `stylePos`, `thicknessPos`, `lengthPos`, and `densityPos`. Used by the DevKit preset creator.

Custom presets created in the Dev Kit are stored in `useHairStore.customPresets` and merged with `INITIAL_PRESETS` in `App.jsx` before being passed to `PresetGallery` and `PresetPanel`.

---

## Asset pipeline

All runtime assets live in `public/` and are served statically:

```
public/
├── models/         # .glb bust and braid segment references
│   ├── custom_bust.glb
│   ├── hair_box_mid.glb
│   ├── hair_twist_mid.glb
│   ├── hair_loc_mid.glb
│   └── hair_loc2strand_mid.glb
├── textures/       # scalp_mask.jpeg, scalp_uv_guide.jpeg
├── presets/        # preset preview images (.jpg)
└── progress/       # dev reference screenshots
```

The scalp mask is a colored JPEG painted in Blender UV space:
- Red regions (R > 128) → Top of head spawning
- Green regions (G > 128) → Sides of head spawning
- Blue regions (B > 128) → Back of head spawning
- Black regions → natural partings, nape, face boundary

A second texture `scalp_uv_guide.jpeg` is loaded in debug mode (`debugRaycast = true`) in place of the scalp mask to visualize the UV layout.

In Dev Kit mode, any of the assets above can be replaced at runtime via the file upload slots. Uploaded files are converted to blob URLs and stored in `useDevStore.assets`. The scene reloads the model or texture without a full page refresh.

---

## Testing

Tests use Vitest and React Testing Library. Three.js and R3F are mocked in `vite.config.js` to avoid WebGL context errors in the test environment. The formula in `calculator.js` is tested directly with known input/output pairs.

Test files sit in `src/tests/`:

| File | Coverage |
|------|---------|
| `App.test.jsx` | Root layout, preset selection, theme switching |
| `DevKit.test.jsx` | Dev Kit toggle, calibration controls |
| `Experience.test.jsx` | 3D canvas mount, lighting modes, viewport controls |
| `PresetGallery.test.jsx` | Gallery rendering, preset click |
| `hairStore.test.js` | Store actions and selectors |
| `src/utils/calculator.test.js` | Formula correctness with known inputs |
