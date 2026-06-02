import React from 'react';
import { useHairStore } from '../../stores/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Grid, Scissors, AlignVerticalSpaceAround, Sun, Moon, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const ViewportControls = () => {
    const { 
        showScalpPattern, setShowScalpPattern,
        showBraids, setShowBraids,
        showOnlyRoots, setShowOnlyRoots,
        lightingMode, setLightingMode
    } = useHairStore(useShallow(state => ({
        showScalpPattern: state.showScalpPattern,
        setShowScalpPattern: state.setShowScalpPattern,
        showBraids: state.showBraids,
        setShowBraids: state.setShowBraids,
        showOnlyRoots: state.showOnlyRoots,
        setShowOnlyRoots: state.setShowOnlyRoots,
        lightingMode: state.lightingMode,
        setLightingMode: state.setLightingMode
    })));

    const lightingModes = ['natural', 'studio', 'moody'];
    const currentLightingIndex = lightingModes.indexOf(lightingMode);

    const toggleLighting = () => {
        const nextIndex = (currentLightingIndex + 1) % lightingModes.length;
        setLightingMode(lightingModes[nextIndex]);
    };

    return (
        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2 pointer-events-auto">
            {/* Viewport UI Controls Group */}
            <div className="bg-glass-panel glass-responsive backdrop-blur-md border border-border-glass rounded-2xl shadow-glass overflow-hidden flex flex-col p-1.5 gap-1.5">
                
                {/* Scalp Pattern Toggle */}
                <button
                    onClick={() => setShowScalpPattern(!showScalpPattern)}
                    className={`p-2.5 rounded-xl transition-all group relative flex items-center justify-center ${showScalpPattern ? 'bg-brand text-white shadow-md' : 'hover:bg-glass-hover text-text-faint hover:text-text-base'}`}
                    title="Toggle Parting Pattern"
                >
                    <Grid className="w-5 h-5" />
                </button>

                {/* Show Braids Toggle */}
                <button
                    onClick={() => setShowBraids(!showBraids)}
                    className={`p-2.5 rounded-xl transition-all group relative flex items-center justify-center ${showBraids ? 'bg-brand text-white shadow-md' : 'hover:bg-glass-hover text-text-faint hover:text-text-base'}`}
                    title="Toggle Braids Visibility"
                >
                    <Scissors className="w-5 h-5" />
                </button>

                {/* Show Only Roots Toggle (Only enabled if braids are shown) */}
                <button
                    onClick={() => setShowOnlyRoots(!showOnlyRoots)}
                    disabled={!showBraids}
                    className={`p-2.5 rounded-xl transition-all group relative flex items-center justify-center ${!showBraids ? 'opacity-30 cursor-not-allowed' : showOnlyRoots ? 'bg-brand/20 text-brand border border-brand/30 shadow-sm' : 'hover:bg-glass-hover text-text-faint hover:text-text-base'}`}
                    title="Toggle Root Segments Only"
                >
                    <AlignVerticalSpaceAround className="w-5 h-5" />
                </button>

                {/* Divider */}
                <div className="w-full h-px bg-divider-faint/50 shrink-0 my-0.5" />

                {/* Lighting Toggle */}
                <button
                    onClick={toggleLighting}
                    className="p-2.5 rounded-xl transition-all hover:bg-glass-hover text-text-faint hover:text-text-base"
                    title={`Lighting: ${lightingMode.charAt(0).toUpperCase() + lightingMode.slice(1)}`}
                >
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={lightingMode}
                            initial={{ opacity: 0, scale: 0.5, rotate: -45 }}
                            animate={{ opacity: 1, scale: 1, rotate: 0 }}
                            exit={{ opacity: 0, scale: 0.5, rotate: 45 }}
                            transition={{ duration: 0.2 }}
                            className="flex items-center justify-center text-text-base"
                        >
                            {lightingMode === 'natural' && <Sun className="w-5 h-5 text-amber-500" />}
                            {lightingMode === 'studio' && <Sparkles className="w-5 h-5 text-blue-400" />}
                            {lightingMode === 'moody' && <Moon className="w-5 h-5 text-indigo-400" />}
                        </motion.div>
                    </AnimatePresence>
                </button>
            </div>
        </div>
    );
};
