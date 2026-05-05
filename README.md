# Cinna's PAH - Protective Afro-Hairstyle Visualizer & Calculator

This is a Semester 3 HBO-ICT student project at Fontys University of Applied Sciences. The project was inspired by a realization in Semester 1 that technology can simplify "mundane" tasks like planning Afro-textured hairstyles, making them more accessible and efficient.

## Tech Stack

- **React 19** - Modern React with latest features
- **Three.js (R3F)** - React Three Fiber for 3D rendering
- **Tailwind CSS** - Utility-first CSS framework
- **Blender** - 3D modeling for custom assets

## Features

- Real-time 3D head visualization with interactive rotation
- Procedural hair placement using raycasting and UV texture masking
- Slider-based parameter adjustment for style, thickness, length, and density
- Preset gallery for quick style loading
- Hair pack estimation calculator
- Responsive design with mobile support

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

```bash
npm install
```

### Adding 3D Models

Place the following files in the `public/models/` directory:
- `custombust.glb` - The 3D head model
- `boxbraid.glb` - Braid segment model
- `boxbraidend.glb` - Braid end cap model

And ensure `public/scalp_mask.jpeg` exists for UV masking.

If models are missing, the app will use fallback geometries (sphere for head, cylinders for braids).

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── Experience.jsx      # Main 3D scene
│   ├── HeadModel.jsx       # 3D head model component
│   ├── Sliders.jsx         # Custom slider components
│   └── ThreeDCanvas.jsx    # Three.js canvas wrapper
├── store/
│   └── hairStore.js        # Zustand state management
└── App.jsx                 # Main application component
```

## License

MIT License
