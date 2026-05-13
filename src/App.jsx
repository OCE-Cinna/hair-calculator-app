import React, { useState } from 'react';
import { Menu, X, Sparkles, Github, Info } from 'lucide-react';
import './App.css';
import { useHairStore } from './store/hairStore';
import { Experience } from './components/Experience';
import { calculateHairPacks } from './utils/calculator';
import { AssetManager } from './components/AssetManager';
import { INITIAL_PRESETS } from './constants/presets';
import { PresetGallery } from './components/PresetGallery';

// ============================================================
// BURGER MENU
// ============================================================
/**
 * BurgerMenu component displays a sliding sidebar navigation with project information,
 * how-it-works guide, tech stack, and links. It uses Tailwind CSS for styling and
 * Lucide-React for icons.
 * @param {object} props - The component props.
 * @param {boolean} props.isOpen - Controls the visibility of the menu.
 * @param {function} props.onClose - Callback function to close the menu.
 */

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
// UI COMPONENTS
// ============================================================
/**
 * StyleSelector component allows users to choose a hair braid style from a predefined map.
 * It renders a group of buttons, where each button represents a style option.
 * @param {object} props - The component props.
 * @param {number} props.value - The currently selected style ID.
 * @param {function} props.onChange - Callback function triggered when a style is selected.
 * @param {object} props.map - A map object where keys are style IDs and values are arrays [label, modifier].
 */

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

/**
 * RangeSlider component provides a customizable slider input with discrete steps,
 * labels, and optional increment/decrement buttons. It displays the current value
 * based on a provided map and updates the state via an onChange handler.
 * @param {object} props - The component props.
 * @param {string} props.id - Unique ID for the slider input.
 * @param {number} props.min - Minimum value of the slider.
 * @param {number} props.max - Maximum value of the slider.
 * @param {number} props.step - Step increment for the slider.
 * @param {number} props.value - Current value of the slider.
 * @param {function} props.onChange - Callback function triggered when the slider value changes.
 * @param {object} props.map - A map object where keys are slider values and values are arrays [label, modifier].
 * @param {string} props.labelText - Label displayed above the slider.
 * @param {string[]} [props.buttonLabels] - Optional array of two strings for decrement and increment button labels.
 */
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
/**
 * AppContent orchestrates the main UI and 3D visualization. It consumes state from the
 * Zustand store, renders the 3D experience, and displays hair customization controls and calculation results.
 */

function AppContent() {
  // Destructure state and maps from the store
  const {
    stylePos, setStylePos,
    thicknessPos, setThicknessPos,
    lengthPos, setLengthPos,
    densityPos, setDensityPos,
    STYLE_MAP, THICKNESS_MAP, LENGTH_MAP, DENSITY_MAP,
  } = useHairStore(state => ({
    stylePos: state.stylePos, setStylePos: state.setStylePos,
    thicknessPos: state.thicknessPos, setThicknessPos: state.setThicknessPos,
    lengthPos: state.lengthPos, setLengthPos: state.setLengthPos,
    densityPos: state.densityPos, setDensityPos: state.setDensityPos,
    STYLE_MAP: state.STYLE_MAP, THICKNESS_MAP: state.THICKNESS_MAP,
    LENGTH_MAP: state.LENGTH_MAP, DENSITY_MAP: state.DENSITY_MAP,
  }));

  // Extract calculation modifiers from the centralized constants
  const styleVal = STYLE_MAP[stylePos]?.[1] || 1.0; // Default to 1.0 for modifiers
  const thicknessVal = THICKNESS_MAP[thicknessPos]?.[1] || 1.0;
  const lengthVal = LENGTH_MAP[lengthPos]?.[1] || 1.0;
  const densityVal = DENSITY_MAP[densityPos]?.[1] || 1.0;

  const packsResult = calculateHairPacks(styleVal, thicknessVal, densityVal, lengthVal);

  const handleSlider = (setter) => (e) => setter(Number(e.target.value)); // Use destructured setters

  return (
    <div className="flex flex-col lg:flex-row p-8">
      {/* 3D Viewport */}
      <div className="w-full mb-8 lg:w-1/2 lg:h-[700px] lg:mr-8 lg:mb-0 relative">
        <Experience />
      </div>

      {/* Controls panel */}
      <div className="w-full lg:w-1/2 p-6 flex flex-col space-y-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Hair Customization</h2>
        {/* Pass destructured setters and maps */}
        <StyleSelector value={stylePos} onChange={setStylePos} map={STYLE_MAP} />

        <RangeSlider
          id="thickness"
          min={1}
          max={Object.keys(THICKNESS_MAP).length}
          step={1}
          value={thicknessPos}
          onChange={handleSlider(setThicknessPos)}
          map={THICKNESS_MAP}
          labelText="Braid thickness"
          buttonLabels={['Smaller', 'Larger']}
        />
        <RangeSlider
          id="length"
          min={1}
          max={Object.keys(LENGTH_MAP).length}
          step={1}
          value={lengthPos}
          onChange={handleSlider(setLengthPos)}
          map={LENGTH_MAP}
          labelText="Braid length"
          buttonLabels={['Shorter', 'Longer']}
        />
        <RangeSlider
          id="density"
          min={1}
          max={Object.keys(DENSITY_MAP).length}
          step={1}
          value={densityPos}
          onChange={handleSlider(setDensityPos)}
          map={DENSITY_MAP}
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
/**
 * The main application component that sets up the overall layout,
 * manages the burger menu and preset gallery, and renders the core
 * AppContent. It also handles preset selection logic.
 */

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activePresetId, setActivePresetId] = useState(null);
  // Destructure customPresets and setters from the store
  const { customPresets, setStylePos, setThicknessPos, setLengthPos, setDensityPos } = useHairStore();

  const allPresets = [...INITIAL_PRESETS, ...(customPresets || [])].map(p => ({
    ...p,
    // Ensure local preset images are correctly routed to the /presets/ subdirectory
    image: p.image && !p.image.startsWith('http') && !p.image.startsWith('/presets/')
      ? `/presets/${p.image.replace(/^\//, '')}`
      : p.image
  }));

  const handleSelectPreset = (preset, parsed) => { // parsed comes from parsePresetFilename
    setActivePresetId(preset.id);
    setStylePos(parsed.stylePos);
    setThicknessPos(parsed.thicknessPos);
    setLengthPos(parsed.lengthPos);
    setDensityPos(parsed.densityPos);
  };

  return (
    <>
      <BurgerMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      {/* Dev Feature: Asset CRUD & Testing */}
      <AssetManager />

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
          <PresetGallery presets={allPresets} onSelectPreset={handleSelectPreset} activePresetId={activePresetId} />

          {/* Main content */}
          <AppContent />

          {/* Footer */}
          <footer className="p-4 border-t border-gray-200 bg-gray-50 text-center text-sm text-gray-500 flex justify-center space-x-6">
            {[
              ['About this project', () => setMenuOpen(true)],
              ['Github Repository', 'https://github.com/OCE-Cinna/hair-calculator-app'],
              // ['Contact', null],
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
