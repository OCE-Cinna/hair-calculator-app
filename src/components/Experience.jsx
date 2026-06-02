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
function useRaycastHairPlacement(headMesh, texture, stylePos, densityPos, bustPath) {
    const { DENSITY_COUNTS, THICKNESS_MAP, thicknessPos } = useHairStore(useShallow(state => ({
        DENSITY_COUNTS: state.DENSITY_COUNTS,
        THICKNESS_MAP: state.THICKNESS_MAP,
        thicknessPos: state.thicknessPos
    })));
    const { DEV_CONFIG } = useDevStore(useShallow(state => ({
        DEV_CONFIG: state.DEV_CONFIG
    })));

    // Ref to store the static high-density candidate pool
    const poolRef = useRef([]);
    const [poolKey, setPoolKey] = useState(0);

    // Part 1: Generate static candidate pool exactly once when geometry/texture changes
    useEffect(() => {
        if (!headMesh || !texture || !texture.image || texture.image.width === 0) {
            if (poolRef.current.length > 0) {
                poolRef.current = [];
                setPoolKey(k => k + 1);
            }
            return;
        }

        let mesh = null;
        headMesh.traverse((child) => { if (child.isMesh) mesh = child; });
        if (!mesh || !mesh.geometry) {
            if (poolRef.current.length > 0) {
                poolRef.current = [];
                setPoolKey(k => k + 1);
            }
            return;
        }

        const canvas = document.createElement('canvas');
        const { width, height } = texture.image;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        ctx.drawImage(texture.image, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height).data;

        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector3(0, 1.4, 0);
        const radius = 2.5;
        const candidates = [];

        // Run high density spherical grid (e.g. 240 targets on half-hemisphere)
        // This provides up to ~1000 candidate starting points, which is plenty for max density
        const poolDensity = 240; 
        const phiMin = 0.0;
        const phiMax = 1.4;
        const rowCount = Math.max(4, Math.floor(Math.sqrt(poolDensity) * 1.2));

        for (let r = 0; r <= rowCount; r++) {
            const phi = phiMin + (r / rowCount) * (phiMax - phiMin);
            let basePtsInRow = Math.max(4, Math.floor(Math.sqrt(poolDensity) * 2.0 * Math.sin(phi)));
            let ptsInHalfRow = Math.max(2, Math.floor(basePtsInRow / 2));
            const staggerOffset = (r % 2 === 0) ? (Math.PI / Math.max(1, basePtsInRow)) : 0;

            const rowThetas = [];
            for (let t = 0; t < ptsInHalfRow; t++) {
                const theta = -Math.PI / 2 + (t / Math.max(1, ptsInHalfRow - 1)) * Math.PI + staggerOffset;
                rowThetas.push(theta);
            }

            rowThetas.forEach((theta) => {
                const isFront = Math.sin(theta) > 0;
                const spawnChance = isFront ? 1.0 : 2.0;

                for (let s = 0; s < Math.round(spawnChance); s++) {
                    const finalTheta = theta + (s > 0 ? (Math.PI / basePtsInRow) * 0.5 : 0);

                    const x = center.x + radius * Math.sin(phi) * Math.cos(finalTheta);
                    const y = center.y + radius * Math.cos(phi);
                    const z = center.z + radius * Math.sin(phi) * Math.sin(finalTheta);

                    const rayOrigin = new THREE.Vector3(x, y, z);
                    const rayDirection = new THREE.Vector3().subVectors(center, rayOrigin).normalize();

                    raycaster.set(rayOrigin, rayDirection);
                    const intersects = raycaster.intersectObject(mesh);

                    if (intersects.length > 0) {
                        const hit = intersects[0];
                        const uv = hit.uv;

                        if (uv) {
                            const pixelX = Math.floor(uv.x * (width - 1));
                            const pixelY = Math.floor((1 - uv.y) * (height - 1));
                            const pixelIndex = (pixelY * width + pixelX) * 4;

                            const rVal = imageData[pixelIndex];
                            const gVal = imageData[pixelIndex + 1];
                            const bVal = imageData[pixelIndex + 2];

                            if (rVal > 128 || gVal > 128 || bVal > 128) {
                                let region = "top";
                                if (gVal > rVal && gVal > bVal) {
                                    region = "sides";
                                } else if (bVal > rVal && bVal > gVal) {
                                    region = "back";
                                }

                                candidates.push({
                                    position: hit.point.clone(),
                                    normal: hit.face.normal.clone().transformDirection(mesh.matrixWorld),
                                    uv: uv.clone(),
                                    region,
                                    yThreshold: region === "back" ? 0.58 : 0.85
                                });
                            }
                        }
                    }
                }
            });
        }

        poolRef.current = candidates;
        setPoolKey(k => k + 1);
    }, [headMesh, texture, bustPath]);

    // Part 2: Synchronous filtering and spacing calculation using useMemo
    return useMemo(() => {
        const candidates = poolRef.current;
        if (candidates.length === 0) return [];

        let baseDensity = (DENSITY_COUNTS && DENSITY_COUNTS[densityPos]) ?? 42;
        const thicknessScale = (THICKNESS_MAP && THICKNESS_MAP[thicknessPos]) ? THICKNESS_MAP[thicknessPos][1] : 0.07;

        const thicknessMultiplier = 0.07 / thicknessScale;
        let dynamicDensity = Math.round(baseDensity * thicknessMultiplier);
        dynamicDensity = Math.max(8, Math.min(350, dynamicDensity));

        const centerPartingWidth = DEV_CONFIG?.centerPartingWidth ?? (thicknessScale * 0.9);
        const partThickness = DEV_CONFIG?.partThickness ?? (thicknessScale * 1.15);

        const targetPoints = [];

        // Process spacing and parting constraints on the pool
        for (const candidate of candidates) {
            if (candidate.position.y <= candidate.yThreshold) continue;

            if (candidate.region === "top" && Math.abs(candidate.position.x) < centerPartingWidth) {
                continue;
            }

            let tooClose = false;
            for (const existing of targetPoints) {
                if (candidate.position.distanceTo(existing.position) < partThickness) {
                    tooClose = true;
                    break;
                }
            }
            if (tooClose) continue;

            const mirroredPoint = new THREE.Vector3(-candidate.position.x, candidate.position.y, candidate.position.z);
            const mirroredNormal = new THREE.Vector3(-candidate.normal.x, candidate.normal.y, candidate.normal.z);

            targetPoints.push({
                position: candidate.position,
                normal: candidate.normal,
                uv: candidate.uv,
                region: candidate.region
            });

            targetPoints.push({
                position: mirroredPoint,
                normal: mirroredNormal,
                uv: candidate.uv,
                region: candidate.region
            });
        }

        // Uniform sample targetPoints to select dynamicDensity elements
        const totalGenerated = targetPoints.length;
        if (totalGenerated <= dynamicDensity) {
            return targetPoints;
        }

        const sampledPoints = [];
        for (let i = 0; i < dynamicDensity; i++) {
            const index = Math.floor(i * (totalGenerated / dynamicDensity));
            sampledPoints.push(targetPoints[index]);
        }
        return sampledPoints;
    }, [poolKey, densityPos, DENSITY_COUNTS, thicknessPos, THICKNESS_MAP, DEV_CONFIG]);
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
        1: "/models/hair_box_mid.glb", // Box Braids
        2: "/models/hair_box_mid.glb", // Knotless / Flat (fallback)
        3: "/models/hair_twist_mid.glb", // Twists
        4: "/models/hair_loc_mid.glb" // Locs
    };

    const activePath = devEnabled
        ? (assets?.hair_box_mid || styleMap[stylePos] || "/models/hair_box_mid.glb")
        : (styleMap[stylePos] || styleMap[1]);

    const instancedMeshRef = useRef();
    const fallbackMeshRef = useRef();
    const debugMeshRef = useRef();

    const segmentGLTF = useGLTF(activePath, 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/');

    const braidSegment = segmentGLTF?.scene;

    const { DEV_CONFIG } = useDevStore(useShallow(state => ({ DEV_CONFIG: state.DEV_CONFIG })));

    // Robust extraction: find the first actual Mesh in the GLTF hierarchy
    const segmentGeo = useMemo(() => {
        let sGeo = null;
        braidSegment?.traverse(c => {
            if (c.isMesh && !sGeo) { sGeo = c.geometry; }
        });
        return sGeo;
    }, [braidSegment]);

    // --- PREMIUM BRAID SHADER ---
    const braidMaterial = useMemo(() => {
        const mat = new THREE.MeshStandardMaterial({
            roughness: 0.6,
            metalness: 0.05,
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
                
                // Static procedural logic only
                transformed.xyz = transformed.xyz;
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
                
                // Static diffuse only
                diffuseColor.rgb = diffuseColor.rgb;

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
        if (!instancedMeshRef.current || !hairPlacementPoints || hairPlacementPoints.length === 0) return;
        if (!THICKNESS_MAP || !THICKNESS_MAP[thicknessPos]) return;

        if (!braidSegment) return; // Guard for geometry access

        // Dynamically calculate the actual height of the loaded braid segment
        const segmentGeo = braidSegment.children[0]?.geometry;
        let actualModelHeight = 0.1; // fallback
        if (segmentGeo) {
            if (!segmentGeo.boundingBox) segmentGeo.computeBoundingBox();
            actualModelHeight = segmentGeo.boundingBox.max.y - segmentGeo.boundingBox.min.y;
        }

        // Force exactly half of the actual model's height per section for spacing & step calculation
        const originalHeight = actualModelHeight * 0.5;

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
 
        // Dynamic Physics Constants: Thinner braids curve faster, Longer hair stretches more.
        const tInverse = 1.0 - Math.min(0.8, tScale * 3.5); // 1.0 for Micro, ~0.2 for Jumbo
        const lengthStretch = 0.9 + (lengthPos / 6) * 0.2; // Longer hair = more tension
        const thicknessStretch = 0.75 + (tScale / 0.1) * 0.25; // Thinner hair = less squished texture
        
        const baseInitialStep = originalHeight * 0.72 * lengthStretch * thicknessStretch; // Spaced 20% (1/5) closer
        
        const gravityBiasStart = 0.4 + (tInverse * 0.3);
        const gravityIncrement = 0.1 + (tInverse * 0.1);

        // Hoist math objects to prevent garbage collection pressure
        const matrix = new THREE.Matrix4();
        const currentPos = new THREE.Vector3();
        const currentDir = new THREE.Vector3();
        const gravity = new THREE.Vector3(0, -1, 0);
        const headCenter = new THREE.Vector3(0, DEV_CONFIG?.headCenterY ?? 1.5, DEV_CONFIG?.headCenterZ ?? 0.0);
        const torsoCenter = new THREE.Vector3(0, DEV_CONFIG?.torsoCenterY ?? 0.2, 0);
        const pushOutVec = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scaleVecStrand = new THREE.Vector3();
        const upVec = new THREE.Vector3(0, -1, 0);

        const headRadius = DEV_CONFIG?.headRadius || 0.95;
        const torsoRadius = DEV_CONFIG?.torsoRadius || 1.25;
        const torsoStretchX = DEV_CONFIG?.torsoStretchX ?? 1.5;
        const torsoStretchZ = DEV_CONFIG?.torsoStretchZ ?? 1.5;
        const torsoPushOut = DEV_CONFIG?.torsoPushOut || 0.5;

        let segmentInstanceCount = 0;

        hairPlacementPoints.forEach((point, i) => {
            // Region-specific start direction adjustment for a premium, realistic draping layout:
            const adjustedDir = point.normal.clone();
            if (point.region === "top") {
                adjustedDir.add(new THREE.Vector3(0, 0.12, 0)); // Crown volume lift
            } else if (point.region === "sides") {
                adjustedDir.add(new THREE.Vector3(0, -0.05, 0)); // Flat side framing
            } else if (point.region === "back") {
                adjustedDir.add(new THREE.Vector3(0, -0.15, 0)); // Straight neck drape
            } else {
                adjustedDir.add(new THREE.Vector3(0, 0.05, 0)); // Fallback
            }

            const strandVariation = 0.8 + Math.random() * 0.4;
            const tScaleStrand = tScale * strandVariation;
            let step = baseInitialStep * strandVariation;

            // 1. Pre-trace to determine exact segment count N for this specific strand
            let tempPos = point.position.clone();
            let tempDir = adjustedDir.clone().normalize();
            let tempStep = step;
            let N = 0;

            for (let j = 0; j < 120; j++) {
                N++;
                tempPos.addScaledVector(tempDir, tempStep);
                if (tempPos.y <= targetFloorY) break;
                if (j > 4) tempStep *= 1.02;
            }

            // 2. Perform the high-fidelity tracing with our offset and draping logic
            currentPos.copy(point.position);
            currentDir.copy(adjustedDir).normalize();
            step = baseInitialStep * strandVariation;
            const segments = [];

            for (let j = 0; j < N; j++) {
                try {
                    let targetDir = new THREE.Vector3();
                    let gravityBias = 1.0;

                    if (j === 0) {
                        // Only the starting segment curves out from the scalp
                        targetDir.copy(point.normal).normalize();
                        gravityBias = 0.0;
                    } else if (point.region === "top" && j < 7) {
                        // Top braids: transition smoothly to cascade over the sides
                        const lateralX = Math.sign(point.position.x);
                        // Curve outward laterally (X), slightly forward (Z) and downward (Y)
                        targetDir.set(lateralX * 0.72, -0.62, 0.32).normalize();
                        // Lerp gently to create a gorgeous, smooth arch cascading beside side braids
                        gravityBias = 0.42;
                    } else {
                        // All other segments / regions fall vertically
                        targetDir.set(0, -1, 0);
                        gravityBias = 1.0;
                    }

                    // Curve & gravity interpolation:
                    currentDir.lerp(targetDir, gravityBias).normalize();

                    // Store trace segment
                    segments.push({
                        pos: currentPos.clone(),
                        dir: currentDir.clone(),
                        step: step,
                        tScale: tScaleStrand
                    });

                    // Advance cursor
                    currentPos.addScaledVector(currentDir, step);

                    // Stop if floor reached
                    if (currentPos.y <= targetFloorY) break;

                    // COLLISION: Head (Face and Head clipping avoidance)
                    const headDist = currentPos.distanceTo(headCenter);
                    // Use a slightly larger head radius in the front (face region) to steer braids in front of the face
                    const dynamicHeadRadius = currentPos.z > 0.0 ? headRadius * 1.20 : headRadius;
                    
                    // Allow head collision down to the jaw/chin/neck area (y > -0.3)
                    if (headDist < dynamicHeadRadius && currentPos.y > -0.3) {
                        pushOutVec.subVectors(currentPos, headCenter).normalize();
                        
                        // Enforce side-by-side falling: push braids laterally outward if they cluster near the face centerline
                        if (currentPos.z > 0.0 && Math.abs(currentPos.x) < 0.3) {
                            const lateralPush = (0.3 - Math.abs(currentPos.x)) * (tScaleStrand * 0.5);
                            pushOutVec.x += currentPos.x >= 0 ? lateralPush : -lateralPush;
                            pushOutVec.normalize();
                        }

                        currentPos.addScaledVector(pushOutVec, (dynamicHeadRadius - headDist) * 1.1); // Strong push out
                        currentDir.lerp(pushOutVec, 0.5).normalize();
                    }

                    // COLLISION: Torso (Shoulders clipping avoidance) - Ellipsoidal math for X/Z stretch
                    const rx = torsoRadius * torsoStretchX;
                    const ry = torsoRadius;
                    const rz = torsoRadius * torsoStretchZ;
                    const dx = currentPos.x - torsoCenter.x;
                    const dy = currentPos.y - torsoCenter.y;
                    const dz = currentPos.z - torsoCenter.z;
                    const normSq = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry) + (dz * dz) / (rz * rz);
                    
                    if (normSq < 1.0) {
                        const norm = Math.sqrt(normSq);
                        // Calculate surface point along the ray from center
                        const surfX = torsoCenter.x + (dx / norm) * rx;
                        const surfY = torsoCenter.y + (dy / norm) * ry;
                        const surfZ = torsoCenter.z + (dz / norm) * rz;
                        
                        pushOutVec.set(dx / (rx * rx), dy / (ry * ry), dz / (rz * rz)).normalize();
                        
                        currentPos.set(
                            currentPos.x + (surfX - currentPos.x) * torsoPushOut * 1.2,
                            currentPos.y + (surfY - currentPos.y) * torsoPushOut * 1.2,
                            currentPos.z + (surfZ - currentPos.z) * torsoPushOut * 1.2
                        );
                        currentDir.lerp(pushOutVec, torsoPushOut * 1.2).normalize();
                    }

                    if (j > 4) step *= 1.02; 
                } catch (e) {
                    break;
                }
            }

            // Now apply the segments with progressive tapering at the bottom and knotless start tapering!
            const N_segs = segments.length;
            const drawPos = new THREE.Vector3();
            if (N_segs > 0) {
                drawPos.copy(segments[0].pos);
            }

            segments.forEach((seg, k) => {
                let taper = 1.0;
                
                // Bottom progressive taper (tips)
                if (k === N_segs - 1) {
                    taper = 0.22; // Last segment tapered to 22% thickness
                } else if (k === N_segs - 2) {
                    taper = 0.52; // Second to last segment tapered to 52% thickness
                } else if (k === N_segs - 3) {
                    taper = 0.80; // Third to last segment tapered to 80% thickness
                }

                quaternion.setFromUnitVectors(upVec, seg.dir);
                
                // SQUISH: Match segment height to step size using actual GLB height with a 25% connection overlap
                let ySquish = (seg.step * 1.25) / actualModelHeight; 
                
                // Squish the starting segment (k === 0) Y-axis (height) to exactly 1/10th for a tight connection base
                let segmentStepLength = seg.step;
                if (k === 0) {
                    ySquish *= 0.10;
                    segmentStepLength *= 0.10;
                }
                
                // Flatten the depth (Z-axis) of the braid model by 50% for a sleek, flat protective layout
                const zFlatten = 0.5;
                scaleVecStrand.set(seg.tScale * taper, ySquish, seg.tScale * taper * zFlatten);

                matrix.compose(drawPos, quaternion, scaleVecStrand);
                instancedMeshRef.current.setMatrixAt(segmentInstanceCount++, matrix);

                // Advance the drawPos by the actual visual length of this segment
                drawPos.addScaledVector(seg.dir, segmentStepLength);
            });
        });

        // Set the final required instance counts
        instancedMeshRef.current.count = segmentInstanceCount;
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;

        // Fallback InstancedMesh (for when segments aren't loaded)
        if (fallbackMeshRef.current && !segmentGeo) {
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
    }, [hairPlacementPoints, lengthPos, thicknessPos, THICKNESS_MAP, segmentGeo, DEV_CONFIG]);

    if (hairPlacementPoints.length === 0) return null;

    if (segmentGeo) {
        return (
            <instancedMesh ref={instancedMeshRef} args={[segmentGeo, braidMaterial, 30000]} />
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
    const [headGroup, setHeadGroup] = useState(null);
    const { stylePos, lengthPos, densityPos, theme, thicknessPos } = useHairStore(useShallow(state => ({
        stylePos: state.stylePos,
        lengthPos: state.lengthPos,
        densityPos: state.densityPos,
        theme: state.theme,
        thicknessPos: state.thicknessPos
    })));
    const { assets, debugRaycast, isEnabled: devEnabled, DEV_CONFIG } = useDevStore(useShallow(state => ({
        assets: state.assets,
        debugRaycast: state.debugRaycast,
        isEnabled: state.isEnabled,
        DEV_CONFIG: state.DEV_CONFIG
    })));

    const maskPath = (devEnabled && debugRaycast)
        ? (assets.scalp_uv_guide || "/textures/scalp_uv_guide.jpeg")
        : (assets.scalp_mask || "/textures/scalp_mask.jpeg");

    const mask = useTexture(maskPath);
    const hairPlacementPoints = useRaycastHairPlacement(headGroup, mask, stylePos, densityPos, assets.custom_bust);

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
            <HeadModel ref={setHeadGroup} />
            <HairStrands stylePos={stylePos} lengthPos={lengthPos} thicknessPos={thicknessPos} hairPlacementPoints={hairPlacementPoints} />

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
                    <instancedMesh ref={debugMeshRef} args={[null, null, 1000]}>
                        <sphereGeometry args={[0.015, 8, 8]} />
                        <meshBasicMaterial color="#FF6B00" />
                    </instancedMesh>

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
    useGLTF.preload('/models/hair_box_mid.glb');
    useGLTF.preload('/models/hair_twist_mid.glb');
    useGLTF.preload('/models/hair_loc_mid.glb');
} catch (e) { }
