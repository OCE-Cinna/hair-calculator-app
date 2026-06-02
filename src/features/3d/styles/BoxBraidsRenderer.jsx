import React, { useMemo, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { useHairStore } from '../../../stores/hairStore';
import { useDevStore } from '../../../stores/devStore';
import { useShallow } from 'zustand/react/shallow';

// Attempt to load the baked JSON.
import bakedData from '../../../data/partings/box_braids.json';

export function BoxBraidsRenderer() {
    const { STYLE_COLORS, showBraids } = useHairStore(useShallow(state => ({
        STYLE_COLORS: state.STYLE_COLORS,
        showBraids: state.showBraids
    })));

    const { DEV_CONFIG } = useDevStore(useShallow(state => ({ DEV_CONFIG: state.DEV_CONFIG })));

    const meshRef = useRef();

    // Generate the "Hair Card" / Tube Geometries
    const mergedGeometry = useMemo(() => {
        if (!bakedData || bakedData.length === 0) return null;

        // Hardcoded for Medium length
        const targetFloorY = 0.0; // Shoulder length

        const headCenter = new THREE.Vector3(0, DEV_CONFIG?.headCenterY ?? 1.5, DEV_CONFIG?.headCenterZ ?? 0.0);
        const torsoCenter = new THREE.Vector3(0, DEV_CONFIG?.torsoCenterY ?? 0.2, 0);
        const headRadius = DEV_CONFIG?.headRadius || 0.95;
        const torsoRadius = DEV_CONFIG?.torsoRadius || 1.25;
        
        const geometries = [];

        bakedData.forEach(pt => {
            const root = new THREE.Vector3(pt.p[0], pt.p[1], pt.p[2]);
            const normal = new THREE.Vector3(pt.n[0], pt.n[1], pt.n[2]).normalize();
            const region = pt.r === 't' ? 'top' : pt.r === 's' ? 'sides' : 'back';

            const curvePoints = [root.clone()];
            let currentPos = root.clone();
            
            // To avoid spider legs, we don't shoot straight out.
            // We want the hair to instantly drape, but pushed slightly by the scalp.
            // We compute a "drape vector" based on the region.
            
            let drapeDir = new THREE.Vector3(0, -1, 0); // Default gravity
            
            if (region === 'top') {
                if (root.z > 0.0) {
                    // Front Top (Forehead area): Part to the sides of the face!
                    // If it's on the right side of the head (x > 0), sweep right.
                    const lateralSweep = root.x >= 0 ? 1 : -1;
                    drapeDir.set(lateralSweep * 0.8, -0.5, 0.2).normalize();
                } else {
                    // Crown / Back Top: Sweep backwards
                    drapeDir.set(0, -0.5, -0.8).normalize();
                }
            } else if (region === 'sides') {
                // Sweep slightly back and down
                drapeDir.set(root.x >= 0 ? 0.2 : -0.2, -0.8, -0.2).normalize();
            } else {
                // Back: fall straight down
                drapeDir.set(0, -1, -0.1).normalize();
            }

            // Generate physics points for the spline
            const step = 0.1;
            let currentDir = drapeDir.clone();

            for (let j = 1; j <= 20; j++) {
                // Slowly transition pure gravity
                currentDir.lerp(new THREE.Vector3(0, -1, 0), j * 0.05).normalize();
                
                currentPos.addScaledVector(currentDir, step);

                // Head Collision
                const headDist = currentPos.distanceTo(headCenter);
                if (headDist < headRadius && currentPos.y > -0.3) {
                    const pushOutVec = new THREE.Vector3().subVectors(currentPos, headCenter).normalize();
                    // If in front of face (z > 0), strongly push laterally
                    if (currentPos.z > 0) {
                        pushOutVec.x += currentPos.x >= 0 ? 0.5 : -0.5;
                        pushOutVec.normalize();
                    }
                    currentPos.copy(headCenter).addScaledVector(pushOutVec, headRadius * 1.05);
                }

                // Torso Collision
                const dy = currentPos.y - torsoCenter.y;
                const dx = currentPos.x - torsoCenter.x;
                const dz = currentPos.z - torsoCenter.z;
                const distToTorso = Math.sqrt(dx*dx + dy*dy + dz*dz);
                if (distToTorso < torsoRadius) {
                    const pushOutVec = new THREE.Vector3(dx, dy, dz).normalize();
                    currentPos.copy(torsoCenter).addScaledVector(pushOutVec, torsoRadius * 1.05);
                }

                curvePoints.push(currentPos.clone());

                if (currentPos.y <= targetFloorY) break;
            }

            // Create a smooth 3D spline
            const curve = new THREE.CatmullRomCurve3(curvePoints);
            // Extrude a tube along the spline to simulate a thick "hair card" or braid segment
            const tubeGeo = new THREE.TubeGeometry(curve, 20, 0.015, 5, false);
            geometries.push(tubeGeo);
        });

        if (geometries.length === 0) return null;
        return mergeGeometries(geometries);
    }, [DEV_CONFIG]);

    if (!showBraids || !mergedGeometry) return null;

    // We only focus on the base style color for now
    const color = '#2c1810'; 

    return (
        <mesh ref={meshRef} geometry={mergedGeometry}>
            <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
        </mesh>
    );
}
