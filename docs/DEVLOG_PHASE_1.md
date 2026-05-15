# PAH Visualizer: Technical Logbook & Learning Progress
## Phase 1: Infrastructure & Geometric Foundation

**Author:** Osiana “Cinna” Romy  
**Project:** Protective Afro-Hairstyle Visualizer  
**Status:** Sprint 3 Done

**Learning Question:** How can I transition from a proof of concept into a performant interactive web application?

---

## Table of Contents
1. [Context & Scope](#context--scope)
2. [Methodology & Process](#methodology--process)
3. [Technical Challenges & Decisions](#technical-challenges--decisions)
4. [Learning Outcomes](#learning-outcomes)
5. [Code & Asset Management Evidence](#code--asset-management-evidence)
6. [Retrospection & Advice for Self](#retrospection--advice-for-self)
7. [Next Steps](#next-steps)

---

## Context & Scope

### Scope of Assignment
The objective of this phase was the migration of the Semester 2 Proof of Concept (PoC) into a professional-grade development environment. This involved migrating the source code from Fontys GitLab to GitHub to facilitate an open-source workflow and refactoring the architecture to utilize React 19. A primary geometric requirement was replacing the primitive "egg" placeholder with a high-fidelity, anatomically accurate 3D bust sculpted in Blender.

### Defining the Challenge
The core challenge is migrating from a basic Semester 2 Proof of Concept into a professional, interactive tool. This phase focuses on moving away from Fontys Gitlab to Github, in line with my preference for free open source software. I had to refactor the web application to use a React 19 environment, and update the “egg shaped” Three.js head stand-in with a custom-made Blender head/bust model.

### User Stories
* **As a user,** I want a high-fidelity 3D representation of a human scalp so that I can visualize braid placement with anatomical accuracy.
* **As a designer,** I want a unified, glassmorphic UI so that the interface does not distract from the 3D visualization.
* **As a developer,** I want a modular, componentized architecture so that I can update hairstyle logic without affecting the core rendering engine.

### Why this matters
The application serves as a bridge between specialized cultural knowledge and modern technology. To be effective, the tool must maintain high visual fidelity while remaining accessible on low-end hardware. This necessitates a balance between geometric complexity and rendering performance.

---

## Methodology & Process

This is a roadmap of how I’m learning and moving forward with the project, including original ideation and interviews, semester 2 proof of concept, and semester 3 professionalization.

| Phase | Source / Activity | Detailed Notes & Examples |
| :--- | :--- | :--- |
| **Ideation** | Project Proposal | Defined functional requirements and established the initial Figma prototype. |
| **User Research** | Google Forms | Quantitative and qualitative analysis of user needs in the braiding community. |
| **PoC (Sem 2)** | Vanilla JS / Three.js | Initial feasibility study. Identified performance limitations of non-reactive state management. |
| **Implementation (Sem 3)** | React 19 / R3F / Zustand | Migration to a "Source of Truth" architecture. Deployment via Vercel for continuous integration. |

#### Learning Objectives
*   Mastery of 3D mesh topology and decimation in Blender for WebGL compatibility.
*   Understanding the lifecycle of a React 19 component within a Three.js canvas.
*   Implementation of asynchronous asset streaming using Draco compression.

### Risk & Mitigation

| Risk | Impact | Mitigation Strategy |
| :--- | :--- | :--- |
| High-poly models causing frame drops on mobile. | High | Applied "Decimate" modifiers in Blender and utilized Draco compression to reduce GLB footprint. |
| State desynchronization between UI and 3D Canvas. | Medium | Implemented Zustand for centralized state management, ensuring a "Single Source of Truth." |
| Latency in asset loading (NFR-4 breach). | High | Integrated `useGLTF` for pre-loading and caching assets via the Drei library. |

### Success Criteria
The application must function as a dynamic web-based tool that renders a 3D scene at a stable 60 FPS on desktop and at least 30 FPS on mobile, providing an intuitive interface for procedural hair generation.

### Detailed Dev Log
#### Infrastructure Selection: Vite over Next.js
The decision to utilize Vite instead of Next.js was driven by the project's requirement for a lightweight Single Page Application (SPA). Since the PAH Visualizer is client-bound—relying on the user's GPU for real-time raycasting—the Server-Side Rendering (SSR) capabilities of Next.js were deemed unnecessary overhead. Vite provides superior Hot Module Replacement (HMR) speeds, which significantly accelerated the 3D development loop.

| Feature | Vite Implementation | Next.js Implementation |
| :--- | :--- | :--- |
| **Deployment** | Vercel / Netlify | Vercel (Native) |
| **SSR Capabilities** | Limited (Focused on SPA) | Robust (Focused on SEO/SSG) |
| **HMR Speed** | Extremely high for 3D iteration | Balanced for full-stack apps |
| **Primary Use Case** | Single Page Applications | Content-heavy multi-page apps |

The implementation of global stores, such as Zustand, allows for the decoupling of state from specific components, enabling "snappy" feedback where parameters update in real-time without unmounting the 3D canvas.

#### Asset Pipeline: Blender to R3F
The transition from primitive geometry to a custom bust required a "Build-to-Learn" approach in Blender.
*   **Challenges:** Blender’s non-standard UI and workspace navigation (UV Editing vs. Edit Mode).
*   **Solution:** Followed industry-standard sculpting tutorials to create a topology optimized for WebGL.
*   **Optimization:** When the `custombust.glb` exceeded the 5-second loading target (NFR-1), I applied Draco compression. This reduced the geometric complexity while preserving the visual fidelity required for accurate hair placement.
    *   https://cheatography.com/henriqueog/cheat-sheets/blender-full/
    *   Youtube tutorial: https://www.youtube.com/watch?v=irWAjPQyYzg
    *   https://www.youtube.com/watch?v=fUZHyoeuwVI
    *   https://www.youtube.com/watch?v=Iry51ufhX4s

#### Model Compression
When the initial model file size was too large for web loading (NFR-4 breach), I applied Draco compression to reduce the footprint without losing detail. I was really happy to figure out by tweaking settings in Blender that I could create really high quality model, but when having them load in the web application the `custombust.glb` was not loading, alongside the texture custom braid segments. I looked up online how to simplify the model using Blender’s modifiers and WebGL library Draco which is integrated in React Three Fiber.

*Optimization Impact:*
* **Model Footprint:** Reduced from MBs to KBs using Draco Compression.
* **Vertex Count:** Lowered triangle count for mobile using Decimate Modifier.
* **Loading Speed:** Met NFR-1 (Load < 5s) by utilizing `useGLTF()` with Draco decoder.
* **Rendering Flow:** Consolidated draw calls for high-density using `InstancedMesh`.

*(Placeholder: Include screenshot of Blender modifier before and after.)*  
*(Placeholder: Include screenshot of Network Tab when inspecting web application.)*

### Technical Challenge 1: Planning Paralysis & 3D Complexity
Originally, I wasn’t very inspired because of the difficulty of the project as a beginner in 3D, and the math involved. I focused on a group project early on. Once I returned to this personal project, I utilized GitHub Copilot, which helped me start and make background progress. I also used Gemini to break down Blender tutorials (especially when finding menus from older versions), which significantly accelerated my learning curve.

### Technical Challenge 2
*(To be detailed based on specific phase 1 challenges regarding component integration)*

### Technical Stack & Resources

| Category | Item Name | Role in Architecture |
| :--- | :--- | :--- |
| **Environment** | Vite | Build tool and development server for high-speed iteration. |
| **Framework** | React 19 | Component-based UI library managing the application state. |
| **3D Engine** | R3F / Drei | React-based abstraction of Three.js for declarative 3D scenes. |
| **State** | Zustand | Global store for synchronizing user inputs with 3D parameters. |

In this section I will explain the different components created and how they interact with one another.

| Category | Item Name | Description & Role |
| :--- | :--- | :--- |
| **Component** | `Experience.jsx` | Initial setup of the R3F Canvas and scene wrapper. |
| **Component** | `App.jsx` | Main application layout and routing. |
| **Component** | `HeadModel.jsx` | Component responsible for loading and displaying the bust mesh. |
| **Function** | `useGLTF()` | Drei hook utilized to load the compressed GLB models asynchronously. |
| **Asset** | `custombust.glb` | The 3D head model acting as the canvas for hair placement. |
| **Asset** | `boxbraid.glb` | Braid segment model used for instances. |
| **Asset** | `boxbraidend.glb` | End cap for the braids. |

### Software Versioning Manifest
*(Placeholder for exact versioning of React, Three.js, etc.)*

### Expert Consultation Log
*(Placeholder for feedback from Fontys Coach or Stylists during this phase)*

### Tools & Utilities
*   **IDE:** VS Code
*   **Code Assistant:** GitHub Copilot, Gemini
*   **Software:** Blender

### Code Management Evidence
*   **Commit `447b9ed`**: *first commit* (Initial repo structure).
*   **Commit `fe7eba0`**: *Update* (Generic push, typical of early development).
*   **Commit `529a4e0`**: *Feat: Integrate Draco compression decoders* (Start of professional semantic commit messages).

*(Placeholder: Screenshot of GitHub initial commits vs. semantic commits)*

### Visual Evidence (Planned)
* **Screenshot 1.1**: The initial rendering of the scalp mesh in the R3F Canvas.
* **Screenshot 1.2**: Network tab showing the Draco-compressed asset loading under 5 seconds.
* *(Placeholder: Screenshot comparing the prototype/egg version to the updated 3D model using `custombust.glb`)*

---

## Retrospection & Advice for Self

### Retrospection
The first hurdle was "Planning Paralysis." Moving to a "Utility-First" approach allowed me to stop over-theorizing and start seeing the model in the browser. Leveraging AI tools (GitHub Copilot and Gemini) as tutors rather than just code generators helped me overcome beginner struggles with 3D math and Blender's UI.

### Advice for Future Implementation
* **Avoid the "Main Branch Only" trap early on.** Even in a solo project, using semantic commits like `feat:`, `fix:`, or `style:` helps you trace exactly when a specific performance drop or bug was introduced.
* **Commit Naming:** Improve commits by adopting strict naming conventions (e.g., Conventional Commits). Instead of "first commit", write `init: setup project structure and vite boilerplate`.

### Scalability Advice
Keep the asset pipeline scalable for future 3D models. Maintain the Draco compression pipeline and document the exact decimation parameters used in Blender for the initial models so they can be easily replicated for new hair assets.

---

## Next Steps
Transition from static model viewing to procedural interaction by implementing the Raycasting grid.

**KPI Alignment:**
* **Software Lvl 2:** Analysis, Realisation
* **Design:** Analysis, Realisation
