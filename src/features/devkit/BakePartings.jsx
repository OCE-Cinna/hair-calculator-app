import { useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';

export function BakePartings({ headGroup, mask, onComplete }) {
    const { scene } = useThree();

    useEffect(() => {
        if (!headGroup || !mask || !mask.image) return;

        let mesh = null;
        headGroup.traverse((child) => { if (child.isMesh) mesh = child; });
        if (!mesh || !mesh.geometry) return;

        mesh.updateMatrixWorld(true);

        const canvas = document.createElement('canvas');
        const { width, height } = mask.image;
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        
        mask.flipY = false;
        mask.needsUpdate = true;
        ctx.drawImage(mask.image, 0, 0);
        const imageData = ctx.getImageData(0, 0, width, height).data;

        const raycaster = new THREE.Raycaster();
        const center = new THREE.Vector3(0, 1.4, 0);
        const radius = 2.5;
        const points = [];

        // We are focusing ONLY on Medium Density. Hardcode a smaller grid to get roughly ~60 points total.
        const density = 60; 
        const phiMin = 0.0;
        const phiMax = 1.4;
        const rowCount = Math.floor(Math.sqrt(density) * 1.5);

        for (let r = 0; r <= rowCount; r++) {
            const phi = phiMin + (r / rowCount) * (phiMax - phiMin);
            // Half-row points since we mirror
            let ptsInHalfRow = Math.max(2, Math.floor(Math.sqrt(density) * 1.25 * Math.sin(phi)));
            
            // STRICT ALIGNED GRID (Option A)
            const staggerOffset = 0;

            for (let t = 0; t <= ptsInHalfRow; t++) {
                // Theta from -PI/2 (back) to PI/2 (front)
                const theta = -Math.PI/2 + (t / Math.max(1, ptsInHalfRow)) * Math.PI + staggerOffset;

                const x = center.x + radius * Math.sin(phi) * Math.cos(theta);
                const y = center.y + radius * Math.cos(phi);
                const z = center.z + radius * Math.sin(phi) * Math.sin(theta);

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
                            if (gVal > rVal && gVal > bVal) region = "sides";
                            else if (bVal > rVal && bVal > gVal) region = "back";

                            // Region rules
                            const yThreshold = region === "back" ? 0.58 : 0.85;
                            if (hit.point.y <= yThreshold) continue;

                            // Skip the exact center parting width for top to create the straight part
                            if (region === "top" && Math.abs(hit.point.x) < 0.05) continue;

                            const normal = hit.face.normal.clone().transformDirection(mesh.matrixWorld);

                            // Basic overlap prevention against ALL currently placed points
                            let tooClose = false;
                            for (const p of points) {
                                if (p.position.distanceTo(hit.point) < 0.025) {
                                    tooClose = true;
                                    break;
                                }
                            }
                            if (tooClose) continue;

                            points.push({
                                position: hit.point.clone(),
                                normal: normal.clone(),
                                region: region
                            });

                            // Explicitly Mirror across X-axis for perfect symmetry
                            const mirrorPoint = new THREE.Vector3(-hit.point.x, hit.point.y, hit.point.z);
                            // Avoid adding mirror if it crosses the threshold (e.g. exactly on center)
                            if (region !== "top" || Math.abs(mirrorPoint.x) >= 0.05) {
                                let mirrorTooClose = false;
                                for (const p of points) {
                                    if (p.position.distanceTo(mirrorPoint) < 0.025) {
                                        mirrorTooClose = true;
                                        break;
                                    }
                                }
                                if (!mirrorTooClose) {
                                    const mirrorNormal = new THREE.Vector3(-normal.x, normal.y, normal.z);
                                    points.push({
                                        position: mirrorPoint,
                                        normal: mirrorNormal,
                                        region: region
                                    });
                                }
                            }
                        }
                    }
                }
            }
        }

        // Convert to serializable JSON
        const data = points.map(p => ({
            p: [parseFloat(p.position.x.toFixed(4)), parseFloat(p.position.y.toFixed(4)), parseFloat(p.position.z.toFixed(4))],
            n: [parseFloat(p.normal.x.toFixed(4)), parseFloat(p.normal.y.toFixed(4)), parseFloat(p.normal.z.toFixed(4))],
            r: p.region.charAt(0) // 't', 's', 'b' to save space
        }));

        console.log(`Baked ${data.length} points!`);

        // Trigger download
        const blob = new Blob([JSON.stringify(data)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "box_braids.json";
        a.click();
        URL.revokeObjectURL(url);

        if (onComplete) onComplete();

    }, [headGroup, mask, scene]);

    return null;
}
