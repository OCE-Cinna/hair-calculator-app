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
    {
        id: 'ear_micro_twist',
        label: 'Micro Twists',
        sublabel: 'Micro · Ear Length',
        image: '/presets/ear_micro_twist.jpg',
        bgGradient: 'from-fuchsia-950 to-purple-900',
    },
    {
        id: 'ear_smedium-boxbraid',
        label: 'Bob Box Braids',
        sublabel: 'Smedium · Ear Length',
        image: '/presets/ear_smedium-boxbraid.jpg',
        bgGradient: 'from-slate-900 to-zinc-800',
    },
    {
        id: 'long_medium_lock',
        label: 'Long Locs',
        sublabel: 'Medium · Waist Length',
        image: '/presets/long_medium_lock.jpg',
        bgGradient: 'from-amber-900 to-orange-950',
    },
    {
        id: 'neck_medium_twist',
        label: 'Short Twists',
        sublabel: 'Medium · Neck Length',
        image: '/presets/neck_medium_twist.jpg',
        bgGradient: 'from-blue-950 to-cyan-900',
    },
    {
        id: 'neck_micro_lock',
        label: 'Micro Locs',
        sublabel: 'Micro · Neck Length',
        image: '/presets/neck_micro_lock.jpg',
        bgGradient: 'from-emerald-950 to-green-900',
    },
    {
        id: 'neck_smedium_boxbraid',
        label: 'Medium Box Braids',
        sublabel: 'Smedium · Neck Length',
        image: '/presets/neck_smedium_boxbraid.jpg',
        bgGradient: 'from-violet-950 to-purple-900',
    },
    {
        id: 'shoulder_medium_twist',
        label: 'Shoulder Twists',
        sublabel: 'Medium · Shoulder Length',
        image: '/presets/shoulder_medium_twist.jpg',
        bgGradient: 'from-pink-950 to-rose-900',
    },
    {
        id: 'shoulder_micro_lock',
        label: 'Sisterlocs',
        sublabel: 'Micro · Shoulder Length',
        image: '/presets/shoulder_micro_lock.jpg',
        bgGradient: 'from-stone-900 to-neutral-800',
    },
    {
        id: 'waist_jumbo_twist',
        label: 'Waist Twists',
        sublabel: 'Jumbo · Waist Length',
        image: '/presets/waist_jumbo_twist.jpg',
        bgGradient: 'from-orange-950 to-red-900',
    },
];
