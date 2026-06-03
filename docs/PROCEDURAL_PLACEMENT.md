# Procedural Braid Placement System

The placement pipeline has two distinct, sequential phases: **Offline Baking** (a one-shot CPU raycasting step run from the Dev Kit) and **Runtime Draping** (a per-frame spline-based physics pass that reads the baked data and builds the 3D geometry). The old approach of computing placement dynamically every time the user changed a slider has been replaced by this bake-once, read-many architecture.

---

## Phase 1: Baking the Parting Points (Offline Raycasting)

This is handled by `src/features/devkit/BakePartings.jsx`. It is only mounted when a stylist triggers a bake via the Dev Kit (`shouldBake = true` in `useDevStore`). It runs once, downloads a JSON file, and unmounts.

```text
[Spherical Ray Grid]
        │
        ▼  (rays shoot inward toward head center)
  [Head Mesh (scalp surface)]
        │
        ▼  (sample UV coordinate at intersection)
  [scalp_mask.jpeg on <canvas>]
        │
        ├──► Black pixel (all channels ≤ 128) ──► Discard (parting gap / hairline)
        └──► Colored pixel ──► Classify region (Top / Sides / Back)
                  │
                  ├──► Y-floor guard ──► Discard if too low (neck/face boundary)
                  ├──► Center part strip ──► Discard top-region if |x| < 0.05
                  ├──► Overlap prevention ──► Discard if within 0.025 of existing point
                  └──► Accept → store point, then mirror across X axis
```

### Ray grid generation

- **Center**: `[0, 1.4, 0]` (approximated scalp center in world space)
- **Radius**: `2.5` (ray origins sit outside the head and fire inward)
- **Row count**: `floor(sqrt(60) * 1.5)` ≈ 11 rows (targeting ~60 points before mirroring)
- **φ (phi)** sweeps from `0.0` (crown) to `1.4` radians (nape), one row per step
- **θ (theta)** sweeps from `-π/2` (back) to `π/2` (front) per row, covering one half of the head (the other half is produced by mirroring)
- Points per half-row: `max(2, floor(sqrt(60) * 1.25 * sin(φ)))` — naturally tapers at the crown and nape where the head is narrower
- No stagger offset is applied; the grid is intentionally aligned (not brick-lay) at the bake stage

### UV sampling and region classification

For each ray that hits the mesh, the UV coordinate of the intersection is mapped to a pixel on a `<canvas>` element containing the scalp mask:

```
pixelX = floor(uv.x * (width - 1))
pixelY = floor(uv.y * (height - 1))
```

**RGB classification** (dominant channel wins):
| Condition | Region |
|-----------|--------|
| All channels ≤ 128 | Discard — parting / hairline |
| R dominant | `top` |
| G dominant | `sides` |
| B dominant | `back` |

> Note: `flipY = false` is set on the texture before sampling so UV-space Y matches the canvas pixel-space Y without inversion.

### Filtering rules

After a hit is classified, three sequential rejection tests run:

1. **Y-floor guard** — rejects points below a per-region threshold:
   - `top` and `sides`: `hit.point.y ≤ 0.85`
   - `back`: `hit.point.y ≤ 0.58` (lower threshold allows hair further down the nape)

2. **Center parting** — for `top` region points only, rejects any point where `|hit.point.x| < 0.05`. This carves a clean straight part down the center of the scalp.

3. **Overlap prevention** — rejects a candidate if it is within `0.025` world-space units of any previously accepted point (O(n²) brute-force pass; acceptable at offline bake time).

### Explicit mirroring

After a point is accepted, a mirror is immediately generated:
```
mirrorPosition = { x: -hit.point.x, y: hit.point.y, z: hit.point.z }
mirrorNormal   = { x: -normal.x,    y: normal.y,    z: normal.z    }
```
The mirror is subject to the same overlap check. For top-region mirrors, the center parting rule is also re-applied (`|mirrorPosition.x| < 0.05` → discard).

This guarantees **perfect bilateral symmetry** — every braid on the left side has a corresponding braid on the right, placed at the exact mirror position on the scalp surface.

### Output format

The result is serialized to a compact JSON array and downloaded as `box_braids.json`:

```json
[
  { "p": [x, y, z], "n": [nx, ny, nz], "r": "t" },
  { "p": [x, y, z], "n": [nx, ny, nz], "r": "s" },
  { "p": [x, y, z], "n": [nx, ny, nz], "r": "b" }
]
```

| Field | Meaning |
|-------|---------|
| `p` | World-space position on the scalp surface (4 decimal places) |
| `n` | Outward face normal at the hit point (4 decimal places) |
| `r` | Region: `"t"` = top, `"s"` = sides, `"b"` = back |

The file is dropped into `src/data/partings/` and imported at module load by `BoxBraidsRenderer`. A rebuild is required for the new data to take effect.

---

## Phase 2: Runtime Draping (CatmullRom Spline + Merged Geometry)

This is handled by `src/features/3d/styles/BoxBraidsRenderer.jsx`. It runs inside a `useMemo` that re-fires when `DEV_CONFIG` changes. The baked JSON is imported statically at the top of the file — no network requests at runtime.

