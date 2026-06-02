import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';
import { parsePresetFilename } from '../constants/presets';

const PresetCard = ({ preset, isActive, onClick }) => {
    const parsed = parsePresetFilename(preset.id);

    return (
        <button
            onClick={() => onClick(preset, parsed)}
            className={`
        relative flex-shrink-0 w-44 h-56 rounded-2xl overflow-hidden cursor-pointer
        transition-all duration-300
        ${isActive
                    ? 'ring-2 ring-offset-2 ring-ring-offset ring-brand scale-[1.03] shadow-brand-subtle'
                    : 'ring-1 ring-border-divider-faint hover:scale-[1.02] hover:shadow-lg hover:ring-border-divider'
                }
      `}
        >
            {preset.image ? (
                <img
                    src={preset.image}
                    alt={preset.label}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                />
            ) : (
                <div className={`absolute inset-0 bg-gradient-to-b ${preset.bgGradient}`} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
            {isActive && (
                <div className="absolute top-2.5 right-2.5 bg-brand text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
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

export const PresetGallery = ({ presets, onSelectPreset, activePresetId, isVisible, onToggle }) => {
    const scrollRef = useRef(null);

    const scroll = (dir) => {
        scrollRef.current?.scrollBy({ left: dir * 200, behavior: 'smooth' });
    };

    return (
        <div className="px-3 py-4 transition-all duration-500 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-4">
                    <button
                        onClick={onToggle}
                        className="p-1.5 rounded-lg bg-glass-selector border border-border-divider text-brand hover:bg-brand hover:text-white transition-colors shadow-sm"
                        aria-label={isVisible ? "Minimize presets" : "Expand presets"}
                    >
                        {isVisible ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    <div>
                        <h3 className="text-sm font-bold text-text-base uppercase tracking-widest drop-shadow-sm transition-colors">Style Presets</h3>
                        <p className="text-xs text-text-muted mt-0.5 transition-colors">Click to load settings instantly</p>
                    </div>
                </div>
                <div className="flex gap-1">
                    <button
                        onClick={() => scroll(-1)}
                        className="p-1.5 rounded-lg bg-glass-selector border border-border-divider text-text-muted hover:bg-brand hover:text-white hover:border-brand transition-colors shadow-sm"
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="p-1.5 rounded-lg bg-glass-selector border border-border-divider text-text-muted hover:bg-brand hover:text-white hover:border-brand transition-colors shadow-sm"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </div>

            <div className={`transition-all duration-500 ease-in-out ${isVisible ? 'max-h-64 opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}>
                <div
                    ref={scrollRef}
                    className="flex gap-4 overflow-x-auto px-3 pt-3 pb-4 scroll-smooth"
                    style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                    {presets.map(preset => (
                        <PresetCard
                            key={preset.id}
                            preset={preset}
                            isActive={activePresetId === preset.id}
                            onClick={onSelectPreset}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};
