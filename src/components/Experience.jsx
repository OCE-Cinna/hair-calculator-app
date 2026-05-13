import React, { useRef, useMemo, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, useTexture, Loader } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore } from '../store/hairStore';
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
    const DENSITY_COUNTS = useHairStore(state => state.DENSITY_COUNTS);
    const THICKNESS_MAP = useHairStore(state => state.THICKNESS_MAP);
    const thicknessPos = useHairStore(state => state.thicknessPos);
    const DEV_CONFIG = useHairStore(state => state.DEV_CONFIG);

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

        // We no longer need symmetrical duplication because the spherical math generates full 360 rings!
        // We just slice to target count if it somehow exceeds it.
        setHairPoints(raycastPoints.slice(0, targetCount));
    }, [headMeshRef, texture, stylePos, densityPos, DENSITY_COUNTS, bustPath]); // Re-run when model changes

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
 * Hair strands renderer using InstancedMesh with GLTF models
 */
function HairStrands({ stylePos, lengthPos, thicknessPos, hairPlacementPoints }) {
    const { assets } = useHairStore();
    const braidPath = assets?.boxbraid || "/models/boxbraid.glb";
    const braidEndPath = assets?.boxbraidend || "/models/boxbraidend.glb";

    const instancedMeshRef = useRef();
    const endInstancedMeshRef = useRef();

    // Enable Draco decoding. This allows the user to upload DRACO-compressed GLB files 
    // to significantly reduce download times and memory overhead.
    const segmentGLTF = useGLTF(braidPath, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');
    const endGLTF = useGLTF(braidEndPath, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

    const braidSegment = segmentGLTF?.scene;
    const braidEnd = endGLTF?.scene;

    const STYLE_COLORS = useHairStore(state => state.STYLE_COLORS);
    const THICKNESS_MAP = useHairStore(state => state.THICKNESS_MAP);
    const DEV_CONFIG = useHairStore(state => state.DEV_CONFIG);
    useEffect(() => {
        if (!braidSegment || !braidEnd) return;
        const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
        try {
            braidSegment.traverse(c => { if (c.isMesh && c.material) c.material.color.set(color); });
            braidEnd.traverse(c => { if (c.isMesh && c.material) c.material.color.set(color); });
        } catch (e) {
            console.error("PAH: Error updating hair colors.", e);
        }
    }, [braidSegment, braidEnd, stylePos, STYLE_COLORS]);

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

        const matrix = new THREE.Matrix4();
        let segmentInstanceCount = 0;

        hairPlacementPoints.forEach((point, i) => {
            let currentPos = point.position.clone();
            // Start direction: push out from normal slightly
            let currentDir = point.normal.clone().add(new THREE.Vector3(0, 0.2, 0)).normalize();
            
            // Random variation per strand (80% to 120% size)
            const strandVariation = 0.8 + Math.random() * 0.4;
            const tScaleStrand = tScale * strandVariation;
            // Mathematical head and torso bounds to prevent clipping into the bust model
            const headCenter = new THREE.Vector3(0, DEV_CONFIG?.headCenterY || 1.25, 0);
            const headRadius = DEV_CONFIG?.headRadius || 0.95;
            
            // Secondary bounding sphere specifically for the chest/shoulders
            const torsoCenter = new THREE.Vector3(0, DEV_CONFIG?.torsoCenterY || 0.2, 0);
            const torsoRadius = DEV_CONFIG?.torsoRadius || 1.25;

            // Start with base step, multiplied by random variation! 
            // Thicker random strands will be slightly longer overall, looking highly organic.
            let step = baseInitialStep * strandVariation; 

            // ==========================================
            // PHYSICS ENGINE & COLLISION LOOP
            // ==========================================
            // This loop builds the braid segment-by-segment.
            // By building it in tiny pieces rather than one solid log, the braid can bend,
            // curve, and drape organically around the body.

            for (let j = 0; j < 60; j++) { // Safety max of 60 segments per strand
                try {
                    // GRAVITY BLENDING: 
                    // Slowly drag the segment's direction vector downwards to simulate heavy hair falling.
                    currentDir.lerp(new THREE.Vector3(0, -1, 0), 0.4).normalize();
                    // The GLTF model naturally points DOWN (-Y), so we map its base vector to currentDir.
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), currentDir);
                    
                    // SQUISH MECHANICS:
                    // We compress the Y-axis (length) of the raw 3D model so every piece is exactly 'step' units long.
                    // We multiply by 1.25 to create a 25% overlap, preventing "dotted line" gaps between pieces.
                    const ySquish = (step * 1.25) / originalHeight;
                    const scaleVecStrand = new THREE.Vector3(tScaleStrand, ySquish, tScaleStrand);

                    matrix.compose(currentPos, quaternion, scaleVecStrand);
                    instancedMeshRef.current.setMatrixAt(segmentInstanceCount++, matrix);
                    
                    // Advance the cursor to the bottom of the current piece
                    currentPos.add(currentDir.clone().multiplyScalar(step));

                    // DYNAMIC FLOOR CHECK:
                    // If this braid has reached the target physical height (e.g. Hip), stop growing it!
                    if (currentPos.y <= targetFloorY) {
                        break;
                    }

                    // COLLISION AVOIDANCE 1: HEAD & JAW
                    const headDist = currentPos.distanceTo(headCenter);
                    if (headDist < headRadius && currentPos.y > 0.0) { // Only check upper body
                        const pushOut = new THREE.Vector3().subVectors(currentPos, headCenter).normalize();
                        currentPos.add(pushOut.multiplyScalar((headRadius - headDist) * 0.8));
                        currentDir.lerp(pushOut, 0.3).normalize();
                    }

                    // COLLISION AVOIDANCE 2: SHOULDERS & CHEST
                    // This forces the hair to smoothly slide outwards and drape over the shoulders.
                    const torsoDist = currentPos.distanceTo(torsoCenter);
                    if (torsoDist < torsoRadius) {
                        const pushOut = new THREE.Vector3().subVectors(currentPos, torsoCenter).normalize();
                        const pushStrength = DEV_CONFIG?.torsoPushOut || 0.5;
                        currentPos.add(pushOut.multiplyScalar((torsoRadius - torsoDist) * pushStrength));
                        currentDir.lerp(pushOut, pushStrength).normalize();
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
                matrix.compose(currentPos, new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), currentDir), finalScale);
                endInstancedMeshRef.current.setMatrixAt(i, matrix);
            } catch (e) {}
        });

        // Set the final required instance counts
        instancedMeshRef.current.count = segmentInstanceCount;
        endInstancedMeshRef.current.count = hairPlacementPoints.length;

        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        endInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }, [hairPlacementPoints, lengthPos, thicknessPos, THICKNESS_MAP]); // Added THICKNESS_MAP to dependencies

    if (hairPlacementPoints.length === 0) return null;

    // Robust extraction: find the first actual Mesh in the GLTF hierarchy
    let segmentGeo, segmentMat, endGeo, endMat;
    braidSegment?.traverse(c => {
        if (c.isMesh && !segmentGeo) { segmentGeo = c.geometry; segmentMat = c.material; }
    });
    braidEnd?.traverse(c => {
        if (c.isMesh && !endGeo) { endGeo = c.geometry; endMat = c.material; }
    });

    if (segmentGeo && endGeo) {
        return (
            <group>
                <instancedMesh ref={instancedMeshRef} args={[segmentGeo, segmentMat, 30000]} />
                <instancedMesh ref={endInstancedMeshRef} args={[endGeo, endMat, 1000]} />
            </group>
        );
    } else {
        return (
            <group>
                {hairPlacementPoints.map((point, i) => {
                    const tScale = (THICKNESS_MAP && THICKNESS_MAP[thicknessPos]) ? THICKNESS_MAP[thicknessPos][1] : 1;
                    const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
                    // Fallback cylinder points DOWN due to gravity, pushing out slightly from normal
                    let dir = point.normal.clone().add(new THREE.Vector3(0, -0.5, 0)).normalize();
                    dir.lerp(new THREE.Vector3(0, -1, 0), 0.8).normalize();
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
                    const pos = point.position.clone().add(dir.clone().multiplyScalar((lengthPos * 0.1) / 2));
                    return (
                        <mesh key={i} position={pos} quaternion={quaternion}>
                            <cylinderGeometry args={[0.02 * tScale, 0.02 * tScale, lengthPos * 0.1, 8]} />
                            <meshStandardMaterial color={color} />
                        </mesh>
                    );
                })}
            </group>
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
function ThreeDSceneContent() {
    const headGroupRef = useRef(null);
    const { assets, debugRaycast, stylePos, lengthPos, densityPos } = useHairStore();
    const thicknessPos = useHairStore(state => state.thicknessPos); // Get thicknessPos from store
    const maskPath = debugRaycast ? (assets.uv_reference || "/textures/uv_reference.png") : (assets.scalp_mask || "/textures/scalp_mask.jpeg"); // This line was duplicated, removed the extra one.
    const mask = useTexture(maskPath);
    const hairPlacementPoints = useRaycastHairPlacement(headGroupRef, mask, stylePos, densityPos, assets.custombust);

    return (
        <>
            <color attach="background" args={['#f3f4f6']} />
            <ambientLight intensity={0.5} color="#ffffff" />
            {/* Key Light */}
            <directionalLight position={[4, 6, 4]} intensity={1.5} castShadow />
            {/* Fill Light */}
            <directionalLight position={[-5, 3, 5]} intensity={0.8} color="#b0c4de" />
            {/* Rim/Back Light */}
            <directionalLight position={[0, 5, -8]} intensity={2.5} color="#ffd700" />
            <CameraFollowLight intensity={0.6} />
            <OrbitControls enableDamping dampingFactor={0.15} target={[0, 1.5, 0]} maxPolarAngle={Math.PI / 1.5} minPolarAngle={0.2} minDistance={5} maxDistance={12} />
            <HeadModel ref={headGroupRef} />
            <HairStrands stylePos={stylePos} lengthPos={lengthPos} thicknessPos={thicknessPos} hairPlacementPoints={hairPlacementPoints} />
        </>
    );
}

/**
 * Experience component provides the main entry point for the 3D scene.
 * It sets up the R3F Canvas and handles suspense for asset loading.
 */
export function Experience() {
    return (
        <div className="w-full h-full bg-gray-100 rounded-lg shadow-inner relative overflow-hidden" style={{ touchAction: 'none' }}>
            <ExperienceErrorBoundary>
                <Canvas camera={{ fov: 50, position: [0, 2, 10] }}>
                    <Suspense fallback={null}>
                        <ThreeDSceneContent />
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
