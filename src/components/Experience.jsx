import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Instances, Instance, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { useHairStore } from '../store/hairStore';
import { HeadModel } from './HeadModel';

const DENSITY_COUNTS = { 1: 8, 2: 16, 3: 28, 4: 42, 5: 60, 6: 90, 7: 120 };
const STYLE_COLORS = {
    1: '#2c1810',
    2: '#1a0f08',
    3: '#3d2314',
    4: '#2a1a0e',
};

/**
 * Raycasting-based hair placement with UV texture masking
 * Shoots rays from a grid above the head downward
 * Samples scalp texture at ray-hit UV coordinates
 * Only spawns hair at WHITE pixels (skips BLACK pixels)
 */
function useRaycastHairPlacement(headMeshRef, textureRef, stylePos, densityPos) {
    const [hairPoints, setHairPoints] = useState([]);

    useEffect(() => {
        if (!headMeshRef.current || !textureRef.current) {
            setHairPoints([]);
            return;
        }

        const targetCount = DENSITY_COUNTS[densityPos] ?? 42;
        const raycaster = new THREE.Raycaster();
        const rayDirection = new THREE.Vector3(0, -1, 0);

        // Generate ray grid above head (simplified 2D grid in XZ plane)
        // Grid density: ~6x6 rays for MVP
        const gridSize = 6;
        const gridSpacing = 2.0 / gridSize;
        const raycastPoints = [];

        for (let x = -1; x < 1; x += gridSpacing) {
            for (let z = -1; z < 1; z += gridSpacing) {
                // Ray originates above head
                const rayOrigin = new THREE.Vector3(x, 3.5, z);
                raycaster.set(rayOrigin, rayDirection);

                // Intersect with head mesh
                const headGroup = headMeshRef.current;
                const headMesh = headGroup.children[0];
                const intersects = raycaster.intersectObject(headMesh);

                if (intersects.length > 0) {
                    const hit = intersects[0];
                    const uv = hit.uv;

                    if (uv) {
                        // Sample scalp texture at UV coordinate
                        const texData = textureRef.current;
                        if (texData.image) {
                            const canvas = document.createElement('canvas');
                            canvas.width = texData.image.width;
                            canvas.height = texData.image.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(texData.image, 0, 0);
                            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                            const data = imageData.data;

                            const pixelX = Math.floor(uv.x * (canvas.width - 1));
                            const pixelY = Math.floor((1 - uv.y) * (canvas.height - 1));
                            const pixelIndex = (pixelY * canvas.width + pixelX) * 4;

                            const brightness = (data[pixelIndex] + data[pixelIndex + 1] + data[pixelIndex + 2]) / 3;

                            // WHITE (brightness > 128) = spawn hair
                            // BLACK (brightness <= 128) = skip placement
                            if (brightness > 128) {
                                raycastPoints.push({
                                    position: hit.point.clone(),
                                    normal: hit.face.normal.clone(),
                                    uv: uv.clone(),
                                });
                            }
                        }
                    }
                }
            }
        }

        // Apply X-axis symmetry to ensure balanced styles
        const symmetricPoints = [];
        raycastPoints.forEach(point => {
            symmetricPoints.push(point);

            // Mirror across YZ plane if not at center
            if (Math.abs(point.position.x) > 0.05) {
                const mirrorPoint = {
                    position: new THREE.Vector3(-point.position.x, point.position.y, point.position.z),
                    normal: new THREE.Vector3(-point.normal.x, point.normal.y, point.normal.z),
                    uv: new THREE.Vector2(1 - point.uv.x, point.uv.y),
                };
                symmetricPoints.push(mirrorPoint);
            }
        });

        // Limit to target count
        setHairPoints(symmetricPoints.slice(0, targetCount));
    }, [headMeshRef, textureRef, stylePos, densityPos]);

    return hairPoints;
}

/**
 * Hair strands renderer using InstancedMesh with GLTF models
 * Falls back to simple cylinders if models fail to load
 */
