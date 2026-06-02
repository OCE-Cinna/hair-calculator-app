import React, { useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import './App.css';
import { useHairStore } from './stores/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Experience } from './features/3d/Experience';
import { HairPacksPanel } from './features/calculator/HairPacksPanel';
import { INITIAL_PRESETS } from './constants/presets';
import { PresetGallery } from './components/PresetGallery';
import { DevKit } from './features/devkit/DevKit';
import { BurgerMenu } from './components/ui/BurgerMenu';
import { ThemeSwitcher } from './components/ui/ThemeSwitcher';
import { LeftSidebar } from './layouts/LeftSidebar';
import { PresetPanel } from './layouts/PresetPanel';

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);
  const [presetsOpen, setPresetsOpen] = useState(true);
  const { customPresets, setStylePos, setThicknessPos, setLengthPos, setDensityPos, theme, _hasHydrated } = useHairStore(useShallow(state => ({
    customPresets: state.customPresets,
    setStylePos: state.setStylePos,
    setThicknessPos: state.setThicknessPos,
    setLengthPos: state.setLengthPos,
    setDensityPos: state.setDensityPos,
    theme: state.theme,
    _hasHydrated: state._hasHydrated
  })));

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.classList.toggle('dark', isDark);
  }, [theme]);

  if (!_hasHydrated) return null;

  const allPresets = [...INITIAL_PRESETS, ...(customPresets || [])].map(p => ({
    ...p,
    image: p.image && !p.image.startsWith('http') && !p.image.startsWith('/presets/') && !p.image.startsWith('data:')
      ? /presets/ + p.image.replace(/^\//, '')
      : p.image
  }));

  const handleSelectPreset = (preset, parsed) => {
    setActivePresetId(preset.id);
    setStylePos(preset.stylePos || parsed.stylePos);
    setThicknessPos(preset.thicknessPos || parsed.thicknessPos);
    setLengthPos(preset.lengthPos || parsed.lengthPos);
    setDensityPos(preset.densityPos || parsed.densityPos);
  };

  return (
    <>
      <BurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
      <DevKit />

      <div className="bg-app-main h-[100dvh] flex overflow-hidden font-sans relative transition-colors duration-500">
        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-brand rounded-full mix-blend-orb filter blur-[120px] opacity-orb-low" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[var(--color-skin-fallback)] rounded-full mix-blend-orb filter blur-[150px] opacity-orb-mid" />
        </div>

        {/* ============================================================ */}
        {/* UNIFIED RESPONSIVE LAYOUT */}
        {/* ============================================================ */}
        <div className="relative z-10 flex flex-col lg:flex-row landscape:flex-row gap-0 lg:gap-3 landscape:gap-3 p-0 lg:p-3 landscape:p-3 w-full h-full overflow-hidden">
          
          {/* MOBILE HEADER */}
          <div className="lg:hidden landscape:hidden flex items-center justify-between px-4 py-3 bg-glass-header backdrop-blur-xl border-b border-border-glass shrink-0 z-30">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 rounded-xl bg-glass-hover text-text-muted active:scale-95 transition-all"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex flex-col items-center">
              <span className="font-black text-text-base tracking-tight text-sm leading-none">Cinna's PAH</span>
              <span className="text-brand text-[10px] font-bold uppercase tracking-widest leading-none mt-0.5">Visualizer</span>
            </div>
            <ThemeSwitcher />
          </div>

          {/* DESKTOP SIDEBAR */}
          <div className="hidden lg:flex landscape:flex shrink-0">
            <LeftSidebar
              onOpenMenu={() => setMenuOpen(true)}
              presetsOpen={presetsOpen}
              onTogglePresets={() => setPresetsOpen(v => !v)}
            />
          </div>

          {/* DESKTOP PRESETS */}
          <div className="hidden lg:flex landscape:flex shrink-0">
            <AnimatePresence initial={false}>
              {presetsOpen && (
                <PresetPanel
                  presets={allPresets}
                  onSelectPreset={handleSelectPreset}
                  activePresetId={activePresetId}
                />
              )}
            </AnimatePresence>
          </div>

          {/* SHARED 3D VIEWPORT */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              default: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
            }}
            className="w-full lg:w-auto landscape:w-auto h-[44dvh] lg:h-full landscape:h-full shrink-0 flex-none lg:flex-1 landscape:flex-1 min-w-[150px] lg:min-w-[300px] bg-glass-panel glass-responsive border-b lg:border border-border-glass rounded-none lg:rounded-3xl landscape:rounded-3xl overflow-hidden shadow-glass relative z-10"
          >
            <Experience />
          </motion.div>

          {/* UNIFIED FORM COLUMN */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 w-full lg:w-[300px] xl:w-[400px] landscape:w-[300px] xl:landscape:w-[400px] shrink-0 flex flex-col gap-0 lg:gap-3 landscape:gap-3 overflow-y-auto overflow-x-hidden overscroll-none touch-pan-y z-10"
            style={{ WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}
          >
            {/* Mobile Preset Gallery */}
            <div className="lg:hidden landscape:hidden border-b border-border-glass-strong bg-glass-panel/30 shrink-0">
              <PresetGallery
                presets={allPresets}
                onSelectPreset={handleSelectPreset}
                activePresetId={activePresetId}
                isVisible={presetsOpen}
                onToggle={() => setPresetsOpen(v => !v)}
              />
            </div>

            {/* Hair Packs Panel */}
            <div className="p-3 pb-6 lg:p-0 landscape:p-0 flex-1 flex flex-col">
              <HairPacksPanel />
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}
