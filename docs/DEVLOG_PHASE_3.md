# PAH Visualizer: Technical Logbook & Learning Progress
## Document 3: Procedural Core & Physics

**Author:** Osiana “Cinna” Romy  
**Project:** Protective Afro-Hairstyle Visualizer  
**Status:** Sprint 3 Done

**Learning Question:** What rendering strategies provide the best balance between visual density and real-time performance in browser-based procedural hair systems? (Sub-question 4)

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
I moved from basic Raycasting to an optimized production engine. This phase focused on NFR-2 (≥30 FPS) and NFR-3 (Mobile Responsiveness) by refining the procedural physics loop to support 30,000+ geometric instances without crashing the browser.

### Defining the Challenge
Rendering individual hair strands using standard mesh generation causes massive draw-call overhead, crippling mobile GPUs. The challenge was implementing `InstancedMesh` alongside a custom physics loop that could calculate gravity, collision, and draping for thousands of segments dynamically in real-time.

### Context
#### User Story
*   As a user, I want the hair to look like it naturally falls over the shoulders.
*   As a user, I need the application to not freeze or overheat my mobile phone.
*   As a developer, I want a stable main branch that is always ready for a Vercel production deployment.

#### Why this matters
The visualizer's core value proposition is seeing a realistic representation of a hairstyle. If the hair sticks straight out like a porcupine or if the app crashes, the user loses trust in the tool's calculation accuracy.

### Methodology
I performed a comparative analysis of rendering strategies and transitioned to the InstancedMesh system to handle over 30,000 segments without crashing the mobile GPU. 

| Phase | Source / Activity | Detailed Notes & Examples |
| :--- | :--- | :--- |
| **Physics Design** | Custom Math Loop | Created a stiffness-biased gravity model instead of using heavy physics libraries (like Cannon.js). |
| **Optimization** | Three.js `InstancedMesh` | Replaced thousands of `<mesh>` components with a single instanced call. |
| **Release Cycle** | Deployment-Only Main | Adopted a strict Git workflow where `main` is only used for stable Vercel deployments. |

#### Learning Objectives
*   Mastery of `InstancedMesh` and matrix transformations in Three.js.
*   Understanding basic 3D collision detection using bounding spheres.
*   Implementing a professional deployment pipeline with semantic commits.

### Risk & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| Mobile GPU thermal throttling. | High | Transitioned to `InstancedMesh` to reduce draw calls from 30,000 to 2. |
| Hair clipping through the bust model. | Medium | Built mathematical Head and Torso "Safety Bubbles" to push segments outward. |
| "Zombie Segments" failing to update. | Low | Implemented strict array dependency checks in the React hooks. |

### Success Criteria
The application must render the maximum density configuration while maintaining at least 30 FPS on a mid-range mobile device (e.g., Pixel 8).

### Detailed Dev Log
#### Procedural Physics
I implemented a stiffness-biased gravity model for organic braid draping, ensuring the hair fell naturally while maintaining root structure. Instead of running a full physics simulation every frame, I created a "static but realistic" loop that calculates the final resting position of the hair instantly.

#### Release Cycle
By this final sprint, I moved to a deployment-only main branch strategy. The main branch is now stable and synced with Vercel, while all debugging and optimization happens in dedicated fix or feature branches.

#### Technical Challenge 1: The Matrix 
Moving to `InstancedMesh` required abandoning standard React props for position and rotation. I had to learn how to manipulate 4x4 transformation matrices (`Object3D.updateMatrix()`) to manually position each of the 30,000 segments.

#### Technical Challenge 2: Torso Collision
Long braids were clipping through the chest of the bust. Because my physics loop was static, I couldn't use a standard physics engine collider. I solved this by defining mathematical spheres in the code (Head Sphere, Torso Sphere) and pushing the segment coordinates outward if they intersected these imaginary boundaries.

### Technical Stack & Resources

| Category | Item Name | Role in Architecture |
| :--- | :--- | :--- |
| **Optimization** | `InstancedMesh` | Three.js class used for rendering massive amounts of identical geometry. |
| **Math** | Matrix4 / Quaternion | Used for calculating segment rotations and gravity biases. |
| **Deployment** | Vercel | CI/CD platform linked to the `main` branch. |

In this section I will explain the different components created and how they interact with one another.

| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `HairStrands` | Renders the instanced 3D hair segments along calculated paths. |
| **Function** | `useRaycastHairPlacement()` | Custom hook containing the spherical raycasting and masking logic. |
| **Function** | `InstancedMesh.setMatrixAt()` | Three.js method used to efficiently render thousands of segments. |
| **Asset** | `boxbraid.glb` | High-fidelity tileable braid segment model used for instances. |

### Software Versioning Manifest
*(Placeholder for exact versioning details)*

### Expert Consultation Log
*(Placeholder for performance testing results from peers)*

### Tools & Utilities
*   **IDE:** VS Code
*   **Performance Profiling:** Chrome DevTools / R3F Perf Monitor
*   **Hosting:** Vercel

### Code Management Evidence
*   **Commit `32c401d`**: *Fix: Enforce strict left-right symmetry in spherical raycasting engine*.
*   **Commit `875b9db`**: *style: major UI/UX overhaul with floating glassmorphic layout* (A deployment-ready commit for the final UI).
*   **Commit `e6ef38c`**: *Docs: Add rich contextual comments explaining physics engine* (Focus on code maintainability).

### Visual Evidence (Planned)
*   **Screenshot 3.1**: Raycast Debug Mode showing orange orbs at every parting point.
*   **Screenshot 3.2**: Side-by-side view showing the "Gravity Bias" curve—tight at the root and sagging at the ends.

### Technical Progress Detail
*(Detailed breakdown of coding progress regarding InstancedMesh and Collision)*

### Advice for Future Implementation
Optimize for mobile first. Use semantic commits to keep a clear history of your performance benchmarks so you can identify exactly which change introduced a bottleneck.

#### Process Documentation
*(Log of FPS benchmarking on different devices)*

#### Scalability Advice
*(Notes on how to implement Level of Detail (LOD) for even lower-end devices)*

### Conclusion & Reflection
The project has evolved from an "Egg Head" PoC to a production-ready visualization tool. The use of InstancedMeshes was the key to hitting the 30,000 segment goal while staying within NFR-2 limits.

#### KPI Alignment
*   **Software Lvl 2:** Realisation, Quality
*   **Design Lvl 2:** Realisation

### Next Steps
Deploy the application and prepare for professional stylist validation.
