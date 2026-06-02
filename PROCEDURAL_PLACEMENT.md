# Procedural Braid Placement System

Based on a review of [Experience.jsx](file:///c:/Users/Osiana/Documents/hair-calculator-app/src/components/Experience.jsx) and its associated components and store configs, the application constructs the scalp partings and procedures for spawning 3D hair through a two-stage pipeline: **Parting Generation** (CPU-side raycasting and masking) and **Procedural Hair Tracing** (Physics & InstancedMesh rendering).

---

### Phase 1: Generating the Partings (Spherical Raycasting & Masking)

This logic is managed by the custom hook `useRaycastHairPlacement` on the CPU:

```text
[Spherical Ray Origins]
          │
          ▼  (Shoot rays inward)
    [Bust Model Mesh]
          │
          ▼  (Sample UV intersection point)
   [scalp_mask.jpeg]
          │
          ├───► Black pixel  ──► Discard (Parting Line)
          └───► Color pixel  ──► Keep & Classify (Top/Sides/Back)
```

1. **Candidate Grid Pool (`useEffect`)**:
   - The engine generates a static pool of candidate ray origins arranged in concentric circles around the head center (`[0, 1.4, 0]`).
   - Alternating rows are staggered by a theta offset to create a natural **brick-lay pattern** typical of neat parting boxes.
   - A ray is cast inward from each origin. If it intersects the head mesh, its UV coordinate is sampled.

2. **Scalp Mask Processing**:
   - The UV coordinate is mapped to a pixel coordinate on a `<canvas>` containing [scalp_mask.jpeg](file:///c:/Users/Osiana/Documents/hair-calculator-app/public/textures/scalp_mask.jpeg).
   - **RGB classification**:
     - **Red Channel (>128)**: Classifies the spawn point as the `top` region.
     - **Green Channel (>128)**: Classifies as `sides`.
     - **Blue Channel (>128)**: Classifies as `back`.
     - **Black pixels (<128)**: Instantly skipped, creating natural **parting gaps** and hairline boundaries.
   - **Y-Floor Guard**: Reject points below `yThreshold` (0.85 for front/sides, 0.58 for back) to keep hair off the neck.

3. **Dynamic Spacing, Parting Width & Symmetry (`useMemo`)**:
   - **Density Scaling**: Braid count is calculated from the store (`DENSITY_COUNTS`) and scaled by thickness. Thicker braids automatically reduce the count to maintain realistic density:
     $$\text{dynamicDensity} = \text{baseDensity} \times \sqrt{\frac{0.07}{\text{thicknessScale}}}$$
   - **Center Part**: If a candidate point lies in the `top` region and its X coordinate is within `centerPartingWidth` (adjustable in Stylist Mode), it is discarded. This creates a clean middle part.
   - **Braid Spacing**: Points are filtered to ensure no two braids spawn closer than `partThickness` (from `DEV_CONFIG`).
   - **Even-Count Symmetry**: For every valid point accepted on the left side, a corresponding mirrored point is generated on the right side ($x_{\text{mirror}} = -x$, $n_{\text{mirror}} = -n_{\text{normal}}$), guaranteeing perfect bilateral symmetry.

---

### Phase 2: Generating the Hair (3D Physics & Instancing)

Once placement points are determined, the `HairStrands` component takes over to construct the 3D meshes:

```text
[Braid Placement Root]
          │
          ├──► (1) Dynamic Start Direction (Lift for top, flat drop for sides)
          │
          ├──► (2) Braid Segment Tracing Loop
          │        ├── Lerp toward Downward Gravity [0, -1, 0]
          │        ├── Collision Push: Head (Sphere) & Torso (Ellipsoid)
          │        ├── Face Center Push (lateral redirection out of face)
          │        └── Length Tension (step size increases near tips)
          │
          └──► (3) InstancedMesh Transform Matrix Application
                   ├── Bottom Progressive Tapering (tips)
                   ├── 50% Braid Flattening on Z-axis
                   └── Squish Connection Overlap (no gaps)
```

1. **Segment Pre-Tracing**:
   - For each root point, the engine does a quick test-run down to `targetFloorY` (Ear, Shoulder, Waist, etc.) to figure out the exact segment count needed. This allows the GPU to allocate memory for the instances.

2. **Braid Direction & Gravity**:
   - The initial segment starts in the direction of the scalp normal, with offset adjustments per region:
     - `top` region: Nudged upward to create crown volume lift.
     - `sides` region: Nudged down/back to lie flat against the head.
     - `back` region: Slanted downward to drape smoothly down the neck.
   - In subsequent segments, the direction vector is incrementally lerped towards a vertical down vector (`[0, -1, 0]`) to simulate gravity.

3. **Collision Avoidance**:
   - **Head Bounding Sphere**: Pushes points radially out of the head volume. Near the face (`z > 0`), the boundary is enlarged to steer braids around the jawline.
   - **Face Center Lateral Push**: If a braid falls close to the face center ($|x| < 0.3$), it is pushed laterally outward to prevent strands from falling directly over the eyes or nose.
   - **Torso Bounding Ellipsoid**: An ellipsoidal collision check pushes hair out on the X and Z axes, simulating how braids drape over and slide off the shoulders.

4. **InstancedMesh Transforms & Shading**:
   - **Length Tension**: Segment lengths scale up by 2% each iteration. This reduces segment counts at the bottom and keeps tips straight while preserving curves at the scalp.
   - **Aesthetics**:
     - **Tapering**: The bottom three segments of each braid scale down to 80%, 52%, and 22% of their thickness to create tapered tips.
     - **Flattening**: The Z-axis is squished by 50% (`zFlatten = 0.5`) to give braids their flat, neat profile.
     - **Knotless connection**: The first segment is squished to 10% Y-scale to start flat against the scalp.
     - **Instancing**: Rendered in a single GPU draw call using `THREE.InstancedMesh` with a custom WebGL shader that applies a Fresnel sheen for realistic hair highlights.
