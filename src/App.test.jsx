import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { useHairStore } from './store/hairStore';
import { calculateHairPacks } from './utils/calculator';

// Mock dependencies that are hard to test in JSDOM or involve 3D
vi.mock('./store/hairStore', () => ({
    useHairStore: vi.fn(),
}));

vi.mock('./components/Experience', () => ({
    Experience: () => <div data-testid="mock-experience" />,
}));

vi.mock('./components/AssetManager', () => ({
    AssetManager: () => <div data-testid="mock-asset-manager" />,
}));

vi.mock('./components/PresetGallery', () => ({
    PresetGallery: () => <div data-testid="mock-preset-gallery" />,
}));

vi.mock('./utils/calculator', () => ({
    calculateHairPacks: vi.fn(),
}));

describe('App Component', () => {
    const mockSetStylePos = vi.fn();
    const mockSetThicknessPos = vi.fn();

    const mockStoreState = {
        stylePos: 1,
        thicknessPos: 4,
        lengthPos: 4,
        densityPos: 4,
        setStylePos: mockSetStylePos,
        setThicknessPos: mockSetThicknessPos,
        setLengthPos: vi.fn(),
        setDensityPos: vi.fn(),
        STYLE_MAP: { 1: ['Knotless Braids', 1.0], 2: ['Box Braids', 1.1] },
        THICKNESS_MAP: {
            1: ['Micro', 0.5], 2: ['Small', 0.7], 3: ['Smedium', 0.85],
            4: ['Medium', 1.0], 5: ['Large', 1.2], 6: ['Jumbo', 1.5], 7: ['Mega', 2.0]
        },
        LENGTH_MAP: {
            1: ['Ear', 0.5], 2: ['Neck', 0.7], 3: ['Shoulder', 0.85],
            4: ['Mid-back', 1.0], 5: ['Waist', 1.2], 6: ['Hip', 1.5], 7: ['Thigh', 2.0]
        },
        DENSITY_MAP: {
            1: ['12', 0.5], 2: ['24', 0.7], 3: ['40', 0.85],
            4: ['80', 1.0], 5: ['100', 1.2], 6: ['200', 1.5], 7: ['300+', 2.0]
        },
        customPresets: [],
        assets: {},
    };

    beforeEach(() => {
        vi.clearAllMocks();
        // Mock selector behavior: returns specific values or the whole state depending on call
        useHairStore.mockImplementation((selector) => selector(mockStoreState));
        calculateHairPacks.mockReturnValue(5.25);
    });

    it('renders the main layout and sub-components', () => {
        render(<App />);
        expect(screen.getByText("Cinna's PAH")).toBeDefined();
        expect(screen.getByTestId('mock-experience')).toBeDefined();
        expect(screen.getByTestId('mock-preset-gallery')).toBeDefined();
    });

    it('toggles the Burger Menu when clicking the menu button', () => {
        render(<App />);

        // Open menu
        const menuBtn = screen.getByLabelText('Open menu');
        fireEvent.click(menuBtn);
        expect(screen.getByText('About this project')).toBeDefined();

        // Close menu
        const closeBtn = screen.getByLabelText('Close menu');
        fireEvent.click(closeBtn);
        // Menu should have translate-x-full or be hidden (timing depending on implementation)
    });

    it('displays the correct calculation result based on modifiers', () => {
        render(<App />);
        // 5.25 from mock calculateHairPacks
        expect(screen.getByText('Est: 5.25 packs')).toBeDefined();
        expect(screen.getByText('Rounded: 5 packs')).toBeDefined();
    });

    it('updates style when a StyleSelector option is clicked', () => {
        render(<App />);
        const boxBraidsBtn = screen.getByText('Box Braids');
        fireEvent.click(boxBraidsBtn);

        expect(mockSetStylePos).toHaveBeenCalledWith(2);
    });

    it('triggers thickness update when the RangeSlider is changed', () => {
        render(<App />);

        // Find the thickness slider (input range)
        const thicknessSlider = screen.getAllByRole('slider')[0]; // First slider is usually thickness

        fireEvent.change(thicknessSlider, { target: { value: '6' } });

        // handleSlider wrapper converts to Number and calls setter
        expect(mockSetThicknessPos).toHaveBeenCalledWith(6);
    });
});
