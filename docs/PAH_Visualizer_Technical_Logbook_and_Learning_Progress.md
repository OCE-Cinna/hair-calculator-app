# PAH Visualizer: Technical Logbook & Learning Progress

**Author:** Osiana "Cinna" Romy  
**Project:** Protective Afro-Hairstyle Visualizer  

---

## Document 1: Infrastructure & Geometric Foundation
**Status:** Sprint 3 Done  
**Learning Question:** How can I transition from a proof of concept into a performant interactive web application?

### Scope of Assignment
The objective of this phase was the migration of the Semester 2 Proof of Concept (PoC) into a professional-grade development environment. This involved migrating the source code from Fontys GitLab to GitHub to facilitate an open-source workflow and refactoring the architecture to utilize React 19. A primary geometric requirement was replacing the primitive "egg" placeholder with a high-fidelity, anatomically accurate 3D bust sculpted in Blender.

### Context
**User Story:**
- **As a user**, I want a high-fidelity 3D representation of a human scalp so that I can visualize braid placement with anatomical accuracy.
- **As a designer**, I want a unified, glassmorphic UI so that the interface does not distract from the 3D visualization.
- **As a developer**, I want a modular, componentized architecture so that I can update hairstyle logic without affecting the core rendering engine.

**Why this matters:**
The application serves as a bridge between specialized cultural knowledge and modern technology. To be effective, the tool must maintain high visual fidelity while remaining accessible on low-end hardware. This necessitates a balance between geometric complexity and rendering performance.

### Methodology
This is a roadmap of how I’m learning and moving forward with the project:

| Phase | Source / Activity | Detailed Notes & Examples |
|---|---|---|
| **Ideation** | Project Proposal | Defined functional requirements and established the initial Figma prototype. |
| **User Research** | Google Forms | Quantitative and qualitative analysis of user needs in the braiding community. |
| **PoC (Sem 2)** | Vanilla JS / Three.js | Initial feasibility study. Identified performance limitations of non-reactive state management. |
| **Implementation (Sem 3)** | React 19 / R3F / Zustand | Migration to a "Source of Truth" architecture. Deployment via Vercel for continuous integration. |

**Learning Objectives:**
- Mastery of 3D mesh topology and decimation in Blender for WebGL compatibility.
- Understanding the lifecycle of a React 19 component within a Three.js canvas.
- Implementation of asynchronous asset streaming using Draco compression.

### Risk & Mitigation
| Risk | Impact | Mitigation Strategy |
|---|---|---|
| High-poly models causing frame drops on mobile. | High | Applied "Decimate" modifiers in Blender and utilized Draco compression to reduce GLB footprint. |
| State desynchronization between UI and 3D Canvas. | Medium | Implemented Zustand for centralized state management, ensuring a "Single Source of Truth." |
| Latency in asset loading (NFR-4 breach). | High | Integrated `useGLTF` for pre-loading and caching assets via the Drei library. |

### Dev Log
**Infrastructure Selection: Vite over Next.js**
The decision to utilize Vite instead of Next.js was driven by the project's requirement for a lightweight Single Page Application (SPA). Since the PAH Visualizer is client-bound—relying on the user's GPU for real-time raycasting—the Server-Side Rendering (SSR) capabilities of Next.js were deemed unnecessary overhead. Vite provides superior Hot Module Replacement (HMR) speeds, which significantly accelerated the 3D development loop.

**Asset Pipeline: Blender to R3F**
The transition from primitive geometry to a custom bust required a "Build-to-Learn" approach in Blender.
- **Challenges:** Blender’s non-standard UI and workspace navigation.
- **Optimization:** When `custombust.glb` exceeded the 5-second loading target, Draco compression was applied. This reduced geometric complexity while preserving visual fidelity for accurate hair placement.

**Git Strategy and Technical Debt**
Initially, development was marked by "survival mode" versioning—direct commits to the main branch with non-descriptive messages. I have since transitioned to Semantic Commits and Feature Branching to ensure project maintainability and professional transparency.

