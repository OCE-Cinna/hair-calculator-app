import * as THREE from 'three';
// === 1. THREE.JS COMPONENT (UPDATED FOR INTERACTION) ===
const ThreeDCanvas = () => {
    const mountRef = useRef(null);
    const headRef = useRef(null); // Reference to the 3D head object

    // Refs for interaction state
    const isDragging = useRef(false);
    const previousPointerPosition = useRef({ x: 0, y: 0 });
    const rotationSpeed = 0.005; // Sensitivity for rotation

    useEffect(() => {
        const currentMount = mountRef.current;
        if (!currentMount) return;

        let scene, camera, renderer;
        let animationId;

        const setupScene = () => {
            // 1. Scene setup
            scene = new THREE.Scene();
            scene.background = new THREE.Color(0xf3f4f6); // Light gray background

            // 2. Camera
            const aspectRatio = currentMount.clientWidth / currentMount.clientHeight;
            camera = new THREE.PerspectiveCamera(50, aspectRatio, 0.1, 1000); // Narrowed FOV
            camera.position.z = 5;

            // 3. Renderer
            renderer = new THREE.WebGLRenderer({ antialias: true });
            renderer.setPixelRatio(window.devicePixelRatio);
            renderer.setSize(currentMount.clientWidth, currentMount.clientHeight);
            currentMount.appendChild(renderer.domElement);

            // 4. Lights
            const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
            scene.add(ambientLight);
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(5, 10, 7.5);
            scene.add(directionalLight);

            // 5. Geometry (Custom Head Shape)
            const geometry = new THREE.SphereGeometry(1.2, 32, 16);
            geometry.scale(1.0, 1.2, 1.0); // Make it slightly taller for head shape

            const material = new THREE.MeshPhongMaterial({
                color: 0x8b3b3b, // A medium skin tone color
                shininess: 30
            });

            const head = new THREE.Mesh(geometry, material);
            headRef.current = head;
            scene.add(head);

            // Initial Rotation (Slightly turned)
            head.rotation.y = Math.PI / 8;
        };

        // --- Interaction Handlers ---

        // Helper to get normalized pointer position (handles mouse and first touch)
        const getClientPosition = (event) => {
            if (event.touches && event.touches.length > 0) {
                return {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }
            return {
                x: event.clientX,
                y: event.clientY
            };
        };

        const onPointerDown = (event) => {
            // Only allow drag on the element itself
            if (event.target !== renderer.domElement) return;

            event.preventDefault();
            isDragging.current = true;
            const pos = getClientPosition(event);
            previousPointerPosition.current = pos;

            // Capture the pointer for continuous tracking
            if (currentMount.setPointerCapture) {
                currentMount.setPointerCapture(event.pointerId);
            }
        };

        const onPointerMove = (event) => {
            event.preventDefault();
            if (!isDragging.current || !headRef.current) return;

            const pos = getClientPosition(event);

            // Calculate delta movement
            const deltaX = pos.x - previousPointerPosition.current.x;
            const deltaY = pos.y - previousPointerPosition.current.y;

            // Apply rotation: 
            // X movement affects Y-axis rotation (pan)
            // Y movement affects X-axis rotation (tilt)
            headRef.current.rotation.y += deltaX * rotationSpeed;
            headRef.current.rotation.x += deltaY * rotationSpeed;

            // Clamp X rotation to prevent flipping (approx -90 to +90 degrees)
            headRef.current.rotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, headRef.current.rotation.x));

            // Update previous position
            previousPointerPosition.current = pos;
        };

        const onPointerUp = (event) => {
            event.preventDefault();
            isDragging.current = false;
            if (currentMount.releasePointerCapture) {
                currentMount.releasePointerCapture(event.pointerId);
            }
        };

        // --- Scene and Animation setup ---

        const handleResize = () => {
            if (camera && renderer && currentMount) {
                const width = currentMount.clientWidth;
                const height = currentMount.clientHeight;

                camera.aspect = width / height;
                camera.updateProjectionMatrix();
                renderer.setSize(width, height);
            }
        };

        const renderLoop = () => {
            // No automatic rotation; the scene renders continuously for smooth interaction.
            if (renderer && scene && camera) {
                renderer.render(scene, camera);
            }

            animationId = requestAnimationFrame(renderLoop);
        };

        // Initialize the scene
        setupScene();

        // Start the animation loop
        renderLoop();

        // Attach event listeners for interaction (using standard Pointer Events for compatibility)
        // Note: We attach move/up to the window to track the pointer even if it leaves the canvas.
        currentMount.addEventListener('pointerdown', onPointerDown);
        window.addEventListener('pointermove', onPointerMove);
        window.addEventListener('pointerup', onPointerUp);

        // Set up resize listener for responsiveness
        window.addEventListener('resize', handleResize);

        // Cleanup function
        return () => {
            cancelAnimationFrame(animationId);

            // Remove all listeners
            currentMount.removeEventListener('pointerdown', onPointerDown);
            window.removeEventListener('pointermove', onPointerMove);
            window.removeEventListener('pointerup', onPointerUp);
            window.removeEventListener('resize', handleResize);

            if (renderer && currentMount.contains(renderer.domElement)) {
                currentMount.removeChild(renderer.domElement);
                renderer.dispose();
            }
        };
    }, []);

    // The 3D view container. We set a high z-index to ensure it captures events.
    return (
        <div
            ref={mountRef}
            className="canvas-container"
            style={{ touchAction: 'none' }} // Prevents default browser scroll/zoom on touch devices
        />
    );
};