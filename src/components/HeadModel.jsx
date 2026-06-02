import React, { forwardRef } from 'react';
import { useGLTF, useTexture, Center } from '@react-three/drei';
import { useHairStore, useDevStore } from '../store/hairStore';
import * as THREE from 'three';

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

export const HeadModel = forwardRef((props, ref) => {
    const { assets, debugRaycast, isEnabled: devEnabled } = useDevStore();
    const { theme } = useHairStore();

    const bustPath = (devEnabled && assets.custom_bust) ? assets.custom_bust : "/models/custom_bust.glb";
    const maskPath = (devEnabled && assets.scalp_mask) ? assets.scalp_mask : "/textures/scalp_mask.jpeg";

    const { scene } = useGLTF(bustPath, DRACO_DECODER);
    const mask = useTexture(maskPath);

    // Dynamic skin tone from CSS variable
    React.useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const skinColor = style.getPropertyValue('--color-skin-fallback').trim() || "#774f34";
        
        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                if (devEnabled && debugRaycast) {
                    child.material.map = mask;
                } else {
                    child.material.map = null;
                    child.material.color.set(skinColor);
                    child.material.roughness = 0.6;
                }
                child.material.needsUpdate = true;
            }
        });
    }, [scene, mask, devEnabled, debugRaycast, theme]);

    return (
        <Center>
            <primitive ref={ref} object={scene} {...props} />
        </Center>
    );
});

HeadModel.displayName = "HeadModel";
useGLTF.preload("/models/custom_bust.glb", DRACO_DECODER);