### Build Tooling & Licensing Strategy
**Vite Configuration**
Vite was configured with the `@vitejs/plugin-react` plugin and a dedicated `jsdom` test environment for unit testing. The PostCSS pipeline integrates Tailwind CSS v4's new `@tailwindcss/vite` plugin, which processes the `@theme` block in `index.css` to expose custom CSS variables as Tailwind utility classes. This approach removes the need for a `tailwind.config.js` file, keeping the configuration co-located with the styles.

**Open Source Licensing**
The project is licensed under `AGPL-3.0-only`. This was a deliberate architectural decision: the AGPL (Affero General Public License) is the strongest copyleft license available. Any business that modifies and deploys this tool as a web service must also release their modifications as open source. This protects the cultural and intellectual work in this tool from being quietly commercialized without giving back to the community.

### Technical Stack & Resources
| Category | Item Name | Role in Architecture |
|---|---|---|
| **Environment** | Vite + @vitejs/plugin-react | Build tool and development server for high-speed iteration. |
| **Framework** | React 19 | Component-based UI library managing the application state. |
| **3D Engine** | R3F / Drei | React-based abstraction of Three.js for declarative 3D scenes. |
| **State** | Zustand | Global store for synchronizing user inputs with 3D parameters. |
| **Styling** | Tailwind CSS v4 + OKLCH | Utility-first CSS framework using the `@theme` block and CSS custom properties. |
| **Animation** | Framer Motion | Physics-based spring animations for UI interactions. |
| **Component** | Experience.jsx | Initial setup of the R3F Canvas and scene wrapper. |
| **Component** | HeadModel.jsx | Component responsible for loading and displaying the bust mesh. |
| **Asset** | custombust.glb | The 3D head model acting as the canvas for hair placement. |
| **License** | AGPL-3.0-only | Copyleft license protecting the tool from silent commercialization. |

---

## Document 2: Interactivity & State Logic
**Status:** Sprint 3 Done  
**Learning Question:** How can procedural generation techniques reduce manual placement complexity in 3D hairstyle visualization? (Sub-question 2)

### Scope of Assignment
This phase focused on connecting the UI to the 3D engine. This addressed FR-2 and FR-3 by allowing users to adjust thickness and density while the application recalculates the pack estimate in real-time.

### Methodology
I prototyped different Raycasting intervals to find the optimal balance between visual density and browser performance.

### Dev Log
**Phase: State Logic & Asset Preparation**
- **State Architecture:** I implemented the "Single Source of Truth" using Zustand to ensure UI and 3D states remained in sync.
- **Parting Precision (Spherical Raycasting & Masking):** 
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
  1. **Candidate Grid Pool (`useEffect`)**: The engine generates a static pool of candidate ray origins arranged in concentric circles around the head center (`[0, 1.4, 0]`). Alternating rows are staggered by a theta offset to create a natural **brick-lay pattern** typical of neat parting boxes. A ray is cast inward from each origin. If it intersects the head mesh, its UV coordinate is sampled.
  2. **Scalp Mask Processing**: The UV coordinate is mapped to a pixel coordinate on a `<canvas>` containing `scalp_mask.jpeg`.
     - **RGB classification**: **Red Channel (>128)** classifies the spawn point as the `top` region. **Green Channel (>128)** classifies as `sides`. **Blue Channel (>128)** classifies as `back`.
     - **Black pixels (<128)** are instantly skipped, creating natural **parting gaps** and hairline boundaries.
     - **Y-Floor Guard**: Reject points below `yThreshold` (0.85 for front/sides, 0.58 for back) to keep hair off the neck.
  3. **Dynamic Spacing, Parting Width & Symmetry (`useMemo`)**:
     - **Density Scaling**: Braid count is calculated from the store and scaled by thickness: `dynamicDensity = baseDensity * sqrt(0.07 / thicknessScale)`.
     - **Center Part**: If a candidate point lies in the `top` region and its X coordinate is within `centerPartingWidth`, it is discarded, creating a clean middle part.
     - **Braid Spacing**: Points are filtered to ensure no two braids spawn closer than `partThickness`.
     - **Even-Count Symmetry**: For every valid point accepted on the left side, a corresponding mirrored point is generated on the right side, guaranteeing perfect bilateral symmetry.

