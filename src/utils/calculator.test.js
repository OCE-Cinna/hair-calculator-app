import { describe, it, expect } from 'vitest';
import { calculateHairPacks } from './calculator';

describe('calculateHairPacks', () => {
    it('should calculate correct packs based on the formula: (s+t+d) * l * 0.95', () => {
        // Mock values: Style=1, Thickness=1, Density=1, Length=1
        // Expected: (1+1+1) * 1 * 0.95 = 2.85
        expect(calculateHairPacks(1, 1, 1, 1)).toBeCloseTo(2.85);
    });

    it('should handle zero values gracefully', () => {
        expect(calculateHairPacks(0, 0, 0, 0)).toBe(0);
    });

    it('should scale linearly with length', () => {
        const base = calculateHairPacks(1, 1, 1, 1);
        expect(calculateHairPacks(1, 1, 1, 2)).toBeCloseTo(base * 2);
    });
});