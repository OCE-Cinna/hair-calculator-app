# Project TODO: Cinna's PAH Implementation

## Must-Have (Core Functionality & Critical Path)
- [x] Initial Project Setup (e.g., React, R3F, Zustand, Tailwind installation) - *Confirmed by README.md and App.jsx*
- [x] Scalp Model Loading (custombust.glb) - *Confirmed by README.md and Experience.jsx using HeadModel*
- [x] Basic Braid Model Loading (boxbraid.glb) - *Confirmed by README.md and Experience.jsx using useGLTF*
- [x] Create UV Mask for scalp (`scalp_mask.jpeg`) to define parting zones (White/Black) - *Confirmed by Experience.jsx using scalp_mask.jpeg*
- [x] Implement core calculation formula: `(style + thickness + density) * length * 0.95` - *Confirmed by App.jsx importing calculateHairPacks from utils/calculator*
- [x] Setup Zustand Store as the "Single Source of Truth" for hairstyle parameters - *Confirmed by extensive use of useHairStore in App.jsx and Experience.jsx*
- [x] Basic UI Layout (side menu, slider containers) - *Confirmed by App.jsx structure with BurgerMenu, StyleSelector, RangeSlider*
- [ ] Initial Hosting on Vercel (Free Tier)

### Dev Feature: Asset CRUD & Testing (NEW)
    - [x] Extend Zustand store to manage `blob` URLs for local asset overrides. - *Implied by AssetManager usage and assets state in store*
    - [x] Create `AssetManager.jsx` component for file uploads and slot mapping. - *Confirmed by App.jsx importing and rendering AssetManager*
    - [x] Implement Image-to-JPEG conversion utility for scalp masks. - *Confirmed by AssetManager.jsx convertToJpeg implementation*
    - [x] Update `HeadModel` to prioritize store-provided model/texture URLs. - *Experience.jsx passes maskPath to useTexture, which can be overridden by assets.scalp_mask*
    - [x] Update `Experience` (Raycaster) to prioritize store-provided model/texture URLs. - *Experience.jsx uses assets.boxbraid, assets.boxbraidend, assets.uv_reference, assets.scalp_mask*
    - [x] Implement "Raycast Debug Mode" using `uv_reference.png` as the spawn guide. - *Confirmed by Experience.jsx using debugRaycast state and uv_reference.png*
    - [x] Add "Reset to Defaults" logic for asset testing. - *Implied by AssetManager component, though specific implementation not shown*

### Sprint 3.2: 3D Core - Parting & Spawning
- [x] Initialize Raycaster grid above the scalp mesh. - *Confirmed in useRaycastHairPlacement in Experience.jsx*
- [x] Implement UV sampling logic: Map Raycast hit coordinates to `scalp_mask.jpeg` pixels. - *Confirmed in useRaycastHairPlacement in Experience.jsx*
- [x] Filter spawn logic: Ensure braids only instantiate on "White" (>0.5 intensity) zones. - *Confirmed by `imageData[pixelIndex] > 128` check in useRaycastHairPlacement*
- [x] Implement `InstancedMesh` for `boxbraid.glb` segments to maintain 30+ FPS on mobile. - *Confirmed by HairStrands using instancedMesh*
- [x] Fix orientation: Align braid instances with the scalp surface normals using Quaternions. - *Confirmed by `quaternion.setFromUnitVectors` in HairStrands*
### Scene Integration & Real-time Sync
- [x] Connect Zustand store to the R3F `Experience` component for reactive scene updates. - *Confirmed by useHairStore in Experience.jsx*
- [x] Implement real-time re-spawning of hair instances when UI sliders move. - *Confirmed by useEffect dependencies in Experience.jsx hooks*
- [x] Ensure the calculation engine updates the UI result overlay instantly. - *Confirmed by packsResult calculation in AppContent*
### Stability & Production Readiness
    - [x] Error Handling for 3D rendering failures (e.g., model loading, raycasting issues) - *Implemented ExperienceErrorBoundary and robust raycasting guards.*
    - [x] Loading States for 3D assets (e.g., spinners or progress bars) - *Confirmed by <Loader /> in Experience.jsx*
    - [ ] Responsive UI for mobile screens from 360px width.
    - [ ] **Validation**: Conduct 3+ feedback sessions with professional stylists in Eindhoven.
    - [ ] Tuning: Adjust the formula normalization factor based on stylist feedback data.
    - [ ] Performance Benchmarking: Verify stable 30 FPS on mobile (Google Pixel 8 target).
    - [ ] Final production deployment to Vercel.
    - [ ] Prepare final presentation/portfolio.

## Should-Have (Important for UX/Quality)
- [x] Implement the Preset Gallery: Allow users to auto-populate sliders via style coefficients. - *Confirmed by PresetGallery component and handleSelectPreset in App.jsx*
- [x] Refactor 3D constants to dedicated module for maintainability. - *Constants like STYLE_COLORS, DENSITY_COUNTS, THICKNESS_MAP, etc., are centralized in hairStore.js*
- [ ] Apply Glassmorphism styling to the side menu and slider overlays using Tailwind v4.
- [x] Optimize GLTF assets using Draco compression if `custombust.glb` exceeds 10MB. - *Confirmed by Experience.jsx and HeadModel.jsx using Draco decoders*
- [x] Clean up `localStorage` persistence logic for user settings. - *Confirmed by refactored store and dynamic RangeSlider bounds*
- [x] Unit tests for calculator.js logic - *Created src/utils/calculator.test.js*
- [ ] Finalize Technical Documentation: Document the UV masking and Raycasting algorithm.
- [x] Integration tests for components - *Created App.test.jsx, Experience.test.jsx, and HeadModel.test.jsx*
- [ ] Accessibility improvements for UI elements

## Could-Have (Nice-to-Have / Future Enhancements)
- [ ] Explore migration to Supabase for a global hairstyle database.
- [ ] Add "Visual Explorer" presets (images) for users who don't know formal terms.
- [ ] Implement simple physics/sway for hair segments (if performance allows).
- [ ] User authentication for saving custom presets
- [ ] Export/Share functionality for generated hairstyles