**Phase: Version Control & Debugging**
- **Branching Strategy:** I realized that committing broken raycasting logic to the main branch was preventing me from testing the stable UI. I began using feature branches to isolate complex math from the primary deployment path.

### Constants & Architecture Modularity
**From Magic Numbers to Structured Constants**
A key milestone in code quality was the elimination of hardcoded values from inside components. All data that defines what the UI *means* was moved to dedicated files:
- **`src/constants/presets.js`**: Defines the `INITIAL_PRESETS` array (the 6 built-in looks: Hip Locs, Knotless, Box Braids, Jumbo Twists, Bob Twists, Long Twists) along with alias maps that allow parsing slider state directly from a preset's filename:
  ```javascript
  export const STYLE_ALIASES = { lock: 4, locs: 4, twist: 3, boxbraid: 1, knotless: 2, ... };
  export const parsePresetFilename = (filename) => { /* maps underscore-separated parts to slider positions */ };
  ```
- **`src/utils/calculator.js`**: Isolates the pack estimation formula, making it independently testable and exposing the `factor` parameter for live calibration.
- **`DEV_CONFIG` (in `useDevStore`)**: Centralizes all physics tuning constants (head radius, torso ellipsoid scale, parting width) into a single object that the StylistPanel can mutate live via sliders, without affecting the clean user store.

**Why this matters:** Separating constants from rendering logic enables the application to scale. A new hairstyle style can be added by updating an alias map, without touching any 3D code.

### Glassmorphism UI & Design System
**Design Language: OKLCH Color Space**
The entire UI uses the `OKLCH` color space rather than `HEX` or `HSL`. This is a perceptually uniform color space — meaning adjustments to lightness feel visually consistent across the color wheel. The brand orange (`oklch(73.682% 0.16644 40.061)`) is defined once and remains visually consistent in both light and dark mode.

**Dual-Theme Architecture (`index.css`)**
The theme system works by defining two sets of CSS custom properties — one on `:root` (light mode) and one on `.dark` (dark mode). When the user toggles the theme, `App.jsx` adds or removes the `.dark` class on `document.documentElement`. Tailwind's `@theme` block then re-maps these CSS variables as utility classes, so a class like `bg-glass-panel` automatically picks up the correct opacity for the active theme:
```css
/* Light mode: 60% opacity white frosted glass */
--color-glass-panel: oklch(100% 0 0 / 60%);

/* Dark mode: 5% opacity white — near-transparent for depth */
.dark { --color-glass-panel: oklch(100% 0 0 / 5%); }
```

**Performance-Aware Glassmorphism**
The `backdrop-filter: blur()` value that creates the frosted glass effect is expensive on mobile GPUs. A responsive utility class (`glass-responsive`) reduces the blur from 40px on desktop to 12px on mobile, maintaining the aesthetic while staying within the NFR-2 (≥30 FPS) target:
```css
.glass-responsive { backdrop-filter: blur(40px); }
@media (max-width: 768px) { .glass-responsive { backdrop-filter: blur(12px); } }
```

**Framer Motion Animations**
The UI uses Framer Motion for all interactive transitions: the `PresetPanel` slides in/out with a spring physics animation, calculator result badges scale up with a pop-in spring, and panel entries stagger their mount animations. These are configured with `initial`, `animate`, and `exit` props rather than manual CSS keyframes, making the animations data-driven and easily adjustable.

### Component Architecture & State Logic Details

**1. `App.jsx` (UI Shell & Layout Manager)**
This is the central React entry point that governs the page layout, menus, theme-awareness, customization inputs, and the pack calculation dashboard. It is structured into several nested sub-components:
- **App (Root)**: Injects the StylistPanel overlay and the main responsive grid layout. Monitors the theme configuration and adds/removes the `.dark` class on the global `document.documentElement` to transition HSL/OKLCH color tokens smoothly. Generates the unified list of presets by combining static default configurations (`INITIAL_PRESETS`) and any user-saved designs (`customPresets`).
- **LeftSidebar & PresetPanel**: Provides standard collapsible navigation panels. PresetPanel uses framer-motion to slide out the hairstyle preset cards. When clicked, it parses parameters from the preset name and dispatches actions to update the Zustand store, immediately re-spawning the 3D viewport configuration.
- **ControlCard (Sliders)**: Uses a Compound Component Pattern (`ControlCard.Section`, `ControlCard.Slider`, `ControlCard.StyleSelector`) for clean markup. Wraps `<input type="range">` elements with haptic vibration feedback (`navigator.vibrate`) and connects them directly to Zustand actions.
- **AppContent**: Subscribes to selected slider indices (style, thickness, density, length). Translates slider positions to visual mapping coefficients (e.g. converting a thickness slider value of 6 to coefficient 0.18 for Jumbo). Runs `calculateHairPacks` with these coefficients and displays both the exact floating-point count and the rounded integer badge with pop-in spring animations.

