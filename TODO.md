# Project TODO: Cinna's PAH Implementation

## Must-Have (Core Functionality & Critical Path)
- [x] Initial Project Setup (React 19, R3F, Zustand, Tailwind v4)
- [x] Scalp Model Loading (`custombust.glb`) with Draco compression
- [x] Basic Braid Model Loading (`boxbraid.glb`) and segment spawning
- [x] Create UV Mask for scalp (`scalp_mask.jpeg`) to define parting zones
- [x] Implement core calculation formula: `(style + thickness + density) * length * 0.95`
- [x] Setup Zustand Store as the "Single Source of Truth" with persistence
- [x] Refactor UI to **Floating Card Architecture** for better visual ergonomics
- [x] Setup **AGPLv3 License** for open-source compliance
- [ ] **Hosting**: Deploy final production build to Vercel (Free Tier)
- [ ] **Mobile Optimization**: Responsive UI for screens from 360px width (Priority: FR-5)

### Dev Feature: Asset CRUD & Testing
- [x] Extend Zustand store to manage `blob` URLs for local asset overrides
- [x] Create `AssetManager.jsx` (Dev Kit) for real-time model/texture hot-swapping
- [x] Implement Image-to-JPEG conversion utility for scalp masks
- [x] Implement "Raycast Debug Mode" using `uv_reference.png`
- [x] Add "Preset Creator" to Dev Kit to save custom looks to the gallery
- [x] Refined preset saving logic to use actual store state

### Sprint 3.2: 3D Core - Parting & Spawning
- [x] Initialize Raycaster grid above the scalp mesh
- [x] Implement UV sampling logic for precision parting
- [x] Filter spawn logic based on mask intensity and Y-bounds
- [x] Implement `InstancedMesh` for high-performance rendering (30000+ segments)
- [x] Fix orientation: Align braids with scalp normals using Quaternions
- [x] Sync 3D Canvas height with customization form for balanced UI

### Scene Integration & Real-time Sync
- [x] Connect Zustand store to R3F for reactive updates
- [x] Implement real-time re-spawning of hair instances on slider change
- [x] Theme-aware 3D background (Light Grey in Dark Mode)
- [x] Snappy slider feedback (100ms transitions)
- [ ] **Performance Profile**: Verify ≥30 FPS on Google Pixel 8 (NFR-2)

### Stability & Production Readiness
- [x] Error Handling for 3D rendering (ErrorBoundary)
- [x] Loading States for 3D assets (`<Loader />`)
- [x] Visual Optimization: Removed pulsing animations / Refined glows
- [ ] **Validation**: Conduct 3+ feedback sessions with professional stylists in Eindhoven
- [ ] **Tuning**: Finalize the 0.95 normalization factor based on stylist data
- [ ] **Documentation**: Finalize Technical Doc for UV masking and physics loop

## Should-Have (UX & Quality)
- [x] Implement the **Preset Gallery**: Minimize/Expand functionality
- [x] Refactor 3D constants to dedicated module (`hairStore.js`)
- [x] Apply Glassmorphism styling to all UI panels
- [x] Unit tests for `calculator.js` logic
- [x] Integration tests for core components
- [x] **Accessibility**: ARIA labels, focus states, and keyboard navigation for sliders
- [x] **Refactoring**: Audit `Experience.jsx` for loop efficiency and state pruning

## Could-Have (Future Enhancements)
- [ ] **Backend**: Explore migration to Supabase for global hairstyle database
- [ ] **Visual Explorer**: Add image-based presets for terminology-blind users (Persona 2)
- [ ] **Physics**: Implement subtle wind/sway for hair segments
- [ ] **Auth**: User accounts for saving personal style history
- [ ] **Share**: Generate shareable URLs or PNG snapshots of configurations

## Modernization & Performance (Agentic Standards)
- [x] **Zustand Optimization**: Implement `_hasHydrated` pattern in `hairStore.js` for persist middleware safety.
- [x] **Render Optimization**: Use `useShallow` for multi-value store selectors in `App.jsx` and `Experience.jsx`.
- [x] **GPU Resource Management**: Implement `.dispose()` patterns in `Experience.jsx` and `HeadModel.jsx` for all transient assets.
- [x] **Visual Upgrade**: Implement custom `ShaderMaterial` for hair strands to add realistic textures/sheen (Skill: `threejs-shaders`).
- [x] **Design System Refinement**: Standardize all OKLCH/colors using Tailwind v4 custom properties in `index.css`.
- [x] **UI Component Refactoring**: Implement "Compound Component" pattern for the customization sliders (Skill: `web-component-design`).

## Agentic Skill Integration (Advanced Phase)
- [x] **Cinematic Visuals**: Implement Post-Processing (Bloom, Vignette, Tone Mapping) for a premium 3D feel (Skill: `threejs-postprocessing`).
- [x] **Dynamic Animations**: Add subtle "growth" or "sway" animations to hair strands (Skill: `threejs-animation`).
- [x] **Copy Humanization**: Review and polish project copy for natural, engaging tone (Skill: `humanizer`).
- [x] **Typography Elevation**: Switch to premium Google Fonts (Outfit/Plus Jakarta Sans) to avoid generic system aesthetics (Skill: `frontend-design`).

## Quality Control & Bug Log (DONE)
- [x] **Logic Cleanup**: Verify all hardcoded RGB values in JS are moved to CSS variables
- [x] **Asset Fallbacks**: Ensure clear "Asset Missing" UI when dev overrides fail
- [x] **Render Audit**: Check for unnecessary re-renders in `AppContent` when camera moves
