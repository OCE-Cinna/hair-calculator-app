import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
                calibrationFactor: 0.95,
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
