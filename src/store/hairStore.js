import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Static Configuration (Lookup Maps & Constants)
 * Moved outside the store to avoid redundant persistence in localStorage.
 */
export const CONFIG_MAPS = {
    DENSITY_COUNTS: { 1: 20, 2: 40, 3: 60, 4: 100, 5: 150, 6: 220, 7: 320 },
    STYLE_COLORS: {
        1: '#6a331c', // Dark Brown
        2: '#7a4d31', // Medium Brown
        3: '#795c4b', // Light Brown
        4: '#4c423b'  // Ash / Dark Grey
    },
    STYLE_MAP: {
        1: ['Box Braids', 1.0],
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
};

/**
 * useHairStore - The core selection and configuration store.
 * Handles user hairstyle choices and provides access to static maps.
 */
export const useHairStore = create(
    persist(
        (set) => ({
            // --- Dynamic State (User Selections) ---
            stylePos: 1,
            thicknessPos: 4,
            lengthPos: 3,
            densityPos: 4,
            theme: 'system', // 'light', 'dark', or 'system'
            customPresets: [], // Stores user-created presets
            _hasHydrated: false,

            // --- Configuration Getters (Maintain compatibility with existing selectors) ---
            DENSITY_COUNTS: CONFIG_MAPS.DENSITY_COUNTS,
            STYLE_COLORS: CONFIG_MAPS.STYLE_COLORS,
            STYLE_MAP: CONFIG_MAPS.STYLE_MAP,
            THICKNESS_MAP: CONFIG_MAPS.THICKNESS_MAP,
            LENGTH_MAP: CONFIG_MAPS.LENGTH_MAP,
            DENSITY_MAP: CONFIG_MAPS.DENSITY_MAP,

            // --- Actions ---
            setStylePos: (pos) => set({ stylePos: pos }),
            setThicknessPos: (pos) => set({ thicknessPos: pos }),
            setLengthPos: (pos) => set({ lengthPos: pos }),
            setDensityPos: (pos) => set({ densityPos: pos }),
            setTheme: (theme) => set({ theme }),
            setHasHydrated: (state) => set({ _hasHydrated: state }),

            // Preset CRUD
            addCustomPreset: (preset) => set((state) => ({
                customPresets: [...(state.customPresets || []), preset]
            })),
            deleteCustomPreset: (id) => set((state) => ({
                customPresets: state.customPresets.filter(p => p.id !== id)
            })),
            updateCustomPreset: (id, updates) => set((state) => ({
                customPresets: state.customPresets.map(p => p.id === id ? { ...p, ...updates } : p)
            })),

            resetSelections: () => set({
                stylePos: 1,
                thicknessPos: 4,
                lengthPos: 3,
                densityPos: 4,
            })
        }),
        {
            name: 'hair-storage',
            partialize: (state) => ({
                stylePos: state.stylePos,
                thicknessPos: state.thicknessPos,
                lengthPos: state.lengthPos,
                densityPos: state.densityPos,
                theme: state.theme,
                customPresets: state.customPresets,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);

/**
 * useDevStore - The Developer Tooling and Override store.
 * Isolated from the main user store to allow easy enabling/disabling of dev features.
 */
export const useDevStore = create(
    persist(
        (set) => ({
            isEnabled: false, // Global toggle for Dev Kit
            debugRaycast: false,
            assets: {}, // Dynamic asset overrides
            _hasHydrated: false,

            DEV_CONFIG: {
                headCenterY: 1.25,
                headCenterZ: 0.0,
                headRadius: 0.95,
                torsoCenterY: 0.2,
                torsoRadius: 1.25,
                torsoStretchX: 1.5,
                torsoStretchZ: 1.5,
                torsoPushOut: 0.5,
                partingRowMultiplier: 5,
                partingPointMultiplier: 5,
                thicknessDensityScale: true,
                calibrationFactor: 0.95,
                centerPartingWidth: 0.08,
                partThickness: 0.08,
            },

            // Actions
            setIsDevEnabled: (val) => set({ isEnabled: val }),
            setDebugRaycast: (val) => set({ debugRaycast: val }),
            setAssetOverride: (slot, url) => set((state) => ({ 
                assets: { ...state.assets, [slot]: url } 
            })),
            resetAssets: () => set({ assets: {} }),
            updateDevConfig: (key, val) => set((state) => ({
                DEV_CONFIG: { ...state.DEV_CONFIG, [key]: val }
            })),
            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'hair-dev-storage',
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);