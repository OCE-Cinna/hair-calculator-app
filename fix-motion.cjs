const fs = require('fs');

function addMotion(filePath) {
    if (!fs.existsSync(filePath)) return;
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('framer-motion')) {
        content = content.replace(/import \{.*?AnimatePresence.*?\} from 'framer-motion';/, "import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars");
        content = content.replace(/\/\/ eslint-disable-next-line no-unused-vars\nimport \{ motion, AnimatePresence \} from 'framer-motion';/, "import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars");
        if (!content.includes('motion } from')) {
            // maybe it was fully removed
             if (!content.includes('framer-motion')) {
                 content = "import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars\n" + content;
             }
        }
    } else {
        content = "import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars\n" + content;
    }
    fs.writeFileSync(filePath, content, 'utf8');
}

addMotion('src/App.jsx');
addMotion('src/features/devkit/DevKit.jsx');
addMotion('src/features/3d/ViewportControls.jsx');
addMotion('src/features/calculator/HairPacksPanel.jsx');
addMotion('src/layouts/PresetPanel.jsx');

