import { create } from 'zustand';

/**
 * Centralized state management for hair customization parameters
 * Using Zustand for global store
 */

export const useHairStore = create((set, get) => ({
    // ===== STATE =====
    stylePos: 2,
    thicknessPos: 4,
    lengthPos: 3,
    densityPos: 4,

    // ===== DATA MAPS (exported from original App.jsx) =====
    styleMap: {
        1: ['Knotless Braids', 1],
        2: ['Box Braids', 3],
        3: ['Twist', 4],
        4: ['Locs', 5],
    },

    thicknessMap: {
        1: ['Micro', 0.5],
        2: ['Small', 0.7],
        3: ['Smedium', 0.8],
        4: ['Medium', 1.0],
        5: ['Large', 2.0],
        6: ['Jumbo', 3.0],
    },

    lengthMap: {
        1: ['Ear', 0.5],
        2: ['Neck', 0.7],
        3: ['Shoulder', 1.0],
        4: ['Mid-back', 1.2],
        5: ['Waist', 1.5],
        6: ['Hip', 2.0],
    },

    densityMap: {
        1: ['12', 0.5],
        2: ['24', 0.8],
        3: ['40', 0.95],
        4: ['80', 1.0],
        5: ['100', 2.0],
        6: ['200', 3.0],
        7: ['300+', 4.0],
    },

    // ===== ACTIONS =====
    setStylePos: (stylePos) => set({ stylePos }),
    setThicknessPos: (thicknessPos) => set({ thicknessPos }),
    setLengthPos: (lengthPos) => set({ lengthPos }),
    setDensityPos: (densityPos) => set({ densityPos }),

    /**
     * Apply preset values (from parsePresetFilename result)
     */
    applyPreset: (preset) =>
        set({
            stylePos: preset.stylePos,
            thicknessPos: preset.thicknessPos,
            lengthPos: preset.lengthPos,
            densityPos: preset.densityPos,
        }),

    // ===== SELECTORS (COMPUTED) =====
    /**
     * Calculate estimated hair packs needed
     * Formula: (style + thickness + density) x length x 0.95
     */
    calculatePacks: () => {
        const state = get();
        const style = state.styleMap[state.stylePos][1];
        const thickness = state.thicknessMap[state.thicknessPos][1];
        const length = state.lengthMap[state.lengthPos][1];
        const density = state.densityMap[state.densityPos][1];
        return ((style + thickness + density) * length) * 0.95;
    },

    /**
     * Get current selection labels for display
     */
    getSelections: () => {
        const state = get();
        return {
            style: state.styleMap[state.stylePos][0],
            thickness: state.thicknessMap[state.thicknessPos][0],
            length: state.lengthMap[state.lengthPos][0],
            density: state.densityMap[state.densityPos][0],
        };
    },
}));
