import React, { useState } from 'react';
import { useHairStore } from '../store/hairStore';
import { parsePresetFilename } from '../constants/presets';
import { Settings, RefreshCcw, FileUp, ShieldAlert, Plus, Image as ImageIcon } from 'lucide-react';

export function AssetManager() {
    const [isOpen, setIsOpen] = useState(false);
    const [presetName, setPresetName] = useState('');
    const store = useHairStore();
    const { assets, setAssetOverride, resetAssets, debugRaycast, setDebugRaycast, addCustomPreset } = store;

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
        const id = presetName.toLowerCase().replace(/\s+/g, '_');
        
        const parsed = parsePresetFilename(presetName);
        const lengthName = store.LENGTH_MAP[parsed.lengthPos][0];
        const thicknessName = store.THICKNESS_MAP[parsed.thicknessPos][0];
        const styleName = store.STYLE_MAP[parsed.stylePos][0];
        
        const label = `${lengthName.split(' ')[0]} ${styleName}`;
        const sublabel = `${thicknessName} · ${lengthName}`;

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

    return (
        <div className="fixed bottom-6 right-6 z-[100] flex flex-col items-end">
            {isOpen && (
                <div className="bg-white/95 backdrop-blur-xl border border-gray-200 rounded-3xl shadow-2xl w-80 p-6 mb-4 max-h-[80vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-gray-900 flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-500" /> Dev Kit
                        </span>
                        <button onClick={resetAssets} className="text-gray-400 hover:text-red-500"><RefreshCcw className="h-4 w-4" /></button>
                    </div>

                    <div className="space-y-6">
                        {/* Asset Upload Slots */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-400">3D Asset Overrides</h4>
                            {['custombust', 'boxbraid', 'boxbraidend', 'scalp_mask', 'uv_reference'].map(slot => (
                                <label key={slot} className="flex items-center gap-3 p-2 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer hover:bg-gray-100">
                                    <FileUp className="h-3.5 w-3.5 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-600 truncate flex-1">{slot.replace('_', ' ')}</span>
                                    <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, slot)} />
                                    {assets[slot] && <div className="w-2 h-2 bg-green-500 rounded-full" />}
                                </label>
                            ))}
                        </div>

                        {/* Preset Creator */}
                        <div className="pt-6 border-t border-gray-100 space-y-4">
                            <h4 className="text-[10px] uppercase tracking-widest font-black text-gray-400">Create Style Preset</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border-2 border-dashed border-indigo-100 cursor-pointer">
                                    <ImageIcon className="h-5 w-5 text-indigo-500" />
                                    <span className="text-xs font-bold text-indigo-700">
                                        {assets.temp_preset_img ? 'Image Ready' : 'Upload Preview'}
                                    </span>
                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'temp_preset_img')} />
                                </label>
                                <input
                                    type="text"
                                    placeholder="Preset Name (e.g. Summer Locs)"
                                    className="w-full p-3 bg-gray-50 border border-gray-100 rounded-xl text-xs outline-none focus:border-indigo-300"
                                    value={presetName}
                                    onChange={(e) => setPresetName(e.target.value)}
                                />
                                <button
                                    onClick={saveCurrentAsPreset}
                                    disabled={!assets.temp_preset_img || !presetName}
                                    className="w-full py-3 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    <Plus className="h-4 w-4" /> Save to Gallery
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                            <span className="text-xs font-bold text-gray-700">Raycast Debug</span>
                            <button
                                onClick={() => setDebugRaycast(!debugRaycast)}
                                className={`w-10 h-5 rounded-full transition-colors ${debugRaycast ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${debugRaycast ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <button onClick={() => setIsOpen(!isOpen)} className="p-4 bg-gray-900 text-white rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all">
                <Settings className="h-6 w-6" />
            </button>
        </div>
    );
}