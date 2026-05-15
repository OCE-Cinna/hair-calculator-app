import React, { forwardRef } from 'react';
import { useGLTF, useTexture, Center } from '@react-three/drei';
import { useHairStore } from '../store/hairStore';
import * as THREE from 'three';

export const HeadModel = forwardRef((props, ref) => {
    const { assets } = useHairStore();

    // Check for developer overrides, else use new organized paths
    const bustPath = assets.custombust || "/models/custombust.glb";
    const maskPath = assets.scalp_mask || "/textures/scalp_mask.jpeg";

    const { scene } = useGLTF(bustPath);
    const mask = useTexture(maskPath);

    // Apply the scalp mask to the bust material
    scene.traverse((child) => {
        if (child.isMesh && child.material) {
            if (useHairStore.getState().debugRaycast) {
                child.material.map = mask;
            } else {
                child.material.map = null;
                child.material.color = new THREE.Color("#956a4d"); // Natural skin tone fallback
                child.material.roughness = 0.6;
            }
            child.material.needsUpdate = true;
        }
    });

    return (
        <Center position={[0, 0, 0]} alignTop>
            <primitive ref={ref} object={scene} {...props} />
        </Center>
    );
});

HeadModel.displayName = "HeadModel";
useGLTF.preload("/models/custombust.glb");