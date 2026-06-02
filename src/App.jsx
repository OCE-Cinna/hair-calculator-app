import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Github, Info, Sun, Moon, Monitor, ChevronDown, ChevronUp, Settings, Layers, Wand2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { useHairStore } from './store/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Experience } from './components/Experience';
import { calculateHairPacks } from './utils/calculator';
import { INITIAL_PRESETS, parsePresetFilename } from './constants/presets';
import { PresetGallery } from './components/PresetGallery';
import { StylistPanel } from './components/StylistPanel';
import { useDevStore } from './store/hairStore';

// ============================================================
// BURGER MENU
// ============================================================
const BurgerMenu = ({ isOpen, onClose }) => {
  const { isDevEnabled, setIsDevEnabled } = useDevStore(useShallow(state => ({
    isDevEnabled: state.isEnabled,
    setIsDevEnabled: state.setIsDevEnabled
  })));

  return (
    <>
      <div
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-md transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
        onClick={onClose}
      />
      <div
        className={`fixed top-0 left-0 z-50 h-full w-80 bg-glass-menu glass-responsive border-r border-divider-faint shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-divider-faint bg-glass-panel-muted transition-colors">
          <div>
            <span className="text-text-base font-bold text-lg tracking-tight">Cinna's PAH</span>
            <p className="text-brand mt-0.5 font-bold">Protective Afro-Hairstyle Visualizer</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-glass-hover transition-colors text-text-faint hover:text-text-base"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-text-muted text-sm leading-relaxed transition-colors">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Info className="h-4 w-4 text-brand shrink-0" />
              <h2 className="font-bold text-text-base uppercase tracking-widest text-xs">
                About this project
              </h2>
            </div>
            <p className="text-text-muted">
              <strong className="text-brand">Cinna's PAH</strong> is a 3D Protective Afro-Hairstyle
              Visualizer & Calculator with procedural hair placement using raycasting and UV texture masking.
            </p>
            <p className="text-text-muted mt-3">
              Rotate the 3D head model in real time, dial in your parameters using the sliders, and get an
              instant pack estimate. Hair strands are procedurally placed based on scalp texture patterns.
            </p>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-brand shrink-0" />
              <h2 className="font-bold text-text-base uppercase tracking-widest text-xs">How it works</h2>
            </div>
            <ol className="space-y-2 list-decimal list-inside text-text-muted">
              <li>Pick a <strong className="text-text-base">braid style</strong></li>
              <li>Set <strong className="text-text-base">thickness</strong> from Micro to Jumbo</li>
              <li>Choose your desired <strong className="text-text-base">length</strong></li>
              <li>Adjust <strong className="text-text-base">density</strong> (number of braids)</li>
              <li>Hair placement updates based on scalp texture masking</li>
            </ol>
          </section>

          {/* Stylist Mode Toggle */}
          <section className="pt-4 border-t border-divider-faint">
            <button
              onClick={() => {
                setIsDevEnabled(!isDevEnabled);
                if (window.navigator.vibrate) window.navigator.vibrate(10);
              }}
              className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all duration-300 ${isDevEnabled ? 'bg-brand/10 border-brand/40 text-brand' : 'bg-glass-hover border-divider-faint text-text-muted hover:border-divider'
                }`}
            >
              <div className="flex items-center gap-3">
                <Settings className={`w-5 h-5 ${isDevEnabled ? 'animate-spin-slow' : ''}`} />
                <div className="text-left">
                  <p className="font-bold text-sm">Stylist Mode</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">Calibration & Dev Kit</p>
                </div>
              </div>
              <div className={`w-10 h-5 rounded-full relative transition-colors ${isDevEnabled ? 'bg-brand' : 'bg-glass-input'}`}>
                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-transform ${isDevEnabled ? 'left-6' : 'left-1'}`} />
              </div>
            </button>
          </section>

          <section className="bg-glass-panel-muted rounded-xl p-4 border border-divider-faint transition-colors">
            <p className="text-xs text-text-faint leading-relaxed">
              <strong className="text-text-base">Calculation formula:</strong>
              <br />
              <code className="bg-glass-input px-1 py-0.5 rounded text-xs font-bold text-brand mt-1 inline-block">(style + thickness + density) x length x 0.95</code>
              <br />
              <br />
              Hair placement uses <strong className="text-text-highlight">raycasting + UV texture masking</strong>. Rays shot from above
              the head intersect with the scalp mesh; white pixels in the scalp texture spawn hair, black
              pixels create parting/skipped areas.
            </p>
          </section>

          <section>
            <h2 className="font-bold text-text-base uppercase tracking-widest text-xs mb-3">Tech stack</h2>
            <div className="flex flex-wrap gap-2">
              {['React 19', 'R3F', 'Zustand', 'Three.js', 'Tailwind CSS v4', 'Vite'].map(t => (
                <span key={t} className="px-2 py-1 bg-glass-hover border border-divider-faint rounded-md text-xs text-text-muted font-mono transition-colors">
                  {t}
                </span>
              ))}
            </div>
          </section>
        </div>

        <div className="px-6 py-4 border-t border-divider-faint bg-glass-panel-muted flex items-center justify-between">
        <span className="text-xs text-text-faintest">AGPLv3 License · Open Source</span>
        <a
          href="https://github.com/OCE-Cinna/hair-calculator-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-text-faint hover:text-brand transition-colors"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </div>
    </>
  );
};

const ThemeSwitcher = () => {
  const { theme, setTheme } = useHairStore();
  return (
    <div className="flex bg-glass-header p-1 rounded-xl backdrop-blur-md border border-border-glass shadow-sm">
      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`}><Sun className="w-4 h-4" /></button>
      <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`}><Monitor className="w-4 h-4" /></button>
      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`}><Moon className="w-4 h-4" /></button>
    </div>
  );
};

