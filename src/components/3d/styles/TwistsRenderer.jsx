import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore, useDevStore } from '../../../store/hairStore';
import { useShallow } from 'zustand/react/shallow';

const DRACO_DECODER = 'https://www.gstatic.com/draco/versioned/decoders/1.5.5/';

/**
 * TwistsRenderer component renders instanced 3D hair segments for Box Braids
 * at specified placement points on the head model.
 * 
 * @param {object} props
 * @param {number} props.stylePos - Current style (for color)
 * @param {number} props.lengthPos - Current length (for Y floor)
 * @param {number} props.thicknessPos - Current thickness (for scaling)
 * @param {Array} props.hairPlacementPoints - Target roots for spawning
 */
export function TwistsRenderer({ stylePos, lengthPos, thicknessPos, hairPlacementPoints }) {
    const { camera } = useThree();
    const { assets, isEnabled: devEnabled } = useDevStore(useShallow(state => ({
        assets: state.assets,
        isEnabled: state.isEnabled
    })));
    const { STYLE_COLORS, THICKNESS_MAP } = useHairStore(useShallow(state => ({
        STYLE_COLORS: state.STYLE_COLORS,
        THICKNESS_MAP: state.THICKNESS_MAP
    })));

    // Since this is specifically for Box Braids, we use styleMap[1] or the active box braid model
    const activePath = devEnabled && assets?.hair_box_mid 
        ? assets.hair_box_mid 
        : "/models/hair_box_mid.glb";

    const instancedMeshRef = useRef();
    const fallbackMeshRef = useRef();

    const segmentGLTF = useGLTF(activePath, DRACO_DECODER);
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
                    taper = 0.22;
                } else if (k === N_segs - 2) {
                    taper = 0.52;
                } else if (k === N_segs - 3) {
                    taper = 0.80;
                }

                quaternion.setFromUnitVectors(upVec, seg.dir);
                
                let ySquish = (seg.step * 1.25) / actualModelHeight; 
                
                let segmentStepLength = seg.step;
                if (k === 0) {
                    ySquish *= 0.10;
                    segmentStepLength *= 0.10;
                }
                
                const zFlatten = 0.5;
                scaleVecStrand.set(seg.tScale * taper, ySquish, seg.tScale * taper * zFlatten);

                matrix.compose(drawPos, quaternion, scaleVecStrand);
                instancedMeshRef.current.setMatrixAt(segmentInstanceCount++, matrix);

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
