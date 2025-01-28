import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let initialAlpha = 0, initialBeta = 0, initialGamma = 0;
let isCalibrated = false;

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

    const geometry = new THREE.SphereGeometry(500, 128, 128); // Hochauflösende Kugel
    geometry.scale(-1, 1, 1);

    const material = new THREE.MeshBasicMaterial({ map: texture });
    const sphere = new THREE.Mesh(geometry, material);
    scene.add(sphere);

    // Bewegungssensor-Daten verwenden
    window.addEventListener('deviceorientation', (event) => {
        if (!isCalibrated) {
            initialAlpha = event.alpha || 0;
            initialBeta = event.beta || 0;
            initialGamma = event.gamma || 0;
            isCalibrated = true;
        }

        const yaw = THREE.MathUtils.degToRad((event.alpha || 0) - initialAlpha); // Links/Rechts drehen
        const pitch = THREE.MathUtils.degToRad((event.beta || 0) - initialBeta); // Hoch/Runter schauen
        const roll = THREE.MathUtils.degToRad((event.gamma || 0) - initialGamma); // Seitliches Neigen

        // Setzen der Kamerarotation für alle Achsen
        camera.rotation.set(
            Math.max(Math.min(pitch, Math.PI / 2), -Math.PI / 2), // Pitch (begrenzen für Stabilität)
            yaw, // Yaw
            -roll // Roll
        );
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

document.getElementById('startButton').addEventListener('click', () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then((permissionState) => {
                if (permissionState === 'granted') {
                    enterFullscreen();
                    init();
                    animate();
                    document.getElementById('startButton').style.display = 'none';
                } else {
                    alert('Permission denied for motion sensors.');
                }
            })
            .catch(console.error);
    } else {
        enterFullscreen();
        init();
        animate();
        document.getElementById('startButton').style.display = 'none';
    }
});

function enterFullscreen() {
    const element = document.documentElement;

    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen(); // Safari auf iOS
    } else if (element.msRequestFullscreen) {
        element.msRequestFullscreen();
    } else {
        alert('Fullscreen not supported on this device/browser.');
    }
}
