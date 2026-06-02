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
    [/\/\* eslint-env node \*\//g, "/* global process */"]
]);

// 2. BoxBraidsRenderer.jsx
replaceFile('src/features/3d/styles/BoxBraidsRenderer.jsx', [
    [/import \{ useFrame, useThree \} from '@react-three\/fiber';/, "import { useFrame } from '@react-three/fiber';"],
    [/let i = 0;\r?\n/g, ""]
]);

// 3. DevKit.test.jsx
replaceFile('src/tests/DevKit.test.jsx', [
    [/global\.innerWidth/g, "window.innerWidth"]
]);

// Clean up unused eslint-disable in usePartingPattern.js
replaceFile('src/features/3d/hooks/usePartingPattern.js', [
    [/\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\r?\n\s*\/\/ eslint-disable-next-line react-hooks\/set-state-in-effect\r?\n/g, "// eslint-disable-next-line react-hooks/set-state-in-effect\n"]
]);

console.log("Fixes applied.");
