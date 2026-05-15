import React, { forwardRef } from 'react';
import { useGLTF, useTexture, Center } from '@react-three/drei';
import { useHairStore, useDevStore } from '../store/hairStore';
import * as THREE from 'three';

export const HeadModel = forwardRef((props, ref) => {
    const { assets, debugRaycast, isEnabled: devEnabled } = useDevStore();
    const { theme } = useHairStore();

    const bustPath = (devEnabled && assets.custombust) ? assets.custombust : "/models/custombust.glb";
    const maskPath = (devEnabled && assets.scalp_mask) ? assets.scalp_mask : "/textures/scalp_mask.jpeg";

    const { scene } = useGLTF(bustPath, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
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
        <Center position={[0, 0, 0]} alignTop>
            <primitive ref={ref} object={scene} {...props} />
        </Center>
    );
});

HeadModel.displayName = "HeadModel";
useGLTF.preload("/models/custombust.glb");