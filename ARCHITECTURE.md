# Architecture

Cinna's PAH is a client-side React application with no backend. All computation runs in the browser. The three concerns (state, calculation, and 3D rendering) are kept deliberately separate.

## System overview

```
Browser
├── React (UI shell, sliders, menus)
│   └── Zustand (shared state — two stores)
├── React Three Fiber / Three.js (3D scene)
│   ├── Raycasting engine (hair placement)
│   ├── Physics loop (braid draping)
│   └── InstancedMesh renderer
└── calculator.js (pack estimation formula)
```

Data flows in one direction. The user moves a slider → Zustand updates → R3F reads new values → scene re-renders. The formula runs independently from the same store values.

---

## State management

Two Zustand stores in `src/store/hairStore.js`. They are intentionally separate so that calibration state (Stylist Mode) never pollutes the user's saved presets.

### useHairStore

Persisted to `localStorage` under the key `hair-storage`. Only dynamic user selections are persisted, the static lookup maps are defined outside the store and referenced by the store to avoid storing large constant objects in localStorage on every write.

| Key | Type | Description |
|-----|------|-------------|
| `stylePos` | `1–4` | Index into STYLE_MAP |
| `thicknessPos` | `1–6` | Index into THICKNESS_MAP |
| `lengthPos` | `1–6` | Index into LENGTH_MAP |
| `densityPos` | `1–5` | Index into DENSITY_MAP |
| `theme` | `'light' \| 'dark' \| 'system'` | UI theme |
| `customPresets` | `Preset[]` | User-created presets |

Static maps (`STYLE_MAP`, `THICKNESS_MAP`, etc.) are exported from `CONFIG_MAPS` and exposed on the store for selector compatibility. Each entry is a tuple: `[label, coefficient]`.

### useDevStore

Persisted to `localStorage` under the key `hair-dev-storage`. Controls the Stylist Mode panel and holds all runtime calibration state.

| Key | Type | Description |
|-----|------|-------------|
| `isEnabled` | `boolean` | Stylist Mode on/off |
| `debugRaycast` | `boolean` | Show collision wireframes in 3D |
| `assets` | `Record<slot, url>` | Hot-swap slots for model overrides |
| `DEV_CONFIG` | `object` | Collision geometry and calibration values |

The `DEV_CONFIG` object is the source of truth for the 3D physics engine's geometry. When a stylist adjusts a slider in the panel, `updateDevConfig(key, val)` writes directly to this object and the scene re-renders on the next frame.

---

## Pack estimation formula

`src/utils/calculator.js` contains the single exported function:

```js
calculateHairPacks(style, thickness, density, length, factor = 0.95)
// returns: (style + thickness + density) * length * factor
```

The coefficient values come from the store maps. Plugging in defaults (Medium thickness, Shoulder length, Full density, Box Braids):

```
(1.0 + 0.07 + 1.2) * 1.2 * 0.95 ≈ 2.59 packs
```

The `factor` parameter defaults to `0.95` but is exposed to Stylist Mode via `DEV_CONFIG.calibrationFactor`. Changing it does not affect the 3D rendering, only the number displayed on screen.

---

## 3D rendering pipeline

The scene lives inside `src/components/Experience.jsx`. It runs inside a React Three Fiber `<Canvas>` and communicates with the rest of the app exclusively through the Zustand stores.

### Step 1 — Hair placement (raycasting)

`useRaycastHairPlacement` is a custom hook that runs on the CPU side (inside a `useEffect`). It does not run every frame.

It fires when: style, density, thickness, or the bust model changes.

The algorithm:

1. Generates candidate ray origins arranged in concentric spherical rows around the head center (`center = [0, 1.4, 0]`, `radius = 2.5`).
2. Each row sits at a vertical angle `phi` between 0 (crown) and ~1.5 radians (nape). Points within each row are evenly distributed by `theta`.
3. Symmetry enforcement: rows with more than one point are forced to even counts so every left-side braid has a mirror on the right.
4. Alternating rows are offset by half a step (`thetaOffset`) to produce the brick-lay parting pattern standard in box braids.
5. For each candidate point, a ray fires inward toward the head center and intersects the scalp mesh.
6. If there is a hit, the UV coordinates are sampled against the `scalp_mask.jpeg` texture loaded into a `<canvas>` element. The mask uses RGB channels to identify different scalp regions:
   - **Red**: Top of the head
   - **Green**: Sides of the head
   - **Blue**: Back of the head
   If any color channel is active (> 128), hair is eligible to spawn. The dominant color channel classifies the braid into a region ('top', 'sides', or 'back'), which the rendering loop utilizes to adjust startup draping angles (crown volume on top, flat face framing on the sides, and a straight drop down the neck in the back).
7. A Y-position floor (`hit.point.y > 0.8`) prevents hair from spawning on the neck or shoulders.

