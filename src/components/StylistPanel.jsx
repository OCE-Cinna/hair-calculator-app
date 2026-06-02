import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Settings, Trash2, Box, Eye, EyeOff, Sliders, 
    FileUp, RefreshCcw, ShieldAlert, Plus, 
    Image as ImageIcon, Edit3, Save, X 
} from 'lucide-react';
import { useHairStore, useDevStore } from '../store/hairStore';
import { useShallow } from 'zustand/react/shallow';

export const StylistPanel = () => {
    const { 
        isEnabled, 
        setIsDevEnabled, 
        DEV_CONFIG, 
        updateDevConfig, 
        debugRaycast, 
        setDebugRaycast,
        assets,
        setAssetOverride,
        resetAssets 
    } = useDevStore(useShallow(state => ({
        isEnabled: state.isEnabled,
        setIsDevEnabled: state.setIsDevEnabled,
        DEV_CONFIG: state.DEV_CONFIG,
        updateDevConfig: state.updateDevConfig,
        debugRaycast: state.debugRaycast,
        setDebugRaycast: state.setDebugRaycast,
        assets: state.assets,
        setAssetOverride: state.setAssetOverride,
        resetAssets: state.resetAssets
    })));

    const hairStore = useHairStore(useShallow(state => ({
        customPresets: state.customPresets,
        addCustomPreset: state.addCustomPreset,
        deleteCustomPreset: state.deleteCustomPreset,
        updateCustomPreset: state.updateCustomPreset,
        stylePos: state.stylePos,
        thicknessPos: state.thicknessPos,
        lengthPos: state.lengthPos,
        densityPos: state.densityPos,
        STYLE_MAP: state.STYLE_MAP,
        THICKNESS_MAP: state.THICKNESS_MAP,
        LENGTH_MAP: state.LENGTH_MAP
    })));

    const [presetName, setPresetName] = useState('');
    const [editingId, setEditingId] = useState(null);

    if (!isEnabled) return null;

    const convertToJpeg = (file) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, img.width, img.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e, slot) => {
        const file = e.target.files[0];
        if (!file) return;
        const url = (slot === 'scalp_mask' || slot === 'temp_preset_img')
            ? await convertToJpeg(file)
            : URL.createObjectURL(file);
        setAssetOverride(slot, url);
        if (slot === 'temp_preset_img') setPresetName(file.name.replace(/\.[^.]+$/, ''));
    };

    const saveCurrentAsPreset = () => {
        if (!presetName) return;
        if (editingId) {
            hairStore.updateCustomPreset(editingId, { label: presetName });
            setEditingId(null);
            setPresetName('');
            return;
        }
        const id = Date.now().toString();
        const newPreset = {
            id,
            label: presetName,
            sublabel: `${hairStore.THICKNESS_MAP[hairStore.thicknessPos][0]} · ${hairStore.LENGTH_MAP[hairStore.lengthPos][0]}`,
            image: assets.temp_preset_img,
            stylePos: hairStore.stylePos,
            thicknessPos: hairStore.thicknessPos,
            lengthPos: hairStore.lengthPos,
            densityPos: hairStore.densityPos,
            bgGradient: 'from-gray-900 to-black'
        };
        hairStore.addCustomPreset(newPreset);
        setPresetName('');
        setAssetOverride('temp_preset_img', null);
    };

    const configItems = [
        { key: 'calibrationFactor', label: 'Pack Calibration', min: 0.5, max: 1.5, step: 0.01 },
        { key: 'headCenterY', label: 'Head Y Offset', min: 0, max: 3, step: 0.01 },
        { key: 'headCenterZ', label: 'Head Z Offset', min: -1, max: 1, step: 0.01 },
        { key: 'headRadius', label: 'Head Radius', min: 0.5, max: 2, step: 0.01 },
        { key: 'torsoCenterY', label: 'Torso Y Offset', min: -1, max: 1, step: 0.01 },
        { key: 'torsoRadius', label: 'Torso Radius', min: 0.5, max: 2.5, step: 0.01 },
        { key: 'torsoStretchX', label: 'Torso X Stretch', min: 0.5, max: 3.0, step: 0.01 },
        { key: 'torsoStretchZ', label: 'Torso Z Stretch', min: 0.5, max: 3.0, step: 0.01 },
        { key: 'torsoPushOut', label: 'Collision Push', min: 0, max: 2, step: 0.01 },
        { key: 'centerPartingWidth', label: 'Part Width', min: 0.0, max: 0.3, step: 0.01 },
        { key: 'partThickness', label: 'Braid Spacing', min: 0.01, max: 0.3, step: 0.01 },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 right-6 z-[100] w-80 max-h-[90vh] overflow-y-auto bg-glass-menu backdrop-blur-2xl border border-border-glass rounded-3xl shadow-glass p-6 text-text-base flex flex-col transition-colors"
        >
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-brand" />
                    <h2 className="text-lg font-bold tracking-tight">Stylist Mode</h2>
                </div>
                <button 
                    onClick={() => setIsDevEnabled(false)}
                    className="p-2 hover:bg-glass-hover rounded-full transition-colors text-text-faintest hover:text-text-base"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>

            <div className="space-y-8">
                {/* Visual Helpers */}
                <div className="flex items-center justify-between p-4 bg-brand/5 rounded-2xl border border-brand/10">
                    <div>
                        <p className="text-xs font-bold text-brand uppercase tracking-wider">Debug View</p>
                        <p className="text-[10px] text-brand/60 uppercase">Collision Boundaries</p>
                    </div>
                    <button 
                        onClick={() => setDebugRaycast(!debugRaycast)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${debugRaycast ? 'bg-brand' : 'bg-glass-input'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${debugRaycast ? 'translate-x-7' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Calibration Sliders */}
                <div className="space-y-5">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-brand px-1">Engine Calibration</h4>
                    {configItems.map(({ key, label, min, max, step }) => (
                        <div key={key} className="space-y-2 px-1">
                            <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                <span>{label}</span>
                                <span className="text-brand font-mono">{DEV_CONFIG[key]?.toFixed(2)}</span>
                            </div>
                            <input
                                type="range"
                                min={min}
                                max={max}
                                step={step}
                                value={DEV_CONFIG[key]}
                                onChange={(e) => updateDevConfig(key, parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-glass-input rounded-lg appearance-none cursor-pointer accent-brand"
                            />
                        </div>
                    ))}
                </div>

                {/* Asset Overrides */}
                <div className="space-y-3 pt-4 border-t border-divider-faint">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-brand px-1">Asset Overrides</h4>
                    <div className="grid grid-cols-1 gap-2">
                        {['custom_bust', 'hair_box_mid', 'hair_twist_mid', 'hair_loc_mid', 'scalp_mask'].map(slot => (
                            <label key={slot} className="flex items-center gap-3 p-3 bg-glass-input rounded-xl border border-divider-faint cursor-pointer hover:bg-glass-hover hover:border-border-glass-strong transition-colors group">
                                <FileUp className="h-4 w-4 text-text-faintest group-hover:text-brand transition-colors" />
                                <span className="text-xs font-bold text-text-muted truncate flex-1 uppercase tracking-tighter">{slot.replace('_', ' ')}</span>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                                {assets[slot] && <div className="w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_rgba(255,107,0,0.8)]" />}
                            </label>
                        ))}
                    </div>
                </div>

                {/* Preset Creator */}
                <div className="space-y-4 pt-4 border-t border-divider-faint">
                    <h4 className="text-[10px] uppercase tracking-widest font-black text-brand px-1">{editingId ? 'Edit Preset' : 'Create Preset'}</h4>
                    {!editingId && (
                        <label className="flex items-center gap-3 p-3 bg-brand/5 rounded-2xl border-2 border-dashed border-brand/20 cursor-pointer hover:bg-brand/10 transition-colors group">
                            <ImageIcon className="h-5 w-5 text-brand" />
                            <span className="text-xs font-bold text-brand uppercase tracking-tighter">
                                {assets.temp_preset_img ? 'Image Uploaded' : 'Upload Preview'}
                            </span>
                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'temp_preset_img')} />
                        </label>
                    )}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="Preset Name"
                            className="flex-1 p-3 bg-glass-input border border-divider-faint rounded-xl text-xs text-text-base placeholder-text-faint outline-none focus:border-brand/50 transition-colors font-medium"
                            value={presetName}
                            onChange={(e) => setPresetName(e.target.value)}
                        />
                        <button
                            onClick={saveCurrentAsPreset}
                            disabled={(!assets.temp_preset_img && !editingId) || !presetName}
                            className="px-4 bg-brand text-white rounded-xl text-xs font-bold flex items-center justify-center disabled:opacity-50 shadow-brand-subtle active:scale-95 transition-all"
                        >
                            {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="pt-4 border-t border-divider-faint grid grid-cols-1 gap-2">
                    <button
                        onClick={resetAssets}
                        className="w-full flex items-center justify-center gap-2 py-3 bg-glass-hover hover:bg-glass-panel border border-divider-faint rounded-xl text-xs font-bold transition-all text-text-muted"
                    >
                        <RefreshCcw className="w-3.5 h-3.5" />
                        Reset All Overrides
                    </button>
                </div>
            </div>
        </motion.div>
    );
};
