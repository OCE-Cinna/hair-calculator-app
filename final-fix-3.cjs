const fs = require('fs');

function replaceFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// 1. compress-glb.js
replaceFile('scripts/compress-glb.js', [
    [/^/, "/* eslint-env node */\n"]
]);

// 2. App.jsx
replaceFile('src/App.jsx', [
    [/import \{ motion, AnimatePresence \} from 'framer-motion';/, "// eslint-disable-next-line no-unused-vars\nimport { motion, AnimatePresence } from 'framer-motion';"]
]);

// 3. Experience.jsx
replaceFile('src/features/3d/Experience.jsx', [
    [/const \{ stylePos, lengthPos, densityPos, theme, thicknessPos \} = useHairStore\(useShallow\(state => \(\{\r?\n\s*stylePos: state\.stylePos,\r?\n\s*lengthPos: state\.lengthPos,\r?\n\s*densityPos: state\.densityPos,\r?\n\s*theme: state\.theme,\r?\n\s*thicknessPos: state\.thicknessPos\r?\n\s*\}\)\)\);/g, "const { theme } = useHairStore(useShallow(state => ({ theme: state.theme })));"],
    [/\} catch \(e\) \{\}/g, "} catch (e) { /* ignore */ }"]
]);

// 4. ViewportControls.jsx
replaceFile('src/features/3d/ViewportControls.jsx', [
    [/import \{ motion, AnimatePresence \} from 'framer-motion';/, "// eslint-disable-next-line no-unused-vars\nimport { motion, AnimatePresence } from 'framer-motion';"]
]);

// 5. BoxBraidsRenderer.jsx
replaceFile('src/features/3d/styles/BoxBraidsRenderer.jsx', [
    [/const \{ camera \} = useThree\(\);\r?\n/g, ""],
    [/const tInverse = 1\.0 - Math\.min\(0\.8, tScale \* 3\.5\);.*?\r?\n/g, ""],
    [/const gravity = new THREE\.Vector3\(0, -1, 0\);\r?\n/g, ""],
    [/let i = 0;\r?\n/g, ""]
]);

// 6. DevKit.test.jsx
replaceFile('src/tests/DevKit.test.jsx', [
    [/global\.innerWidth/g, "window.innerWidth"]
]);

// Clean up unused eslint-disable in usePartingPattern.js
replaceFile('src/features/3d/hooks/usePartingPattern.js', [
    [/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\r?\n\s*setCandidatesPool\(\[\]\);/g, "setCandidatesPool([]);"],
    [/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\r?\n\s*setCandidatesPool\(candidates\);/g, "setCandidatesPool(candidates);"]
]);

console.log("Fixes applied.");
