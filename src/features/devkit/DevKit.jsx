import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Terminal, Trash2, FileUp, RefreshCcw, Plus,
    Image as ImageIcon, Save, X, Layers, Check,
    ChevronDown, ChevronUp, RotateCcw
} from 'lucide-react';
import { useHairStore } from '../../stores/hairStore';
import { useDevStore } from '../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';

// ── Default DEV_CONFIG values (mirrors hairStore defaults for reset) ──────────
const DEFAULT_DEV_CONFIG = {
    headCenterY: 1.25,
    headCenterZ: 0.0,
    headRadius: 0.95,
    torsoCenterY: 0.2,
    torsoRadius: 1.25,
    torsoStretchX: 1.5,
    torsoStretchZ: 1.5,
    torsoPushOut: 0.5,
    partingRowMultiplier: 5,
    partingPointMultiplier: 5,
    thicknessDensityScale: true,
    calibrationFactor: 0.95,
    centerPartingWidth: 0.08,
    partThickness: 0.08,
};

// ── Reusable collapsible section header ──────────────────────────────────────
const SectionHeader = ({ label, isOpen, onToggle, onReset, resetTitle }) => (
    <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between group py-1"
    >
        <span className="text-[10px] uppercase tracking-widest font-black text-brand">
            {label}
        </span>
        <div className="flex items-center gap-1.5">
            {onReset && (
                <span
                    role="button"
                    title={resetTitle || 'Reset section'}
                    onClick={(e) => { e.stopPropagation(); onReset(); }}
                    className="p-1 rounded-lg hover:bg-glass-hover text-text-faintest hover:text-brand transition-all"
                >
                    <RotateCcw className="w-3 h-3" />
                </span>
            )}
            {isOpen
                ? <ChevronUp className="w-3.5 h-3.5 text-text-faintest group-hover:text-brand transition-colors" />
                : <ChevronDown className="w-3.5 h-3.5 text-text-faintest group-hover:text-brand transition-colors" />
            }
        </div>
    </button>
);

// ── Animated collapsible wrapper ──────────────────────────────────────────────
const Collapsible = ({ isOpen, children }) => (
    <AnimatePresence initial={false}>
        {isOpen && (
            <motion.div
                key="content"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                style={{ overflow: 'hidden' }}
            >
                <div className="pt-3 space-y-3">
                    {children}
                </div>
            </motion.div>
        )}
    </AnimatePresence>
);

