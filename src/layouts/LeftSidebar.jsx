import React from 'react';
import { Menu, Layers, Settings, Github } from 'lucide-react';
import { useDevStore } from '../stores/devStore';
import { useShallow } from 'zustand/react/shallow';
import { ThemeSwitcherVertical } from '../components/ui/ThemeSwitcher';

export const LeftSidebar = ({ onOpenMenu, presetsOpen, onTogglePresets }) => {
  const { isDevEnabled, setIsDevEnabled } = useDevStore(useShallow(state => ({
    isDevEnabled: state.isEnabled,
    setIsDevEnabled: state.setIsDevEnabled,
  })));

  const btnBase = 'p-2.5 rounded-xl border transition-all';
  const btnIdle = 'border-transparent text-text-faintest hover:text-text-base hover:bg-glass-hover hover:border-border-glass-strong';
  const btnActive = 'bg-brand/10 border-brand/30 text-brand';

  return (
    <aside 
      className="hidden lg:flex landscape:flex flex-col items-center gap-3 landscape:gap-1.5 py-5 landscape:py-2 px-3 bg-glass glass-responsive border border-border-glass rounded-3xl shadow-glass transition-colors duration-500 shrink-0 w-16 landscape:w-14 landscape:overflow-y-auto"
      style={{ scrollbarWidth: 'none' }}
    >
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
        title={isDevEnabled ? 'Dev Kit active' : 'Dev Kit'}
      >
        <Settings className="h-5 w-5" />
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
