import React from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * Head model component that loads custombust.glb and applies scalp_mask.jpeg texture
 * Falls back to a simple sphere if model fails to load
 */
export const HeadModel = React.forwardRef((props, ref) => {
    let scene = null;
    let texture = null;

    try {
        const gltf = useGLTF('/models/custombust.glb');
        scene = gltf.scene;
        texture = useTexture('/scalp_mask.jpeg');
    } catch (error) {
        console.warn('Failed to load custombust.glb, using fallback sphere:', error);
    }

    if (scene) {
        // Clone the scene to avoid modifying the original
        const clonedScene = scene.clone();

        // Apply texture to the mesh
        clonedScene.traverse((child) => {
            if (child.isMesh) {
                child.material.map = texture;
                child.material.needsUpdate = true;
            }
        });

        return (
            <group ref={ref} {...props}>
                <primitive object={clonedScene} />
            </group>
        );
    } else {
        // Fallback to simple sphere
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
    }
});

HeadModel.displayName = 'HeadModel';

// Preload the GLTF and texture (only if they exist)
try {
    useGLTF.preload('/models/custombust.glb');
    useTexture.preload('/scalp_mask.jpeg');
} catch (error) {
    console.warn('Preload failed:', error);
}
