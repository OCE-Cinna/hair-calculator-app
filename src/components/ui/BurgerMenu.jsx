import React from 'react';
import { X, Sparkles, Github, Info, Settings } from 'lucide-react';
import { useDevStore } from '../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';

export const BurgerMenu = ({ isOpen, onClose }) => {
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
        className={`fixed z-50 flex flex-col bg-glass-menu glass-responsive shadow-2xl transition-all duration-300 ease-in-out top-0 bottom-0 left-0 right-0 m-auto h-fit w-[calc(100vw-2rem)] max-w-sm max-h-[90dvh] rounded-3xl border border-divider-faint overflow-hidden lg:m-0 lg:top-0 lg:left-0 lg:bottom-auto lg:right-auto lg:h-full lg:w-80 lg:max-w-none lg:max-h-none lg:rounded-none lg:border-t-0 lg:border-b-0 lg:border-l-0 lg:border-r landscape:m-0 landscape:top-0 landscape:left-0 landscape:bottom-auto landscape:right-auto landscape:h-full landscape:w-80 landscape:max-w-none landscape:max-h-none landscape:rounded-none landscape:border-t-0 landscape:border-b-0 landscape:border-l-0 landscape:border-r ${isOpen ? 'opacity-100 scale-100 translate-x-0 pointer-events-auto' : 'opacity-0 scale-95 translate-x-0 pointer-events-none lg:opacity-100 lg:scale-100 lg:-translate-x-full landscape:opacity-100 landscape:scale-100 landscape:-translate-x-full'}`}
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
                  <p className="font-bold text-sm">Dev Kit</p>
                  <p className="text-[10px] uppercase tracking-wider opacity-60">Engine & overrides</p>
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
