import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let initialAlpha = 0, initialBeta = 0, initialGamma = 0;
let isCalibrated = false;

let smoothYaw = 0, smoothPitch = 0, smoothRoll = 0;

function applySmoothing(current, target, smoothingFactor = 0.1) {
    return current + (target - current) * smoothingFactor;
}

function init() {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('test.jpg', () => {
        console.log('Texture loaded successfully!');
    });

    const geometry = new THREE.SphereGeometry(500, 128, 128);
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    window.addEventListener('deviceorientation', (event) => {
        if (!isCalibrated) {
            initialAlpha = event.alpha || 0;
            initialBeta = event.beta || 0;
            initialGamma = event.gamma || 0;
            isCalibrated = true;
        }

        // Smoothe Zielwerte berechnen
        smoothYaw = applySmoothing(smoothYaw, THREE.MathUtils.degToRad((event.alpha || 0) - initialAlpha));
        smoothPitch = applySmoothing(smoothPitch, THREE.MathUtils.degToRad((event.beta || 0) - initialBeta));
        smoothRoll = applySmoothing(smoothRoll, THREE.MathUtils.degToRad((event.gamma || 0) - initialGamma));

        // Begrenze Pitch-Werte (Hoch-/Runterschauen) auf ±90° und setze die Rotation
        camera.rotation.set(
            Math.max(Math.min(smoothPitch, Math.PI / 2), -Math.PI / 2), // Begrenzter Pitch
            smoothYaw, // Smoothed Yaw
            -smoothRoll // Smoothed Roll
        );
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

function showIOSFullscreenHint() {
    const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    if (isIOS) {
        alert('For the best experience, please add this page to your home screen: Tap the share button in Safari and select "Add to Home Screen".');
    }
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('startButton').addEventListener('click', () => {
    showIOSFullscreenHint(); // Hinweis für iOS
    init();
    animate();
    document.getElementById('startButton').style.display = 'none';
});
