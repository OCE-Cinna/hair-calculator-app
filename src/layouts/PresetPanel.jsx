import { motion, AnimatePresence } from 'framer-motion'; // eslint-disable-line no-unused-vars
import React from 'react';

import { parsePresetFilename } from '../constants/presets';

export const PresetPanel = ({ presets, onSelectPreset, activePresetId }) => (
  <motion.aside
    key="preset-panel"
    initial={{ width: 0, opacity: 0 }}
    animate={{ width: 192, opacity: 1 }}
    exit={{ width: 0, opacity: 0 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className="hidden lg:flex landscape:flex absolute lg:relative left-[88px] lg:left-auto top-3 lg:top-auto bottom-3 lg:bottom-auto z-20 lg:z-auto flex-col gap-3 py-5 px-3 bg-glass glass-responsive border border-border-glass rounded-3xl shadow-glass transition-colors duration-500 shrink-0 overflow-hidden"
    style={{ minWidth: 0 }}
  >
    <div className="shrink-0">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-faintest mb-0.5 whitespace-nowrap">Style</p>
      <h3 className="text-xs font-bold text-text-base whitespace-nowrap">Presets</h3>
    </div>
    <div className="w-full h-px bg-divider-faint shrink-0" />
    {/* Scroll area wrapper with rounded edges to softly clip scrolling items */}
    <div className="relative flex-1 min-h-0 rounded-2xl overflow-hidden">
      <div
        className="flex flex-col gap-3 overflow-y-auto h-full px-2 pt-2 pb-8"
        style={{ scrollbarWidth: 'none' }}
      >
        {presets.map(preset => {
          const isActive = activePresetId === preset.id;
          const parsed = parsePresetFilename(preset.id);
          return (
            <button
              key={preset.id}
              onClick={() => onSelectPreset(preset, parsed)}
              className={`relative w-full rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 shrink-0 ${isActive ? 'ring-2 ring-brand scale-[1.02]' : 'ring-1 ring-white/10 hover:scale-[1.01] hover:ring-white/20'}`}
              style={{ aspectRatio: '3/4' }}
            >
              {preset.image
                ? <img src={preset.image} alt={preset.label} className="absolute inset-0 w-full h-full object-cover object-top" />
                : <div className={`absolute inset-0 bg-gradient-to-b ${preset.bgGradient}`} />
              }
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
              {isActive && <div className="absolute top-2 right-2 bg-brand text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">Active</div>}
              <div className="absolute bottom-0 left-0 right-0 p-2.5 text-left">
                <p className="text-white font-semibold text-xs leading-tight">{preset.label}</p>
                <p className="text-white/60 text-[10px] mt-0.5">{preset.sublabel}</p>
              </div>
            </button>
          );
        })}
    </div>
    </div>
  </motion.aside>
);

