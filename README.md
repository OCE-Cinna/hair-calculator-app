# Cinna's PAH — Protective Afro-Hairstyle Visualizer & Calculator

A Semester 3 HBO-ICT student project at Fontys University of Applied Sciences. The application digitizes experience-based knowledge in Afro-hair care, helping users estimate hair extension requirements through real-time 3D visualization and a formula-backed pack calculator.

## Tech Stack

- **React 19** — UI logic and component lifecycle
- **Three.js (React Three Fiber)** — Procedural 3D rendering via `InstancedMesh`
- **Zustand** — Decoupled state management (`useHairStore`, `useDevStore`)
- **Tailwind CSS v4** — Glassmorphism design system with OKLCH color tokens
- **Blender** — Custom low-poly asset modeling (`custom_bust.glb`, `hair_box_mid.glb`)

## Features

- **Procedural Hair Engine** — Real-time raycasting with UV-masked scalp spawning for realistic parting
- **Physics Simulation** — Stiffness-biased gravity model for organic braid draping and shoulder collision
- **Pack Estimator** — Formula validated against professional stylist benchmarks: `(style + thickness + density) × length × 0.95`
- **Stylist Mode** — Advanced calibration panel for professionals: override 3D models, tune collision spheres, and adjust the pack calibration factor in real time
- **Preset Gallery** — Browse, select, and save custom hairstyle configurations with local persistence
- **Adaptive Performance** — Mobile-first rendering: bloom and noise effects automatically disabled below a device threshold to maintain ≥30 FPS
- **Theme System** — Light, dark, and system-preference modes with smooth OKLCH color transitions

## Getting Started

### Prerequisites

- Node.js v18 or higher
- npm

### Installation

```bash
git clone https://github.com/OCE-Cinna/hair-calculator-app.git
cd hair-calculator-app
npm install
npm run dev
```

### 3D Asset Setup

Place the following models in `public/models/` and textures in `public/textures/`:

| File | Purpose |
|------|---------|
| `custom_bust.glb` | Base head and torso mesh |
| `hair_box_mid.glb` / `boxbraidend.glb` | Box Braids segments |
| `flatbraid.glb` / `flatbraidend.glb` | Knotless segments |
| `twist.glb` / `twistend.glb` | Twists and Locs segments |
| `scalp_mask.jpeg` | UV mask — R (top), G (sides), B (back) spawn region mask |

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start local development server |
| `npm run build` | Generate production bundle |
| `npm run preview` | Preview production build locally |
| `npm test` | Run test suite |

## Project Architecture

```
src/
├── components/
│   ├── Experience.jsx       # 3D physics loop, raycasting engine, InstancedMesh rendering
│   ├── StylistPanel.jsx     # Professional calibration panel (Stylist Mode)
│   ├── HeadModel.jsx        # Theme-aware scalp mesh loader
│   ├── PresetGallery.jsx    # Preset CRUD and gallery display
│   ├── HairModels.jsx       # GLTF model loader helpers
│   └── ThreeDCanvas.jsx     # R3F Canvas wrapper and postprocessing
├── store/
│   └── hairStore.js         # Zustand stores: useHairStore (user state), useDevStore (calibration)
├── constants/
│   └── presets.js           # Initial preset definitions
├── utils/
│   └── calculator.js        # Pack estimation formula
└── App.jsx                  # Root layout, BurgerMenu, ControlCard compound components
```

## Stylist Mode

Enable **Stylist Mode** from the main menu to unlock the calibration panel. This is designed for professional stylists who need precise control over the calculation and 3D engine behavior.

Stylist Mode exposes:

- **Pack Calibration Factor** — Adjust the 0.95 normalization factor for hair brands with different strand densities
- **Collision Sphere Tuning** — Modify the head and torso bounding volumes that drive hair draping physics
- **Debug Visualizer** — Render wireframe collision boundaries directly in the 3D scene
- **Model Overrides** — Hot-swap the bust or braid GLB files without restarting the dev server
- **Preset Management** — Create and manage custom presets with uploaded preview images

## Documentation

- [User Guide](./TUTORIAL.md) — Complete walkthrough for end users

## License

Licensed under the **GNU Affero General Public License v3.0 (AGPLv3)**. See [LICENSE](./LICENSE) for details.
