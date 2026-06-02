import React from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useHairStore } from '../../stores/hairStore';

export const ThemeSwitcher = () => {
  const { theme, setTheme } = useHairStore();
  return (
    <div className="flex bg-glass-header p-1 rounded-xl backdrop-blur-md border border-border-glass shadow-sm">
      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Light"><Sun className="w-4 h-4" /></button>
      <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="System"><Monitor className="w-4 h-4" /></button>
      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Dark"><Moon className="w-4 h-4" /></button>
    </div>
  );
};

export const ThemeSwitcherVertical = () => {
  const { theme, setTheme } = useHairStore();
  return (
    <div className="flex flex-col bg-glass-header p-1 rounded-xl border border-border-glass gap-0.5">
      <button onClick={() => setTheme('light')} className={`p-1.5 rounded-lg transition-all ${theme === 'light' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Light"><Sun className="w-4 h-4" /></button>
      <button onClick={() => setTheme('system')} className={`p-1.5 rounded-lg transition-all ${theme === 'system' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="System"><Monitor className="w-4 h-4" /></button>
      <button onClick={() => setTheme('dark')} className={`p-1.5 rounded-lg transition-all ${theme === 'dark' ? 'bg-glass-input shadow-md text-brand' : 'text-text-faint hover:text-text-highlight'}`} title="Dark"><Moon className="w-4 h-4" /></button>
    </div>
  );
};
