# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

### Added
- `feature/stylist-mode` branch: Stylist Mode — professional calibration panel with real-time pack factor adjustment, collision sphere tuning, debug visualizer, and model hot-swap
- `ARCHITECTURE.md` — technical documentation of the raycasting engine, physics loop, and state design
- `TUTORIAL.md` — complete end-user guide including Stylist Mode walkthrough and edge cases
- Scroll restored: removed `overflow: hidden` and `position: fixed` from global body/html CSS

### Changed
- `AssetManager.jsx` replaced by `StylistPanel.jsx` — functionality merged into a unified professional panel
- `calculateHairPacks` now accepts an optional `factor` parameter (default `0.95`) for runtime calibration
- `DEV_CONFIG` extended with `calibrationFactor` and dynamic head/torso center Y coordinates
- Physics loop reads head and torso center positions from `DEV_CONFIG` instead of hardcoded constants

### Removed
- `AssetManager.jsx` — replaced by `StylistPanel.jsx`
- `.github/workflows/` — removed from all branches; entire `.github/` folder is now gitignored
- `TODO.md` — moved to local-only (gitignored)
- Dead documentation links from `README.md` (`3D_ENGINE_GUIDE.md`, `DEVLOG_PHASES.md`)

---

## [0.3.0] — 2026-05-15

### Added
- `StylistPanel.jsx` — Stylist Mode UI with asset overrides, calibration sliders, and preset management
- `TUTORIAL.md` — first version of the end-user guide
- `README.md` rewrite: accurate architecture tree, Stylist Mode section, asset and script tables
- `.gitignore` hardened: added `TODO.md`, `.github/`, `.vscode/`, `.agents/`, junk asset patterns

### Changed
- `BurgerMenu` converted from arrow function expression to function component to support hooks (Stylist Mode toggle)
- `useDevStore.DEV_CONFIG` now includes `calibrationFactor` (previously hardcoded as `0.95` in `calculator.js`)
- Scroll behaviour fixed: `body` changed from `position: fixed; overflow: hidden` to `min-height: 100vh`

### Removed
- Legacy constants: `OBJLoader.js`, `maps.js`, `objectLoader.js`, `LoadingManager.js`
- `src/assets/` directory — all runtime assets moved to `public/models/`, `public/textures/`, `public/presets/`
- Legacy backup files: `src/App.jsx.old`, `*.blend`, `src/model/`

---

## [0.2.0] — 2026-05

### Added
- `PresetGallery.jsx` — horizontal scrollable gallery with preset cards and active state
- Custom preset creation via `AssetManager.jsx`: name, preview image upload, CRUD operations
- Zustand `useDevStore` — isolated dev tooling store, separate from user state
- Raycast debug mode: renders instanced spheres at all hair spawn points
- Adaptive post-processing: Bloom and Noise disabled on mobile; DPR capped at 1.5
- `StylistPanel.jsx` scaffolded for asset model hot-swapping via blob URLs
- AGPLv3 license added to repository

### Changed
- State management migrated from local component state to `useHairStore` + `useDevStore`
- Hair placement algorithm upgraded to spherical raycasting with UV mask sampling
- `InstancedMesh` adopted for all hair segments — single draw call regardless of strand count
- Braid draping upgraded with gravity bias, floor check, and length tension (step × 1.15 per iteration)
- Collision detection expanded: head sphere + torso/shoulder sphere with configurable push-out

### Fixed
- Hair spawning on neck and face — Y-position floor guard (`hit.point.y > 0.8`) added to raycaster
- Even-count symmetry enforcement in parting rows eliminates asymmetric braid distributions
- Memory pressure reduced by hoisting `Matrix4`, `Vector3`, and `Quaternion` objects above the per-strand loop

---

## [0.1.0] — 2026-04

### Added
- Initial project scaffolding: Vite, React 19, React Three Fiber, Zustand, Tailwind CSS v4
- Basic 3D head model rendered via `custombust.glb`
- Slider-driven parameter controls: style, thickness, length, density
- First version of the pack estimation formula: `(style + thickness + density) * length * 0.95`
- Glassmorphism UI design system with OKLCH color tokens
- Light / dark / system theme switcher
- Initial preset definitions in `src/constants/presets.js`
- `HeadModel.jsx`: dynamic skin tone from CSS variable `--color-skin-fallback`

---

[Unreleased]: https://github.com/OCE-Cinna/hair-calculator-app/compare/HEAD...main
