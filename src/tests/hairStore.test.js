import { describe, it, expect, beforeEach } from 'vitest';
import { useHairStore } from '../stores/hairStore';

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

    it('should reset selections correctly', () => {
        const { resetSelections } = useHairStore.getState();
        resetSelections();
        const state = useHairStore.getState();
        expect(state.stylePos).toBe(1);
        expect(state.thicknessPos).toBe(4);
        expect(state.lengthPos).toBe(3);
        expect(state.densityPos).toBe(3);
    });
});
