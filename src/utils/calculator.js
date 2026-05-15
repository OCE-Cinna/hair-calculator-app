/**
 * Calculates estimated hair packs based on validated formula:
 * (style + thickness + density) * length * 0.95
 * 
 * @param {number} style - Base complexity coefficient
 * @param {number} thickness - Strand size multiplier
 * @param {number} density - Scalp coverage multiplier
 * @param {number} length - Hair extension consumption factor
 * @returns {number} Estimated packs
 */
export const calculateHairPacks = (style, thickness, density, length) => {
    return (style + thickness + density) * length * 0.95;
};