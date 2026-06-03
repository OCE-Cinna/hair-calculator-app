import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Loader, GizmoHelper, GizmoViewport } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore } from '../../stores/hairStore';
import { useDevStore } from '../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';
import { Selection, EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { HeadModel } from './HeadModel';
import { BoxBraidsRenderer } from './styles/BoxBraidsRenderer';
import { ViewportControls } from './ViewportControls';
import { BakePartings } from '../devkit/BakePartings';

/**
 * Internal Error Boundary to catch 3D-specific crashes (loading, WebGL context, etc.)
 */
class ExperienceErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    reset() { this.setState({ hasError: false }); }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex flex-col items-center justify-center w-full h-full gap-4 bg-glass-panel-muted rounded-3xl">
                    <p className="text-text-faint text-sm text-center px-6">3D rendering error. Check that your assets are in place.</p>
                    <button
                        onClick={() => this.reset()}
                        className="flex items-center gap-2 px-4 py-2 bg-brand text-white text-xs font-bold rounded-xl hover:opacity-90 transition-opacity"
                    >
                        ↺ Retry
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

// (Math and spawning logic moved to usePartingPattern and BoxBraidsRenderer)

/**
 * CameraFollowLight component creates a directional light that follows the camera's position,
 * ensuring consistent lighting on the 3D scene regardless of camera movement.
 * @param {object} props - The component props.
 * @param {number} [props.intensity=1] - The intensity of the directional light.
 */
function CameraFollowLight({ intensity = 1 }) {
    const { camera } = useThree();
    const lightRef = useRef();
    useFrame(() => {
        if (!lightRef.current) return;
        lightRef.current.position.copy(camera.position);
        lightRef.current.target.position.set(0, 2, 0);
        lightRef.current.target.updateMatrixWorld();
    });
    return <directionalLight ref={lightRef} intensity={intensity} />;
}

/**
 * DynamicLighting adapts the scene lights based on the user's selected lighting mode.
 */
function DynamicLighting({ isMobile }) {
    const { lightingMode } = useHairStore(useShallow(state => ({ lightingMode: state.lightingMode })));

    if (lightingMode === 'studio') {
        return (
            <>
                <ambientLight intensity={0.8} color="#ffffff" />
                <directionalLight position={[4, 6, 4]} intensity={2.0} castShadow={!isMobile} />
                <directionalLight position={[-5, 3, 5]} intensity={1.2} color="#ffffff" />
                <directionalLight position={[0, 5, -8]} intensity={1.0} color="#ffffff" />
                <CameraFollowLight intensity={0.8} />
            </>
        );
    }

    if (lightingMode === 'moody') {
        return (
            <>
                <ambientLight intensity={0.2} color="#2b2b36" />
                <directionalLight position={[4, 6, 4]} intensity={1.5} color="#ffaa55" castShadow={!isMobile} />
                <directionalLight position={[-5, 3, 5]} intensity={0.5} color="#444488" />
                <directionalLight position={[0, 5, -8]} intensity={2.0} color="#ff3366" />
                <CameraFollowLight intensity={0.2} />
            </>
        );
    }

    // Default 'natural'
    return (
        <>
            <ambientLight intensity={0.5} color="#ffffff" />
            <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow={!isMobile} />
            <directionalLight position={[-5, 3, 5]} intensity={0.8} color="#b0c4de" />
            {/* Soft, warm rim light instead of overly bright yellow */}
            <directionalLight position={[0, 5, -8]} intensity={1.0} color="#ffd7b5" />
            <CameraFollowLight intensity={0.6} />
        </>
    );
}

/**
 * ThreeDSceneContent is the main content wrapper for the R3F Canvas.
 * It sets up the scene's lighting, camera controls, loads the head model, and renders the hair strands.
 */
function ThreeDSceneContent({ isMobile }) {
    const [headGroup, setHeadGroup] = useState(null);
    const { theme } = useHairStore(useShallow(state => ({ theme: state.theme })));
    const { assets, debugRaycast, isEnabled: devEnabled, DEV_CONFIG, shouldBake, setShouldBake } = useDevStore(useShallow(state => ({
        assets: state.assets,
        debugRaycast: state.debugRaycast,
        isEnabled: state.isEnabled,
        DEV_CONFIG: state.DEV_CONFIG,
        shouldBake: state.shouldBake,
        setShouldBake: state.setShouldBake
    })));

    // OVERRIDE FOR BASELINE FOCUS MODE:
    // Lock the 3D viewport to Box Braids, Shoulder Length, Medium Density, Medium Thickness
    // The UI sliders can still be used for Pack Calculations, but won't affect the 3D model.
    const focusStylePos = 1;
    const focusLengthPos = 3; 
    const focusDensityPos = 3;
    const focusThicknessPos = 4;

    const maskPath = (devEnabled && debugRaycast)
        ? (assets.scalp_uv_guide || "/textures/scalp_uv_guide.jpeg")
        : (assets.scalp_mask || "/textures/scalp_mask.jpeg");

    const mask = useTexture(maskPath);
    
    // We no longer raycast dynamically. The data is loaded directly in BoxBraidsRenderer.

    useEffect(() => {
        // Debug orbs are now handled differently or disabled since we removed real-time point generation
    }, [devEnabled, debugRaycast]);

    // Dynamic background color from CSS variable
    const [bgColor, setBgColor] = useState('#f3f4f6');
    useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const color = style.getPropertyValue('--color-canvas-bg').trim();
        // eslint-disable-next-line react-hooks/set-state-in-effect
        if (color) setBgColor(color);
    }, [theme]);

    return (
        <>
            <color attach="background" args={[bgColor]} />
            <DynamicLighting isMobile={isMobile} />
            <OrbitControls enableDamping dampingFactor={0.15} target={[0, 1.5, 0]} maxPolarAngle={Math.PI / 1.5} minPolarAngle={0.2} minDistance={5} maxDistance={12} />
            <GizmoHelper alignment="bottom-right" margin={[40, 40]}>
                <GizmoViewport axisColors={['#ff3b30', '#34c759', '#007aff']} labelColor="white" />
            </GizmoHelper>
            <HeadModel ref={setHeadGroup} />
            {shouldBake && <BakePartings headGroup={headGroup} mask={mask} onComplete={() => setShouldBake(false)} />}
            <BoxBraidsRenderer stylePos={focusStylePos} lengthPos={focusLengthPos} densityPos={focusDensityPos} thicknessPos={focusThicknessPos} />

            {/* POST-PROCESSING - Throttled on mobile */}
            <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 8}>
                {!isMobile && (
                    <Bloom
                        luminanceThreshold={1.0}
                        mipmapBlur
                        intensity={0.2}
                        radius={0.4}
                    />
                )}
                {!isMobile && <Noise opacity={0.02} />}
                <Vignette eskil={false} offset={0.1} darkness={isMobile ? 0.3 : 0.5} />
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>

            {/* DEBUG VISUALIZATION: Render orbs at spawn points using InstancedMesh */}
            {devEnabled && debugRaycast && (
                <>
                    {/* Collision Boundaries */}
                    <group opacity={0.3}>
                        <mesh position={[0, DEV_CONFIG.headCenterY || 1.5, DEV_CONFIG.headCenterZ || 0.0]}>
                            <sphereGeometry args={[DEV_CONFIG.headRadius || 0.95, 32, 32]} />
                            <meshBasicMaterial color="#ff6b00" wireframe transparent opacity={0.3} />
                        </mesh>
                        <mesh 
                            position={[0, DEV_CONFIG.torsoCenterY || 0.2, 0]}
                            scale={[DEV_CONFIG.torsoStretchX || 1.5, 1, DEV_CONFIG.torsoStretchZ || 1.5]}
                        >
                            <sphereGeometry args={[DEV_CONFIG.torsoRadius || 1.25, 32, 32]} />
                            <meshBasicMaterial color="#0066ff" wireframe transparent opacity={0.2} />
                        </mesh>
                    </group>
                </>
            )}
        </>
    );
}

