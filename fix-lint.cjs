const fs = require('fs');
const path = require('path');

function replaceFile(filePath, replacements) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    for (const [search, replace] of replacements) {
        content = content.replace(search, replace);
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

// DevKit.jsx
replaceFile('src/features/devkit/DevKit.jsx', [
    [/resetDevConfig,\r?\n/, ''],
    [/import { AnimatePresence } from 'framer-motion';/g, "import { AnimatePresence, motion } from 'framer-motion';"]
]);

// BoxBraidsRenderer.jsx
replaceFile('src/features/3d/styles/BoxBraidsRenderer.jsx', [
    [/const camera = useThree\(state => state\.camera\);/, ''],
    [/braidMaterial\.userData\.shader\.uniforms\.uTime\.value = time;/g, '// eslint-disable-next-line react-hooks/immutability\n            braidMaterial.userData.shader.uniforms.uTime.value = time;'],
    [/const gravityBiasStart = .*?;/, ''],
    [/const gravityIncrement = .*?;/, ''],
    [/let gravity = .*?;/, ''],
    [/let i = 0;/, ''],
    [/\} catch \(e\) \{/, '} catch (e) { console.error(e);']
]);

// usePartingPattern.js
replaceFile('src/features/3d/hooks/usePartingPattern.js', [
    [/for \(const candidate of candidates\) \{/g, 'const currentCandidates = candidatesRef.current || candidates;\n        for (const candidate of currentCandidates) {']
]);

// DevKit.test.jsx
replaceFile('src/tests/DevKit.test.jsx', [
    [/global\.innerWidth/g, 'window.innerWidth']
]);

console.log("Cleanup done.");
