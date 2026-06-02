import React from 'react';

export function Slider({ id, min, max, step, value, onChange, map, labelText, buttonLabels }) {
    const labels = Object.keys(map).map(k => map[Number(k)][0]);
    const percentage = ((value - min) / (max - min)) * 100;

    const decrement = () => onChange({ target: { value: Math.max(min, value - step) } });
    const increment = () => onChange({ target: { value: Math.min(max, value + step) } });

    return (
        <div className="mb-10 w-full group">
            <div className="flex justify-between items-center mb-5">
                <label
                    htmlFor={id}
                    className="text-sm font-black uppercase tracking-tighter text-gray-900"
                >
                    {labelText}
                </label>

                <div className="flex items-center gap-3">
                    <span className="text-xs font-mono font-bold px-2 py-1 bg-gray-900 text-white rounded-md">
                        {map[value][0]}
                    </span>

                    {buttonLabels && (
                        <div className="flex bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                            <button
                                type="button"
                                onClick={decrement}
                                aria-label={`Decrease ${labelText}`}
                                className="px-2 py-1 text-[10px] font-bold hover:bg-white rounded-md transition-all active:scale-90"
                            >
                                {buttonLabels[0]}
                            </button>
                            <button
                                type="button"
                                onClick={increment}
                                aria-label={`Increase ${labelText}`}
                                className="px-2 py-1 text-[10px] font-bold hover:bg-white rounded-md transition-all active:scale-90"
                            >
                                {buttonLabels[1]}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="relative w-full h-10 flex items-center bg-white/40 backdrop-blur-md border border-white/20 rounded-2xl px-4 shadow-sm">
                {/* Track Background */}
                <div className="absolute left-4 right-4 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-indigo-600 transition-all duration-300 ease-out"
                        style={{ width: `${percentage}%` }}
                    />
                </div>

                <input
                    type="range"
                    id={id}
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={onChange}
                    aria-valuemin={min}
                    aria-valuemax={max}
                    aria-valuenow={value}
                    aria-valuetext={map[value][0]}
                    className="absolute left-0 right-0 appearance-none w-full h-full bg-transparent cursor-pointer z-10 
                     focus:outline-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-6 
                     [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white 
                     [&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-indigo-600 [&::-webkit-slider-thumb]:shadow-lg
                     [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full 
                     [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-indigo-600"
                />
            </div>

            <div className="flex justify-between mt-3 px-1">
                {labels.map((label, i) => (
                    <span key={i} className={`text-[9px] font-bold uppercase transition-colors ${value === i + 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
                        {label.length > 5 ? label.substring(0, 3) + '.' : label}
                    </span>
                ))}
            </div>
        </div>
    );
}
