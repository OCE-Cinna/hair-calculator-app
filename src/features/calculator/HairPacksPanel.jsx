import React from 'react';
import { AnimatePresence, motion } from 'framer-motion'; // eslint-disable-line no-unused-vars
import { Info } from 'lucide-react';
import { useHairStore } from '../../stores/hairStore';
import { useDevStore } from '../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';
import { calculateHairPacks } from '../../utils/calculator';

// ============================================================
// UI COMPONENTS (Compound Component Pattern)
// ============================================================
const ControlCard = ({ title, children, className = '', style = {} }) => (
  <motion.div 
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    className={`p-4 sm:p-5 flex flex-col space-y-3 bg-glass-panel glass-responsive border border-border-glass rounded-3xl shadow-glass transition-all duration-500 ${className}`}
    style={style}
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
    // Only allow Box Braids (id 1) to be selected for now
    if (id !== 1) return;
    onChange(id);
    if (window.navigator.vibrate) window.navigator.vibrate(5);
  };

  return (
    <div className="flex justify-between bg-glass-selector rounded-lg p-1 shadow-inner gap-1 border border-divider-faint transition-colors">
      {options.map(opt => (
        <motion.button
          key={opt.id}
          whileHover={opt.id === 1 ? { scale: 1.02 } : {}}
          whileTap={opt.id === 1 ? { scale: 0.98 } : {}}
          type="button"
          onClick={() => handleSelect(opt.id)}
          className={`relative grow py-2.5 px-1.5 text-center font-bold text-xs rounded-md transition-all duration-300 whitespace-nowrap group ${value === opt.id
            ? 'bg-brand text-white shadow-brand-subtle cursor-default'
            : opt.id !== 1 
              ? 'text-text-muted bg-transparent border-none opacity-50 cursor-not-allowed'
              : 'text-text-faint bg-transparent border-none hover:text-text-highlight hover:bg-glass-hover cursor-pointer'
            }`}
        >
          {opt.label}
          
          {/* Tooltip for disabled styles */}
          {opt.id !== 1 && (
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
              <div className="bg-glass-menu backdrop-blur-xl border border-border-glass-strong rounded-lg px-2.5 py-1.5 shadow-glass text-[10px] text-text-faint font-normal tracking-wide">
                IN DEVELOPMENT
                {/* Pointer */}
                <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px border-4 border-transparent border-t-border-glass-strong" />
              </div>
            </div>
          )}
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

      <div className="flex justify-between mt-3 text-[10px] lg:text-xs text-text-faint font-bold transition-colors">
        {labels.map((label, i) => {
          const parts = label.split(' ');
          return (
            <span key={i} className="text-center flex-1 px-0.5 leading-tight flex flex-col items-center justify-start">
              <span>{parts[0]}</span>
              {parts[1] && <span className="opacity-70 text-[9px] mt-0.5">{parts.slice(1).join(' ')}</span>}
            </span>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================
// HAIR PACKS PANEL
// ============================================================
export function HairPacksPanel() {
  const {
    stylePos, selectStyle,
    thicknessPos, setThicknessPos,
    lengthPos, setLengthPos,
    densityPos, setDensityPos,
    STYLE_MAP, THICKNESS_MAP, LENGTH_MAP, DENSITY_MAP,
  } = useHairStore(useShallow((state) => ({
    stylePos: state.stylePos,
    selectStyle: state.selectStyle,
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
      <ControlCard className="flex-1 overflow-y-auto overscroll-contain" style={{ WebkitOverflowScrolling: 'touch' }}>
        <ControlCard.Section title="Style">
          <ControlCard.StyleSelector
            value={stylePos}
            onChange={selectStyle}
            map={STYLE_MAP}
          />
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
          <div className="flex items-center gap-1.5 group relative cursor-help">
            <h3 className="text-base font-black text-text-base">Hair Packs</h3>
            <Info className="w-3.5 h-3.5 text-text-faintest group-hover:text-brand transition-colors" />
            
            {/* Tooltip */}
            <div className="absolute bottom-full left-0 mb-2 w-64 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
              <div className="bg-glass-menu backdrop-blur-xl border border-border-glass-strong rounded-xl p-3 shadow-glass">
                <p className="text-[10px] text-text-muted leading-relaxed">
                  <strong className="text-text-base">1 Unit = ~50g Bundle</strong><br/>
                  (e.g. half of a standard 2-bundle 46" pre-stretched X-pression pack). Baseline calculations are calibrated against Box Braids.
                </p>
                {/* Triangle pointer */}
                <div className="absolute top-full left-6 -mt-px border-4 border-transparent border-t-border-glass-strong" />
              </div>
            </div>
          </div>
          <p className="text-[10px] text-text-faint mt-1 font-medium">{packsResult.toFixed(2)} exact bundles</p>
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

