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

            DENSITY_COUNTS: { 1: 8, 2: 16, 3: 28, 4: 42, 5: 60, 6: 90, 7: 120 },

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
                1: ['Micro', 0.7],
                2: ['Small', 0.9],
                3: ['Smedium', 1.1],
                4: ['Medium', 1.3],
                5: ['Large', 1.6],
                6: ['Jumbo', 2.0],

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
                4: ['Medium', 1.0],
                5: ['Full', 1.2],
                6: ['Very Full', 1.4],

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