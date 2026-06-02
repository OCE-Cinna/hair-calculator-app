const fs = require('fs');

function replaceFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// usePartingPattern.js
replaceFile('src/features/3d/hooks/usePartingPattern.js', [
    [/import \{ useRef, useState, useEffect, useMemo \} from 'react';/, "import { useState, useEffect, useMemo } from 'react';"],
    [/const poolRef = useRef\(\[\]\);\r?\n\s*const \[poolKey, setPoolKey\] = useState\(0\);/, "const [candidatesPool, setCandidatesPool] = useState([]);"],
    [/if \(poolRef\.current\.length > 0\) \{\r?\n\s*poolRef\.current = \[\];\r?\n\s*setPoolKey\(k => k \+ 1\);\r?\n\s*\}/g, "setCandidatesPool([]);"],
    [/poolRef\.current = candidates;\r?\n\s*setPoolKey\(k => k \+ 1\);/, "setCandidatesPool(candidates);"],
    [/const candidates = poolRef\.current;\r?\n\s*if \(candidates\.length === 0\)/, "if (candidatesPool.length === 0)"],
    [/const currentCandidates = candidatesRef\.current \|\| candidates;/g, "const currentCandidates = candidatesPool;"],
    [/, \[poolKey, /, ", [candidatesPool, "]
]);

// HeadModel.jsx
replaceFile('src/features/3d/HeadModel.jsx', [
    [/import \{ useGLTF, useTexture \} from '@react-three\/drei';/, "import { useGLTF, useTexture } from '@react-three/drei';\nimport * as THREE from 'three';"]
]);

// ViewportControls.jsx
replaceFile('src/features/3d/ViewportControls.jsx', [
    [/import \{ motion \} from 'framer-motion';\r?\n/, ""]
]);

// DevKit.jsx
replaceFile('src/features/devkit/DevKit.jsx', [
    [/import \{ AnimatePresence, motion \} from 'framer-motion';/, "import { AnimatePresence } from 'framer-motion';"]
]);

// BoxBraidsRenderer.jsx
replaceFile('src/features/3d/styles/BoxBraidsRenderer.jsx', [
    [/\[stylePos, \.\.\.points\]/g, "[stylePos, braidSegment, ...points]"]
]);

console.log("Fixes applied.");
