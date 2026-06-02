import { useState, useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useHairStore } from '../../../stores/hairStore';
import { useDevStore } from '../../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';

/**
 * usePartingPattern - Custom React hook for dynamic hair parting and placement.
 * 
 * CORE ALGORITHM:
 * This engine generates realistic hair partings using "Spherical Raycasting". 
 * Instead of randomly scattering points, it mathematically generates horizontal rows around the head,
 * similar to how a stylist sections hair.
 * 
 * It dynamically scales the number of rows and points based on both the Density slider 
 * and the Thickness slider (via DEV_CONFIG), ensuring Micro braids have tight, tiny partings, 
 * while Jumbo braids have widely spaced, large partings.
 * 
 * @param {React.RefObject<THREE.Group>} headMesh - The 3D bust model.
 * @param {THREE.Texture} texture - Optional UV mask to restrict growth to the scalp area.
 * @param {number} stylePos - Current style.
 * @param {number} densityPos - Current density.
 * @param {string} bustPath - Path to bust model.
 * @returns {Array<{position, normal, uv, region}>} The calculated coordinates for each braid root.
 */
export function usePartingPattern(headMesh, texture, stylePos, densityPos, bustPath) {
    const { DENSITY_COUNTS, THICKNESS_MAP, thicknessPos } = useHairStore(useShallow(state => ({
        DENSITY_COUNTS: state.DENSITY_COUNTS,
        THICKNESS_MAP: state.THICKNESS_MAP,
        thicknessPos: state.thicknessPos
    })));
    const { DEV_CONFIG } = useDevStore(useShallow(state => ({
        DEV_CONFIG: state.DEV_CONFIG
    })));

    // Ref to store the static high-density candidate pool
    const [candidatesPool, setCandidatesPool] = useState([]);

    // Part 1: Generate static candidate pool exactly once when geometry/texture changes
    useEffect(() => {
        if (!headMesh || !texture || !texture.image || texture.image.width === 0) {
// eslint-disable-next-line react-hooks/set-state-in-effect
            setCandidatesPool([]);
            return;
        }

        let mesh = null;
        headMesh.traverse((child) => { if (child.isMesh) mesh = child; });
        if (!mesh || !mesh.geometry) {
             
 
            setCandidatesPool([]);
            return;
        }

        // Ensure world matrices are fully computed before raycasting
        mesh.updateMatrixWorld(true);

        const canvas = document.createElement('canvas');
        const { width, height } = texture.image;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        texture.flipY = false;
        texture.needsUpdate = true;
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
                            const pixelY = Math.floor(uv.y * (height - 1));
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

         
        setCandidatesPool(candidates);
    }, [headMesh, texture, bustPath]);

    // Part 2: Synchronous filtering and spacing calculation using useMemo
    return useMemo(() => {
        if (candidatesPool.length === 0) return [];

        let baseDensity = (DENSITY_COUNTS && DENSITY_COUNTS[densityPos]) ?? 42;
        const thicknessScale = (THICKNESS_MAP && THICKNESS_MAP[thicknessPos]) ? THICKNESS_MAP[thicknessPos][1] : 0.07;

        const thicknessMultiplier = 0.07 / thicknessScale;
        let dynamicDensity = Math.round(baseDensity * thicknessMultiplier);
        dynamicDensity = Math.max(8, Math.min(350, dynamicDensity));

        const centerPartingWidth = DEV_CONFIG?.centerPartingWidth ?? (thicknessScale * 0.9);
        const partThickness = DEV_CONFIG?.partThickness ?? (thicknessScale * 1.15);

        const targetPoints = [];

        // Process spacing and parting constraints on the pool
        const currentCandidates = candidatesPool;
        for (const candidate of currentCandidates) {
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
    }, [candidatesPool, densityPos, DENSITY_COUNTS, thicknessPos, THICKNESS_MAP, DEV_CONFIG]);
}


