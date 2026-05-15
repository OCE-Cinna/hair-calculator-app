# PAH Visualizer: Technical Logbook & Learning Progress
## Document 2: Interactivity & State Logic

**Author:** Osiana “Cinna” Romy  
**Project:** Protective Afro-Hairstyle Visualizer  
**Status:** Sprint 3 Done

**Learning Question:** How can procedural generation techniques reduce manual placement complexity in 3D hairstyle visualization? (Sub-question 2)

---

### Table of Content
1. Scope of Assignment
2. Defining the Challenge
3. Context
    * User Story
    * Why this matters
4. Methodology
5. Risk & Mitigation
6. Success Criteria
7. Detailed Dev Log
    * Technical Challenge 1
    * Technical Challenge 2
8. Technical Stack & Resources
9. Software Versioning Manifest
10. Expert Consultation Log
11. Tools & Utilities
12. Code Management Evidence
13. Visual Evidence (Planned)
14. Technical Progress Detail
15. Advice for Future Implementation
    * Process Documentation
    * Scalability Advice
16. Conclusion & Reflection
    * KPI Alignment
17. Next Steps

---

### Scope of Assignment
This phase focused on connecting the UI to the 3D engine. This addressed FR-2 and FR-3 by allowing users to adjust thickness and density while the application recalculates the pack estimate in real-time.

### Defining the Challenge
The main challenge was building a responsive interface that could talk to the Three.js canvas without causing performance bottlenecks. I needed to ensure that moving a slider updated the 3D visual immediately (under 100ms latency) while keeping the complex procedural logic decoupled from the React rendering cycle. 

### Context
#### User Story
*   As a user, I want to use sliders to adjust the density and thickness of the hair.
*   As a user, I want the 3D model to update in real-time to match my slider inputs.
*   As a user, I want the hair to spawn naturally on the scalp, not on the face or neck.

#### Why this matters
Procedural generation can easily look messy if not constrained correctly. Translating UI slider values into mathematical variables that control 3D rendering ensures the tool is both interactive and visually accurate.

### Methodology
I prototyped different Raycasting intervals (Section 2.1) to find the optimal balance between visual density and browser performance. I utilized Zustand to decouple the state management from the component tree.

| Phase | Source / Activity | Detailed Notes & Examples |
| :--- | :--- | :--- |
| **Logic Sync** | Zustand Implementation | Connected sliders directly to the global store to trigger procedural updates. |
| **Masking** | UV Texture Creation | Painted a black-and-white mask in Photoshop/Blender to define safe spawn zones. |
| **Feature Isolation** | Branching Strategy | Used GitHub feature branches to build the complex math before merging into the main UI. |

#### Learning Objectives
*   Mastery of global state management using Zustand in a React/R3F environment.
*   Understanding Raycasting and UV mapping coordinates to constrain procedural logic.
*   Implementing Git feature branching to isolate experimental code from stable layouts.

### Risk & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| Raycaster spawning hair on the face. | High | Implemented a UV Scalp Masking strategy. |
| UI blocking the main thread during 3D updates. | Medium | Decoupled state updates using Zustand to prevent React re-renders. |
| Broken math halting overall app progress. | Low | Adopted feature branches (`test-branch3`) to sandbox experiments. |

### Success Criteria
The sliders must smoothly adjust the 3D mesh density without dropping the frame rate, and all hair segments must be constrained perfectly to the designated scalp area.

### Detailed Dev Log
#### State Architecture
I implemented the "Single Source of Truth" using Zustand to ensure UI and 3D states remained in sync. This prevented the common issue where React prop-drilling causes unnecessary re-renders of the heavy 3D canvas.

#### Parting Precision
When hair began spawning on the face and neck, I implemented a UV Scalp Masking strategy. By using a black-and-white texture (`scalp_mask.jpeg`), I restricted spawning strictly to the scalp area. The raycaster checks the color of the texture at the hit point; if it's black, it aborts the spawn.

#### Branching Strategy
I realized that committing broken raycasting logic to the main branch was preventing me from testing the stable UI. I began using feature branches to isolate complex math from the primary deployment path.

#### Technical Challenge 1: The Raycasting Grid
Initially, I struggled to figure out how to project points onto a 3D sphere. By researching R3F documentation and breaking down the math with an AI assistant, I was able to implement a grid system that fires rays downward onto the bust mesh.

#### Technical Challenge 2: Synchronizing the Store
Ensuring that a change in the `AssetManager` or the `Sliders` immediately triggered a re-calculation in the `Experience.jsx` component required careful structuring of the Zustand store actions.

### Technical Stack & Resources

| Category | Item Name | Role in Architecture |
| :--- | :--- | :--- |
| **State** | Zustand | Global store linking UI inputs to 3D parameters. |
| **Math** | Three.js Raycaster | Engine used to calculate intersection points on the mesh. |
| **Styling** | Tailwind v4 | Used to build the Glassmorphism floating panels over the 3D canvas. |

In this section I will explain the different components created and how they interact with one another.

| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `Sliders.jsx` | User interface controls for adjusting style parameters. |
| **Component** | `AssetManager.jsx` | Developer utility for hot-swapping textures and models. |
| **Function** | `useHairStore()` | Zustand hook managing global state across UI and 3D components. |
| **Asset** | `scalp_mask.jpeg` | Black-and-white texture mapping valid spawning zones on the mesh. |

### Software Versioning Manifest
*(Placeholder for exact versioning details)*

### Expert Consultation Log
*(Placeholder for peer feedback regarding UI responsiveness)*

### Tools & Utilities
*   **IDE:** VS Code
*   **Image Editor:** Photoshop / Photopea (for mask creation)
*   **Version Control:** Git / GitHub

### Code Management Evidence
*   **Commit `4b53f4a`**: *Refactor: Implement spherical math raycasting with brick-lay parting pattern*.
*   **Commit `348850f`**: *Merge pull request #2 from test-branch3* (Evidence of using Pull Requests for feature integration).
*   **Commit `bf8ae46`**: *Fix: Add missing 1-7 map values to fix RangeSlider undefined error* (A specific bug-fix commit).

### Visual Evidence (Planned)
*   **Screenshot 2.1**: The UI Layout with functional density sliders and glassmorphic panels.
*   **Screenshot 2.2**: The Scalp Mask texture defining the active spawning zones on the 3D model.

### Technical Progress Detail
*(Detailed breakdown of coding progress regarding Zustand and Raycasting)*

### Advice for Future Implementation
When dealing with procedural placement, the UV mask is your best friend. Use feature branches to sandbox your raycasting math until it is stable enough for the main production build.

#### Process Documentation
*(Log of debugging steps for the raycaster)*

#### Scalability Advice
*(Notes on how to add new mask types for different hairstyles like fades or mohawks)*

### Conclusion & Reflection
Successfully linking the store to the canvas proved that React is a viable platform for high-density 3D generation. The "snappy" feedback (100ms) was achieved through efficient state decoupling.

#### KPI Alignment
*   **Software Lvl 2:** Realisation, Quality
*   **UI/UX Lvl 1:** User Interaction

### Next Steps
Finalize the realism of the strands by moving from straight sticks to segment-based physics loops.
