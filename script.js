import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.154.0/build/three.module.js';

let scene, camera, renderer;
let initialAlpha = 0, initialBeta = 0, initialGamma = 0;
let isCalibrated = false;

let smoothYaw = 0, smoothPitch = 0, smoothRoll = 0;
let accumulatedYaw = 0; // Akkumulierter Yaw-Wert
let lastYaw = 0; // Letzter gemessener Yaw-Wert

// Funktion zur Glättung der Bewegung
function applySmoothing(current, target, smoothingFactor = 0.1, maxDelta = Math.PI / 8) {
    if (Math.abs(target - current) > maxDelta) return current; // Ignoriere zu große Änderungen
    return current + (target - current) * smoothingFactor;
}

// Robuste Delta-Berechnung für Yaw
function robustDelta(currentYaw, lastYaw) {
    let delta = currentYaw - lastYaw;

    // Überprüfen auf 360°-Sprünge und korrigieren
    if (delta > Math.PI) {
        delta -= 2 * Math.PI;
    } else if (delta < -Math.PI) {
        delta += 2 * Math.PI;
    }

    return delta;
}

// Funktion zur Akkumulation von Yaw
function accumulateYaw(currentYaw) {
    const delta = robustDelta(currentYaw, lastYaw);

    // Aktualisiere den akkumulierten Yaw-Wert
    accumulatedYaw += delta;

    // Speichere den aktuellen Yaw-Wert
    lastYaw = currentYaw;

    // Rückgabe des akkumulierten Yaw-Werts
    return accumulatedYaw;
}

// Debugging-Funktion zur Ausgabe von Werten
function debugYawValues(currentYaw, delta, accumulatedYaw) {
    console.log(`Current Yaw: ${currentYaw}`);
    console.log(`Delta Yaw: ${delta}`);
    console.log(`Accumulated Yaw: ${accumulatedYaw}`);
}

// Initialisierung der Szene
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

    // Event-Listener für Bewegungssensoren
    window.addEventListener('deviceorientation', (event) => {
        if (!isCalibrated) {
            initialAlpha = event.alpha || 0;
            initialBeta = event.beta || 0;
            initialGamma = event.gamma || 0;
            isCalibrated = true;
            lastYaw = THREE.MathUtils.degToRad(event.alpha || 0) - initialAlpha; // Initialisiere Yaw
        }

        // Berechnung des aktuellen Yaw-Werts
        const currentYaw = THREE.MathUtils.degToRad((event.alpha || 0) - initialAlpha);

        // Akkumuliere den Yaw-Wert
        const continuousYaw = accumulateYaw(currentYaw);

        // Debugging: Überprüfe die Werte
        const delta = robustDelta(currentYaw, lastYaw);
        debugYawValues(currentYaw, delta, continuousYaw);

        // Berechnung von Pitch und Roll
        const rawPitch = THREE.MathUtils.degToRad((event.beta || 0) - initialBeta);
        const rawRoll = THREE.MathUtils.degToRad((event.gamma || 0) - initialGamma);

        // Begrenze Pitch (Hoch-/Runterschauen)
        const clampedPitch = Math.max(Math.min(rawPitch, Math.PI / 2 - 0.1), -Math.PI / 2 + 0.1);

        // Glättung anwenden
        smoothYaw = applySmoothing(smoothYaw, continuousYaw);
        smoothPitch = applySmoothing(smoothPitch, clampedPitch);
        smoothRoll = applySmoothing(smoothRoll, rawRoll);

        // Setze die Kamerarotation
        camera.rotation.set(smoothPitch, smoothYaw, -smoothRoll);
    });
}

// Animation der Szene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}

// Anpassung der Szene bei Fenstergrößenänderung
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Event-Listener für den Start-Button
document.getElementById('startButton').addEventListener('click', () => {
    if (typeof DeviceMotionEvent.requestPermission === 'function') {
        DeviceMotionEvent.requestPermission()
            .then((permissionState) => {
                if (permissionState === 'granted') {
                    init();
                    animate();
                    document.getElementById('startButton').style.display = 'none';
                } else {
                    alert('Permission denied for motion sensors.');
                }
            })
            .catch(console.error);
    } else {
        init();
        animate();
        document.getElementById('startButton').style.display = 'none';
    }
});
