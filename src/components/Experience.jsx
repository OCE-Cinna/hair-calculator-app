import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore, useDevStore } from '../store/hairStore';
import { useShallow } from 'zustand/react/shallow';
import { Selection, EffectComposer, Bloom, Noise, Vignette, ToneMapping } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { HeadModel } from './HeadModel';

/**
 * Internal Error Boundary to catch 3D-specific crashes (loading, WebGL context, etc.)
 */
class ExperienceErrorBoundary extends React.Component {
    state = { hasError: false };
    static getDerivedStateFromError() { return { hasError: true }; }
    render() {
        if (this.state.hasError) {
            return (
                <div className="flex items-center justify-center w-full h-full bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                    <p className="text-gray-400 text-sm">Rendering Error: Please refresh or check assets.</p>
                </div>
            );
        }
        return this.props.children;
    }
}

/**
 * useRaycastHairPlacement - Custom React hook for dynamic hair parting and placement.
 * 
 * CORE ALGORITHM:
 * This engine generates realistic hair partings using "Spherical Raycasting". 
 * Instead of randomly scattering points, it mathematical generates horizontal rows around the head,
 * similar to how a stylist sections hair.
 * 
 * It dynamically scales the number of rows and points based on both the Density slider 
 * and the Thickness slider (via DEV_CONFIG), ensuring Micro braids have tight, tiny partings, 
 * while Jumbo braids have widely spaced, large partings.
 * 
 * @param {React.RefObject<THREE.Group>} headMeshRef - Ref to the 3D bust model.
 * @param {THREE.Texture} texture - Optional UV mask to restrict growth to the scalp area.
 * @param {number} stylePos, densityPos - Store values triggering recalculations.
 * @returns {Array<{position, normal, uv}>} The calculated coordinates for each braid root.
 */
