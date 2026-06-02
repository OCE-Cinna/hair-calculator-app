import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { CONFIG_MAPS } from '../constants/hairConfig';

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

            // Viewport UI Settings
            showScalpPattern: false,
            showBraids: true,
            showOnlyRoots: false,
            lightingMode: 'natural', // 'natural', 'studio', 'moody'

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

            // Viewport Settings Setters
            setShowScalpPattern: (val) => set({ showScalpPattern: val }),
            setShowBraids: (val) => set({ showBraids: val }),
            setShowOnlyRoots: (val) => set({ showOnlyRoots: val }),
            setLightingMode: (val) => set({ lightingMode: val }),

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
