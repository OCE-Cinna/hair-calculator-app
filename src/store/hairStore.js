import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * useHairStore - The single source of truth for the project.
 * Consolidates dynamic user state, static configuration maps, and calculation constants.
 */
export const useHairStore = create(
    persist(
        (set) => ({
            // --- Dynamic State (User Selections) ---
            stylePos: 1,
            thicknessPos: 4,
            lengthPos: 3,
            densityPos: 4,
            debugRaycast: false,
            assets: {}, // Dynamic asset paths for custom models/textures
            customPresets: [], // Stores user-created presets

            // --- Static Configuration (Lookup Maps & Constants) ---
            // Centralized here so both UI and 3D components stay in sync.

            // --- Dev Kit Configuration (Collision & Parting Math) ---
            // This section exposes core mathematical variables for the 3D physics engine and raycaster.
            // Tweaking these values allows developers to fine-tune hair draping and parting aesthetics
            // without needing to modify the complex loops in Experience.jsx.
            DEV_CONFIG: {
                // PRIMARY COLLISION (Jaw/Face):
                // Defines a mathematical sphere around the model's head to prevent hair from clipping into the face.
                headCenterY: 1.25,   // Vertical position of the head sphere (0 is the floor, 1.4 is top of head)
                headRadius: 0.95,    // The size of the head sphere. Increase this if hair clips into the cheeks/jaw.

                // SECONDARY COLLISION (Chest/Shoulders):
                // Defines a larger, lower sphere to simulate shoulders, forcing the hair to drape organically over them.
                torsoCenterY: 0.2,   // Vertical position of the shoulder sphere. Lower = further down the chest.
                torsoRadius: 1.25,   // Size of the shoulder sphere. Increase if the model has very broad shoulders.
                torsoPushOut: 0.5,   // Collision strength. Higher = hair glides outward more aggressively on the shoulder.

                // PARTING MATHEMATICS:
                // Controls how the raycaster calculates the spherical grid to spawn braids.
                partingRowMultiplier: 2,     // Increases/decreases the number of horizontal parting rows on the scalp.
                partingPointMultiplier: 1.8, // Increases/decreases the number of braids placed along the widest row.

                // DYNAMIC DENSITY:
                // If true, the engine automatically generates tighter, closer parts when a thinner braid (like "Micro") 
                // is selected, ensuring the scalp looks properly filled without relying purely on the Density slider.
                thicknessDensityScale: true, 
            },

            DENSITY_COUNTS: { 1: 16, 2: 30, 3: 50, 4: 80, 5: 100, 6: 160, 7: 250 },

            STYLE_COLORS: {
                1: '#6a331c', // Dark Brown
                2: '#7a4d31', // Medium Brown
                3: '#795c4b', // Light Brown
                4: '#4c423b'  // Ash / Dark Grey
            },

            STYLE_MAP: {
                1: ['Box Braids', 1.0], // Default to 1.0 for modifiers
                2: ['Knotless', 1.2],
                3: ['Twists', 0.9],
                4: ['Locs', 1.1],
            },

            THICKNESS_MAP: {
                1: ['Micro', 0.02],
                2: ['Small', 0.04],
                3: ['Smedium', 0.05],
                4: ['Medium', 0.07],
                5: ['Large', 0.12],
                6: ['Jumbo', 0.25],
            },

            LENGTH_MAP: {
                1: ['Ear', 0.8],
                2: ['Jaw', 1.0],
                3: ['Shoulder', 1.2],
                4: ['Mid-back', 1.4],
                5: ['Waist', 1.7],
                6: ['Hip', 2.0],
            },

            DENSITY_MAP: {
                1: ['Very Low', 0.6],
                2: ['Low', 0.8],
                3: ['Medium', 1.0],
                4: ['Full', 1.2],
                5: ['Very Full', 1.4],
            },

            // --- Actions ---
            setStylePos: (pos) => set({ stylePos: pos }),
            setThicknessPos: (pos) => set({ thicknessPos: pos }),
            setLengthPos: (pos) => set({ lengthPos: pos }),
            setDensityPos: (pos) => set({ densityPos: pos }),
            setAssets: (assets) => set({ assets }),
            setAssetOverride: (slot, url) => set((state) => ({ assets: { ...state.assets, [slot]: url } })),
            resetAssets: () => set({ assets: {} }),
            setDebugRaycast: (val) => set({ debugRaycast: val }),
            addCustomPreset: (preset) => set((state) => ({ customPresets: [...(state.customPresets || []), preset] })),

            // Reset helper
            resetSelections: () => set({
                stylePos: 1,
                thicknessPos: 4,
                lengthPos: 3,
                densityPos: 4,
            })
        }),
        {
            name: 'hair-storage',
            // Persist only user selections to localStorage.
            // Maps and constants remain in the code to ensure they stay up-to-date.
            partialize: (state) => ({
                stylePos: state.stylePos,
                thicknessPos: state.thicknessPos,
                lengthPos: state.lengthPos,
                densityPos: state.densityPos,
                assets: state.assets,
                customPresets: state.customPresets,
            }),
        }
    )
);