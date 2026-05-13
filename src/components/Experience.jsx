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
 * Custom React hook for raycasting-based hair placement on a 3D head model.
 * It samples points on the head's surface based on a UV texture mask and density settings.
 * @param {React.RefObject<THREE.Group>} headMeshRef - Ref to the head model's THREE.Group.
 * @param {THREE.Texture} texture - The UV mask texture (e.g., scalp_mask.jpeg) to determine spawnable areas.
 * @param {number} stylePos - The current style position from the store (used for dependency tracking).
 * @param {number} densityPos - The current density position from the store to determine the number of hair points.
 * @returns {Array<{position: THREE.Vector3, normal: THREE.Vector3, uv: THREE.Vector2}>} An array of hair placement points.
 * Raycasting-based hair placement with UV texture masking
 */
function useRaycastHairPlacement(headMeshRef, texture, stylePos, densityPos) {
    const [hairPoints, setHairPoints] = useState([]);
    const DENSITY_COUNTS = useHairStore(state => state.DENSITY_COUNTS);
    useEffect(() => {
        const headGroup = headMeshRef.current;
        if (!headGroup || !texture || !texture.image || texture.image.width === 0) {
            setHairPoints([]);
            return;
        }

        // Fallback to a safe count if store value is missing
        const targetCount = (DENSITY_COUNTS && DENSITY_COUNTS[densityPos]) ?? 42;
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

        const gridSize = 14;
        const gridRange = 1.5;
        const gridSpacing = (gridRange * 2) / gridSize;
        const raycastPoints = [];

        for (let x = -gridRange; x < gridRange; x += gridSpacing) {
            for (let z = -gridRange; z < gridRange; z += gridSpacing) {
                const rayOrigin = new THREE.Vector3(x, 4, z);
                raycaster.set(rayOrigin, rayDirection);
                const intersects = raycaster.intersectObject(headMesh);
                if (intersects.length > 0) {
                    const hit = intersects[0];
                    const uv = hit.uv;
                    if (uv) {
                        const pixelX = Math.floor(uv.x * (width - 1));
                        const pixelY = Math.floor((1 - uv.y) * (height - 1));
                        const pixelIndex = (pixelY * width + pixelX) * 4;
                        if (imageData[pixelIndex] > 128) {
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

        const symmetricPoints = [];
        raycastPoints.forEach(p => {
            symmetricPoints.push(p);
            if (Math.abs(p.position.x) > 0.05) {
                symmetricPoints.push({
                    position: new THREE.Vector3(-p.position.x, p.position.y, p.position.z),
                    normal: new THREE.Vector3(-p.normal.x, p.normal.y, p.normal.z),
                    uv: new THREE.Vector2(1 - p.uv.x, p.uv.y)
                });
            }
        });

        setHairPoints(symmetricPoints.slice(0, targetCount));
    }, [headMeshRef, texture, stylePos, densityPos, DENSITY_COUNTS]); // Added DENSITY_COUNTS to dependencies

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

    // useGLTF calls must be top-level and will be caught by ExperienceErrorBoundary if they fail
    const segmentGLTF = useGLTF(braidPath);
    const endGLTF = useGLTF(braidEndPath);

    const braidSegment = segmentGLTF?.scene;
    const braidEnd = endGLTF?.scene;

    const STYLE_COLORS = useHairStore(state => state.STYLE_COLORS);
    const THICKNESS_MAP = useHairStore(state => state.THICKNESS_MAP);
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

        const segmentHeight = 0.1;
        const matrix = new THREE.Matrix4();
        instancedMeshRef.current.count = hairPlacementPoints.length * lengthPos;
        endInstancedMeshRef.current.count = hairPlacementPoints.length;

        const tScale = THICKNESS_MAP[thicknessPos][1]; // Get the thickness modifier
        const scaleVec = new THREE.Vector3(tScale, 1, tScale); // Scale X and Z for thickness

        hairPlacementPoints.forEach((point, i) => {
            const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), point.normal);
            for (let j = 0; j < lengthPos; j++) {
                try {
                    const pos = point.position.clone().add(point.normal.clone().multiplyScalar(j * segmentHeight));
                    matrix.compose(pos, quaternion, scaleVec); // Apply thickness scale
                    instancedMeshRef.current.setMatrixAt(i * lengthPos + j, matrix);
                } catch (e) {
                    // Skip corrupted points
                    continue;
                }
            }
            try {
                const endPos = point.position.clone().add(point.normal.clone().multiplyScalar(lengthPos * segmentHeight));
                matrix.compose(endPos, quaternion, scaleVec); // Apply thickness scale to end cap
                endInstancedMeshRef.current.setMatrixAt(i, matrix);
            } catch (e) { }
        });
        instancedMeshRef.current.instanceMatrix.needsUpdate = true;
        endInstancedMeshRef.current.instanceMatrix.needsUpdate = true;
    }, [hairPlacementPoints, lengthPos, thicknessPos, THICKNESS_MAP]); // Added THICKNESS_MAP to dependencies

    if (hairPlacementPoints.length === 0) return null;

    // Safe access to geometries
    const segmentGeo = braidSegment?.children?.[0]?.geometry;
    const segmentMat = braidSegment?.children?.[0]?.material;
    const endGeo = braidEnd?.children?.[0]?.geometry;
    const endMat = braidEnd?.children?.[0]?.material;

    if (segmentGeo && endGeo) {
        return (
            <group>
                <instancedMesh ref={instancedMeshRef} args={[segmentGeo, segmentMat, 2000]} />
                <instancedMesh ref={endInstancedMeshRef} args={[endGeo, endMat, 500]} />
            </group>
        );
    } else {
        return (
            <group>
                {hairPlacementPoints.map((point, i) => {
                    const tScale = (THICKNESS_MAP && THICKNESS_MAP[thicknessPos]) ? THICKNESS_MAP[thicknessPos][1] : 1;
                    const color = (STYLE_COLORS && STYLE_COLORS[stylePos]) || '#2c1810';
                    const quaternion = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), point.normal);
                    const pos = point.position.clone().add(point.normal.clone().multiplyScalar((lengthPos * 0.1) / 2));
                    return (
                        <mesh key={i} position={pos} quaternion={quaternion}>
                            <cylinderGeometry args={[0.02 * tScale, 0.02 * tScale, lengthPos * 0.1, 8]} /> {/* Apply thickness scale */}
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
    const hairPlacementPoints = useRaycastHairPlacement(headGroupRef, mask, stylePos, densityPos);

    return (
        <>
            <color attach="background" args={['#f3f4f6']} />
            <ambientLight intensity={0.8} color="#ffffff" />
            <directionalLight position={[5, 10, 7.5]} intensity={1.5} />
            <CameraFollowLight intensity={1} />
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
