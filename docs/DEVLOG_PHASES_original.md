# PAH Visualizer: Technical Logbook & Learning Progress
**Author:** Osiana “Cinna” Romy  
**Project:** Protective Afro-Hairstyle Visualizer  
**Status:** Sprint 3 Done

---

## Document 1: Infrastructure & Geometric Foundation

**Learning Question:** How can I transition a conceptual 3D pipeline into a performant web environment using React 19 and R3F?

### Scope of Assignment
The core challenge is migrating from a basic Semester 2 Proof of Concept into a professional, interactive tool. This phase focuses on Section 1.5 of the ProjectPlan: Migration to GitHub, setting up the React 19 environment, and achieving the first successful render of the high-fidelity `custombust.glb`.

### Methodology
I followed the "Build-to-Learn" strategy (Section 2.1), prioritizing infrastructure stability over early-stage administrative tasks to meet Software Level 2 and UI/UX Level 1 KPIs.

### Detailed Dev Log
*   **Infrastructure Deployment**: I set up the Vite + React 19 + R3F + Zustand environment to ensure a modern foundation.
*   **Asset Pipeline**: I created and optimized the 3D bust in Blender to ensure the model was suitable for real-time web rendering.
*   **Model Compression**: When the initial model file size was too large for web loading (NFR-4 breach), I applied Draco compression to reduce the footprint without losing detail.
*   **Git Strategy Evolution**: During this phase, my branching strategy was non-existent. I committed everything directly to the main branch with generic messages like "Update" or "first commit," reflecting a survival mode where the focus was just on seeing initial results.

### Technical Components
| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `Experience.jsx` | Initial setup of the R3F Canvas and scene wrapper. |
| **Component** | `HeadModel.jsx` | Component responsible for loading and displaying the bust mesh. |
| **Function** | `useGLTF()` | Drei hook utilized to load the compressed GLB models asynchronously. |
| **Asset** | `custombust.glb` | The 3D head model acting as the canvas for hair placement. |

### Code Management Evidence
*   **Commit `447b9ed`**: *first commit* (Initial repo structure).
*   **Commit `fe7eba0`**: *Update* (Generic push, typical of early development).
*   **Commit `529a4e0`**: *Feat: Integrate Draco compression decoders* (Start of professional semantic commit messages).

### Visual Evidence (Planned)
*   **Screenshot 1.1**: The initial rendering of the scalp mesh in the R3F Canvas.
*   **Screenshot 1.2**: Network tab showing the Draco-compressed asset loading under 5 seconds to meet the NFR-1 target.

### Advice for Future Implementation
Avoid the "Main Branch Only" trap early on. Even in a solo project, using semantic commits like Feat, Fix, or Style helps you trace exactly when a specific performance drop or bug was introduced.

### Conclusion & Reflection
The first hurdle was "Planning Paralysis." Moving to a "Utility-First" approach allowed me to stop over-theorizing and start seeing the model in the browser.

### Next Steps
Transition from static model viewing to procedural interaction by implementing the Raycasting grid.

---

## Document 2: Interactivity & State Logic

**Learning Question:** How can procedural generation techniques reduce manual placement complexity in 3D hairstyle visualization? (Sub-question 2)

### Scope of Assignment
This phase focused on connecting the UI to the 3D engine. This addressed FR-2 and FR-3 by allowing users to adjust thickness and density while the application recalculates the pack estimate in real-time.

### Methodology
I prototyped different Raycasting intervals (Section 2.1) to find the optimal balance between visual density and browser performance.

### Detailed Dev Log
*   **State Architecture**: I implemented the "Single Source of Truth" using Zustand to ensure UI and 3D states remained in sync.
*   **Parting Precision**: When hair began spawning on the face and neck, I implemented a UV Scalp Masking strategy. By using a black-and-white texture, I restricted spawning strictly to the scalp area.
*   **Branching Strategy**: I realized that committing broken raycasting logic to the main branch was preventing me from testing the stable UI. I began using feature branches to isolate complex math from the primary deployment path.

### Technical Components
| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `Sliders.jsx` | User interface controls for adjusting style parameters. |
| **Component** | `AssetManager.jsx` | Developer utility for hot-swapping textures and models. |
| **Function** | `useHairStore()` | Zustand hook managing global state across UI and 3D components. |
| **Asset** | `scalp_mask.jpeg` | Black-and-white texture mapping valid spawning zones on the mesh. |

### Code Management Evidence
*   **Commit `4b53f4a`**: *Refactor: Implement spherical math raycasting with brick-lay parting pattern*.
*   **Commit `348850f`**: *Merge pull request #2 from test-branch3* (Evidence of using Pull Requests for feature integration).
*   **Commit `bf8ae46`**: *Fix: Add missing 1-7 map values to fix RangeSlider undefined error* (A specific bug-fix commit).

### Visual Evidence (Planned)
*   **Screenshot 2.1**: The UI Layout with functional density sliders and glassmorphic panels.
*   **Screenshot 2.2**: The Scalp Mask texture defining the active spawning zones on the 3D model.

### Advice for Future Implementation
When dealing with procedural placement, the UV mask is your best friend. Use feature branches to sandbox your raycasting math until it is stable enough for the main production build.

### Conclusion & Reflection
Successfully linking the store to the canvas proved that React is a viable platform for high-density 3D generation. The "snappy" feedback (100ms) was achieved through efficient state decoupling.

### Next Steps
Finalize the realism of the strands by moving from straight sticks to segment-based physics loops.