// ============================================================
// UI COMPONENTS (Compound Component Pattern)
// ============================================================
const ControlCard = ({ title, children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`p-4 sm:p-5 flex flex-col space-y-3 bg-glass-panel glass-responsive border border-border-glass rounded-3xl shadow-glass transition-all duration-500 ${className}`}
  >
    {title && (
      <h2 className="text-base font-black text-text-base transition-colors tracking-tight">
        {title}
      </h2>
    )}
    {children}
  </motion.div>
);

ControlCard.Section = ({ title, children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    className={`w-full ${className}`}
  >
    {title && (
      <label className="text-xs font-bold text-text-highlight mb-2 block uppercase tracking-widest transition-colors opacity-70">
        {title}
      </label>
    )}
    {children}
  </motion.div>
);

ControlCard.StyleSelector = ({ value, onChange, map }) => {
  const options = Object.keys(map).map(key => ({ id: Number(key), label: map[key][0] }));
  
  const handleSelect = (id) => {
    onChange(id);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  return (
    <div className="flex justify-between bg-glass-selector rounded-lg p-1 shadow-inner gap-1 border border-divider-faint transition-colors">
      {options.map(opt => (
        <motion.button
          key={opt.id}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={() => handleSelect(opt.id)}
          className={`grow py-2.5 px-1.5 text-center font-bold text-xs rounded-md cursor-pointer transition-all duration-300 whitespace-nowrap ${value === opt.id
            ? 'bg-brand text-white shadow-brand-subtle'
            : 'text-text-faint bg-transparent border-none hover:text-text-highlight hover:bg-glass-hover'
            }`}
        >
          {opt.label}
        </motion.button>
      ))}
    </div>
  );
};

ControlCard.Slider = ({ id, min, max, step, value, onChange, map, buttonLabels }) => {
  const labels = Object.keys(map).map(k => map[Number(k)][0]);
  const safeValue = Math.min(Math.max(value, min), max);
  const percentage = ((safeValue - min) / (max - min)) * 100;

  const handleVibrate = () => {
    if (window.navigator.vibrate) window.navigator.vibrate(2);
  };

  const decrement = () => {
    onChange({ target: { value: Math.max(min, value - step) } });
    handleVibrate();
  };
  const increment = () => {
    onChange({ target: { value: Math.min(max, value + step) } });
    handleVibrate();
  };

  const currentValueLabel = map[value]?.[0] || map[min]?.[0] || 'Unknown';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-2">
        <span className="text-base font-black text-brand drop-shadow-sm">{currentValueLabel}</span>
        {buttonLabels && (
          <div className="flex space-x-1.5">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={decrement}
              className="px-3 py-1.5 bg-glass-hover backdrop-blur-sm text-text-highlight border border-divider rounded-lg shadow-sm transition duration-200 cursor-pointer hover:bg-glass-panel hover:border-border-glass-strong font-medium text-xs"
              aria-label={`Decrease ${id}`}
            >
              {buttonLabels[0]}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={increment}
              className="px-3 py-1.5 bg-glass-hover backdrop-blur-sm text-text-highlight border border-divider rounded-lg shadow-sm transition duration-200 cursor-pointer hover:bg-glass-panel hover:border-border-glass-strong font-medium text-xs"
              aria-label={`Increase ${id}`}
            >
              {buttonLabels[1]}
            </motion.button>
          </div>
        )}
      </div>

      <div className="relative w-full h-10">
        <div className="absolute top-1/2 left-0 right-0 h-2 bg-glass-input border border-divider-faint transform -translate-y-1/2 rounded-full transition-colors" />
        <motion.div
          className="absolute top-1/2 left-0 h-2 bg-brand shadow-[0_2px_8_rgba(255,107,0,0.4)] transform -translate-y-1/2 rounded-full transition-all duration-100 ease-out"
          style={{ width: `${percentage}%` }}
          animate={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => {
            onChange(e);
            handleVibrate();
          }}
          aria-label={id}
          aria-valuetext={currentValueLabel}
          required
          className="absolute top-1/2 -translate-y-1/2 appearance-none w-full h-10 bg-transparent cursor-grab z-10
            [&::-webkit-slider-runnable-track]:h-0 [&::-moz-range-track]:h-0
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-brand [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.5)] [&::-webkit-slider-thumb]:mt-1
            [&::-moz-range-thumb]:h-8 [&::-moz-range-thumb]:w-8
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-brand
            [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:shadow-[0_0_10px_rgba(255,107,0,0.5)] active:cursor-grabbing"
        />
      </div>

      <div className="flex justify-between mt-3 text-sm text-text-faint font-bold transition-colors">
        {labels.map((label, i) => (
          <span key={i} className="text-center flex-1 px-1 whitespace-nowrap">
            {label.length > 3 ? label.replace(' ', '\u00a0') : label}
          </span>
        ))}
      </div>
    </div>
  );
};

// ============================================================
// APP CONTENT
// ============================================================
function AppContent() {
  const {
    stylePos, setStylePos,
    thicknessPos, setThicknessPos,
    lengthPos, setLengthPos,
    densityPos, setDensityPos,
    STYLE_MAP, THICKNESS_MAP, LENGTH_MAP, DENSITY_MAP,
  } = useHairStore(useShallow((state) => ({
    stylePos: state.stylePos,
    setStylePos: state.setStylePos,
    thicknessPos: state.thicknessPos,
    setThicknessPos: state.setThicknessPos,
    lengthPos: state.lengthPos,
    setLengthPos: state.setLengthPos,
    densityPos: state.densityPos,
    setDensityPos: state.setDensityPos,
    STYLE_MAP: state.STYLE_MAP,
    THICKNESS_MAP: state.THICKNESS_MAP,
    LENGTH_MAP: state.LENGTH_MAP,
    DENSITY_MAP: state.DENSITY_MAP,
  })));

  const { DEV_CONFIG } = useDevStore(useShallow(state => ({ DEV_CONFIG: state.DEV_CONFIG })));

  const styleVal = STYLE_MAP[stylePos]?.[1] || 1.0;
  const thicknessVal = THICKNESS_MAP[thicknessPos]?.[1] || 1.0;
  const lengthVal = LENGTH_MAP[lengthPos]?.[1] || 1.0;
  const densityVal = DENSITY_MAP[densityPos]?.[1] || 1.0;

  const packsResult = calculateHairPacks(styleVal, thicknessVal, densityVal, lengthVal, DEV_CONFIG.calibrationFactor);
  const handleSlider = (setter) => (e) => setter(Number(e.target.value));

  return (
    <div className="flex flex-col gap-3 h-full">
      <ControlCard title="Hair Customization" className="flex-1 min-h-0">
        <ControlCard.Section title="Braid Style">
          <ControlCard.StyleSelector value={stylePos} onChange={setStylePos} map={STYLE_MAP} />
        </ControlCard.Section>

        <ControlCard.Section title="Braid thickness">
          <ControlCard.Slider
            id="thickness"
            min={1}
            max={Object.keys(THICKNESS_MAP).length}
            step={1}
            value={thicknessPos}
            onChange={handleSlider(setThicknessPos)}
            map={THICKNESS_MAP}
            buttonLabels={['Smaller', 'Larger']}
          />
        </ControlCard.Section>

        <ControlCard.Section title="Braid length">
          <ControlCard.Slider
            id="length"
            min={1}
            max={Object.keys(LENGTH_MAP).length}
            step={1}
            value={lengthPos}
            onChange={handleSlider(setLengthPos)}
            map={LENGTH_MAP}
            buttonLabels={['Shorter', 'Longer']}
          />
        </ControlCard.Section>

        <ControlCard.Section title="Braid density">
          <ControlCard.Slider
            id="density"
            min={1}
            max={Object.keys(DENSITY_MAP).length}
            step={1}
            value={densityPos}
            onChange={handleSlider(setDensityPos)}
            map={DENSITY_MAP}
            buttonLabels={['Lower', 'Higher']}
          />
        </ControlCard.Section>
      </ControlCard>

      {/* Pack result */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-between bg-glass-panel glass-responsive border border-border-glass rounded-3xl shadow-glass px-5 py-4 transition-all duration-500 shrink-0"
      >
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-text-faint opacity-70 mb-0.5">Estimated</p>
          <h3 className="text-base font-black text-text-base">Hair Packs</h3>
          <p className="text-xs text-text-faint mt-0.5 font-medium">{packsResult.toFixed(2)} exact</p>
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={Math.round(packsResult)}
            initial={{ scale: 0.75, opacity: 0, y: 8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 1.15, opacity: 0, y: -8 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="text-right"
          >
            <span className="text-5xl sm:text-6xl font-black text-brand drop-shadow-sm tabular-nums">
              {Math.round(packsResult)}
            </span>
            <span className="ml-1.5 text-base font-bold text-text-muted">packs</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

// ============================================================
// LEFT SIDEBAR NAV
// ============================================================
const LeftSidebar = ({ onOpenMenu, presetsOpen, onTogglePresets }) => {
  const { isDevEnabled, setIsDevEnabled } = useDevStore(useShallow(state => ({
    isDevEnabled: state.isEnabled,
    setIsDevEnabled: state.setIsDevEnabled,
  })));

  const btnBase = 'p-2.5 rounded-xl border transition-all';
  const btnIdle = 'border-transparent text-text-faintest hover:text-text-base hover:bg-glass-hover hover:border-border-glass-strong';
  const btnActive = 'bg-brand/10 border-brand/30 text-brand';

  return (
    <aside className="hidden lg:flex flex-col items-center gap-3 py-5 px-3 bg-glass glass-responsive border border-border-glass rounded-3xl shadow-glass transition-colors duration-500 shrink-0 w-16">
      <div className="flex flex-col items-center gap-0.5 mb-1">
        <span className="text-brand font-black text-lg leading-none">C</span>
        <span className="text-text-faintest text-[8px] font-bold uppercase tracking-widest leading-none">PAH</span>
      </div>

      <div className="w-8 h-px bg-divider-faint" />

      {/* About / info */}
      <button onClick={onOpenMenu} className={`${btnBase} ${btnIdle}`} title="About">
        <Menu className="h-5 w-5" />
      </button>

      {/* Style presets toggle */}
      <button
        onClick={onTogglePresets}
        className={`${btnBase} ${presetsOpen ? btnActive : btnIdle}`}
        title={presetsOpen ? 'Hide presets' : 'Style presets'}
      >
        <Layers className="h-5 w-5" />
      </button>

      {/* Stylist Mode (DevKit) */}
      <button
        onClick={() => setIsDevEnabled(!isDevEnabled)}
        className={`${btnBase} ${isDevEnabled ? btnActive : btnIdle}`}
        title={isDevEnabled ? 'Stylist Mode on' : 'Stylist Mode'}
      >
        <Wand2 className="h-5 w-5" />
      </button>

      <div className="flex-1" />

      <ThemeSwitcherVertical />

      <a
        href="https://github.com/OCE-Cinna/hair-calculator-app"
        target="_blank"
        rel="noopener noreferrer"
        className={`${btnBase} ${btnIdle}`}
        title="GitHub"
      >
        <Github className="h-4 w-4" />
      </a>
    </aside>
  );
};

const ThemeSwitcherVertical = () => {
  const { theme, setTheme } = useHairStore();
  return (
    <div className="flex flex-col bg-glass-header p-1 rounded-xl border border-border-glass gap-0.5">
      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Light"><Sun className="w-4 h-4" /></button>
      <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="System"><Monitor className="w-4 h-4" /></button>
      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Dark"><Moon className="w-4 h-4" /></button>
    </div>
  );
};

// ============================================================
// PRESET PANEL — second column, collapsible
// ============================================================
const PresetPanel = ({ presets, onSelectPreset, activePresetId }) => (
  <motion.aside
    key="preset-panel"
    initial={{ width: 0, opacity: 0 }}
    animate={{ width: 192, opacity: 1 }}
    exit={{ width: 0, opacity: 0 }}
    transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    className="hidden lg:flex flex-col gap-3 py-5 px-3 bg-glass glass-responsive border border-border-glass rounded-3xl shadow-glass transition-colors duration-500 shrink-0 overflow-hidden"
    style={{ minWidth: 0 }}
  >
    <div className="shrink-0">
      <p className="text-[9px] font-black uppercase tracking-widest text-text-faintest mb-0.5 whitespace-nowrap">Style</p>
      <h3 className="text-xs font-bold text-text-base whitespace-nowrap">Presets</h3>
    </div>
    <div className="w-full h-px bg-divider-faint shrink-0" />
    {/* Scroll area with bottom fade to hint more content */}
    <div className="relative flex-1 min-h-0">
      <div
        className="flex flex-col gap-2 overflow-y-auto h-full pb-8"
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
      {/* Scroll fade — tells the user there's more below */}
      <div className="absolute bottom-0 left-0 right-0 h-14 bg-gradient-to-t from-[var(--color-glass-menu,rgba(0,0,0,0.4))] to-transparent pointer-events-none rounded-b-3xl" />
    </div>
  </motion.aside>
);

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
      <StylistPanel />

      <div className="bg-app-main h-screen flex overflow-hidden font-sans relative transition-colors duration-500">
        {/* Ambient orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-5%] w-[40vw] h-[40vw] bg-brand rounded-full mix-blend-orb filter blur-[120px] opacity-orb-low" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[50vw] h-[50vw] bg-[var(--color-skin-fallback)] rounded-full mix-blend-orb filter blur-[150px] opacity-orb-mid" />
        </div>

        {/* Layout: [left nav] [presets?] [3D] [form] */}
        <div className="relative z-10 flex gap-3 p-3 w-full h-full overflow-hidden">

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

          {/* 3D viewport — fills height, square-ish via aspect-square on height anchor */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="h-full aspect-square shrink-0 bg-glass-panel glass-responsive border border-border-glass rounded-3xl overflow-hidden shadow-glass relative"
          >
            <Experience />
          </motion.div>

          {/* Form + result — takes all remaining width */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-w-0 h-full flex flex-col gap-3"
          >
            <AppContent />
          </motion.div>

          {/* MOBILE header */}
          <div className="lg:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 py-3 bg-glass backdrop-blur-2xl border-b border-border-glass">
            <button onClick={() => setMenuOpen(true)} className="p-2 rounded-xl hover:bg-glass-hover text-text-muted hover:text-text-base transition-colors">
              <Menu className="h-5 w-5" />
            </button>
            <span className="font-black text-text-base tracking-tight">Cinna's PAH</span>
            <ThemeSwitcher />
          </div>
        </div>
      </div>
    </>
  );
}
