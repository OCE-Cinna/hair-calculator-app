import { describe, it, expect, beforeEach } from 'vitest';
import { useHairStore } from './hairStore';

describe('useHairStore', () => {
    beforeEach(() => {
        useHairStore.setState({
            stylePos: 2,
            thicknessPos: 4,
            lengthPos: 3,
            densityPos: 4
        });
    });

    it('should update style position', () => {
        const { setStylePos } = useHairStore.getState();
        setStylePos(4);
        expect(useHairStore.getState().stylePos).toBe(4);
    });

    it('should apply presets correctly', () => {
        const { applyPreset } = useHairStore.getState();
        const mockPreset = {
            stylePos: 1,
            thicknessPos: 2,
            lengthPos: 5,
            densityPos: 6
        };
        applyPreset(mockPreset);
        const state = useHairStore.getState();
        expect(state.stylePos).toBe(1);
        expect(state.lengthPos).toBe(5);
    });
});