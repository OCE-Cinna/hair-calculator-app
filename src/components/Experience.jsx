import React, { useRef, useMemo, useEffect, useCallback } from 'react';
import { Canvas, useThree, useFrame } from '@react-three/fiber';
import { OrbitControls, Instances, Instance } from '@react-three/drei';
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
 * Fibonacci lattice algorithm for even sphere distribution
 */
function fibonacciSpherePoints(count, radius, yOffset = 0, yScale = 1.2) {
    const points = [];
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));

    for (let i = 0; i < count; i++) {
        const y = 1 - (i / (count - 1)) * 2;
        const r = Math.sqrt(1 - y * y);
        const theta = goldenAngle * i;
        points.push(
            new THREE.Vector3(
                Math.cos(theta) * r * radius,
                y * radius * yScale + yOffset,
                Math.sin(theta) * r * radius
            )
        );
    }

    return points;
}

/**
 * Raycasting-based hair placement with UV texture masking
 * Shoots rays from a grid above the head downward
 * Samples scalp texture at ray-hit UV coordinates
 * Only spawns hair at WHITE pixels (skips BLACK pixels)
 */
function useRaycastHairPlacement(headMeshRef, textureRef, stylePos, densityPos) {
    return useMemo(() => {
        if (!headMeshRef.current || !textureRef.current) return [];

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
        return symmetricPoints.slice(0, targetCount);
    }, [headMeshRef, textureRef, stylePos, densityPos]);
}

/**
 * Hair strands renderer using Instances (performance optimized)
 */
function HairStrands({ stylePos, thicknessPos, lengthPos, densityPos, hairPlacementPoints }) {
    const thicknessMod = useHairStore((state) => state.thicknessMap[thicknessPos][1]);
    const lengthMod = useHairStore((state) => state.lengthMap[lengthPos][1]);
    const color = STYLE_COLORS[stylePos];

    const locsMultiplier = stylePos === 4 ? 1.3 : 1.0;
    const strandRadius = 0.04 * thicknessMod * locsMultiplier;
    const strandHeight = 0.3 * lengthMod;

    // Transform placement points into Instance transforms
    const transforms = useMemo(() => {
        return hairPlacementPoints.map((point) => {
            // Orient strand along surface normal (outward from head)
            const quaternion = new THREE.Quaternion().setFromUnitVectors(
                new THREE.Vector3(0, 1, 0),
                point.normal
            );
            return { position: point.position, quaternion };
        });
    }, [hairPlacementPoints]);

    // Select geometry based on style
    const geometry = useMemo(() => {
        switch (stylePos) {
            case 2: // Box Braids
                return <boxGeometry args={[strandRadius * 1.4, strandHeight, strandRadius * 1.4]} />;
            case 3: // Twists
                return <cylinderGeometry args={[strandRadius, strandRadius, strandHeight, 6]} />;
            case 4: // Locs (tapered)
                const topRadius = strandRadius * 0.7;
                return <cylinderGeometry args={[topRadius, strandRadius, strandHeight, 6]} />;
            case 1: // Knotless Braids (default/capsule)
            default:
                return <capsuleGeometry args={[strandRadius, strandHeight * 0.7, 4, 8]} />;
        }
    }, [stylePos, strandRadius, strandHeight]);

    if (transforms.length === 0) return null;

    return (
        <Instances limit={150}>
            {geometry}
            <meshStandardMaterial color={color} roughness={0.85} metalness={0.05} />
            {transforms.map((t, i) => (
                <Instance
                    key={i}
                    position={t.position}
                    quaternion={t.quaternion}
                />
            ))}
        </Instances>
    );
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
    const thicknessPos = useHairStore((state) => state.thicknessPos);
    const lengthPos = useHairStore((state) => state.lengthPos);
    const densityPos = useHairStore((state) => state.densityPos);

    // Load scalp texture for UV masking
    useEffect(() => {
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load('/scalp_mask.jpg', (texture) => {
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
                target={[0, 2, 0]}
                maxPolarAngle={Math.PI / 2}
                minPolarAngle={0.2}
                minDistance={3}
                maxDistance={6}
            />

            <HeadModel ref={headGroupRef} />
            <HairStrands
                stylePos={stylePos}
                thicknessPos={thicknessPos}
                lengthPos={lengthPos}
                densityPos={densityPos}
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
            <Canvas camera={{ fov: 50, position: [0, 2, 5] }}>
                <ThreeDSceneContent />
            </Canvas>
        </div>
    );
}