// ─────────────────────────────────────────────────────────────────────────────
export const DevKit = () => {
    const {
        isEnabled,
        setIsDevEnabled,
        DEV_CONFIG,
        updateDevConfig,
        resetDevConfig,
        debugRaycast,
        setDebugRaycast,
        assets,
        setAssetOverride,
        resetAssets,
        bustCombos,
        addBustCombo,
        deleteBustCombo,
        applyBustCombo,
    } = useDevStore(useShallow(state => ({
        isEnabled: state.isEnabled,
        setIsDevEnabled: state.setIsDevEnabled,
        DEV_CONFIG: state.DEV_CONFIG,
        updateDevConfig: state.updateDevConfig,
        resetDevConfig: state.resetDevConfig,
        debugRaycast: state.debugRaycast,
        setDebugRaycast: state.setDebugRaycast,
        assets: state.assets,
        setAssetOverride: state.setAssetOverride,
        resetAssets: state.resetAssets,
        bustCombos: state.bustCombos || [],
        addBustCombo: state.addBustCombo,
        deleteBustCombo: state.deleteBustCombo,
        applyBustCombo: state.applyBustCombo,
    })));

    const hairStore = useHairStore(useShallow(state => ({
        customPresets: state.customPresets,
        addCustomPreset: state.addCustomPreset,
        deleteCustomPreset: state.deleteCustomPreset,
        updateCustomPreset: state.updateCustomPreset,
        resetPresets: state.resetPresets,
        stylePos: state.stylePos,
        thicknessPos: state.thicknessPos,
        lengthPos: state.lengthPos,
        densityPos: state.densityPos,
        STYLE_MAP: state.STYLE_MAP,
        THICKNESS_MAP: state.THICKNESS_MAP,
        LENGTH_MAP: state.LENGTH_MAP,
    })));

    // ── Local state ───────────────────────────────────────────────────────────
    const [presetName, setPresetName] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [comboName, setComboName] = useState('');

    // Collapsible section open/closed state
    const [open, setOpen] = useState({
        calibration: true,
        assets: true,
        combos: false,
        presets: false,
    });
    const toggle = (key) => setOpen(prev => ({ ...prev, [key]: !prev[key] }));

    if (!isEnabled) return null;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const convertToJpeg = (file) =>
        new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    canvas.getContext('2d').drawImage(img, 0, 0);
                    resolve(canvas.toDataURL('image/jpeg', 0.95));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

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
        hairStore.addCustomPreset({
            id: Date.now().toString(),
            label: presetName,
            sublabel: `${hairStore.THICKNESS_MAP[hairStore.thicknessPos][0]} · ${hairStore.LENGTH_MAP[hairStore.lengthPos][0]}`,
            image: assets.temp_preset_img,
            stylePos: hairStore.stylePos,
            thicknessPos: hairStore.thicknessPos,
            lengthPos: hairStore.lengthPos,
            densityPos: hairStore.densityPos,
            bgGradient: 'from-gray-900 to-black',
        });
        setPresetName('');
        setAssetOverride('temp_preset_img', null);
    };

    const saveCurrentCombo = () => {
        if (!comboName.trim() || (!assets.custom_bust && !assets.scalp_mask)) return;
        addBustCombo({
            id: Date.now().toString(),
            name: comboName.trim(),
            bustUrl: assets.custom_bust || null,
            maskUrl: assets.scalp_mask || null,
        });
        setComboName('');
    };

    const configItems = [
        { key: 'calibrationFactor', label: 'Pack Calibration', min: 0.5,  max: 1.5,  step: 0.01 },
        { key: 'headCenterY',       label: 'Head Y Offset',    min: 0,     max: 3,    step: 0.01 },
        { key: 'headCenterZ',       label: 'Head Z Offset',    min: -1,    max: 1,    step: 0.01 },
        { key: 'headRadius',        label: 'Head Radius',      min: 0.5,   max: 2,    step: 0.01 },
        { key: 'torsoCenterY',      label: 'Torso Y Offset',   min: -1,    max: 1,    step: 0.01 },
        { key: 'torsoRadius',       label: 'Torso Radius',     min: 0.5,   max: 2.5,  step: 0.01 },
        { key: 'torsoStretchX',     label: 'Torso X Stretch',  min: 0.5,   max: 3.0,  step: 0.01 },
        { key: 'torsoStretchZ',     label: 'Torso Z Stretch',  min: 0.5,   max: 3.0,  step: 0.01 },
        { key: 'torsoPushOut',      label: 'Collision Push',   min: 0,     max: 2,    step: 0.01 },
        { key: 'centerPartingWidth',label: 'Part Width',       min: 0.0,   max: 0.3,  step: 0.01 },
        { key: 'partThickness',     label: 'Braid Spacing',    min: 0.01,  max: 0.3,  step: 0.01 },
    ];

    const assetSlots = ['custom_bust', 'hair_box_mid', 'hair_twist_mid', 'hair_loc_mid', 'scalp_mask'];
    const hasAnyAsset = assetSlots.some(s => assets[s]);

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="fixed top-6 inset-x-4 sm:inset-x-auto sm:right-6 z-[100] sm:w-80 max-h-[90vh] overflow-y-auto bg-glass-menu backdrop-blur-2xl border border-border-glass rounded-3xl shadow-glass p-5 text-text-base flex flex-col transition-colors"
            style={{ scrollbarWidth: 'none' }}
        >
            {/* ── Panel header ── */}
            <div className="flex items-center justify-between mb-5 shrink-0">
                <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-brand" />
                    <div>
                        <h2 className="text-sm font-black tracking-tight leading-none">Dev Kit</h2>
                        <p className="text-[9px] text-brand uppercase tracking-widest font-bold mt-0.5">PAH Dev Tooling</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsDevEnabled(false)}
                    className="p-2 hover:bg-glass-hover rounded-full transition-colors text-text-faintest hover:text-text-base"
                    title="Close Dev Kit"
                >
                    <X className="w-4 h-4" />
                </button>
            </div>

            <div className="space-y-0 divide-y divide-divider-faint">

                {/* ── Debug View toggle (always visible) ── */}
                <div className="flex items-center justify-between py-3">
                    <div>
                        <p className="text-xs font-bold text-text-base">Debug View</p>
                        <p className="text-[10px] text-text-faintest">Collision boundaries</p>
                    </div>
                    <button
                        onClick={() => setDebugRaycast(!debugRaycast)}
                        className={`w-11 h-6 rounded-full relative transition-colors ${debugRaycast ? 'bg-brand' : 'bg-glass-input'}`}
                    >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${debugRaycast ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* ── Engine Calibration ── */}
                <div className="py-3">
                    <SectionHeader
                        label="Engine Calibration"
                        isOpen={open.calibration}
                        onToggle={() => toggle('calibration')}
                        onReset={() => {
                            configItems.forEach(({ key }) => updateDevConfig(key, DEFAULT_DEV_CONFIG[key]));
                        }}
                        resetTitle="Reset calibration to defaults"
                    />
                    <Collapsible isOpen={open.calibration}>
                        {configItems.map(({ key, label, min, max, step }) => (
                            <div key={key} className="space-y-1.5">
                                <div className="flex justify-between text-[10px] font-bold text-text-muted uppercase tracking-wider">
                                    <span>{label}</span>
                                    <span className="text-brand font-mono">{DEV_CONFIG[key]?.toFixed(2)}</span>
                                </div>
                                <input
                                    type="range" min={min} max={max} step={step}
                                    value={DEV_CONFIG[key]}
                                    onChange={(e) => updateDevConfig(key, parseFloat(e.target.value))}
                                    className="w-full h-1.5 bg-glass-input rounded-lg appearance-none cursor-pointer accent-brand"
                                />
                            </div>
                        ))}
                    </Collapsible>
                </div>

                {/* ── Asset Overrides ── */}
                <div className="py-3">
                    <SectionHeader
                        label="Asset Overrides"
                        isOpen={open.assets}
                        onToggle={() => toggle('assets')}
                        onReset={hasAnyAsset ? resetAssets : undefined}
                        resetTitle="Clear all asset overrides"
                    />
                    <Collapsible isOpen={open.assets}>
                        <div className="grid grid-cols-1 gap-2">
                            {assetSlots.map(slot => (
                                <label
                                    key={slot}
                                    className="flex items-center gap-3 p-2.5 bg-glass-input rounded-xl border border-divider-faint cursor-pointer hover:bg-glass-hover hover:border-border-glass-strong transition-colors group"
                                >
                                    <FileUp className="h-3.5 w-3.5 text-text-faintest group-hover:text-brand transition-colors shrink-0" />
                                    <span className="text-xs font-bold text-text-muted truncate flex-1 uppercase tracking-tighter">
                                        {slot.replace(/_/g, ' ')}
                                    </span>
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                                    {assets[slot] && (
                                        <div className="flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-brand rounded-full shadow-[0_0_6px_rgba(255,107,0,0.8)]" />
                                            <button
                                                type="button"
                                                title={`Clear ${slot}`}
                                                onClick={(e) => { e.preventDefault(); setAssetOverride(slot, null); }}
                                                className="text-text-faintest hover:text-red-400 transition-colors"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    )}
                                </label>
                            ))}
                        </div>
                    </Collapsible>
                </div>

                {/* ── Bust Combinations ── */}
                <div className="py-3">
                    <SectionHeader
                        label="Bust Combinations"
                        isOpen={open.combos}
                        onToggle={() => toggle('combos')}
                        onReset={bustCombos.length > 0 ? () => bustCombos.forEach(c => deleteBustCombo(c.id)) : undefined}
                        resetTitle="Delete all bust combos"
                    />
                    <Collapsible isOpen={open.combos}>
                        <p className="text-[10px] text-text-faintest leading-relaxed">
                            Load a bust + mask above, name it, and save to quickly switch between head models.
                        </p>

                        {/* Save row */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Combo name…"
                                className="flex-1 p-2.5 bg-glass-input border border-divider-faint rounded-xl text-xs text-text-base placeholder-text-faint outline-none focus:border-brand/50 transition-colors font-medium"
                                value={comboName}
                                onChange={(e) => setComboName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveCurrentCombo()}
                            />
                            <button
                                onClick={saveCurrentCombo}
                                disabled={!comboName.trim() || (!assets.custom_bust && !assets.scalp_mask)}
                                title={(!assets.custom_bust && !assets.scalp_mask) ? 'Load a bust or mask first' : 'Save combo'}
                                className="px-3 bg-brand text-white rounded-xl text-xs font-bold flex items-center justify-center disabled:opacity-40 shadow-brand-subtle active:scale-95 transition-all"
                            >
                                <Plus className="h-4 w-4" />
                            </button>
                        </div>

                        {/* Saved list */}
                        {bustCombos.length === 0 ? (
                            <p className="text-[10px] text-text-faintest text-center py-3 border border-dashed border-divider-faint rounded-xl">
                                No combos saved yet
                            </p>
                        ) : (
                            <div className="flex flex-col gap-2">
                                {bustCombos.map(combo => {
                                    const isActive =
                                        assets.custom_bust === combo.bustUrl &&
                                        assets.scalp_mask === combo.maskUrl;
                                    return (
                                        <div
                                            key={combo.id}
                                            className={`flex items-center gap-2 p-2.5 rounded-xl border transition-all ${isActive ? 'bg-brand/10 border-brand/40' : 'bg-glass-input border-divider-faint'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${isActive ? 'bg-brand shadow-[0_0_6px_rgba(255,107,0,0.8)]' : 'bg-glass-hover'}`} />
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-xs font-bold truncate ${isActive ? 'text-brand' : 'text-text-base'}`}>{combo.name}</p>
                                                <p className="text-[9px] text-text-faintest mt-0.5">
                                                    {combo.bustUrl ? '🗿 Bust' : '—'}
                                                    {combo.bustUrl && combo.maskUrl ? ' + ' : ''}
                                                    {combo.maskUrl ? '🎨 Mask' : ''}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => applyBustCombo(combo)}
                                                disabled={isActive}
                                                title={isActive ? 'Already loaded' : 'Load combo'}
                                                className="p-1.5 rounded-lg bg-brand/10 hover:bg-brand/20 text-brand disabled:opacity-30 transition-all active:scale-95"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                            </button>
                                            <button
                                                onClick={() => deleteBustCombo(combo.id)}
                                                title="Delete combo"
                                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-text-faintest hover:text-red-400 transition-all active:scale-95"
                                            >
                                                <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </Collapsible>
                </div>

                {/* ── Create Preset ── */}
                <div className="py-3">
                    <SectionHeader
                        label={editingId ? 'Edit Preset' : 'Create Preset'}
                        isOpen={open.presets}
                        onToggle={() => toggle('presets')}
                        onReset={(hairStore.customPresets || []).length > 0
                            ? () => (hairStore.customPresets || []).forEach(p => hairStore.deleteCustomPreset(p.id))
                            : undefined
                        }
                        resetTitle="Delete all custom presets"
                    />
                    <Collapsible isOpen={open.presets}>
                        {!editingId && (
                            <label className="flex items-center gap-3 p-3 bg-brand/5 rounded-2xl border-2 border-dashed border-brand/20 cursor-pointer hover:bg-brand/10 transition-colors group">
                                <ImageIcon className="h-4 w-4 text-brand" />
                                <span className="text-xs font-bold text-brand uppercase tracking-tighter">
                                    {assets.temp_preset_img ? 'Image Uploaded ✓' : 'Upload Preview Image'}
                                </span>
                                <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'temp_preset_img')} />
                            </label>
                        )}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="Preset name"
                                className="flex-1 p-2.5 bg-glass-input border border-divider-faint rounded-xl text-xs text-text-base placeholder-text-faint outline-none focus:border-brand/50 transition-colors font-medium"
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveCurrentAsPreset()}
                            />
                            <button
                                onClick={saveCurrentAsPreset}
                                disabled={(!assets.temp_preset_img && !editingId) || !presetName}
                                className="px-3 bg-brand text-white rounded-xl text-xs font-bold flex items-center justify-center disabled:opacity-50 shadow-brand-subtle active:scale-95 transition-all"
                            >
                                {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                            </button>
                        </div>

                        {/* List existing presets */}
                        {(hairStore.customPresets || []).length > 0 && (
                            <div className="flex flex-col gap-1.5 mt-1">
                                {hairStore.customPresets.map(p => (
                                    <div key={p.id} className="flex items-center gap-2 p-2 bg-glass-input rounded-xl border border-divider-faint">
                                        <p className="flex-1 text-xs font-bold text-text-base truncate">{p.label}</p>
                                        <button
                                            onClick={() => { setEditingId(p.id); setPresetName(p.label); }}
                                            title="Edit name"
                                            className="p-1 rounded-lg hover:bg-glass-hover text-text-faintest hover:text-brand transition-all"
                                        >
                                            <Save className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={() => hairStore.deleteCustomPreset(p.id)}
                                            title="Delete preset"
                                            className="p-1 rounded-lg hover:bg-red-500/10 text-text-faintest hover:text-red-400 transition-all"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Collapsible>
                </div>

            </div>
        </motion.div>
    );
};


