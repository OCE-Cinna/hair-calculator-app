import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { PresetGallery } from './PresetGallery';

// Mock Lucide icons to avoid rendering complexities in tests
vi.mock('lucide-react', () => ({
    ChevronLeft: () => <div data-testid="left-arrow" />,
    ChevronRight: () => <div data-testid="right-arrow" />,
}));

const mockPresets = [
    {
        id: 'hip_medium_lock',
        label: 'Hip Locs',
        sublabel: 'Medium · Hip Length',
        image: '/hairstyles/hip_medium_lock.jpg',
        bgGradient: 'from-amber-950 to-stone-800',
    }
];

describe('PresetGallery Integration', () => {
    it('triggers onSelectPreset with correct parameters when a card is clicked', () => {
        const handleSelectPreset = vi.fn();

        render(
            <PresetGallery
                presets={mockPresets}
                onSelectPreset={handleSelectPreset}
                activePresetId={null}
            />
        );

        // Find and click the preset card
        const presetCard = screen.getByRole('button', { name: /Load preset: Hip Locs/i });
        fireEvent.click(presetCard);

        // Check if callback was called with the preset and its parsed data
        expect(handleSelectPreset).toHaveBeenCalledWith(expect.objectContaining({ id: 'hip_medium_lock' }), expect.any(Object));
    });
});