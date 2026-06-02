import React, { forwardRef } from 'react';
import { useGLTF, useTexture, Center } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore } from '../../stores/hairStore';
import { useDevStore } from '../../stores/devStore';

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

export const HeadModel = forwardRef((props, ref) => {
    const { assets, debugRaycast, isEnabled: devEnabled } = useDevStore();
    const { theme, showScalpPattern } = useHairStore();

    const bustPath = (devEnabled && assets.custom_bust) ? assets.custom_bust : "/models/custom_bust.glb";
    const maskPath = (devEnabled && assets.scalp_mask) ? assets.scalp_mask : "/textures/scalp_mask.jpeg";
    const patternPath = "/textures/scalp_mask.jpeg";

    const { scene } = useGLTF(bustPath, DRACO_DECODER);
    const mask = useTexture(maskPath);
    const patternMask = useTexture(patternPath);

    // Dynamic skin tone from CSS variable
    React.useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const skinColor = style.getPropertyValue('--color-skin-fallback').trim() || "#774f34";

        scene.traverse((child) => {
            if (child.isMesh && child.material) {
                // Reset state
                child.material.map = null;
                child.material.emissiveMap = null;
                child.material.emissive = new THREE.Color(0x000000);
                child.material.color.set(skinColor);
                child.material.roughness = 0.6;

                if (showScalpPattern) {
                    // Use emissive map to add the colorful lines over the brown skin without overriding it
                    child.material.emissiveMap = patternMask;
                    child.material.emissive = new THREE.Color(0xffffff);
                } else if (devEnabled && debugRaycast) {
                    child.material.map = mask;
                }

                child.material.needsUpdate = true;
            }
        });
    }, [scene, mask, patternMask, devEnabled, debugRaycast, theme, showScalpPattern]);

    return (
        <Center>
            <primitive ref={ref} object={scene} {...props} />
        </Center>
    );
});

HeadModel.displayName = "HeadModel";
useGLTF.preload("/models/custom_bust.glb", DRACO_DECODER);