function HairStrands({ lengthPos, hairPlacementPoints }) {
    let braidSegment = null;
    let braidEnd = null;

    try {
        const segmentGLTF = useGLTF('/models/boxbraid.glb');
        braidSegment = segmentGLTF.scene;
        const endGLTF = useGLTF('/models/boxbraidend.glb');
        braidEnd = endGLTF.scene;
    } catch (error) {
        console.warn('Failed to load braid models, using fallback cylinders:', error);
    }

    const instancedMeshRef = useRef();
    const endInstancedMeshRef = useRef();

    // Number of segments based on length
    const numSegments = lengthPos; // lengthPos ranges from 1 to 6

    const transforms = useMemo(() => {
        return hairPlacementPoints.map((point) => {
            // Orient braid along surface normal (outward from head)
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                point.normal
            );
            return { position: point.position, quaternion };
        });
    }, [hairPlacementPoints]);

    useEffect(() => {
        if (!instancedMeshRef.current || !endInstancedMeshRef.current || transforms.length === 0) return;

        const segmentMesh = instancedMeshRef.current;
        const endMesh = endInstancedMeshRef.current;

        // Set instance count
        segmentMesh.count = transforms.length * numSegments;
        endMesh.count = transforms.length;

        // Set transforms for segments
        transforms.forEach((transform, braidIndex) => {
            for (let segmentIndex = 0; segmentIndex < numSegments; segmentIndex++) {
                const instanceIndex = braidIndex * numSegments + segmentIndex;
                const matrix = new THREE.Matrix4();
                const position = transform.position.clone();
                // Stack segments vertically
                position.add(new THREE.Vector3(0, segmentIndex * 0.1, 0)); // Adjust height as needed
                matrix.setPosition(position);
                matrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(transform.quaternion));
                segmentMesh.setMatrixAt(instanceIndex, matrix);
            }

            // Set transform for end cap
            const endMatrix = new THREE.Matrix4();
            const endPosition = transform.position.clone();
            endPosition.add(new THREE.Vector3(0, numSegments * 0.1, 0)); // Position at the top
            endMatrix.setPosition(endPosition);
            endMatrix.multiply(new THREE.Matrix4().makeRotationFromQuaternion(transform.quaternion));
            endMesh.setMatrixAt(braidIndex, endMatrix);
        });

        segmentMesh.instanceMatrix.needsUpdate = true;
        endMesh.instanceMatrix.needsUpdate = true;
    }, [transforms, numSegments]);

    if (transforms.length === 0) return null;

    if (braidSegment && braidEnd) {
        return (
            <group>
                <instancedMesh ref={instancedMeshRef} args={[braidSegment.children[0].geometry, braidSegment.children[0].material, transforms.length * numSegments]} />
                <instancedMesh ref={endInstancedMeshRef} args={[braidEnd.children[0].geometry, braidEnd.children[0].material, transforms.length]} />
            </group>
        );
    } else {
        // Fallback to cylinders
        return (
            <group>
                {transforms.map((transform, i) => (
                    <mesh key={i} position={transform.position} quaternion={transform.quaternion}>
                        <cylinderGeometry args={[0.02, 0.02, lengthPos * 0.1, 8]} />
                        <meshStandardMaterial color="#2c1810" />
                    </mesh>
                ))}
            </group>
        );
    }
}

/**
 * Directional light that follows camera
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
 * Main 3D scene component (R3F Canvas context)
 */
function ThreeDSceneContent() {
    const headGroupRef = useRef(null);
    const textureRef = useRef(null);

    // Subscribe to Zustand store
    const stylePos = useHairStore((state) => state.stylePos);
    const lengthPos = useHairStore((state) => state.lengthPos);
    const densityPos = useHairStore((state) => state.densityPos);

    // Load scalp texture for UV masking
    useEffect(() => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/scalp_mask.jpeg', (texture) => {
            textureRef.current = texture;
        });
    }, []);

    // Compute hair placement points using raycasting + texture masking
    const hairPlacementPoints = useRaycastHairPlacement(
        headGroupRef,
        textureRef,
        stylePos,
        densityPos
    );

    return (
        <>
            <color attach="background" args={['#E5E7EB']} />
            <ambientLight intensity={0.8} color="#F5F0FF" />
            <directionalLight position={[5, 10, 7.5]} intensity={0.8} />
            <CameraFollowLight intensity={1} />

            <OrbitControls
                enableDamping
                dampingFactor={0.15}
                target={[0, 1, 0]}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={0.2}
                minDistance={5}
                maxDistance={10}

            />

            <HeadModel ref={headGroupRef} />
            <HairStrands
                lengthPos={lengthPos}
                hairPlacementPoints={hairPlacementPoints}
            />
        </>
    );
}

/**
 * Experience: Main 3D viewport component
 * Encapsulates all R3F Canvas setup and 3D logic
 */
export function Experience() {
    return (
        <div
            className="w-full h-full bg-gray-100 rounded-lg shadow-inner relative overflow-hidden"
            style={{ touchAction: 'none' }}
        >
            <Canvas camera={{ fov: 40, position: [0, 0, 10] }}>
                <ThreeDSceneContent />
            </Canvas>
        </div>
    );
}

// Preload GLTF models (only if they exist)
try {
    useGLTF.preload('/models/boxbraid.glb');
    useGLTF.preload('/models/boxbraidend.glb');
} catch (error) {
    console.warn('Braid model preload failed:', error);
}
