import React from 'react';
import maps from '/src/constants/maps.js';


// === 2. CUSTOM RANGE INPUT COMPONENT ===
export default function Sliders({ id, min, max, step, value, onChange, map, labelText, buttonLabels }) {
    const CustomRangeInput = ({ id, min, max, step, value, onChange, map, labelText, buttonLabels }) => {
        const positions = Object.keys(map).map(Number);
        const labels = positions.map(pos => map[pos][0]);
        const percentage = ((value - min) / (max - min)) * 100;

        return (
            <div className="range-group">
                {/* Label and Buttons Row */}
                <div className="range-header">
                    <label htmlFor={id} className="range-label">
                        {labelText}:
                    </label>
                    {buttonLabels && (
                        <div className="range-buttons">
                            <button
                                type="button"
                                className="range-btn"
                                onClick={() => onChange({ target: { value: Math.max(min, value - step) } })}
                            >
                                {buttonLabels[0]}
                            </button>
                            <button
                                type="button"
                                className="range-btn"
                                onClick={() => onChange({ target: { value: Math.min(max, value + step) } })}
                            >
                                {buttonLabels[1]}
                            </button>
                        </div>
                    )}
                </div>

                {/* Range Input and Custom Track */}
                <div className="range-track-container">
                    {/* Track and Progress Bar */}
                    <div className="range-track"></div>
                    <div
                        className="range-progress"
                        style={{ width: `${percentage}%` }}
                    ></div>

                    <input
                        type="range"
                        id={id}
                        min={min}
                        max={max}
                        step={step}
                        value={value}
                        onChange={onChange}
                        required
                        className="range-slider"
                    />
                </div>

                {/* Labels below the slider - Spaced out */}
                <div className="range-sub-labels">
                    {labels.map((label, index) => (
                        <span key={index} className="sub-label-item">
                            {label.length > 3 ? label.replace(' ', '\u00a0') : label}
                        </span>
                    ))}
                </div>
            </div>
        );
    };
    return (
        <CustomRangeInput
            id={id}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={onChange}
            map={map}
            labelText={labelText}
            buttonLabels={buttonLabels}
        />
    );
}
