import React, { useRef } from 'react';
import { useGLTF, useTexture } from '@react-three/drei';
import { useHairStore } from '../store/hairStore';

/**
 * HeadModel component loads and displays the 3D head model.
 * It can dynamically load a custom bust GLB and apply a scalp mask texture,
 * prioritizing assets provided via the Zustand store for customization.
 */
export function HeadModel(props) {
    const { assets } = useHairStore();
    // Load model from custom assets if provided, otherwise use default path
    const { scene } = useGLTF(assets.custombust || '/models/custombust.glb');
    // Load texture mask used for hair placement raycasting
    const scalpMaskTexture = useTexture(assets.scalp_mask || '/textures/scalp_mask.jpeg');
    return <primitive object={scene} {...props} />;
}