**2. `HeadModel.jsx` (Theme-Aware Bust Loader)**
Responsible for rendering the 3D model that hosts the procedural hair:
- **Asset Loading**: Uses `@react-three/drei`'s `useGLTF` helper to fetch the 3D head model (`custombust.glb`), passing Google's CDN decoder path to unpack Draco-compressed geometry efficiently in the browser thread.
- **Dynamic Material Updating**: Runs a `useEffect` that listens to theme/debug configuration changes. Traverses the GLTF scene graph hierarchy looking for mesh children. If Debug Raycast Mode is enabled, it swaps the model's material map to show the `scalp_mask.jpeg` directly on the skull, helping stylists align coordinates. Otherwise, it strips the map and dynamically injects the skin tone hex code retrieved from the CSS custom property `--color-skin-fallback`, adjusting roughness to 0.6 to give it a soft, non-reflective matte finish.

**3. `StylistPanel.jsx` (Calibration Panel & Dev Kit)**
An overlay panel toggled from the main sidebar, providing professional-grade calibration tools:
- **Engine Calibration**: Provides fine-grained sliders to dynamically tweak the mathematical constants that define the physics loops in `Experience.jsx`. Tweakable properties include head centers, head radii, ellipsoidal shoulder scale factors, and parting dimensions.
- **Asset Overrides (Hot-swapping)**: Permits drag-and-dropping local files to override default static assets. Models (`custombust`, braid segments) are loaded as raw local object URLs via `URL.createObjectURL()`. Images (scalp masks and preset preview graphics) are converted to high-quality `.jpeg` data URLs using an in-memory canvas (`convertToJpeg`) without any resizing, enabling immediate visual feedback.
- **Preset Creator**: Allows creating custom looks. A stylist assigns a name, uploads a preview image, and saves it. The current slider configurations and overrides are saved to the Zustand store as a new preset.

**4. Zustand State Managers (`src/store/hairStore.js`)**
Decouples UI inputs from R3F frame iterations using two separate state stores:
- **`useHairStore`**: Manages user configurations (slider index positions, active theme, and `customPresets`). Configured with Zustand persist middleware, storing these selections in `localStorage` under `hair-storage`. Utilizes the `_hasHydrated` state flag to prevent server-side compilation mismatch errors (ensuring the client has loaded cached state before rendering UI elements).
- **`useDevStore`**: Persists Stylist Mode state (enabled flags, debug options, model override asset keys, and the `DEV_CONFIG` calibration object) inside `hair-dev-storage`. Keeping this store independent prevents heavy calibration values and local overrides from polluting clean user presets.

**5. `calculator.js` (Pack Estimation Formula)**
A isolated mathematical calculation module:
- Exports the primary mathematical function:
  ```javascript
  export const calculateHairPacks = (style, thickness, density, length, factor = 0.95) => {
      return (style + thickness + density) * length * factor;
  };
  ```
- By separating this function from React state, it remains fully testable.
- The `factor` parameter is exposed directly to the `calibrationFactor` slider in the Stylist Panel, allowing users to tune the pack results on the fly depending on the hair brand.

---

## Document 3: Procedural Core & Physics
**Status:** Sprint 4 - On Going  
**Learning Question:** What rendering strategies provide the best balance between visual density and real-time performance in browser-based procedural hair systems? (Sub-question 4)

### Scope of Assignment
I moved from basic Raycasting to an optimized production engine. This phase focused on NFR-2 (≥30 FPS) and NFR-3 (Mobile Responsiveness) by refining the procedural physics loop.

