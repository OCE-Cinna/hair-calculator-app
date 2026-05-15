import React, { useMemo } from 'react';
import * as THREE from 'three';

/**
 * Placeholder hair component for box braids
 * Renders a box geometry segment
 * Replace with actual braid model (.glb) when ready
 */
export const BoxBraidStrand = React.forwardRef((props, ref) => {
    return (
        <mesh ref={ref} {...props}>
            <boxGeometry args={[0.08, 0.3, 0.08]} />
            <meshStandardMaterial
                color="#2c1810"
                roughness={0.75}
                metalness={0.05}
            />
        </mesh>
    );
});

BoxBraidStrand.displayName = 'BoxBraidStrand';

/**
 * Placeholder hair component for knotless braids
 * Renders a capsule geometry segment
 * Replace with actual braid model (.glb) when ready
 */
export const KnotlessBraidStrand = React.forwardRef((props, ref) => {
    return (
        <mesh ref={ref} {...props}>
            <capsuleGeometry args={[0.04, 0.21, 4, 8]} />
            <meshStandardMaterial
                color="#2c1810"
                roughness={0.85}
                metalness={0.05}
            />
        </mesh>
    );
});

KnotlessBraidStrand.displayName = 'KnotlessBraidStrand';

/**
 * Placeholder hair component for twists
 * Renders a cylinder geometry segment
 * Replace with actual twist model (.glb) when ready
 */
export const TwistStrand = React.forwardRef((props, ref) => {
    return (
        <mesh ref={ref} {...props}>
            <cylinderGeometry args={[0.04, 0.04, 0.3, 6]} />
            <meshStandardMaterial
                color="#3d2314"
                roughness={0.85}
                metalness={0.05}
            />
        </mesh>
    );
});

TwistStrand.displayName = 'TwistStrand';

/**
 * Placeholder hair component for locs
 * Renders a tapered cylinder (smaller at top)
 * Replace with actual loc model (.glb) when ready
 */
export const LocStrand = React.forwardRef((props, ref) => {
    return (
        <mesh ref={ref} {...props}>
            <cylinderGeometry args={[0.028, 0.04, 0.3, 6]} />
            <meshStandardMaterial
                color="#2a1a0e"
                roughness={0.85}
                metalness={0.05}
            />
        </mesh>
    );
});

LocStrand.displayName = 'LocStrand';
