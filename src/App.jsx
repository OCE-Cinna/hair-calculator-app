import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Github, Info, Sun, Moon, Monitor, ChevronDown, ChevronUp, Settings, Layers, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { useHairStore } from './stores/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Experience } from './features/3d/Experience';
import { calculateHairPacks } from './utils/calculator';
import { HairPacksPanel } from './features/calculator/HairPacksPanel';
import { INITIAL_PRESETS, parsePresetFilename } from './constants/presets';
import { PresetGallery } from './components/PresetGallery';
import { DevKit } from './features/devkit/DevKit';
import { useDevStore } from './stores/devStore';
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
      ? `/presets/${p.image.replace(/^\//, '')}`
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
        {/* DESKTOP LAYOUT (lg+): sidebar + presets + 3D + form side by side */}
        {/* ============================================================ */}
        <div className="relative z-10 hidden lg:flex landscape:flex gap-3 p-3 w-full h-full overflow-hidden">

          {/* LEFT sidebar */}
          <LeftSidebar
            onOpenMenu={() => setMenuOpen(true)}
            presetsOpen={presetsOpen}
            onTogglePresets={() => setPresetsOpen(v => !v)}
          />

          {/* PRESET panel — second column, slides in/out */}
          <AnimatePresence initial={false}>
            {presetsOpen && (
              <PresetPanel
                presets={allPresets}
                onSelectPreset={handleSelectPreset}
                activePresetId={activePresetId}
              />
            )}
          </AnimatePresence>

          {/* 3D viewport — flexibly fills remaining space */}
          <motion.div
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ 
              layout: { duration: 0.28, ease: [0.22, 1, 0.36, 1] },
              default: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
            }}
            className="flex-1 min-w-[150px] lg:min-w-[300px] h-full bg-glass-panel glass-responsive border border-border-glass rounded-3xl overflow-hidden shadow-glass relative"
          >
            <Experience />
          </motion.div>

          {/* Form + result — fixed width column so it never gets pushed off screen */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="w-[300px] sm:w-[340px] xl:w-[400px] shrink-0 h-full flex flex-col gap-3"
          >
            <HairPacksPanel />
          </motion.div>
        </div>

        {/* ============================================================ */}
        {/* MOBILE LAYOUT (< lg): stacked vertical — 3D on top, form below */}
        {/* ============================================================ */}
        <div className="relative z-10 lg:hidden landscape:hidden flex flex-col w-full h-full">

          {/* Mobile top header */}
          <div className="flex items-center justify-between px-4 py-3 bg-glass-header backdrop-blur-xl border-b border-border-glass shrink-0 z-30">
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

          {/* 3D Viewport — fixed height on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="w-full shrink-0 bg-glass-panel border-b border-border-glass overflow-hidden shadow-glass relative"
            style={{ height: '44dvh' }}
          >
            <Experience />
          </motion.div>

          {/* Scrollable form panel */}
          <div className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="border-b border-border-glass-strong bg-glass-panel/30">
              <PresetGallery
                presets={allPresets}
                onSelectPreset={handleSelectPreset}
                activePresetId={activePresetId}
                isVisible={presetsOpen}
                onToggle={() => setPresetsOpen(v => !v)}
              />
            </div>
            <div className="p-3 pb-6">
              <HairPacksPanel />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
