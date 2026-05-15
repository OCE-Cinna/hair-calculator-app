import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, waitFor } from '@testing-library/react';
import { AssetManager } from './AssetManager';
import { useHairStore, useDevStore } from '../store/hairStore';

// Mock the Zustand store
vi.mock('../store/hairStore', () => ({
    useHairStore: vi.fn(),
    useDevStore: vi.fn(),
}));

describe('AssetManager JPEG Conversion', () => {
    let mockSetAssetOverride;

    beforeEach(() => {
        mockSetAssetOverride = vi.fn();
        useDevStore.mockReturnValue({
            isEnabled: true,
            setIsDevEnabled: vi.fn(),
            assets: {},
            setAssetOverride: mockSetAssetOverride,
            resetAssets: vi.fn(),
        });
        useHairStore.mockReturnValue({
            assets: {},
            setAssetOverride: mockSetAssetOverride,
            resetAssets: vi.fn(),
            debugRaycast: false,
            setDebugRaycast: vi.fn(),
            addCustomPreset: vi.fn(),
            customPresets: [],
        });

        // Mock URL.createObjectURL
        global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');

        // Mock Canvas and Context for JPEG conversion
        vi.stubGlobal('Image', class {
            constructor() {
                setTimeout(() => this.onload(), 10);
            }
        });

        HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
            drawImage: vi.fn(),
        }));

        HTMLCanvasElement.prototype.toDataURL = vi.fn(() => 'data:image/jpeg;base64,mock-jpeg');
    });

    it('should convert PNG to JPEG when uploaded to the scalp_mask slot', async () => {
        const { container } = render(<AssetManager />);

        // Open the drawer
        const settingsButton = container.querySelector('button');
        fireEvent.click(settingsButton);

        // Find the scalp_mask input (using the label index or similar mapping)
        const inputs = container.querySelectorAll('input[type="file"]');
        const scalpMaskInput = inputs[3]; // based on the order in the component

        const file = new File([''], 'test.png', { type: 'image/png' });

        fireEvent.change(scalpMaskInput, { target: { files: [file] } });

        await waitFor(() => {
            expect(mockSetAssetOverride).toHaveBeenCalledWith('scalp_mask', 'data:image/jpeg;base64,mock-jpeg');
        });
    });

    it('should not convert GLB files and use raw Object URLs', async () => {
        const { container } = render(<AssetManager />);

        const settingsButton = container.querySelector('button');
        fireEvent.click(settingsButton);

        const inputs = container.querySelectorAll('input[type="file"]');
        const bustInput = inputs[0];

        const file = new File([''], 'model.glb', { type: 'model/gltf-binary' });
        fireEvent.change(bustInput, { target: { files: [file] } });

        expect(mockSetAssetOverride).toHaveBeenCalledWith('custombust', 'blob:mock-url');
    });
});