### Methodology
I performed a comparative analysis of rendering strategies and transitioned to the `InstancedMesh` system to handle over 30,000 segments without crashing the mobile GPU.

### Detailed Dev Log
- **Procedural Physics (3D Physics & Instancing):** 
  Once placement points are determined, the `HairStrands` component takes over to construct the 3D meshes using an advanced physics loop.
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
  1. **Segment Pre-Tracing**: For each root point, the engine does a quick test-run down to `targetFloorY` (Ear, Shoulder, Waist, etc.) to figure out the exact segment count needed. This allows the GPU to allocate memory for the instances.
  2. **Braid Direction & Gravity**: The initial segment starts in the direction of the scalp normal, with offset adjustments per region (upward for crown volume lift, flat/down for sides, slanted downward for back). In subsequent segments, the direction vector is incrementally lerped towards a vertical down vector (`[0, -1, 0]`) to simulate gravity.
  3. **Collision Avoidance**: 
     - **Head Bounding Sphere**: Pushes points radially out of the head volume. Near the face (`z > 0`), the boundary is enlarged to steer braids around the jawline.
     - **Face Center Lateral Push**: If a braid falls close to the face center (`|x| < 0.3`), it is pushed laterally outward to prevent strands from falling directly over the eyes or nose.
     - **Torso Bounding Ellipsoid**: An ellipsoidal collision check pushes hair out on the X and Z axes, simulating how braids drape over and slide off the shoulders.
  4. **InstancedMesh Transforms & Shading**:
     - **Length Tension**: Segment lengths scale up by 2% each iteration to reduce segment counts at the bottom and keep tips straight.
     - **Aesthetics**: The bottom three segments of each braid taper down to 80%, 52%, and 22%. The Z-axis is squished by 50% for a flat, neat profile. The first segment is squished to 10% Y-scale for a knotless connection against the scalp.
     - **Instancing**: Rendered in a single GPU draw call using `THREE.InstancedMesh` with a custom WebGL shader that applies a Fresnel sheen for realistic hair highlights.
- **Release Cycle:** By this final sprint, I moved to a deployment-only main branch strategy. The main branch is now stable and synced with Vercel, while all debugging and optimization happens in dedicated fix or feature branches.
- **Asset Fidelity Improvements:** Replaced downscaled UV masks with original-resolution `.jpeg` equivalents (Quality 0.95), optimizing raycasting accuracy and ensuring pixel-perfect parting gaps via UV intersection.

### Post-Processing & Visual Fidelity
**Going Beyond Basic Rendering**
The application uses `@react-three/postprocessing` to apply cinematic screen-space effects as a final render pass over the 3D scene. These effects are applied as a compositing layer after the main render, so they do not add geometry complexity:
- **Bloom**: A threshold-based glow effect applied to bright areas of the mesh (particularly the Fresnel sheen on hair strands), giving it an organic, backlit quality under studio lighting.
- **Anti-Aliasing (SMAA)**: Subpixel Morphological Anti-Aliasing smooths jagged edges on diagonal geometry — critical for preventing braid edges from appearing pixelated on high-DPI screens.
- **Ambient Occlusion**: Simulates subtle shadowing in the concave areas where braids meet the scalp, significantly increasing the visual realism of the hair-to-scalp transition without expensive per-frame ray tracing.

### Automated Testing & Validation Pipeline
**From Manual Clicking to Automated Verification**
One of the most significant professional milestones was implementing a unit testing suite with Vitest and `@testing-library/react`. This discipline ensures that major refactors (like switching from PNG to JPEG assets, or updating the pack formula) do not silently break the UI.

**`calculator.test.js` — Formula Verification**
The pack estimation formula is tested in isolation. Because `calculateHairPacks` has no React dependencies, it can be validated with pure inputs and expected outputs:
```javascript
// Verifies the formula: (style + thickness + density) * length * 0.95
expect(calculateHairPacks(1, 1, 1, 1)).toBeCloseTo(2.85); // (1+1+1)*1*0.95
expect(calculateHairPacks(1, 1, 1, 2)).toBeCloseTo(base * 2); // linear scaling
expect(calculateHairPacks(0, 0, 0, 0)).toBe(0);             // graceful zero
```

