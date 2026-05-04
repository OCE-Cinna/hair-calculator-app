import React, { useState, useRef } from 'react';
import { Menu, X, ChevronLeft, ChevronRight, Sparkles, Github, Info } from 'lucide-react';
import './App.css';
import { useHairStore } from './store/hairStore';
import { Experience } from './components/Experience';

// ============================================================
// PRESET SYSTEM
// ============================================================

const STYLE_ALIASES = {
  lock: 4, locs: 4, loc: 4,
  twist: 3, twists: 3,
  boxbraid: 2, box: 2, braid: 2,
  knotless: 1,
};

const LENGTH_ALIASES = {
  hip: 6, waist: 5, midback: 4, 'mid-back': 4,
  shoulder: 3, neck: 2, ear: 1,
};

const THICKNESS_ALIASES = {
  micro: 1, small: 2, smedium: 3,
  medium: 4, large: 5, jumbo: 6,
};

const parsePresetFilename = (filename) => {
  const base = filename.replace(/\.[^.]+$/, '').toLowerCase();
  const parts = base.split('_');

  let lengthPos = 3;
  let thicknessPos = 4;
  let stylePos = 2;

  parts.forEach(part => {
    if (LENGTH_ALIASES[part] !== undefined) lengthPos = LENGTH_ALIASES[part];
    if (THICKNESS_ALIASES[part] !== undefined) thicknessPos = THICKNESS_ALIASES[part];
    if (STYLE_ALIASES[part] !== undefined) stylePos = STYLE_ALIASES[part];
  });

  const densityDefaults = { 1: 6, 2: 5, 3: 4, 4: 4, 5: 3, 6: 2 };
  const densityPos = densityDefaults[thicknessPos] || 4;

  return { lengthPos, thicknessPos, stylePos, densityPos };
};

const PRESETS = [
  {
    id: 'hip_medium_lock',
    label: 'Hip Locs',
    sublabel: 'Medium · Hip Length',
    image: '/hip_medium_lock.jpg',
    bgGradient: 'from-amber-950 to-stone-800',
  },
  {
    id: 'shoulder_micro_knotless',
    label: 'Knotless',
    sublabel: 'Micro · Shoulder',
    image: '/shoulder_micro_knotless.jpg',
    bgGradient: 'from-teal-900 to-emerald-950',
  },
  {
    id: 'waist_small_boxbraid',
    label: 'Box Braids',
    sublabel: 'Small · Waist',
    image: '/waist_small_boxbraid.jpg',
    bgGradient: 'from-purple-950 to-indigo-900',
  },
  {
    id: 'midback_jumbo_twist',
    label: 'Jumbo Twists',
    sublabel: 'Jumbo · Mid-Back',
    image: '/midback_jumbo_twist.jpg',
    bgGradient: 'from-rose-950 to-red-900',
  },
  {
    id: 'ear_medium_twist',
    label: 'Bob Twists',
    sublabel: 'Medium · Ear',
    image: '/ear_medium_twist.jpg',
    bgGradient: 'from-sky-950 to-blue-900',
  },
  {
    id: 'hip_large_twist',
    label: 'Long Twists',
    sublabel: 'Large · Hip',
    image: '/hip_large_twist.jpg',
    bgGradient: 'from-lime-950 to-green-900',
  },
];

// ============================================================
// BURGER MENU
// ============================================================

