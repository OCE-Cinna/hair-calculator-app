# Copilot Instructions for Hair Calculator App

## Project Overview

**Cinna's PAH** (Protective Afro-Hairstyle Visualizer & Calculator) is an interactive 3D web application that helps users estimate how many hair extension packs they need for protective hairstyles like braids, locs, and twists.

- **Stack**: React 19, Three.js, R3F (@react-three/fiber), Drei, Tailwind CSS v4, Vite
- **Key Features**: Real-time 3D head visualization, slider-based parameter adjustment, preset gallery, hair pack estimation

## Architecture

### Data Flow & Core Concept

The app uses a **slider-driven calculation system** with preset support:

```
User Input (Sliders) → Calculation Formula → Hair Pack Estimate
        ↓
    3D Visualization Updates
        ↓
    (Optional) Load Preset → Auto-populate all sliders
```

**Core calculation formula** (in App.jsx):
```javascript
(style + thickness + density) x length x 0.95
```
- The `0.95` factor accounts for real-world variation in install tightness
- All modifiers are derived from actual braid data

### Key State Variables

- `stylePos`, `thicknessPos`, `lengthPos`, `densityPos`: Positions (1-7 range) that reference lookup maps
- Each position maps to a `[label, calculationModifier]` pair
- **Maps** (`styleMap`, `thicknessMap`, `lengthMap`, `densityMap`) define discrete options + their modifiers

### Component Structure

1. **App.jsx** (~830 lines)
   - Main state container and orchestrator
   - Defines all data maps, presets, and calculation logic
   - Renders burger menu, preset gallery, sliders, and 3D canvas
   - Handles preset parsing and dynamic state updates

2. **Sliders.jsx**
   - Custom range input component with labeled tick marks
   - Uses Tailwind for styling, accepts a `map` prop for label data
   - Emits `onChange` events with slider position

3. **Experience.jsx**
   - Main 3D scene component using React Three Fiber
   - Handles raycasting-based hair placement with UV texture masking
   - Manages InstancedMesh for braid rendering
   - Integrates head model and hair visualization

4. **HeadModel.jsx**
   - Loads and renders custombust.glb as the base head mesh
   - Applies scalp_mask.jpeg as texture for hair placement masking
   - Provides mesh reference for raycasting operations

### Key Patterns & Conventions

#### Preset System
- Filename format: `{length}_{thickness}_{style}.jpg`
- Uses alias mappings (`LENGTH_ALIASES`, `THICKNESS_ALIASES`, `STYLE_ALIASES`) to parse flexible filenames
- `parsePresetFilename()` extracts parameters from preset ID → returns `{ lengthPos, thicknessPos, stylePos, densityPos }`
- Presets auto-calculate default density based on thickness (thicker = fewer braids = lower density)

#### Slider Organization
- Each slider corresponds to one parameter (style, thickness, length, density)
- Min/max align with map keys (e.g., style: 1-4, density: 1-7)
- `buttonLabels` prop enables ± button shortcuts for quick adjustments

#### 3D Canvas Interaction
- **Pointer events** for cross-device support (mouse + touch)
- **`setPointerCapture` / `releasePointerCapture`** for continuous drag tracking
- **X rotation clamped** to ±90° to prevent inversion
- Rotation speed: `0.005` (configurable sensitivity)

#### Hair Placement & Instancing
- **Raycasting**: Rays shot from grid above head, intersect with scalp mesh
- **UV Sampling**: Samples scalp_mask.png at hit coordinates
- **Masking**: White pixels spawn braids, black pixels skip
- **InstancedMesh**: Efficient rendering of multiple braid instances
- **Braid Construction**: Stacks boxbraid.glb segments + boxbraidend.glb cap

## Developer Workflows

### Setup & Installation
```bash
npm install          # Install dependencies
npm run dev          # Start Vite dev server (HMR enabled)
npm run build        # Production build to /dist
npm run lint         # Run ESLint
npm run preview      # Preview production build locally
```

