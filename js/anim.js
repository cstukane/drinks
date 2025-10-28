// anim.js
// Handles 3D dice animations for the Dicey Drinks app

// Prefer global THREE loaded via script; avoid ESM import mismatch with UMD build
// If THREE is not present, roll3D will fall back to rollFallback.
// eslint-disable-next-line no-undef
const THREE = (typeof window !== 'undefined' && window.THREE) ? window.THREE : (typeof global !== 'undefined' && global.THREE ? global.THREE : null);

// Reusable scene singleton
let scene, camera, renderer, dieMesh;
let isSceneInitialized = false;

// Precomputed rotation paths for variation
const rotationPaths = [
    // Path 1: Spin on X and Y axes
    [
        { x: 0, y: 0, z: 0 },
        { x: Math.PI, y: Math.PI/2, z: 0 },
        { x: Math.PI*2, y: Math.PI, z: Math.PI/4 },
        { x: Math.PI*3, y: Math.PI*1.5, z: Math.PI/2 }
    ],
    // Path 2: Spin on Y and Z axes
    [
        { x: 0, y: 0, z: 0 },
        { x: Math.PI/4, y: Math.PI, z: Math.PI/2 },
        { x: Math.PI/2, y: Math.PI*2, z: Math.PI },
        { x: Math.PI/4, y: Math.PI*3, z: Math.PI*1.5 }
    ],
    // Path 3: Spin on X and Z axes
    [
        { x: 0, y: 0, z: 0 },
        { x: Math.PI*1.5, y: Math.PI/4, z: Math.PI/2 },
        { x: Math.PI*3, y: Math.PI/2, z: Math.PI },
        { x: Math.PI*4.5, y: Math.PI/4, z: Math.PI*1.5 }
    ]
];

// Map N (candidate count) to die shape
function mapNToShape(N) {
    if (N <= 4) return 'd4';
    if (N <= 7) return 'd6';
    if (N <= 9) return 'd8';
    if (N <= 11) return 'd10'; // Using d20 as fallback for d10
    if (N <= 16) return 'd12';
    return 'd20';
}

// Create die mesh based on shape
function createDieMesh(shape) {
    let geometry;
    const material = new THREE.MeshStandardMaterial({ 
        color: 0x00ffff, // Cyan color to match theme
        roughness: 0.4,
        metalness: 0.15
    });

    switch (shape) {
    case 'd4':
        geometry = new THREE.TetrahedronGeometry(1, 0);
        break;
    case 'd6':
        geometry = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        break;
    case 'd8':
        geometry = new THREE.OctahedronGeometry(1, 0);
        break;
    case 'd10':
    case 'd12':
    case 'd20':
    default:
        geometry = new THREE.IcosahedronGeometry(1, 0); // Using icosahedron as fallback
        break;
    }

    return new THREE.Mesh(geometry, material);
}

// Initialize the 3D scene
function initScene() {
    if (isSceneInitialized) return;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x1a1a1a); // Dark background

    camera = new THREE.PerspectiveCamera(40, 1, 0.1, 1000);
    camera.position.set(0, 1.5, 3);
    camera.lookAt(0, 0, 0);

    // Add lights
    const ambientLight = new THREE.HemisphereLight(0xffffbb, 0x080820, 1);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);

    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(96, 96);
    renderer.setPixelRatio(window.devicePixelRatio);

    isSceneInitialized = true;
}