Point count is not fixed. It scales with density (from `DENSITY_COUNTS`) and is then adjusted for thickness: micro braids with a small coefficient boost the count; jumbo braids reduce it. The formula uses `sqrt(thicknessRatio)` to soften the exponential growth curve.

```
targetCount = DENSITY_COUNTS[densityPos]
targetCount = floor(targetCount * sqrt(0.07 / max(0.01, thicknessCoeff)))
```

Output is an array of `{ position, normal, uv }` objects.

### Step 2 — Physics and rendering (InstancedMesh)

`HairStrands` reads the placement points and builds the full 3D hair inside a `useEffect`. It uses `THREE.InstancedMesh`,a single draw call for all braid segments, to keep frame rate stable regardless of strand count.

For each placement point, the engine runs a per-strand loop (up to 60 iterations) that advances a cursor segment-by-segment down from the scalp:

1. **Gravity bias** — direction lerps toward `[0, -1, 0]` by an increasing factor each iteration, so hair hangs more vertically as it grows longer.
2. **Segment squish** — the 3D model is compressed along its Y-axis to fit the step distance exactly, with a 25% overlap to close the gap between pieces.
3. **Floor check** — each iteration checks if the current Y position has reached the target floor for the selected length. When it does, the strand stops.
4. **Head collision** — if the cursor enters the head sphere (center: `headCenterY`, radius: `headRadius`), it is pushed out radially. Direction is also nudged outward to redirect future segments away.
5. **Torso collision** — same principle applied to the torso/shoulder sphere. The `torsoPushOut` factor controls how aggressively the hair slides off the shoulders.
6. **Length tension** — step size grows by a factor of 1.15 each iteration. Segments near the root are short and curved; segments near the tips are long and straight. This reduces total instance count at the bottom while preserving visual accuracy at the scalp.

After the loop, an end cap segment is placed at the final cursor position.

All collision sphere parameters (`headCenterY`, `headRadius`, `torsoCenterY`, `torsoRadius`, `torsoPushOut`) are read from `DEV_CONFIG` and can be tuned live in Stylist Mode.

### Model format

Each braid style maps to two GLB files: a repeating segment and an end cap.

| Style | Segment | End cap |
|-------|---------|---------|
| Box Braids | `hair_box_mid.glb` | `boxbraidend.glb` |
| Knotless | `flatbraid.glb` | `flatbraidend.glb` |
| Twists | `twist.glb` | `twistend.glb` |
| Locs | `twist.glb` | `twistend.glb` |

Models are loaded with Draco compression via the Google CDN decoder. In Stylist Mode, the model paths can be overridden at runtime using blob URLs from local file uploads.

### Post-processing

The scene uses `@react-three/postprocessing` with:
- **Bloom** (luminance threshold 1.0, mipmap blur) — adds a subtle glow to highlights
- **Noise** (opacity 0.02) — film grain for depth
- **Vignette** — darkens edges
- **ACES Filmic tone mapping** — consistent exposure across light and dark themes

On mobile (`/iPhone|iPad|iPod|Android/i`), Bloom and Noise are disabled. The `dpr` cap drops from `[1, 2]` to `[1, 1.5]` and `antialias` is disabled.

---

## Component responsibilities

| Component | Responsibility |
|-----------|---------------|
| `App.jsx` | Root layout, BurgerMenu, ThemeSwitcher, ControlCard compound components |
| `Experience.jsx` | R3F canvas, raycasting hook, physics loop, InstancedMesh |
| `HeadModel.jsx` | GLTF loader, skin material, scalp mask texture |
| `StylistPanel.jsx` | Stylist Mode UI — calibration sliders, asset upload, preset creator |
| `PresetGallery.jsx` | Horizontal gallery, preset card display and selection |
| `ThreeDCanvas.jsx` | Canvas configuration, lighting setup, postprocessing |
| `HairModels.jsx` | GLTF model loader helpers and preloading |

---

## Asset pipeline

All runtime assets live in `public/` and are served statically:

```
public/
├── models/         # .glb braid segments and bust
├── textures/       # scalp_mask.jpeg
└── presets/        # preset preview images (.jpg)
```

The scalp mask is a colored JPEG painted in Blender UV space:
- Red regions (R > 128) → Top of head spawning
- Green regions (G > 128) → Sides of head spawning
- Blue regions (B > 128) → Back of head spawning
- Black regions → natural partings, nape, face boundary

In Stylist Mode, any of these assets can be replaced at runtime via the file upload slots in `StylistPanel`. Uploaded files are converted to blob URLs and stored in `useDevStore.assets`. The scene reloads the model or texture without a full page refresh.

---

## Testing

Tests use Vitest and React Testing Library. Three.js and R3F are mocked in `vite.config.js` to avoid WebGL context errors in the test environment. The formula in `calculator.js` is tested directly with known input/output pairs.

Test files sit alongside the source files they cover (`*.test.jsx`, `*.test.js`).
