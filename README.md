# Cinna's PAH - Protective Afro-Hairstyle Visualizer & Calculator

This is a Semester 3 HBO-ICT student project at Fontys University of Applied Sciences. The project digitizes experience-based knowledge in Afro-hair care, helping users estimate hair extension requirements through real-time 3D visualization.

## Tech Stack

- **React 19** - UI Logic & Component Lifecycle
- **Three.js (React Three Fiber)** - Procedural 3D rendering & InstancedMesh optimization
- **Zustand** - Decoupled state management (User & Dev stores)
- **Tailwind CSS v4** - Ergonomic Glassmorphism UI
- **Blender** - Custom low-poly asset modeling (`custombust.glb`, `boxbraid.glb`)

## Features

- **Procedural Hair Engine**: Real-time raycasting and UV-masked spawning for realistic parting.
- **Dynamic Physics**: Stiffness-biased gravity model for organic braid draping.
- **Pack Estimator**: Mathematical formula validated against professional stylist benchmarks.
- **Modular Dev Kit**: Integrated Asset Manager for real-time model hot-swapping and raycast debugging.
- **Preset CRUD**: Save, edit, and delete custom hairstyle configurations locally.
- **Responsive Scaling**: Mobile-first design optimized for ≥30 FPS on modern devices (e.g., Pixel 8).

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
git clone https://github.com/OCE-Cinna/hair-calculator-app.git
cd hair-calculator-app
npm install
```

### 3D Model Setup

The application looks for optimized assets in `public/models/`. High-fidelity models are migrated from `src/assets/` during build process:
- `custombust.glb` (Scalp mesh)
- `boxbraid.glb` / `boxbraidend.glb` (Box Braids)
- `twist.glb` / `twistend.glb` (Twists & Locs)
- `flatbraid.glb` / `flatbraidend.glb` (Knotless)

### Scripts

- `npm run dev`: Start local development server.
- `npm run build`: Generate production-ready bundle with Draco compression.
- `npm run preview`: Preview production build locally.

## Project Architecture

```
src/
├── components/
│   ├── Experience.jsx      # 3D Physics Loop & Raycasting Engine
│   ├── HeadModel.jsx       # Theme-aware scalp mesh component
│   ├── AssetManager.jsx    # Developer CRUD & Debugging tools
│   └── Sliders.jsx         # Parametric hairstyle controls
├── store/
│   └── hairStore.js        # Modular Zustand stores (useHairStore, useDevStore)
└── App.jsx                 # Core layout & Responsive scaling logic
```

## Documentation

Detailed technical breakdowns available in project repository:
- [3D Engine Guide](./3D_ENGINE_GUIDE.md): Math, Raycasting, and Physics details.
- [Dev Logbook](./DEVLOG_PHASES.md): Phased development journey and commit evidence.

## License

This project is licensed under **GNU Affero General Public License v3.0 (AGPLv3)**. See [LICENSE](./LICENSE) for details.
