import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, vi, expect } from 'vitest';
import { Experience } from './Experience';

// Mock R3F Canvas since it requires a WebGL context
vi.mock('@react-three/fiber', () => ({
  Canvas: ({ children }) => <div data-testid="r3f-canvas">{children}</div>,
  useThree: () => ({ camera: {}, scene: new (require('three').Scene)() }),
  useFrame: () => { },
}));

// Mock Drei loaders to prevent actual network requests
vi.mock('@react-three/drei', () => ({
  OrbitControls: () => <div data-testid="orbit-controls" />,
  useGLTF: () => ({
    scene: {
      traverse: vi.fn(),
      clone: () => ({ traverse: vi.fn(), children: [{ geometry: {}, material: {} }] })
    }
  }),
  useTexture: () => ({ image: { width: 100, height: 100 } }),
  Loader: () => <div data-testid="loader" />,
}));

describe('Experience Component', () => {
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