---

## Document 3: Procedural Core & Physics

**Learning Question:** What rendering strategies provide the best balance between visual density and real-time performance in browser-based procedural hair systems? (Sub-question 4)

### Scope of Assignment
I moved from basic Raycasting to an optimized production engine. This phase focused on NFR-2 (≥30 FPS) and NFR-3 (Mobile Responsiveness) by refining the procedural physics loop.

### Methodology
I performed a comparative analysis of rendering strategies and transitioned to the InstancedMesh system to handle over 30,000 segments without crashing the mobile GPU.

### Detailed Dev Log
*   **Procedural Physics**: I implemented a stiffness-biased gravity model for organic braid draping, ensuring the hair fell naturally while maintaining root structure.
*   **Release Cycle**: By this final sprint, I moved to a deployment-only main branch strategy. The main branch is now stable and synced with Vercel, while all debugging and optimization happens in dedicated fix or feature branches.

### Technical Components
| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `HairStrands` | Renders the instanced 3D hair segments along calculated paths. |
| **Function** | `useRaycastHairPlacement()` | Custom hook containing the spherical raycasting and masking logic. |
| **Function** | `InstancedMesh.setMatrixAt()` | Three.js method used to efficiently render thousands of segments. |
| **Asset** | `boxbraid.glb` | High-fidelity tileable braid segment model used for instances. |

### Code Management Evidence
*   **Commit `32c401d`**: *Fix: Enforce strict left-right symmetry in spherical raycasting engine*.
*   **Commit `875b9db`**: *style: major UI/UX overhaul with floating glassmorphic layout* (A deployment-ready commit for the final UI).
*   **Commit `e6ef38c`**: *Docs: Add rich contextual comments explaining physics engine* (Focus on code maintainability).

### Visual Evidence (Planned)
*   **Screenshot 3.1**: Raycast Debug Mode showing orange orbs at every parting point.
*   **Screenshot 3.2**: Side-by-side view showing the "Gravity Bias" curve—tight at the root and sagging at the ends.

### Advice for Future Implementation
Optimize for mobile first. Use semantic commits to keep a clear history of your performance benchmarks so you can identify exactly which change introduced a bottleneck.

### Conclusion & Reflection
The project has evolved from an "Egg Head" PoC to a production-ready visualization tool. The use of InstancedMeshes was the key to hitting the 30,000 segment goal while staying within NFR-2 limits.

### Next Steps
Deploy the application and prepare for professional stylist validation.

---

## Document 4: Reflection & Future Roadmap

**Learning Question:** How has the integration of Agentic AI and iterative prototyping redefined my technical growth and future vision for 3D web applications?

### Scope of Assignment
This document is a clinical reflection on my transition from a non-technical starting point in September to the delivery of a procedural 3D engine. It evaluates how AI-assisted development impacted my "Build-to-Learn" philosophy.

### Methodology
A retrospective analysis of personal technical growth, contrasting early coding struggles with the later adoption of rapid, AI-assisted architectural iteration.

### Detailed Dev Log (Personal & Technical Growth)
*   **Growth Trajectory**: I started with zero knowledge of React hooks or the Three.js rendering lifecycle. Over the course of the semester, I moved from struggling and hitting walls to a mindset of rapid iteration. 
*   **AI Pair-Programming**: I used agentic AI assistants like Claude, Gemini, and Copilot not as a shortcut, but as a senior pair-programmer. This shift allowed me to focus on high-level architectural logic, such as raycasting math and collision spheres, rather than losing days to minor syntax errors or environment mismatches.
*   **Raycasting Breakthrough**: The major realization was that organic hair could not be hardcoded. Switching from static points to a spherical row-based engine allowed the system to scale from 20 braids to 3,000 instantly. Transitioning to the InstancedMesh system was the single biggest technical milestone, proving that I could maintain a stable 30 FPS even with extreme braid density.

### Technical Components (Future Exploration)
| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `PredefinedPoints` | Fallback option to explore for extremely low-end devices. |
| **Function** | `GLSL Shaders` | Planned exploration for realistic light scattering and hair sheen. |
| **Function** | `Vertex Animation` | Planned vertex displacement logic to simulate wind and sway. |
| **Integration** | `Supabase` | Future backend for saving and sharing user configurations. |

### Code Management Evidence
*   **Commit History Overview**: The evolution from sporadic, generic commits to a structured, feature-branch-driven workflow demonstrates a shift from amateur coding to professional software engineering practices.

### Visual Evidence (Planned)
*   **Screenshot 4.1**: A "Then vs. Now" comparison showing the evolution from my first attempts at spawning geometry to the current physics loop.
*   **Screenshot 4.2**: The final Vercel Deployment dashboard showing the healthy production environment and performance metrics.

### Advice for Future Implementation
Do not be afraid to use AI to bridge the beginner gap. The ability to iterate ten times faster allowed me to learn more about the actual architecture of a 3D application than I ever would have learned by manually debugging boilerplate code.

### Conclusion & Reflection
The journey from knowing nothing about React/Three.js to deploying a complex, procedural 3D visualizer was transformative. Shifting my mindset to embrace iterative prototyping and AI assistance was the catalyst that made this possible.

### Next Steps (Post-Semester)
I plan to integrate a Supabase backend to allow users to share their configurations via unique URLs. I will also conduct the professional stylist interviews to fine-tune the 0.95 pack coefficient for real-world clinical accuracy.
