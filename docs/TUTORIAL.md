# Cinna's PAH User Guide

This guide explains how to use the visualizer to estimate hair packs for afro hairstyles.

## Getting Started

The application opens with a 3D model and a unified control panel. The interface is fully responsive:
- **Desktop**: Features a side-by-side layout with the 3D viewport in the center, a navigation sidebar on the left, and the calculation form on the right.
- **Mobile**: Features a vertically stacked layout where the 3D viewport sits at the top and the calculation form smoothly flows underneath.

To rotate the model, click and drag your mouse or use a single finger on a touch screen. To zoom in or out, use the scroll wheel or a two-finger pinch. 

## Selecting a Style

The top section of the control panel contains the base hairstyle options. Selecting box braids, knotless braids, twists, or locs will update the model and change the underlying calculation. Each style carries a different weight in the formula to ensure the pack estimate remains accurate.

## Adjusting the Look

Use the sliders to modify the physical dimensions of the hair.

- Thickness changes the width of the individual braids or twists. As you move this slider, the parting grid on the scalp will automatically resize to maintain a realistic appearance.

- Length moves the hair from ear level down to the hips. 

- Density determines the number of braids installed. A higher density creates a fuller look but increases the number of hair packs required.

## 3D Viewport Controls (DevKit)

The 3D Viewport includes several toggle buttons to help you visualize the underlying procedural generation:
- **Scalp Pattern**: Toggles the visibility of the colorful UV parting map on the scalp.
- **Braid Visibility**: Toggles the 3D rendered hair strands on or off.
- **Roots Only**: Truncates the braids to show only the starting root segments, making it easier to see how they connect to the scalp partings.
- **Lighting Mode**: Cycles between various ambient lighting setups to preview how the hair looks under different conditions.

## Reading Results

The estimated hair packs counter at the bottom provides a real-time calculation. This estimate is based on a professional normalization factor of 0.95. Most users find this accurate within one pack of hair for standard synthetic brands.

## Presets and Themes

Open the main menu to access pre-configured styles. These are useful for quickly loading a specific look without manual slider adjustments. You can also switch between light and dark themes to see how different colors and textures react to various lighting environments.

## Performance and Storage

The application uses an optimized, single-canvas architecture to ensure smooth 60 FPS performance across all devices without duplicate rendering overhead. Adaptive performance automatically scales visual quality for mobile devices.

Your custom settings and presets are saved in your browser's local storage. Clearing your cache or using a private window will remove this data.