// Animate the die along a path
function animateDie(path, durationMs, onComplete) {
    const startTime = Date.now();
    const pathIndex = Math.floor(Math.random() * rotationPaths.length);
    const selectedPath = rotationPaths[pathIndex];

    function animate() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / durationMs, 1);

        if (progress < 1) {
            // Apply easing (ease-out)
            const easedProgress = 1 - Math.pow(1 - progress, 3);
      
            // Interpolate rotation based on path
            const pathProgress = easedProgress * (selectedPath.length - 1);
            const segmentIndex = Math.floor(pathProgress);
            const segmentProgress = pathProgress - segmentIndex;
      
            if (segmentIndex < selectedPath.length - 1) {
                const from = selectedPath[segmentIndex];
                const to = selectedPath[segmentIndex + 1];
        
                dieMesh.rotation.x = from.x + (to.x - from.x) * segmentProgress;
                dieMesh.rotation.y = from.y + (to.y - from.y) * segmentProgress;
                dieMesh.rotation.z = from.z + (to.z - from.z) * segmentProgress;
            }
      
            // Add small position jitter for hand-held vibe
            dieMesh.position.x = (Math.random() - 0.5) * 0.1;
            dieMesh.position.y = (Math.random() - 0.5) * 0.1;
      
            renderer.render(scene, camera);
            requestAnimationFrame(animate);
        } else {
            // Stop at ambiguous orientation
            renderer.render(scene, camera);
            onComplete();
        }
    }

    animate();
}

// Create overlay for result display
function createOverlay(parent, k, N, isJoker = false) {
    const overlay = document.createElement('div');
    overlay.className = 'roll-overlay';
  
    const content = document.createElement('div');
    content.style.textAlign = 'center';
  
    const result = document.createElement('div');
    result.style.fontSize = '34px';
    result.style.fontWeight = '800';
    result.style.lineHeight = '1';
    result.style.fontFamily = 'monospace'; // Ensure consistent font rendering
  
    const badge = document.createElement('div');
    badge.className = 'badge';
    badge.style.fontSize = '12px';
    badge.style.fontWeight = '600';
    badge.style.opacity = '0.85';
    badge.style.marginTop = '6px';
    badge.textContent = isJoker ? 'dY?' : `d${N}`; // Use dY? for joker as specified
  
    if (isJoker) {
        // Load and inline the joker SVG
        fetch('./assets/joker.svg')
            .then(response => response.text())
            .then(svgText => {
                const svgContainer = document.createElement('div');
                svgContainer.innerHTML = svgText;
                const svgElement = svgContainer.querySelector('svg');
                if (svgElement) {
                    svgElement.setAttribute('width', '48');
                    svgElement.setAttribute('height', '48');
                    svgElement.setAttribute('aria-label', 'Joker');
                    result.appendChild(svgElement);
                }
            })
            .catch(() => {
                // Fallback to emoji if SVG fails to load
                result.textContent = '🃏';
            });
    } else {
        result.textContent = k;
    }
  
    content.appendChild(result);
    content.appendChild(badge);
    overlay.appendChild(content);
    parent.appendChild(overlay);
  
    return overlay;
}

// Main 3D roll function
export async function roll3D(opts) {
    const { parent, N, k, shape, durationMs = 1200 } = opts;
  
    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    // Skip animation and just show overlay
        const overlay = createOverlay(parent, k, N, k === 'joker');
        overlay.classList.add('reveal');
        return Promise.resolve();
    }
  
    // Check for THREE and WebGL support
    if (!THREE || !isWebGLSupported()) {
        try { window.__lastAnimPath = 'fallback-no-webgl-or-three'; } catch { /* Ignore errors */ }
        // Fallback to simpler animation
        return rollFallback(opts);
    }

    return new Promise((resolve) => {
    // Initialize scene
        initScene();

        // Clear previous die if exists
        if (dieMesh) {
            scene.remove(dieMesh);
        }

        // Create new die mesh
        const dieShape = shape || mapNToShape(N);
        dieMesh = createDieMesh(dieShape);
        scene.add(dieMesh);

        // Add canvas to parent
        parent.innerHTML = '';
        parent.appendChild(renderer.domElement);

        // Start animation
        animateDie(rotationPaths[0], durationMs, () => {
            // Show overlay with result
            const overlay = createOverlay(parent, k, N, k === 'joker');

            // Add bounce animation if not reduced motion
            if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                setTimeout(() => {
                    overlay.classList.add('reveal');
                }, 10);
            } else {
                overlay.classList.add('reveal');
            }

            // Clean up renderer after a short delay
            setTimeout(() => {
                if (renderer) {
                    // Stop rendering
                }
                try { window.__lastAnimPath = '3d'; } catch { /* Ignore errors */ }
                resolve();
            }, 300);
        });
    });
}