**`App.test.jsx` — Integration Testing**
The UI integration test suite mocks the heavy dependencies (the 3D `Experience`, `StylistPanel`, Zustand stores) using Vitest's `vi.mock()` factory to isolate the React component logic from the WebGL engine. This pattern verifies:
- The main layout renders with the correct branding and sub-components.
- Slider interactions correctly dispatch the expected Zustand action (`setThicknessPos(6)`).
- Style selector buttons correctly update the active style index.
- The calculator badge displays the correctly rounded integer result.

**Key Learning:** 3D components cannot be unit-tested in JSDOM because Three.js requires a real WebGL context. The solution was to mock the entire `Experience` component to a plain `<div data-testid="mock-experience" />`, allowing the surrounding React logic to be tested in full isolation.

### Technical Components
| Category | Item Name | Description & Role |
|---|---|---|
| **Component** | HairStrands | Renders the instanced 3D hair segments along calculated paths. |
| **Function** | useRaycastHairPlacement | Custom hook containing the spherical raycasting and masking logic. |
| **Function** | InstancedMesh.setMatrixAt | Three.js method used to efficiently render thousands of segments. |
| **Asset** | boxbraid.glb | High-fidelity tileable braid segment model used for instances. |
| **Library** | @react-three/postprocessing | Post-processing pipeline for Bloom, SMAA, and Ambient Occlusion. |
| **Test Runner** | Vitest + @testing-library/react | Unit and integration testing suite isolating formula and UI logic from WebGL. |

---

## Document 4: Reflection & Future Roadmap
**Status:** Sprint 5 - Planned  
**Learning Question:** How has the integration of Agentic AI and iterative prototyping redefined my technical growth and future vision for 3D web applications?

### Scope of Assignment
This document is a clinical reflection on my transition from a non-technical starting point in September to the delivery of a procedural 3D engine. It evaluates how AI-assisted development impacted my "Build-to-Learn" philosophy.

### Detailed Dev Log (Personal & Technical Growth)
- **Growth Trajectory:** I started with zero knowledge of React hooks or the Three.js rendering lifecycle. Over the course of the semester, I moved from struggling and hitting walls to a mindset of rapid iteration.
- **AI Pair-Programming:** I used agentic AI assistants like Claude, Gemini, and Copilot not as a shortcut, but as a senior pair-programmer. This shift allowed me to focus on high-level architectural logic, such as raycasting math and collision spheres.
- **Raycasting Breakthrough:** The major realization was that organic hair could not be hardcoded. Switching from static points to a spherical row-based engine allowed the system to scale from 20 braids to 3,000 instantly. Transitioning to the InstancedMesh system was the single biggest technical milestone, proving that I could maintain a stable 30 FPS even with extreme braid density.

### Conclusion & Reflection
The journey from knowing nothing about React/Three.js to deploying a complex, procedural 3D visualizer was transformative. Shifting my mindset to embrace iterative prototyping and AI assistance was the catalyst that made this possible. The ability to iterate ten times faster allowed me to learn more about the actual architecture of a 3D application than I ever would have learned by manually debugging boilerplate code.

### Open Source as a Design Philosophy
**Why AGPL-3.0?**
Choosing an open-source license was not an afterthought — it was a design decision rooted in the project's cultural mission. The AGPL-3.0 license was selected because it is a network copyleft license: if any party modifies and deploys this tool as a commercial web service, they are legally required to release their modifications back to the public. This prevents the cultural knowledge embedded in this tool (the sectioning logic, the pack coefficients calibrated for Afro hair textures) from being quietly commercialized without attribution. This decision reinforced my understanding that software architecture is never purely technical — it carries ethical and cultural weight.

### Next Steps (Post-Semester)
I plan to integrate a Supabase backend to allow users to share their configurations via unique URLs. I will also conduct the professional stylist interviews to fine-tune the 0.95 pack coefficient for real-world clinical accuracy. On the technical side, I aim to expand the automated test suite to include end-to-end (E2E) tests using Playwright to validate the full user journey from slider interaction to 3D re-render.
