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
        //  key: [label,        packMult, thickness, length, density]
        //                               pos 1-6     pos 1-6  pos 1-5
        //  Thickness: 1=Micro 2=Small 3=Smedium 4=Medium 5=Large 6=Jumbo
        //  Length:    1=Ear   2=Jaw   3=Shoulder 4=Mid-back 5=Waist 6=Hip
        //  Density:   1=Very Low 2=Low 3=Medium 4=Full 5=Very Full
        1: ['Box Braids', 1.0, 4, 3, 3], // Medium / Shoulder / Medium
        2: ['Knotless', 1.2, 3, 3, 4], // Smedium / Shoulder / Full  (smaller, fuller look)
        3: ['Twists', 0.9, 4, 3, 3], // Medium / Shoulder / Medium (same weight feel)
        4: ['Locs', 1.1, 3, 5, 2], // Smedium / Waist / Low      (longer, sparser)
    },
    THICKNESS_MAP: {
        1: ['Micro', 0.29],    // 0.02 / 0.07
        2: ['Small', 0.57],    // 0.04 / 0.07
        3: ['Smedium', 0.71],  // 0.05 / 0.07
        4: ['Medium', 1.0],    // Baseline
        5: ['Large', 1.71],    // 0.12 / 0.07
        6: ['Jumbo', 3.57],    // 0.25 / 0.07
    },
    LENGTH_MAP: {
        1: ['Ear (10")', 0.4],       // < Half pack
        2: ['Jaw (12")', 0.5],       // Half pack
        3: ['Shoulder (24")', 1.0],  // 1 pack folded in half (Baseline)
        4: ['Mid-back (30")', 1.25], // 1.25 packs
        5: ['Waist (36")', 1.5],     // 1.5 packs
        6: ['Hip (48")', 2.0],       // Doubled packs
    },
    DENSITY_MAP: {
        1: ['Very Low', 0.5],
        2: ['Low', 0.7],
        3: ['Medium', 1.0],
        4: ['Full', 2.0],
        5: ['Very Full', 3.0],
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
            densityPos: 3,
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
            // selectStyle: sets style + applies that style's bundled defaults
            selectStyle: (pos) => set({
                stylePos: pos,
                thicknessPos: CONFIG_MAPS.STYLE_MAP[pos]?.[2] ?? 4,
                lengthPos: CONFIG_MAPS.STYLE_MAP[pos]?.[3] ?? 3,
                densityPos: CONFIG_MAPS.STYLE_MAP[pos]?.[4] ?? 3,
            }),
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
                densityPos: 3,
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
            bustCombos: [], // Saved bust + mask combinations
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
                calibrationFactor: 0.95, // Resetting back up since the length multiplier for the 1.0 baseline is now larger in relation to the others
                centerPartingWidth: 0.08,
                partThickness: 0.08,
            },

            setIsDevEnabled: (val) => set({ isEnabled: val }),
            setDebugRaycast: (val) => set({ debugRaycast: val }),
            setAssetOverride: (slot, url) => set((state) => ({
                assets: { ...state.assets, [slot]: url }
            })),
            resetAssets: () => set({ assets: {} }),
            updateDevConfig: (key, val) => set((state) => ({
                DEV_CONFIG: { ...state.DEV_CONFIG, [key]: val }
            })),
            resetDevConfig: () => set({
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
                }
            }),

            // Bust Combo CRUD
            addBustCombo: (combo) => set((state) => ({
                bustCombos: [...(state.bustCombos || []), combo]
            })),
            deleteBustCombo: (id) => set((state) => ({
                bustCombos: state.bustCombos.filter(c => c.id !== id)
            })),
            applyBustCombo: (combo) => set((state) => ({
                assets: {
                    ...state.assets,
                    custom_bust: combo.bustUrl,
                    scalp_mask: combo.maskUrl,
                }
            })),

            setHasHydrated: (state) => set({ _hasHydrated: state }),
        }),
        {
            name: 'hair-dev-storage',
            partialize: (state) => ({
                isEnabled: state.isEnabled,
                debugRaycast: state.debugRaycast,
                DEV_CONFIG: state.DEV_CONFIG,
                bustCombos: state.bustCombos,
            }),
            onRehydrateStorage: () => (state) => {
                state?.setHasHydrated(true);
            },
        }
    )
);