### Common Development Tasks

1. **Adding a new hairstyle option**:
   - Add entry to `styleMap` in App.jsx (key: position, value: `[label, modifier]`)
   - Update `DENSITY_COUNTS` and `STYLE_GEOMETRIES` if rendering details differ
   - Update `STYLE_ALIASES` for flexible preset naming
   - Update `parsePresetFilename()` defaults if needed

2. **Adding a new preset**:
   - Add object to `PRESETS` array with `id`, `label`, `sublabel`, `image`, `bgGradient`
   - Image path: `/public/{length}_{thickness}_{style}.jpg`
   - ID format must be parse-able by `parsePresetFilename()` (e.g., `hip_medium_lock`)

3. **Modifying calculation formula**:
   - Edit the multiplier logic in the calculation section (search for `0.95` factor)
   - All modifiers are applied as: `(sum_of_modifiers) × length_modifier × 0.95`

4. **3D Model / Visualization**:
   - ThreeDCanvas.jsx is vanilla Three.js (independent of React 3 Fiber)
   - To use R3F + Drei components instead, refactor into Canvas + useThree hook pattern
   - Bust.jsx is pre-generated from gltf; regenerate via `npx gltfjsx@6.5.3 bust.gltf` if model updates

### Performance Considerations

- **Vite + Fast Refresh**: Changes to component code reflect instantly during `npm run dev`
- **Three.js rendering loop**: Continuous `requestAnimationFrame` in ThreeDCanvas; no autorotation (user-driven)
- **Tailwind CSS v4**: Uses `@tailwindcss/vite` plugin for optimized builds
- **Presets**: Predefined configurations; no dynamic data loading from backend

## Integration Points & External Dependencies

- **Three.js 0.181.1**: Core 3D rendering; vanilla API (not wrapped in R3F)
- **React 19**: Latest features; JSX syntax
- **Tailwind CSS v4**: Utility-first styling; `@tailwindcss/postcss` for PostCSS support
- **Lucide React**: Icon library (Menu, X, ChevronLeft, ChevronRight, Sparkles, Github, Info)
- **Vite 7.2.2**: Build tool; configured in `vite.config.js`

## Important Files & References

| File | Purpose |
|------|---------|
| [src/App.jsx](../src/App.jsx) | Main app: state, maps, presets, UI layout, calculation logic |
| [src/components/Sliders.jsx](../src/components/Sliders.jsx) | Custom range input with labeled ticks |
| [src/components/Experience.jsx](../src/components/Experience.jsx) | Main 3D scene with raycasting and InstancedMesh |
| [src/components/HeadModel.jsx](../src/components/HeadModel.jsx) | GLTF head model loader with texture |
| [public/models/custombust.glb](../public/models/custombust.glb) | Custom 3D head model |
| [public/models/boxbraid.glb](../public/models/boxbraid.glb) | Braid segment model |
| [public/models/boxbraidend.glb](../public/models/boxbraidend.glb) | Braid end cap model |
| [public/scalp_mask.jpeg](../public/scalp_mask.jpeg) | UV texture mask for hair placement |
| [vite.config.js](../vite.config.js) | Vite + Tailwind + React plugin configuration |

## Testing & Debugging

- **Browser DevTools**: Three.js canvas is in main DOM; inspect renderer element to debug rendering
- **ESLint**: Run `npm run lint` for code style checks
- **Manual testing**: Verify slider ranges (1-7 for density, etc.), preset loading, and 3D interaction across devices

## Future Considerations

- **Backend integration**: Currently all data is hardcoded; could migrate to JSON config files or API
- **User presets**: Allow saving custom slider configurations (localStorage or backend)
- **R3F migration**: Refactor ThreeDCanvas.jsx to use React 3 Fiber for better React integration
- **Mobile optimizations**: Touch events work; consider gesture recognition for enhanced UX
- **Model optimization**: Implement LOD (Level of Detail) for braid segments based on distance
