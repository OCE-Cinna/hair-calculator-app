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
