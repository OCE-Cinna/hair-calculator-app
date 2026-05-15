import React from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Placeholder head model component
 * Replace with actual low-poly head model when ready
 * 
 * For now, renders a simple sphere scaled to head shape
 * User can replace by loading a .glb file here later
 */
export const HeadModel = React.forwardRef((props, ref) => {
    return (
        <group ref={ref} {...props}>
            <mesh position={[0, 2, 0]} scale={[1, 1.2, 1]}>
                <sphereGeometry args={[0.9, 32, 32]} />
                <meshStandardMaterial
                    color="#8b5a3c"
                    roughness={0.7}
                    metalness={0.1}
                    side={THREE.FrontSide}
                />
            </mesh>
        </group>
    );
});

HeadModel.displayName = 'HeadModel';