// Fallback function for when WebGL is not available
export async function rollFallback(opts) {
    const { parent, N, k, durationMs = 1200 } = opts;
  
    return new Promise((resolve) => {
        // Clear parent
        parent.innerHTML = '';

        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Skip animation and just show overlay
            const overlay = createOverlay(parent, k, N, k === 'joker');
            overlay.style.opacity = '1';
            setTimeout(() => {
                resolve();
            }, 100); // Short delay to ensure DOM update
            return;
        }

        // Create overlay for displaying numbers
        const overlay = document.createElement('div');
        overlay.className = 'roll-overlay';
        overlay.style.opacity = '1'; // Start visible

        const content = document.createElement('div');
        content.style.textAlign = 'center';

        const result = document.createElement('div');
        result.style.fontSize = '34px';
        result.style.fontWeight = '800';
        result.style.lineHeight = '1';
        result.style.fontFamily = 'monospace';

        content.appendChild(result);
        overlay.appendChild(content);
        parent.appendChild(overlay);

        // Number flip animation
        let startTime = Date.now();
        let lastUpdateTime = 0;
        const updateInterval = 100; // Update every 100ms for smoothness

        function updateNumber() {
            const elapsed = Date.now() - startTime;

            if (elapsed < durationMs) {
                // Update number every updateInterval ms
                if (elapsed - lastUpdateTime >= updateInterval) {
                    const randomNum = Math.floor(Math.random() * N) + 1;
                    result.textContent = randomNum;
                    lastUpdateTime = elapsed;
                }
                requestAnimationFrame(updateNumber);
            } else {
                // Finalize with actual result
                if (k === 'joker') {
                    // Load and inline the joker SVG for final result
                    fetch('./assets/joker.svg')
                        .then(response => response.text())
                        .then(svgText => {
                            const svgContainer = document.createElement('div');
                            svgContainer.innerHTML = svgText;
                            const svgElement = svgContainer.querySelector('svg');
                            if (svgElement) {
                                svgElement.setAttribute('width', '48');
                                svgElement.setAttribute('height', '48');
                                svgElement.setAttribute('aria-label', 'Joker');
                                result.innerHTML = ''; // Clear previous content
                                result.appendChild(svgElement);
                            }
                        })
                        .catch(() => {
                            // Fallback to emoji if SVG fails to load
                            result.textContent = '🃏';
                        });
                } else {
                    result.textContent = k;
                }

                // Add badge
                const badge = document.createElement('div');
                badge.className = 'badge';
                badge.style.fontSize = '12px';
                badge.style.fontWeight = '600';
                badge.style.opacity = '0.85';
                badge.style.marginTop = '6px';
                badge.textContent = k === 'joker' ? 'dY?' : `d${N}`;
                content.appendChild(badge);
                
                try { window.__lastAnimPath = 'fallback'; } catch { /* Ignore errors */ }
                resolve();
            }
        }

        updateNumber();
    });
}

// Check for WebGL support
function isWebGLSupported() {
    try {
        const canvas = document.createElement('canvas');
        return !!(
            window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
        );
    } catch (e) {
        return false;
    }
}

export function coinFlip(opts) {
    const { parent, durationMs = 1000, onComplete } = opts;
    parent.innerHTML = `
        <div class="coin-container">
            <div class="coin">
                <div class="coin-face coin-front"></div>
                <div class="coin-face coin-back"></div>
            </div>
        </div>
    `;

    setTimeout(() => {
        if (onComplete) {
            onComplete();
        }
    }, durationMs);
}
