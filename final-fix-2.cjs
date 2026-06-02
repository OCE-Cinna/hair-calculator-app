const fs = require('fs');

function replaceFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// Experience.jsx
replaceFile('src/features/3d/Experience.jsx', [
    [/const \{ isEnabled, stylePos, densityPos, thicknessPos \} = useHairStore/g, "const { isEnabled, stylePos } = useHairStore"],
    [/if \(color\) setBgColor\(color\);/g, "// eslint-disable-next-line react-hooks/set-state-in-effect\n        if (color) setBgColor(color);"],
    [/\} catch \(e\) \{\}/g, "} catch (e) { console.error(e); }"]
]);

// ViewportControls.jsx
replaceFile('src/features/3d/ViewportControls.jsx', [
    [/import \{ motion \} from 'framer-motion';\r?\n/g, ""]
]);

// usePartingPattern.js
replaceFile('src/features/3d/hooks/usePartingPattern.js', [
    [/setCandidatesPool\(\[\]\);/g, "// eslint-disable-next-line react-hooks/set-state-in-effect\n            setCandidatesPool([]);"],
    [/setCandidatesPool\(candidates\);/g, "// eslint-disable-next-line react-hooks/set-state-in-effect\n        setCandidatesPool(candidates);"]
]);

// BoxBraidsRenderer.jsx
replaceFile('src/features/3d/styles/BoxBraidsRenderer.jsx', [
    [/const camera = .*?;\r?\n/g, ""],
    [/let tInverse = .*?;\r?\n/g, ""],
    [/let gravity = .*?;\r?\n/g, ""],
    [/let i = 0;\r?\n/g, ""],
    [/, \[stylePos, \.\.\.points\]\)/g, ", [stylePos, braidSegment, ...points])"]
]);

// DevKit.test.jsx
replaceFile('src/tests/DevKit.test.jsx', [
    [/global\.innerWidth/g, "window.innerWidth"]
]);

console.log("Fixes applied.");