```text
[Baked Point: { position, normal, region }]
        │
        ├──► Resolve initial drape direction (per-region rules)
        │
        ├──► Physics loop (20 iterations, step = 0.1)
        │        ├── Lerp direction toward gravity [0, -1, 0] by j * 0.05 each step
        │        ├── Head sphere collision → radial push-out (+ lateral push near face)
        │        ├── Torso sphere collision → radial push-out
        │        └── Break when currentPos.y ≤ targetFloorY (0.0 = shoulder)
        │
        ├──► CatmullRomCurve3 through collected positions
        │
        ├──► TubeGeometry (radius 0.015, 20 curve segments, 5 radial segments)
        │
        └──► mergeGeometries → single merged mesh → one draw call
```

### Initial drape direction

To avoid the "spider legs" effect (segments shooting straight outward from the scalp), the renderer does not use the surface normal as the initial direction. Instead it resolves a **drape vector** per region:

| Region | Condition | Drape vector |
|--------|-----------|--------------|
| `top` | `root.z > 0` (forehead side) | `(±0.8, -0.5, 0.2).normalize()` — sweeps laterally away from center |
| `top` | `root.z ≤ 0` (crown / back top) | `(0, -0.5, -0.8).normalize()` — sweeps backward and down |
| `sides` | — | `(±0.2, -0.8, -0.2).normalize()` — slightly back and down |
| `back` | — | `(0, -1, -0.1).normalize()` — straight drop with slight backward lean |

The sign of the X component for `top` and `sides` is determined by `root.x >= 0`.

### Physics loop

Each braid runs a loop of up to **20 iterations** with a fixed step size of **0.1** world units per iteration:

```
for j = 1 to 20:
    currentDir = lerp(currentDir, [0,-1,0], j * 0.05).normalize()
    currentPos += currentDir * 0.1

    // Head collision
    if dist(currentPos, headCenter) < headRadius AND currentPos.y > -0.3:
        pushOutVec = normalize(currentPos - headCenter)
        if currentPos.z > 0:               // front of face
            pushOutVec.x += ±0.5           // extra lateral push
            pushOutVec = normalize(pushOutVec)
        currentPos = headCenter + pushOutVec * headRadius * 1.05

    // Torso collision (spherical, not ellipsoidal)
    if dist(currentPos, torsoCenter) < torsoRadius:
        pushOutVec = normalize(currentPos - torsoCenter)
        currentPos = torsoCenter + pushOutVec * torsoRadius * 1.05

    curvePoints.push(currentPos)
    if currentPos.y <= 0.0: break          // shoulder floor
```

Collision radii and center positions are read from `DEV_CONFIG` in `useDevStore`, so they can be tuned live in the Dev Kit without restarting the app. The geometry re-builds on the next render after any `DEV_CONFIG` change.

> The torso collision is a **sphere**, not the ellipsoid described in earlier documentation. The `torsoStretchX` / `torsoStretchZ` parameters in `DEV_CONFIG` exist and are available for future use but are not applied in the current `BoxBraidsRenderer` physics loop.

### Spline and tube construction

After the loop, the collected positions are passed to a `CatmullRomCurve3` to produce a smooth interpolated path. A `TubeGeometry` is extruded along the curve:

| Parameter | Value |
|-----------|-------|
| Tube segments | 20 |
| Tube radius | 0.015 |
| Radial segments | 5 |
| Closed | false |

All per-braid tubes are merged into a single `BufferGeometry` using `mergeGeometries` from `three/examples/jsm/utils/BufferGeometryUtils`. This produces **one draw call** for the entire head of hair regardless of braid count.

### Material and visibility

The merged mesh uses a single `MeshStandardMaterial`:
- **Color**: `#2c1810` (deep dark brown, hardcoded at baseline)
- **Roughness**: `0.7`
- **Metalness**: `0.1`

The mesh is hidden entirely when `showBraids = false` in `useHairStore` (controlled by the viewport toggle). When hidden, the component returns `null` early so no geometry is uploaded to the GPU.

---

## What changed from the previous system

| | Old system | Current system |
|--|------------|----------------|
| **Placement timing** | Computed at runtime on every style/density change (`useEffect` in `Experience.jsx`) | Baked offline once; loaded as a static JSON import |
| **Placement hook** | `usePartingPattern` (custom hook with `useMemo` for dynamic count scaling) | Removed; `BakePartings` is only mounted on demand |
| **Density scaling** | Dynamic: strand count scaled per `DENSITY_COUNTS[densityPos] * sqrt(0.07 / thicknessCoeff)` | Static: count is whatever the baked JSON contains (~60 for the current medium-density bake) |
| **Rendering** | `THREE.InstancedMesh` with GLB segment models and per-instance matrix transforms | `CatmullRomCurve3` + `TubeGeometry` merged into a single `BufferGeometry` |
| **Segment models** | GLB files per style (segment + end cap) | No GLB segments used; geometry is purely procedural |
| **Shader** | Custom WebGL Fresnel sheen shader | Standard `MeshStandardMaterial` |
| **Style lock** | Fully dynamic (all four styles switchable) | Locked to Box Braids baseline (viewport ignores slider; other style renderers are stubs) |
