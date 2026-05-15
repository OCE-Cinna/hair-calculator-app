import React, { useState, useEffect } from 'react';
import { Menu, X, Sparkles, Github, Info, Sun, Moon, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import './App.css';
import { useHairStore } from './store/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Experience } from './components/Experience';
import { calculateHairPacks } from './utils/calculator';
import { AssetManager } from './components/AssetManager';
import { INITIAL_PRESETS } from './constants/presets';
import { PresetGallery } from './components/PresetGallery';

// ============================================================
// BURGER MENU
// ============================================================
const BurgerMenu = ({ isOpen, onClose }) => (
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
// UI COMPONENTS
// ============================================================
// ============================================================
// UI COMPONENTS (Compound Component Pattern)
// ============================================================
const ControlCard = ({ title, children, className = '' }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`p-6 sm:p-8 flex flex-col space-y-6 bg-glass-panel glass-responsive border border-border-glass rounded-3xl shadow-glass transition-all duration-500 ${className}`}
  >
    {title && (
      <h2 className="text-xl sm:text-2xl font-black text-text-base mb-2 transition-colors">
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
    className={`mb-8 w-full ${className}`}
  >
    {title && (
      <label className="text-xl font-bold text-text-highlight mb-4 block transition-colors">
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
          className={`grow py-4 px-1.5 text-center font-bold text-xs rounded-md cursor-pointer transition-all duration-300 whitespace-nowrap ${value === opt.id
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
      <div className="flex justify-between items-center mb-4">
        <span className="text-xl font-black text-brand drop-shadow-sm">{currentValueLabel}</span>
        {buttonLabels && (
          <div className="flex space-x-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={decrement}
              className="px-4 py-3 bg-glass-hover backdrop-blur-sm text-text-highlight border border-divider rounded-lg shadow-sm transition duration-200 cursor-pointer hover:bg-glass-panel hover:border-border-glass-strong font-medium min-w-[48px]"
              aria-label={`Decrease ${id}`}
            >
              {buttonLabels[0]}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              type="button"
              onClick={increment}
              className="px-4 py-3 bg-glass-hover backdrop-blur-sm text-text-highlight border border-divider rounded-lg shadow-sm transition duration-200 cursor-pointer hover:bg-glass-panel hover:border-border-glass-strong font-medium min-w-[48px]"
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
          className="absolute appearance-none w-full h-10 bg-transparent cursor-grab z-10
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

  const styleVal = STYLE_MAP[stylePos]?.[1] || 1.0;
  const thicknessVal = THICKNESS_MAP[thicknessPos]?.[1] || 1.0;
  const lengthVal = LENGTH_MAP[lengthPos]?.[1] || 1.0;
  const densityVal = DENSITY_MAP[densityPos]?.[1] || 1.0;

  const packsResult = calculateHairPacks(styleVal, thicknessVal, densityVal, lengthVal);
  const handleSlider = (setter) => (e) => setter(Number(e.target.value));

  return (
    <div className="flex flex-col lg:flex-row p-6 gap-6 items-stretch">
      {/* 3D Viewport - Floating Card */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="flex-1 min-h-[500px] lg:min-h-0 relative bg-glass-panel glass-responsive rounded-3xl overflow-hidden border border-border-glass shadow-glass transition-all duration-500"
      >
        <Experience />
      </motion.div>

      {/* Controls panel - Compound Components */}
      <ControlCard title="Hair Customization" className="flex-1 lg:max-h-[850px] overflow-y-auto">
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

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pt-4 sm:pt-6 border-t border-divider text-text-muted mt-2 sm:mt-4 flex justify-between items-center bg-glass-panel-muted p-3 sm:p-4 rounded-xl border border-divider-faint transition-colors shadow-sm"
        >
          <div>
            <h3 className="text-lg font-bold mb-1">Estimated Hair Packs</h3>
            <p className="text-sm text-text-faint font-medium">Est: {packsResult.toFixed(2)} packs</p>
          </div>
          <div className="text-right">
            <AnimatePresence mode="wait">
              <motion.p 
                key={Math.round(packsResult)}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 1.2, opacity: 0 }}
                className="text-3xl sm:text-5xl font-black text-brand drop-shadow-sm"
              >
                {Math.round(packsResult)} <span className="text-sm sm:text-xl font-bold text-text-muted">packs</span>
              </motion.p>
            </AnimatePresence>
          </div>
        </motion.div>
      </ControlCard>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================
export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);
  const [galleryVisible, setGalleryVisible] = useState(true);
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
      <AssetManager />

      <div className="bg-app-main min-h-screen p-4 sm:p-8 flex justify-center items-start font-sans relative overflow-hidden transition-colors duration-500">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand rounded-full mix-blend-orb filter blur-[120px] opacity-orb-low" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] bg-[var(--color-skin-fallback)] rounded-full mix-blend-orb filter blur-[150px] opacity-orb-mid" />
          <div className="absolute top-[40%] left-[30%] w-[40vw] h-[40vw] bg-[var(--color-brand)] rounded-full mix-blend-orb filter blur-[100px] opacity-orb-low" />
        </div>

        <div className="relative z-10 max-w-7xl w-full my-4 flex flex-col transition-all duration-500">
          <header className="p-5 bg-glass backdrop-blur-2xl border border-border-glass rounded-3xl shadow-glass flex items-center justify-between mb-4">
            <button onClick={() => setMenuOpen(true)} className="flex items-center space-x-2 text-text-muted hover:text-text-base transition-colors group">
              <div className="p-2 rounded-xl group-hover:bg-glass-hover transition-colors border border-transparent group-hover:border-border-glass-strong">
                <Menu className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium hidden sm:inline tracking-wide">MENU</span>
            </button>
            <div className="text-center flex-1">
              <span className="text-text-base font-black text-2xl leading-tight tracking-tight drop-shadow-sm transition-colors">Cinna's PAH</span>
              <span className="text-brand font-bold text-xs tracking-widest uppercase opacity-90 drop-shadow-sm block mt-1">Protective Afro-Hairstyle Visualizer</span>
            </div>
            <ThemeSwitcher />
          </header>

          <div className="bg-glass backdrop-blur-2xl border border-border-glass rounded-3xl shadow-glass mb-4 overflow-hidden">
            <PresetGallery
              presets={allPresets}
              onSelectPreset={handleSelectPreset}
              activePresetId={activePresetId}
              isVisible={galleryVisible}
              onToggle={() => setGalleryVisible(!galleryVisible)}
            />
          </div>

          <div className="flex-grow">
            <AppContent />
          </div>

          <footer className="p-5 bg-glass backdrop-blur-2xl border border-border-glass rounded-3xl shadow-glass text-center text-sm flex justify-center space-x-6 mt-4 transition-colors duration-500">
            {[
              ['About this project', () => setMenuOpen(true)],
              ['Github Repository', 'https://github.com/OCE-Cinna/hair-calculator-app'],
            ].map(([label, action], i, arr) => (
              <React.Fragment key={label}>
                {typeof action === 'string' ? (
                  <a href={action} target="_blank" rel="noopener noreferrer" className="text-text-faint hover:text-brand font-medium transition duration-200">{label}</a>
                ) : (
                  <button onClick={action} className="text-text-faint hover:text-brand font-medium transition duration-200">{label}</button>
                )}
                {i < arr.length - 1 && <span className="text-text-faintest">•</span>}
              </React.Fragment>
            ))}
          </footer>
        </div>
      </div>
    </>
  );
}
