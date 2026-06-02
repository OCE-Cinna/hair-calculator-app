/**
 * Calculates estimated hair packs based on validated formula:
 * (style + thickness + density) * length * 0.95
 * 
 * @param {number} style - Base complexity coefficient
 * @param {number} thickness - Strand size multiplier
 * @param {number} density - Scalp coverage multiplier
 * @param {number} length - Hair extension consumption factor
 * @param {number} factor - Normalization factor (default 0.95)
 * @returns {number} Estimated packs
 */
export const calculateHairPacks = (style, thickness, density, length, factor = 0.95) => {
    return (style + thickness + density) * length * factor;
};