/**
 * Experience component provides the main entry point for the 3D scene.
 * It sets up the R3F Canvas and handles suspense for asset loading.
 */
export function Experience() {
    const isMobile = useMemo(() => /iPhone|iPad|iPod|Android/i.test(navigator.userAgent), []);

    return (
        <div className="w-full h-full relative overflow-hidden" style={{ touchAction: 'none' }}>
            <ViewportControls />
            <ExperienceErrorBoundary>
                <Canvas
                    dpr={isMobile ? [1, 1.5] : [1, 2]}
                    gl={{
                        antialias: !isMobile,
                        powerPreference: "high-performance",
                        stencil: false,
                        alpha: false
                    }}
                    camera={{ fov: 50, position: [0, 2, 10] }}
                >
                    <Suspense fallback={null}>
                        <ThreeDSceneContent isMobile={isMobile} />
                    </Suspense>
                </Canvas>
                <Loader />
            </ExperienceErrorBoundary>
        </div>
    );
}

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

try {
    useGLTF.preload('/models/custom_bust.glb', DRACO_DECODER);
    useGLTF.preload('/models/hair_box_mid.glb', DRACO_DECODER);
    useGLTF.preload('/models/hair_twist_mid.glb', DRACO_DECODER);
    useGLTF.preload('/models/hair_loc_mid.glb', DRACO_DECODER);
} catch (e) { console.error(e); }

