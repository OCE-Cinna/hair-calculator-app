import React, { useState } from 'react';
import { useHairStore, useDevStore } from '../store/hairStore';
import { Settings, RefreshCcw, FileUp, ShieldAlert, Plus, Image as ImageIcon, Trash2, Edit3, Save } from 'lucide-react';

export function AssetManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [editingId, setEditingId] = useState(null);
    
    const store = useHairStore();
    const { customPresets, addCustomPreset, deleteCustomPreset, updateCustomPreset } = store;
    
    const devStore = useDevStore();
    const { isEnabled, setIsDevEnabled, assets, setAssetOverride, resetAssets, debugRaycast, setDebugRaycast } = devStore;

    const convertToJpeg = (file, maxWidth = 512, maxHeight = 512) => {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });
    };

    const handleFileUpload = async (e, slot) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (slot === 'temp_preset_img') {
            const url = await convertToJpeg(file);
            setAssetOverride(slot, url);
            setPresetName(file.name.replace(/\.[^.]+$/, ''));
            return;
        }

        const url = (slot === 'scalp_mask')
            ? await convertToJpeg(file)
            : URL.createObjectURL(file);
        setAssetOverride(slot, url);
    };

    const saveCurrentAsPreset = async () => {
        if (!presetName) return alert('Enter a preset name');
        
        if (editingId) {
            updateCustomPreset(editingId, { label: presetName });
            setEditingId(null);
            setPresetName('');
            return;
        }

        const id = Date.now().toString(); // Use timestamp for unique ID
        const lengthLabel = store.LENGTH_MAP[store.lengthPos][0];
        const thicknessLabel = store.THICKNESS_MAP[store.thicknessPos][0];
        const styleLabel = store.STYLE_MAP[store.stylePos][0];
        
        const label = presetName;
        const sublabel = `${thicknessLabel} · ${lengthLabel}`;

        const newPreset = {
            id,
            label,
            sublabel,
            image: assets.temp_preset_img,
            stylePos: store.stylePos,
            thicknessPos: store.thicknessPos,
            lengthPos: store.lengthPos,
            densityPos: store.densityPos,
            bgGradient: 'from-gray-900 to-black'
        };
        addCustomPreset(newPreset);
        setPresetName('');
        setAssetOverride('temp_preset_img', null);
    };

    const handleEdit = (preset) => {
        setEditingId(preset.id);
        setPresetName(preset.label);
    };

    if (!isEnabled && !isOpen) {
        return (
            <div className="fixed bottom-6 right-6 z-[100]">
                 <button 
                    onClick={() => setIsOpen(true)} 
                    className="p-4 bg-glass glass-responsive border border-divider-faint text-text-muted rounded-full shadow-lg hover:scale-105 active:scale-95 transition-all opacity-40 hover:opacity-100"
                    title="Open Dev Kit"
                >
                    <Settings className="h-6 w-6" />
                </button>
            </div>
        );
    }

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            <div className={`
                bg-glass-menu glass-responsive border border-divider-faint rounded-3xl shadow-glass w-80 p-6 mb-4 max-h-[80vh] overflow-y-auto 
                transition-all duration-300 ease-in-out origin-bottom-right
                ${isOpen ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-10 pointer-events-none'}
            `}>
                <div className="flex items-center justify-between mb-6">
                    <span className="font-bold text-text-base flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-brand" /> Dev Kit
                    </span>
                    <div className="flex items-center gap-2">
                        <button onClick={resetAssets} className="text-text-faintest hover:text-brand transition-colors"><RefreshCcw className="h-4 w-4" /></button>
                        <button onClick={() => setIsOpen(false)} className="text-text-faintest hover:text-text-base transition-colors text-xs font-bold px-2 py-1 bg-glass-hover rounded-lg">Close</button>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Dev Mode Toggle */}
                    <div className="flex items-center justify-between p-3 bg-brand/5 rounded-2xl border border-brand/10">
                        <span className="text-xs font-bold text-brand">Enable Dev Overrides</span>
                        <button
                            onClick={() => setIsDevEnabled(!isEnabled)}
                            className={`w-10 h-5 rounded-full transition-colors ${isEnabled ? 'bg-brand' : 'bg-glass-hover'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isEnabled ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
                        </button>
                    </div>

                    {/* Asset Upload Slots */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] uppercase tracking-widest font-black text-brand">3D Asset Overrides</h4>
                        {['custombust', 'boxbraid', 'boxbraidend', 'scalp_mask', 'uv_reference'].map(slot => (
                            <label key={slot} className="flex items-center gap-3 p-2 bg-glass-input rounded-xl border border-divider-faint cursor-pointer hover:bg-glass-hover hover:border-border-glass-strong transition-colors">
                                <FileUp className="h-3.5 w-3.5 text-text-faintest" />
                                <span className="text-xs font-medium text-text-muted truncate flex-1">{slot.replace('_', ' ')}</span>
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                                {assets[slot] && <div className="w-2 h-2 bg-brand rounded-full shadow-[0_0_8px_rgba(255,107,0,0.8)]" />}
                            </label>
                        ))}
                    </div>

                    {/* Preset Creator */}
                    <div className="pt-6 border-t border-divider-faint space-y-4">
                        <h4 className="text-[10px] uppercase tracking-widest font-black text-brand">{editingId ? 'Edit Preset' : 'Create Style Preset'}</h4>
                        <div className="space-y-2">
                            {!editingId && (
                                <label className="flex items-center gap-3 p-3 bg-brand/10 rounded-2xl border-2 border-dashed border-brand/30 cursor-pointer hover:bg-brand/20 transition-colors">
                                    <ImageIcon className="h-5 w-5 text-brand" />
                                    <span className="text-xs font-bold text-brand">
                                        {assets.temp_preset_img ? 'Image Ready' : 'Upload Preview'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'temp_preset_img')} />
                                </label>
                            )}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Preset Name"
                                    className="flex-1 p-3 bg-glass-input border border-divider-faint rounded-xl text-xs text-text-base placeholder-text-faint outline-none focus:border-brand/50 transition-colors"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                />
                                <button
                                    onClick={saveCurrentAsPreset}
                                    disabled={(!assets.temp_preset_img && !editingId) || !presetName}
                                    className="px-4 bg-brand text-white rounded-xl text-xs font-bold flex items-center justify-center disabled:opacity-50 shadow-brand-subtle"
                                >
                                    {editingId ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Preset Management */}
                    <div className="pt-6 border-t border-divider-faint space-y-3">
                        <h4 className="text-[10px] uppercase tracking-widest font-black text-brand">Manage Custom Presets</h4>
                        <div className="space-y-2">
                            {customPresets.length === 0 && <p className="text-[10px] text-text-faintest italic">No custom presets yet.</p>}
                            {customPresets.map(preset => (
                                <div key={preset.id} className="flex items-center justify-between p-2 bg-glass-input rounded-xl group">
                                    <span className="text-[11px] font-medium text-text-muted truncate flex-1">{preset.label}</span>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => handleEdit(preset)} className="p-1.5 hover:bg-glass-hover text-text-faintest hover:text-brand rounded-lg transition-colors"><Edit3 className="h-3.5 w-3.5" /></button>
                                        <button onClick={() => deleteCustomPreset(preset.id)} className="p-1.5 hover:bg-glass-hover text-text-faintest hover:text-red-500 rounded-lg transition-colors"><Trash2 className="h-3.5 w-3.5" /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center justify-between pt-4">
                        <span className="text-xs font-bold text-text-muted transition-colors">Raycast Debug</span>
                        <button
                            onClick={() => setDebugRaycast(!debugRaycast)}
                            className={`w-10 h-5 rounded-full transition-colors ${debugRaycast ? 'bg-brand' : 'bg-glass-hover'}`}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full transition-transform ${debugRaycast ? 'translate-x-6' : 'translate-x-1'} shadow-sm`} />
                        </button>
                    </div>
                </div>
            </div>
            <button onClick={() => setIsOpen(!isOpen)} className="p-4 bg-brand text-white rounded-full shadow-brand-subtle hover:scale-105 active:scale-95 transition-all">
                <Settings className="h-6 w-6" />
            </button>
        </div>
    );
}