import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
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
                    ? 'ring-2 ring-offset-2 ring-gray-800 scale-[1.03] shadow-xl'
                    : 'ring-1 ring-gray-200 hover:scale-[1.02] hover:shadow-lg'
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

export const PresetGallery = ({ presets, onSelectPreset, activePresetId }) => {
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
                    >
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                        onClick={() => scroll(1)}
                        className="p-1.5 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors shadow-sm"
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
    );
};