function useRaycastHairPlacement(headMeshRef, texture, stylePos, densityPos, bustPath) {
    const [hairPoints, setHairPoints] = useState([]);
    const { DENSITY_COUNTS, THICKNESS_MAP, thicknessPos } = useHairStore(useShallow(state => ({
        DENSITY_COUNTS: state.DENSITY_COUNTS,
        THICKNESS_MAP: state.THICKNESS_MAP,
        thicknessPos: state.thicknessPos
    })));
    const { DEV_CONFIG, assets } = useDevStore(useShallow(state => ({
        DEV_CONFIG: state.DEV_CONFIG,
        assets: state.assets
    })));

    useEffect(() => {
        const headGroup = headMeshRef.current;
        if (!headGroup || !texture || !texture.image || texture.image.width === 0) {
            setHairPoints([]);
            return;
        }

        // Base target count
        let targetCount = (DENSITY_COUNTS && DENSITY_COUNTS[densityPos]) ?? 42;

        // Dynamically scale total generated points based on thickness so that Micro braids 
        // generate smaller, closer partings automatically!
        if (DEV_CONFIG?.thicknessDensityScale && THICKNESS_MAP && THICKNESS_MAP[thicknessPos]) {
            const tScale = THICKNESS_MAP[thicknessPos][1];
            // Normalize against 'Medium' (which is roughly 0.07). Jumbo (0.25) shrinks count, Micro (0.02) boosts count.
            const thicknessRatio = 0.07 / Math.max(0.01, tScale);
            // Sqrt softens the exponential curve, but still heavily populates micro braids
            targetCount = Math.floor(targetCount * Math.sqrt(thicknessRatio));
        }

        const raycaster = new THREE.Raycaster();
        const rayDirection = new THREE.Vector3(0, -1, 0);

        const canvas = document.createElement('canvas');
        const { width, height } = texture.image;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (!ctx) {
            console.error("PAH: Failed to initialize 2D context for hair placement.");
            return;
        }

        ctx.drawImage(texture.image, 0, 0);
        let imageData;
        try {
            imageData = ctx.getImageData(0, 0, width, height).data;
        } catch (e) {
            console.error("PAH: Image data access failed.", e);
            return;
        }

        let headMesh = null;
        headGroup.traverse((child) => { if (child.isMesh) headMesh = child; });
        if (!headMesh || !headMesh.geometry) return;

        const center = new THREE.Vector3(0, 1.4, 0); // Approximate center of the head
        const radius = 2.5; // Start ray from outside the head
        const raycastPoints = [];

        // Determine resolution based on density and thickness to match real-life sectioning charts
        const rowMultiplier = DEV_CONFIG?.partingRowMultiplier || 1.1;
        const pointMultiplier = DEV_CONFIG?.partingPointMultiplier || 1.8;

        // The number of horizontal rows scales with the square root of total braids
        const rowCount = Math.max(3, Math.floor(Math.sqrt(targetCount) * rowMultiplier));
        // Points in the widest ring (middle of head) scales with the square root
        const basePoints = Math.max(4, Math.floor(Math.sqrt(targetCount) * pointMultiplier));

        for (let r = 0; r <= rowCount; r++) {
            // phi: vertical angle. 0 is straight up, ~1.4 rad is around the ear/nape level
            const phi = (r / rowCount) * 1.5;

            // Calculate base points for this row
            let ptsInRow = Math.max(1, Math.floor(basePoints * Math.sin(phi)));

            // ENFORCE SYMMETRY:
            // Unless it's the single point at the absolute top of the head, 
            // force the number of points in the row to be EVEN. This guarantees that 
            // every braid on the left side has a perfect mirror on the right side.
            if (ptsInRow > 1 && ptsInRow % 2 !== 0) {
                ptsInRow += 1;
            }

            // Offset every other row to create a "brick-lay" parting pattern (standard for box braids)
            const thetaOffset = (r % 2 === 0) ? 0 : (Math.PI / ptsInRow);

            for (let t = 0; t < ptsInRow; t++) {
                const theta = (t / ptsInRow) * Math.PI * 2 + thetaOffset;

                // Convert Spherical coordinates to Cartesian
                const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
                const y = center.y + radius * Math.cos(phi);
                const z = center.z + radius * Math.sin(phi) * Math.sin(theta);

                const rayOrigin = new THREE.Vector3(x, y, z);
                // Shoot ray directly inwards towards the center of the head
                const rayDirection = new THREE.Vector3().subVectors(center, rayOrigin).normalize();

                raycaster.set(rayOrigin, rayDirection);
                const intersects = raycaster.intersectObject(headMesh);

                if (intersects.length > 0) {
                    const hit = intersects[0];
                    const uv = hit.uv;
                    if (uv) {
                        // We still check the mask so users can draw custom partings, 
                        // AND we check the mathematical Y bounds to avoid neck spawns
                        const pixelX = Math.floor(uv.x * (width - 1));
                        const pixelY = Math.floor((1 - uv.y) * (height - 1));
                        const pixelIndex = (pixelY * width + pixelX) * 4;

                        if (imageData[pixelIndex] > 128 && hit.point.y > 0.8) {
                            raycastPoints.push({
                                position: hit.point.clone(),
                                normal: hit.face.normal.clone().transformDirection(headMesh.matrixWorld),
                                uv: uv.clone()
                            });
                        }
                    }
                }
            }
        }

        setHairPoints(raycastPoints.slice(0, targetCount));
    }, [headMeshRef, texture, stylePos, densityPos, DENSITY_COUNTS, thicknessPos, THICKNESS_MAP, DEV_CONFIG, assets.custombust]);

    return hairPoints;
}

/**
 * HairStrands component renders instanced 3D hair segments (braids or fallback cylinders)
 * at specified placement points on the head model. It dynamically adjusts scale, color,
 * and orientation based on user selections (style, length, thickness).
 * @param {object} props - The component props.
 * @param {number} props.stylePos - The current style position, used for color.
 * @param {number} props.lengthPos - The current length position, determining the number of segments.
 * @param {number} props.thicknessPos - The current thickness position, scaling the hair instances.
 * @param {Array<{position: THREE.Vector3, normal: THREE.Vector3, uv: THREE.Vector2}>} props.hairPlacementPoints - Array of points where hair should be placed.
 */
