import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let initialAlpha = 0, initialBeta = 0, initialGamma = 0;
let isCalibrated = false;

function init() {
    // Szene erstellen
    scene = new THREE.Scene();

    // Kamera erstellen
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 0.1);

    // Renderer erstellen
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // 360° Bild laden
    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load('test.jpg', () => {
        console.log('Texture loaded successfully!');
    });

    // Kugel-Geometrie erstellen
    const geometry = new THREE.SphereGeometry(500, 128, 128);
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

        const yaw = THREE.MathUtils.degToRad((event.alpha || 0) - initialAlpha);
        const pitch = THREE.MathUtils.degToRad((event.beta || 0) - initialBeta);
        const roll = THREE.MathUtils.degToRad((event.gamma || 0) - initialGamma);

        // Pitch optimieren: Keine Begrenzung für Hoch-/Runterschauen
        camera.rotation.set(pitch, yaw, -roll);
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
                    enterFullscreen(); // Vollbildmodus aktivieren
                    init();
                    animate();
                    document.getElementById('startButton').style.display = 'none';
                } else {
                    alert('Permission denied for motion sensors.');
                }
            })
            .catch(console.error);
    } else {
        enterFullscreen(); // Vollbildmodus aktivieren
        init();
        animate();
        document.getElementById('startButton').style.display = 'none';
    }
});

function enterFullscreen() {
    const element = document.documentElement; // Vollbildmodus für das gesamte Dokument

    if (element.requestFullscreen) {
        element.requestFullscreen();
    } else if (element.webkitRequestFullscreen) { // Safari
        element.webkitRequestFullscreen();
    } else if (element.msRequestFullscreen) { // Ältere Browser
        element.msRequestFullscreen();
    } else {
        alert('Fullscreen not supported on this device/browser.');
    }
}