const BurgerMenu = ({ isOpen, onClose }) => (
  <>
    <div
      className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      onClick={onClose}
    />
    <div
      className={`fixed top-0 left-0 z-50 h-full w-80 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
    >
      <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 bg-gray-50">
        <div>
          <span className="text-gray-900 font-bold text-lg tracking-tight">Cinna's PAH</span>
          <p className="text-xs text-gray-400 mt-0.5">Protective Afro-Hairstyle Visualizer</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors text-gray-500 hover:text-gray-800"
          aria-label="Close menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-8 text-gray-700 text-sm leading-relaxed">
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Info className="h-4 w-4 text-gray-400 shrink-0" />
            <h2 className="font-semibold text-gray-800 uppercase tracking-widest text-xs">
              About this project
            </h2>
          </div>
          <p className="text-gray-600">
            <strong className="text-gray-800">Cinna's PAH</strong> is a 3D Protective Afro-Hairstyle
            Visualizer & Calculator with procedural hair placement using raycasting and UV texture masking.
          </p>
          <p className="text-gray-600 mt-3">
            Rotate the 3D head model in real time, dial in your parameters using the sliders, and get an
            instant pack estimate. Hair strands are procedurally placed based on scalp texture patterns.
          </p>
        </section>

        <section>
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="h-4 w-4 text-gray-400 shrink-0" />
            <h2 className="font-semibold text-gray-800 uppercase tracking-widest text-xs">How it works</h2>
          </div>
          <ol className="space-y-2 list-decimal list-inside text-gray-600">
            <li>Pick a <strong className="text-gray-800">braid style</strong></li>
            <li>Set <strong className="text-gray-800">thickness</strong> from Micro to Jumbo</li>
            <li>Choose your desired <strong className="text-gray-800">length</strong></li>
            <li>Adjust <strong className="text-gray-800">density</strong> (number of braids)</li>
            <li>Hair placement updates based on scalp texture masking</li>
          </ol>
        </section>

        <section className="bg-gray-50 rounded-xl p-4 border border-gray-100">
          <p className="text-xs text-gray-500 leading-relaxed">
            <strong className="text-gray-700">Calculation formula:</strong>
            <br />
            <code className="bg-gray-200 px-1 rounded text-xs">(style + thickness + density) x length x 0.95</code>
            <br />
            <br />
            Hair placement uses <strong>raycasting + UV texture masking</strong>. Rays shot from above
            the head intersect with the scalp mesh; white pixels in the scalp texture spawn hair, black
            pixels create parting/skipped areas.
          </p>
        </section>

        <section>
          <h2 className="font-semibold text-gray-800 uppercase tracking-widest text-xs mb-3">Tech stack</h2>
          <div className="flex flex-wrap gap-2">
            {['React 19', 'R3F', 'Zustand', 'Three.js', 'Tailwind CSS v4', 'Vite'].map(t => (
              <span key={t} className="px-2 py-1 bg-gray-100 rounded-md text-xs text-gray-600 font-mono">
                {t}
              </span>
            ))}
          </div>
        </section>
      </div>

      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between">
        <span className="text-xs text-gray-400">MIT License · Open Source</span>
        <a
          href="https://github.com/OCE-Cinna/hair-calculator-app"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-800 transition-colors"
        >
          <Github className="h-4 w-4" />
          GitHub
        </a>
      </div>
    </div>
  </>
);

// ============================================================
// PRESET CARD
// ============================================================

const PresetCard = ({ preset, isActive, onClick }) => {
  const parsed = parsePresetFilename(preset.id);

  return (
    <button
      onClick={() => onClick(preset, parsed)}
      className={`
        relative flex-shrink-0 w-44 h-56 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isActive
          ? 'ring-2 ring-offset-2 ring-gray-800 scale-[1.03] shadow-xl'
          : 'ring-1 ring-gray-200 hover:scale-[1.02] hover:shadow-lg'
        }
      `}
      aria-pressed={isActive}
      aria-label={`Load preset: ${preset.label}`}
    >
      {preset.image ? (
        <img
          src={preset.image}
          alt={preset.label}
          className="absolute inset-0 w-full h-full object-cover object-top"
          onError={(e) => {
            e.target.style.display = 'none';
          }}
        />
      ) : (
        <div className={`absolute inset-0 bg-gradient-to-b ${preset.bgGradient}`} />
      )}

      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `repeating-linear-gradient(
            170deg,
            transparent, transparent 3px,
            rgba(255,255,255,0.08) 3px, rgba(255,255,255,0.08) 4px
          )`,
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

      {isActive && (
        <div className="absolute top-2.5 right-2.5 bg-white text-gray-900 text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
          Active
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-3.5 text-left">
        <p className="text-white font-semibold text-sm leading-tight">{preset.label}</p>
        <p className="text-white/60 text-xs mt-0.5">{preset.sublabel}</p>
      </div>
    </button>
  );
};

// ============================================================
// PRESET GALLERY
// ============================================================

const PresetGallery = ({ onSelectPreset, activePresetId }) => {
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
  };

  return (
    <div className="border-b border-gray-100 bg-gray-50 px-8 py-5">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-widest">Style Presets</h3>
          <p className="text-xs text-gray-400 mt-0.5">Click to load settings instantly</p>
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => scroll(-1)}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Scroll left"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={() => scroll(1)}
            className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors shadow-sm"
            aria-label="Scroll right"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto pb-2 scroll-smooth"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {PRESETS.map(preset => (
          <PresetCard
            key={preset.id}
            preset={preset}
            isActive={activePresetId === preset.id}
            onClick={onSelectPreset}
          />
        ))}
      </div>
    </div>
  );
};

// ============================================================
// UI COMPONENTS
// ============================================================

function StyleSelector({ value, onChange, map }) {
  const options = Object.keys(map).map(key => ({ id: Number(key), label: map[key][0] }));

  return (
    <div className="mb-10 border-b border-gray-200 pb-6">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">Braid Style:</h3>
      <div className="flex justify-between bg-gray-200 rounded-lg p-1 shadow-inner gap-1">
        {options.map(opt => (
          <button
            key={opt.id}
            type="button"
            onClick={() => onChange(opt.id)}
            className={`grow py-3 px-1.5 text-center font-medium text-xs rounded-md cursor-pointer transition-all duration-200 whitespace-nowrap hover:text-gray-800 ${value === opt.id ? 'bg-white text-gray-800 shadow-md' : 'text-gray-600 bg-transparent border-none'
              }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function RangeSlider({ id, min, max, step, value, onChange, map, labelText, buttonLabels }) {
  const labels = Object.keys(map).map(k => map[Number(k)][0]);
  const percentage = ((value - min) / (max - min)) * 100;

  const decrement = () => onChange({ target: { value: Math.max(min, value - step) } });
  const increment = () => onChange({ target: { value: Math.min(max, value + step) } });

  return (
    <div className="mb-8 w-full">
      <div className="flex justify-between items-center mb-4">
        <label htmlFor={id} className="text-xl font-semibold text-gray-800">
          {labelText}:
        </label>
        <span className="text-xl font-bold text-gray-400 ml-3">{map[value][0]}</span>
        {buttonLabels && (
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={decrement}
              className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-md transition duration-150 cursor-pointer hover:bg-gray-100"
            >
              {buttonLabels[0]}
            </button>
            <button
              type="button"
              onClick={increment}
              className="px-4 py-2 bg-white text-gray-800 border border-gray-300 rounded-lg shadow-md transition duration-150 cursor-pointer hover:bg-gray-100"
            >
              {buttonLabels[1]}
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full h-8">
        <div className="absolute top-1/2 left-0 right-0 h-1 bg-gray-300 transform -translate-y-1/2 rounded-full" />
        <div
          className="absolute top-1/2 left-0 h-1 bg-gray-700 transform -translate-y-1/2 rounded-full transition-all duration-150 ease-in-out"
          style={{ width: `${percentage}%` }}
        />
        <input
          type="range"
          id={id}
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={onChange}
          required
          className="absolute appearance-none w-full h-8 bg-transparent cursor-grab z-10
            [&::-webkit-slider-runnable-track]:h-0 [&::-moz-range-track]:h-0
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5
            [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gray-700 [&::-webkit-slider-thumb]:mt-2
            [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5
            [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-gray-700
            [&::-moz-range-thumb]:border-none active:cursor-grabbing"
        />
      </div>

      <div className="flex justify-between mt-3 text-sm text-gray-600">
        {labels.map((label, i) => (
          <span key={i} className="text-center flex-1 px-1 whitespace-nowrap">
            {label.length > 3 ? label.replace(' ', '\u00a0') : label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ============================================================
// APP CONTENT
// ============================================================

function AppContent() {
  const store = useHairStore();
  const stylePos = store.stylePos;
  const thicknessPos = store.thicknessPos;
  const lengthPos = store.lengthPos;
  const densityPos = store.densityPos;

  const packsResult = store.calculatePacks();

  const handleSlider = (setter) => (e) => setter(Number(e.target.value));

  return (
    <div className="flex flex-col lg:flex-row p-8">
      {/* 3D Viewport */}
      <div className="w-full mb-8 lg:w-1/2 lg:h-[700px] lg:mr-8 lg:mb-0 relative">
        <Experience />
      </div>

      {/* Controls panel */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Hair Customization</h2>

        <StyleSelector value={stylePos} onChange={store.setStylePos} map={store.styleMap} />

        <RangeSlider
          id="thickness"
          min={1}
          max={6}
          step={1}
          value={thicknessPos}
          onChange={handleSlider(store.setThicknessPos)}
          map={store.thicknessMap}
          labelText="Braid thickness"
          buttonLabels={['Smaller', 'Larger']}
        />
        <RangeSlider
          id="length"
          min={1}
          max={6}
          step={1}
          value={lengthPos}
          onChange={handleSlider(store.setLengthPos)}
          map={store.lengthMap}
          labelText="Braid length"
          buttonLabels={['Shorter', 'Longer']}
        />
        <RangeSlider
          id="density"
          min={1}
          max={7}
          step={1}
          value={densityPos}
          onChange={handleSlider(store.setDensityPos)}
          map={store.densityMap}
          labelText="Braid density"
          buttonLabels={['Lower', 'Higher']}
        />

        <div className="pt-4 border-t border-gray-200 text-gray-700">
          <h3 className="text-lg font-semibold mb-2">Estimated Hair Packs:</h3>
          <p className="text-sm text-gray-500">Est: {packsResult.toFixed(2)} packs</p>
          <p className="text-lg font-bold text-gray-800">Rounded: {Math.round(packsResult)} packs</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// ROOT APP
// ============================================================

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);
  const store = useHairStore();

  const handleSelectPreset = (preset, parsed) => {
    setActivePresetId(preset.id);
    store.applyPreset(parsed);
  };

  return (
    <>
      <BurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <div className="bg-gray-100 min-h-screen p-4 flex justify-center items-start font-sans">
        <div className="bg-white max-w-7xl w-full rounded-xl shadow-2xl overflow-hidden my-4">
          {/* Header */}
          <header className="p-4 border-b border-gray-200 flex items-center justify-between">
            <button
              onClick={() => setMenuOpen(true)}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors group"
              aria-label="Open menu"
            >
              <div className="p-1.5 rounded-lg group-hover:bg-gray-100 transition-colors">
                <Menu className="h-6 w-6" />
              </div>
              <span className="text-sm font-medium hidden sm:inline">Menu</span>
            </button>

            <div className="text-center">
              <span className="text-gray-800 font-bold text-xl leading-tight tracking-tight">
                Cinna's PAH
              </span>
              <br />
              <span className="text-gray-400 text-xs italic">
                Protective Afro-Hairstyle Visualizer & Calculator
              </span>
            </div>

            <div className="w-20" />
          </header>

          {/* Preset gallery strip */}
          <PresetGallery onSelectPreset={handleSelectPreset} activePresetId={activePresetId} />

          {/* Main content */}
          <AppContent />

          {/* Footer */}
          <footer className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500 flex justify-center space-x-6">
            {[
              ['About this project', () => setMenuOpen(true)],
              ['Github Repository', 'https://github.com/OCE-Cinna/hair-calculator-app'],
              ['Contact', null],
            ].map(([label, action], i, arr) => (
              <React.Fragment key={label}>
                {typeof action === 'string' ? (
                  <a
                    href={action}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-500 hover:text-gray-700 transition duration-150"
                  >
                    {label}
                  </a>
                ) : (
                  <button
                    onClick={action}
                    className="text-gray-500 hover:text-gray-700 transition duration-150"
                  >
                    {label}
                  </button>
                )}
                {i < arr.length - 1 && <span className="text-gray-300">|</span>}
              </React.Fragment>
            ))}
          </footer>
        </div>
      </div>
    </>
  );
}