function HairStrands({ stylePos, lengthPos, thicknessPos, hairPlacementPoints }) {
    const { camera } = useThree();
    const { assets, isEnabled: devEnabled } = useDevStore(useShallow(state => ({
        assets: state.assets,
        isEnabled: state.isEnabled
    })));
    const { STYLE_COLORS, THICKNESS_MAP } = useHairStore(useShallow(state => ({
        STYLE_COLORS: state.STYLE_COLORS,
        THICKNESS_MAP: state.THICKNESS_MAP
    })));

    // Style-specific model mapping
    const styleMap = {
        1: { main: "/models/boxbraid.glb", end: "/models/boxbraidend.glb" }, // Box Braids
        2: { main: "/models/flatbraid.glb", end: "/models/flatbraidend.glb" }, // Knotless / Flat
        3: { main: "/models/twist.glb", end: "/models/twistend.glb" }, // Twists
        4: { main: "/models/twist.glb", end: "/models/twistend.glb" } // Locs (fallback to twist)
    };

    const activePaths = devEnabled ? {
        main: assets?.boxbraid || styleMap[stylePos]?.main || "/models/boxbraid.glb",
        end: assets?.boxbraidend || styleMap[stylePos]?.end || "/models/boxbraidend.glb"
    } : (styleMap[stylePos] || styleMap[1]);

    const instancedMeshRef = useRef();
    const endInstancedMeshRef = useRef();
    const fallbackMeshRef = useRef();
    const debugMeshRef = useRef();

    const segmentGLTF = useGLTF(activePaths.main, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const endGLTF = useGLTF(activePaths.end, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

    const braidSegment = segmentGLTF?.scene;
    const braidEnd = endGLTF?.scene;

    const { DEV_CONFIG } = useDevStore(useShallow(state => ({ DEV_CONFIG: state.DEV_CONFIG })));

    // Robust extraction: find the first actual Mesh in the GLTF hierarchy
    // We use useMemo to ensure these are stable and defined before hooks use them.
    const { segmentGeo, segmentMat, endGeo, endMat } = useMemo(() => {
        let sGeo, sMat, eGeo, eMat;
        braidSegment?.traverse(c => {
            if (c.isMesh && !sGeo) { sGeo = c.geometry; sMat = c.material; }
        });
        braidEnd?.traverse(c => {
            if (c.isMesh && !eGeo) { eGeo = c.geometry; eMat = c.material; }
        });
        return { segmentGeo: sGeo, segmentMat: sMat, endGeo: eGeo, endMat: eMat };
    }, [braidSegment, braidEnd]);

    // --- PREMIUM BRAID SHADER ---
    const braidMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            roughness: 0.3,
            metalness: 0.1,
        });

        mat.onBeforeCompile = (shader) => {
            shader.uniforms.uTime = { value: 0 };
            shader.uniforms.uBaseColor = { value: new THREE.Color('#2c1810') };

            shader.vertexShader = `
                varying vec2 vBraidUv;
                varying vec3 vWorldPos;
                uniform float uTime;
                ${shader.vertexShader}
            `.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                
                // Dynamic Sway (GPU-side for performance)
                // The lower the segment (world Y), the more it sways
                float swayAmount = (1.5 - position.y) * 0.05; 
                transformed.x += sin(uTime * 2.0 + position.y * 5.0) * swayAmount;
                transformed.z += cos(uTime * 1.5 + position.y * 5.0) * swayAmount;
                `
            ).replace(
                '#include <uv_vertex>',
                `
                #include <uv_vertex>
                vBraidUv = uv;
                vWorldPos = (modelMatrix * instanceMatrix * vec4(position, 1.0)).xyz;
                `
            );

            shader.fragmentShader = `
                varying vec2 vBraidUv;
                varying vec3 vWorldPos;
                uniform float uTime;
                uniform vec3 uBaseColor;
                ${shader.fragmentShader}
            `.replace(
                '#include <color_fragment>',
                `
                #include <color_fragment>
                
                // Procedural Braid Pattern
                // Creates diagonal "overlaps" common in 3-strand braids
                float pattern = sin(vBraidUv.y * 60.0 + sin(vBraidUv.x * 10.0)) * 0.08;
                diffuseColor.rgb += pattern;

                // Fresnel Sheen
                vec3 viewDir = normalize(cameraPosition - vWorldPos);
                float fresnel = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 4.0);
                diffuseColor.rgb = mix(diffuseColor.rgb, vec3(1.0), fresnel * 0.25);
                `
            );
            mat.userData.shader = shader;
        };
        return mat;
    }, []);

    // Sync color and time
    useFrame((state) => {
        if (braidMaterial.userData.shader) {
            const time = state.clock.elapsedTime;
            braidMaterial.userData.shader.uniforms.uTime.value = time;
            const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
            braidMaterial.userData.shader.uniforms.uBaseColor.value.set(color);
        }
    });

    useEffect(() => {
        const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
        braidMaterial.color.set(color);
    }, [stylePos, STYLE_COLORS, braidMaterial]);


    useEffect(() => {
        if (!instancedMeshRef.current || !endInstancedMeshRef.current || !hairPlacementPoints || hairPlacementPoints.length === 0) return;
        if (!THICKNESS_MAP || !THICKNESS_MAP[thicknessPos]) return;

        if (!braidSegment || !braidEnd) return; // Guard for geometry access

        // Dynamically calculate the actual height of the loaded braid segment
        const segmentGeo = braidSegment.children[0]?.geometry;
        let originalHeight = 0.1; // fallback
        if (segmentGeo) {
            if (!segmentGeo.boundingBox) segmentGeo.computeBoundingBox();
            originalHeight = segmentGeo.boundingBox.max.y - segmentGeo.boundingBox.min.y;
        }

        const tScale = THICKNESS_MAP[thicknessPos][1]; // Get the thickness modifier

        // Map lengthPos (1-6) to absolute Y-coordinates representing a "floor" where the hair should stop.
        // This ensures braids from the top of the head fall to the exact same visual height as braids from the nape!
        const TARGET_FLOOR_Y_MAP = {
            1: 0.9,   // Ear
            2: 0.4,   // Jaw
            3: 0.0,   // Shoulder
            4: -0.6,  // Mid-back
            5: -1.2,  // Waist
            6: -2.0   // Hip
        };
        const targetFloorY = TARGET_FLOOR_Y_MAP[lengthPos] || 0.0;

        // Base step size is proportional to thickness! Jumbo uses longer pieces than Micro.
        const baseInitialStep = Math.max(0.015, tScale * 0.6);

        // Hoist math objects to prevent garbage collection pressure
        const matrix = new THREE.Matrix4();
        const currentPos = new THREE.Vector3();
        const currentDir = new THREE.Vector3();
        const gravity = new THREE.Vector3(0, -1, 0);
        const headCenter = new THREE.Vector3(0, 1.5, 0);
        const torsoCenter = new THREE.Vector3(0, 0.2, 0);
        const pushOutVec = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scaleVecStrand = new THREE.Vector3();
        const upVec = new THREE.Vector3(0, -1, 0);

        const headRadius = DEV_CONFIG?.headRadius || 0.95;
        const torsoRadius = DEV_CONFIG?.torsoRadius || 1.25;
        const torsoPushOut = DEV_CONFIG?.torsoPushOut || 0.5;

        let segmentInstanceCount = 0;

        hairPlacementPoints.forEach((point, i) => {
            currentPos.copy(point.position);
            // Start direction: push out from normal slightly
            currentDir.copy(point.normal).add(new THREE.Vector3(0, 0.2, 0)).normalize();

            const strandVariation = 0.8 + Math.random() * 0.4;
            const tScaleStrand = tScale * strandVariation;
            let step = baseInitialStep * strandVariation;

            // ==========================================
            // PHYSICS ENGINE & COLLISION LOOP
            // ==========================================
            // This loop builds the braid segment-by-segment.
            // By building it in tiny pieces rather than one solid log, the braid can bend,
            // curve, and drape organically around the body.

            for (let j = 0; j < 60; j++) {
                try {
                    const gravityBias = Math.min(0.9, 0.3 + (j * 0.05));
                    currentDir.lerp(gravity, gravityBias).normalize();

                    quaternion.setFromUnitVectors(upVec, currentDir);
                    // SQUISH MECHANICS:
                    // We compress the Y-axis (length) of the raw 3D model so every piece is exactly 'step' units long.
                    // We multiply by 1.25 to create a 25% overlap, preventing "dotted line" gaps between pieces.
                    const ySquish = (step * 1.25) / originalHeight;
                    scaleVecStrand.set(tScaleStrand, ySquish, tScaleStrand);

                    matrix.compose(currentPos, quaternion, scaleVecStrand);
                    instancedMeshRef.current.setMatrixAt(segmentInstanceCount++, matrix);

                    // Advance the cursor to the bottom of the current piece
                    currentPos.addScaledVector(currentDir, step);

                    // DYNAMIC FLOOR CHECK:
                    // If this braid has reached the target physical height (e.g. Hip), stop growing it!
                    if (currentPos.y <= targetFloorY) {
                        break;
                    }

                    // COLLISION AVOIDANCE 1: HEAD & JAW
                    const headDist = currentPos.distanceTo(headCenter);
                    if (headDist < headRadius && currentPos.y > 0.0) { // Only check upper body
                        pushOutVec.subVectors(currentPos, headCenter).normalize();
                        currentPos.addScaledVector(pushOutVec, (headRadius - headDist) * 0.8);
                        currentDir.lerp(pushOutVec, 0.3).normalize();
                    }

                    // COLLISION AVOIDANCE 2: SHOULDERS & CHEST
                    // This forces the hair to smoothly slide outwards and drape over the shoulders.
                    const torsoDist = currentPos.distanceTo(torsoCenter);
                    if (torsoDist < torsoRadius) {
                        pushOutVec.subVectors(currentPos, torsoCenter).normalize();
                        currentPos.addScaledVector(pushOutVec, (torsoRadius - torsoDist) * torsoPushOut);
                        currentDir.lerp(pushOutVec, torsoPushOut).normalize();
                    }

                    // DYNAMIC LENGTH TENSION:
                    // As the braid falls further from the scalp, gravity stretches it.
                    // We multiply the step by 1.15 each loop so the bottom pieces are long and straight,
                    // significantly reducing rendering cost while allowing tight curves at the root.
                    step *= 1.15;
                } catch (e) {
                    continue;
                }
            }
            try {
                // End cap follows the final direction
                const finalScale = new THREE.Vector3(tScaleStrand, (step * 0.5) / originalHeight, tScaleStrand);
                quaternion.setFromUnitVectors(upVec, currentDir);
                matrix.compose(currentPos, quaternion, finalScale);
                endInstancedMeshRef.current.setMatrixAt(i, matrix);
            } catch (e) { console.error("PAH: Physics loop error", e); }
        });

        // Set the final required instance counts
        instancedMeshRef.current.count = segmentInstanceCount;
        endInstancedMeshRef.current.count = hairPlacementPoints.length;

        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        endInstancedMeshRef.current.instanceMatrix.needsUpdate = true;

        // Fallback InstancedMesh (for when segments aren't loaded)
        if (fallbackMeshRef.current && (!segmentGeo || !endGeo)) {
            const fallbackMatrix = new THREE.Matrix4();
            hairPlacementPoints.forEach((point, i) => {
                const tScale = THICKNESS_MAP[thicknessPos][1];
                let dir = point.normal.clone().add(new THREE.Vector3(0, -0.5, 0)).normalize();
                dir.lerp(new THREE.Vector3(0, -1, 0), 0.8).normalize();
                const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                const pos = point.position.clone().add(dir.clone().multiplyScalar((lengthPos * 0.1) / 2));
                fallbackMatrix.compose(pos, quaternion, new THREE.Vector3(tScale, 1, tScale));
                fallbackMeshRef.current.setMatrixAt(i, fallbackMatrix);
            });
            fallbackMeshRef.current.count = hairPlacementPoints.length;
            fallbackMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [hairPlacementPoints, lengthPos, thicknessPos, THICKNESS_MAP, segmentGeo, endGeo]);

    if (hairPlacementPoints.length === 0) return null;


    if (segmentGeo && endGeo) {
        return (
            <group>
                <instancedMesh ref={instancedMeshRef} args={[segmentGeo, braidMaterial, 60000]} />
                <instancedMesh ref={endInstancedMeshRef} args={[endGeo, braidMaterial, 1000]} />
            </group>
        );
    } else {
        const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
        return (
            <instancedMesh ref={fallbackMeshRef} args={[null, null, 1000]}>
                <cylinderGeometry args={[0.02, 0.02, lengthPos * 0.1, 8]} />
                <meshStandardMaterial color={color} />
            </instancedMesh>
        );
    }
}

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
 * ThreeDSceneContent is the main content wrapper for the R3F Canvas.
 * It sets up the scene's lighting, camera controls, loads the head model, and renders the hair strands.
 */
function ThreeDSceneContent({ isMobile }) {
    const headGroupRef = useRef(null);
    const { stylePos, lengthPos, densityPos, theme, thicknessPos } = useHairStore(useShallow(state => ({
        stylePos: state.stylePos,
        lengthPos: state.lengthPos,
        densityPos: state.densityPos,
        theme: state.theme,
        thicknessPos: state.thicknessPos
    })));
    const { assets, debugRaycast, isEnabled: devEnabled } = useDevStore(useShallow(state => ({
        assets: state.assets,
        debugRaycast: state.debugRaycast,
        isEnabled: state.isEnabled
    })));

    const maskPath = (devEnabled && debugRaycast)
        ? (assets.uv_reference || "/textures/uv_reference.png")
        : (assets.scalp_mask || "/textures/scalp_mask.jpeg");

    const mask = useTexture(maskPath);
    const hairPlacementPoints = useRaycastHairPlacement(headGroupRef, mask, stylePos, densityPos, assets.custombust);

    const debugMeshRef = useRef();
    useEffect(() => {
        if (debugMeshRef.current && devEnabled && debugRaycast) {
            const matrix = new THREE.Matrix4();
            hairPlacementPoints.forEach((p, i) => {
                matrix.setPosition(p.position);
                debugMeshRef.current.setMatrixAt(i, matrix);
            });
            debugMeshRef.current.count = hairPlacementPoints.length;
            debugMeshRef.current.instanceMatrix.needsUpdate = true;
        }
    }, [hairPlacementPoints, devEnabled, debugRaycast]);

    // Dynamic background color from CSS variable
    const [bgColor, setBgColor] = useState('#f3f4f6');
    useEffect(() => {
        const style = getComputedStyle(document.documentElement);
        const color = style.getPropertyValue('--color-canvas-bg').trim();
        if (color) setBgColor(color);
    }, [theme]);

    return (
        <>
            <color attach="background" args={[bgColor]} />
            <ambientLight intensity={0.5} color="#ffffff" />
            {/* Key Light */}
            <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow={!isMobile} />
            {/* Fill Light */}
            <directionalLight position={[-5, 3, 5]} intensity={0.8} color="#b0c4de" />
            {/* Rim/Back Light */}
            <directionalLight position={[0, 5, -8]} intensity={2.5} color="#ffd700" />
            <CameraFollowLight intensity={0.6} />
            <OrbitControls enableDamping dampingFactor={0.15} target={[0, 1.5, 0]} maxPolarAngle={Math.PI / 1.5} minPolarAngle={0.2} minDistance={5} maxDistance={12} />
            <HeadModel ref={headGroupRef} />
            <HairStrands stylePos={stylePos} lengthPos={lengthPos} thicknessPos={thicknessPos} hairPlacementPoints={hairPlacementPoints} />

            {/* POST-PROCESSING - Throttled on mobile */}
            <EffectComposer disableNormalPass multisampling={isMobile ? 0 : 8}>
                {!isMobile && (
                    <Bloom
                        luminanceThreshold={1.0}
                        mipmapBlur
                        intensity={0.5}
                        radius={0.4}
                    />
                )}
                {!isMobile && <Noise opacity={0.02} />}
                <Vignette eskil={false} offset={0.1} darkness={isMobile ? 0.3 : 0.5} />
                <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
            </EffectComposer>

            {/* DEBUG VISUALIZATION: Render orbs at spawn points using InstancedMesh */}
            {devEnabled && debugRaycast && (
                <instancedMesh ref={debugMeshRef} args={[null, null, 1000]}>
                    <sphereGeometry args={[0.015, 8, 8]} />
                    <meshBasicMaterial color="#FF6B00" />
                </instancedMesh>
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

try {
    useGLTF.preload('/models/boxbraid.glb');
    useGLTF.preload('/models/boxbraidend.glb');
} catch (e) { }
