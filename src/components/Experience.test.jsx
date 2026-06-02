import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Experience } from './Experience';
import * as THREE from 'three';

// Mock HeadModel to provide a stable ref for raycasting logic
vi.mock('./HeadModel', () => ({
    HeadModel: React.forwardRef((props, ref) => {
        const handle = React.useMemo(() => ({
            traverse: vi.fn(),
            isGroup: true,
            position: new THREE.Vector3(),
            rotation: new THREE.Euler(),
            scale: new THREE.Vector3(1, 1, 1),
            updateMatrixWorld: vi.fn(),
        }), []);
        React.useImperativeHandle(ref, () => handle, [handle]);
        return <div data-testid="head-model" />;
    })
}));

// Mock the Zustand stores
vi.mock('../store/hairStore', () => ({
    useHairStore: vi.fn(() => ({
        theme: 'dark',
        stylePos: 1,
        thicknessPos: 4,
        lengthPos: 4,
        densityPos: 4,
        THICKNESS_MAP: { 4: ['Medium', 0.1] },
        STYLE_COLORS: { 1: '#000000' },
        DENSITY_COUNTS: { 4: 100 }
    })),
    useDevStore: vi.fn(() => ({
        assets: {},
        debugRaycast: false,
        isEnabled: false,
        DEV_CONFIG: {
            partingRowMultiplier: 1,
            partingPointMultiplier: 1,
            headRadius: 1,
            torsoRadius: 1,
            torsoPushOut: 0.5
        }
    })),
}));

// Mock R3F Canvas since it requires a WebGL context
vi.mock('@react-three/fiber', () => ({
    Canvas: ({ children }) => <div data-testid="r3f-canvas">{children}</div>,
    useThree: () => ({
        camera: { position: new THREE.Vector3() },
        scene: new THREE.Scene(),
        gl: { domElement: { addEventListener: vi.fn(), removeEventListener: vi.fn() } }
    }),
    useFrame: () => { },
}));

// Mock React.Suspense to avoid issues with mocked loaders
vi.mock('react', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Suspense: ({ children }) => <>{children}</>,
    };
});

// Mock Drei loaders to prevent actual network requests
vi.mock('@react-three/drei', () => ({
    OrbitControls: () => <div data-testid="orbit-controls" />,
    useGLTF: Object.assign(() => ({
        scene: {
            traverse: vi.fn(),
            clone: () => ({ traverse: vi.fn(), children: [{ geometry: { computeBoundingBox: vi.fn(), boundingBox: { max: { y: 1 }, min: { y: 0 } } }, material: {} }] })
        },
        nodes: { Head: { geometry: {} } },
        materials: { Skin: {} }
    }), { preload: vi.fn() }),
    useTexture: () => ({
        image: { width: 100, height: 100 },
        flipY: false,
    }),
    Loader: () => <div data-testid="loader" />,
    PerspectiveCamera: ({ children }) => <>{children}</>,
    Environment: () => null,
    ContactShadows: () => null,
    Center: ({ children }) => <>{children}</>,
}));

// Mock THREE to avoid missing classes/methods
vi.mock('three', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        Raycaster: class extends actual.Raycaster {
            intersectObject() { return []; }
        }
    };
});

// Mock postprocessing to avoid WebGL dependent components
vi.mock('@react-three/postprocessing', () => ({
    EffectComposer: ({ children }) => <>{children}</>,
    Bloom: () => null,
    Noise: () => null,
    Vignette: () => null,
    ToneMapping: () => null,
    Selection: ({ children }) => <>{children}</>,
}));

vi.mock('postprocessing', () => ({
    ToneMappingMode: { ACES_FILMIC: 1 }
}));

// Mock ExperienceErrorBoundary to avoid swallowing errors during tests
vi.mock('./Experience', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        ExperienceErrorBoundary: ({ children }) => <>{children}</>,
    };
});

describe('Experience Component', () => {
    beforeEach(() => {
        // Mock canvas context for hair placement logic
        HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
            if (type === '2d') {
                return {
                    drawImage: vi.fn(),
                    getImageData: vi.fn(() => ({
                        data: new Uint8ClampedArray(100 * 100 * 4)
                    })),
                };
            }
            return null;
        });
    });

  it('renders the 3D Canvas container', () => {
    render(<Experience />);
    expect(screen.getByTestId('r3f-canvas')).toBeDefined();
  });

  it('renders the Drei Loader', () => {
    render(<Experience />);
    // The Loader is rendered outside the Canvas in our Experience.jsx
    expect(screen.getByTestId('loader')).toBeDefined();
  });
});