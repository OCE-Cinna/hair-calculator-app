# Procedural Braid Placement System (v2)

This branch (`feature/procedural-braids`) implements a new high-fidelity placement engine designed for authentic 4C hair sectioning.

## 1. The Mathematics of "Brick-Lay" Parting
Instead of a flat grid, we now use a **Spherical Staggered Grid**. 

### Latitude & Longitude (Phi & Theta)
- **Vertical Rows (Phi):** Calculated based on the density setting. Rows are concentrated at the crown and spread towards the nape.
- **Horizontal Points (Theta):** The number of points in each row dynamically adjusts based on the circumference of the head at that level ($ptsInRow = base \times \sin(\phi)$).
- **Stagger pattern:** Alternate rows are offset by $\pi/ptsInRow$ radians. This creates the classic "brick" pattern where braids in Row 2 fall exactly between the braids of Row 1 and Row 3.

## 2. Front vs. Back Density
As requested, the engine now treats the front and back of the head differently:
- **Symmetry:** Points in the front section are always rounded to even numbers to ensure perfect ear-to-ear symmetry.
- **Back Multiplier:** Points falling in the back ($z < 0$) trigger a "Double Spawn" logic, resulting in roughly 2x density in the rear section compared to the front.

## 3. Dynamic Braid Construction
Braids are no longer "fixed" models. They are built procedurally using an `InstancedMesh` loop:
- **Segments:** The engine calculates the number of pieces needed to reach the `targetFloorY` (Floor level).
- **Physics:** Each segment slightly lerps towards gravity and checks for head/torso collisions.
- **Uniformity:** All braids stop exactly at the same Y-level relative to the ground, regardless of where they started on the scalp.

## 4. Blender Setup Guide (To take full advantage)
To optimize your custom models for this engine, follow these steps:

### A. The "Region Map" (RGB Mask)
While the code currently uses a grayscale mask for "where" to spawn, you can upgrade to an RGB map to define sections:
- **Red Channel:** Front of scalp.
- **Blue Channel:** Back of scalp.
- **Green Channel:** Ear sections.
- *Currently, the code uses $z > 0$ and $z < 0$ as a robust fallback.*

### B. Braid Models
Your `.glb` braid models should be:
- **Centered at Origin:** The top of the braid segment should be at $(0,0,0)$.
- **Direction:** The braid should grow down the negative Y-axis.
- **Segment Size:** For box braids, a segment should be roughly 0.1 to 0.2 units tall.

## 5. Summary
The procedural engine is fully compatible with the current 5/6-level scales (Thickness: 6, Length: 6, Density: 5). It uses these values as inputs to the spherical distribution math to ensure authentic sectioning regardless of the slider resolution.
