export const STYLE_ALIASES = {
    lock: 4, locs: 4, loc: 4,
    twist: 3, twists: 3,
    boxbraid: 1, box: 1, braid: 1,
    knotless: 2,
};

export const LENGTH_ALIASES = {
    hip: 6, waist: 5, midback: 4, 'mid-back': 4,
    shoulder: 3, neck: 2, ear: 1,
};

export const THICKNESS_ALIASES = {
    micro: 1, small: 2, smedium: 3,
    medium: 4, large: 5, jumbo: 6,
};

export const parsePresetFilename = (filename) => {
    const base = filename.replace(/\.[^.]+$/, '').toLowerCase();
    const parts = base.split('_');

    let lengthPos = 3;
    let thicknessPos = 4;
    let stylePos = 2;

    parts.forEach(part => {
        if (LENGTH_ALIASES[part] !== undefined) lengthPos = LENGTH_ALIASES[part];
        if (THICKNESS_ALIASES[part] !== undefined) thicknessPos = THICKNESS_ALIASES[part];
        if (STYLE_ALIASES[part] !== undefined) stylePos = STYLE_ALIASES[part];
    });

    const densityDefaults = { 1: 5, 2: 4, 3: 3, 4: 3, 5: 2, 6: 1 };
    const densityPos = densityDefaults[thicknessPos] || 4;

    return {
        lengthPos,
        thicknessPos,
        stylePos,
        densityPos,
        image: `/presets/${base}.jpg`
    };
};

export const INITIAL_PRESETS = [
    {
        id: 'hip_medium_lock',
        label: 'Hip Locs',
        sublabel: 'Medium · Hip Length',
        image: '/presets/hip_medium_lock.jpg',
        bgGradient: 'from-amber-950 to-stone-800',
    },
    {
        id: 'shoulder_micro_knotless',
        label: 'Knotless',
        sublabel: 'Micro · Shoulder',
        image: '/presets/shoulder_micro_knotless.jpg',
        bgGradient: 'from-teal-900 to-emerald-950',
    },
    {
        id: 'waist_small_boxbraid',
        label: 'Box Braids',
        sublabel: 'Small · Waist',
        image: '/presets/waist_small_boxbraid.jpg',
        bgGradient: 'from-purple-950 to-indigo-900',
    },
    {
        id: 'midback_jumbo_twist',
        label: 'Jumbo Twists',
        sublabel: 'Jumbo · Mid-Back',
        image: '/presets/midback_jumbo_twist.jpg',
        bgGradient: 'from-rose-950 to-red-900',
    },
    {
        id: 'ear_medium_twist',
        label: 'Bob Twists',
        sublabel: 'Medium · Ear',
        image: '/presets/ear_medium_twist.jpg',
        bgGradient: 'from-sky-950 to-blue-900',
    },
    {
        id: 'hip_large_twist',
        label: 'Long Twists',
        sublabel: 'Large · Hip',
        image: '/presets/hip_large_twist.jpg',
        bgGradient: 'from-lime-950 to-green-900',
    },
];